<script lang="ts" setup>
import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type { DeptRecord } from '#/api';

import { computed, reactive, ref } from 'vue';

import { Page, VbenButton } from '@vben/common-ui';
import { Plus } from '@vben/icons';
import { useAccess } from '@vben/access';

import { useVbenDrawer } from '@vben/common-ui';
import { useVbenVxeGrid } from '#/adapter/vxe-table';
import { deleteDeptApi, getDeptListApi } from '#/api';
import { SYSTEM_PERMISSIONS } from '#/constants/permissions';
import { ElMessage, ElMessageBox } from 'element-plus';

import { getStatusOptions, useColumns } from './data';
import Form from './modules/form.vue';

type QueryParams = {
  page?: {
    currentPage?: number;
    pageSize?: number;
  };
};

const fullTreeData = ref<DeptRecord[]>([]);
const tableLoading = ref(false);
const { hasAccessByCodes } = useAccess();

const canCreate = computed(() =>
  hasAccessByCodes([SYSTEM_PERMISSIONS.dept.create]),
);
const canUpdate = computed(() =>
  hasAccessByCodes([SYSTEM_PERMISSIONS.dept.update]),
);
const canDelete = computed(() =>
  hasAccessByCodes([SYSTEM_PERMISSIONS.dept.delete]),
);

const searchForm = reactive({
  keyword: '',
  status: '',
});

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
        query: async (params) => queryDepts(params as QueryParams),
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
      parentField: 'pid',
      rowField: 'id',
      transform: false,
    },
  } as VxeTableGridOptions,
});

const totalNodeCount = computed(() => countNodes(fullTreeData.value));

function countNodes(nodes: DeptRecord[]): number {
  return nodes.reduce(
    (acc, node) => acc + 1 + countNodes(node.children ?? []),
    0,
  );
}

function normalizeIncludes(source: unknown, keyword: string) {
  return String(source ?? '').toLowerCase().includes(keyword);
}

function filterTree(nodes: DeptRecord[]): DeptRecord[] {
  const keyword = searchForm.keyword.trim().toLowerCase();
  const selectedStatus = searchForm.status || undefined;

  return nodes
    .map((node) => {
      const children = filterTree(node.children ?? []);
      const matched =
        (!keyword ||
          normalizeIncludes(node.name, keyword) ||
          normalizeIncludes(node.remark, keyword)) &&
        (!selectedStatus || node.status === selectedStatus);

      if (!matched && children.length === 0) {
        return null;
      }

      const cloned: DeptRecord = { ...node };
      if (children.length > 0) {
        cloned.children = children;
      } else {
        delete cloned.children;
      }
      return cloned;
    })
    .filter((item): item is DeptRecord => !!item);
}

async function queryDepts(params?: QueryParams) {
  tableLoading.value = true;
  try {
    const data = await getDeptListApi();
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

function onAppend(row: DeptRecord) {
  formDrawerApi.setData({
    pid: row.id,
    status: 'active',
  });
  formDrawerApi.open();
}

function onEdit(row: DeptRecord) {
  formDrawerApi.setData(row);
  formDrawerApi.open();
}

async function onDelete(row: DeptRecord) {
  await ElMessageBox.confirm(`确定删除部门「${row.name}」吗？`, '删除部门', {
    type: 'warning',
  });
  tableLoading.value = true;
  try {
    await deleteDeptApi(row.id);
    ElMessage.success('部门已删除');
    onRefresh();
  } finally {
    tableLoading.value = false;
  }
}
</script>

<template>
  <Page auto-content-height description="部门树形管理，支持搜索、增删改与分页展示" title="部门管理">
    <FormDrawer @success="onRefresh" />

    <div class="mb-4 rounded-lg border border-border bg-card p-3 shadow-sm">
      <div class="flex flex-wrap items-center gap-3">
        <input
          v-model="searchForm.keyword"
          class="h-9 w-64 rounded-md border border-input bg-background px-3 text-sm outline-none transition focus:border-primary"
          placeholder="按部门名称 / 备注筛选"
          @keyup.enter="onSearch"
        />
        <select
          v-model="searchForm.status"
          class="h-9 w-32 rounded-md border border-input bg-background px-3 text-sm outline-none transition focus:border-primary"
        >
          <option value="">全部状态</option>
          <option v-for="item in statusOptions" :key="item.value" :value="item.value">
            {{ item.label }}
          </option>
        </select>
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
      <Grid table-title="部门列表">
        <template #toolbar-tools>
          <div class="flex items-center gap-2">
            <VbenButton v-if="canCreate" @click="onCreate">
              <Plus class="size-5" />
              新建部门
            </VbenButton>
            <VbenButton :loading="tableLoading" variant="outline" @click="onRefresh">
              刷新
            </VbenButton>
          </div>
        </template>
        <template #operation="{ row }">
          <div class="flex w-full justify-center gap-2">
            <VbenButton v-if="canCreate" size="sm" variant="link" @click="onAppend(row)">
              新增子级
            </VbenButton>
            <VbenButton v-if="canUpdate" size="sm" variant="link" @click="onEdit(row)">
              修改
            </VbenButton>
            <VbenButton
              v-if="canDelete"
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
