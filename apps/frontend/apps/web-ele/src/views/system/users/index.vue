<script lang="ts" setup>
import type {
  DeptRecord,
  RoleRecord,
  UserPayload,
  UserRecord,
} from '#/api';
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
  ElPagination,
  ElSelect,
  ElSpace,
  ElTable,
  ElTableColumn,
  ElTag,
} from 'element-plus';

import {
  createUserApi,
  deleteUserApi,
  getDeptListApi,
  getRoleListApi,
  getUserListApi,
  updateUserApi,
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
const editingUser = ref<UserRecord>();
const formRef = ref<FormInstance>();
const users = ref<UserRecord[]>([]);
const roles = ref<RoleRecord[]>([]);
const depts = ref<DeptRecord[]>([]);
const total = ref(0);

const query = reactive({
  deptId: '',
  name: '',
  page: 1,
  pageSize: 20,
  status: '',
});

const form = reactive<UserPayload>({
  deptId: '',
  homePath: '/rag/search',
  password: '',
  realName: '',
  roleNames: [],
  status: 'active',
  username: '',
});

const rules = computed<FormRules>(() => ({
  password: editingUser.value
    ? [{ min: 6, message: '密码至少 6 位', trigger: 'blur' }]
    : [{ required: true, message: '请输入密码', trigger: 'blur' }],
  username: [{ required: true, message: '请输入用户名', trigger: 'blur' }],
}));

const deptOptions = computed(() => toTreeOptions(depts.value));
const roleOptions = computed(() =>
  roles.value.map((role) => ({
    label: `${role.name}${role.description ? ` - ${role.description}` : ''}`,
    value: role.name,
  })),
);

async function loadUsers() {
  loading.value = true;
  try {
    const data = await getUserListApi(cleanPayload({ ...query }));
    users.value = data.items;
    total.value = data.total;
  } finally {
    loading.value = false;
  }
}

async function loadOptions() {
  const [roleResult, deptResult] = await Promise.all([
    getRoleListApi({ page: 1, pageSize: 200 }),
    getDeptListApi(),
  ]);
  roles.value = roleResult.items;
  depts.value = deptResult;
}

function resetQuery() {
  query.deptId = '';
  query.name = '';
  query.page = 1;
  query.status = '';
  loadUsers();
}

function asUser(row: unknown) {
  return row as UserRecord;
}

function openCreate() {
  editingUser.value = undefined;
  Object.assign(form, {
    deptId: '',
    homePath: '/rag/search',
    password: '',
    realName: '',
    roleNames: [],
    status: 'active',
    username: '',
  });
  dialogVisible.value = true;
}

function openEdit(row: UserRecord) {
  editingUser.value = row;
  Object.assign(form, {
    deptId: row.deptId ?? '',
    homePath: row.homePath ?? '/rag/search',
    password: '',
    realName: row.realName ?? '',
    roleNames: row.roles.map((role) => role.name),
    status: row.status,
    username: row.username,
  });
  dialogVisible.value = true;
}

async function submitForm() {
  await formRef.value?.validate();
  submitting.value = true;
  try {
    const payload = cleanPayload({ ...form });
    if (editingUser.value && !payload.password) {
      delete payload.password;
    }

    if (editingUser.value) {
      await updateUserApi(editingUser.value.id, payload);
      ElMessage.success('用户已更新');
    } else {
      await createUserApi(payload);
      ElMessage.success('用户已创建');
    }

    dialogVisible.value = false;
    await loadUsers();
  } finally {
    submitting.value = false;
  }
}

async function deleteUser(row: UserRecord) {
  await ElMessageBox.confirm(`确定删除用户「${row.username}」吗？`, '删除用户', {
    type: 'warning',
  });
  await deleteUserApi(row.id);
  ElMessage.success('用户已删除');
  await loadUsers();
}

onMounted(async () => {
  await loadOptions();
  await loadUsers();
});
</script>

<template>
  <Page description="维护系统账号、角色和所属部门" title="用户管理">
    <ElCard class="mb-4" shadow="never">
      <ElForm :inline="true" :model="query">
        <ElFormItem label="关键词">
          <ElInput
            v-model="query.name"
            clearable
            placeholder="用户名 / 姓名"
            @keyup.enter="loadUsers"
          />
        </ElFormItem>
        <ElFormItem label="状态">
          <ElSelect v-model="query.status" clearable placeholder="全部" style="width: 120px">
            <ElOption label="启用" value="active" />
            <ElOption label="停用" value="inactive" />
          </ElSelect>
        </ElFormItem>
        <ElFormItem label="部门">
          <ElCascader
            v-model="query.deptId"
            :options="deptOptions"
            :props="{ checkStrictly: true, emitPath: false }"
            clearable
            placeholder="全部部门"
            style="width: 220px"
          />
        </ElFormItem>
        <ElFormItem>
          <ElSpace>
            <ElButton :loading="loading" type="primary" @click="loadUsers">
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
          <span>用户列表</span>
          <ElButton type="primary" @click="openCreate">新增用户</ElButton>
        </div>
      </template>

      <ElTable v-loading="loading" :data="users" stripe>
        <ElTableColumn label="用户名" min-width="140" prop="username" />
        <ElTableColumn label="姓名" min-width="140" prop="realName" />
        <ElTableColumn label="部门" min-width="150" prop="deptName" />
        <ElTableColumn label="角色" min-width="220">
          <template #default="{ row }">
            <ElSpace wrap>
              <ElTag v-for="role in row.roles" :key="role.name" effect="plain">
                {{ role.name }}
              </ElTag>
            </ElSpace>
          </template>
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
              <ElButton size="small" @click="openEdit(asUser(row))">编辑</ElButton>
              <ElButton plain size="small" type="danger" @click="deleteUser(asUser(row))">
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
          @change="loadUsers"
        />
      </div>
    </ElCard>

    <ElDialog
      v-model="dialogVisible"
      :title="editingUser ? '编辑用户' : '新增用户'"
      destroy-on-close
      width="560px"
    >
      <ElForm ref="formRef" :model="form" :rules="rules" label-width="92px">
        <ElFormItem label="用户名" prop="username">
          <ElInput v-model="form.username" :disabled="Boolean(editingUser)" />
        </ElFormItem>
        <ElFormItem label="密码" prop="password">
          <ElInput
            v-model="form.password"
            :placeholder="editingUser ? '留空则不修改密码' : '请输入密码'"
            show-password
            type="password"
          />
        </ElFormItem>
        <ElFormItem label="姓名">
          <ElInput v-model="form.realName" placeholder="显示名称" />
        </ElFormItem>
        <ElFormItem label="角色">
          <ElSelect v-model="form.roleNames" multiple placeholder="选择角色">
            <ElOption
              v-for="role in roleOptions"
              :key="role.value"
              :label="role.label"
              :value="role.value"
            />
          </ElSelect>
        </ElFormItem>
        <ElFormItem label="部门">
          <ElCascader
            v-model="form.deptId"
            :options="deptOptions"
            :props="{ checkStrictly: true, emitPath: false }"
            clearable
            placeholder="选择部门"
          />
        </ElFormItem>
        <ElFormItem label="首页">
          <ElInput v-model="form.homePath" placeholder="/rag/search" />
        </ElFormItem>
        <ElFormItem label="状态">
          <ElSelect v-model="form.status">
            <ElOption label="启用" value="active" />
            <ElOption label="停用" value="inactive" />
          </ElSelect>
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
