import type {
  CreateKnowledgeDocumentRequest,
  DocumentDeleteResponse,
  DocumentExtractionResponse,
  DocumentIndexResponse,
  DocumentUploadResponse,
  KnowledgeDocument,
} from './types';

import { ragRequest } from './http';

export function fetchDocuments() {
  return ragRequest<KnowledgeDocument[]>('/documents');
}

export function fetchDocument(id: string) {
  return ragRequest<KnowledgeDocument>(`/documents/${id}`);
}

export function uploadDocument(
  file: File,
  data?: CreateKnowledgeDocumentRequest,
) {
  const formData = new FormData();
  formData.append('file', file);

  if (data) {
    Object.entries(data).forEach(([key, value]) => {
      if (value === undefined || value === '') {
        return;
      }
      formData.append(
        key,
        Array.isArray(value) ? value.join(',') : String(value),
      );
    });
  }

  return ragRequest<DocumentUploadResponse>('/documents/upload', {
    body: formData,
    method: 'POST',
  });
}

export function extractDocument(id: string) {
  return ragRequest<DocumentExtractionResponse>(`/documents/${id}/extract`, {
    method: 'POST',
  });
}

export function indexDocument(id: string) {
  return ragRequest<DocumentIndexResponse>(`/documents/${id}/index`, {
    method: 'POST',
  });
}

export function deleteDocument(id: string) {
  return ragRequest<DocumentDeleteResponse>(`/documents/${id}`, {
    method: 'DELETE',
  });
}
