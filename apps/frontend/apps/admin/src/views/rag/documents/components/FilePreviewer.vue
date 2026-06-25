<script lang="ts" setup>
import { computed } from 'vue';

import {
  fallbackPlugin,
  imagePlugin,
  officePlugin,
  pdfPlugin,
  textPlugin,
} from '@open-file-viewer/core';
import type { PreviewToolbarOptions } from '@open-file-viewer/core';
import '@open-file-viewer/core/style.css';
import { OpenFileViewer } from '@open-file-viewer/vue';
import { VbenSpinner } from '@vben/common-ui';
import { IconifyIcon } from '@vben/icons';
import pdfWorkerSrc from 'pdfjs-dist/build/pdf.worker.mjs?url';

const props = withDefaults(
  defineProps<{
    emptyDescription?: string;
    file?: File;
    height?: string;
    loading?: boolean;
  }>(),
  {
    emptyDescription: '暂无可预览文件',
    height: '100%',
  },
);

const emit = defineEmits<{
  error: [error: Error];
}>();

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

const toolbar: PreviewToolbarOptions = {
  download: true,
  fullscreen: false,
  print: true,
  rotate: true,
  search: true,
  zoom: true,
  labels: {
    download: '下载',
    print: '打印',
    search: '搜索',
    'zoom-in': '放大',
    'zoom-out': '缩小',
    'zoom-reset': '重置',
    'rotate-right': '旋转',
  },
  order: [
    'search',
    'zoom-out',
    'zoom-reset',
    'zoom-in',
    'rotate-right',
    'print',
    'download',
  ],
  titles: {
    download: '下载当前文件',
    print: '打印当前文件',
    search: '搜索文件内容',
    'zoom-in': '放大预览',
    'zoom-out': '缩小预览',
    'zoom-reset': '重置缩放',
    'rotate-right': '顺时针旋转',
  },
};

const bodyStyle = computed(() => ({ height: props.height }));
</script>

<template>
  <div class="file-previewer" :style="bodyStyle">
    <div v-if="loading" class="file-previewer__state">
      <VbenSpinner spinning />
      <span>文件加载中</span>
    </div>
    <OpenFileViewer
      v-else-if="file"
      :file="file"
      :file-name="file.name"
      :height="height"
      :mime-type="file.type"
      :plugins="plugins"
      fallback="download"
      fit="contain"
      theme="auto"
      :toolbar="toolbar"
      width="100%"
      @error="emit('error', $event)"
    />
    <div v-else class="file-previewer__state file-previewer__empty">
      <IconifyIcon icon="lucide:file-search" />
      <span>{{ emptyDescription }}</span>
    </div>
  </div>
</template>

<style scoped>
.file-previewer {
  height: 100%;
  min-height: 420px;
  overflow: hidden;
  border: 1px solid hsl(var(--border));
  border-radius: 8px;
  background: hsl(var(--muted) / 42%);
}

.file-previewer__state {
  display: grid;
  height: 100%;
  min-height: 0;
  place-items: center;
  align-content: center;
  gap: 12px;
  color: hsl(var(--muted-foreground));
  font-size: 14px;
}

.file-previewer__empty :deep(svg) {
  width: 34px;
  height: 34px;
  opacity: 0.58;
}

.file-previewer :deep(.ofv-host) {
  display: grid;
  height: 100%;
  min-height: 0;
  grid-template-rows: auto minmax(0, 1fr);
}

.file-previewer :deep(.ofv-toolbar) {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
  border-bottom: 1px solid hsl(var(--border));
  background: hsl(var(--background));
  padding: 8px 10px;
}

.file-previewer :deep(.ofv-toolbar button) {
  display: inline-flex;
  min-height: 30px;
  align-items: center;
  justify-content: center;
  gap: 5px;
  border: 1px solid hsl(var(--border));
  border-radius: 7px;
  background: hsl(var(--card));
  padding: 0 10px;
  color: hsl(var(--foreground));
  font-size: 12px;
  font-weight: 600;
  line-height: 1;
  transition:
    background-color 0.16s ease,
    border-color 0.16s ease,
    color 0.16s ease;
}

.file-previewer :deep(.ofv-toolbar button:hover:not(:disabled)) {
  border-color: hsl(var(--primary) / 45%);
  background: hsl(var(--primary) / 9%);
  color: hsl(var(--primary));
}

.file-previewer :deep(.ofv-toolbar button:disabled) {
  cursor: not-allowed;
  opacity: 0.48;
}

.file-previewer :deep(.ofv-toolbar-icon) {
  width: 14px;
  height: 14px;
}

.file-previewer :deep(.ofv-toolbar-label) {
  max-width: 72px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.file-previewer :deep(.ofv-toolbar-search) {
  display: inline-flex;
  min-height: 30px;
  align-items: center;
  gap: 6px;
  border: 1px solid hsl(var(--border));
  border-radius: 7px;
  background: hsl(var(--card));
  padding: 0 8px;
}

.file-previewer :deep(.ofv-toolbar-search input) {
  width: 150px;
  min-width: 0;
  border: 0;
  background: transparent;
  color: hsl(var(--foreground));
  font-size: 12px;
  outline: none;
}

.file-previewer :deep(.ofv-toolbar-search-count) {
  color: hsl(var(--muted-foreground));
  font-size: 12px;
}

.file-previewer :deep(.ofv-viewport) {
  min-height: 0;
}
</style>
