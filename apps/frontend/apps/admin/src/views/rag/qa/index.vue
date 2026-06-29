<script lang="ts" setup>
import type { KnowledgeBase, QaCitation, QaResponse, SearchResult } from '#/api/rag';

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

const QA_TOP_K = 5;

const question = shallowRef('');
const loading = shallowRef(false);
const knowledgeBaseLoading = shallowRef(false);
const knowledgeBaseIds = shallowRef<string[]>([]);
const knowledgeBases = shallowRef<KnowledgeBase[]>([]);
const response = shallowRef<QaResponse>();

const hasCitationWarnings = computed(() => {
  return Boolean(response.value?.citationValidation?.warnings.length);
});

const selectedScopeLabel = computed(() => {
  return knowledgeBaseIds.value.length > 0
    ? `已选择 ${knowledgeBaseIds.value.length} 个知识库`
    : '全部知识库';
});

const sourceChunks = computed<SearchResult[]>(() => {
  return response.value?.sourceChunks ?? [];
});

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
      knowledgeBaseIds: knowledgeBaseIds.value.length ? knowledgeBaseIds.value : undefined,
      question: value,
      topK: QA_TOP_K,
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

function formatMatchType(type?: SearchResult['matchType']) {
  const labels: Record<NonNullable<SearchResult['matchType']>, string> = {
    hybrid: '混合',
    keyword: '关键词',
    vector: '语义',
  };

  return type ? labels[type] : '-';
}

function formatScore(score?: number) {
  return `${(Number(score ?? 0) * 100).toFixed(1)}%`;
}

function formatLocation(row: Pick<QaCitation, 'articleNo' | 'sectionPath'>) {
  const parts = [row.sectionPath, row.articleNo].filter(Boolean);
  return parts.length > 0 ? parts.join(' / ') : '-';
}
</script>

<template>
  <Page description="基于知识库检索结果生成带引用的法律问答草稿。" title="法律问答">
    <ElCard class="mb-4 qa-panel" shadow="never">
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

          <ElSpace wrap>
            <ElTag effect="plain" type="info">{{ selectedScopeLabel }}</ElTag>
            <ElTag effect="plain">引用 Top {{ QA_TOP_K }}</ElTag>
            <VbenButton :disabled="!question.trim()" :loading="loading" @click="handleAsk">
              生成答案
            </VbenButton>
          </ElSpace>
        </div>
      </ElSpace>
    </ElCard>

    <ElCard v-if="response" class="mb-4 qa-panel" shadow="never">
      <template #header>
        <div class="flex flex-wrap items-center justify-between gap-3">
          <div class="flex flex-wrap items-center gap-2">
            <span class="qa-section-title">答案草稿</span>
            <ElTag v-if="response.modelInfo" effect="plain" type="success">
              模型：{{ response.modelInfo.model }}
            </ElTag>
            <ElTag v-else effect="plain" type="info">模型未启用</ElTag>
            <ElTag v-if="response.fallbackUsed" type="warning"> 检索式 fallback </ElTag>
            <ElTag
              v-if="response.citationValidation"
              :type="response.citationValidation.passed ? 'success' : 'warning'"
              effect="plain"
            >
              引用校验：{{ response.citationValidation.passed ? '通过' : '需复核' }}
            </ElTag>
          </div>

          <div class="flex flex-wrap items-center gap-2">
            <ElTag v-if="response.retrievalTraceId" effect="plain">
              Trace: {{ response.retrievalTraceId }}
            </ElTag>
            <VbenButton size="sm" variant="outline" @click="handleCopyAnswer">
              复制答案
            </VbenButton>
          </div>
        </div>
      </template>

      <ElAlert v-if="hasCitationWarnings" :closable="false" class="mb-3" show-icon type="warning">
        <template #title>
          {{ response.citationValidation?.warnings.join('；') }}
        </template>
      </ElAlert>

      <pre class="qa-answer">{{ response.answer }}</pre>
    </ElCard>

    <ElCard v-if="response" class="mb-4 qa-panel" shadow="never">
      <template #header>
        <span class="qa-section-title">引用来源</span>
      </template>
      <ElTable :data="response.citations" stripe>
        <ElTableColumn label="文档" min-width="220" prop="title" show-overflow-tooltip />
        <ElTableColumn label="条文" prop="articleNo" width="120" />
        <ElTableColumn label="位置" min-width="220" show-overflow-tooltip>
          <template #default="{ row }">
            {{ formatLocation(row) }}
          </template>
        </ElTableColumn>
        <ElTableColumn label="Chunk ID" min-width="260" prop="chunkId" show-overflow-tooltip />
      </ElTable>
    </ElCard>

    <ElCard v-if="response" class="qa-panel" shadow="never">
      <template #header>
        <span class="qa-section-title">检索片段</span>
      </template>
      <ElTable :data="sourceChunks" stripe>
        <ElTableColumn label="标题" min-width="220" prop="title" show-overflow-tooltip />
        <ElTableColumn label="相关度" width="120">
          <template #default="{ row }">
            <span class="qa-score">{{ formatScore(row.score) }}</span>
          </template>
        </ElTableColumn>
        <ElTableColumn label="命中方式" width="120">
          <template #default="{ row }">
            {{ formatMatchType(row.matchType) }}
          </template>
        </ElTableColumn>
        <ElTableColumn label="位置" min-width="220" show-overflow-tooltip>
          <template #default="{ row }">
            {{ formatLocation(row) }}
          </template>
        </ElTableColumn>
        <ElTableColumn label="内容" min-width="360" prop="content" show-overflow-tooltip />
      </ElTable>
    </ElCard>

    <ElEmpty v-else description="输入问题后生成带引用的法律问答草稿" />
  </Page>
</template>

<style scoped>
.qa-panel {
  border-color: hsl(var(--border) / 80%);
}

.qa-section-title {
  font-weight: 600;
}

.qa-answer {
  margin: 0;
  white-space: pre-wrap;
  border-radius: 8px;
  background: hsl(var(--muted) / 80%);
  padding: 16px;
  font-size: 14px;
  line-height: 1.8;
}

.qa-score {
  color: hsl(var(--primary));
  font-weight: 600;
}
</style>
