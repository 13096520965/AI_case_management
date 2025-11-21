<template>
  <div class="file-upload">
    <el-upload
      ref="uploadRef"
      :action="action"
      :headers="headers"
      :data="data"
      :multiple="multiple"
      :limit="limit"
      :accept="accept"
      :file-list="fileList"
      :on-preview="handlePreview"
      :on-remove="handleRemove"
      :on-success="handleSuccess"
      :on-error="handleError"
      :on-exceed="handleExceed"
      :before-upload="beforeUpload"
      :drag="drag"
      :list-type="listType"
      :auto-upload="autoUpload"
    >
      <template v-if="drag">
        <el-icon class="el-icon--upload"><UploadFilled /></el-icon>
        <div class="el-upload__text">
          将文件拖到此处，或<em>点击上传</em>
        </div>
        <template v-if="tip">
          <div class="el-upload__tip">{{ tip }}</div>
        </template>
      </template>
      <template v-else>
        <el-button type="primary" :icon="Upload">选择文件</el-button>
        <template v-if="tip">
          <div class="el-upload__tip">{{ tip }}</div>
        </template>
      </template>
    </el-upload>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { ElMessage } from 'element-plus'
import { Upload, UploadFilled } from '@element-plus/icons-vue'
import type { UploadProps, UploadUserFile, UploadInstance } from 'element-plus'

interface Props {
  action: string
  headers?: Record<string, any>
  data?: Record<string, any>
  multiple?: boolean
  limit?: number
  accept?: string
  fileList?: UploadUserFile[]
  drag?: boolean
  listType?: 'text' | 'picture' | 'picture-card'
  autoUpload?: boolean
  maxSize?: number // MB
  tip?: string
}

interface Emits {
  (e: 'success', response: any, file: any, fileList: any[]): void
  (e: 'error', error: any, file: any, fileList: any[]): void
  (e: 'remove', file: any, fileList: any[]): void
  (e: 'preview', file: any): void
  (e: 'exceed', files: any[], fileList: any[]): void
}

const props = withDefaults(defineProps<Props>(), {
  multiple: false,
  limit: 10,
  drag: false,
  listType: 'text',
  autoUpload: true,
  maxSize: 100
})

const emit = defineEmits<Emits>()

const uploadRef = ref<UploadInstance>()

const beforeUpload: UploadProps['beforeUpload'] = (file) => {
  // Check file size
  const isLtMaxSize = file.size / 1024 / 1024 < props.maxSize
  if (!isLtMaxSize) {
    ElMessage.error(`文件大小不能超过 ${props.maxSize}MB!`)
    return false
  }
  
  // Check file type if accept is specified
  if (props.accept) {
    const acceptTypes = props.accept.split(',').map(t => t.trim())
    const fileType = file.type
    const fileName = file.name
    const fileExt = '.' + fileName.split('.').pop()
    
    const isAccepted = acceptTypes.some(type => {
      if (type.startsWith('.')) {
        return fileExt === type
      }
      return fileType.match(new RegExp(type.replace('*', '.*')))
    })
    
    if (!isAccepted) {
      ElMessage.error(`只能上传 ${props.accept} 格式的文件!`)
      return false
    }
  }
  
  return true
}

const handlePreview: UploadProps['onPreview'] = (file) => {
  emit('preview', file)
}

const handleRemove: UploadProps['onRemove'] = (file, fileList) => {
  emit('remove', file, fileList)
}

const handleSuccess: UploadProps['onSuccess'] = (response, file, fileList) => {
  emit('success', response, file, fileList)
}

const handleError: UploadProps['onError'] = (error, file, fileList) => {
  ElMessage.error('文件上传失败!')
  emit('error', error, file, fileList)
}

const handleExceed: UploadProps['onExceed'] = (files, fileList) => {
  ElMessage.warning(`最多只能上传 ${props.limit} 个文件!`)
  emit('exceed', files, fileList)
}

const submit = () => {
  uploadRef.value?.submit()
}

const clearFiles = () => {
  uploadRef.value?.clearFiles()
}

defineExpose({
  submit,
  clearFiles
})
</script>

<style scoped>
.file-upload {
  width: 100%;
}

.el-upload__tip {
  margin-top: 8px;
  font-size: 12px;
  color: #909399;
}
</style>
