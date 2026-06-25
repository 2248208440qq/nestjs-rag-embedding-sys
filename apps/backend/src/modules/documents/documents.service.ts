import { rm, stat } from 'node:fs/promises';

import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  DocumentDeleteResponse,
  DocumentExtractionResponse,
  DocumentIndexResponse,
  DocumentUploadResponse,
  KnowledgeDocument,
} from '@repo/shared-types';
import { Prisma } from '@prisma/client';

import { LegalChunkingService } from '../chunking/legal-chunking.service';
import { EmbeddingClientService } from '../embeddings/embedding-client.service';
import { decodeUploadFileName, inferTitleFromFileName } from '../files/file-name.util';
import { IndexJobsService } from '../index-jobs/index-jobs.service';
import { PrismaService } from '../../prisma/prisma.service';
import { TextExtractorService } from '../extractors/text-extractor.service';
import { toKnowledgeDocument } from './document.mapper';
import { CreateDocumentDto } from './dto/create-document.dto';

@Injectable()
export class DocumentsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly extractor: TextExtractorService,
    private readonly chunking: LegalChunkingService,
    private readonly embeddings: EmbeddingClientService,
    private readonly indexJobs: IndexJobsService,
    private readonly config: ConfigService,
  ) {}

  async upload(
    file: Express.Multer.File,
    dto: CreateDocumentDto,
  ): Promise<DocumentUploadResponse> {
    const originalName = decodeUploadFileName(file.originalname);
    const document = await this.prisma.knowledgeDocument.create({
      data: {
        title: dto.title || inferTitleFromFileName(originalName),
        sourceType: dto.sourceType || 'other',
        originalFileName: originalName,
        mimeType: file.mimetype,
        size: file.size,
        storagePath: file.path,
        authority: dto.authority,
        jurisdiction: dto.jurisdiction,
        publishDate: dto.publishDate ? new Date(dto.publishDate) : undefined,
        effectiveDate: dto.effectiveDate ? new Date(dto.effectiveDate) : undefined,
        version: dto.version,
        tags: dto.tags || [],
      },
    });

    return {
      document: toKnowledgeDocument(document),
    };
  }

  async findAll(): Promise<KnowledgeDocument[]> {
    const documents = await this.prisma.knowledgeDocument.findMany({
      orderBy: {
        createdAt: 'desc',
      },
    });

    return documents.map(toKnowledgeDocument);
  }

  async findOne(id: string): Promise<KnowledgeDocument> {
    const document = await this.prisma.knowledgeDocument.findUnique({
      where: { id },
    });

    if (!document) {
      throw new NotFoundException(`Document ${id} not found`);
    }

    return toKnowledgeDocument(document);
  }

  async getFile(id: string) {
    const document = await this.getDocumentOrThrow(id);

    if (!document.storagePath) {
      throw new BadRequestException('Document has no uploaded file');
    }

    try {
      const fileStat = await stat(document.storagePath);

      return {
        mimeType: document.mimeType ?? 'application/octet-stream',
        originalFileName: document.originalFileName ?? `${document.title}.file`,
        size: fileStat.size,
        storagePath: document.storagePath,
      };
    } catch {
      throw new NotFoundException(`Document file ${id} not found`);
    }
  }

  async extract(id: string): Promise<DocumentExtractionResponse> {
    const job = await this.indexJobs.create({
      documentId: id,
      type: 'parse_document',
      currentStep: '准备解析文档',
    });

    const document = await this.getDocumentOrThrow(id);
    if (!document.storagePath) {
      await this.indexJobs.markFailed(job.id, new BadRequestException('Document has no uploaded file'));
      throw new BadRequestException('Document has no uploaded file');
    }

    try {
      await this.indexJobs.markRunning(job.id, '解析原始文件', 20);

      await this.prisma.knowledgeDocument.update({
        where: { id },
        data: { status: 'parsing' },
      });

      const text = await this.extractor.extract(document.storagePath, document.mimeType ?? undefined);

      await this.indexJobs.markProgress(job.id, '保存解析结果', 80);

      await this.prisma.knowledgeDocument.update({
        where: { id },
        data: {
          status: 'parsed',
          metadata: this.mergeMetadata(document.metadata, {
            extractedText: text,
            extractedTextLength: text.length,
            extractedAt: new Date().toISOString(),
          }),
        },
      });

      await this.indexJobs.markSucceeded(job.id, {
        documentId: id,
        extractedTextLength: text.length,
      });

      return {
        documentId: id,
        extractedTextLength: text.length,
        jobId: job.id,
      };
    } catch (error) {
      await this.prisma.knowledgeDocument.update({
        where: { id },
        data: { status: 'failed' },
      });
      await this.indexJobs.markFailed(job.id, error);
      throw error;
    }
  }

  async index(id: string): Promise<DocumentIndexResponse> {
    const job = await this.indexJobs.create({
      documentId: id,
      type: 'rebuild_document_index',
      currentStep: '准备构建索引',
    });

    const document = await this.getDocumentOrThrow(id);
    const metadata = this.asRecord(document.metadata);
    const extractedText =
      typeof metadata.extractedText === 'string'
        ? metadata.extractedText
        : document.storagePath
          ? await this.extractor.extract(document.storagePath, document.mimeType ?? undefined)
          : '';

    if (!extractedText) {
      await this.indexJobs.markFailed(job.id, new BadRequestException('Document has no extracted text'));
      throw new BadRequestException('Document has no extracted text');
    }

    try {
      await this.indexJobs.markRunning(job.id, '法律文本分块', 15);
      await this.prisma.knowledgeDocument.update({
        where: { id },
        data: { status: 'indexing' },
      });

      const chunks = this.chunking.chunk(extractedText);
      if (chunks.length === 0) {
        throw new BadRequestException('Document produced no chunks');
      }

      await this.indexJobs.markProgress(job.id, '清理旧索引', 30);

      await this.prisma.knowledgeDocumentChunk.deleteMany({
        where: {
          documentId: id,
        },
      });

      await this.indexJobs.markProgress(job.id, '生成向量', 50);

      const vectors = await this.embedInBatches(chunks.map((chunk) => chunk.content));

      await this.indexJobs.markProgress(job.id, '写入索引数据', 80);

      for (const [index, chunk] of chunks.entries()) {
        const vector = vectors[index];
        if (!vector) {
          continue;
        }

        await this.prisma.$executeRaw`
          INSERT INTO knowledge_document_chunks (
            document_id,
            content,
            section_path,
            article_no,
            chunk_index,
            embedding,
            metadata
          )
          VALUES (
            ${id}::uuid,
            ${chunk.content},
            ${chunk.sectionPath ?? null},
            ${chunk.articleNo ?? null},
            ${chunk.chunkIndex},
            ${this.toVectorLiteral(vector)}::vector,
            ${JSON.stringify(chunk.metadata)}::jsonb
          )
        `;
      }

      await this.prisma.knowledgeDocument.update({
        where: { id },
        data: {
          status: 'indexed',
          metadata: this.mergeMetadata(document.metadata, {
            extractedText,
            extractedTextLength: extractedText.length,
            chunkCount: chunks.length,
            indexedAt: new Date().toISOString(),
          }),
        },
      });

      await this.indexJobs.markSucceeded(job.id, {
        documentId: id,
        chunkCount: chunks.length,
        embeddedCount: vectors.length,
      });

      return {
        documentId: id,
        chunkCount: chunks.length,
        embeddedCount: vectors.length,
        jobId: job.id,
      };
    } catch (error) {
      await this.prisma.knowledgeDocument.update({
        where: { id },
        data: { status: 'failed' },
      });
      await this.indexJobs.markFailed(job.id, error);
      throw error;
    }
  }

  async remove(id: string): Promise<DocumentDeleteResponse> {
    const job = await this.indexJobs.create({
      documentId: id,
      type: 'delete_document_index',
      currentStep: '准备删除文档索引',
    });
    const document = await this.getDocumentOrThrow(id);
    const deletedChunks = await this.prisma.knowledgeDocumentChunk.count({
      where: {
        documentId: id,
      },
    });

    try {
      await this.indexJobs.markRunning(job.id, '删除文档和索引数据', 40);

      await this.prisma.knowledgeDocument.delete({
        where: { id },
      });

      await this.indexJobs.markProgress(job.id, '删除上传文件', 80);

      const deletedFile = await this.removeUploadedFile(document.storagePath);

      await this.indexJobs.markSucceeded(job.id, {
        documentId: id,
        deletedChunks,
        deletedFile,
      });

      return {
        documentId: id,
        deletedChunks,
        deletedFile,
        jobId: job.id,
        storagePath: document.storagePath ?? undefined,
      };
    } catch (error) {
      await this.indexJobs.markFailed(job.id, error);
      throw error;
    }
  }

  private async embedInBatches(texts: string[]) {
    const batchSize = this.config.getOrThrow<number>('EMBEDDING_BATCH_SIZE');
    const vectors: number[][] = [];

    for (let index = 0; index < texts.length; index += batchSize) {
      const batch = texts.slice(index, index + batchSize);
      vectors.push(...(await this.embeddings.embed(batch)));
    }

    return vectors;
  }

  private async getDocumentOrThrow(id: string) {
    const document = await this.prisma.knowledgeDocument.findUnique({
      where: { id },
    });

    if (!document) {
      throw new NotFoundException(`Document ${id} not found`);
    }

    return document;
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
    if (metadata && typeof metadata === 'object' && !Array.isArray(metadata)) {
      return metadata as Record<string, unknown>;
    }

    return {};
  }

  private toVectorLiteral(vector: number[]) {
    return `[${vector.join(',')}]`;
  }

  private async removeUploadedFile(storagePath: string | null) {
    if (!storagePath) {
      return false;
    }

    try {
      await rm(storagePath, { force: true });
      return true;
    } catch {
      return false;
    }
  }
}
