import type { IndexJobStatus, IndexJobType } from '@repo/shared-types';

export const INDEX_JOBS_QUEUE = 'index-jobs';

export const EXECUTABLE_INDEX_JOB_TYPES: IndexJobType[] = [
  'delete_document_index',
  'parse_document',
  'rebuild_all_indexes',
  'rebuild_document_index',
];

export const INDEX_JOB_STATUSES: IndexJobStatus[] = [
  'canceled',
  'failed',
  'pending',
  'running',
  'succeeded',
];

export const INDEX_JOB_TYPES: IndexJobType[] = [
  'delete_document_index',
  'parse_document',
  'rebuild_all_indexes',
  'rebuild_document_index',
];
