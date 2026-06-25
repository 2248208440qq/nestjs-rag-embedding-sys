import type {
  KnowledgeDocumentSourceType,
  KnowledgeDocumentStatus,
} from '@repo/shared-types';

export type ElementTagType =
  | 'danger'
  | 'info'
  | 'primary'
  | 'success'
  | 'warning';

export interface DocumentMetaConfig<T extends string = string> {
  label: string;
  type: T;
}

export const documentSourceTypeConfig: Record<
  KnowledgeDocumentSourceType,
  DocumentMetaConfig<ElementTagType>
> = {
  case: { label: '案例', type: 'warning' },
  contract: { label: '合同', type: 'info' },
  internal: { label: '内部文档', type: 'danger' },
  judicial_interpretation: { label: '司法解释', type: 'success' },
  law: { label: '法律', type: 'primary' },
  other: { label: '其他', type: 'info' },
};

export const documentStatusConfig: Record<
  KnowledgeDocumentStatus,
  DocumentMetaConfig<Exclude<ElementTagType, 'primary'>>
> = {
  failed: { label: '失败', type: 'danger' },
  indexed: { label: '已索引', type: 'success' },
  parsed: { label: '已解析', type: 'warning' },
  uploaded: { label: '已上传', type: 'info' },
};

export function getDocumentSourceTypeConfig(
  sourceType: KnowledgeDocumentSourceType,
) {
  return (
    documentSourceTypeConfig[sourceType] ?? {
      label: sourceType,
      type: 'info' as const,
    }
  );
}

export function getDocumentStatusConfig(status: KnowledgeDocumentStatus) {
  return (
    documentStatusConfig[status] ?? {
      label: status,
      type: 'info' as const,
    }
  );
}
