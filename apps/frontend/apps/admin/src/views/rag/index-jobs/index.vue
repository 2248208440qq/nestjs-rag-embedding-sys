<script lang="ts" setup>
import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type { IndexJob, IndexJobStatus, IndexJobType } from '#/api/rag';

import { computed, onMounted, onUnmounted, reactive, ref } from 'vue';

import { Page, VbenButton, VbenSelect } from '@vben/common-ui';
import { useVbenVxeGrid } from '#/adapter/vxe-table';
import { ElMessage } from 'element-plus';

import { cancelIndexJob, fetchIndexJobs, rebuildAllIndexes, retryIndexJob } from '#/api/rag';

import { statusLabels, statusOptions, typeLabels, typeOptions, useColumns } from './data';

type QueryParams = { page?: { currentPage?: number; pageSize?: number } };

const tableLoading = ref(false);
const actionLoadingId = ref('');
const searchForm = reactive<{ documentId: string; status: '' | IndexJobStatus; type: '' | IndexJobType }>({
  documentId: '', status: '', type: '',
});
let refreshTimer: ReturnType<typeof setInterval> | undefined;

const [Grid, gridApi] = useVbenVxeGrid({
  gridOptions: {
    columns: useColumns(),
    height: 560,
    pagerConfig: { enabled: true, pageSize: 20, pageSizes: [10, 20, 50] },
    proxyConfig: { ajax: { query: async (params) => queryJobs(params as QueryParams) } },
    rowConfig: { keyField: 'id' },
    toolbarConfig: { custom: true, export: false, refresh: true, zoom: true },
  } as VxeTableGridOptions,
});

const isRunning = computed(() => gridApi.grid.getTableData().tableData.some((job: IndexJob) => ['pending', 'running'].includes(job.status)));

async function queryJobs(params?: QueryParams) {
  tableLoading.value = true;
  try {
    const data = await fetchIndexJobs({
      documentId: searchForm.documentId || undefined,
      page: Number(params?.page?.currentPage ?? 1),
      pageSize: Number(params?.page?.pageSize ?? 20),
      status: searchForm.status || undefined,
      type: searchForm.type || undefined,
    });
    return { items: data.items, total: data.total };
  } finally {
    tableLoading.value = false;
  }
}

function onSearch() { gridApi.query(); }
function onReset() { searchForm.documentId = ''; searchForm.status = ''; searchForm.type = ''; gridApi.query(); }
function onRefresh() { gridApi.query(); }
function getTypeLabel(type: unknown) { return typeLabels[type as IndexJobType] ?? String(type); }
function getStatusLabel(status: unknown) { return statusLabels[status as IndexJobStatus] ?? String(status); }

async function onRetry(job: IndexJob) {
  actionLoadingId.value = job.id;
  try { await retryIndexJob(job.id); ElMessage.success('重试任务已创建'); onRefresh(); }
  finally { actionLoadingId.value = ''; }
}

async function onCancel(job: IndexJob) {
  actionLoadingId.value = job.id;
  try { await cancelIndexJob(job.id); ElMessage.success('任务已取消'); onRefresh(); }
  finally { actionLoadingId.value = ''; }
}

async function onRebuildAll() {
  tableLoading.value = true;
  try { await rebuildAllIndexes(); ElMessage.success('全量重建任务已创建'); onRefresh(); }
  finally { tableLoading.value = false; }
}

onMounted(() => {
  refreshTimer = setInterval(() => { if (isRunning.value) onRefresh(); }, 1500);
});
onUnmounted(() => { if (refreshTimer) clearInterval(refreshTimer); });
</script>

<template>
  <Page auto-content-height description="查看解析、索引、删除和全量重建任务的进度、结果与错误信息" title="索引任务">
    <div class="mb-4 rounded-lg border border-border bg-card p-3 shadow-sm">
      <div class="flex flex-wrap items-center gap-3">
        <input v-model="searchForm.documentId" class="h-9 w-64 rounded-md border border-input bg-background px-3 text-sm outline-none" placeholder="按文档 ID 筛选" @keyup.enter="onSearch">
        <VbenSelect v-model="searchForm.status" allow-clear class="w-32" :options="statusOptions" placeholder="任务状态" />
        <VbenSelect v-model="searchForm.type" allow-clear class="w-44" :options="typeOptions" placeholder="任务类型" />
        <VbenButton :loading="tableLoading" @click="onSearch">查询</VbenButton>
        <VbenButton variant="outline" @click="onReset">重置</VbenButton>
      </div>
    </div>

    <div class="w-full overflow-x-auto">
      <Grid table-title="任务列表">
        <template #toolbar-tools>
          <div class="flex items-center gap-2">
            <VbenButton :loading="tableLoading" variant="outline" @click="onRefresh">刷新</VbenButton>
            <VbenButton :loading="tableLoading" @click="onRebuildAll">全量重建索引</VbenButton>
          </div>
        </template>
        <template #type="{ row }">{{ getTypeLabel(row.type) }}</template>
        <template #status="{ row }">
          <span class="inline-flex rounded-md border px-2 py-0.5 text-xs" :class="row.status === 'failed' ? 'border-destructive/30 text-destructive' : row.status === 'succeeded' ? 'border-emerald-500/30 text-emerald-600' : 'border-amber-500/30 text-amber-600'">
            {{ getStatusLabel(row.status) }}
          </span>
        </template>
        <template #operation="{ row }">
          <div class="flex justify-center gap-2">
            <VbenButton :disabled="row.status !== 'failed'" :loading="actionLoadingId === row.id" size="sm" variant="link" @click="onRetry(row)">重试</VbenButton>
            <VbenButton :disabled="!['pending', 'running'].includes(row.status)" :loading="actionLoadingId === row.id" class="text-destructive" size="sm" variant="link" @click="onCancel(row)">取消</VbenButton>
          </div>
        </template>
      </Grid>
    </div>
  </Page>
</template>
