<script lang="ts" setup>
import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type { RoleRecord } from '#/api';

import { computed, reactive, ref } from 'vue';

import { Page, VbenButton, VbenSelect } from '@vben/common-ui';
import { Plus } from '@vben/icons';
import { useAccess } from '@vben/access';

import { useVbenDrawer } from '@vben/common-ui';
import { useVbenVxeGrid } from '#/adapter/vxe-table';
import { deleteRoleApi, getRoleListApi } from '#/api';
import { SYSTEM_PERMISSIONS } from '#/constants/permissions';
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
const { hasAccessByCodes } = useAccess();

const canCreate = computed(() =>
  hasAccessByCodes([SYSTEM_PERMISSIONS.role.create]),
);
const canUpdate = computed(() =>
  hasAccessByCodes([SYSTEM_PERMISSIONS.role.update]),
);
const canDelete = computed(() =>
  hasAccessByCodes([SYSTEM_PERMISSIONS.role.delete]),
);

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
        query: async (params) => queryRoles(params as QueryParams),
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

async function queryRoles(params?: QueryParams) {
  tableLoading.value = true;
  try {
    const page = Number(params?.page?.currentPage ?? 1);
    const pageSize = Number(params?.page?.pageSize ?? 10);
    const data = await getRoleListApi(
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

function onEdit(row: RoleRecord) {
  formDrawerApi.setData(row);
  formDrawerApi.open();
}

async function onDelete(row: RoleRecord) {
  await ElMessageBox.confirm(`确定删除角色「${row.name}」吗？`, '删除角色', {
    type: 'warning',
  });
  tableLoading.value = true;
  try {
    await deleteRoleApi(row.id);
    ElMessage.success('角色已删除');
    onRefresh();
  } finally {
    tableLoading.value = false;
  }
}
</script>

<template>
  <Page auto-content-height description="配置角色基础信息和菜单按钮权限" title="角色管理">
    <FormDrawer @success="onRefresh" />

    <div class="mb-4 rounded-lg border border-border bg-card p-3 shadow-sm">
      <div class="flex flex-wrap items-center gap-3">
        <input
          v-model="searchForm.name"
          class="h-9 w-64 rounded-md border border-input bg-background px-3 text-sm outline-none transition focus:border-primary"
          placeholder="角色名称 / 描述"
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
      <Grid table-title="角色列表">
        <template #toolbar-tools>
          <div class="flex items-center gap-2">
            <VbenButton v-if="canCreate" @click="onCreate">
              <Plus class="size-5" />
              新建角色
            </VbenButton>
            <VbenButton :loading="tableLoading" variant="outline" @click="onRefresh">
              刷新
            </VbenButton>
          </div>
        </template>
        <template #operation="{ row }">
          <div class="flex w-full justify-center gap-2">
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
