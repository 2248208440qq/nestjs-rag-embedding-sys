import type { VxeTableGridColumns } from '#/adapter/vxe-table';
import type { DeptRecord } from '#/api';

const STATUS_OPTIONS = [
  { label: '启用', value: 'active' },
  { label: '停用', value: 'inactive' },
];

function getStatusOptions() {
  return STATUS_OPTIONS;
}

function useColumns(): VxeTableGridColumns<DeptRecord> {
  return [
    {
      align: 'left',
      field: 'name',
      minWidth: 220,
      title: '部门名称',
      treeNode: true,
    },
    {
      align: 'left',
      field: 'remark',
      minWidth: 260,
      title: '备注',
    },
    {
      cellRender: {
        name: 'CellTag',
        options: STATUS_OPTIONS,
      },
      field: 'status',
      title: '状态',
      width: 100,
    },
    {
      field: 'createTime',
      formatter: ({ cellValue }) =>
        cellValue ? new Date(cellValue).toLocaleString('zh-CN') : '-',
      title: '创建时间',
      width: 180,
    },
    {
      align: 'center',
      field: 'operation',
      fixed: 'right',
      showOverflow: false,
      slots: { default: 'operation' },
      title: '操作',
      width: 230,
    },
  ];
}

export { getStatusOptions, useColumns };
