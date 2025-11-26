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
        <el-form-item label="文书文件" prop="fileUrl">
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
      <div class="preview-area" v-if="showViewDialog">
        <!-- Preview similar to evidence page: image, pdf, audio/video or download fallback -->
        <div v-if="currentDocument">
          <div v-if="isImage(currentDocument.storagePath)">
            <el-image :src="currentDocument.storagePath" style="width:100%; max-height:70vh" fit="contain">
              <template #error>
                <div class="preview-error">图片加载失败</div>
              </template>
            </el-image>
          </div>
          <div v-else-if="isPdf(currentDocument.storagePath)">
            <iframe :src="currentDocument.storagePath" style="width:100%; height:70vh; border:none"></iframe>
          </div>
          <div v-else-if="isAudio(currentDocument.storagePath)">
            <audio controls style="width:100%"><source :src="currentDocument.storagePath" /></audio>
          </div>
          <div v-else-if="isVideo(currentDocument.storagePath)">
            <video controls style="width:100%; max-height:70vh"><source :src="currentDocument.storagePath" /></video>
          </div>
          <div v-else class="preview-fallback">
            <p>该文件无法直接预览，请下载查看</p>
          </div>
        </div>
      </div>
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
import request from "@/api/request";
import axios from "axios";

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
  fileUrl: null as string | null,
  fileName: null as string | null,
  description: ''
})

const uploadFormRef = ref<FormInstance>()
const uploadRules: FormRules = {
  documentType: [{ required: true, message: '请选择文书类型', trigger: 'change' }],
  fileUrl: [{ required: true, message: '请选择文件', trigger: 'change' }]
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
    // axios 拦截器已经返回了 response.data
    const data = response.documents || response || []
    const list = Array.isArray(data) ? data : []
    
    // 转换字段名从下划线到驼峰
    documents.value = list.map((item: any) => ({
      id: item.id,
      caseId: item.case_id,
      documentType: item.document_type,
      fileName: item.file_name,
      storagePath: item.storage_path,
      extractedContent: item.extracted_content,
      uploadedAt: item.uploaded_at,
      fileSize: item.file_size,
      // 兼容后端可能使用的字段名：remark / description / notes
      remark: item.remark ?? item.description ?? item.notes ?? ''
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

const handleFileChange = async (file: any) => {
  const response = await request.post(
    "https://x-fat.zhixinzg.com/code-app/file/getUploadSign",
    {
      fileName: file.name,
      contentType: file.raw.type,
      openFlag: "1",
    }
  );
  const { serviceUrl, uploadHeaders, fileUrl, requestMethod } =
    response.data ?? {};
  try {
    // 在浏览器环境中，直接使用文件对象
    const reader = new FileReader();
    reader.readAsArrayBuffer(file.raw as Blob);
    let fileData;
    reader.onload = (e) => {
      // 在文件读取结束后执行的操作
      fileData = e.target?.result;
      axios({
        url: serviceUrl,
        method: "put",
        data: fileData,
        headers: {
          ...(uploadHeaders || {}),
          "Content-Type": file.raw.type,
        },
      });
    };

    // 更新文件列表，设置上传成功文件的URL
    uploadForm.fileUrl = fileUrl
    uploadForm.fileName = file.name
  } catch (error) {
    console.error("上传失败", error);
    // 上传失败时移除对应文件
    uploadForm.fileUrl = null
    uploadForm.fileName = null
  }
}

const handleFileRemove = () => {
  uploadForm.fileUrl = null
  uploadForm.fileName = null
}

const handleUpload = async () => {
  if (!uploadFormRef.value) return
  
  await uploadFormRef.value.validate(async (valid) => {
    if (!valid) return

    uploading.value = true
    try {
      const formData = new FormData()
      formData.append('file', uploadForm.fileUrl!)
      formData.append('file_name', uploadForm.fileName!)
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
  uploadForm.fileUrl = null
  uploadForm.fileName = null
  uploadForm.description = ''
  uploadFormRef.value?.resetFields()
}

const handleView = (doc: any) => {
  currentDocument.value = doc
  showViewDialog.value = true
}

const isExternalUrl = (p?: string) => {
  return !!p && /^https?:\/\//i.test(p)
}

const isImage = (p?: string) => {
  return !!p && /\.(jpg|jpeg|png|gif|bmp|webp)(?:[?#]|$)/i.test(p)
}

const isPdf = (p?: string) => {
  return !!p && /\.pdf(?:[?#]|$)/i.test(p)
}

const isAudio = (p?: string) => {
  return !!p && /\.(mp3|wav|ogg|m4a|aac)(?:[?#]|$)/i.test(p)
}

const isVideo = (p?: string) => {
  return !!p && /\.(mp4|avi|mov|wmv|flv|webm|mkv)(?:[?#]|$)/i.test(p)
}

const handleDownload = async (doc: any) => {
  try {
    // 如果 storagePath 是外部 URL，直接打开该链接（浏览器会处理下载或预览）
    if (isExternalUrl(doc.storagePath)) {
      const a = document.createElement('a')
      a.href = doc.storagePath
      // 尝试设置 download 属性（跨域时浏览器可能忽略），以便尽可能触发下载
      a.setAttribute('download', doc.fileName || '')
      a.target = '_blank'
      document.body.appendChild(a)
      a.click()
      a.remove()
      return
    }

    // 否则，使用后端下载接口获取二进制流
    const response = await documentApi.downloadDocument(doc.id)
    const url = window.URL.createObjectURL(new Blob([response.data]))
    const link = document.createElement('a')
    link.href = url
    link.setAttribute('download', doc.fileName)
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

const handleDelete = async (doc: any) => {
  try {
    await ElMessageBox.confirm('确定要删除该文书吗？', '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })

    await documentApi.deleteDocument(doc.id)
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
