<template>
  <div class="document-list">
    <TableEmpty v-if="documents.length === 0" description="暂无文书" />
    <el-table v-else :data="documents" stripe>
  <el-table-column prop="fileName" label="文件名" min-width="200" />
      <el-table-column prop="documentType" label="文书类型" width="120" />
  <el-table-column prop="remark" label="备注" min-width="200" show-overflow-tooltip />
      <el-table-column prop="uploadedAt" label="上传时间" width="180" />
      <el-table-column label="操作" width="200" fixed="right">
        <template #default="{ row }">
          <el-button link type="primary" @click="$emit('view', row)">查看</el-button>
          <el-button link type="primary" @click="$emit('download', row)">下载</el-button>
          <el-button link type="danger" @click="$emit('delete', row)">删除</el-button>
        </template>
      </el-table-column>
    </el-table>
  </div>
</template>

<script setup lang="ts">
import TableEmpty from '@/components/common/TableEmpty.vue'

defineProps<{
  documents: any[]
}>()

defineEmits<{
  view: [document: any]
  download: [document: any]
  delete: [document: any]
}>()

const formatFileSize = (bytes: number | undefined) => {
  if (!bytes) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i]
}
</script>

<style scoped>
.document-list {
  margin-top: 20px;
}
</style>
