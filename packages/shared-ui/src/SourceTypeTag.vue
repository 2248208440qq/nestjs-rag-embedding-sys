<script setup lang="ts">
import { ElTag } from 'element-plus'
import type { KnowledgeDocumentSourceType } from '@repo/shared-types'

const props = defineProps<{
  sourceType: KnowledgeDocumentSourceType
}>()

const sourceConfig: Record<KnowledgeDocumentSourceType, { label: string; type: 'primary' | 'success' | 'warning' | 'danger' | 'info' }> = {
  law: { label: '法律', type: 'primary' },
  judicial_interpretation: { label: '司法解释', type: 'success' },
  case: { label: '案例', type: 'warning' },
  contract: { label: '合同', type: 'info' },
  internal: { label: '内部文档', type: 'danger' },
  other: { label: '其他', type: 'info' },
}

const config = sourceConfig[props.sourceType] ?? { label: props.sourceType, type: 'info' as const }
</script>

<template>
  <ElTag :type="config.type" size="small" effect="plain">
    {{ config.label }}
  </ElTag>
</template>
