<script lang="ts" setup>
import type { KnowledgeBase } from '#/api/rag';

import { onMounted, reactive, ref, shallowRef } from 'vue';

import { Page, VbenButton } from '@vben/common-ui';

import {
  ElCard,
  ElDialog,
  ElForm,
  ElFormItem,
  ElInput,
  ElMessage,
  ElMessageBox,
  ElOption,
  ElSelect,
  ElSpace,
  ElTable,
  ElTableColumn,
  ElTag,
} from 'element-plus';

import {
  createKnowledgeBase,
  deleteKnowledgeBase,
  fetchKnowledgeBases,
  updateKnowledgeBase,
} from '#/api/rag';

const items = ref<KnowledgeBase[]>([]);
const loading = shallowRef(false);
const dialogVisible = shallowRef(false);
const editingId = shallowRef('');
const form = reactive({
  category: '',
  code: '',
  description: '',
  name: '',
  status: 'active' as KnowledgeBase['status'],
});

function asKnowledgeBase(row: unknown) {
  return row as KnowledgeBase;
}

async function loadItems() {
  loading.value = true;
  try {
    items.value = await fetchKnowledgeBases();
  } finally {
    loading.value = false;
  }
}

function openCreate() {
  editingId.value = '';
  form.name = '';
  form.code = '';
  form.description = '';
  form.category = '';
  form.status = 'active';
  dialogVisible.value = true;
}

function openEdit(item: KnowledgeBase) {
  editingId.value = item.id;
  form.name = item.name;
  form.code = item.code;
  form.description = item.description ?? '';
  form.category = item.category ?? '';
  form.status = item.status;
  dialogVisible.value = true;
}

async function handleSubmit() {
  if (!form.name.trim() || !form.code.trim()) {
    ElMessage.warning('请输入名称和编码');
    return;
  }

  loading.value = true;
  try {
    if (editingId.value) {
      await updateKnowledgeBase(editingId.value, {
        category: form.category || undefined,
        description: form.description || undefined,
        name: form.name,
        status: form.status,
      });
      ElMessage.success('知识库已更新');
    } else {
      await createKnowledgeBase({
        category: form.category || undefined,
        code: form.code,
        description: form.description || undefined,
        name: form.name,
        status: form.status,
      });
      ElMessage.success('知识库已创建');
    }
    dialogVisible.value = false;
    await loadItems();
  } finally {
    loading.value = false;
  }
}

async function handleDelete(item: KnowledgeBase) {
  await ElMessageBox.confirm(`确定删除知识库“${item.name}”吗？`, '删除知识库', {
    type: 'warning',
  });
  loading.value = true;
  try {
    await deleteKnowledgeBase(item.id);
    ElMessage.success('知识库已删除');
    await loadItems();
  } finally {
    loading.value = false;
  }
}

function formatDate(date?: string) {
  return date ? new Date(date).toLocaleString('zh-CN') : '-';
}

onMounted(loadItems);
</script>

<template>
  <Page description="按业务领域、来源和状态组织法律法规文档" title="知识库管理">
    <ElCard shadow="never">
      <template #header>
        <div class="flex items-center justify-between">
          <span>知识库列表</span>
          <ElSpace>
            <VbenButton :loading="loading" variant="outline" @click="loadItems">刷新</VbenButton>
            <VbenButton @click="openCreate">新增知识库</VbenButton>
          </ElSpace>
        </div>
      </template>

      <ElTable v-loading="loading" :data="items" stripe>
        <ElTableColumn label="名称" min-width="180" prop="name" />
        <ElTableColumn label="编码" width="160" prop="code" />
        <ElTableColumn label="分类" width="140" prop="category" />
        <ElTableColumn label="文档数" width="100" prop="documentCount" />
        <ElTableColumn label="状态" width="100">
          <template #default="{ row }">
            <ElTag :type="asKnowledgeBase(row).status === 'active' ? 'success' : 'info'">
              {{ asKnowledgeBase(row).status === 'active' ? '启用' : '归档' }}
            </ElTag>
          </template>
        </ElTableColumn>
        <ElTableColumn label="更新时间" width="180">
          <template #default="{ row }">{{ formatDate(asKnowledgeBase(row).updatedAt) }}</template>
        </ElTableColumn>
        <ElTableColumn align="center" fixed="right" label="操作" width="160">
          <template #default="{ row }">
            <ElSpace>
              <VbenButton size="sm" variant="link" @click="openEdit(asKnowledgeBase(row))">
                编辑
              </VbenButton>
              <VbenButton
                class="text-destructive hover:text-destructive"
                size="sm"
                variant="link"
                @click="handleDelete(asKnowledgeBase(row))"
              >
                删除
              </VbenButton>
            </ElSpace>
          </template>
        </ElTableColumn>
      </ElTable>
    </ElCard>

    <ElDialog v-model="dialogVisible" :title="editingId ? '编辑知识库' : '新增知识库'" width="560px">
      <ElForm label-width="88px">
        <ElFormItem label="名称">
          <ElInput v-model="form.name" placeholder="例如：野生动物保护法规库" />
        </ElFormItem>
        <ElFormItem label="编码">
          <ElInput v-model="form.code" :disabled="Boolean(editingId)" placeholder="例如：wildlife-law" />
        </ElFormItem>
        <ElFormItem label="分类">
          <ElInput v-model="form.category" placeholder="例如：行政执法" />
        </ElFormItem>
        <ElFormItem label="状态">
          <ElSelect v-model="form.status">
            <ElOption label="启用" value="active" />
            <ElOption label="归档" value="archived" />
          </ElSelect>
        </ElFormItem>
        <ElFormItem label="描述">
          <ElInput v-model="form.description" :rows="3" type="textarea" />
        </ElFormItem>
      </ElForm>
      <template #footer>
        <VbenButton variant="outline" @click="dialogVisible = false">取消</VbenButton>
        <VbenButton :loading="loading" @click="handleSubmit">保存</VbenButton>
      </template>
    </ElDialog>
  </Page>
</template>
