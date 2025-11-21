<template>
  <div class="evidence-management">
    <PageHeader title="证据管理">
      <template #extra>
        <el-tag style="margin-right: 12px">案件ID: {{ caseId }}</el-tag>
        <el-button type="primary" :icon="Upload" @click="showUploadDialog = true">
          上传证据
        </el-button>
        <el-button :icon="Download" @click="handleBatchDownload" :disabled="selectedEvidence.length === 0">
          批量下载 ({{ selectedEvidence.length }})
        </el-button>
        <el-button-group class="view-toggle">
          <el-button :type="viewMode === 'list' ? 'primary' : ''" :icon="List" @click="viewMode = 'list'" />
          <el-button :type="viewMode === 'grid' ? 'primary' : ''" :icon="Grid" @click="viewMode = 'grid'" />
        </el-button-group>
      </template>
    </PageHeader>

    <!-- Filters -->
    <el-card class="filter-card">
      <el-form :inline="true" :model="filters">
        <el-form-item label="分类">
          <el-select v-model="filters.category" placeholder="全部分类" clearable @change="loadEvidence">
            <el-option label="全部" value="" />
            <el-option v-for="cat in categories" :key="cat" :label="cat" :value="cat" />
          </el-select>
        </el-form-item>
        <el-form-item label="标签">
          <el-input v-model="filters.tags" placeholder="输入标签搜索" clearable @change="loadEvidence" />
        </el-form-item>
        <el-form-item label="文件类型">
          <el-select v-model="filters.fileType" placeholder="全部类型" clearable @change="loadEvidence">
            <el-option label="全部" value="" />
            <el-option label="图片" value="image" />
            <el-option label="PDF" value="pdf" />
            <el-option label="音频" value="audio" />
            <el-option label="视频" value="video" />
            <el-option label="其他" value="other" />
          </el-select>
        </el-form-item>
      </el-form>
    </el-card>

    <!-- Evidence List/Grid -->
    <el-card class="content-card" v-loading="loading">
      <!-- List View -->
      <el-table
        v-if="viewMode === 'list'"
        :data="filteredEvidence"
        @selection-change="handleSelectionChange"
        style="width: 100%"
      >
        <el-table-column type="selection" width="55" />
        <el-table-column label="缩略图" width="100">
          <template #default="{ row }">
            <div class="thumbnail" @click="handlePreview(row)">
              <el-image
                v-if="isImage(row.fileType)"
                :src="getFileUrl(row.storagePath)"
                fit="cover"
                style="width: 60px; height: 60px; cursor: pointer;"
              />
              <el-icon v-else :size="40" class="file-icon">
                <Document v-if="isPdf(row.fileType)" />
                <Headset v-else-if="isAudio(row.fileType)" />
                <VideoCamera v-else-if="isVideo(row.fileType)" />
                <Files v-else />
              </el-icon>
            </div>
          </template>
        </el-table-column>
        <el-table-column prop="fileName" label="文件名" min-width="200" show-overflow-tooltip />
        <el-table-column label="文件大小" width="120">
          <template #default="{ row }">
            {{ formatFileSize(row.fileSize) }}
          </template>
        </el-table-column>
        <el-table-column prop="category" label="分类" width="120">
          <template #default="{ row }">
            <el-tag v-if="row.category" size="small">{{ row.category }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="tags" label="标签" width="150">
          <template #default="{ row }">
            <el-tag
              v-for="tag in parseTags(row.tags)"
              :key="tag"
              size="small"
              style="margin-right: 5px;"
            >
              {{ tag }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="uploadedBy" label="上传人" width="100" />
        <el-table-column label="上传时间" width="180">
          <template #default="{ row }">
            {{ formatDate(row.uploadedAt) }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="200" fixed="right">
          <template #default="{ row }">
            <el-button link type="primary" :icon="View" @click="handlePreview(row)">预览</el-button>
            <el-button link type="primary" :icon="Download" @click="handleDownload(row)">下载</el-button>
            <el-button link type="primary" :icon="Edit" @click="handleEdit(row)">编辑</el-button>
            <el-button link type="danger" :icon="Delete" @click="handleDelete(row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>

      <!-- Grid View -->
      <div v-else class="grid-view">
        <div
          v-for="item in filteredEvidence"
          :key="item.id"
          class="grid-item"
          :class="{ selected: isSelected(item) }"
        >
          <el-checkbox
            v-model="item.checked"
            class="grid-checkbox"
            @change="handleGridSelection(item)"
          />
          <div class="grid-thumbnail" @click="handlePreview(item)">
            <el-image
              v-if="isImage(item.fileType)"
              :src="getFileUrl(item.storagePath)"
              fit="cover"
              style="width: 100%; height: 100%;"
            />
            <div v-else class="file-icon-large">
              <el-icon :size="60">
                <Document v-if="isPdf(item.fileType)" />
                <Headset v-else-if="isAudio(item.fileType)" />
                <VideoCamera v-else-if="isVideo(item.fileType)" />
                <Files v-else />
              </el-icon>
            </div>
          </div>
          <div class="grid-info">
            <div class="file-name" :title="item.fileName">{{ item.fileName }}</div>
            <div class="file-meta">
              <span>{{ formatFileSize(item.fileSize) }}</span>
              <el-tag v-if="item.category" size="small">{{ item.category }}</el-tag>
            </div>
            <div class="file-tags">
              <el-tag
                v-for="tag in parseTags(item.tags)"
                :key="tag"
                size="small"
                style="margin-right: 5px;"
              >
                {{ tag }}
              </el-tag>
            </div>
            <div class="grid-actions">
              <el-button link type="primary" :icon="View" @click.stop="handlePreview(item)">预览</el-button>
              <el-button link type="primary" :icon="Download" @click.stop="handleDownload(item)">下载</el-button>
              <el-button link type="primary" :icon="Edit" @click.stop="handleEdit(item)">编辑</el-button>
              <el-button link type="danger" :icon="Delete" @click.stop="handleDelete(item)">删除</el-button>
            </div>
          </div>
        </div>
      </div>

      <el-empty v-if="filteredEvidence.length === 0" description="暂无证据" />
    </el-card>

    <!-- Upload Dialog -->
    <el-dialog
      v-model="showUploadDialog"
      title="上传证据"
      width="600px"
      @close="resetUploadForm"
    >
      <el-form :model="uploadForm" label-width="80px">
        <el-form-item label="文件">
          <el-upload
            ref="uploadRef"
            :auto-upload="false"
            :on-change="handleFileChange"
            :on-remove="handleFileRemove"
            :file-list="fileList"
            drag
            multiple
            :accept="acceptedFileTypes"
          >
            <el-icon class="el-icon--upload"><upload-filled /></el-icon>
            <div class="el-upload__text">
              拖拽文件到此处或 <em>点击上传</em>
            </div>
            <template #tip>
              <div class="el-upload__tip">
                支持 PDF、图片、音频、视频格式，单个文件不超过 100MB
              </div>
            </template>
          </el-upload>
        </el-form-item>
        <el-form-item label="分类">
          <el-select v-model="uploadForm.category" placeholder="请选择分类">
            <el-option v-for="cat in categories" :key="cat" :label="cat" :value="cat" />
          </el-select>
        </el-form-item>
        <el-form-item label="标签">
          <el-input
            v-model="uploadForm.tags"
            placeholder="多个标签用逗号分隔"
          />
        </el-form-item>
        <el-form-item label="描述">
          <el-input
            v-model="uploadForm.description"
            type="textarea"
            :rows="3"
            placeholder="请输入证据描述"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showUploadDialog = false">取消</el-button>
        <el-button type="primary" @click="handleUpload" :loading="uploading">
          {{ uploading ? `上传中 ${uploadProgress}%` : '确定上传' }}
        </el-button>
      </template>
    </el-dialog>

    <!-- Edit Dialog -->
    <el-dialog
      v-model="showEditDialog"
      title="编辑证据信息"
      width="500px"
    >
      <el-form :model="editForm" label-width="80px">
        <el-form-item label="分类">
          <el-select v-model="editForm.category" placeholder="请选择分类">
            <el-option v-for="cat in categories" :key="cat" :label="cat" :value="cat" />
          </el-select>
        </el-form-item>
        <el-form-item label="标签">
          <el-input
            v-model="editForm.tags"
            placeholder="多个标签用逗号分隔"
          />
        </el-form-item>
        <el-form-item label="描述">
          <el-input
            v-model="editForm.description"
            type="textarea"
            :rows="3"
            placeholder="请输入证据描述"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showEditDialog = false">取消</el-button>
        <el-button type="primary" @click="handleSaveEdit">保存</el-button>
      </template>
    </el-dialog>

    <!-- Preview Dialog -->
    <el-dialog
      v-model="showPreviewDialog"
      :title="previewFile?.fileName"
      width="80%"
      :fullscreen="previewFullscreen"
    >
      <div class="preview-container">
        <!-- Image Preview -->
        <el-image
          v-if="previewFile && isImage(previewFile.fileType)"
          :src="getFileUrl(previewFile.storagePath)"
          fit="contain"
          style="width: 100%; max-height: 70vh;"
        />
        
        <!-- PDF Preview -->
        <iframe
          v-else-if="previewFile && isPdf(previewFile.fileType)"
          :src="getFileUrl(previewFile.storagePath)"
          style="width: 100%; height: 70vh; border: none;"
        />
        
        <!-- Audio Preview -->
        <div v-else-if="previewFile && isAudio(previewFile.fileType)" class="audio-preview">
          <audio controls style="width: 100%;">
            <source :src="getFileUrl(previewFile.storagePath)" />
            您的浏览器不支持音频播放
          </audio>
        </div>
        
        <!-- Video Preview -->
        <div v-else-if="previewFile && isVideo(previewFile.fileType)" class="video-preview">
          <video controls style="width: 100%; max-height: 70vh;">
            <source :src="getFileUrl(previewFile.storagePath)" />
            您的浏览器不支持视频播放
          </video>
        </div>
        
        <!-- Unsupported Format -->
        <el-empty v-else description="该文件格式不支持预览，请下载后查看" />
      </div>
      <template #footer>
        <el-button @click="previewFullscreen = !previewFullscreen">
          {{ previewFullscreen ? '退出全屏' : '全屏' }}
        </el-button>
        <el-button type="primary" :icon="Download" @click="handleDownload(previewFile!)">
          下载
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  Upload,
  Download,
  List,
  Grid,
  View,
  Edit,
  Delete,
  Document,
  Headset,
  VideoCamera,
  Files,
  UploadFilled
} from '@element-plus/icons-vue'
import { evidenceApi } from '@/api/evidence'
import type { Evidence, EvidenceCategory, ViewMode } from '@/types'
import PageHeader from '@/components/common/PageHeader.vue'

const route = useRoute()
const caseId = ref(Number(route.params.id))

// State
const loading = ref(false)
const evidenceList = ref<Evidence[]>([])
const selectedEvidence = ref<Evidence[]>([])
const viewMode = ref<ViewMode>('list')

// Filters
const filters = ref({
  category: '',
  tags: '',
  fileType: ''
})

const categories: EvidenceCategory[] = [
  '书证',
  '物证',
  '视听资料',
  '电子数据',
  '证人证言',
  '鉴定意见',
  '勘验笔录',
  '其他'
]

// Upload
const showUploadDialog = ref(false)
const uploading = ref(false)
const uploadProgress = ref(0)
const uploadRef = ref()
const fileList = ref<any[]>([])
const uploadForm = ref({
  category: '',
  tags: '',
  description: ''
})

const acceptedFileTypes = '.pdf,.jpg,.jpeg,.png,.gif,.mp3,.wav,.mp4,.avi,.mov,.doc,.docx'

// Edit
const showEditDialog = ref(false)
const editForm = ref({
  id: 0,
  category: '',
  tags: '',
  description: ''
})

// Preview
const showPreviewDialog = ref(false)
const previewFile = ref<Evidence | null>(null)
const previewFullscreen = ref(false)

// Computed
const filteredEvidence = computed(() => {
  console.log('Computing filteredEvidence, evidenceList.value:', evidenceList.value)
  let result = evidenceList.value

  if (filters.value.category) {
    result = result.filter(e => e.category === filters.value.category)
  }

  if (filters.value.tags) {
    result = result.filter(e => 
      e.tags?.toLowerCase().includes(filters.value.tags.toLowerCase())
    )
  }

  if (filters.value.fileType) {
    const type = filters.value.fileType
    result = result.filter(e => {
      if (type === 'image') return isImage(e.fileType)
      if (type === 'pdf') return isPdf(e.fileType)
      if (type === 'audio') return isAudio(e.fileType)
      if (type === 'video') return isVideo(e.fileType)
      return true
    })
  }

  console.log('Filtered evidence result:', result)
  return result
})

// Methods
const loadEvidence = async () => {
  loading.value = true
  try {
    const params: any = {}
    if (filters.value.category) params.category = filters.value.category
    if (filters.value.tags) params.tags = filters.value.tags

    const response = await evidenceApi.getEvidenceByCaseId(caseId.value, params)
    
    // axios 拦截器已经返回了 response.data，所以 response 就是后端返回的数据
    // 后端返回 { count: X, evidence: [...] }
    if (response && response.evidence) {
      const list = Array.isArray(response.evidence) ? response.evidence : []
      
      // 转换字段名从下划线到驼峰
      evidenceList.value = list.map((item: any) => ({
        id: item.id,
        caseId: item.case_id,
        fileName: item.file_name,
        fileType: item.file_type,
        fileSize: item.file_size,
        storagePath: item.storage_path,
        category: item.category,
        tags: item.tags,
        description: item.description,
        uploadedBy: item.uploaded_by,
        uploadedAt: item.uploaded_at,
        version: item.version,
        checked: false
      }))
    } else {
      evidenceList.value = []
    }
  } catch (error: any) {
    console.error('加载证据列表失败:', error)
    ElMessage.error(error.message || '加载证据列表失败')
    evidenceList.value = []
  } finally {
    loading.value = false
  }
}

const handleFileChange = (file: any, files: any[]) => {
  fileList.value = files
}

const handleFileRemove = (file: any, files: any[]) => {
  fileList.value = files
}

const handleUpload = async () => {
  if (fileList.value.length === 0) {
    ElMessage.warning('请选择要上传的文件')
    return
  }

  uploading.value = true
  uploadProgress.value = 0

  try {
    for (let i = 0; i < fileList.value.length; i++) {
      const file = fileList.value[i]
      const formData = new FormData()
      formData.append('file', file.raw)
      formData.append('case_id', caseId.value.toString()) // 后端期望 case_id
      formData.append('category', uploadForm.value.category)
      formData.append('tags', uploadForm.value.tags)
      formData.append('description', uploadForm.value.description)

      await evidenceApi.uploadEvidence(formData)
      uploadProgress.value = Math.round(((i + 1) / fileList.value.length) * 100)
    }

    ElMessage.success('上传成功')
    showUploadDialog.value = false
    resetUploadForm()
    loadEvidence()
  } catch (error: any) {
    ElMessage.error(error.message || '上传失败')
  } finally {
    uploading.value = false
    uploadProgress.value = 0
  }
}

const resetUploadForm = () => {
  fileList.value = []
  uploadForm.value = {
    category: '',
    tags: '',
    description: ''
  }
}

const handleSelectionChange = (selection: Evidence[]) => {
  selectedEvidence.value = selection
}

const handleGridSelection = (item: Evidence) => {
  const index = selectedEvidence.value.findIndex(e => e.id === item.id)
  if (item.checked && index === -1) {
    selectedEvidence.value.push(item)
  } else if (!item.checked && index !== -1) {
    selectedEvidence.value.splice(index, 1)
  }
}

const isSelected = (item: Evidence) => {
  return selectedEvidence.value.some(e => e.id === item.id)
}

const handlePreview = (evidence: Evidence) => {
  previewFile.value = evidence
  showPreviewDialog.value = true
  previewFullscreen.value = false
}

const handleDownload = async (evidence: Evidence) => {
  try {
    const response = await evidenceApi.downloadEvidence(evidence.id)
    const url = window.URL.createObjectURL(new Blob([response.data]))
    const link = document.createElement('a')
    link.href = url
    link.setAttribute('download', evidence.fileName)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    window.URL.revokeObjectURL(url)
    ElMessage.success('下载成功')
  } catch (error: any) {
    ElMessage.error(error.message || '下载失败')
  }
}

const handleBatchDownload = async () => {
  if (selectedEvidence.value.length === 0) {
    ElMessage.warning('请选择要下载的证据')
    return
  }

  try {
    for (const evidence of selectedEvidence.value) {
      await handleDownload(evidence)
    }
  } catch (error: any) {
    ElMessage.error(error.message || '批量下载失败')
  }
}

const handleEdit = (evidence: Evidence) => {
  editForm.value = {
    id: evidence.id,
    category: evidence.category || '',
    tags: evidence.tags || '',
    description: evidence.description || ''
  }
  showEditDialog.value = true
}

const handleSaveEdit = async () => {
  try {
    await evidenceApi.updateEvidence(editForm.value.id, {
      category: editForm.value.category,
      tags: editForm.value.tags,
      description: editForm.value.description
    })
    ElMessage.success('更新成功')
    showEditDialog.value = false
    loadEvidence()
  } catch (error: any) {
    ElMessage.error(error.message || '更新失败')
  }
}

const handleDelete = async (evidence: Evidence) => {
  try {
    await ElMessageBox.confirm(
      `确定要删除证据 "${evidence.fileName}" 吗？此操作不可恢复。`,
      '删除确认',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )

    await evidenceApi.deleteEvidence(evidence.id)
    ElMessage.success('删除成功')
    loadEvidence()
  } catch (error: any) {
    if (error !== 'cancel') {
      ElMessage.error(error.message || '删除失败')
    }
  }
}

// Utility functions
const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i]
}

