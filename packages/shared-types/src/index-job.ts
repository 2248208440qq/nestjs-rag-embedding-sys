export type IndexJobType =
  | 'delete_document_index'
  | 'parse_document'
  | 'rebuild_all_indexes'
  | 'rebuild_document_index';

export type IndexJobStatus =
  | 'canceled'
  | 'failed'
  | 'pending'
  | 'running'
  | 'succeeded';

export interface IndexJob {
  id: string;
  documentId?: string;
  documentTitle?: string;
  type: IndexJobType;
  status: IndexJobStatus;
  progress: number;
  currentStep?: string;
  errorMessage?: string;
  retryCount: number;
  parentJobId?: string;
  attemptOfJobId?: string;
  queueJobId?: string;
  cancelRequestedAt?: string;
  result?: Record<string, unknown>;
  startedAt?: string;
  finishedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface IndexJobListRequest {
  documentId?: string;
  parentJobId?: string;
  page?: number;
  pageSize?: number;
  status?: IndexJobStatus;
  type?: IndexJobType;
}

export interface IndexJobListResponse {
  items: IndexJob[];
  total: number;
}

export interface CreateIndexJobResponse {
  job: IndexJob;
}
