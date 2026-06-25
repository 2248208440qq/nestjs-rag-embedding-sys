<script setup lang="ts">
import type { KnowledgeDocument } from '@repo/shared-types';

import { ElDescriptions, ElDescriptionsItem, ElSpace, ElTag } from 'element-plus';

import SourceTypeTag from '../tags/SourceTypeTag.vue';
import StatusTag from '../tags/StatusTag.vue';

defineProps<{
  document: KnowledgeDocument;
}>();

function formatDate(dateStr: string | undefined) {
  if (!dateStr) return '-';
  return new Date(dateStr).toLocaleString('zh-CN');
}
</script>

<template>
  <ElDescriptions class="document-detail" :column="2" border>
    <ElDescriptionsItem label="标题" :span="2">{{ document.title }}</ElDescriptionsItem>
    <ElDescriptionsItem label="来源类型">
      <SourceTypeTag :source-type="document.sourceType" />
    </ElDescriptionsItem>
    <ElDescriptionsItem label="状态">
      <StatusTag :status="document.status" />
    </ElDescriptionsItem>
    <ElDescriptionsItem label="原始文件">{{ document.originalFileName ?? '-' }}</ElDescriptionsItem>
    <ElDescriptionsItem label="文件大小">
      {{ document.size ? `${(document.size / 1024).toFixed(1)} KB` : '-' }}
    </ElDescriptionsItem>
    <ElDescriptionsItem label="发布机关">{{ document.authority ?? '-' }}</ElDescriptionsItem>
    <ElDescriptionsItem label="管辖区域">{{ document.jurisdiction ?? '-' }}</ElDescriptionsItem>
    <ElDescriptionsItem label="发布日期">{{ document.publishDate ?? '-' }}</ElDescriptionsItem>
    <ElDescriptionsItem label="生效日期">{{ document.effectiveDate ?? '-' }}</ElDescriptionsItem>
    <ElDescriptionsItem label="版本">{{ document.version ?? '-' }}</ElDescriptionsItem>
    <ElDescriptionsItem label="标签" :span="2">
      <ElSpace wrap>
        <ElTag v-for="tag in document.tags" :key="tag" size="small">{{ tag }}</ElTag>
        <span v-if="!document.tags?.length" class="text-gray-400">无标签</span>
      </ElSpace>
    </ElDescriptionsItem>
    <ElDescriptionsItem label="创建时间">{{ formatDate(document.createdAt) }}</ElDescriptionsItem>
    <ElDescriptionsItem label="更新时间">{{ formatDate(document.updatedAt) }}</ElDescriptionsItem>
  </ElDescriptions>
</template>

<style scoped>
.document-detail :deep(.el-descriptions__label) {
  width: 120px;
  color: #667085;
  font-weight: 700;
}

.document-detail :deep(.el-descriptions__content) {
  color: #24324b;
}
</style>
