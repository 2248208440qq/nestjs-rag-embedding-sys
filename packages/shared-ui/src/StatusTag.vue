<script setup lang="ts">
import { computed } from 'vue'
import { ElTag } from 'element-plus'
import type { KnowledgeDocumentStatus } from '@repo/shared-types'

const props = defineProps<{
  status: KnowledgeDocumentStatus
}>()

const statusConfig: Record<KnowledgeDocumentStatus, { label: string; type: 'success' | 'warning' | 'danger' | 'info' }> = {
  uploaded: { label: '已上传', type: 'info' },
  parsed: { label: '已解析', type: 'warning' },
  indexed: { label: '已索引', type: 'success' },
  failed: { label: '失败', type: 'danger' },
}

const config = computed(() => statusConfig[props.status] ?? { label: props.status, type: 'info' as const })
</script>

<template>
  <ElTag :type="config.type" size="small" effect="light">
    {{ config.label }}
  </ElTag>
</template>
