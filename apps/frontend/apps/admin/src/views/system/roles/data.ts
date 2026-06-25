import type { VxeTableGridColumns } from '#/adapter/vxe-table';
import type { RoleRecord } from '#/api';

const STATUS_OPTIONS = [
  { label: '启用', value: 'active' },
  { label: '停用', value: 'inactive' },
];

function getStatusOptions() {
  return STATUS_OPTIONS;
}

function useColumns(): VxeTableGridColumns<RoleRecord> {
  return [
    {
      align: 'left',
      field: 'name',
      minWidth: 150,
      title: '角色名称',
    },
    {
      align: 'left',
      field: 'description',
      minWidth: 220,
      title: '描述',
    },
    {
      field: 'permissions',
      formatter: ({ row }) => row.permissions?.length ?? 0,
      title: '权限数量',
      width: 110,
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
      width: 180,
    },
  ];
}

export { getStatusOptions, useColumns };
