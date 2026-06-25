import type { KnowledgeBase } from '@repo/shared-types';

export function toKnowledgeBase(input: {
  _count?: { documents: number };
  category: string | null;
  code: string;
  createdAt: Date;
  description: string | null;
  id: string;
  name: string;
  status: KnowledgeBase['status'];
  updatedAt: Date;
}): KnowledgeBase {
  return {
    id: input.id,
    name: input.name,
    code: input.code,
    description: input.description ?? undefined,
    category: input.category ?? undefined,
    status: input.status,
    documentCount: input._count?.documents,
    createdAt: input.createdAt.toISOString(),
    updatedAt: input.updatedAt.toISOString(),
  };
}
