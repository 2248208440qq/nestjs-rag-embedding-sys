<script lang="ts" setup>
import type { VbenFormSchema } from '#/adapter/form';
import type { MenuPayload, MenuRecord } from '#/api';

import { computed, ref } from 'vue';

import { useVbenDrawer } from '@vben/common-ui';

import { useVbenForm, z } from '#/adapter/form';
import {
  createMenuApi,
  getMenuListApi,
  updateMenuApi,
} from '#/api';
import { ElMessage } from 'element-plus';

import { cleanPayload } from '../../shared';
import { getMenuTypeOptions, getStatusOptions } from '../data';

const emit = defineEmits<{
  success: [];
}>();

const editingMenu = ref<MenuRecord | null>(null);

const schema: VbenFormSchema[] = [
  {
    component: 'ApiTreeSelect',
    componentProps: {
      api: getMenuListApi,
      childrenField: 'children',
      clearable: true,
      labelField: 'name',
      valueField: 'id',
      treeProps: {
        checkStrictly: true,
      },
    },
    fieldName: 'parentId',
    label: '父级菜单',
  },
  {
    component: 'RadioGroup',
    componentProps: {
      options: getMenuTypeOptions(),
    },
    defaultValue: 'menu',
    fieldName: 'type',
    label: '类型',
    rules: 'required',
  },
  {
    component: 'Input',
    fieldName: 'title',
    label: '标题',
    rules: z.string().trim().min(1, '请输入菜单标题'),
  },
  {
    component: 'Input',
    fieldName: 'name',
    label: '标识',
    rules: z.string().trim().min(1, '请输入菜单标识'),
  },
  {
    component: 'Input',
    fieldName: 'path',
    label: '路径',
    rules: z.string().trim().min(1, '请输入路由路径'),
  },
  {
    component: 'Input',
    fieldName: 'component',
    label: '组件',
  },
  {
    component: 'Input',
    fieldName: 'icon',
    label: '图标',
  },
  {
    component: 'InputNumber',
    componentProps: {
      min: 0,
    },
    defaultValue: 0,
    fieldName: 'orderNo',
    label: '排序',
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
  commonConfig: {
    formItemClass: 'col-span-2 md:col-span-1',
  },
  schema,
  showDefaultActions: false,
  wrapperClass: 'grid-cols-2 gap-x-4',
});

const [Drawer, drawerApi] = useVbenDrawer({
  onConfirm: onSubmit,
  onOpenChange(isOpen) {
    if (!isOpen) return;

    const data = drawerApi.getData<Partial<MenuRecord> & { parentId?: string }>();
    const current = data?.id ? (data as MenuRecord) : null;
    editingMenu.value = current;

    formApi.setValues({
      component: current?.component ?? '',
      icon: current?.icon ?? current?.meta?.icon ?? '',
      name: current?.name ?? '',
      orderNo: current?.orderNo ?? 0,
      parentId: current?.parentId ?? data?.parentId ?? '',
      path: current?.path ?? '',
      status: current?.status ?? 'active',
      title: current?.meta?.title ?? current?.name ?? '',
      type: current?.type ?? data?.type ?? 'menu',
    });
  },
});

const drawerTitle = computed(() =>
  editingMenu.value ? '编辑菜单' : '新增菜单',
);

async function onSubmit() {
  const { valid } = await formApi.validate();
  if (!valid) return;

  drawerApi.lock();
  try {
    const values = await formApi.getValues<MenuPayload & { title?: string }>();
    const payload = cleanPayload({
      component: values.type === 'button' ? undefined : values.component,
      icon: values.icon,
      meta: cleanPayload({
        icon: values.icon,
        order: values.orderNo,
        title: values.title,
      }),
      name: values.name,
      orderNo: values.orderNo,
      parentId: values.parentId,
      path: values.path,
      status: values.status,
      type: values.type,
    });

    if (editingMenu.value) {
      await updateMenuApi(editingMenu.value.id, payload);
      ElMessage.success('菜单已更新');
    } else {
      await createMenuApi(payload);
      ElMessage.success('菜单已创建');
    }

    drawerApi.close();
    emit('success');
  } finally {
    drawerApi.unlock();
  }
}
</script>

<template>
  <Drawer class="w-full max-w-200" :title="drawerTitle">
    <Form class="mx-4" layout="vertical" />
  </Drawer>
</template>
