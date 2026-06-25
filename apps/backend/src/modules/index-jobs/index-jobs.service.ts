import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import type {
  CreateIndexJobResponse,
  IndexJob,
  IndexJobListResponse,
  IndexJobStatus,
  IndexJobType,
} from '@repo/shared-types';
import { Prisma } from '@prisma/client';

import { PrismaService } from '../../prisma/prisma.service';
import { toIndexJob } from './index-jobs.mapper';

interface CreateJobInput {
  documentId?: string;
  type: IndexJobType;
  currentStep?: string;
}

interface ListJobsInput {
  documentId?: string;
  page?: number;
  pageSize?: number;
  status?: IndexJobStatus;
  type?: IndexJobType;
}

@Injectable()
export class IndexJobsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(input: CreateJobInput): Promise<IndexJob> {
    const job = await this.prisma.indexJob.create({
      data: {
        documentId: input.documentId,
        type: input.type,
        currentStep: input.currentStep ?? '等待执行',
      },
      include: {
        document: {
          select: { title: true },
        },
      },
    });

    return toIndexJob(job);
  }

  async createRebuildDocumentJob(documentId: string): Promise<CreateIndexJobResponse> {
    await this.ensureDocumentExists(documentId);
    return {
      job: await this.create({
        documentId,
        type: 'rebuild_document_index',
        currentStep: '等待重建索引',
      }),
    };
  }

  async createRebuildAllJob(): Promise<CreateIndexJobResponse> {
    return {
      job: await this.create({
        type: 'rebuild_all_indexes',
        currentStep: '等待全量重建索引',
      }),
    };
  }

  async list(input: ListJobsInput): Promise<IndexJobListResponse> {
    const page = Math.max(input.page ?? 1, 1);
    const pageSize = Math.min(Math.max(input.pageSize ?? 20, 1), 100);
    const where: Prisma.IndexJobWhereInput = {
      ...(input.documentId ? { documentId: input.documentId } : {}),
      ...(input.status ? { status: input.status } : {}),
      ...(input.type ? { type: input.type } : {}),
    };

    const [items, total] = await this.prisma.$transaction([
      this.prisma.indexJob.findMany({
        where,
        include: {
          document: {
            select: { title: true },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      this.prisma.indexJob.count({ where }),
    ]);

    return {
      items: items.map(toIndexJob),
      total,
    };
  }

  async findOne(id: string): Promise<IndexJob> {
    const job = await this.prisma.indexJob.findUnique({
      where: { id },
      include: {
        document: {
          select: { title: true },
        },
      },
    });

    if (!job) {
      throw new NotFoundException(`Index job ${id} not found`);
    }

    return toIndexJob(job);
  }

  async markRunning(id: string, currentStep: string, progress = 5) {
    return this.updateJob(id, {
      currentStep,
      progress,
      startedAt: new Date(),
      status: 'running',
    });
  }

  async markProgress(id: string, currentStep: string, progress: number) {
    return this.updateJob(id, {
      currentStep,
      progress,
      status: 'running',
    });
  }

  async markSucceeded(id: string, result?: Record<string, unknown>) {
    return this.updateJob(id, {
      currentStep: '已完成',
      errorMessage: null,
      finishedAt: new Date(),
      progress: 100,
      result: (result ?? {}) as Prisma.InputJsonValue,
      status: 'succeeded',
    });
  }

  async markFailed(id: string, error: unknown) {
    return this.updateJob(id, {
      currentStep: '执行失败',
      errorMessage: error instanceof Error ? error.message : String(error),
      finishedAt: new Date(),
      status: 'failed',
    });
  }

  async cancel(id: string): Promise<IndexJob> {
    const job = await this.findOne(id);
    if (job.status === 'succeeded' || job.status === 'failed') {
      throw new BadRequestException('Completed jobs cannot be canceled');
    }

    return this.updateJob(id, {
      currentStep: '已取消',
      finishedAt: new Date(),
      status: 'canceled',
    });
  }

  async retry(id: string): Promise<CreateIndexJobResponse> {
    const job = await this.findOne(id);
    if (job.status !== 'failed') {
      throw new BadRequestException('Only failed jobs can be retried');
    }

    const created = await this.prisma.indexJob.create({
      data: {
        documentId: job.documentId,
        type: job.type,
        currentStep: '等待重试',
        retryCount: job.retryCount + 1,
      },
      include: {
        document: {
          select: { title: true },
        },
      },
    });

    return { job: toIndexJob(created) };
  }

  private async updateJob(id: string, data: Prisma.IndexJobUpdateInput) {
    const job = await this.prisma.indexJob.update({
      where: { id },
      data,
      include: {
        document: {
          select: { title: true },
        },
      },
    });

    return toIndexJob(job);
  }

  private async ensureDocumentExists(documentId: string) {
    const count = await this.prisma.knowledgeDocument.count({
      where: { id: documentId },
    });

    if (count === 0) {
      throw new NotFoundException(`Document ${documentId} not found`);
    }
  }
}
