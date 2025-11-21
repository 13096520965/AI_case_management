<template>
  <div class="case-detail-container">
    <PageHeader title="案件详情">
      <template #extra>
        <el-button type="primary" @click="goToLogs">
          <el-icon><Document /></el-icon>
          查看日志
        </el-button>
      </template>
    </PageHeader>
    
    <div v-loading="loading">
      <!-- Basic Information -->
      <el-card shadow="never" class="info-card">
        <template #header>
          <div class="card-header">
            <span class="card-title">基本信息</span>
            <el-button type="primary" link @click="handleEdit">
              <el-icon><Edit /></el-icon>
              编辑
            </el-button>
          </div>
        </template>
        
        <el-descriptions :column="2" border>
          <el-descriptions-item label="案件ID">
            {{ caseData.id || '-' }}
          </el-descriptions-item>
          <el-descriptions-item label="案号">
            {{ caseData.caseNumber || '-' }}
          </el-descriptions-item>
          <el-descriptions-item label="内部编号">
            {{ caseData.internalNumber || '-' }}
          </el-descriptions-item>
          <el-descriptions-item label="案件类型">
            <el-tag :type="getCaseTypeTag(caseData.caseType)">
              {{ caseData.caseType || '-' }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="案件状态">
            <el-tag :type="getStatusTag(caseData.status)">
              {{ caseData.status || '-' }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="案由">
            {{ caseData.caseCause || '-' }}
          </el-descriptions-item>
          <el-descriptions-item label="受理法院">
            {{ caseData.court || '-' }}
          </el-descriptions-item>
          <el-descriptions-item label="标的额">
            {{ formatAmount(caseData.targetAmount) }}
          </el-descriptions-item>
          <el-descriptions-item label="立案日期">
            {{ formatDate(caseData.filingDate) }}
          </el-descriptions-item>
          <el-descriptions-item label="创建时间">
            {{ formatDateTime(caseData.createdAt) }}
          </el-descriptions-item>
          <el-descriptions-item label="更新时间">
            {{ formatDateTime(caseData.updatedAt) }}
          </el-descriptions-item>
        </el-descriptions>
      </el-card>

      <!-- Litigation Parties -->
      <el-card shadow="never" class="info-card">
        <template #header>
          <div class="card-header">
            <span class="card-title">诉讼主体</span>
          </div>
        </template>
        
        <PartyManagement :case-id="caseId" @refresh="fetchCaseData" />
      </el-card>

      <!-- Process Nodes Timeline -->
      <el-card shadow="never" class="info-card">
        <template #header>
          <div class="card-header">
            <span class="card-title">流程节点</span>
            <div class="header-actions">
              <el-button type="success" size="small" @click="showTemplateDialog = true">
                <el-icon><FolderOpened /></el-icon>
                应用模板
              </el-button>
              <el-button type="primary" size="small" @click="showAddNodeDialog = true">
                <el-icon><Plus /></el-icon>
                添加节点
              </el-button>
              <el-button type="default" size="small" link @click="goToProcess">
                查看详情
              </el-button>
            </div>
          </div>
        </template>
        
        <el-timeline v-if="processNodes.length > 0">
          <el-timeline-item
            v-for="node in processNodes"
            :key="node.id"
            :timestamp="formatDate(node.startTime)"
            :color="getNodeColor(node.status)"
          >
            <div class="timeline-content">
              <div class="node-header">
                <div style="display: flex; align-items: center; gap: 8px;">
                  <span class="node-name">{{ node.nodeName }}</span>
                  <el-tag v-if="node.progress === 100" type="success" size="small">已完成</el-tag>
                </div>
                <div class="node-actions">
                  <el-tag :type="getNodeStatusTag(node.status)" size="small">
                    {{ node.status }}
                  </el-tag>
                  <el-button 
                    type="primary" 
                    size="small" 
                    link 
                    @click="handleEditNode(node)"
                  >
                    编辑
                  </el-button>
                </div>
              </div>
              <div class="node-info">
                <span>经办人: {{ node.handler || '-' }}</span>
                <span v-if="node.deadline">截止日期: {{ formatDate(node.deadline) }}</span>
                <span v-if="node.progress !== undefined">进度: {{ node.progress }}%</span>
              </div>
            </div>
          </el-timeline-item>
        </el-timeline>
        
        <el-empty v-else description="暂无流程节点，可以应用模板或手动添加" />
      </el-card>

      <!-- Apply Template Dialog -->
      <el-dialog 
        v-model="showTemplateDialog" 
        title="应用流程模板" 
        width="600px"
      >
        <el-form :model="templateForm" label-width="100px">
          <el-form-item label="选择模板">
            <el-select 
              v-model="templateForm.templateId" 
              placeholder="请选择流程模板" 
              style="width: 100%"
              @change="handleTemplateChange"
            >
              <el-option 
                v-for="template in processTemplates" 
                :key="template.id" 
                :label="template.template_name" 
                :value="template.id"
              >
                <div style="display: flex; justify-content: space-between;">
                  <span>{{ template.template_name }}</span>
                  <span style="color: #8492a6; font-size: 13px;">
                    {{ template.node_count || 0 }} 个节点
                  </span>
                </div>
              </el-option>
            </el-select>
          </el-form-item>
          
          <el-form-item label="模板说明" v-if="selectedTemplate">
            <div class="template-description">
              {{ selectedTemplate.description || '暂无说明' }}
            </div>
          </el-form-item>
          
          <el-form-item label="节点预览" v-if="templateNodes.length > 0">
            <div class="template-nodes-preview">
              <el-tag 
                v-for="(node, index) in templateNodes" 
                :key="index"
                style="margin-right: 8px; margin-bottom: 8px;"
              >
                {{ node.node_name }}
              </el-tag>
            </div>
          </el-form-item>
        </el-form>
        
        <template #footer>
          <el-button @click="showTemplateDialog = false">取消</el-button>
          <el-button 
            type="primary" 
            @click="handleApplyTemplate"
            :loading="applyingTemplate"
            :disabled="!templateForm.templateId"
          >
            应用模板
          </el-button>
        </template>
      </el-dialog>

      <!-- Add/Edit Node Dialog -->
      <el-dialog 
        v-model="showAddNodeDialog" 
        :title="editingNode ? '编辑节点' : '添加节点'" 
        width="600px"
      >
        <el-form 
          :model="nodeForm" 
          :rules="nodeRules"
          ref="nodeFormRef"
          label-width="100px"
        >
          <el-form-item label="节点名称" prop="nodeName">
            <el-input 
              v-model="nodeForm.nodeName" 
              placeholder="例如：立案、开庭、判决等"
            />
          </el-form-item>
          
          <el-form-item label="节点类型" prop="nodeType">
            <el-select 
              v-model="nodeForm.nodeType" 
              placeholder="请选择节点类型"
              style="width: 100%"
            >
              <el-option label="立案" value="立案" />
              <el-option label="送达" value="送达" />
              <el-option label="举证" value="举证" />
              <el-option label="开庭" value="开庭" />
              <el-option label="调解" value="调解" />
              <el-option label="判决" value="判决" />
              <el-option label="执行" value="执行" />
              <el-option label="其他" value="其他" />
            </el-select>
          </el-form-item>
          
          <el-form-item label="经办人">
            <el-input 
              v-model="nodeForm.handler" 
              placeholder="负责人姓名"
            />
          </el-form-item>
          
          <el-form-item label="开始时间">
            <el-date-picker
              v-model="nodeForm.startTime"
              type="date"
              placeholder="选择开始时间"
              value-format="YYYY-MM-DD"
              style="width: 100%"
            />
          </el-form-item>
          
          <el-form-item label="截止日期">
            <el-date-picker
              v-model="nodeForm.deadline"
              type="date"
              placeholder="选择截止日期"
              value-format="YYYY-MM-DD"
              style="width: 100%"
            />
          </el-form-item>
          
          <el-form-item label="节点状态">
            <el-select 
              v-model="nodeForm.status" 
              placeholder="请选择状态"
              style="width: 100%"
            >
              <el-option label="待处理" value="待处理" />
              <el-option label="进行中" value="进行中" />
              <el-option label="已完成" value="已完成" />
            </el-select>
          </el-form-item>
          
          <el-form-item label="完成进度">
            <el-slider 
              v-model="nodeForm.progress" 
              :marks="{ 0: '0%', 50: '50%', 100: '100%' }"
            />
          </el-form-item>
        </el-form>
        
        <template #footer>
          <el-button @click="showAddNodeDialog = false">取消</el-button>
          <el-button 
            type="primary" 
            @click="handleSaveNode"
            :loading="savingNode"
          >
            保存
          </el-button>
        </template>
      </el-dialog>

      <!-- Evidence List -->
      <el-card shadow="never" class="info-card">
        <template #header>
          <div class="card-header">
            <span class="card-title">证据材料</span>
            <div class="header-actions">
              <el-button 
                type="primary" 
                size="small" 
                :icon="Upload" 
                @click="showUploadEvidenceDialog = true"
              >
                上传证据
              </el-button>
              <el-button 
                type="primary" 
                size="small" 
                :icon="Download" 
                @click="handleBatchDownloadEvidence" 
                :disabled="selectedEvidenceList.length === 0"
              >
                批量下载 ({{ selectedEvidenceList.length }})
              </el-button>
              <el-button type="default" size="small" link @click="goToEvidence">
                查看详情
              </el-button>
            </div>
          </div>
        </template>
        
        <el-table 
          :data="evidenceList" 
          stripe 
          max-height="300"
          @selection-change="handleEvidenceSelectionChange"
        >
          <el-table-column type="selection" width="55" />
          <el-table-column prop="fileName" label="文件名" min-width="120" show-overflow-tooltip />
          <el-table-column prop="fileType" label="文件类型" width="100">
            <template #default="{ row }">
              {{ getFileTypeLabel(row.fileType) }}
            </template>
          </el-table-column>
          <el-table-column prop="category" label="分类" width="80" />
          <el-table-column prop="uploadedAt" label="上传时间" width="140">
            <template #default="{ row }">
              {{ formatDateTime(row.uploadedAt) }}
            </template>
          </el-table-column>
          <el-table-column label="操作" width="150" fixed="right">
            <template #default="{ row }">
              <el-button type="primary" size="small" link @click="handlePreviewEvidence(row)">
                预览
              </el-button>
              <el-button type="success" size="small" link @click="handleDownloadEvidence(row)">
                下载
              </el-button>
            </template>
          </el-table-column>
        </el-table>
        
        <el-empty v-if="evidenceList.length === 0" description="暂无证据材料" />
      </el-card>

      <!-- Documents List -->
      <el-card shadow="never" class="info-card">
        <template #header>
          <div class="card-header">
            <span class="card-title">文书材料</span>
            <div class="header-actions">
              <el-button 
                type="success" 
                size="small" 
                @click="showDocumentGeneratorDialog = true"
              >
                <el-icon><MagicStick /></el-icon>
                智能生成文书
              </el-button>
              <el-button 
                type="primary" 
                size="small" 
                @click="showUploadDocumentDialog = true"
              >
                <el-icon><Upload /></el-icon>
                上传文书
              </el-button>
              <el-button type="default" size="small" link @click="goToDocuments">
                查看详情
              </el-button>
            </div>
          </div>
        </template>
        
        <el-table :data="documentList" stripe max-height="300">
          <el-table-column prop="documentType" label="文书类型" width="120" />
          <el-table-column prop="fileName" label="文件名" min-width="150" show-overflow-tooltip />
          <el-table-column prop="uploadedAt" label="上传时间" width="160">
            <template #default="{ row }">
              {{ formatDateTime(row.uploadedAt) }}
            </template>
          </el-table-column>
          <el-table-column label="操作" width="180" fixed="right">
            <template #default="{ row }">
              <el-button type="primary" size="small" link @click="handlePreviewDocument(row)">
                预览
              </el-button>
              <el-button type="success" size="small" link @click="handleDownloadDocument(row)">
                下载
              </el-button>
              <el-button type="danger" size="small" link @click="handleDeleteDocument(row)">
                删除
              </el-button>
            </template>
          </el-table-column>
        </el-table>
        
        <el-empty v-if="documentList.length === 0" description="暂无文书材料" />
      </el-card>

      <!-- Smart Document Generation -->
      <el-card shadow="never" class="info-card">
        <template #header>
          <div class="card-header">
            <span class="card-title">文书智能生成</span>
            <el-tag type="success" size="small" effect="light">
              <el-icon style="margin-right: 4px;"><MagicStick /></el-icon>
              智能AI辅助
            </el-tag>
          </div>
        </template>
        
        <DocumentManagement
          v-if="caseData.id"
          :case-id="caseData.id"
          :case-info="caseData"
          :parties="parties"
        />
      </el-card>

      <!-- Cost Records -->
      <el-card shadow="never" class="info-card">
        <template #header>
          <div class="card-header">
            <span class="card-title">成本记录</span>
            <el-button type="primary" link @click="goToCosts">
              查看详情
            </el-button>
          </div>
        </template>
        
        <el-table :data="costRecords" stripe max-height="300" show-summary :summary-method="getCostSummary">
          <el-table-column prop="costType" label="费用类型" width="120" />
          <el-table-column prop="amount" label="金额（元）" width="150" align="right">
            <template #default="{ row }">
              {{ formatAmount(row.amount) }}
            </template>
          </el-table-column>
          <el-table-column prop="paymentDate" label="支付日期" width="120">
            <template #default="{ row }">
              {{ formatDate(row.paymentDate) }}
            </template>
          </el-table-column>
          <el-table-column prop="status" label="状态" width="100">
            <template #default="{ row }">
              <el-tag :type="row.status === '已支付' ? 'success' : 'warning'" size="small">
                {{ row.status }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="payer" label="支付方" min-width="120" />
        </el-table>
        
        <el-empty v-if="costRecords.length === 0" description="暂无成本记录" />
      </el-card>
    </div>

    <!-- Upload Evidence Dialog -->
    <el-dialog
      v-model="showUploadEvidenceDialog"
      title="上传证据"
      width="600px"
      @close="resetUploadEvidenceForm"
    >
      <el-form :model="uploadEvidenceForm" label-width="80px">
        <el-form-item label="文件">
          <el-upload
            ref="uploadEvidenceRef"
            :auto-upload="false"
            :on-change="handleEvidenceFileChange"
            :on-remove="handleEvidenceFileRemove"
            :file-list="evidenceFileList"
            drag
            multiple
            :accept="acceptedFileTypes"
          >
            <el-icon class="el-icon--upload"><UploadFilled /></el-icon>
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
          <el-select v-model="uploadEvidenceForm.category" placeholder="请选择分类">
            <el-option v-for="cat in evidenceCategories" :key="cat" :label="cat" :value="cat" />
          </el-select>
        </el-form-item>
        <el-form-item label="标签">
          <el-input
            v-model="uploadEvidenceForm.tags"
            placeholder="多个标签用逗号分隔"
          />
        </el-form-item>
        <el-form-item label="描述">
          <el-input
            v-model="uploadEvidenceForm.description"
            type="textarea"
            :rows="3"
            placeholder="请输入证据描述"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showUploadEvidenceDialog = false">取消</el-button>
        <el-button type="primary" @click="handleUploadEvidence" :loading="uploadingEvidence">
          {{ uploadingEvidence ? `上传中 ${uploadEvidenceProgress}%` : '确定上传' }}
        </el-button>
      </template>
    </el-dialog>

    <!-- Preview Evidence Dialog -->
    <el-dialog v-model="showPreviewEvidenceDialog" :title="currentPreviewEvidence?.fileName" width="900px">
      <div v-loading="loadingEvidencePreview" class="preview-container">
        <!-- 图片预览 -->
        <div v-if="evidencePreviewType === 'image'" class="image-preview">
          <img :src="evidencePreviewUrl" alt="预览" style="max-width: 100%; height: auto;" />
        </div>
        <!-- 音频预览 -->
        <div v-else-if="evidencePreviewType === 'audio'" class="audio-preview">
          <audio :src="evidencePreviewUrl" controls style="width: 100%;"></audio>
        </div>
        <!-- 视频预览 -->
        <div v-else-if="evidencePreviewType === 'video'" class="video-preview">
          <video :src="evidencePreviewUrl" controls style="max-width: 100%; height: auto;"></video>
        </div>
        <!-- 文本预览 -->
        <pre v-else-if="evidencePreviewType === 'text'" class="preview-content">{{ evidencePreviewContent }}</pre>
        <!-- 不支持预览 -->
        <el-empty v-else description="该文件类型不支持预览，请下载后查看" />
      </div>
      <template #footer>
        <el-button @click="showPreviewEvidenceDialog = false">关闭</el-button>
        <el-button type="primary" @click="handleDownloadEvidence(currentPreviewEvidence)">
          <el-icon><Download /></el-icon>
          下载
        </el-button>
      </template>
    </el-dialog>

    <!-- Smart Document Generator Dialog -->
    <SmartDocumentGenerator
      v-model="showDocumentGeneratorDialog"
      :case-id="caseId"
      :case-info="caseData"
      :parties="parties"
      @success="handleDocumentGenerateSuccess"
    />

    <!-- Upload Document Dialog -->
    <el-dialog v-model="showUploadDocumentDialog" title="上传文书" width="600px">
      <el-form :model="uploadDocumentForm" :rules="uploadDocumentRules" ref="uploadDocumentFormRef" label-width="100px">
        <el-form-item label="文书类型" prop="documentType">
          <el-select v-model="uploadDocumentForm.documentType" placeholder="请选择文书类型" style="width: 100%">
            <el-option label="起诉状" value="起诉状" />
            <el-option label="答辩状" value="答辩状" />
            <el-option label="上诉状" value="上诉状" />
            <el-option label="申请书" value="申请书" />
            <el-option label="判决书" value="判决书" />
            <el-option label="裁定书" value="裁定书" />
            <el-option label="调解书" value="调解书" />
            <el-option label="通知书" value="通知书" />
            <el-option label="其他" value="其他" />
          </el-select>
        </el-form-item>
        <el-form-item label="文书文件" prop="file">
          <el-upload
            ref="uploadDocumentRef"
            :auto-upload="false"
            :limit="1"
            :on-change="handleDocumentFileChange"
            :on-remove="handleDocumentFileRemove"
            accept=".pdf,.doc,.docx"
          >
            <el-button type="primary">选择文件</el-button>
            <template #tip>
              <div class="el-upload__tip">支持 PDF、Word 格式，文件大小不超过 50MB</div>
            </template>
          </el-upload>
        </el-form-item>
        <el-form-item label="备注">
          <el-input v-model="uploadDocumentForm.description" type="textarea" :rows="3" placeholder="可选" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showUploadDocumentDialog = false">取消</el-button>
        <el-button type="primary" @click="handleUploadDocument" :loading="uploadingDocument">上传</el-button>
      </template>
    </el-dialog>

    <!-- Preview Document Dialog -->
    <el-dialog v-model="showPreviewDialog" :title="currentPreviewDocument?.fileName" width="900px">
      <div v-loading="loadingPreview" class="preview-container">
        <pre v-if="previewContent" class="preview-content">{{ previewContent }}</pre>
        <el-empty v-else description="暂无预览内容" />
      </div>
      <template #footer>
        <el-button @click="showPreviewDialog = false">关闭</el-button>
        <el-button type="primary" @click="handleDownloadDocument(currentPreviewDocument)">
          <el-icon><Download /></el-icon>
          下载
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage, ElMessageBox, type FormInstance, type FormRules } from 'element-plus'
import { Edit, Plus, FolderOpened, Download, Upload, UploadFilled, MagicStick } from '@element-plus/icons-vue'
import { caseApi } from '@/api/case'
import { processNodeApi } from '@/api/processNode'
import { processTemplateApi } from '@/api/processTemplate'
import { evidenceApi } from '@/api/evidence'
import { documentApi } from '@/api/document'
import { costApi } from '@/api/cost'
import { partyApi } from '@/api/party'
import { useCaseStore } from '@/stores/case'
import PageHeader from '@/components/common/PageHeader.vue'
import PartyManagement from '@/components/case/PartyManagement.vue'
import DocumentManagement from '@/components/document/DocumentManagementSimple.vue'
import SmartDocumentGenerator from '@/components/document/SmartDocumentGenerator.vue'

const route = useRoute()
const router = useRouter()
const caseStore = useCaseStore()

// State
const loading = ref(false)
const caseId = Number(route.params.id)
const caseData = reactive<any>({})
const processNodes = ref<any[]>([])
const evidenceList = ref<any[]>([])
const selectedEvidenceList = ref<any[]>([])
const parties = ref<any[]>([])

// Upload evidence state
const showUploadEvidenceDialog = ref(false)
const uploadingEvidence = ref(false)
const uploadEvidenceProgress = ref(0)
const uploadEvidenceRef = ref()
const evidenceFileList = ref<any[]>([])
const uploadEvidenceForm = ref({
  category: '',
  tags: '',
  description: ''
})

const evidenceCategories = [
  '书证',
  '物证',
  '视听资料',
  '电子数据',
  '证人证言',
  '当事人陈述',
  '鉴定意见',
  '勘验笔录',
  '其他'
]

const acceptedFileTypes = '.pdf,.jpg,.jpeg,.png,.gif,.mp3,.wav,.mp4,.avi,.mov,.doc,.docx'

// Preview evidence state
const showPreviewEvidenceDialog = ref(false)
const loadingEvidencePreview = ref(false)
const currentPreviewEvidence = ref<any>(null)
const evidencePreviewType = ref('')
const evidencePreviewUrl = ref('')
const evidencePreviewContent = ref('')

const documentList = ref<any[]>([])
const costRecords = ref<any[]>([])

// Document generator state
const showDocumentGeneratorDialog = ref(false)

// Upload document state
const showUploadDocumentDialog = ref(false)
const uploadingDocument = ref(false)
const uploadDocumentFormRef = ref<FormInstance>()
const uploadDocumentRef = ref()
const uploadDocumentForm = reactive({
  documentType: '',
  file: null as File | null,
  description: ''
})

const uploadDocumentRules: FormRules = {
  documentType: [{ required: true, message: '请选择文书类型', trigger: 'change' }],
  file: [{ required: true, message: '请选择文件', trigger: 'change' }]
}

// Preview document state
const showPreviewDialog = ref(false)
const loadingPreview = ref(false)
const currentPreviewDocument = ref<any>(null)
const previewContent = ref('')

// Process template state
const showTemplateDialog = ref(false)
const showAddNodeDialog = ref(false)
const processTemplates = ref<any[]>([])
const templateNodes = ref<any[]>([])
const applyingTemplate = ref(false)
const savingNode = ref(false)
const editingNode = ref<any>(null)
const nodeFormRef = ref<FormInstance>()

const templateForm = reactive({
  templateId: null as number | null
})

const nodeForm = reactive({
  nodeName: '',
  nodeType: '',
  handler: '',
  startTime: '',
  deadline: '',
  status: '待处理',
  progress: 0
})

const nodeRules: FormRules = {
  nodeName: [{ required: true, message: '请输入节点名称', trigger: 'blur' }],
  nodeType: [{ required: true, message: '请选择节点类型', trigger: 'change' }]
}

const selectedTemplate = computed(() => {
  if (!templateForm.templateId) return null
  return processTemplates.value.find(t => t.id === templateForm.templateId)
})

// Fetch case data
const fetchCaseData = async () => {
  loading.value = true
  try {
    const response = await caseApi.getCaseById(caseId)
    if (response && response.data) {
      // 后端返回 { data: { case: {...} } }
      const data = response.data.case
      
      if (!data || !data.id) {
        console.error('案件数据格式错误:', response)
        ElMessage.error('案件数据格式错误')
        return
      }
      
      // 后端已返回驼峰命名，直接使用
      Object.assign(caseData, data)
      caseStore.setCurrentCase(data)
      
      // 加载诉讼主体数据（用于文书生成）
      try {
        const partiesResponse = await partyApi.getPartiesByCaseId(caseId)
        if (partiesResponse && partiesResponse.data) {
          parties.value = partiesResponse.data.parties || []
        }
      } catch (error: any) {
        console.error('获取诉讼主体失败:', error)
        // 不影响主流程，只记录错误
      }
    }
  } catch (error: any) {
    console.error('获取案件信息失败:', error)
    ElMessage.error(error.message || '获取案件信息失败')
  } finally {
    loading.value = false
  }
}

// Fetch process nodes
const fetchProcessNodes = async () => {
  try {
    const response = await processNodeApi.getNodesByCaseId(caseId)
    if (response && response.data) {
      const data = response.data.nodes || []
      // 转换字段名从下划线到驼峰
      const nodes = Array.isArray(data) ? data.map((node: any) => ({
        id: node.id,
        caseId: node.case_id,
        nodeType: node.node_type,
        nodeName: node.node_name,
        handler: node.handler,
        startTime: node.start_time,
        deadline: node.deadline,
        completionTime: node.completion_time,
        status: node.status,
        progress: node.progress,
        nodeOrder: node.node_order,
        createdAt: node.created_at,
        updatedAt: node.updated_at
      })) : []
      processNodes.value = nodes
    }
  } catch (error: any) {
    console.error('获取流程节点失败:', error)
  }
}

// Fetch process templates
const fetchProcessTemplates = async () => {
  try {
    const response = await processTemplateApi.getTemplates()
    if (response && response.data) {
      // 后端返回 { data: { templates: [...] } }
      processTemplates.value = response.data.templates || []
      console.log('获取到的流程模板:', processTemplates.value)
    }
  } catch (error: any) {
    console.error('获取流程模板失败:', error)
    ElMessage.error('获取流程模板失败')
  }
}

// Handle template change
const handleTemplateChange = async (templateId: number) => {
  try {
    const response = await processTemplateApi.getTemplateNodes(templateId)
    if (response && response.data) {
      templateNodes.value = response.data.nodes || []
    }
  } catch (error: any) {
    console.error('获取模板节点失败:', error)
    ElMessage.error('获取模板节点失败')
  }
}

// Apply template
const handleApplyTemplate = async () => {
  if (!templateForm.templateId) {
    ElMessage.warning('请选择流程模板')
    return
  }

  applyingTemplate.value = true
  try {
    await processTemplateApi.applyTemplate(caseId, templateForm.templateId)
    ElMessage.success('流程模板应用成功')
    showTemplateDialog.value = false
    templateForm.templateId = null
    templateNodes.value = []
    await fetchProcessNodes()
  } catch (error: any) {
    console.error('应用流程模板失败:', error)
    ElMessage.error(error.message || '应用流程模板失败')
  } finally {
    applyingTemplate.value = false
  }
}

// Handle edit node
const handleEditNode = (node: any) => {
  editingNode.value = node
  nodeForm.nodeName = node.nodeName
  nodeForm.nodeType = node.nodeType
  nodeForm.handler = node.handler || ''
  nodeForm.startTime = node.startTime || ''
  nodeForm.deadline = node.deadline || ''
  nodeForm.status = node.status
  nodeForm.progress = node.progress || 0
  showAddNodeDialog.value = true
}

// Handle save node
const handleSaveNode = async () => {
  if (!nodeFormRef.value) return

  await nodeFormRef.value.validate(async (valid) => {
    if (!valid) return

    savingNode.value = true
    try {
      const nodeData = {
        caseId: caseId,
        nodeType: nodeForm.nodeType,
        nodeName: nodeForm.nodeName,
        handler: nodeForm.handler || undefined,
        startTime: nodeForm.startTime || undefined,
        deadline: nodeForm.deadline || undefined,
        status: nodeForm.status,
        progress: nodeForm.progress
      }

      if (editingNode.value) {
        await processNodeApi.updateNode(editingNode.value.id, nodeData)
        ElMessage.success('节点更新成功')
      } else {
        await processNodeApi.createNode(nodeData)
        ElMessage.success('节点添加成功')
      }

      showAddNodeDialog.value = false
      resetNodeForm()
      await fetchProcessNodes()
    } catch (error: any) {
      console.error('保存节点失败:', error)
      ElMessage.error(error.message || '保存节点失败')
    } finally {
      savingNode.value = false
    }
  })
}

// Reset node form
const resetNodeForm = () => {
  editingNode.value = null
  nodeForm.nodeName = ''
  nodeForm.nodeType = ''
  nodeForm.handler = ''
  nodeForm.startTime = ''
  nodeForm.deadline = ''
  nodeForm.status = '待处理'
  nodeForm.progress = 0
  nodeFormRef.value?.resetFields()
}

// Fetch evidence
const fetchEvidence = async () => {
  try {
    const response = await evidenceApi.getEvidenceByCaseId(caseId)
    if (response) {
      // 后端返回 { count: ..., evidence: [...] }
      const data = response.evidence || []
      // 转换字段名从下划线到驼峰
      const evidence = Array.isArray(data) ? data.map((item: any) => ({
        id: item.id,
        caseId: item.case_id,
        fileName: item.file_name,
        fileType: item.file_type,
        filePath: item.storage_path,
        fileSize: item.file_size,
        category: item.category,
        tags: item.tags,
        uploadedBy: item.uploaded_by,
        uploadedAt: item.uploaded_at
      })) : []
      evidenceList.value = evidence.slice(0, 5)
    }
  } catch (error: any) {
    console.error('获取证据材料失败:', error)
  }
}

// Fetch documents
const fetchDocuments = async () => {
  try {
    const response = await documentApi.getDocumentsByCaseId(caseId)
    if (response && response.data) {
      // 响应拦截器已经返回了 response.data，所以这里直接是 { data: { documents: [...] } }
      const data = response.data.documents || []
      // 转换字段名从下划线到驼峰
      const documents = Array.isArray(data) ? data.map((item: any) => ({
        id: item.id,
        caseId: item.case_id,
        documentType: item.document_type,
        fileName: item.document_name,
        filePath: item.file_path || item.storage_path,
        extractedContent: item.extracted_content,
        uploadedAt: item.created_at
      })) : []
      documentList.value = documents.slice(0, 5)
    }
  } catch (error: any) {
    console.error('获取文书材料失败:', error)
  }
}

// Fetch costs
const fetchCosts = async () => {
  try {
    const response = await costApi.getCostsByCaseId(caseId)
    if (response && response.data) {
      const data = response.data.costs || []
      // 转换字段名从下划线到驼峰
      const costs = Array.isArray(data) ? data.map((item: any) => ({
        id: item.id,
        caseId: item.case_id,
        costType: item.cost_type,
        amount: item.amount,
        paymentDate: item.payment_date,
        status: item.status,
        payer: item.payer,
        description: item.description,
        createdAt: item.created_at
      })) : []
      costRecords.value = costs.slice(0, 5)
    }
  } catch (error: any) {
    console.error('获取成本记录失败:', error)
  }
}

// Action handlers
const handleEdit = () => {
  router.push(`/cases/${caseId}/edit`)
}

const goToProcess = () => {
  router.push(`/cases/${caseId}/process`)
}

const goToEvidence = () => {
  router.push(`/cases/${caseId}/evidence`)
}

// Handle evidence selection change
const handleEvidenceSelectionChange = (selection: any[]) => {
  selectedEvidenceList.value = selection
}

// Handle batch download evidence
const handleBatchDownloadEvidence = async () => {
  if (selectedEvidenceList.value.length === 0) {
    ElMessage.warning('请选择要下载的证据')
    return
  }

  try {
    for (const evidence of selectedEvidenceList.value) {
      await handleDownloadEvidence(evidence)
    }
    ElMessage.success('批量下载完成')
  } catch (error: any) {
    console.error('批量下载失败:', error)
    ElMessage.error(error.message || '批量下载失败')
  }
}

// Handle evidence file change
const handleEvidenceFileChange = (file: any, files: any[]) => {
  evidenceFileList.value = files
}

// Handle evidence file remove
const handleEvidenceFileRemove = (file: any, files: any[]) => {
  evidenceFileList.value = files
}

// Handle upload evidence
const handleUploadEvidence = async () => {
  if (evidenceFileList.value.length === 0) {
    ElMessage.warning('请选择要上传的文件')
    return
  }

  uploadingEvidence.value = true
  uploadEvidenceProgress.value = 0

  try {
    for (let i = 0; i < evidenceFileList.value.length; i++) {
      const file = evidenceFileList.value[i]
      const formData = new FormData()
      formData.append('file', file.raw)
      formData.append('case_id', caseId.toString())
      formData.append('category', uploadEvidenceForm.value.category)
      formData.append('tags', uploadEvidenceForm.value.tags)
      formData.append('description', uploadEvidenceForm.value.description)

      await evidenceApi.uploadEvidence(formData)
      uploadEvidenceProgress.value = Math.round(((i + 1) / evidenceFileList.value.length) * 100)
    }

    ElMessage.success('上传成功')
    showUploadEvidenceDialog.value = false
    resetUploadEvidenceForm()
    await fetchEvidence()
  } catch (error: any) {
    console.error('上传失败:', error)
    ElMessage.error(error.message || '上传失败')
  } finally {
    uploadingEvidence.value = false
    uploadEvidenceProgress.value = 0
  }
}

// Reset upload evidence form
const resetUploadEvidenceForm = () => {
  evidenceFileList.value = []
  uploadEvidenceForm.value = {
    category: '',
    tags: '',
    description: ''
  }
  uploadEvidenceRef.value?.clearFiles()
}

// Preview and download evidence handlers
const handlePreviewEvidence = async (evidence: any) => {
  currentPreviewEvidence.value = evidence
  showPreviewEvidenceDialog.value = true
  loadingEvidencePreview.value = true
  evidencePreviewType.value = ''
  evidencePreviewUrl.value = ''
  evidencePreviewContent.value = ''

  try {
    const fileType = evidence.fileType || ''
    
    // 判断文件类型
    if (fileType.startsWith('image/')) {
      // 图片预览
      evidencePreviewType.value = 'image'
      const token = localStorage.getItem('token')
      evidencePreviewUrl.value = `${import.meta.env.VITE_API_BASE_URL || '/api'}/evidence/${evidence.id}/download?token=${token}`
    } else if (fileType.startsWith('audio/')) {
      // 音频预览
      evidencePreviewType.value = 'audio'
      const token = localStorage.getItem('token')
      evidencePreviewUrl.value = `${import.meta.env.VITE_API_BASE_URL || '/api'}/evidence/${evidence.id}/download?token=${token}`
    } else if (fileType.startsWith('video/')) {
      // 视频预览
      evidencePreviewType.value = 'video'
      const token = localStorage.getItem('token')
      evidencePreviewUrl.value = `${import.meta.env.VITE_API_BASE_URL || '/api'}/evidence/${evidence.id}/download?token=${token}`
    } else if (fileType === 'text/plain') {
      // 文本预览
      evidencePreviewType.value = 'text'
      const response = await evidenceApi.downloadEvidence(evidence.id)
      evidencePreviewContent.value = await response.text()
    } else {
      // 不支持预览
      evidencePreviewType.value = 'unsupported'
      ElMessage.info('该文件类型不支持预览，请下载后查看')
    }
  } catch (error: any) {
    console.error('预览证据失败:', error)
    ElMessage.error('预览证据失败')
    showPreviewEvidenceDialog.value = false
  } finally {
    loadingEvidencePreview.value = false
  }
}

const handleDownloadEvidence = async (evidence: any) => {
  try {
    const response = await evidenceApi.downloadEvidence(evidence.id)
    const blob = await response.blob()
    const url = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = evidence.fileName
    link.click()
    window.URL.revokeObjectURL(url)
    ElMessage.success('下载成功')
  } catch (error: any) {
    console.error('下载证据失败:', error)
    ElMessage.error('下载证据失败')
  }
}

const goToDocuments = () => {
  router.push(`/cases/${caseId}/documents`)
}

const goToLogs = () => {
  router.push(`/cases/${caseId}/logs`)
}

const goToCosts = () => {
  router.push(`/cases/${caseId}/costs`)
}

// Utility functions
const getCaseTypeTag = (type: string) => {
  const tagMap: Record<string, string> = {
    '民事': '',
    '刑事': 'danger',
    '行政': 'warning',
    '劳动仲裁': 'success'
  }
  return tagMap[type] || ''
}

const getStatusTag = (status: string) => {
  const tagMap: Record<string, string> = {
    '立案': 'info',
    '审理中': '',
    '已结案': 'success',
    '已归档': 'info'
  }
  return tagMap[status] || ''
}

const getNodeStatusTag = (status: string) => {
  const tagMap: Record<string, string> = {
    '待处理': 'info',
    '进行中': '',
    '已完成': 'success',
    '超期': 'danger'
  }
  return tagMap[status] || ''
}

const getNodeColor = (status: string) => {
  const colorMap: Record<string, string> = {
    '待处理': '#909399',
    '进行中': '#409EFF',
    '已完成': '#67C23A',
    '超期': '#F56C6C'
  }
  return colorMap[status] || '#409EFF'
}

const formatAmount = (amount: number) => {
  if (!amount) return '-'
  return amount.toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

const formatDate = (date: string) => {
  if (!date) return '-'
  return date.split('T')[0]
}

const formatDateTime = (datetime: string) => {
  if (!datetime) return '-'
  return datetime.replace('T', ' ').split('.')[0]
}

const getFileTypeLabel = (mimeType: string) => {
  if (!mimeType) return '未知'
  
  const typeMap: Record<string, string> = {
    // PDF
    'application/pdf': 'PDF文档',
    // Word
    'application/msword': 'Word文档',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'Word文档',
    // Excel
    'application/vnd.ms-excel': 'Excel表格',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': 'Excel表格',
    // 文本
    'text/plain': '文本文件',
    // 图片
    'image/jpeg': 'JPEG图片',
    'image/jpg': 'JPG图片',
    'image/png': 'PNG图片',
    'image/gif': 'GIF图片',
    'image/bmp': 'BMP图片',
    'image/webp': 'WebP图片',
    // 音频
    'audio/mpeg': 'MP3音频',
    'audio/mp3': 'MP3音频',
    'audio/wav': 'WAV音频',
    'audio/ogg': 'OGG音频',
    'audio/aac': 'AAC音频',
    'audio/m4a': 'M4A音频',
    // 视频
    'video/mp4': 'MP4视频',
    'video/mpeg': 'MPEG视频',
    'video/quicktime': 'MOV视频',
    'video/x-msvideo': 'AVI视频',
    'video/x-ms-wmv': 'WMV视频',
    'video/webm': 'WebM视频'
  }
  
  return typeMap[mimeType] || mimeType.split('/')[1]?.toUpperCase() || '其他'
}

const getCostSummary = (param: any) => {
  const { columns, data } = param
  const sums: string[] = []
  columns.forEach((column: any, index: number) => {
    if (index === 0) {
      sums[index] = '合计'
      return
    }
    if (column.property === 'amount') {
      const values = data.map((item: any) => Number(item.amount))
      const total = values.reduce((prev: number, curr: number) => prev + curr, 0)
      sums[index] = formatAmount(total)
    } else {
      sums[index] = ''
    }
  })
  return sums
}

// Document generator handlers
const handleDocumentGenerateSuccess = () => {
  ElMessage.success('文书生成并保存成功')
  showDocumentGeneratorDialog.value = false
  fetchDocuments() // 刷新文书列表
}

// Upload document handlers
const handleDocumentFileChange = (file: any) => {
  uploadDocumentForm.file = file.raw
}

const handleDocumentFileRemove = () => {
  uploadDocumentForm.file = null
}

const handleUploadDocument = async () => {
  if (!uploadDocumentFormRef.value) return
  
  await uploadDocumentFormRef.value.validate(async (valid) => {
    if (!valid) return

    uploadingDocument.value = true
    try {
      const formData = new FormData()
      formData.append('file', uploadDocumentForm.file!)
      formData.append('case_id', String(caseId))
      formData.append('document_type', uploadDocumentForm.documentType)
      if (uploadDocumentForm.description) {
        formData.append('description', uploadDocumentForm.description)
      }

      await documentApi.uploadDocument(formData)
      ElMessage.success('上传成功')
      showUploadDocumentDialog.value = false
      resetUploadDocumentForm()
      await fetchDocuments() // 刷新文书列表
    } catch (error: any) {
      console.error('上传文书失败:', error)
      ElMessage.error(error.response?.data?.message || '上传文书失败')
    } finally {
      uploadingDocument.value = false
    }
  })
}

const resetUploadDocumentForm = () => {
  uploadDocumentForm.documentType = ''
  uploadDocumentForm.file = null
  uploadDocumentForm.description = ''
  if (uploadDocumentRef.value) {
    uploadDocumentRef.value.clearFiles()
  }
  uploadDocumentFormRef.value?.resetFields()
}

// Preview, download and delete document handlers
const handlePreviewDocument = async (doc: any) => {
  // 先检查文件类型
  const fileName = doc.fileName || ''
  const ext = fileName.substring(fileName.lastIndexOf('.')).toLowerCase()
  
  // 只有文本文件和智能生成的文书支持预览
  if (ext && ext !== '.txt' && doc.filePath) {
    ElMessage.info('该文件类型不支持在线预览，请下载后查看')
    return
  }

  currentPreviewDocument.value = doc
  showPreviewDialog.value = true
  loadingPreview.value = true
  previewContent.value = ''

  try {
    const response = await documentApi.previewDocument(doc.id)
    
    // 判断响应类型
    if (response.data && response.data.content) {
      // 文本文件或智能生成的文书
      previewContent.value = response.data.content
    } else {
      // 其他情况
      ElMessage.info('无法预览该文书')
      showPreviewDialog.value = false
    }
  } catch (error: any) {
    console.error('预览文书失败:', error)
    const errorMsg = error.response?.data?.error?.message || '预览文书失败'
    ElMessage.warning(errorMsg)
    showPreviewDialog.value = false
  } finally {
    loadingPreview.value = false
  }
}

const handleDownloadDocument = async (doc: any) => {
  try {
    const response = await documentApi.downloadDocument(doc.id)
    // 创建下载链接
    const blob = new Blob([response], { type: 'application/octet-stream' })
    const url = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = doc.fileName
    link.click()
    window.URL.revokeObjectURL(url)
    ElMessage.success('下载成功')
  } catch (error: any) {
    console.error('下载文书失败:', error)
    ElMessage.error('下载文书失败')
  }
}

const handleDeleteDocument = async (doc: any) => {
  try {
    await ElMessageBox.confirm(
      `确定要删除文书"${doc.fileName}"吗？`,
      '确认删除',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )

    await documentApi.deleteDocument(doc.id)
    ElMessage.success('删除成功')
    await fetchDocuments() // 刷新列表
  } catch (error: any) {
    if (error !== 'cancel') {
      console.error('删除文书失败:', error)
      ElMessage.error('删除文书失败')
    }
  }
}

// Lifecycle
onMounted(async () => {
  await fetchCaseData()
  await Promise.all([
    fetchProcessNodes(),
    fetchProcessTemplates(),
    fetchEvidence(),
    fetchDocuments(),
    fetchCosts()
  ])
})
</script>

<style scoped>
.case-detail-container {
  padding: 20px;
}

.info-card {
  margin-bottom: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.card-title {
  font-size: 16px;
  font-weight: 600;
}

.timeline-content {
  padding-left: 10px;
}

.node-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.node-name {
  font-weight: 600;
  font-size: 14px;
}

.node-info {
  display: flex;
  gap: 20px;
  font-size: 13px;
  color: #606266;
}

.header-actions {
  display: flex;
  gap: 8px;
}

.node-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

.template-description {
  padding: 12px;
  background: #f5f7fa;
  border-radius: 4px;
  color: #606266;
  font-size: 14px;
  line-height: 1.6;
}

.template-nodes-preview {
  padding: 12px;
  background: #f5f7fa;
  border-radius: 4px;
  max-height: 200px;
  overflow-y: auto;
}

/* 修复滑块右侧标记文字紧贴边框的问题 */
:deep(.el-slider) {
  padding-right: 20px;
}

.preview-container {
  max-height: 600px;
  overflow-y: auto;
}

.preview-content {
  margin: 0;
  padding: 20px;
  background: #f5f7fa;
  border-radius: 4px;
  font-family: 'Courier New', monospace;
  font-size: 14px;
  line-height: 1.8;
  white-space: pre-wrap;
  word-wrap: break-word;
  color: #303133;
}

.image-preview,
.audio-preview,
.video-preview {
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 20px;
  background: #f5f7fa;
  border-radius: 4px;
}

.image-preview img {
  max-width: 100%;
  height: auto;
  border-radius: 4px;
}
</style>
