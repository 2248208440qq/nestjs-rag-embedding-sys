<script setup lang="ts">
import { ElButton, ElEmpty, ElSpace, ElTable, ElTableColumn } from 'element-plus'
import { Delete, Document, Search, View } from '@element-plus/icons-vue'
import StatusTag from './StatusTag.vue'
import SourceTypeTag from './SourceTypeTag.vue'
import type { KnowledgeDocument } from '@repo/shared-type'

defineProps<{
  documents: KnowledgeDocument[]
  loading?: boolean
  actionLoadingIds?: string[]
  actionLoadingType?: 'extract' | 'index' | 'delete'
}>()

const emit = defineEmits<{
  view: [document: KnowledgeDocument]
  extract: [id: string]
  index: [id: string]
  delete: [document: KnowledgeDocument]
}>()

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleString('zh-CN')
}

function canIndex(document: KnowledgeDocument) {
  return document.status === 'parsed' || document.status === 'indexed'
}

function indexLabel(document: KnowledgeDocument) {
  return document.status === 'indexed' ? '更新索引' : '索引'
}

function isActionLoading(
  document: KnowledgeDocument,
  loadingIds: string[] | undefined,
  loadingType: 'extract' | 'index' | 'delete' | undefined,
  type: 'extract' | 'index' | 'delete',
) {
  return loadingType === type && Boolean(loadingIds?.includes(document.id))
}

function isRowBusy(document: KnowledgeDocument, loadingIds: string[] | undefined) {
  return Boolean(loadingIds?.includes(document.id))
}
</script>

<template>
  <ElTable v-loading="loading" :data="documents" stripe class="document-table">
    <ElTableColumn prop="title" label="标题" min-width="260" show-overflow-tooltip />
    <ElTableColumn label="来源类型" width="120" align="center">
      <template #default="{ row }">
        <SourceTypeTag :source-type="row.sourceType" />
      </template>
    </ElTableColumn>
    <ElTableColumn label="状态" width="110" align="center">
      <template #default="{ row }">
        <StatusTag :status="row.status" />
      </template>
    </ElTableColumn>
    <ElTableColumn prop="authority" label="发布机关" width="170" show-overflow-tooltip />
    <ElTableColumn label="标签" width="190">
      <template #default="{ row }">
        <ElSpace wrap :size="6">
          <span
            v-for="tag in row.tags?.slice(0, 3)"
            :key="tag"
            class="tag-chip"
          >
            {{ tag }}
          </span>
          <span v-if="row.tags?.length > 3" class="text-xs text-gray-400">
            +{{ row.tags.length - 3 }}
          </span>
          <span v-if="!row.tags?.length" class="text-xs text-gray-400">-</span>
        </ElSpace>
      </template>
    </ElTableColumn>
    <ElTableColumn label="更新时间" width="180">
      <template #default="{ row }">
        {{ formatDate(row.updatedAt) }}
      </template>
    </ElTableColumn>
    <ElTableColumn label="操作" width="340" fixed="right" align="center">
      <template #default="{ row }">
        <ElSpace :size="6">
          <ElButton
            size="small"
            :icon="View"
            :disabled="isRowBusy(row as KnowledgeDocument, actionLoadingIds)"
            @click="emit('view', row as KnowledgeDocument)"
          >
            查看
          </ElButton>
          <ElButton
            size="small"
            :icon="Document"
            type="warning"
            :loading="isActionLoading(row as KnowledgeDocument, actionLoadingIds, actionLoadingType, 'extract')"
            :disabled="row.status !== 'uploaded' || isRowBusy(row as KnowledgeDocument, actionLoadingIds)"
            @click="emit('extract', (row as KnowledgeDocument).id)"
          >
            解析
          </ElButton>
          <ElButton
            size="small"
            :icon="Search"
            type="success"
            :loading="isActionLoading(row as KnowledgeDocument, actionLoadingIds, actionLoadingType, 'index')"
            :disabled="!canIndex(row as KnowledgeDocument) || isRowBusy(row as KnowledgeDocument, actionLoadingIds)"
            @click="emit('index', (row as KnowledgeDocument).id)"
          >
            {{ indexLabel(row as KnowledgeDocument) }}
          </ElButton>
          <ElButton
            size="small"
            :icon="Delete"
            type="danger"
            plain
            :loading="isActionLoading(row as KnowledgeDocument, actionLoadingIds, actionLoadingType, 'delete')"
            :disabled="isRowBusy(row as KnowledgeDocument, actionLoadingIds)"
            @click="emit('delete', row as KnowledgeDocument)"
          >
            删除
          </ElButton>
        </ElSpace>
      </template>
    </ElTableColumn>
    <template #empty>
      <ElEmpty description="暂无文档" />
    </template>
  </ElTable>
</template>

<style scoped>
.document-table {
  width: 100%;
}

.tag-chip {
  display: inline-flex;
  align-items: center;
  min-height: 22px;
  border: 1px solid #e5eaf2;
  border-radius: 6px;
  background: #f8fafc;
  padding: 0 8px;
  color: #667085;
  font-size: 12px;
  font-weight: 650;
}
</style>
