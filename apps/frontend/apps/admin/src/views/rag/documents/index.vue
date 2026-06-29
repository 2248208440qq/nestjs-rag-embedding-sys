<script lang="ts" setup>
import type {
  KnowledgeDocument,
  KnowledgeDocumentSourceType,
} from '#/api/rag';

import { computed, onMounted, reactive, ref } from 'vue';
import { useRouter } from 'vue-router';

import { Page, VbenButton } from '@vben/common-ui';
import { useAccess } from '@vben/access';

import {
  ElCard,
  ElDialog,
  ElForm,
  ElFormItem,
  ElInput,
  ElMessage,
  ElMessageBox,
  ElOption,
  ElSelect,
  ElSpace,
  ElTable,
  ElTableColumn,
  ElTag,
  ElUpload,
} from 'element-plus';
import { genFileId } from 'element-plus';
import type { UploadInstance, UploadRawFile, UploadUserFile } from 'element-plus';

import {
  deleteDocument,
  extractDocument,
  fetchDocuments,
  indexDocument,
  uploadDocument,
} from '#/api/rag';
import { RAG_PERMISSIONS } from '#/constants/permissions';
import { useIndexJobMonitor } from '#/composables/rag/use-index-job-monitor';

const router = useRouter();
const { hasAccessByCodes } = useAccess();
const documents = ref<KnowledgeDocument[]>([]);
const loading = ref(false);
const uploadDialogVisible = ref(false);
const uploading = ref(false);
const selectedFile = ref<File>();
const fileList = ref<UploadUserFile[]>([]);
const uploadRef = ref<UploadInstance>();
const actionLoadingId = ref('');
const actionLoadingType = ref<'delete' | 'extract' | 'index'>();
const { watch: watchJob } = useIndexJobMonitor();
const uploadForm = reactive({
  sourceType: '' as '' | KnowledgeDocumentSourceType,
  title: '',
});

