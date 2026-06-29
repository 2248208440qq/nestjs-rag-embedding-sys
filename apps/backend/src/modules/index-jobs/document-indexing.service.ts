import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';

import { AppConfigService } from '../../config/app-config.service';
import { PrismaService } from '../../prisma/prisma.service';
import { LegalChunkingService } from '../chunking/legal-chunking.service';
import { EmbeddingClientService } from '../embeddings/embedding-client.service';
import { TextExtractorService } from '../extractors/text-extractor.service';
import { FilesService } from '../files/files.service';
import { IndexJobsService } from './index-jobs.service';

type ExecutableIndexJob = Awaited<ReturnType<IndexJobsService['getExecutionJob']>>;

@Injectable()
export class DocumentIndexingService {
  constructor(
    private readonly config: AppConfigService,
    private readonly prisma: PrismaService,
    private readonly chunking: LegalChunkingService,
    private readonly embeddings: EmbeddingClientService,
    private readonly extractor: TextExtractorService,
    private readonly files: FilesService,
    private readonly jobs: IndexJobsService,
  ) {}

  async execute(job: ExecutableIndexJob) {
    if (job.type === 'rebuild_all_indexes') {
      await this.rebuildAll(job.id);
      return;
    }

    await this.executeDocumentJob(job.id);
  }

  private async executeDocumentJob(indexJobId: string) {
    const job = await this.jobs.getExecutionJob(indexJobId);
    if (!job.documentId || !job.document) {
      throw new Error('Document task is missing its document');
    }

    if (job.type === 'parse_document') {
      await this.parseDocument(indexJobId, job.document);
      return;
    }
    if (job.type === 'rebuild_document_index') {
      await this.indexDocument(indexJobId, job.document);
      return;
    }
    if (job.type === 'delete_document_index') {
      await this.deleteDocument(indexJobId, job.document);
      return;
    }
    throw new Error(`No worker is registered for task type ${job.type}`);
  }

  private async parseDocument(
    indexJobId: string,
    document: {
      id: string;
      metadata: Prisma.JsonValue;
      mimeType: string | null;
      storagePath: string | null;
    },
  ) {
    if (!document.storagePath) throw new Error('Document has no uploaded file');

    await this.jobs.markRunning(indexJobId, '正在解析原始文件', 15);
    await this.prisma.knowledgeDocument.update({
      where: { id: document.id },
      data: { status: 'parsing' },
    });

    const text = await this.extractor.extract(
      document.storagePath,
      document.mimeType ?? undefined,
    );

    await this.jobs.markProgress(indexJobId, '正在保存解析结果', 80);
    await this.prisma.knowledgeDocument.update({
      where: { id: document.id },
      data: {
        metadata: this.mergeMetadata(document.metadata, {
          extractedAt: new Date().toISOString(),
          extractedText: text,
          extractedTextLength: text.length,
        }),
        status: 'parsed',
      },
    });
    await this.jobs.markSucceeded(indexJobId, {
      documentId: document.id,
      extractedTextLength: text.length,
    });
  }

