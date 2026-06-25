<script lang="ts" setup>
import type { IndexJob, IndexJobStatus, IndexJobType } from '#/api/rag';

import { computed, onMounted, reactive, ref, shallowRef } from 'vue';

import { Page, VbenButton } from '@vben/common-ui';

import {
  ElCard,
  ElMessage,
  ElOption,
  ElSelect,
  ElSpace,
  ElTable,
  ElTableColumn,
  ElTag,
} from 'element-plus';

import {
  cancelIndexJob,
  fetchIndexJobs,
  rebuildAllIndexes,
  retryIndexJob,
} from '#/api/rag';

const jobs = ref<IndexJob[]>([]);
const total = shallowRef(0);
const loading = shallowRef(false);
const actionLoadingId = shallowRef('');
const query = reactive<{
  status: '' | IndexJobStatus;
  type: '' | IndexJobType;
}>({
  status: '',
  type: '',
});

const statusLabels: Record<IndexJobStatus, string> = {
  canceled: '已取消',
  failed: '失败',
  pending: '等待中',
  running: '执行中',
  succeeded: '成功',
};

const typeLabels: Record<IndexJobType, string> = {
  chunk_document: '文档分块',
  delete_document_index: '删除索引',
  generate_embeddings: '生成向量',
  parse_document: '解析文档',
  rebuild_all_indexes: '全量重建索引',
  rebuild_document_index: '重建文档索引',
};

const runningCount = computed(
  () => jobs.value.filter((job) => job.status === 'running').length,
);

function asJob(row: unknown) {
  return row as IndexJob;
}

function statusType(status: IndexJobStatus) {
  if (status === 'succeeded') return 'success';
  if (status === 'failed') return 'danger';
  if (status === 'running') return 'warning';
  return 'info';
}

async function loadJobs() {
  loading.value = true;
  try {
    const data = await fetchIndexJobs({
      page: 1,
      pageSize: 50,
      status: query.status || undefined,
      type: query.type || undefined,
    });
    jobs.value = data.items;
    total.value = data.total;
  } finally {
    loading.value = false;
  }
}

async function handleRetry(job: IndexJob) {
  actionLoadingId.value = job.id;
  try {
    await retryIndexJob(job.id);
    ElMessage.success('已创建重试任务');
    await loadJobs();
  } finally {
    actionLoadingId.value = '';
  }
}

async function handleCancel(job: IndexJob) {
  actionLoadingId.value = job.id;
  try {
    await cancelIndexJob(job.id);
    ElMessage.success('任务已取消');
    await loadJobs();
  } finally {
    actionLoadingId.value = '';
  }
}

async function handleRebuildAll() {
  loading.value = true;
  try {
    await rebuildAllIndexes();
    ElMessage.success('已创建全量重建任务');
    await loadJobs();
  } finally {
    loading.value = false;
  }
}

function formatDate(date?: string) {
  return date ? new Date(date).toLocaleString('zh-CN') : '-';
}

onMounted(loadJobs);
</script>

<template>
  <Page description="查看解析、分块、向量化、重建和删除索引的执行记录" title="索引任务">
    <div class="mb-4 grid gap-4 md:grid-cols-3">
      <ElCard shadow="never">
        <div class="text-sm text-muted-foreground">任务总数</div>
        <div class="mt-2 text-2xl font-semibold">{{ total }}</div>
      </ElCard>
      <ElCard shadow="never">
        <div class="text-sm text-muted-foreground">执行中</div>
        <div class="mt-2 text-2xl font-semibold text-warning">{{ runningCount }}</div>
      </ElCard>
      <ElCard shadow="never">
        <div class="text-sm text-muted-foreground">当前筛选</div>
        <div class="mt-2 text-sm text-muted-foreground">
          {{ query.status ? statusLabels[query.status] : '全部状态' }} /
          {{ query.type ? typeLabels[query.type] : '全部类型' }}
        </div>
      </ElCard>
    </div>

    <ElCard shadow="never">
      <template #header>
        <div class="flex flex-wrap items-center justify-between gap-3">
          <ElSpace>
            <ElSelect v-model="query.status" clearable placeholder="任务状态" style="width: 140px">
              <ElOption label="等待中" value="pending" />
              <ElOption label="执行中" value="running" />
              <ElOption label="成功" value="succeeded" />
              <ElOption label="失败" value="failed" />
              <ElOption label="已取消" value="canceled" />
            </ElSelect>
            <ElSelect v-model="query.type" clearable placeholder="任务类型" style="width: 180px">
              <ElOption label="解析文档" value="parse_document" />
              <ElOption label="重建文档索引" value="rebuild_document_index" />
              <ElOption label="全量重建索引" value="rebuild_all_indexes" />
              <ElOption label="删除索引" value="delete_document_index" />
            </ElSelect>
            <VbenButton :loading="loading" @click="loadJobs">查询</VbenButton>
          </ElSpace>
          <VbenButton :loading="loading" variant="outline" @click="handleRebuildAll">
            创建全量重建任务
          </VbenButton>
        </div>
      </template>

      <ElTable v-loading="loading" :data="jobs" stripe>
        <ElTableColumn label="任务类型" width="150">
          <template #default="{ row }">{{ typeLabels[asJob(row).type] }}</template>
        </ElTableColumn>
        <ElTableColumn label="文档" min-width="220">
          <template #default="{ row }">{{ asJob(row).documentTitle || asJob(row).documentId || '-' }}</template>
        </ElTableColumn>
        <ElTableColumn label="状态" width="110">
          <template #default="{ row }">
            <ElTag :type="statusType(asJob(row).status)">
              {{ statusLabels[asJob(row).status] }}
            </ElTag>
          </template>
        </ElTableColumn>
        <ElTableColumn label="进度" width="90" prop="progress" />
        <ElTableColumn label="当前步骤" min-width="180" prop="currentStep" show-overflow-tooltip />
        <ElTableColumn label="错误信息" min-width="180" prop="errorMessage" show-overflow-tooltip />
        <ElTableColumn label="创建时间" width="180">
          <template #default="{ row }">{{ formatDate(asJob(row).createdAt) }}</template>
        </ElTableColumn>
        <ElTableColumn align="center" fixed="right" label="操作" width="170">
          <template #default="{ row }">
            <ElSpace>
              <VbenButton
                :disabled="asJob(row).status !== 'failed'"
                :loading="actionLoadingId === asJob(row).id"
                size="sm"
                variant="link"
                @click="handleRetry(asJob(row))"
              >
                重试
              </VbenButton>
              <VbenButton
                :disabled="!['pending', 'running'].includes(asJob(row).status)"
                :loading="actionLoadingId === asJob(row).id"
                size="sm"
                variant="link"
                @click="handleCancel(asJob(row))"
              >
                取消
              </VbenButton>
            </ElSpace>
          </template>
        </ElTableColumn>
      </ElTable>
    </ElCard>
  </Page>
</template>
