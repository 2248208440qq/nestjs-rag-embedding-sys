<script lang="ts" setup>
import type { QaResponse } from '#/api/rag';

import { ref, shallowRef } from 'vue';

import { Page, VbenButton } from '@vben/common-ui';

import {
  ElCard,
  ElEmpty,
  ElInput,
  ElSpace,
  ElTable,
  ElTableColumn,
  ElTag,
} from 'element-plus';

import { askLegalQuestion } from '#/api/rag';

const question = shallowRef('');
const loading = shallowRef(false);
const response = ref<QaResponse>();

async function handleAsk() {
  const value = question.value.trim();
  if (!value) return;

  loading.value = true;
  try {
    response.value = await askLegalQuestion({
      question: value,
      topK: 5,
    });
  } finally {
    loading.value = false;
  }
}
</script>

<template>
  <Page description="基于法律知识库检索结果生成带引用的问答草稿" title="法律问答">
    <ElCard class="mb-4" shadow="never">
      <ElSpace alignment="start" class="w-full" direction="vertical" fill>
        <ElInput
          v-model="question"
          :rows="4"
          placeholder="请输入法律问题，例如：贩卖野生动物如何处罚？"
          type="textarea"
          @keyup.ctrl.enter="handleAsk"
        />
        <div class="flex justify-end">
          <VbenButton :disabled="!question.trim()" :loading="loading" @click="handleAsk">
            生成答案
          </VbenButton>
        </div>
      </ElSpace>
    </ElCard>

    <ElCard v-if="response" class="mb-4" shadow="never">
      <template #header>
        <div class="flex items-center justify-between">
          <span>答案草稿</span>
          <ElTag v-if="response.retrievalTraceId" effect="plain">
            Trace: {{ response.retrievalTraceId }}
          </ElTag>
        </div>
      </template>
      <pre class="whitespace-pre-wrap rounded-md bg-muted p-4 text-sm leading-6">{{ response.answer }}</pre>
    </ElCard>

    <ElCard v-if="response" shadow="never">
      <template #header>引用来源</template>
      <ElTable :data="response.citations" stripe>
        <ElTableColumn label="文档" min-width="220" prop="title" show-overflow-tooltip />
        <ElTableColumn label="条文" width="120" prop="articleNo" />
        <ElTableColumn label="章节" min-width="180" prop="sectionPath" show-overflow-tooltip />
        <ElTableColumn label="Chunk ID" min-width="260" prop="chunkId" show-overflow-tooltip />
      </ElTable>
    </ElCard>

    <ElEmpty v-else description="输入问题后生成带引用的法律问答草稿" />
  </Page>
</template>
