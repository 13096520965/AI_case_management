<template>
  <div class="document-list">
    <el-table :data="documentList" v-loading="loading" max-height="300">
      <el-table-column prop="document_type" label="文书类型" width="120" />
      <el-table-column prop="file_name" label="文件名" min-width="200" show-overflow-tooltip />
      <el-table-column label="文件大小" width="120">
        <template #default="{ row }">
          {{ formatFileSize(row.file_size) }}
        </template>
      </el-table-column>
      <el-table-column prop="uploaded_at" label="上传时间" width="180" />
    </el-table>
    <el-empty v-if="documentList.length === 0 && !loading" description="暂无文书材料" />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { documentApi } from '@/api/document'

interface Props {
  caseId: number
}

const props = defineProps<Props>()

const loading = ref(false)
const documentList = ref<any[]>([])

const formatFileSize = (bytes: number): string => {
  if (!bytes) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i]
}

const loadDocuments = async () => {
  loading.value = true
  try {
    const response = await documentApi.getDocumentsByCaseId(props.caseId)
    // 响应拦截器已经返回了 response.data，所以这里直接使用
    if (response) {
      documentList.value = response.documents || []
    } else {
      documentList.value = []
    }
  } catch (error: any) {
    console.error('加载文书材料失败:', error)
    documentList.value = []
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  loadDocuments()
})
</script>

<style scoped>
.document-list {
  min-height: 200px;
}
</style>
