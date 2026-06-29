import {
  ConflictException,
  Injectable,
  NotFoundException,
  OnApplicationBootstrap,
} from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import type {
  CreateIndexJobResponse,
  IndexJob,
  IndexJobListResponse,
  IndexJobStatus,
  IndexJobType,
} from '@repo/shared-types';
import { Prisma } from '@prisma/client';
import type { Queue } from 'bullmq';

import { EXECUTABLE_INDEX_JOB_TYPES, INDEX_JOBS_QUEUE } from '@/common/constants';
import { PrismaService } from '@/prisma/prisma.service';
import type { IndexJobQueuePayload } from '@/modules/index-jobs/index-jobs.queue';
import { toIndexJob } from '@/modules/index-jobs/index-jobs.mapper';

interface CreateJobInput {
  attemptOfJobId?: string;
  documentId?: string;
  parentJobId?: string;
  type: IndexJobType;
}

interface ListJobsInput {
  documentId?: string;
  page?: number;
  pageSize?: number;
  parentJobId?: string;
  status?: IndexJobStatus;
  type?: IndexJobType;
}

@Injectable()
export class IndexJobsService implements OnApplicationBootstrap {
  constructor(
    private readonly prisma: PrismaService,
    @InjectQueue(INDEX_JOBS_QUEUE)
    private readonly queue: Queue<IndexJobQueuePayload>,
  ) {}

  async onApplicationBootstrap() {
    const recoverable = await this.prisma.indexJob.findMany({
      where: {
        status: { in: ['pending', 'running'] },
        type: { in: EXECUTABLE_INDEX_JOB_TYPES },
      },
      include: { document: { select: { title: true } } },
    });

    for (const job of recoverable) {
      if (job.status === 'running') {
        await this.prisma.indexJob.update({
          where: { id: job.id },
          data: { currentStep: '等待恢复执行', status: 'pending' },
        });
      }
      await this.enqueue(toIndexJob(job));
    }
  }

  async enqueueDocumentJob(
    documentId: string,
    type: Extract<IndexJobType, 'delete_document_index' | 'parse_document' | 'rebuild_document_index'>,
  ): Promise<CreateIndexJobResponse> {
    await this.ensureDocumentExists(documentId);
    const job = await this.createJob({ documentId, type });
    await this.enqueue(job);
    return { job };
  }

  async createRebuildAllJob(): Promise<CreateIndexJobResponse> {
    const job = await this.createJob({ type: 'rebuild_all_indexes' });
    await this.enqueue(job);
    return { job };
  }

