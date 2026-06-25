import type { SearchRequest, SearchResponse } from './types';

import { ragPost } from './http';

export function searchDocuments(data: SearchRequest) {
  return ragPost<SearchResponse>('/search', data);
}
