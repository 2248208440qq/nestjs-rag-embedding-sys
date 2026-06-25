import type {
  CreateIndexJobResponse,
  IndexJob,
  IndexJobListRequest,
  IndexJobListResponse,
} from './types';

import { ragGet, ragPost } from './http';

function toQuery(input?: IndexJobListRequest) {
  const params = new URLSearchParams();
  Object.entries(input ?? {}).forEach(([key, value]) => {
    if (value === undefined || value === '') return;
    params.set(key, String(value));
  });
  const query = params.toString();
  return query ? `?${query}` : '';
}

export function fetchIndexJobs(params?: IndexJobListRequest) {
  return ragGet<IndexJobListResponse>(`/index-jobs${toQuery(params)}`);
}

export function fetchIndexJob(id: string) {
  return ragGet<IndexJob>(`/index-jobs/${id}`);
}

export function retryIndexJob(id: string) {
  return ragPost<CreateIndexJobResponse>(`/index-jobs/${id}/retry`);
}

export function cancelIndexJob(id: string) {
  return ragPost<IndexJob>(`/index-jobs/${id}/cancel`);
}

export function rebuildDocumentIndex(documentId: string) {
  return ragPost<CreateIndexJobResponse>(`/index-jobs/documents/${documentId}/rebuild`);
}

export function rebuildAllIndexes() {
  return ragPost<CreateIndexJobResponse>('/index-jobs/rebuild-all');
}