  async list(input: ListJobsInput): Promise<IndexJobListResponse> {
    const page = Math.max(input.page ?? 1, 1);
    const pageSize = Math.min(Math.max(input.pageSize ?? 20, 1), 100);
    const where: Prisma.IndexJobWhereInput = {
      ...(input.documentId ? { documentId: input.documentId } : {}),
      ...(input.parentJobId ? { parentJobId: input.parentJobId } : {}),
      ...(input.status ? { status: input.status } : {}),
      ...(input.type ? { type: input.type } : {}),
    };
    const [items, total] = await this.prisma.$transaction([
      this.prisma.indexJob.findMany({
        where,
        include: { document: { select: { title: true } } },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      this.prisma.indexJob.count({ where }),
    ]);
    return { items: items.map(toIndexJob), total };
  }

  async findOne(id: string): Promise<IndexJob> {
    const job = await this.prisma.indexJob.findUnique({
      where: { id },
      include: { document: { select: { title: true } } },
    });
    if (!job) throw new NotFoundException(`Index job ${id} not found`);
    return toIndexJob(job);
  }

  async retry(id: string): Promise<CreateIndexJobResponse> {
    const previous = await this.findOne(id);
    if (previous.status !== 'failed') {
      throw new ConflictException('Only failed jobs can be retried');
    }
    if (!EXECUTABLE_INDEX_JOB_TYPES.includes(previous.type)) {
      throw new ConflictException(`Task type ${previous.type} is no longer executable`);
    }
    const job = await this.createJob({
      attemptOfJobId: previous.id,
      documentId: previous.documentId,
      parentJobId: previous.parentJobId,
      type: previous.type,
    }, previous.retryCount + 1);
    await this.enqueue(job);
    return { job };
  }

  async cancel(id: string): Promise<IndexJob> {
    const job = await this.findOne(id);
    if (['canceled', 'failed', 'succeeded'].includes(job.status)) {
      throw new ConflictException('Completed jobs cannot be canceled');
    }
    const canceled = await this.updateJob(id, {
      cancelRequestedAt: new Date(),
      currentStep: '已取消',
      finishedAt: new Date(),
      status: 'canceled',
    });
    const queueJob = await this.queue.getJob(job.queueJobId ?? job.id);
    await queueJob?.remove().catch(() => undefined);
    return canceled;
  }

  async getExecutionJob(id: string) {
    const job = await this.prisma.indexJob.findUnique({
      where: { id },
      include: { document: true },
    });
    if (!job) throw new NotFoundException(`Index job ${id} not found`);
    return job;
  }

  async createChildJob(documentId: string, parentJobId: string) {
    return this.createJob({ documentId, parentJobId, type: 'rebuild_document_index' });
  }

  async markRunning(id: string, currentStep: string, progress = 5) {
    return this.updateJob(id, { currentStep, progress, startedAt: new Date(), status: 'running' });
  }

  async markProgress(id: string, currentStep: string, progress: number) {
    await this.assertNotCanceled(id);
    return this.updateJob(id, { currentStep, progress, status: 'running' });
  }

  async markSucceeded(id: string, result: Record<string, unknown> = {}) {
    await this.assertNotCanceled(id);
    return this.updateJob(id, {
      currentStep: '已完成', errorMessage: null, finishedAt: new Date(), progress: 100,
      result: result as Prisma.InputJsonValue, status: 'succeeded',
    });
  }

  async markFailed(id: string, error: unknown) {
    return this.updateJob(id, {
      currentStep: '执行失败',
      errorMessage: error instanceof Error ? error.message : String(error),
      finishedAt: new Date(), status: 'failed',
    });
  }

  async markRetrying(id: string, error: unknown) {
    return this.updateJob(id, {
      currentStep: '等待自动重试',
      errorMessage: error instanceof Error ? error.message : String(error),
      status: 'pending',
    });
  }

  async isCanceled(id: string) {
    const job = await this.prisma.indexJob.findUnique({
      where: { id }, select: { cancelRequestedAt: true, status: true },
    });
    return job?.status === 'canceled' || Boolean(job?.cancelRequestedAt);
  }

  private async createJob(input: CreateJobInput, retryCount = 0): Promise<IndexJob> {
    try {
      const job = await this.prisma.indexJob.create({
        data: {
          attemptOfJobId: input.attemptOfJobId,
          documentId: input.documentId,
          parentJobId: input.parentJobId,
          retryCount,
          type: input.type,
          currentStep: '等待执行',
        },
        include: { document: { select: { title: true } } },
      });
      return toIndexJob(job);
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        throw new ConflictException('An active task of the same type already exists for this document');
      }
      throw error;
    }
  }

  private async enqueue(job: IndexJob) {
    const existing = await this.queue.getJob(job.queueJobId ?? job.id);
    if (!existing) {
      await this.queue.add(job.type, { indexJobId: job.id }, {
        attempts: 3,
        backoff: { type: 'fixed', delay: 2000 },
        jobId: job.id,
        removeOnComplete: 1000,
        removeOnFail: 1000,
      });
    }
    if (!job.queueJobId) {
      await this.prisma.indexJob.update({ where: { id: job.id }, data: { queueJobId: job.id } });
    }
  }

  private async updateJob(id: string, data: Prisma.IndexJobUpdateInput) {
    const job = await this.prisma.indexJob.update({
      where: { id }, data, include: { document: { select: { title: true } } },
    });
    return toIndexJob(job);
  }

  private async assertNotCanceled(id: string) {
    if (await this.isCanceled(id)) throw new IndexJobCanceledError();
  }

  private async ensureDocumentExists(documentId: string) {
    const exists = await this.prisma.knowledgeDocument.count({ where: { id: documentId } });
    if (!exists) throw new NotFoundException(`Document ${documentId} not found`);
  }
}

export class IndexJobCanceledError extends Error {}
