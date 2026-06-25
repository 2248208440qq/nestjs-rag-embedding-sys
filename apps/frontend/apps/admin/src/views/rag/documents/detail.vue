<script lang="ts" setup>
import type { KnowledgeDocument } from '#/api/rag';

import { computed, onMounted, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';

import {
  Page,
  VbenButton,
  VbenDescriptions,
  VbenDescriptionsItem,
  VbenSpinner,
} from '@vben/common-ui';
import { useAccess } from '@vben/access';

import {
  ElMessage,
  ElMessageBox,
} from 'element-plus';

import {
  deleteDocument,
  extractDocument,
  fetchDocument,
  indexDocument,
} from '#/api/rag';
import { RAG_PERMISSIONS } from '#/constants/permissions';

import FilePreviewDialog from './components/FilePreviewDialog.vue';

const route = useRoute();
const router = useRouter();
const { hasAccessByCodes } = useAccess();
const document = ref<KnowledgeDocument>();
const loading = ref(false);
const actionLoading = ref(false);
const previewVisible = ref(false);

const canIndex = computed(
  () => document.value?.status === 'parsed' || document.value?.status === 'indexed',
);
const canParseDocument = computed(() =>
  hasAccessByCodes([RAG_PERMISSIONS.document.parse]),
);
const canIndexDocument = computed(() =>
  hasAccessByCodes([RAG_PERMISSIONS.document.index]),
);
const canDeleteDocument = computed(() =>
  hasAccessByCodes([RAG_PERMISSIONS.document.delete]),
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

function statusTagClass(status: KnowledgeDocument['status']) {
  if (status === 'indexed') {
    return 'border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-300';
  }
  if (status === 'failed') {
    return 'border-destructive/30 bg-destructive/10 text-destructive';
  }
  return 'border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-300';
}

onMounted(loadDocument);
</script>

<template>
  <Page description="查看文档元数据和处理状态" title="文档详情">
    <div v-loading="loading" class="bg-card rounded-lg border border-border p-5 shadow-sm">
      <div class="mb-5 flex items-center justify-between">
        <span class="text-base font-semibold">{{ document?.title ?? '文档详情' }}</span>
        <VbenButton :disabled="actionLoading" @click="router.push('/rag/documents')">
          返回列表
        </VbenButton>
      </div>

      <div v-if="!document" class="flex min-h-40 items-center justify-center">
        <VbenSpinner spinning />
      </div>
      <template v-else>
        <VbenDescriptions :column="2" bordered>
          <VbenDescriptionsItem label="标题" :span="2">
            {{ document.title }}
          </VbenDescriptionsItem>
          <VbenDescriptionsItem label="来源类型">
            {{ sourceTypeLabels[document.sourceType] }}
          </VbenDescriptionsItem>
          <VbenDescriptionsItem label="状态">
            <span
              class="inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-medium"
              :class="statusTagClass(document.status)"
            >
              {{ statusLabels[document.status] }}
            </span>
          </VbenDescriptionsItem>
          <VbenDescriptionsItem label="原始文件">
            {{ document.originalFileName ?? '-' }}
          </VbenDescriptionsItem>
          <VbenDescriptionsItem label="文件大小">
            {{ formatSize(document.size) }}
          </VbenDescriptionsItem>
          <VbenDescriptionsItem label="发布机关">
            {{ document.authority ?? '-' }}
          </VbenDescriptionsItem>
          <VbenDescriptionsItem label="管辖区域">
            {{ document.jurisdiction ?? '-' }}
          </VbenDescriptionsItem>
          <VbenDescriptionsItem label="发布日期">
            {{ document.publishDate ?? '-' }}
          </VbenDescriptionsItem>
          <VbenDescriptionsItem label="生效日期">
            {{ document.effectiveDate ?? '-' }}
          </VbenDescriptionsItem>
          <VbenDescriptionsItem label="版本">
            {{ document.version ?? '-' }}
          </VbenDescriptionsItem>
          <VbenDescriptionsItem label="标签">
            <div v-if="document.tags.length" class="flex flex-wrap gap-2">
              <span
                v-for="tag in document.tags"
                :key="tag"
                class="inline-flex items-center rounded-md border border-border bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground"
              >
                {{ tag }}
              </span>
            </div>
            <span v-else>-</span>
          </VbenDescriptionsItem>
          <VbenDescriptionsItem label="创建时间">
            {{ formatDate(document.createdAt) }}
          </VbenDescriptionsItem>
          <VbenDescriptionsItem label="更新时间">
            {{ formatDate(document.updatedAt) }}
          </VbenDescriptionsItem>
        </VbenDescriptions>

        <div class="mt-5 flex flex-wrap gap-2">
          <VbenButton
            :disabled="!document.originalFileName || actionLoading"
            @click="previewVisible = true"
          >
            预览文件
          </VbenButton>
          <VbenButton
            v-if="canParseDocument"
            :disabled="document.status !== 'uploaded' || actionLoading"
            :loading="actionLoading" variant="secondary"
            @click="handleExtract"
          >
            解析文档
          </VbenButton>
          <VbenButton
            v-if="canIndexDocument"
            :disabled="!canIndex || actionLoading"
            :loading="actionLoading" variant="secondary"
            @click="handleIndex"
          >
            {{ indexButtonText }}
          </VbenButton>
          <VbenButton
            v-if="canDeleteDocument"
            :disabled="actionLoading"
            :loading="actionLoading" variant="destructive"
            @click="handleDelete"
          >
            删除文档
          </VbenButton>
        </div>

        <FilePreviewDialog v-model="previewVisible" :document="document" />
      </template>
    </div>
  </Page>
</template>
