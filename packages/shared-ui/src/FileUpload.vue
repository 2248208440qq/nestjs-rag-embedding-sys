<script setup lang="ts">
import { ref } from 'vue'
import { ElButton, ElMessage, ElUpload } from 'element-plus'
import { genFileId } from 'element-plus'
import type { UploadFile, UploadInstance, UploadRawFile, UploadUserFile } from 'element-plus'
import { Upload } from '@element-plus/icons-vue'

const props = withDefaults(defineProps<{
  accept?: string
  maxSizeMB?: number
}>(), {
  accept: '.pdf,.doc,.docx,.txt,.md,.html',
  maxSizeMB: 50,
})

const emit = defineEmits<{
  'file-select': [file: File]
  'file-clear': []
}>()

const uploadRef = ref<UploadInstance>()
const fileList = ref<UploadUserFile[]>([])

function handleChange(uploadFile: UploadFile) {
  if (!uploadFile.raw) return
  selectFile(uploadFile.raw)
}

function handleExceed(files: File[]) {
  const [file] = files
  if (!file) return

  uploadRef.value?.clearFiles()
  const rawFile = file as UploadRawFile
  rawFile.uid = genFileId()
  uploadRef.value?.handleStart(rawFile)
  selectFile(rawFile)
}

function handleRemove() {
  emit('file-clear')
}

function selectFile(file: File) {
  const limit = props.maxSizeMB * 1024 * 1024
  if (file.size > limit) {
    ElMessage.error(`文件大小不能超过 ${props.maxSizeMB}MB`)
    clear()
    return
  }

  emit('file-select', file)
}

function clear() {
  fileList.value = []
  uploadRef.value?.clearFiles()
  emit('file-clear')
}

defineExpose({ clear })
</script>

<template>
  <ElUpload
    ref="uploadRef"
    v-model:file-list="fileList"
    action="#"
    :accept="accept"
    :on-change="handleChange"
    :on-exceed="handleExceed"
    :on-remove="handleRemove"
    :auto-upload="false"
    :limit="1"
    name="file"
    drag
  >
    <ElButton type="primary" :icon="Upload">选择文件</ElButton>
    <template #tip>
      <div class="el-upload__tip text-gray-500">
        支持 {{ accept }} 格式，最大 {{ maxSizeMB }}MB
      </div>
    </template>
  </ElUpload>
</template>

<style scoped>
:deep(.el-upload-dragger) {
  border-radius: 8px;
  background: #f8fafc;
}
</style>
