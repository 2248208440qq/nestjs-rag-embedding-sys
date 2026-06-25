import type { VxeTableGridColumns } from '#/adapter/vxe-table';
import type { UserRecord } from '#/api';

const STATUS_OPTIONS = [
  { label: '启用', value: 'active' },
  { label: '停用', value: 'inactive' },
];

function getStatusOptions() {
  return STATUS_OPTIONS;
}

function useColumns(): VxeTableGridColumns<UserRecord> {
  return [
    {
      align: 'left',
      field: 'username',
      minWidth: 140,
      title: '用户名',
    },
    {
      align: 'left',
      field: 'realName',
      minWidth: 140,
      title: '姓名',
    },
    {
      align: 'left',
      field: 'deptName',
      minWidth: 150,
      title: '部门',
    },
    {
      align: 'left',
      field: 'roles',
      minWidth: 220,
      showOverflow: false,
      slots: { default: 'roles' },
      title: '角色',
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
