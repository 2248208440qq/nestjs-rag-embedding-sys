<script lang="ts" setup>
import type { MenuPayload, MenuRecord, MenuType } from '#/api';
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
  ElInputNumber,
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
  createMenuApi,
  deleteMenuApi,
  getMenuListApi,
  updateMenuApi,
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
const editingMenu = ref<MenuRecord>();
const formRef = ref<FormInstance>();
const menus = ref<MenuRecord[]>([]);
const keyword = ref('');

const form = reactive<
  MenuPayload & {
    title?: string;
  }
>({
  component: '',
  icon: '',
  name: '',
  orderNo: 0,
  parentId: '',
  path: '',
  status: 'active',
  title: '',
  type: 'menu',
});

const rules: FormRules = {
  name: [{ required: true, message: '请输入菜单标识', trigger: 'blur' }],
  path: [{ required: true, message: '请输入路由路径', trigger: 'blur' }],
  title: [{ required: true, message: '请输入菜单标题', trigger: 'blur' }],
  type: [{ required: true, message: '请选择菜单类型', trigger: 'change' }],
};

const parentOptions = computed(() =>
  toTreeOptions(menus.value, editingMenu.value?.id),
);

const filteredMenus = computed(() => {
  const text = keyword.value.trim().toLowerCase();
  if (!text) return menus.value;

  function filter(items: MenuRecord[]): MenuRecord[] {
    return items
      .map((item) => {
        const children = item.children ? filter(item.children) : [];
        const matched =
          item.name.toLowerCase().includes(text) ||
          item.path.toLowerCase().includes(text) ||
          String(item.meta?.title ?? '').toLowerCase().includes(text);
        return matched || children.length ? { ...item, children } : undefined;
      })
      .filter(Boolean) as MenuRecord[];
  }

  return filter(menus.value);
});

async function loadMenus() {
  loading.value = true;
  try {
    menus.value = await getMenuListApi();
  } finally {
    loading.value = false;
  }
}

function openCreate(parent?: MenuRecord) {
  editingMenu.value = undefined;
  Object.assign(form, {
    component: '',
    icon: parent?.icon ?? 'lucide:circle',
    name: '',
    orderNo: 0,
    parentId: parent?.id ?? '',
    path: parent ? `${parent.path}/` : '',
    status: 'active',
    title: '',
    type: parent ? 'menu' : 'catalog',
  });
  dialogVisible.value = true;
}

function asMenu(row: unknown) {
  return row as MenuRecord;
}

function openEdit(row: MenuRecord) {
  editingMenu.value = row;
  Object.assign(form, {
    component: row.component ?? '',
    icon: row.icon ?? row.meta?.icon ?? '',
    name: row.name,
    orderNo: row.orderNo,
    parentId: row.parentId ?? '',
    path: row.path,
    status: row.status,
    title: row.meta?.title ?? row.name,
    type: row.type,
  });
  dialogVisible.value = true;
}

async function submitForm() {
  await formRef.value?.validate();
  submitting.value = true;
  try {
    const payload = cleanPayload({
      component: form.type === 'button' ? undefined : form.component,
      icon: form.icon,
      meta: cleanPayload({
        icon: form.icon,
        order: form.orderNo,
        title: form.title,
      }),
      name: form.name,
      orderNo: form.orderNo,
      parentId: form.parentId,
      path: form.path,
      status: form.status,
      type: form.type,
    });

    if (editingMenu.value) {
      await updateMenuApi(editingMenu.value.id, payload);
      ElMessage.success('菜单已更新');
    } else {
      await createMenuApi(payload);
      ElMessage.success('菜单已创建');
    }

    dialogVisible.value = false;
    await loadMenus();
  } finally {
    submitting.value = false;
  }
}

async function deleteMenu(row: MenuRecord) {
  await ElMessageBox.confirm(`确定删除菜单「${row.meta?.title || row.name}」吗？`, '删除菜单', {
    type: 'warning',
  });
  await deleteMenuApi(row.id);
  ElMessage.success('菜单已删除');
  await loadMenus();
}

function typeLabel(type: MenuType) {
  if (type === 'catalog') return '目录';
  if (type === 'button') return '按钮';
  return '菜单';
}

onMounted(loadMenus);
</script>