const indexedCount = computed(
  () => documents.value.filter((item) => item.status === 'indexed').length,
);
const parsedCount = computed(
  () => documents.value.filter((item) => item.status === 'parsed').length,
);
const canUploadDocument = computed(() =>
  hasAccessByCodes([RAG_PERMISSIONS.document.upload]),
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

const sourceTypeLabels: Record<KnowledgeDocumentSourceType, string> = {
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
  indexing: '索引中',
  parsed: '已解析',
  parsing: '解析中',
  uploaded: '已上传',
};

async function loadDocuments() {
  loading.value = true;
  try {
    documents.value = await fetchDocuments();
  } finally {
    loading.value = false;
  }
}

function canIndex(document: KnowledgeDocument) {
  return document.status === 'parsed' || document.status === 'indexed';
}

function asDocument(row: unknown) {
  return row as KnowledgeDocument;
}

function isActionLoading(document: KnowledgeDocument, type: typeof actionLoadingType.value) {
  return actionLoadingId.value === document.id && actionLoadingType.value === type;
}

function resetUpload() {
  uploadForm.title = '';
  uploadForm.sourceType = '';
  selectedFile.value = undefined;
  fileList.value = [];
  uploadRef.value?.clearFiles();
}

function handleFileChange(file: { raw?: File }) {
  selectedFile.value = file.raw;
}

function handleFileExceed(files: File[]) {
  const [file] = files;
  if (!file) return;
  uploadRef.value?.clearFiles();
  const rawFile = file as UploadRawFile;
  rawFile.uid = genFileId();
  uploadRef.value?.handleStart(rawFile);
  selectedFile.value = file;
}

async function handleUpload() {
  if (!selectedFile.value) {
    ElMessage.warning('请选择文件');
    return;
  }

  uploading.value = true;
  try {
    await uploadDocument(selectedFile.value, {
      sourceType: uploadForm.sourceType || undefined,
      title: uploadForm.title || undefined,
    });
    ElMessage.success('上传成功');
    uploadDialogVisible.value = false;
    resetUpload();
    await loadDocuments();
  } finally {
    uploading.value = false;
  }
}

async function runAction(
  document: KnowledgeDocument,
  type: 'delete' | 'extract' | 'index',
  action: () => Promise<void>,
) {
  if (actionLoadingId.value) return;
  actionLoadingId.value = document.id;
  actionLoadingType.value = type;
  try {
    await action();
  } finally {
    actionLoadingId.value = '';
    actionLoadingType.value = undefined;
  }
}

async function handleExtract(document: KnowledgeDocument) {
  await runAction(document, 'extract', async () => {
    const response = await extractDocument(document.id);
    ElMessage.success('解析任务已创建');
    void watchJob(response.job.id, () => loadDocuments());
    await loadDocuments();
  });
}

async function handleIndex(document: KnowledgeDocument) {
  await runAction(document, 'index', async () => {
    const response = await indexDocument(document.id);
    ElMessage.success(document.status === 'indexed' ? '更新索引任务已创建' : '创建索引任务已创建');
    void watchJob(response.job.id, () => loadDocuments());
    await loadDocuments();
  });
}

async function handleDelete(document: KnowledgeDocument) {
  await ElMessageBox.confirm(
    `确定删除「${document.title}」吗？对应索引记录和本地上传文件会一并清空。`,
    '删除文档',
    { type: 'warning' },
  );
  await runAction(document, 'delete', async () => {
    const response = await deleteDocument(document.id);
    ElMessage.success('删除任务已创建');
    void watchJob(response.job.id, () => loadDocuments());
    await loadDocuments();
  });
}

function formatDate(date?: string) {
  return date ? new Date(date).toLocaleString('zh-CN') : '-';
}

function formatSize(size?: number) {
  return size ? `${(size / 1024).toFixed(1)} KB` : '-';
}

onMounted(loadDocuments);
</script>

<template>
  <Page description="管理法律文本、抽取内容并构建可检索索引" title="文档管理">
    <div class="mb-4 grid gap-4 md:grid-cols-3">
      <ElCard shadow="never">
        <div class="text-sm text-muted-foreground">文档总数</div>
        <div class="mt-2 text-2xl font-semibold">{{ documents.length }}</div>
      </ElCard>
      <ElCard shadow="never">
        <div class="text-sm text-muted-foreground">已索引</div>
        <div class="mt-2 text-2xl font-semibold text-success">{{ indexedCount }}</div>
      </ElCard>
      <ElCard shadow="never">
        <div class="text-sm text-muted-foreground">待索引</div>
        <div class="mt-2 text-2xl font-semibold text-warning">{{ parsedCount }}</div>
      </ElCard>
    </div>

    <ElCard shadow="never">
      <template #header>
        <div class="flex items-center justify-between">
          <span>知识文档</span>
          <ElSpace>
            <VbenButton :loading="loading" @click="loadDocuments">刷新</VbenButton>
            <VbenButton v-if="canUploadDocument" @click="uploadDialogVisible = true">
              上传文档
            </VbenButton>
          </ElSpace>
        </div>
      </template>

      <ElTable v-loading="loading" :data="documents" stripe>
        <ElTableColumn label="标题" min-width="260" prop="title" show-overflow-tooltip />
        <ElTableColumn label="来源" width="130">
          <template #default="{ row }">
            <ElTag effect="plain">
              {{ sourceTypeLabels[asDocument(row).sourceType] }}
            </ElTag>
          </template>
        </ElTableColumn>
        <ElTableColumn label="状态" width="110">
          <template #default="{ row }">
            <ElTag
              :type="asDocument(row).status === 'indexed' ? 'success' : asDocument(row).status === 'failed' ? 'danger' : 'warning'"
            >
              {{ statusLabels[asDocument(row).status] }}
            </ElTag>
          </template>
        </ElTableColumn>
        <ElTableColumn label="大小" width="110">
          <template #default="{ row }">{{ formatSize(asDocument(row).size) }}</template>
        </ElTableColumn>
        <ElTableColumn label="更新时间" width="180">
          <template #default="{ row }">{{ formatDate(asDocument(row).updatedAt) }}</template>
        </ElTableColumn>
        <ElTableColumn align="center" fixed="right" label="操作" width="330">
          <template #default="{ row }">
            <ElSpace>
              <VbenButton size="sm" @click="router.push(`/rag/documents/${asDocument(row).id}`)">
                查看
              </VbenButton>
              <VbenButton
                v-if="canParseDocument"
                :disabled="asDocument(row).status !== 'uploaded' || Boolean(actionLoadingId)"
                :loading="isActionLoading(asDocument(row), 'extract')" size="sm" variant="secondary"
                @click="handleExtract(asDocument(row))"
              >
                解析
              </VbenButton>
              <VbenButton
                v-if="canIndexDocument"
                :disabled="!canIndex(asDocument(row)) || Boolean(actionLoadingId)"
                :loading="isActionLoading(asDocument(row), 'index')" size="sm" variant="secondary"
                @click="handleIndex(asDocument(row))"
              >
                {{ asDocument(row).status === 'indexed' ? '更新索引' : '索引' }}
              </VbenButton>
              <VbenButton
                v-if="canDeleteDocument"
                :disabled="Boolean(actionLoadingId)"
                :loading="isActionLoading(asDocument(row), 'delete')" size="sm" variant="destructive"
                @click="handleDelete(asDocument(row))"
              >
                删除
              </VbenButton>
            </ElSpace>
          </template>
        </ElTableColumn>
      </ElTable>
    </ElCard>

    <ElDialog
      v-model="uploadDialogVisible"
      title="上传文档"
      width="520px"
      @close="resetUpload"
    >
      <ElForm label-width="88px">
        <ElFormItem label="标题">
          <ElInput v-model="uploadForm.title" placeholder="可选，默认使用文件名" />
        </ElFormItem>
        <ElFormItem label="来源类型">
          <ElSelect v-model="uploadForm.sourceType" clearable placeholder="可选">
            <ElOption label="法律" value="law" />
            <ElOption label="司法解释" value="judicial_interpretation" />
            <ElOption label="案例" value="case" />
            <ElOption label="合同" value="contract" />
            <ElOption label="内部文档" value="internal" />
            <ElOption label="其他" value="other" />
          </ElSelect>
        </ElFormItem>
        <ElFormItem label="文件">
          <ElUpload
            ref="uploadRef"
            v-model:file-list="fileList"
            :auto-upload="false"
            :limit="1"
            action="#"
            drag
            name="file"
            @change="handleFileChange"
            @exceed="handleFileExceed"
            @remove="selectedFile = undefined"
          >
            <VbenButton>选择文件</VbenButton>
            <template #tip>
              <div class="text-xs text-muted-foreground">
                支持 pdf、docx、txt、md、html 等格式，最大 50MB
              </div>
            </template>
          </ElUpload>
        </ElFormItem>
      </ElForm>
      <template #footer>
        <VbenButton @click="uploadDialogVisible = false">取消</VbenButton>
        <VbenButton :disabled="!canUploadDocument" :loading="uploading" @click="handleUpload">
          确认上传
        </VbenButton>
      </template>
    </ElDialog>
  </Page>
</template>
