import type { KnowledgeDocumentSourceType } from '@repo/shared-types';

export class CreateDocumentDto {
  title?: string;
  sourceType?: KnowledgeDocumentSourceType;
  authority?: string;
  jurisdiction?: string;
  publishDate?: string;
  effectiveDate?: string;
  version?: string;
  tags?: string[];
}
