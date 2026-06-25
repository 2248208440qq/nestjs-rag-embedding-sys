<script lang="ts" setup>
import type { EvaluationCase, EvaluationRun } from '#/api/rag';

import { onMounted, reactive, ref, shallowRef } from 'vue';

import { Page, VbenButton } from '@vben/common-ui';

import {
  ElCard,
  ElDialog,
  ElForm,
  ElFormItem,
  ElInput,
  ElInputNumber,
  ElMessage,
  ElSpace,
  ElTable,
  ElTableColumn,
  ElTag,
} from 'element-plus';

import {
  createEvaluationCase,
  fetchEvaluationCases,
  fetchEvaluationRuns,
  runEvaluation,
} from '#/api/rag';

const cases = ref<EvaluationCase[]>([]);
const runs = ref<EvaluationRun[]>([]);
const loading = shallowRef(false);
const runningCaseId = shallowRef('');
const dialogVisible = shallowRef(false);
const runTopK = shallowRef(20);
const form = reactive({
  expectedArticleRefs: '',
  expectedKeywords: '',
  query: '',
  tags: '',
});

function asCase(row: unknown) {
  return row as EvaluationCase;
}

function asRun(row: unknown) {
  return row as EvaluationRun;
}

async function loadData() {
  loading.value = true;
  try {
    const [caseItems, runItems] = await Promise.all([
      fetchEvaluationCases(),
      fetchEvaluationRuns(),
    ]);
    cases.value = caseItems;
    runs.value = runItems;
  } finally {
    loading.value = false;
  }
}

async function handleCreate() {
  if (!form.query.trim()) {
    ElMessage.warning('请输入评估问题');
    return;
  }
  loading.value = true;
  try {
    await createEvaluationCase({
      expectedArticleRefs: splitValues(form.expectedArticleRefs),
      expectedKeywords: splitValues(form.expectedKeywords),
      query: form.query,
      tags: splitValues(form.tags),
    });
    ElMessage.success('评估用例已创建');
    dialogVisible.value = false;
    form.query = '';
    form.expectedArticleRefs = '';
    form.expectedKeywords = '';
    form.tags = '';
    await loadData();
  } finally {
    loading.value = false;
  }
}

async function handleRun(item: EvaluationCase) {
  runningCaseId.value = item.id;
  try {
    await runEvaluation({ caseId: item.id, topK: runTopK.value });
    ElMessage.success('评估运行完成');
    await loadData();
  } finally {
    runningCaseId.value = '';
  }
}

function splitValues(value: string) {
  return value
    .split(/[,，\n]/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function formatDate(date?: string) {
  return date ? new Date(date).toLocaleString('zh-CN') : '-';
}

onMounted(loadData);
</script>

<template>
  <Page description="维护检索测试集，运行搜索评估并查看命中指标" title="检索评估">
    <ElCard class="mb-4" shadow="never">
      <template #header>
        <div class="flex flex-wrap items-center justify-between gap-3">
          <ElSpace>
            <span>评估用例</span>
            <ElInputNumber v-model="runTopK" :max="50" :min="1" size="small" />
          </ElSpace>
          <ElSpace>
            <VbenButton :loading="loading" variant="outline" @click="loadData">刷新</VbenButton>
            <VbenButton @click="dialogVisible = true">新增用例</VbenButton>
          </ElSpace>
        </div>
      </template>

      <ElTable v-loading="loading" :data="cases" stripe>
        <ElTableColumn label="问题" min-width="260" prop="query" show-overflow-tooltip />
        <ElTableColumn label="期望法条" min-width="180">
          <template #default="{ row }">
            <ElSpace wrap>
              <ElTag v-for="item in asCase(row).expectedArticleRefs" :key="item" effect="plain">
                {{ item }}
              </ElTag>
            </ElSpace>
          </template>
        </ElTableColumn>
        <ElTableColumn label="关键词" min-width="180">
          <template #default="{ row }">{{ asCase(row).expectedKeywords.join('，') || '-' }}</template>
        </ElTableColumn>
        <ElTableColumn label="创建时间" width="180">
          <template #default="{ row }">{{ formatDate(asCase(row).createdAt) }}</template>
        </ElTableColumn>
        <ElTableColumn align="center" fixed="right" label="操作" width="120">
          <template #default="{ row }">
            <VbenButton
              :loading="runningCaseId === asCase(row).id"
              size="sm"
              variant="link"
              @click="handleRun(asCase(row))"
            >
              运行
            </VbenButton>
          </template>
        </ElTableColumn>
      </ElTable>
    </ElCard>

    <ElCard shadow="never">
      <template #header>运行记录</template>
      <ElTable :data="runs" stripe>
        <ElTableColumn label="问题" min-width="240" prop="query" show-overflow-tooltip />
        <ElTableColumn label="TopK" width="80" prop="topK" />
        <ElTableColumn label="Hit@K" width="100">
          <template #default="{ row }">
            <ElTag :type="asRun(row).metrics.hitAtK ? 'success' : 'danger'">
              {{ asRun(row).metrics.hitAtK ? '命中' : '未命中' }}
            </ElTag>
          </template>
        </ElTableColumn>
        <ElTableColumn label="Recall" width="100">
          <template #default="{ row }">{{ asRun(row).metrics.recallAtK.toFixed(2) }}</template>
        </ElTableColumn>
        <ElTableColumn label="MRR" width="100">
          <template #default="{ row }">{{ asRun(row).metrics.reciprocalRank.toFixed(2) }}</template>
        </ElTableColumn>
        <ElTableColumn label="创建时间" width="180">
          <template #default="{ row }">{{ formatDate(asRun(row).createdAt) }}</template>
        </ElTableColumn>
      </ElTable>
    </ElCard>

    <ElDialog v-model="dialogVisible" title="新增评估用例" width="560px">
      <ElForm label-width="96px">
        <ElFormItem label="问题">
          <ElInput v-model="form.query" placeholder="例如：贩卖野生动物处罚" />
        </ElFormItem>
        <ElFormItem label="期望法条">
          <ElInput v-model="form.expectedArticleRefs" placeholder="多个值用逗号或换行分隔" />
        </ElFormItem>
        <ElFormItem label="关键词">
          <ElInput v-model="form.expectedKeywords" placeholder="多个值用逗号或换行分隔" />
        </ElFormItem>
        <ElFormItem label="标签">
          <ElInput v-model="form.tags" placeholder="多个值用逗号或换行分隔" />
        </ElFormItem>
      </ElForm>
      <template #footer>
        <VbenButton variant="outline" @click="dialogVisible = false">取消</VbenButton>
        <VbenButton :loading="loading" @click="handleCreate">保存</VbenButton>
      </template>
    </ElDialog>
  </Page>
</template>
