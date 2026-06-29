<script lang="ts" setup>
import type { KnowledgeBase, QaResponse, SearchResult } from '#/api/rag';

import { computed, onMounted, shallowRef } from 'vue';

import { Page, VbenButton } from '@vben/common-ui';

import {
  ElAlert,
  ElCard,
  ElEmpty,
  ElInput,
  ElMessage,
  ElOption,
  ElSelect,
  ElSpace,
  ElTable,
  ElTableColumn,
  ElTag,
} from 'element-plus';

import { askLegalQuestion, fetchKnowledgeBases } from '#/api/rag';

const question = shallowRef('');
const loading = shallowRef(false);
const knowledgeBaseLoading = shallowRef(false);
const knowledgeBaseIds = shallowRef<string[]>([]);
const knowledgeBases = shallowRef<KnowledgeBase[]>([]);
const response = shallowRef<QaResponse>();

const hasCitationWarnings = computed(() => {
  return Boolean(response.value?.citationValidation?.warnings.length);
});

const sourceChunks = computed<SearchResult[]>(() => response.value?.sourceChunks ?? []);

onMounted(() => {
  void loadKnowledgeBases();
});

async function loadKnowledgeBases() {
  knowledgeBaseLoading.value = true;
  try {
    knowledgeBases.value = await fetchKnowledgeBases();
  } finally {
    knowledgeBaseLoading.value = false;
  }
}

async function handleAsk() {
  const value = question.value.trim();
  if (!value) return;

  loading.value = true;
  try {
    response.value = await askLegalQuestion({
      knowledgeBaseIds: knowledgeBaseIds.value.length
        ? knowledgeBaseIds.value
        : undefined,
      question: value,
      topK: 20,
    });
  } finally {
    loading.value = false;
  }
}

async function handleCopyAnswer() {
  if (!response.value?.answer) return;

  await navigator.clipboard.writeText(response.value.answer);
  ElMessage.success('答案已复制');
}
</script>

<template>
  <Page
    description="基于法律知识库检索结果生成带引用的问答草稿"
    title="法律问答"
  >
    <ElCard class="mb-4" shadow="never">
      <ElSpace alignment="start" class="w-full" direction="vertical" fill>
        <ElInput
          v-model="question"
          :rows="4"
          placeholder="请输入法律问题，例如：贩卖野生动物如何处罚？"
          type="textarea"
          @keyup.ctrl.enter="handleAsk"
        />

        <div class="flex flex-wrap items-center justify-between gap-3">
          <ElSelect
            v-model="knowledgeBaseIds"
            :loading="knowledgeBaseLoading"
            class="min-w-[280px] flex-1"
            clearable
            collapse-tags
            collapse-tags-tooltip
            multiple
            placeholder="全部知识库"
          >
            <ElOption
              v-for="item in knowledgeBases"
              :key="item.id"
              :label="item.name"
              :value="item.id"
            />
          </ElSelect>

          <VbenButton
            :disabled="!question.trim()"
            :loading="loading"
            @click="handleAsk"
          >
            生成答案
          </VbenButton>
        </div>
      </ElSpace>
    </ElCard>

    <ElCard v-if="response" class="mb-4" shadow="never">
      <template #header>
        <div class="flex flex-wrap items-center justify-between gap-3">
          <div class="flex flex-wrap items-center gap-2">
            <span>答案草稿</span>
            <ElTag v-if="response.modelInfo" effect="plain" type="success">
              模型：{{ response.modelInfo.model }}
            </ElTag>
            <ElTag v-else effect="plain" type="info">模型未启用</ElTag>
            <ElTag v-if="response.fallbackUsed" type="warning">
              Fallback
            </ElTag>
            <ElTag
              v-if="response.citationValidation"
              :type="response.citationValidation.passed ? 'success' : 'warning'"
              effect="plain"
            >
              引用校验：{{ response.citationValidation.passed ? '通过' : '需复核' }}
            </ElTag>
          </div>

          <div class="flex items-center gap-2">
            <ElTag v-if="response.retrievalTraceId" effect="plain">
              Trace: {{ response.retrievalTraceId }}
            </ElTag>
            <VbenButton size="sm" variant="outline" @click="handleCopyAnswer">
              复制答案
            </VbenButton>
          </div>
        </div>
      </template>

      <ElAlert
        v-if="hasCitationWarnings"
        :closable="false"
        class="mb-3"
        show-icon
        type="warning"
      >
        <template #title>
          {{ response.citationValidation?.warnings.join('；') }}
        </template>
      </ElAlert>

      <pre class="whitespace-pre-wrap rounded-md bg-muted p-4 text-sm leading-6">{{ response.answer }}</pre>
    </ElCard>

    <ElCard v-if="response" class="mb-4" shadow="never">
      <template #header>引用来源</template>
      <ElTable :data="response.citations" stripe>
        <ElTableColumn label="文档" min-width="220" prop="title" show-overflow-tooltip />
        <ElTableColumn label="条文" prop="articleNo" width="120" />
        <ElTableColumn label="章节" min-width="180" prop="sectionPath" show-overflow-tooltip />
        <ElTableColumn label="Chunk ID" min-width="260" prop="chunkId" show-overflow-tooltip />
      </ElTable>
    </ElCard>

    <ElCard v-if="response" shadow="never">
      <template #header>Source Chunks</template>
      <ElTable :data="sourceChunks" stripe>
        <ElTableColumn label="标题" min-width="220" prop="title" show-overflow-tooltip />
        <ElTableColumn label="分数" width="120">
          <template #default="{ row }">
            {{ Number(row.score ?? 0).toFixed(4) }}
          </template>
        </ElTableColumn>
        <ElTableColumn label="检索来源" width="120" prop="retrievalSource" />
        <ElTableColumn label="内容" min-width="360" prop="content" show-overflow-tooltip />
      </ElTable>
    </ElCard>

    <ElEmpty
      v-else
      description="输入问题后生成带引用的法律问答草稿"
    />
  </Page>
</template>
