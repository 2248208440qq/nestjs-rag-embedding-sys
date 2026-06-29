import type { VxeTableGridColumns } from '#/adapter/vxe-table';
import type { IndexJob, IndexJobStatus, IndexJobType } from '#/api/rag';

export const statusOptions = [
  { label: '等待中', value: 'pending' },
  { label: '执行中', value: 'running' },
  { label: '成功', value: 'succeeded' },
  { label: '失败', value: 'failed' },
  { label: '已取消', value: 'canceled' },
];

export const typeOptions = [
  { label: '解析文档', value: 'parse_document' },
  { label: '重建文档索引', value: 'rebuild_document_index' },
  { label: '全量重建索引', value: 'rebuild_all_indexes' },
  { label: '删除文档索引', value: 'delete_document_index' },
];

export const statusLabels: Record<IndexJobStatus, string> = Object.fromEntries(
  statusOptions.map((item) => [item.value, item.label]),
) as Record<IndexJobStatus, string>;

export const typeLabels: Record<IndexJobType, string> = Object.fromEntries(
  typeOptions.map((item) => [item.value, item.label]),
) as Record<IndexJobType, string>;

export function useColumns(): VxeTableGridColumns<IndexJob> {
  return [
    { field: 'type', minWidth: 150, slots: { default: 'type' }, title: '任务类型' },
    { field: 'documentTitle', minWidth: 220, title: '文档' },
    { field: 'status', slots: { default: 'status' }, title: '状态', width: 110 },
    { field: 'progress', formatter: ({ cellValue }) => `${cellValue ?? 0}%`, title: '进度', width: 90 },
    { field: 'currentStep', minWidth: 180, title: '当前步骤' },
    { field: 'errorMessage', minWidth: 220, title: '错误信息' },
    {
      field: 'createdAt',
      formatter: ({ cellValue }) => cellValue ? new Date(cellValue).toLocaleString('zh-CN') : '-',
      title: '创建时间',
      width: 180,
    },
    { align: 'center', field: 'operation', fixed: 'right', slots: { default: 'operation' }, title: '操作', width: 180 },
  ];
}
