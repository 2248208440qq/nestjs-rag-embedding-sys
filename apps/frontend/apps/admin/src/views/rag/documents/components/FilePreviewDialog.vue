<script lang="ts" setup>
import type { KnowledgeDocument } from '#/api/rag';

import { computed, onBeforeUnmount, shallowRef, watch } from 'vue';

import { useVbenModal, VbenIconButton } from '@vben/common-ui';
import { IconifyIcon } from '@vben/icons';

import { ElMessage } from 'element-plus';

import { downloadDocumentFile } from '#/api/rag';

import FilePreviewer from './FilePreviewer.vue';

const props = defineProps<{
  document?: KnowledgeDocument;
}>();

const visible = defineModel<boolean>({ default: false });

const loading = shallowRef(false);
const previewFile = shallowRef<File>();
let loadToken = 0;

const [PreviewModal, previewModalApi] = useVbenModal({
  destroyOnClose: true,
  footer: false,
  fullscreenButton: true,
  onOpenChange(isOpen) {
    if (visible.value !== isOpen) {
      visible.value = isOpen;
    }

    if (!isOpen) {
      resetPreview();
    }
  },
});

const fileName = computed(
  () => props.document?.originalFileName ?? props.document?.title ?? 'document',
);
const modalTitle = computed(() => `文件预览：${fileName.value}`);
const viewerHeight = computed(() => '100%');
const fileTypeLabel = computed(() => {
  const mimeType = previewFile.value?.type || props.document?.mimeType;
  if (mimeType) return mimeType;

  const extension = fileName.value.split('.').pop();
  return extension ? `.${extension}` : '未知类型';
});
const fileSizeLabel = computed(() =>
  formatSize(previewFile.value?.size ?? props.document?.size),
);

function formatSize(size?: number) {
  if (!size) return '-';
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
  return `${(size / 1024 / 1024).toFixed(2)} MB`;
}

function resetPreview() {
  loadToken += 1;
  loading.value = false;
  previewFile.value = undefined;
}

async function loadPreviewFile(document: KnowledgeDocument) {
  const currentToken = ++loadToken;
  loading.value = true;
  previewFile.value = undefined;

  try {
    const blob = await downloadDocumentFile(document.id);
    if (currentToken !== loadToken || !visible.value) {
      return;
    }

    previewFile.value = new File([blob], fileName.value, {
      type: document.mimeType || blob.type || 'application/octet-stream',
    });
  } catch (error) {
    if (currentToken !== loadToken) {
      return;
    }

    const message = error instanceof Error ? error.message : '文件加载失败';
    ElMessage.error(message);
    visible.value = false;
  } finally {
    if (currentToken === loadToken) {
      loading.value = false;
    }
  }
}

function reloadPreview() {
  if (!props.document || loading.value) {
    return;
  }

  void loadPreviewFile(props.document);
}

function handleViewerError(error: Error) {
  ElMessage.error(error.message || '文件预览失败');
}

watch(
  () => visible.value,
  (nextVisible) => {
    if (nextVisible) {
      previewModalApi.open();
      return;
    }

    void previewModalApi.close();
  },
);

watch(
  () => [visible.value, props.document?.id] as const,
  ([nextVisible, documentId]) => {
    if (!nextVisible) {
      resetPreview();
      return;
    }

    if (!documentId || !props.document) {
      resetPreview();
      return;
    }

    void loadPreviewFile(props.document);
  },
);

onBeforeUnmount(resetPreview);
</script>

<template>
  <PreviewModal
    :title="modalTitle"
    class="rag-file-preview-modal h-[90vh] w-[86vw] max-w-[1280px]"
    content-class="overflow-hidden p-3"
  >
    <div class="preview-shell">
      <div class="preview-toolbar">
        <div class="preview-meta">
          <span class="preview-meta__title">原始文件预览</span>
          <span>{{ fileTypeLabel }}</span>
          <span>{{ fileSizeLabel }}</span>
        </div>
        <div class="preview-actions">
          <VbenIconButton
            :disabled="loading || !document"
            title="重新加载"
            variant="ghost"
            @click="reloadPreview"
          >
            <IconifyIcon icon="lucide:refresh-cw" />
          </VbenIconButton>
        </div>
      </div>

      <FilePreviewer
        :file="previewFile"
        :height="viewerHeight"
        :loading="loading"
        @error="handleViewerError"
      />
    </div>
  </PreviewModal>
</template>

<style scoped>
.preview-shell {
  display: grid;
  height: 100%;
  min-height: 0;
  grid-template-rows: auto minmax(0, 1fr);
  gap: 12px;
}

.preview-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  border: 1px solid hsl(var(--border));
  border-radius: 8px;
  background: hsl(var(--muted) / 36%);
  padding: 8px 10px 8px 12px;
}

.preview-meta {
  display: flex;
  min-width: 0;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
  color: hsl(var(--muted-foreground));
  font-size: 12px;
}

.preview-meta span:not(.preview-meta__title) {
  border-radius: 999px;
  background: hsl(var(--background));
  padding: 3px 8px;
}

.preview-meta__title {
  color: hsl(var(--foreground));
  font-size: 13px;
  font-weight: 600;
}

.preview-actions {
  display: inline-flex;
  flex: none;
  align-items: center;
}
</style>
