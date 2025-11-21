<template>
  <div class="document-management-container">
    <PageHeader title="文书管理" />
    
    <!-- Search and Filter -->
    <el-card class="search-card">
      <el-form :inline="true" :model="searchForm">
        <el-form-item label="文书类型">
          <el-select v-model="searchForm.documentType" placeholder="全部类型" clearable style="width: 180px">
            <el-option label="全部类型" value="" />
            <el-option v-for="type in documentTypes" :key="type" :label="type" :value="type" />
          </el-select>
        </el-form-item>
        <el-form-item label="关键词">
          <el-input v-model="searchForm.keyword" placeholder="搜索文件名" clearable style="width: 200px" />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleSearch">搜索</el-button>
          <el-button @click="handleReset">重置</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <!-- Action Bar -->
    <el-card class="action-card">
      <el-button type="primary" @click="showUploadDialog = true">
        <el-icon><Upload /></el-icon>
        上传文书
      </el-button>
      <el-button @click="handleRefresh">
        <el-icon><Refresh /></el-icon>
        刷新
      </el-button>
    </el-card>

    <!-- Document List by Type -->
    <el-card v-loading="loading">
      <el-tabs v-model="activeTab" @tab-change="handleTabChange">
        <el-tab-pane label="全部文书" name="all">
          <DocumentList :documents="filteredDocuments" @view="handleView" @download="handleDownload" @delete="handleDelete" />
        </el-tab-pane>
        <el-tab-pane v-for="type in documentTypes" :key="type" :label="type" :name="type">
          <DocumentList :documents="getDocumentsByType(type)" @view="handleView" @download="handleDownload" @delete="handleDelete" />
        </el-tab-pane>
      </el-tabs>
    </el-card>

    <!-- Upload Dialog -->
    <el-dialog v-model="showUploadDialog" title="上传文书" width="600px">
      <el-form :model="uploadForm" :rules="uploadRules" ref="uploadFormRef" label-width="100px">
        <el-form-item label="文书类型" prop="documentType">
          <el-select v-model="uploadForm.documentType" placeholder="请选择文书类型" style="width: 100%">
            <el-option v-for="type in documentTypes" :key="type" :label="type" :value="type" />
          </el-select>
        </el-form-item>
        <el-form-item label="文书文件" prop="file">
          <el-upload
            ref="uploadRef"
            :auto-upload="false"
            :limit="1"
            :on-change="handleFileChange"
            :on-remove="handleFileRemove"
            accept=".pdf,.doc,.docx"
          >
            <el-button type="primary">选择文件</el-button>
            <template #tip>
              <div class="el-upload__tip">支持 PDF、Word 格式，文件大小不超过 50MB</div>
            </template>
          </el-upload>
        </el-form-item>
        <el-form-item label="备注">
          <el-input v-model="uploadForm.description" type="textarea" :rows="3" placeholder="可选" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showUploadDialog = false">取消</el-button>
        <el-button type="primary" @click="handleUpload" :loading="uploading">上传</el-button>
      </template>
    </el-dialog>

    <!-- View Dialog -->
    <el-dialog v-model="showViewDialog" :title="currentDocument?.fileName" width="800px">
      <el-descriptions :column="2" border>
        <el-descriptions-item label="文书类型">{{ currentDocument?.documentType }}</el-descriptions-item>
        <el-descriptions-item label="文件大小">{{ formatFileSize(currentDocument?.fileSize) }}</el-descriptions-item>
        <el-descriptions-item label="上传时间">{{ currentDocument?.uploadedAt }}</el-descriptions-item>
        <el-descriptions-item label="存储路径">{{ currentDocument?.storagePath }}</el-descriptions-item>
        <el-descriptions-item label="备注" :span="2">{{ currentDocument?.description || '无' }}</el-descriptions-item>
      </el-descriptions>
      <template #footer>
        <el-button @click="showViewDialog = false">关闭</el-button>
        <el-button type="primary" @click="handleDownload(currentDocument)">下载</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { ElMessage, ElMessageBox, type FormInstance, type FormRules } from 'element-plus'
import { Upload, Refresh } from '@element-plus/icons-vue'
import { documentApi } from '@/api/document'
import PageHeader from '@/components/common/PageHeader.vue'
import DocumentList from './components/DocumentList.vue'

const route = useRoute()
const caseId = Number(route.params.id)

// Document types
const documentTypes = [
  '起诉状',
  '答辩状',
  '上诉状',
  '申请书',
  '判决书',
  '裁定书',
  '调解书',
  '通知书',
  '其他'
]

// State
const loading = ref(false)
const uploading = ref(false)
const documents = ref<any[]>([])
const activeTab = ref('all')
const showUploadDialog = ref(false)
const showViewDialog = ref(false)
const currentDocument = ref<any>(null)

