<template>
  <div class="evidence-list">
    <el-table :data="evidenceList" v-loading="loading" max-height="300">
      <el-table-column prop="fileName" label="文件名" min-width="200" show-overflow-tooltip />
      <el-table-column prop="description" label="描述" min-width="200" show-overflow-tooltip />
      <el-table-column prop="category" label="分类" width="120">
        <template #default="{ row }">
          <el-tag v-if="row.category" size="small">{{ row.category }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="tags" label="标签" width="180">
        <template #default="{ row }">
          <el-tag
            v-for="tag in parseTags(row.tags)"
            :key="tag"
            size="small"
            style="margin-right: 6px"
          >
            {{ tag }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="uploadedAt" label="上传时间" width="180">
        <template #default="{ row }">
          {{ formatDateTime(row.uploadedAt) }}
        </template>
      </el-table-column>
      <template #empty>
        <TableEmpty description="暂无证据材料" />
      </template>
    </el-table>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { evidenceApi } from '@/api/evidence'
import TableEmpty from '@/components/common/TableEmpty.vue'

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
    const response: any = await evidenceApi.getEvidenceByCaseId(props.caseId)
    // 响应拦截器已经返回了 response.data。
    // 兼容后端返回多种格式：直接数组 或 { evidence: [...] } 或 { data: { items: [...] } }
      if (response) {
        let list: any[] = []
        if (Array.isArray(response)) {
          list = response
        } else if (Array.isArray(response.evidence)) {
          list = response.evidence
        } else if (Array.isArray(response.items)) {
          list = response.items
        } else if (Array.isArray(response.data?.items)) {
          list = response.data.items
        }

        if (list.length === 0) {
          evidenceList.value = []
        } else {
          // 统一映射为驼峰字段，兼容后端多种命名
          evidenceList.value = list.map((item: any) => ({
            id: item.id,
            caseId: item.case_id,
            fileName: item.file_name || item.fileName,
            fileType: item.file_type || item.fileType,
            filePath: item.storage_path || item.filePath || item.storagePath,
            fileSize: item.file_size || item.fileSize,
            category: item.category,
            tags: item.tags,
            description: item.description ?? item.remark ?? item.notes ?? '',
            uploadedBy: item.uploaded_by || item.uploadedBy,
            uploadedAt: item.uploaded_at || item.uploadedAt,
          }))
        }
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

// Helpers
const parseTags = (tags?: string): string[] => {
  if (!tags) return []
  return tags
    .split(',')
    .map((t) => t.trim())
    .filter((t) => t)
}

const formatDateTime = (datetime?: string) => {
  if (!datetime) return '-'
  return datetime.replace('T', ' ').split('.')[0]
}
</script>

<style scoped>
.evidence-list {
  min-height: 200px;
}
</style>
