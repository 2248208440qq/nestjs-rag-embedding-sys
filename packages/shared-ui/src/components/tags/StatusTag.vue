<script setup lang="ts">
import type { KnowledgeDocumentStatus } from '@repo/shared-types';

import { computed } from 'vue';

import { ElTag } from 'element-plus';

import { getDocumentStatusConfig } from '../../utils/documentMeta';

const props = defineProps<{
  status: KnowledgeDocumentStatus;
}>();

const config = computed(() => getDocumentStatusConfig(props.status));
</script>

<template>
  <ElTag :type="config.type" size="small" effect="light">
    {{ config.label }}
  </ElTag>
</template>