// Search form
const searchForm = reactive({
  documentType: '',
  keyword: ''
})

// Upload form
const uploadForm = reactive({
  documentType: '',
  file: null as File | null,
  description: ''
})

const uploadFormRef = ref<FormInstance>()
const uploadRules: FormRules = {
  documentType: [{ required: true, message: '请选择文书类型', trigger: 'change' }],
  file: [{ required: true, message: '请选择文件', trigger: 'change' }]
}

// Computed
const filteredDocuments = computed(() => {
  let result = documents.value

  if (searchForm.documentType) {
    result = result.filter(doc => doc.documentType === searchForm.documentType)
  }

  if (searchForm.keyword) {
    result = result.filter(doc => 
      doc.fileName.toLowerCase().includes(searchForm.keyword.toLowerCase())
    )
  }

  return result
})

// Methods
const loadDocuments = async () => {
  loading.value = true
  try {
    const response = await documentApi.getDocumentsByCaseId(caseId)
    // axios 拦截器已经返回了 response.data，所以这里是 { data: { documents: [...] } }
    const data = response.data?.documents || []
    const list = Array.isArray(data) ? data : []
    
    // 转换字段名从下划线到驼峰
    documents.value = list.map((item: any) => ({
      id: item.id,
      caseId: item.case_id,
      documentType: item.document_type,
      // 使用 document_name 作为文件名
      fileName: item.document_name,
      storagePath: item.file_path || item.storage_path,
      extractedContent: item.extracted_content,
      uploadedAt: item.created_at,
      fileSize: item.file_size
    }))
  } catch (error) {
    console.error('加载文书列表失败:', error)
    ElMessage.error('加载文书列表失败')
    documents.value = []
  } finally {
    loading.value = false
  }
}

const getDocumentsByType = (type: string) => {
  return filteredDocuments.value.filter(doc => doc.documentType === type)
}

const handleSearch = () => {
  // Filter is reactive, no need to reload
}

const handleReset = () => {
  searchForm.documentType = ''
  searchForm.keyword = ''
}

const handleRefresh = () => {
  loadDocuments()
}

const handleTabChange = (tabName: string) => {
  if (tabName !== 'all') {
    searchForm.documentType = tabName
  } else {
    searchForm.documentType = ''
  }
}

const handleFileChange = (file: any) => {
  uploadForm.file = file.raw
}

const handleFileRemove = () => {
  uploadForm.file = null
}

const handleUpload = async () => {
  if (!uploadFormRef.value) return
  
  await uploadFormRef.value.validate(async (valid) => {
    if (!valid) return

    uploading.value = true
    try {
      const formData = new FormData()
      formData.append('file', uploadForm.file!)
      formData.append('case_id', String(caseId)) // 后端期望 case_id
      formData.append('document_type', uploadForm.documentType) // 后端期望 document_type
      if (uploadForm.description) {
        formData.append('description', uploadForm.description)
      }

      await documentApi.uploadDocument(formData)
      ElMessage.success('上传成功')
      showUploadDialog.value = false
      resetUploadForm()
      loadDocuments()
    } catch (error) {
      ElMessage.error('上传失败')
      console.error(error)
    } finally {
      uploading.value = false
    }
  })
}

const resetUploadForm = () => {
  uploadForm.documentType = ''
  uploadForm.file = null
  uploadForm.description = ''
  uploadFormRef.value?.resetFields()
}

const handleView = (document: any) => {
  currentDocument.value = document
  showViewDialog.value = true
}

const handleDownload = async (document: any) => {
  try {
    const response = await documentApi.downloadDocument(document.id)
    const url = window.URL.createObjectURL(new Blob([response.data]))
    const link = document.createElement('a')
    link.href = url
    link.setAttribute('download', document.fileName)
    document.body.appendChild(link)
    link.click()
    link.remove()
    window.URL.revokeObjectURL(url)
    ElMessage.success('下载成功')
  } catch (error) {
    ElMessage.error('下载失败')
    console.error(error)
  }
}

const handleDelete = async (document: any) => {
  try {
    await ElMessageBox.confirm('确定要删除该文书吗？', '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })

    await documentApi.deleteDocument(document.id)
    ElMessage.success('删除成功')
    loadDocuments()
  } catch (error: any) {
    if (error !== 'cancel') {
      ElMessage.error('删除失败')
      console.error(error)
    }
  }
}

const formatFileSize = (bytes: number | undefined) => {
  if (!bytes) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i]
}

onMounted(() => {
  loadDocuments()
})
</script>

<style scoped>
.document-management-container {
  padding: 20px;
}

.search-card,
.action-card {
  margin-bottom: 20px;
}

.action-card {
  display: flex;
  align-items: center;
}
</style>
