<script setup lang="ts">
import { ElButton, ElInput } from 'element-plus'
import { Search } from '@element-plus/icons-vue'

const query = defineModel<string>({ required: true })

const emit = defineEmits<{
  search: [query: string]
}>()

function handleSearch() {
  const trimmed = query.value.trim()
  if (trimmed) {
    emit('search', trimmed)
  }
}
</script>

<template>
  <div class="search-bar">
    <ElInput
      v-model="query"
      placeholder="输入关键词、法条、主题或案由"
      size="large"
      clearable
      @keyup.enter="handleSearch"
    >
      <template #prefix>
        <Search class="search-bar__icon" />
      </template>
    </ElInput>
    <ElButton type="primary" size="large" :icon="Search" @click="handleSearch">搜索</ElButton>
  </div>
</template>

<style scoped>
.search-bar {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: 12px;
}

.search-bar :deep(.el-input__wrapper) {
  min-height: 46px;
  padding-right: 14px;
  padding-left: 14px;
  border-radius: 8px;
  background: #ffffff;
}

.search-bar :deep(.el-button) {
  min-width: 104px;
  border-radius: 8px;
}

.search-bar__icon {
  width: 16px;
  height: 16px;
  color: #667085;
}

@media (max-width: 640px) {
  .search-bar {
    grid-template-columns: 1fr;
  }
}
</style>
