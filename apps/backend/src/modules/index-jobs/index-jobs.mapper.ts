import type { IndexJob } from '@repo/shared-types';

type IndexJobEntity = {
  id: string;
  documentId: string | null;
  parentJobId: string | null;
  attemptOfJobId: string | null;
  queueJobId: string | null;
  cancelRequestedAt: Date | null;
  document?: { title: string } | null;
  type: IndexJob['type'];
  status: IndexJob['status'];
  progress: number;
  currentStep: string | null;
  errorMessage: string | null;
  retryCount: number;
  result: unknown;
  startedAt: Date | null;
  finishedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
};

export function toIndexJob(job: IndexJobEntity): IndexJob {
  return {
    id: job.id,
    documentId: job.documentId ?? undefined,
    parentJobId: job.parentJobId ?? undefined,
    attemptOfJobId: job.attemptOfJobId ?? undefined,
    queueJobId: job.queueJobId ?? undefined,
    cancelRequestedAt: job.cancelRequestedAt?.toISOString(),
    documentTitle: job.document?.title,
    type: job.type,
    status: job.status,
    progress: job.progress,
    currentStep: job.currentStep ?? undefined,
    errorMessage: job.errorMessage ?? undefined,
    retryCount: job.retryCount,
    result:
      job.result && typeof job.result === 'object' && !Array.isArray(job.result)
        ? (job.result as Record<string, unknown>)
        : undefined,
    startedAt: job.startedAt?.toISOString(),
    finishedAt: job.finishedAt?.toISOString(),
    createdAt: job.createdAt.toISOString(),
    updatedAt: job.updatedAt.toISOString(),
  };
}
