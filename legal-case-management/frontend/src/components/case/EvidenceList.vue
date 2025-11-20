<template>
  <div class="evidence-list">
    <el-table :data="evidenceList" v-loading="loading" max-height="300">
      <el-table-column prop="file_name" label="文件名" min-width="200" show-overflow-tooltip />
      <el-table-column prop="category" label="分类" width="120">
        <template #default="{ row }">
          <el-tag v-if="row.category" size="small">{{ row.category }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column label="文件大小" width="120">
        <template #default="{ row }">
          {{ formatFileSize(row.file_size) }}
        </template>
      </el-table-column>
      <el-table-column prop="uploaded_at" label="上传时间" width="180" />
    </el-table>
    <el-empty v-if="evidenceList.length === 0 && !loading" description="暂无证据材料" />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { evidenceApi } from '@/api/evidence'

interface Props {
  caseId: number
}

const props = defineProps<Props>()

const loading = ref(false)
const evidenceList = ref<any[]>([])

const formatFileSize = (bytes: number): string => {
  if (!bytes) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i]
}

const loadEvidence = async () => {
  loading.value = true
  try {
    const response = await evidenceApi.getEvidenceByCaseId(props.caseId)
    // 响应拦截器已经返回了 response.data，所以这里直接使用
    if (response) {
      evidenceList.value = response.evidence || []
    } else {
      evidenceList.value = []
    }
  } catch (error: any) {
    console.error('加载证据材料失败:', error)
    evidenceList.value = []
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  loadEvidence()
})
</script>

<style scoped>
.evidence-list {
  min-height: 200px;
}
</style>
