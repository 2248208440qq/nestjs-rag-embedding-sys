import { rm } from 'node:fs/promises';

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

  async extract(id: string): Promise<DocumentExtractionResponse> {
    const document = await this.getDocumentOrThrow(id);
    if (!document.storagePath) {
      throw new BadRequestException('Document has no uploaded file');
    }

    const text = await this.extractor.extract(document.storagePath, document.mimeType ?? undefined);

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

    return {
      documentId: id,
      extractedTextLength: text.length,
    };
  }

  async index(id: string): Promise<DocumentIndexResponse> {
    const document = await this.getDocumentOrThrow(id);
    const metadata = this.asRecord(document.metadata);
    const extractedText =
      typeof metadata.extractedText === 'string'
        ? metadata.extractedText
        : document.storagePath
          ? await this.extractor.extract(document.storagePath, document.mimeType ?? undefined)
          : '';

    if (!extractedText) {
      throw new BadRequestException('Document has no extracted text');
    }

    const chunks = this.chunking.chunk(extractedText);
    if (chunks.length === 0) {
      throw new BadRequestException('Document produced no chunks');
    }

    await this.prisma.knowledgeDocumentChunk.deleteMany({
      where: {
        documentId: id,
      },
    });

    const vectors = await this.embedInBatches(chunks.map((chunk) => chunk.content));

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

    return {
      documentId: id,
      chunkCount: chunks.length,
      embeddedCount: vectors.length,
    };
  }

  async remove(id: string): Promise<DocumentDeleteResponse> {
    const document = await this.getDocumentOrThrow(id);
    const deletedChunks = await this.prisma.knowledgeDocumentChunk.count({
      where: {
        documentId: id,
      },
    });

    await this.prisma.knowledgeDocument.delete({
      where: { id },
    });

    const deletedFile = await this.removeUploadedFile(document.storagePath);

    return {
      documentId: id,
      deletedChunks,
      deletedFile,
      storagePath: document.storagePath ?? undefined,
    };
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
