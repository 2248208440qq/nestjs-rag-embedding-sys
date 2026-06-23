import type { SearchRequest, SearchResponse } from './types';

import { ragRequest } from './http';

export function searchDocuments(data: SearchRequest) {
  return ragRequest<SearchResponse>('/search', {
    body: JSON.stringify(data),
    method: 'POST',
  });
}
