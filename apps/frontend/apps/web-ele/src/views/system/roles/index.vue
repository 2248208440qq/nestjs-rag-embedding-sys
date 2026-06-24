<script lang="ts" setup>
import type { MenuRecord, RolePayload, RoleRecord } from '#/api';
import type { FormInstance, FormRules } from 'element-plus';

import { onMounted, reactive, ref } from 'vue';

import { Page } from '@vben/common-ui';

import {
  ElButton,
  ElCard,
  ElDialog,
  ElForm,
  ElFormItem,
  ElInput,
  ElMessage,
  ElMessageBox,
  ElOption,
  ElPagination,
  ElSelect,
  ElSpace,
  ElTable,
  ElTableColumn,
  ElTag,
  ElTree,
} from 'element-plus';

import {
  createRoleApi,
  deleteRoleApi,
  getMenuListApi,
  getRoleListApi,
  updateRoleApi,
} from '#/api';

import { cleanPayload, formatDateTime, statusLabel } from '../shared';

const loading = ref(false);
const submitting = ref(false);
const dialogVisible = ref(false);
const editingRole = ref<RoleRecord>();
const formRef = ref<FormInstance>();
const treeRef = ref<InstanceType<typeof ElTree>>();
const roles = ref<RoleRecord[]>([]);
const menus = ref<MenuRecord[]>([]);
const total = ref(0);

const query = reactive({
  name: '',
  page: 1,
  pageSize: 20,
  status: '',
});

const form = reactive<RolePayload>({
  description: '',
  menuIds: [],
  name: '',
  status: 'active',
});

const rules: FormRules = {
  name: [{ required: true, message: '请输入角色名称', trigger: 'blur' }],
};

async function loadRoles() {
  loading.value = true;
  try {
    const data = await getRoleListApi(cleanPayload({ ...query }));
    roles.value = data.items;
    total.value = data.total;
  } finally {
    loading.value = false;
  }
}

async function loadMenus() {
  menus.value = await getMenuListApi();
}

function resetQuery() {
  query.name = '';
  query.page = 1;
  query.status = '';
  loadRoles();
}

function asRole(row: unknown) {
  return row as RoleRecord;
}

function openCreate() {
  editingRole.value = undefined;
  Object.assign(form, {
    description: '',
    menuIds: [],
    name: '',
    status: 'active',
  });
  dialogVisible.value = true;
  requestAnimationFrame(() => treeRef.value?.setCheckedKeys([]));
}

function openEdit(row: RoleRecord) {
  editingRole.value = row;
  Object.assign(form, {
    description: row.description ?? '',
    menuIds: row.menuIds ?? [],
    name: row.name,
    status: row.status,
  });
  dialogVisible.value = true;
  requestAnimationFrame(() => treeRef.value?.setCheckedKeys(row.menuIds ?? []));
}

async function submitForm() {
  await formRef.value?.validate();
  submitting.value = true;
  try {
    const checkedKeys = treeRef.value?.getCheckedKeys(false) ?? [];
    const halfCheckedKeys = treeRef.value?.getHalfCheckedKeys() ?? [];
    const menuIds = [...checkedKeys, ...halfCheckedKeys].map(String);
    const payload = cleanPayload({ ...form, menuIds });

    if (editingRole.value) {
      await updateRoleApi(editingRole.value.id, payload);
      ElMessage.success('角色已更新');
    } else {
      await createRoleApi(payload);
      ElMessage.success('角色已创建');
    }

    dialogVisible.value = false;
    await loadRoles();
  } finally {
    submitting.value = false;
  }
}

async function deleteRole(row: RoleRecord) {
  await ElMessageBox.confirm(`确定删除角色「${row.name}」吗？`, '删除角色', {
    type: 'warning',
  });
  await deleteRoleApi(row.id);
  ElMessage.success('角色已删除');
  await loadRoles();
}

onMounted(async () => {
  await Promise.all([loadMenus(), loadRoles()]);
});
</script>

<template>
  <Page description="配置角色基础信息和菜单/按钮权限" title="角色管理">
    <ElCard class="mb-4" shadow="never">
      <ElForm :inline="true" :model="query">
        <ElFormItem label="关键词">
          <ElInput
            v-model="query.name"
            clearable
            placeholder="角色名称 / 描述"
            @keyup.enter="loadRoles"
          />
        </ElFormItem>
        <ElFormItem label="状态">
          <ElSelect v-model="query.status" clearable placeholder="全部" style="width: 120px">
            <ElOption label="启用" value="active" />
            <ElOption label="停用" value="inactive" />
          </ElSelect>
        </ElFormItem>
        <ElFormItem>
          <ElSpace>
            <ElButton :loading="loading" type="primary" @click="loadRoles">
              查询
            </ElButton>
            <ElButton @click="resetQuery">重置</ElButton>
          </ElSpace>
        </ElFormItem>
      </ElForm>
    </ElCard>

    <ElCard shadow="never">
      <template #header>
        <div class="flex items-center justify-between">
          <span>角色列表</span>
          <ElButton type="primary" @click="openCreate">新增角色</ElButton>
        </div>
      </template>

      <ElTable v-loading="loading" :data="roles" stripe>
        <ElTableColumn label="角色名称" min-width="150" prop="name" />
        <ElTableColumn label="描述" min-width="220" prop="description" />
        <ElTableColumn label="权限数量" width="110">
          <template #default="{ row }">{{ row.permissions.length }}</template>
        </ElTableColumn>
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
        <ElTableColumn align="center" fixed="right" label="操作" width="180">
          <template #default="{ row }">
            <ElSpace>
              <ElButton size="small" @click="openEdit(asRole(row))">编辑</ElButton>
              <ElButton plain size="small" type="danger" @click="deleteRole(asRole(row))">
                删除
              </ElButton>
            </ElSpace>
          </template>
        </ElTableColumn>
      </ElTable>

      <div class="mt-4 flex justify-end">
        <ElPagination
          v-model:current-page="query.page"
          v-model:page-size="query.pageSize"
          :page-sizes="[10, 20, 50]"
          :total="total"
          layout="total, sizes, prev, pager, next"
          @change="loadRoles"
        />
      </div>
    </ElCard>

    <ElDialog
      v-model="dialogVisible"
      :title="editingRole ? '编辑角色' : '新增角色'"
      destroy-on-close
      width="620px"
    >
      <ElForm ref="formRef" :model="form" :rules="rules" label-width="92px">
        <ElFormItem label="角色名称" prop="name">
          <ElInput v-model="form.name" placeholder="例如 admin" />
        </ElFormItem>
        <ElFormItem label="描述">
          <ElInput v-model="form.description" placeholder="角色说明" />
        </ElFormItem>
        <ElFormItem label="状态">
          <ElSelect v-model="form.status">
            <ElOption label="启用" value="active" />
            <ElOption label="停用" value="inactive" />
          </ElSelect>
        </ElFormItem>
        <ElFormItem label="权限">
          <ElTree
            ref="treeRef"
            :data="menus"
            :props="{ children: 'children', label: 'name' }"
            check-strictly
            node-key="id"
            show-checkbox
          >
            <template #default="{ data }">
              <span class="flex items-center gap-2">
                <span>{{ data.meta?.title || data.name }}</span>
                <ElTag size="small" type="info">{{ data.type }}</ElTag>
              </span>
            </template>
          </ElTree>
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
