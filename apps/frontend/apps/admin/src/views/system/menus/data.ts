import type { VxeTableGridColumns } from '#/adapter/vxe-table';
import type { MenuRecord } from '#/api';

const MENU_TYPE_OPTIONS = [
  { label: '目录', value: 'catalog' },
  { label: '菜单', value: 'menu' },
  { label: '按钮', value: 'button' },
];

const STATUS_OPTIONS = [
  { label: '启用', value: 'active' },
  { label: '停用', value: 'inactive' },
];

function getMenuTypeOptions() {
  return MENU_TYPE_OPTIONS;
}

function getStatusOptions() {
  return STATUS_OPTIONS;
}

function useColumns(): VxeTableGridColumns<MenuRecord> {
  return [
    {
      align: 'left',
      field: 'meta.title',
      minWidth: 220,
      title: '标题',
      treeNode: true,
    },
    {
      align: 'left',
      field: 'name',
      minWidth: 180,
      title: '标识',
    },
    {
      align: 'left',
      field: 'path',
      minWidth: 220,
      title: '路径',
    },
    {
      align: 'left',
      field: 'component',
      minWidth: 220,
      title: '组件',
    },
    {
      cellRender: {
        name: 'CellTag',
        options: MENU_TYPE_OPTIONS,
      },
      field: 'type',
      title: '类型',
      width: 100,
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
      field: 'orderNo',
      title: '排序',
      width: 80,
    },
    {
      field: 'updatedAt',
      formatter: ({ cellValue }) =>
        cellValue ? new Date(cellValue).toLocaleString('zh-CN') : '-',
      title: '更新时间',
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

export { getMenuTypeOptions, getStatusOptions, useColumns };
