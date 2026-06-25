<script lang="ts" setup>
import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type { MenuRecord, MenuType } from '#/api';

import { computed, reactive, ref } from 'vue';

import { Page, VbenButton, VbenSelect } from '@vben/common-ui';
import { Plus } from '@vben/icons';

import { useVbenDrawer } from '@vben/common-ui';
import { useVbenVxeGrid } from '#/adapter/vxe-table';
import { deleteMenuApi, getMenuListApi } from '#/api';
import { ElMessage, ElMessageBox } from 'element-plus';

import { getMenuTypeOptions, getStatusOptions, useColumns } from './data';
import Form from './modules/form.vue';

type QueryParams = {
  page?: {
    currentPage?: number;
    pageSize?: number;
  };
};

const fullTreeData = ref<MenuRecord[]>([]);
const tableLoading = ref(false);

const searchForm = reactive<{
  keyword: string;
  path: string;
  status: '';
  type: '' | MenuType;
}>({
  keyword: '',
  path: '',
  status: '',
  type: '',
});

const menuTypeOptions = getMenuTypeOptions();
const statusOptions = getStatusOptions();

const [FormDrawer, formDrawerApi] = useVbenDrawer({
  connectedComponent: Form,
  destroyOnClose: true,
});

const [Grid, gridApi] = useVbenVxeGrid({
  gridOptions: {
    columns: useColumns(),
    height: 560,
    keepSource: true,
    pagerConfig: {
      enabled: true,
      layouts: [
        'PrevJump',
        'PrevPage',
        'Number',
        'NextPage',
        'NextJump',
        'Sizes',
        'Total',
      ],
      pageSize: 10,
      pageSizes: [10, 20, 50],
    },
    proxyConfig: {
      ajax: {
        query: async (params) => queryMenus(params as QueryParams),
      },
    },
    rowConfig: {
      keyField: 'id',
    },
    toolbarConfig: {
      custom: true,
      export: false,
      refresh: true,
      zoom: true,
    },
    treeConfig: {
      parentField: 'parentId',
      rowField: 'id',
      transform: false,
    },
  } as VxeTableGridOptions,
});

const totalNodeCount = computed(() => countNodes(fullTreeData.value));

function countNodes(nodes: MenuRecord[]): number {
  return nodes.reduce(
    (acc, node) => acc + 1 + countNodes(node.children ?? []),
    0,
  );
}

function normalizeIncludes(source: unknown, keyword: string) {
  return String(source ?? '').toLowerCase().includes(keyword);
}

function filterTree(nodes: MenuRecord[]): MenuRecord[] {
  const keyword = searchForm.keyword.trim().toLowerCase();
  const pathKeyword = searchForm.path.trim().toLowerCase();
  const selectedType = searchForm.type || undefined;
  const selectedStatus = searchForm.status || undefined;

  return nodes
    .map((node) => {
      const children = filterTree(node.children ?? []);
      const title = String(node.meta?.title ?? '');
      const matched =
        (!keyword ||
          normalizeIncludes(node.name, keyword) ||
          normalizeIncludes(title, keyword) ||
          normalizeIncludes(node.path, keyword)) &&
        (!pathKeyword || normalizeIncludes(node.path, pathKeyword)) &&
        (!selectedType || node.type === selectedType) &&
        (!selectedStatus || node.status === selectedStatus);

      if (!matched && children.length === 0) {
        return null;
      }

      const cloned: MenuRecord = { ...node };
      if (children.length > 0) {
        cloned.children = children;
      } else {
        delete cloned.children;
      }
      return cloned;
    })
    .filter((item): item is MenuRecord => !!item);
}

async function queryMenus(params?: QueryParams) {
  tableLoading.value = true;
  try {
    const data = await getMenuListApi();
    const filtered = filterTree(data);
    fullTreeData.value = filtered;

    const requestedCurrentPage = Number(params?.page?.currentPage ?? 1);
    const requestedPageSize = Number(params?.page?.pageSize ?? 10);
    const total = filtered.length;
    const maxPage = Math.max(1, Math.ceil(total / requestedPageSize));
    const currentPage = Math.min(requestedCurrentPage, maxPage);
    const start = (currentPage - 1) * requestedPageSize;

    return {
      items: filtered.slice(start, start + requestedPageSize),
      total,
    };
  } finally {
    tableLoading.value = false;
  }
}

