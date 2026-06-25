<script lang="ts" setup>
import type { VbenFormSchema } from '#/adapter/form';
import type { MenuRecord, RolePayload, RoleRecord } from '#/api';

import { computed, nextTick, ref } from 'vue';

import { useVbenDrawer } from '@vben/common-ui';

import { useVbenForm, z } from '#/adapter/form';
import {
  createRoleApi,
  getMenuListApi,
  updateRoleApi,
} from '#/api';
import { ElMessage, ElTree } from 'element-plus';

import { cleanPayload } from '../../shared';
import { getStatusOptions } from '../data';

const emit = defineEmits<{
  success: [];
}>();

const editingRole = ref<RoleRecord | null>(null);
const menus = ref<MenuRecord[]>([]);
const treeRef = ref<InstanceType<typeof ElTree>>();

const schema: VbenFormSchema[] = [
  {
    component: 'Input',
    fieldName: 'name',
    label: '角色名称',
    rules: z.string().trim().min(1, '请输入角色名称'),
  },
  {
    component: 'Input',
    fieldName: 'description',
    label: '描述',
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

    if (!menus.value.length) {
      menus.value = await getMenuListApi();
    }

    const data = drawerApi.getData<RoleRecord>();
    const current = data?.id ? data : null;
    editingRole.value = current;

    formApi.setValues({
      description: current?.description ?? '',
      name: current?.name ?? '',
      status: current?.status ?? 'active',
    });

    await nextTick();
    treeRef.value?.setCheckedKeys(current?.menuIds ?? []);
  },
});

const drawerTitle = computed(() =>
  editingRole.value ? '编辑角色' : '新增角色',
);

async function onSubmit() {
  const { valid } = await formApi.validate();
  if (!valid) return;

  drawerApi.lock();
  try {
    const values = await formApi.getValues<RolePayload>();
    const checkedKeys = treeRef.value?.getCheckedKeys(false) ?? [];
    const halfCheckedKeys = treeRef.value?.getHalfCheckedKeys() ?? [];
    const payload = cleanPayload({
      ...values,
      menuIds: [...checkedKeys, ...halfCheckedKeys].map(String),
    });

    if (editingRole.value) {
      await updateRoleApi(editingRole.value.id, payload);
      ElMessage.success('角色已更新');
    } else {
      await createRoleApi(payload);
      ElMessage.success('角色已创建');
    }

    drawerApi.close();
    emit('success');
  } finally {
    drawerApi.unlock();
  }
}
</script>

<template>
  <Drawer class="w-full max-w-160" :title="drawerTitle">
    <div class="mx-4 space-y-4">
      <Form layout="vertical" />
      <div>
        <div class="mb-2 text-sm font-medium">权限</div>
        <div class="rounded-lg border border-border p-3">
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
                <span class="inline-flex items-center rounded-md border border-sky-500/30 bg-sky-500/10 px-2 py-0.5 text-xs text-sky-600 dark:text-sky-300">
                  {{ data.type }}
                </span>
              </span>
            </template>
          </ElTree>
        </div>
      </div>
    </div>
  </Drawer>
</template>
