<script lang="ts" setup>
import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type { UserRecord } from '#/api';

import { reactive, ref } from 'vue';

import { Page, VbenButton, VbenSelect } from '@vben/common-ui';
import { Plus } from '@vben/icons';

import { useVbenDrawer } from '@vben/common-ui';
import { useVbenVxeGrid } from '#/adapter/vxe-table';
import { deleteUserApi, getUserListApi } from '#/api';
import { ElMessage, ElMessageBox } from 'element-plus';

import { cleanPayload } from '../shared';
import { getStatusOptions, useColumns } from './data';
import Form from './modules/form.vue';

type QueryParams = {
  page?: {
    currentPage?: number;
    pageSize?: number;
  };
};

const tableLoading = ref(false);

const searchForm = reactive({
  name: '',
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
        query: async (params) => queryUsers(params as QueryParams),
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
  } as VxeTableGridOptions,
});

async function queryUsers(params?: QueryParams) {
  tableLoading.value = true;
  try {
    const page = Number(params?.page?.currentPage ?? 1);
    const pageSize = Number(params?.page?.pageSize ?? 10);
    const data = await getUserListApi(
      cleanPayload({
        name: searchForm.name,
        page,
        pageSize,
        status: searchForm.status,
      }),
    );

    return {
      items: data.items,
      total: data.total,
    };
  } finally {
    tableLoading.value = false;
  }
}

function onSearch() {
  gridApi.query();
}

function onReset() {
  searchForm.name = '';
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

function onEdit(row: UserRecord) {
  formDrawerApi.setData(row);
  formDrawerApi.open();
}

async function onDelete(row: UserRecord) {
  await ElMessageBox.confirm(`确定删除用户「${row.username}」吗？`, '删除用户', {
    type: 'warning',
  });
  tableLoading.value = true;
  try {
    await deleteUserApi(row.id);
    ElMessage.success('用户已删除');
    onRefresh();
  } finally {
    tableLoading.value = false;
  }
}
</script>

<template>
  <Page auto-content-height description="维护系统账号、角色和所属部门" title="用户管理">
    <FormDrawer @success="onRefresh" />

    <div class="mb-4 rounded-lg border border-border bg-card p-3 shadow-sm">
      <div class="flex flex-wrap items-center gap-3">
        <input
          v-model="searchForm.name"
          class="h-9 w-64 rounded-md border border-input bg-background px-3 text-sm outline-none transition focus:border-primary"
          placeholder="用户名 / 姓名"
          @keyup.enter="onSearch"
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
    </div>

    <div class="w-full overflow-x-auto">
      <Grid table-title="用户列表">
        <template #toolbar-tools>
          <div class="flex items-center gap-2">
            <VbenButton @click="onCreate">
              <Plus class="size-5" />
              新建用户
            </VbenButton>
            <VbenButton :loading="tableLoading" variant="outline" @click="onRefresh">
              刷新
            </VbenButton>
          </div>
        </template>
        <template #roles="{ row }">
          <div class="flex flex-wrap gap-1">
            <span
              v-for="role in row.roles"
              :key="role.name"
              class="inline-flex items-center rounded-md border border-border bg-muted px-2 py-0.5 text-xs text-muted-foreground"
            >
              {{ role.name }}
            </span>
          </div>
        </template>
        <template #operation="{ row }">
          <div class="flex w-full justify-center gap-2">
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
