<script lang="ts" setup>
import type { VbenFormSchema } from '#/adapter/form';
import type { RoleRecord, UserPayload, UserRecord } from '#/api';

import { computed, ref } from 'vue';

import { useVbenDrawer } from '@vben/common-ui';

import { useVbenForm, z } from '#/adapter/form';
import {
  createUserApi,
  getDeptListApi,
  getRoleListApi,
  updateUserApi,
} from '#/api';
import { ElMessage } from 'element-plus';

import { cleanPayload } from '../../shared';
import { getStatusOptions } from '../data';

const emit = defineEmits<{
  success: [];
}>();

const editingUser = ref<UserRecord | null>(null);
const roleOptions = ref<Array<{ label: string; value: string }>>([]);

const schema: VbenFormSchema[] = [
  {
    component: 'Input',
    fieldName: 'username',
    label: '用户名',
    rules: z.string().trim().min(1, '请输入用户名'),
  },
  {
    component: 'Input',
    componentProps: {
      showPassword: true,
      type: 'password',
    },
    fieldName: 'password',
    label: '密码',
    rules: z.string().optional(),
  },
  {
    component: 'Input',
    fieldName: 'realName',
    label: '姓名',
  },
  {
    component: 'Select',
    componentProps: {
      multiple: true,
      options: roleOptions.value,
    },
    fieldName: 'roleNames',
    label: '角色',
  },
  {
    component: 'ApiTreeSelect',
    componentProps: {
      api: getDeptListApi,
      childrenField: 'children',
      clearable: true,
      labelField: 'name',
      valueField: 'id',
      treeProps: {
        checkStrictly: true,
      },
    },
    fieldName: 'deptId',
    label: '部门',
  },
  {
    component: 'Input',
    fieldName: 'homePath',
    label: '首页',
  },
  {
    component: 'RadioGroup',
    componentProps: {
      options: getStatusOptions(),
    },
    defaultValue: 'active',
    fieldName: 'status',
    label: '状态',
    rules: 'required',
  },
];

const [Form, formApi] = useVbenForm({
  schema,
  showDefaultActions: false,
});

const [Drawer, drawerApi] = useVbenDrawer({
  onConfirm: onSubmit,
  async onOpenChange(isOpen) {
    if (!isOpen) return;

    if (!roleOptions.value.length) {
      const roles = await getRoleListApi({ page: 1, pageSize: 200 });
      roleOptions.value = roles.items.map((role: RoleRecord) => ({
        label: `${role.name}${role.description ? ` - ${role.description}` : ''}`,
        value: role.name,
      }));
    }

    const data = drawerApi.getData<UserRecord>();
    const current = data?.id ? data : null;
    editingUser.value = current;

    formApi.setValues({
      deptId: current?.deptId ?? '',
      homePath: current?.homePath ?? '/rag/search',
      password: '',
      realName: current?.realName ?? '',
      roleNames: current?.roles?.map((role) => role.name) ?? [],
      status: current?.status ?? 'active',
      username: current?.username ?? '',
    });
  },
});

const drawerTitle = computed(() =>
  editingUser.value ? '编辑用户' : '新增用户',
);

async function onSubmit() {
  const { valid } = await formApi.validate();
  if (!valid) return;

  drawerApi.lock();
  try {
    const values = await formApi.getValues<UserPayload>();
    if (!editingUser.value && !values.password) {
      ElMessage.warning('请输入密码');
      return;
    }
    const payload = cleanPayload({ ...values });
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

    drawerApi.close();
    emit('success');
  } finally {
    drawerApi.unlock();
  }
}
</script>

<template>
  <Drawer class="w-full max-w-150" :title="drawerTitle">
    <Form class="mx-4" layout="vertical" />
  </Drawer>
</template>
