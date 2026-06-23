<script setup lang="ts">
import { ElEmpty, ElTag } from 'element-plus'
import type { SearchResult } from '@repo/shared-type'

defineProps<{
  results: SearchResult[]
  loading?: boolean
}>()

const emit = defineEmits<{
  click: [result: SearchResult]
}>()

function formatRRFScore(score: number) {
  return `${(score * 100).toFixed(1)}`
}

function formatVectorScore(score: number) {
  return `${(score * 100).toFixed(1)}%`
}

function formatKeywordScore(score: number) {
  return score >= 1 ? '精确命中' : score.toFixed(2)
}

function matchTypeLabel(result: SearchResult) {
  if (result.matchType === 'hybrid') return '混合匹配'
  if (result.matchType === 'keyword') return '关键词匹配'
  return '语义匹配'
}

function matchTypeTagType(result: SearchResult) {
  if (result.matchType === 'hybrid') return 'success'
  if (result.matchType === 'keyword') return 'warning'
  return 'primary'
}

function scoreTitle(result: SearchResult) {
  return result.matchType === 'keyword' ? '关键词分' : '语义相似度'
}

function scoreValue(result: SearchResult) {
  if (result.matchType === 'keyword') {
    return formatKeywordScore(result.scores?.keyword ?? 0)
  }

  return formatVectorScore(result.scores?.vector ?? 0)
}
</script>

<template>
  <div v-loading="loading" class="result-list">
    <ElEmpty v-if="!results.length" description="暂无搜索结果" />
    <button
      v-for="result in results"
      :key="result.chunkId"
      class="result-item"
      type="button"
      @click="emit('click', result)"
    >
      <div class="result-content">
        <h3>{{ result.title }}</h3>
        <p>{{ result.content }}</p>
        <div class="result-meta">
          <ElTag size="small" :type="matchTypeTagType(result)" effect="dark">
            {{ matchTypeLabel(result) }}
          </ElTag>
          <ElTag v-if="result.sectionPath" size="small" type="info" effect="plain">
            {{ result.sectionPath }}
          </ElTag>
          <ElTag v-if="result.articleNo" size="small" type="warning" effect="plain">
            {{ result.articleNo }}
          </ElTag>
        </div>
      </div>
      <div class="score-box">
        <span>RRF综合得分</span>
        <strong>{{ formatRRFScore(result.score) }}</strong>
        <span>{{ scoreTitle(result) }}</span>
        <strong :class="{ 'score-box__text': result.matchType === 'keyword' }">
          {{ scoreValue(result) }}
        </strong>
      </div>
    </button>
  </div>
</template>

<style scoped>
.result-list {
  display: grid;
  gap: 12px;
}

.result-item {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 92px;
  gap: 18px;
  width: 100%;
  padding: 18px 20px;
  text-align: left;
  border: 1px solid #e5eaf2;
  border-radius: 8px;
  background: #ffffff;
  box-shadow: 0 10px 26px rgba(27, 39, 66, 0.04);
  transition:
    border-color 0.16s ease,
    box-shadow 0.16s ease,
    transform 0.16s ease;
}

.result-item:hover {
  border-color: #b9cdf8;
  box-shadow: 0 16px 34px rgba(37, 99, 235, 0.1);
  transform: translateY(-1px);
}

.result-content {
  min-width: 0;
}

.result-content h3 {
  margin: 0 0 7px;
  overflow: hidden;
  color: #1f2a44;
  font-size: 15px;
  font-weight: 750;
  line-height: 1.35;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.result-content p {
  display: -webkit-box;
  margin: 0;
  overflow: hidden;
  color: #344054;
  font-size: 14px;
  line-height: 1.65;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
}

.result-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 10px;
}

.score-box {
  display: grid;
  align-content: center;
  justify-items: end;
  border-left: 1px solid #edf1f7;
  padding-left: 18px;
}

.score-box span {
  color: #667085;
  font-size: 12px;
  font-weight: 650;
}

.score-box strong {
  margin-top: 2px;
  color: #2563eb;
  font-size: 22px;
  font-weight: 780;
  line-height: 1.1;
}

.score-box__text {
  font-size: 14px !important;
  color: #b45309 !important;
  white-space: nowrap;
}

@media (max-width: 700px) {
  .result-item {
    grid-template-columns: 1fr;
  }

  .score-box {
    justify-items: start;
    border-left: 0;
    border-top: 1px solid #edf1f7;
    padding-top: 12px;
    padding-left: 0;
  }
}
</style>
