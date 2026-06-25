<script lang="ts" setup>
import type { VbenFormSchema } from '#/adapter/form';
import type { DeptPayload, DeptRecord } from '#/api';

import { computed, ref } from 'vue';

import { useVbenDrawer } from '@vben/common-ui';

import { useVbenForm, z } from '#/adapter/form';
import {
  createDeptApi,
  getDeptListApi,
  updateDeptApi,
} from '#/api';
import { ElMessage } from 'element-plus';

import { cleanPayload } from '../../shared';
import { getStatusOptions } from '../data';

const emit = defineEmits<{
  success: [];
}>();

const editingDept = ref<DeptRecord | null>(null);

const schema: VbenFormSchema[] = [
  {
    component: 'Input',
    fieldName: 'name',
    label: '部门名称',
    rules: z.string().trim().min(1, '请输入部门名称'),
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
    fieldName: 'parentId',
    label: '上级部门',
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
  {
    component: 'Input',
    componentProps: {
      rows: 3,
      type: 'textarea',
    },
    fieldName: 'remark',
    label: '备注',
  },
];

const [Form, formApi] = useVbenForm({
  schema,
  showDefaultActions: false,
});

const [Drawer, drawerApi] = useVbenDrawer({
  onConfirm: onSubmit,
  onOpenChange(isOpen) {
    if (!isOpen) return;

    const data = drawerApi.getData<Partial<DeptRecord> & { pid?: string }>();
    const current = data?.id ? (data as DeptRecord) : null;
    editingDept.value = current;

    formApi.setValues({
      name: current?.name ?? '',
      parentId: current?.pid ?? data?.pid ?? '',
      remark: current?.remark ?? '',
      status: current?.status ?? 'active',
    });
  },
});

const drawerTitle = computed(() =>
  editingDept.value ? '编辑部门' : '新增部门',
);

async function onSubmit() {
  const { valid } = await formApi.validate();
  if (!valid) return;

  drawerApi.lock();
  try {
    const values = await formApi.getValues<DeptPayload>();
    const payload = cleanPayload({ ...values });

    if (editingDept.value) {
      await updateDeptApi(editingDept.value.id, payload);
      ElMessage.success('部门已更新');
    } else {
      await createDeptApi(payload);
      ElMessage.success('部门已创建');
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