  private async indexDocument(
    indexJobId: string,
    document: {
      id: string;
      metadata: Prisma.JsonValue;
      mimeType: string | null;
      storagePath: string | null;
    },
  ) {
    const metadata = this.asRecord(document.metadata);
    const extractedText =
      typeof metadata.extractedText === 'string'
        ? metadata.extractedText
        : document.storagePath
          ? await this.extractor.extract(
              document.storagePath,
              document.mimeType ?? undefined,
            )
          : '';
    if (!extractedText) throw new Error('Document has no extracted text');

    await this.jobs.markRunning(indexJobId, '正在进行法律文本分块', 15);
    await this.prisma.knowledgeDocument.update({
      where: { id: document.id },
      data: { status: 'indexing' },
    });

    const chunks = this.chunking.chunk(extractedText);
    if (!chunks.length) throw new Error('Document produced no chunks');

    await this.jobs.markProgress(indexJobId, '正在清理旧索引', 30);
    await this.prisma.knowledgeDocumentChunk.deleteMany({
      where: { documentId: document.id },
    });

    await this.jobs.markProgress(indexJobId, '正在生成向量', 50);
    const vectors = await this.embedInBatches(
      chunks.map((chunk) => chunk.content),
    );

    await this.jobs.markProgress(indexJobId, '正在写入索引数据', 80);
    for (const [index, chunk] of chunks.entries()) {
      await this.jobs.markProgress(
        indexJobId,
        '正在写入索引数据',
        Math.min(95, 80 + Math.round(((index + 1) / chunks.length) * 15)),
      );
      const vector = vectors[index];
      if (!vector) continue;

      await this.prisma.$executeRaw`
        INSERT INTO knowledge_document_chunks (
          id, document_id, content, section_path, article_no, chunk_index, embedding, metadata
        ) VALUES (
          gen_random_uuid(), ${document.id}::uuid, ${chunk.content}, ${chunk.sectionPath ?? null},
          ${chunk.articleNo ?? null}, ${chunk.chunkIndex}, ${this.toVectorLiteral(vector)}::vector,
          ${JSON.stringify(chunk.metadata)}::jsonb
        )
      `;
    }

    await this.prisma.knowledgeDocument.update({
      where: { id: document.id },
      data: {
        metadata: this.mergeMetadata(document.metadata, {
          chunkCount: chunks.length,
          extractedText,
          extractedTextLength: extractedText.length,
          indexedAt: new Date().toISOString(),
        }),
        status: 'indexed',
      },
    });
    await this.jobs.markSucceeded(indexJobId, {
      chunkCount: chunks.length,
      documentId: document.id,
      embeddedCount: vectors.length,
    });
  }

  private async deleteDocument(
    indexJobId: string,
    document: { id: string; storagePath: string | null },
  ) {
    await this.jobs.markRunning(indexJobId, '正在删除文档和索引数据', 25);
    const deletedChunks = await this.prisma.knowledgeDocumentChunk.count({
      where: { documentId: document.id },
    });
    await this.prisma.knowledgeDocument.delete({ where: { id: document.id } });
    await this.jobs.markProgress(indexJobId, '正在删除上传文件', 80);
    const deletedFile = await this.files.remove(document.storagePath);
    await this.jobs.markSucceeded(indexJobId, {
      deletedChunks,
      deletedFile,
      documentId: document.id,
    });
  }

  private async rebuildAll(parentJobId: string) {
    await this.jobs.markRunning(parentJobId, '正在获取待重建文档', 5);
    const documents = await this.prisma.knowledgeDocument.findMany({
      orderBy: { createdAt: 'asc' },
      select: { id: true },
    });

    if (!documents.length) {
      await this.jobs.markSucceeded(parentJobId, { documentCount: 0 });
      return;
    }

    for (const [index, document] of documents.entries()) {
      const child = await this.jobs.createChildJob(document.id, parentJobId);
      await this.executeDocumentJob(child.id);
      await this.jobs.markProgress(
        parentJobId,
        '正在重建文档索引',
        Math.min(95, Math.round(((index + 1) / documents.length) * 95)),
      );
    }

    await this.jobs.markSucceeded(parentJobId, {
      documentCount: documents.length,
    });
  }

  private async embedInBatches(texts: string[]) {
    const vectors: number[][] = [];
    for (
      let index = 0;
      index < texts.length;
      index += this.config.embeddingBatchSize
    ) {
      vectors.push(
        ...(await this.embeddings.embed(
          texts.slice(index, index + this.config.embeddingBatchSize),
        )),
      );
    }
    return vectors;
  }

  private mergeMetadata(
    metadata: Prisma.JsonValue,
    patch: Record<string, unknown>,
  ): Prisma.InputJsonValue {
    return {
      ...this.asRecord(metadata),
      ...patch,
    } as Prisma.InputJsonObject;
  }

  private asRecord(metadata: Prisma.JsonValue): Record<string, unknown> {
    return metadata && typeof metadata === 'object' && !Array.isArray(metadata)
      ? (metadata as Record<string, unknown>)
      : {};
  }

  private toVectorLiteral(vector: number[]) {
    return `[${vector.join(',')}]`;
  }
}
