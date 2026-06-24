<script lang="ts" setup>
import type { DeptPayload, DeptRecord } from '#/api';
import type { FormInstance, FormRules } from 'element-plus';

import { computed, onMounted, reactive, ref } from 'vue';

import { Page } from '@vben/common-ui';

import {
  ElButton,
  ElCard,
  ElCascader,
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
  createDeptApi,
  deleteDeptApi,
  getDeptListApi,
  updateDeptApi,
} from '#/api';

import {
  cleanPayload,
  formatDateTime,
  statusLabel,
  toTreeOptions,
} from '../shared';

const loading = ref(false);
const submitting = ref(false);
const dialogVisible = ref(false);
const editingDept = ref<DeptRecord>();
const formRef = ref<FormInstance>();
const depts = ref<DeptRecord[]>([]);
const keyword = ref('');
const status = ref('');

const form = reactive<DeptPayload>({
  name: '',
  parentId: '',
  remark: '',
  status: 'active',
});

const rules: FormRules = {
  name: [{ required: true, message: '请输入部门名称', trigger: 'blur' }],
};

const parentOptions = computed(() =>
  toTreeOptions(depts.value, editingDept.value?.id),
);

const filteredDepts = computed(() => {
  const text = keyword.value.trim().toLowerCase();
  const currentStatus = status.value;

  function filter(items: DeptRecord[]): DeptRecord[] {
    return items
      .map((item) => {
        const children = item.children ? filter(item.children) : [];
        const matchedText =
          !text ||
          item.name.toLowerCase().includes(text) ||
          String(item.remark ?? '').toLowerCase().includes(text);
        const matchedStatus = !currentStatus || item.status === currentStatus;
        return (matchedText && matchedStatus) || children.length
          ? { ...item, children }
          : undefined;
      })
      .filter(Boolean) as DeptRecord[];
  }

  return filter(depts.value);
});

async function loadDepts() {
  loading.value = true;
  try {
    depts.value = await getDeptListApi();
  } finally {
    loading.value = false;
  }
}

function resetQuery() {
  keyword.value = '';
  status.value = '';
}

function asDept(row: unknown) {
  return row as DeptRecord;
}

function openCreate(parent?: DeptRecord) {
  editingDept.value = undefined;
  Object.assign(form, {
    name: '',
    parentId: parent?.id ?? '',
    remark: '',
    status: 'active',
  });
  dialogVisible.value = true;
}

function openEdit(row: DeptRecord) {
  editingDept.value = row;
  Object.assign(form, {
    name: row.name,
    parentId: row.pid ?? '',
    remark: row.remark ?? '',
    status: row.status,
  });
  dialogVisible.value = true;
}

async function submitForm() {
  await formRef.value?.validate();
  submitting.value = true;
  try {
    const payload = cleanPayload({ ...form });
    if (editingDept.value) {
      await updateDeptApi(editingDept.value.id, payload);
      ElMessage.success('部门已更新');
    } else {
      await createDeptApi(payload);
      ElMessage.success('部门已创建');
    }

    dialogVisible.value = false;
    await loadDepts();
  } finally {
    submitting.value = false;
  }
}

async function deleteDept(row: DeptRecord) {
  await ElMessageBox.confirm(`确定删除部门「${row.name}」吗？`, '删除部门', {
    type: 'warning',
  });
  await deleteDeptApi(row.id);
  ElMessage.success('部门已删除');
  await loadDepts();
}

onMounted(loadDepts);
</script>

<template>
  <Page description="维护组织架构，用于用户归属和后续数据权限" title="部门管理">
    <ElCard class="mb-4" shadow="never">
      <ElForm :inline="true">
        <ElFormItem label="关键词">
          <ElInput
            v-model="keyword"
            clearable
            placeholder="部门名称 / 备注"
            style="width: 240px"
          />
        </ElFormItem>
        <ElFormItem label="状态">
          <ElSelect v-model="status" clearable placeholder="全部" style="width: 120px">
            <ElOption label="启用" value="active" />
            <ElOption label="停用" value="inactive" />
          </ElSelect>
        </ElFormItem>
        <ElFormItem>
          <ElSpace>
            <ElButton :loading="loading" type="primary" @click="loadDepts">
              刷新
            </ElButton>
            <ElButton @click="resetQuery">重置</ElButton>
          </ElSpace>
        </ElFormItem>
      </ElForm>
    </ElCard>

    <ElCard shadow="never">
      <template #header>
        <div class="flex items-center justify-between">
          <span>部门树</span>
          <ElButton type="primary" @click="openCreate()">新增部门</ElButton>
        </div>
      </template>

      <ElTable
        v-loading="loading"
        :data="filteredDepts"
        row-key="id"
        stripe
        :tree-props="{ children: 'children' }"
      >
        <ElTableColumn label="部门名称" min-width="220" prop="name" />
        <ElTableColumn label="备注" min-width="260" prop="remark" />
        <ElTableColumn label="状态" width="100">
          <template #default="{ row }">
            <ElTag :type="row.status === 'active' ? 'success' : 'info'">
              {{ statusLabel(row.status) }}
            </ElTag>
          </template>
        </ElTableColumn>
        <ElTableColumn label="创建时间" width="180">
          <template #default="{ row }">{{ formatDateTime(row.createTime) }}</template>
        </ElTableColumn>
        <ElTableColumn align="center" fixed="right" label="操作" width="230">
          <template #default="{ row }">
            <ElSpace>
              <ElButton size="small" @click="openCreate(asDept(row))">新增子级</ElButton>
              <ElButton size="small" @click="openEdit(asDept(row))">编辑</ElButton>
              <ElButton plain size="small" type="danger" @click="deleteDept(asDept(row))">
                删除
              </ElButton>
            </ElSpace>
          </template>
        </ElTableColumn>
      </ElTable>
    </ElCard>

    <ElDialog
      v-model="dialogVisible"
      :title="editingDept ? '编辑部门' : '新增部门'"
      destroy-on-close
      width="520px"
    >
      <ElForm ref="formRef" :model="form" :rules="rules" label-width="92px">
        <ElFormItem label="上级部门">
          <ElCascader
            v-model="form.parentId"
            :options="parentOptions"
            :props="{ checkStrictly: true, emitPath: false }"
            clearable
            placeholder="根级部门"
          />
        </ElFormItem>
        <ElFormItem label="部门名称" prop="name">
          <ElInput v-model="form.name" placeholder="请输入部门名称" />
        </ElFormItem>
        <ElFormItem label="状态">
          <ElSelect v-model="form.status">
            <ElOption label="启用" value="active" />
            <ElOption label="停用" value="inactive" />
          </ElSelect>
        </ElFormItem>
        <ElFormItem label="备注">
          <ElInput
            v-model="form.remark"
            :rows="3"
            placeholder="部门说明"
            type="textarea"
          />
        </ElFormItem>
      </ElForm>
      <template #footer>
        <ElButton @click="dialogVisible = false">取消</ElButton>
        <ElButton :loading="submitting" type="primary" @click="submitForm">
          保存
        </ElButton>
      </template>
    </ElDialog>
  </Page>
</template>
