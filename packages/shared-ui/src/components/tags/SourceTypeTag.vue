<script setup lang="ts">
import type { KnowledgeDocumentSourceType } from '@repo/shared-types';

import { computed } from 'vue';

import { ElTag } from 'element-plus';

import { getDocumentSourceTypeConfig } from '../../utils/documentMeta';

const props = defineProps<{
  sourceType: KnowledgeDocumentSourceType;
}>();

const config = computed(() => getDocumentSourceTypeConfig(props.sourceType));
</script>

<template>
  <ElTag :type="config.type" size="small" effect="plain">
    {{ config.label }}
  </ElTag>
</template>
