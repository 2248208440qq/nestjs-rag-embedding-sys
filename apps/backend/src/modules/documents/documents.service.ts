import { stat } from 'node:fs/promises';

import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import type {
  DocumentUploadResponse,
  KnowledgeDocument,
} from '@repo/shared-types';

import { PrismaService } from '../../prisma/prisma.service';
import { FilesService } from '../files/files.service';
import { IndexJobsService } from '../index-jobs/index-jobs.service';
import { toKnowledgeDocument } from './document.mapper';
import { CreateDocumentDto } from './dto/create-document.dto';

@Injectable()
export class DocumentsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly files: FilesService,
    private readonly indexJobs: IndexJobsService,
  ) {}

  async upload(
    file: Express.Multer.File,
    dto: CreateDocumentDto,
  ): Promise<DocumentUploadResponse> {
    const stored = await this.files.persist(file);
    const document = await this.prisma.knowledgeDocument.create({
      data: {
        title: dto.title || stored.file.originalName,
        sourceType: dto.sourceType || 'other',
        originalFileName: stored.file.originalName,
        mimeType: stored.file.mimeType,
        size: stored.file.size,
        storagePath: stored.file.storagePath,
        authority: dto.authority,
        jurisdiction: dto.jurisdiction,
        publishDate: dto.publishDate ? new Date(dto.publishDate) : undefined,
        effectiveDate: dto.effectiveDate ? new Date(dto.effectiveDate) : undefined,
        version: dto.version,
        tags: dto.tags || [],
      },
    });

    return { document: toKnowledgeDocument(document) };
  }

  async findAll(): Promise<KnowledgeDocument[]> {
    const documents = await this.prisma.knowledgeDocument.findMany({
      orderBy: { createdAt: 'desc' },
    });
    return documents.map(toKnowledgeDocument);
  }

  async findOne(id: string): Promise<KnowledgeDocument> {
    return toKnowledgeDocument(await this.getDocumentOrThrow(id));
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

  async extract(id: string) {
    return this.indexJobs.enqueueDocumentJob(id, 'parse_document');
  }

  async index(id: string) {
    return this.indexJobs.enqueueDocumentJob(id, 'rebuild_document_index');
  }

  async remove(id: string) {
    return this.indexJobs.enqueueDocumentJob(id, 'delete_document_index');
  }

  private async getDocumentOrThrow(id: string) {
    const document = await this.prisma.knowledgeDocument.findUnique({ where: { id } });
    if (!document) throw new NotFoundException(`Document ${id} not found`);
    return document;
  }
}
