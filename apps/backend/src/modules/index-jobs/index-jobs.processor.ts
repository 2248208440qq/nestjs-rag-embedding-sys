import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Injectable } from '@nestjs/common';
import type { Job } from 'bullmq';

import { PrismaService } from '../../prisma/prisma.service';
import { DocumentIndexingService } from './document-indexing.service';
import { INDEX_JOBS_QUEUE, type IndexJobQueuePayload } from './index-jobs.queue';
import { IndexJobCanceledError, IndexJobsService } from './index-jobs.service';

@Injectable()
@Processor(INDEX_JOBS_QUEUE)
export class IndexJobsProcessor extends WorkerHost {
  constructor(
    private readonly prisma: PrismaService,
    private readonly indexing: DocumentIndexingService,
    private readonly jobs: IndexJobsService,
  ) {
    super();
  }

  async process(queueJob: Job<IndexJobQueuePayload>) {
    const job = await this.jobs.getExecutionJob(queueJob.data.indexJobId);
    if (await this.jobs.isCanceled(job.id)) return;

    try {
      await this.indexing.execute(job);
    } catch (error) {
      if (
        error instanceof IndexJobCanceledError ||
        (await this.jobs.isCanceled(job.id))
      ) {
        return;
      }

      const attempts = queueJob.opts.attempts ?? 1;
      if (queueJob.attemptsMade + 1 < attempts) {
        await this.jobs.markRetrying(job.id, error);
      } else {
        if (job.documentId) {
          await this.prisma.knowledgeDocument
            .update({
              where: { id: job.documentId },
              data: { status: 'failed' },
            })
            .catch(() => undefined);
        }
        await this.jobs.markFailed(job.id, error);
      }
      throw error;
    }
  }
}