<template>
  <Page description="维护动态路由、菜单层级和按钮权限节点" title="菜单管理">
    <ElCard class="mb-4" shadow="never">
      <ElForm :inline="true">
        <ElFormItem label="关键词">
          <ElInput
            v-model="keyword"
            clearable
            placeholder="标题 / 标识 / 路径"
            style="width: 260px"
          />
        </ElFormItem>
        <ElFormItem>
          <ElSpace>
            <ElButton :loading="loading" type="primary" @click="loadMenus">
              刷新
            </ElButton>
            <ElButton @click="keyword = ''">重置</ElButton>
          </ElSpace>
        </ElFormItem>
      </ElForm>
    </ElCard>

    <ElCard shadow="never">
      <template #header>
        <div class="flex items-center justify-between">
          <span>菜单树</span>
          <ElButton type="primary" @click="openCreate()">新增目录</ElButton>
        </div>
      </template>

      <ElTable
        v-loading="loading"
        :data="filteredMenus"
        row-key="id"
        stripe
        :tree-props="{ children: 'children' }"
      >
        <ElTableColumn label="标题" min-width="220">
          <template #default="{ row }">{{ row.meta?.title || row.name }}</template>
        </ElTableColumn>
        <ElTableColumn label="标识" min-width="180" prop="name" />
        <ElTableColumn label="路径" min-width="220" prop="path" />
        <ElTableColumn label="组件" min-width="220" prop="component" />
        <ElTableColumn label="类型" width="100">
          <template #default="{ row }">
            <ElTag :type="row.type === 'button' ? 'warning' : row.type === 'catalog' ? 'info' : 'success'">
              {{ typeLabel(row.type) }}
            </ElTag>
          </template>
        </ElTableColumn>
        <ElTableColumn label="状态" width="100">
          <template #default="{ row }">
            <ElTag :type="row.status === 'active' ? 'success' : 'info'">
              {{ statusLabel(row.status) }}
            </ElTag>
          </template>
        </ElTableColumn>
        <ElTableColumn label="排序" width="80" prop="orderNo" />
        <ElTableColumn label="更新时间" width="180">
          <template #default="{ row }">{{ formatDateTime(row.updatedAt) }}</template>
        </ElTableColumn>
        <ElTableColumn align="center" fixed="right" label="操作" width="230">
          <template #default="{ row }">
            <ElSpace>
              <ElButton size="small" @click="openCreate(asMenu(row))">新增子级</ElButton>
              <ElButton size="small" @click="openEdit(asMenu(row))">编辑</ElButton>
              <ElButton plain size="small" type="danger" @click="deleteMenu(asMenu(row))">
                删除
              </ElButton>
            </ElSpace>
          </template>
        </ElTableColumn>
      </ElTable>
    </ElCard>

    <ElDialog
      v-model="dialogVisible"
      :title="editingMenu ? '编辑菜单' : '新增菜单'"
      destroy-on-close
      width="620px"
    >
      <ElForm ref="formRef" :model="form" :rules="rules" label-width="96px">
        <ElFormItem label="父级菜单">
          <ElCascader
            v-model="form.parentId"
            :options="parentOptions"
            :props="{ checkStrictly: true, emitPath: false }"
            clearable
            placeholder="根级菜单"
          />
        </ElFormItem>
        <ElFormItem label="类型" prop="type">
          <ElSelect v-model="form.type">
            <ElOption label="目录" value="catalog" />
            <ElOption label="菜单" value="menu" />
            <ElOption label="按钮" value="button" />
          </ElSelect>
        </ElFormItem>
        <ElFormItem label="标题" prop="title">
          <ElInput v-model="form.title" placeholder="显示在菜单中的标题" />
        </ElFormItem>
        <ElFormItem label="标识" prop="name">
          <ElInput v-model="form.name" placeholder="例如 SystemUsers / AC_100020" />
        </ElFormItem>
        <ElFormItem label="路径" prop="path">
          <ElInput v-model="form.path" placeholder="/system/user" />
        </ElFormItem>
        <ElFormItem v-if="form.type !== 'button'" label="组件">
          <ElInput v-model="form.component" placeholder="/system/users/index" />
        </ElFormItem>
        <ElFormItem label="图标">
          <ElInput v-model="form.icon" placeholder="lucide:users" />
        </ElFormItem>
        <ElFormItem label="排序">
          <ElInputNumber v-model="form.orderNo" :min="0" />
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
