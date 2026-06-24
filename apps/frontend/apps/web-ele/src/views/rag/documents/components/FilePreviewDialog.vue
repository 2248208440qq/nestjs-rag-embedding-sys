<script lang="ts" setup>
import type { KnowledgeDocument } from '#/api/rag';

import { computed, shallowRef, watch } from 'vue';

import {
  fallbackPlugin,
  imagePlugin,
  officePlugin,
  pdfPlugin,
  textPlugin,
} from '@open-file-viewer/core';
import '@open-file-viewer/core/style.css';
import { OpenFileViewer } from '@open-file-viewer/vue';
import { IconifyIcon } from '@vben/icons';
import pdfWorkerSrc from 'pdfjs-dist/build/pdf.worker.mjs?url';

import {
  ElButton,
  ElDialog,
  ElEmpty,
  ElMessage,
  ElSkeleton,
} from 'element-plus';

import { downloadDocumentFile } from '#/api/rag';

const props = defineProps<{
  document?: KnowledgeDocument;
}>();

const visible = defineModel<boolean>({ default: false });

const loading = shallowRef(false);
const fullscreen = shallowRef(false);
const previewFile = shallowRef<File>();

const plugins = [
  imagePlugin(),
  textPlugin(),
  pdfPlugin({
    useFetchData: true,
    workerSrc: pdfWorkerSrc,
  }),
  officePlugin({
    pdf: {
      useFetchData: true,
      workerSrc: pdfWorkerSrc,
    },
  }),
  fallbackPlugin(),
];

const fileName = computed(
  () => props.document?.originalFileName ?? props.document?.title ?? 'document',
);
const dialogWidth = computed(() => (fullscreen.value ? '100%' : '86%'));
const viewerHeight = computed(() =>
  fullscreen.value ? 'calc(100vh - 74px)' : '72vh',
);

function resetPreview() {
  loading.value = false;
  fullscreen.value = false;
  previewFile.value = undefined;
}

async function loadPreviewFile(document: KnowledgeDocument) {
  loading.value = true;
  previewFile.value = undefined;

  try {
    const blob = await downloadDocumentFile(document.id);
    previewFile.value = new File([blob], fileName.value, {
      type: document.mimeType || blob.type || 'application/octet-stream',
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : '文件加载失败';
    ElMessage.error(message);
    visible.value = false;
  } finally {
    loading.value = false;
  }
}

function handleViewerError(error: Error) {
  ElMessage.error(error.message || '文件预览失败');
}

watch(
  () => visible.value,
  (nextVisible) => {
    if (!nextVisible) {
      resetPreview();
      return;
    }

    if (props.document) {
      void loadPreviewFile(props.document);
    }
  },
);
</script>

<template>
  <ElDialog
    v-model="visible"
    append-to-body
    class="rag-file-preview-dialog"
    destroy-on-close
    :fullscreen="fullscreen"
    :show-close="false"
    :width="dialogWidth"
  >
    <template #header>
      <div class="preview-header">
        <div class="preview-title">
          <span class="preview-title-text">{{ fileName }}</span>
          <span class="preview-subtitle">原始文件预览</span>
        </div>
        <div class="preview-actions">
          <ElButton
            circle
            text
            title="全屏"
            @click="fullscreen = !fullscreen"
          >
            <IconifyIcon icon="lucide:maximize-2" />
          </ElButton>
          <ElButton circle text title="关闭" @click="visible = false">
            <IconifyIcon icon="lucide:x" />
          </ElButton>
        </div>
      </div>
    </template>

    <div class="preview-body" :style="{ height: viewerHeight }">
      <ElSkeleton v-if="loading" animated :rows="8" />
      <OpenFileViewer
        v-else-if="previewFile"
        :file="previewFile"
        :file-name="previewFile.name"
        :height="viewerHeight"
        :mime-type="previewFile.type"
        :plugins="plugins"
        fallback="download"
        fit="contain"
        theme="auto"
        :toolbar="{
          download: true,
          fullscreen: true,
          print: true,
          rotate: true,
          search: true,
          zoom: true,
        }"
        width="100%"
        @error="handleViewerError"
      />
      <ElEmpty v-else description="暂无可预览文件" />
    </div>
  </ElDialog>
</template>

<style scoped>
.preview-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
}

.preview-title {
  display: flex;
  min-width: 0;
  flex-direction: column;
  gap: 4px;
}

.preview-title-text {
  overflow: hidden;
  color: var(--el-text-color-primary);
  font-size: 15px;
  font-weight: 600;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.preview-subtitle {
  color: var(--el-text-color-secondary);
  font-size: 12px;
}

.preview-actions {
  display: inline-flex;
  flex: none;
  align-items: center;
  gap: 6px;
}

.preview-body {
  min-height: 420px;
  overflow: hidden;
  border: 1px solid var(--el-border-color-light);
  border-radius: 6px;
  background: var(--el-bg-color-page);
}
</style>
