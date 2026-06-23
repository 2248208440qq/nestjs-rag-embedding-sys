<script lang="ts" setup>
import type { KnowledgeDocument } from '#/api/rag';

import { computed, onMounted, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';

import { Page } from '@vben/common-ui';

import {
  ElButton,
  ElCard,
  ElDescriptions,
  ElDescriptionsItem,
  ElMessage,
  ElMessageBox,
  ElSkeleton,
  ElSpace,
  ElTag,
} from 'element-plus';

import {
  deleteDocument,
  extractDocument,
  fetchDocument,
  indexDocument,
} from '#/api/rag';

const route = useRoute();
const router = useRouter();
const document = ref<KnowledgeDocument>();
const loading = ref(false);
const actionLoading = ref(false);

const canIndex = computed(
  () => document.value?.status === 'parsed' || document.value?.status === 'indexed',
);
const indexButtonText = computed(() =>
  document.value?.status === 'indexed' ? '更新索引' : '构建索引',
);

const sourceTypeLabels = {
  case: '案例',
  contract: '合同',
  internal: '内部文档',
  judicial_interpretation: '司法解释',
  law: '法律',
  other: '其他',
};

const statusLabels: Record<string, string> = {
  failed: '失败',
  indexed: '已索引',
  parsed: '已解析',
  uploaded: '已上传',
};

async function loadDocument() {
  loading.value = true;
  try {
    document.value = await fetchDocument(route.params.id as string);
  } finally {
    loading.value = false;
  }
}

async function handleExtract() {
  if (!document.value || actionLoading.value) return;
  actionLoading.value = true;
  try {
    await extractDocument(document.value.id);
    ElMessage.success('解析任务已完成');
    await loadDocument();
  } finally {
    actionLoading.value = false;
  }
}

async function handleIndex() {
  if (!document.value || actionLoading.value) return;
  actionLoading.value = true;
  try {
    await indexDocument(document.value.id);
    ElMessage.success(
      document.value.status === 'indexed' ? '索引更新已完成' : '索引构建已完成',
    );
    await loadDocument();
  } finally {
    actionLoading.value = false;
  }
}

async function handleDelete() {
  if (!document.value || actionLoading.value) return;

  await ElMessageBox.confirm(
    `确定删除「${document.value.title}」吗？对应索引记录和本地上传文件会一并清空。`,
    '删除文档',
    { type: 'warning' },
  );

  actionLoading.value = true;
  try {
    await deleteDocument(document.value.id);
    ElMessage.success('文档、索引和本地文件已删除');
    router.push('/rag/documents');
  } finally {
    actionLoading.value = false;
  }
}

function formatDate(date?: string) {
  return date ? new Date(date).toLocaleString('zh-CN') : '-';
}

function formatSize(size?: number) {
  return size ? `${(size / 1024).toFixed(1)} KB` : '-';
}

onMounted(loadDocument);
</script>

<template>
  <Page description="查看文档元数据和处理状态" title="文档详情">
    <ElCard v-loading="loading" shadow="never">
      <template #header>
        <div class="flex items-center justify-between">
          <span>{{ document?.title ?? '文档详情' }}</span>
          <ElButton :disabled="actionLoading" @click="router.push('/rag/documents')">
            返回列表
          </ElButton>
        </div>
      </template>

      <ElSkeleton v-if="!document" animated />
      <template v-else>
        <ElDescriptions :column="2" border>
          <ElDescriptionsItem label="标题" :span="2">
            {{ document.title }}
          </ElDescriptionsItem>
          <ElDescriptionsItem label="来源类型">
            {{ sourceTypeLabels[document.sourceType] }}
          </ElDescriptionsItem>
          <ElDescriptionsItem label="状态">
            <ElTag
              :type="document.status === 'indexed' ? 'success' : document.status === 'failed' ? 'danger' : 'warning'"
            >
              {{ statusLabels[document.status] }}
            </ElTag>
          </ElDescriptionsItem>
          <ElDescriptionsItem label="原始文件">
            {{ document.originalFileName ?? '-' }}
          </ElDescriptionsItem>
          <ElDescriptionsItem label="文件大小">
            {{ formatSize(document.size) }}
          </ElDescriptionsItem>
          <ElDescriptionsItem label="发布机关">
            {{ document.authority ?? '-' }}
          </ElDescriptionsItem>
          <ElDescriptionsItem label="管辖区域">
            {{ document.jurisdiction ?? '-' }}
          </ElDescriptionsItem>
          <ElDescriptionsItem label="发布日期">
            {{ document.publishDate ?? '-' }}
          </ElDescriptionsItem>
          <ElDescriptionsItem label="生效日期">
            {{ document.effectiveDate ?? '-' }}
          </ElDescriptionsItem>
          <ElDescriptionsItem label="版本">
            {{ document.version ?? '-' }}
          </ElDescriptionsItem>
          <ElDescriptionsItem label="标签">
            <ElSpace v-if="document.tags.length" wrap>
              <ElTag v-for="tag in document.tags" :key="tag" effect="plain">
                {{ tag }}
              </ElTag>
            </ElSpace>
            <span v-else>-</span>
          </ElDescriptionsItem>
          <ElDescriptionsItem label="创建时间">
            {{ formatDate(document.createdAt) }}
          </ElDescriptionsItem>
          <ElDescriptionsItem label="更新时间">
            {{ formatDate(document.updatedAt) }}
          </ElDescriptionsItem>
        </ElDescriptions>

        <ElSpace class="mt-5">
          <ElButton
            :disabled="document.status !== 'uploaded' || actionLoading"
            :loading="actionLoading"
            type="warning"
            @click="handleExtract"
          >
            解析文档
          </ElButton>
          <ElButton
            :disabled="!canIndex || actionLoading"
            :loading="actionLoading"
            type="success"
            @click="handleIndex"
          >
            {{ indexButtonText }}
          </ElButton>
          <ElButton
            :disabled="actionLoading"
            :loading="actionLoading"
            plain
            type="danger"
            @click="handleDelete"
          >
            删除文档
          </ElButton>
        </ElSpace>
      </template>
    </ElCard>
  </Page>
</template>
