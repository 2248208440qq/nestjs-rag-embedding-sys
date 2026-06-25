import type {
  BindKnowledgeBaseDocumentsRequest,
  CreateKnowledgeBaseRequest,
  KnowledgeBase,
  UpdateKnowledgeBaseRequest,
} from '@repo/shared-types';

import { ragDelete, ragGet, ragPatch, ragPost } from './http';

export function fetchKnowledgeBases() {
  return ragGet<KnowledgeBase[]>('/knowledge-bases');
}

export function createKnowledgeBase(data: CreateKnowledgeBaseRequest) {
  return ragPost<KnowledgeBase>('/knowledge-bases', data);
}

export function updateKnowledgeBase(id: string, data: UpdateKnowledgeBaseRequest) {
  return ragPatch<KnowledgeBase>(`/knowledge-bases/${id}`, data);
}

export function deleteKnowledgeBase(id: string) {
  return ragDelete<{ id: string }>(`/knowledge-bases/${id}`);
}

export function bindKnowledgeBaseDocuments(
  id: string,
  data: BindKnowledgeBaseDocumentsRequest,
) {
  return ragPost<KnowledgeBase>(`/knowledge-bases/${id}/documents`, data);
}