function onSearch() {
  gridApi.query();
}

function onReset() {
  searchForm.keyword = '';
  searchForm.path = '';
  searchForm.type = '';
  searchForm.status = '';
  gridApi.query();
}

function onRefresh() {
  gridApi.query();
}

function onCreate() {
  formDrawerApi.setData(null);
  formDrawerApi.open();
}

function onAppend(row: MenuRecord) {
  formDrawerApi.setData({
    parentId: row.id,
    status: 'active',
    type: 'menu',
  });
  formDrawerApi.open();
}

function onEdit(row: MenuRecord) {
  formDrawerApi.setData(row);
  formDrawerApi.open();
}

async function onDelete(row: MenuRecord) {
  await ElMessageBox.confirm(
    `确定删除菜单「${row.meta?.title || row.name}」吗？`,
    '删除菜单',
    { type: 'warning' },
  );
  tableLoading.value = true;
  try {
    await deleteMenuApi(row.id);
    ElMessage.success('菜单已删除');
    onRefresh();
  } finally {
    tableLoading.value = false;
  }
}
</script>

<template>
  <Page auto-content-height description="系统菜单路由树形表格，支持多条件搜索与增删改查" title="菜单管理">
    <FormDrawer @success="onRefresh" />

    <div class="mb-4 rounded-lg border border-border bg-card p-3 shadow-sm">
      <div class="flex flex-wrap items-center gap-3">
        <input
          v-model="searchForm.keyword"
          class="h-9 w-64 rounded-md border border-input bg-background px-3 text-sm outline-none transition focus:border-primary"
          placeholder="名称 / 标题 / 路径"
          @keyup.enter="onSearch"
        />
        <input
          v-model="searchForm.path"
          class="h-9 w-48 rounded-md border border-input bg-background px-3 text-sm outline-none transition focus:border-primary"
          placeholder="按路径筛选"
          @keyup.enter="onSearch"
        />
        <VbenSelect
          v-model="searchForm.type"
          allow-clear
          class="w-36"
          :options="menuTypeOptions"
          placeholder="菜单类型"
        />
        <VbenSelect
          v-model="searchForm.status"
          allow-clear
          class="w-32"
          :options="statusOptions"
          placeholder="状态"
        />
        <VbenButton :loading="tableLoading" @click="onSearch">查询</VbenButton>
        <VbenButton variant="outline" @click="onReset">重置</VbenButton>
      </div>
      <div class="mt-3">
        <span class="inline-flex items-center rounded-md border border-primary/30 bg-primary/10 px-2 py-1 text-xs font-medium text-primary">
          筛选后节点：{{ totalNodeCount }}
        </span>
      </div>
    </div>

    <div class="w-full overflow-x-auto">
      <Grid table-title="菜单列表">
        <template #toolbar-tools>
          <div class="flex items-center gap-2">
            <VbenButton @click="onCreate">
              <Plus class="size-5" />
              新建菜单
            </VbenButton>
            <VbenButton :loading="tableLoading" variant="outline" @click="onRefresh">
              刷新
            </VbenButton>
          </div>
        </template>
        <template #operation="{ row }">
          <div class="flex w-full justify-center gap-2">
            <VbenButton size="sm" variant="link" @click="onAppend(row)">
              新增子级
            </VbenButton>
            <VbenButton size="sm" variant="link" @click="onEdit(row)">
              修改
            </VbenButton>
            <VbenButton
              size="sm"
              variant="link"
              class="text-destructive hover:text-destructive"
              @click="onDelete(row)"
            >
              删除
            </VbenButton>
          </div>
        </template>
      </Grid>
    </div>
  </Page>
</template>