const formatDate = (dateString: string): string => {
  const date = new Date(dateString)
  return date.toLocaleString('zh-CN')
}

const parseTags = (tags?: string): string[] => {
  if (!tags) return []
  return tags.split(',').map(t => t.trim()).filter(t => t)
}

const isImage = (fileType: string): boolean => {
  return /^image\/(jpeg|jpg|png|gif|bmp|webp)$/i.test(fileType)
}

const isPdf = (fileType: string): boolean => {
  return fileType === 'application/pdf'
}

const isAudio = (fileType: string): boolean => {
  return /^audio\/(mpeg|mp3|wav|ogg)$/i.test(fileType)
}

const isVideo = (fileType: string): boolean => {
  return /^video\/(mp4|avi|mov|wmv|flv|webm)$/i.test(fileType)
}

const getFileUrl = (storagePath: string): string => {
  // Assuming the backend serves files from /uploads
  return `http://localhost:3000${storagePath}`
}

// Lifecycle
onMounted(() => {
  loadEvidence()
})
</script>

<style scoped>
.evidence-management {
  padding: 20px;
}

.header-card {
  margin-bottom: 20px;
}

.header-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.title-section {
  display: flex;
  align-items: center;
  gap: 15px;
}

.title-section h2 {
  margin: 0;
}

