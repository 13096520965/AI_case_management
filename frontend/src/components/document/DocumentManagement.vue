<template>
  <div class="document-management">
    <!-- 操作按钮 -->
    <div class="action-buttons">
      <el-button
        type="primary"
        @click="showGeneratorDialog = true"
      >
        <el-icon><MagicStick /></el-icon>
        智能生成
      </el-button>
      <el-button
        type="success"
        @click="showReviewerDialog = true"
      >
        <el-icon><CircleCheck /></el-icon>
        智能审核
      </el-button>
      <el-button @click="refreshDocuments">
        <el-icon><Refresh /></el-icon>
        刷新
      </el-button>
    </div>

    <!-- 文书列表 -->
    <el-table
      v-loading="loading"
      :data="documents"
      border
      style="margin-top: 20px"
    >
      <el-table-column type="index" label="序号" width="60" />
      <el-table-column prop="document_name" label="文书名称" min-width="150" />
      <el-table-column prop="document_type" label="文书类型" width="120">
        <template #default="{ row }">
          <el-tag :type="getDocumentTypeTag(row.document_type)" size="small">
            {{ getDocumentTypeName(row.document_type) }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="creator_name" label="创建人" width="100" />
      <el-table-column prop="created_at" label="创建时间" width="160">
        <template #default="{ row }">
          {{ formatDateTime(row.created_at) }}
        </template>
      </el-table-column>
      <el-table-column label="操作" width="200" fixed="right">
        <template #default="{ row }">
          <el-button type="primary" size="small" link @click="viewDocument(row)">
            查看
          </el-button>
          <el-button type="success" size="small" link @click="downloadDocument(row)">
            下载
          </el-button>
          <el-button type="danger" size="small" link @click="deleteDocument(row)">
            删除
          </el-button>
        </template>
      </el-table-column>
    </el-table>

    <!-- 空状态 -->
    <el-empty
      v-if="!loading && documents.length === 0"
      description="暂无文书，点击上方按钮开始生成"
      :image-size="120"
    />

    <!-- 智能生成对话框 -->
    <SmartDocumentGenerator
      v-model="showGeneratorDialog"
      :case-id="caseId"
      :case-info="caseInfo"
      :parties="parties"
      @success="handleGenerateSuccess"
    />

    <!-- 智能审核对话框 -->
    <SmartDocumentReviewer
      v-model="showReviewerDialog"
      :case-id="caseId"
      :case-info="caseInfo"
      @success="handleReviewSuccess"
    />

    <!-- 文书查看对话框 -->
    <el-dialog
      v-model="showViewDialog"
      :title="currentDocument?.document_name"
      width="800px"
    >
      <div class="document-content">
        <pre>{{ currentDocument?.content }}</pre>
      </div>
      <template #footer>
        <el-button @click="showViewDialog = false">关闭</el-button>
        <el-button type="primary" @click="downloadCurrentDocument">
          <el-icon><Download /></el-icon>
          下载
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  MagicStick, CircleCheck, Refresh, Download
} from '@element-plus/icons-vue'
import { documentApi } from '@/api/document'
import SmartDocumentGenerator from './SmartDocumentGenerator.vue'
import SmartDocumentReviewer from './SmartDocumentReviewer.vue'

interface Props {
  caseId: number
  caseInfo: any
  parties: any[]
}

const props = defineProps<Props>()

const loading = ref(false)
const documents = ref<any[]>([])
const showGeneratorDialog = ref(false)
const showReviewerDialog = ref(false)
const showViewDialog = ref(false)
const currentDocument = ref<any>(null)

const documentTypeMap: Record<string, string> = {
  complaint: '起诉状',
  defense: '答辩状',
  agency_opinion: '代理词',
  case_report: '案件汇报材料',
  evidence_list: '证据清单',
  legal_opinion: '法律意见书'
}

const loadDocuments = async () => {
  loading.value = true
  try {
    const response = await documentApi.getDocumentsByCaseId(props.caseId)
    documents.value = response.data.documents || []
  } catch (error) {
    console.error('加载文书列表失败:', error)
    ElMessage.error('加载文书列表失败')
  } finally {
    loading.value = false
  }
}

const refreshDocuments = () => {
  loadDocuments()
}

const getDocumentTypeName = (type: string) => {
  return documentTypeMap[type] || type
}

const getDocumentTypeTag = (type: string) => {
  const tagMap: Record<string, string> = {
    complaint: 'danger',
    defense: 'warning',
    agency_opinion: 'success',
    case_report: 'info',
    evidence_list: '',
    legal_opinion: 'primary'
  }
  return tagMap[type] || ''
}

const formatDateTime = (datetime: string) => {
  if (!datetime) return '-'
  return new Date(datetime).toLocaleString('zh-CN')
}

const viewDocument = async (doc: any) => {
  try {
    const response = await documentApi.getDocumentById(doc.id)
    currentDocument.value = response.data.document
    showViewDialog.value = true
  } catch (error) {
    console.error('查看文书失败:', error)
    ElMessage.error('查看文书失败')
  }
}

const downloadDocument = async (doc: any) => {
  try {
    const response = await documentApi.getDocumentById(doc.id)
    const content = response.data.document.content
    
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `${doc.document_name}.txt`
    link.click()
    URL.revokeObjectURL(url)
    
    ElMessage.success('文书已下载')
  } catch (error) {
    console.error('下载文书失败:', error)
    ElMessage.error('下载文书失败')
  }
}

const downloadCurrentDocument = () => {
  if (!currentDocument.value) return
  
  const blob = new Blob([currentDocument.value.content], { type: 'text/plain;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `${currentDocument.value.document_name}.txt`
  link.click()
  URL.revokeObjectURL(url)
  
  ElMessage.success('文书已下载')
}

const deleteDocument = async (doc: any) => {
  try {
    await ElMessageBox.confirm(
      `确定要删除文书"${doc.document_name}"吗？`,
      '确认删除',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )
    
    await documentApi.deleteDocument(doc.id)
    ElMessage.success('文书已删除')
    loadDocuments()
  } catch (error: any) {
    if (error !== 'cancel') {
      console.error('删除文书失败:', error)
      ElMessage.error('删除文书失败')
    }
  }
}

const handleGenerateSuccess = () => {
  ElMessage.success('文书生成并保存成功')
  loadDocuments()
}

const handleReviewSuccess = () => {
  ElMessage.success('文书审核完成')
}

onMounted(() => {
  loadDocuments()
})
</script>

<style scoped>
.document-management {
  padding: 20px 0;
}

.action-buttons {
  display: flex;
  gap: 10px;
}

.document-content {
  max-height: 600px;
  overflow-y: auto;
  padding: 20px;
  background: #f5f7fa;
  border-radius: 4px;
}

.document-content pre {
  margin: 0;
  font-family: 'Courier New', monospace;
  font-size: 14px;
  line-height: 1.8;
  white-space: pre-wrap;
  word-wrap: break-word;
  color: #303133;
}
</style>
