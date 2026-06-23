import type { KnowledgeDocument } from '@repo/shared-types';
import type { Prisma } from '@prisma/client';

type PrismaKnowledgeDocument = Prisma.KnowledgeDocumentGetPayload<object>;

export function toKnowledgeDocument(
  document: PrismaKnowledgeDocument,
): KnowledgeDocument {
  return {
    id: document.id,
    title: document.title,
    sourceType: document.sourceType,
    status: document.status,
    originalFileName: document.originalFileName ?? undefined,
    mimeType: document.mimeType ?? undefined,
    size: document.size ?? undefined,
    authority: document.authority ?? undefined,
    jurisdiction: document.jurisdiction ?? undefined,
    publishDate: document.publishDate?.toISOString(),
    effectiveDate: document.effectiveDate?.toISOString(),
    version: document.version ?? undefined,
    tags: document.tags,
    createdAt: document.createdAt.toISOString(),
    updatedAt: document.updatedAt.toISOString(),
  };
}
