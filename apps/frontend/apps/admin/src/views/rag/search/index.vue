<script lang="ts" setup>
import type { SearchResult } from '#/api/rag';

import { computed, ref } from 'vue';
import { useRouter } from 'vue-router';

import { Page, VbenButton, VbenSelect } from '@vben/common-ui';

import {
  ElEmpty,
  ElInput,
  ElPagination,
} from 'element-plus';

import { searchDocuments } from '#/api/rag';

const router = useRouter();
const query = ref('');
const loading = ref(false);
const results = ref<SearchResult[]>([]);
const currentQuery = ref('');
const page = ref(1);
const pageSize = ref(20);
const sortOrder = ref<'asc' | 'desc'>('desc');
const sortOptions = [
  { label: '相关度从高到低', value: 'desc' },
  { label: '相关度从低到高', value: 'asc' },
];

const sortedResults = computed(() =>
  [...results.value].sort((left, right) =>
    sortOrder.value === 'desc'
      ? right.score - left.score
      : left.score - right.score,
  ),
);

const pagedResults = computed(() => {
  const start = (page.value - 1) * pageSize.value;
  return sortedResults.value.slice(start, start + pageSize.value);
});

async function handleSearch() {
  const keyword = query.value.trim();
  if (!keyword) {
    return;
  }

  loading.value = true;
  currentQuery.value = keyword;
  page.value = 1;
  try {
    const response = await searchDocuments({ query: keyword, topK: 20 });
    results.value = response.results;
  } finally {
    loading.value = false;
  }
}

function openDocument(result: SearchResult) {
  router.push(`/rag/documents/${result.documentId}`);
}

function matchTypeLabel(result: SearchResult) {
  if (result.matchType === 'hybrid') return '混合匹配';
  if (result.matchType === 'keyword') return '关键词匹配';
  return '语义匹配';
}

function matchTypeTagClass(result: SearchResult) {
  if (result.matchType === 'hybrid') {
    return 'border-emerald-500/30 bg-emerald-500 text-white';
  }
  if (result.matchType === 'keyword') {
    return 'border-amber-500/30 bg-amber-500 text-white';
  }
  return 'border-primary/30 bg-primary text-primary-foreground';
}

function formatPrimaryScore(result: SearchResult) {
  if (result.matchType === 'keyword') {
    const score = result.scores?.keyword ?? 0;
    return score >= 1 ? '精确命中' : score.toFixed(2);
  }

  return `${((result.scores?.vector ?? 0) * 100).toFixed(1)}%`;
}
</script>

<template>
  <Page description="跨文档检索法律条文、章节路径和相关片段" title="语义检索">
    <div class="bg-card mb-4 rounded-lg border border-border p-4 shadow-sm">
      <div class="flex gap-3">
        <ElInput
          v-model="query"
          clearable
          placeholder="输入关键词、法条、主题或案由" size="large"
          @keyup.enter="handleSearch"
        />
        <VbenButton
          :loading="loading" size="lg"
          @click="handleSearch"
        >
          搜索
        </VbenButton>
      </div>
    </div>

    <div
      v-if="currentQuery"
      class="mb-4 flex items-center justify-between text-sm text-muted-foreground"
    >
      <span>搜索“{{ currentQuery }}”找到 {{ results.length }} 条结果</span>
      <div class="flex items-center gap-2">
        <span>排序</span>
        <VbenSelect v-model="sortOrder" class="w-42" :options="sortOptions" />
      </div>
    </div>

    <div v-loading="loading" class="grid gap-3">
      <ElEmpty v-if="!pagedResults.length" description="暂无搜索结果" />
      <div
        v-for="result in pagedResults"
        :key="result.chunkId"
        class="bg-card cursor-pointer rounded-lg border border-border p-5 shadow-sm transition hover:border-primary"
        @click="openDocument(result)"
      >
        <div class="grid gap-4 md:grid-cols-[1fr_140px]">
          <div class="min-w-0">
            <div class="mb-2 flex flex-wrap items-center gap-2">
              <span
                class="inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-medium"
                :class="matchTypeTagClass(result)"
              >
                {{ matchTypeLabel(result) }}
              </span>
              <span
                v-if="result.articleNo"
                class="inline-flex items-center rounded-md border border-amber-500/30 bg-amber-500/10 px-2 py-0.5 text-xs font-medium text-amber-600 dark:text-amber-300"
              >
                {{ result.articleNo }}
              </span>
              <span
                v-if="result.sectionPath"
                class="inline-flex items-center rounded-md border border-sky-500/30 bg-sky-500/10 px-2 py-0.5 text-xs font-medium text-sky-600 dark:text-sky-300"
              >
                {{ result.sectionPath }}
              </span>
            </div>
            <h3 class="mb-2 truncate text-base font-semibold">
              {{ result.title }}
            </h3>
            <p class="line-clamp-3 text-sm leading-6 text-muted-foreground">
              {{ result.content }}
            </p>
          </div>
          <div class="border-border flex flex-col justify-center border-l pl-4">
            <span class="text-xs text-muted-foreground">综合排序分</span>
            <strong class="mb-3 text-2xl text-primary">
              {{ (result.score * 100).toFixed(1) }}
            </strong>
            <span class="text-xs text-muted-foreground">
              {{ result.matchType === 'keyword' ? '关键词分' : '语义相似度' }}
            </span>
            <strong class="text-base">{{ formatPrimaryScore(result) }}</strong>
          </div>
        </div>
      </div>
    </div>

    <div v-if="sortedResults.length > pageSize" class="mt-4 flex justify-end">
      <ElPagination
        v-model:current-page="page"
        v-model:page-size="pageSize"
        :page-sizes="[20, 50]"
        :total="sortedResults.length"
        layout="total, sizes, prev, pager, next"
      />
    </div>
  </Page>
</template>