.action-section {
  display: flex;
  gap: 10px;
  align-items: center;
}

.view-toggle {
  margin-left: 10px;
}

.filter-card {
  margin-bottom: 20px;
}

.content-card {
  min-height: 400px;
}

.thumbnail {
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
}

.file-icon {
  color: #909399;
}

/* Grid View Styles */
.grid-view {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  gap: 20px;
  padding: 10px;
}

.grid-item {
  border: 1px solid #dcdfe6;
  border-radius: 4px;
  overflow: hidden;
  transition: all 0.3s;
  position: relative;
  cursor: pointer;
}

.grid-item:hover {
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
  transform: translateY(-2px);
}

.grid-item.selected {
  border-color: #409eff;
  box-shadow: 0 0 0 2px rgba(64, 158, 255, 0.2);
}

.grid-checkbox {
  position: absolute;
  top: 10px;
  left: 10px;
  z-index: 10;
}

.grid-thumbnail {
  width: 100%;
  height: 180px;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: #f5f7fa;
  overflow: hidden;
}

.file-icon-large {
  color: #909399;
}

.grid-info {
  padding: 12px;
}

.file-name {
  font-weight: 500;
  margin-bottom: 8px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.file-meta {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
  font-size: 12px;
  color: #909399;
}

.file-tags {
  margin-bottom: 8px;
  min-height: 24px;
}

.grid-actions {
  display: flex;
  justify-content: space-around;
  padding-top: 8px;
  border-top: 1px solid #ebeef5;
}

/* Preview Styles */
.preview-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 400px;
}

.audio-preview,
.video-preview {
  width: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 40px;
}
</style>
