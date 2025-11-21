<template>
  <div class="document-ocr-container">
    <PageHeader title="文书识别" subtitle="上传文书文件，自动识别并提取关键信息" />

    <!-- Upload Section -->
    <el-card class="upload-card">
      <h3>上传文书</h3>
      <el-upload
        ref="uploadRef"
        class="upload-area"
        drag
        :auto-upload="false"
        :limit="1"
        :on-change="handleFileChange"
        :on-remove="handleFileRemove"
        accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
      >
        <el-icon class="el-icon--upload"><UploadFilled /></el-icon>
        <div class="el-upload__text">
          将文件拖到此处，或<em>点击上传</em>
        </div>
        <template #tip>
          <div class="el-upload__tip">
            支持 PDF、图片、Word 格式，文件大小不超过 50MB
          </div>
        </template>
      </el-upload>
      <div class="upload-actions" v-if="uploadedFile">
        <el-button type="primary" @click="handleRecognize" :loading="recognizing">
          <el-icon><View /></el-icon>
          开始识别
        </el-button>
        <el-button @click="handleClear">清除</el-button>
      </div>
    </el-card>

    <!-- Recognition Result -->
    <el-card v-if="recognitionResult" class="result-card" v-loading="recognizing">
      <div class="result-header">
        <h3>识别结果</h3>
        <el-tag :type="recognitionResult.confidence > 0.8 ? 'success' : 'warning'">
          置信度: {{ (recognitionResult.confidence * 100).toFixed(1) }}%
        </el-tag>
      </div>

      <el-tabs v-model="activeTab">
        <!-- Extracted Fields -->
        <el-tab-pane label="提取字段" name="fields">
          <el-form :model="extractedData" label-width="120px" class="extracted-form">
            <el-row :gutter="20">
              <el-col :span="12">
                <el-form-item label="文书类型">
                  <el-input v-model="extractedData.documentType" />
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item label="案号">
                  <el-input v-model="extractedData.caseNumber" />
                </el-form-item>
              </el-col>
            </el-row>

            <el-row :gutter="20">
              <el-col :span="12">
                <el-form-item label="案由">
                  <el-input v-model="extractedData.caseCause" />
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item label="法院">
                  <el-input v-model="extractedData.court" />
                </el-form-item>
              </el-col>
            </el-row>

            <el-row :gutter="20">
              <el-col :span="12">
                <el-form-item label="原告">
                  <el-input v-model="extractedData.plaintiff" />
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item label="被告">
                  <el-input v-model="extractedData.defendant" />
                </el-form-item>
              </el-col>
            </el-row>

            <el-row :gutter="20">
              <el-col :span="12">
                <el-form-item label="标的额">
                  <el-input v-model="extractedData.targetAmount" />
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item label="立案日期">
                  <el-input v-model="extractedData.filingDate" />
                </el-form-item>
              </el-col>
            </el-row>

            <el-form-item label="案情摘要">
              <el-input v-model="extractedData.summary" type="textarea" :rows="4" />
            </el-form-item>

            <el-form-item label="诉讼请求">
              <el-input v-model="extractedData.claims" type="textarea" :rows="3" />
            </el-form-item>
          </el-form>

          <el-alert
            title="提示"
            type="info"
            :closable="false"
            style="margin-top: 20px"
          >
            识别结果可能存在误差，请仔细核对并手动修正
          </el-alert>
        </el-tab-pane>

        <!-- Full Text -->
        <el-tab-pane label="全文内容" name="fulltext">
          <el-input
            v-model="recognitionResult.fullText"
            type="textarea"
            :rows="20"
            placeholder="识别的完整文本内容"
          />
        </el-tab-pane>
      </el-tabs>

      <!-- Actions -->
      <div class="result-actions">
        <el-button type="primary" @click="handleFillToCase">
          <el-icon><DocumentAdd /></el-icon>
          一键填充到案件表单
        </el-button>
        <el-button @click="handleSaveAsDocument">
          <el-icon><Document /></el-icon>
          保存为文书
        </el-button>
        <el-button @click="handleExportText">
          <el-icon><Download /></el-icon>
          导出文本
        </el-button>
      </div>
    </el-card>

    <!-- Fill to Case Dialog -->
    <el-dialog v-model="showFillDialog" title="填充到案件" width="600px">
      <el-form label-width="100px">
        <el-form-item label="选择操作">
          <el-radio-group v-model="fillAction">
            <el-radio value="new">创建新案件</el-radio>
            <el-radio value="existing">填充到现有案件</el-radio>
          </el-radio-group>
        </el-form-item>

        <el-form-item v-if="fillAction === 'existing'" label="选择案件">
          <el-select v-model="selectedCaseId" placeholder="请选择案件" style="width: 100%" filterable>
            <el-option 
              v-for="caseItem in cases" 
              :key="caseItem.id" 
              :label="`${caseItem.caseNumber} - ${caseItem.caseCause}`" 
              :value="caseItem.id" 
            />
          </el-select>
        </el-form-item>
      </el-form>

      <template #footer>
        <el-button @click="showFillDialog = false">取消</el-button>
        <el-button type="primary" @click="handleConfirmFill">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { UploadFilled, View, DocumentAdd, Document, Download } from '@element-plus/icons-vue'
import { documentApi } from '@/api/document'
import { caseApi } from '@/api/case'
import PageHeader from '@/components/common/PageHeader.vue'

const router = useRouter()

// State
const recognizing = ref(false)
const uploadedFile = ref<File | null>(null)
const recognitionResult = ref<any>(null)
const activeTab = ref('fields')
const showFillDialog = ref(false)
const fillAction = ref('new')
const selectedCaseId = ref<number | null>(null)
const cases = ref<any[]>([])

// Extracted data
const extractedData = reactive({
  documentType: '',
  caseNumber: '',
  caseCause: '',
  court: '',
  plaintiff: '',
  defendant: '',
  targetAmount: '',
  filingDate: '',
  summary: '',
  claims: ''
})

// Methods
const handleFileChange = (file: any) => {
  uploadedFile.value = file.raw
}

const handleFileRemove = () => {
  uploadedFile.value = null
  recognitionResult.value = null
}

const handleClear = () => {
  uploadedFile.value = null
  recognitionResult.value = null
}

const handleRecognize = async () => {
  if (!uploadedFile.value) {
    ElMessage.warning('请先上传文件')
    return
  }

  recognizing.value = true
  
  // Simulate OCR recognition with delay
  setTimeout(() => {
    // Mock OCR result
    const mockResult = {
      confidence: 0.85 + Math.random() * 0.15,
      fullText: `民事起诉状

原告：张三，男，1980年5月10日出生，汉族，住址：北京市朝阳区XX街道XX号。

被告：李四，男，1975年3月15日出生，汉族，住址：北京市海淀区XX路XX号。

案由：合同纠纷

诉讼请求：
1. 请求判令被告支付货款人民币50000元；
2. 请求判令被告支付违约金人民币5000元；
3. 本案诉讼费用由被告承担。

事实与理由：
原告与被告于2023年1月10日签订《货物买卖合同》，约定原告向被告供应货物，总价款为人民币50000元。合同签订后，原告按约定交付了全部货物，但被告至今未支付货款。根据合同约定，被告逾期付款应支付违约金。

综上所述，为维护原告的合法权益，特向贵院提起诉讼，请求依法判决。

此致
北京市朝阳区人民法院

起诉人：张三
2024年1月15日`,
      extractedFields: {
        documentType: '起诉状',
        caseNumber: '',
        caseCause: '合同纠纷',
        court: '北京市朝阳区人民法院',
        plaintiff: '张三',
        defendant: '李四',
        targetAmount: '50000',
        filingDate: '2024-01-15',
        summary: '原告与被告于2023年1月10日签订《货物买卖合同》，原告按约定交付了全部货物，但被告至今未支付货款50000元。',
        claims: '1. 请求判令被告支付货款人民币50000元；2. 请求判令被告支付违约金人民币5000元；3. 本案诉讼费用由被告承担。'
      }
    }

    recognitionResult.value = mockResult
    
    // Fill extracted data
    Object.assign(extractedData, mockResult.extractedFields)
    
    recognizing.value = false
    ElMessage.success('识别完成')
  }, 2000)
}

const handleFillToCase = async () => {
  // Load cases for selection
  try {
    const response = await caseApi.getCases({ page: 1, pageSize: 100 })
    cases.value = response.data?.list || []
    showFillDialog.value = true
  } catch (error) {
    ElMessage.error('加载案件列表失败')
    console.error(error)
  }
}

const handleConfirmFill = () => {
  if (fillAction.value === 'new') {
    // Navigate to case creation form with pre-filled data
    router.push({
      path: '/cases/create',
      query: {
        caseNumber: extractedData.caseNumber,
        caseCause: extractedData.caseCause,
        court: extractedData.court,
        targetAmount: extractedData.targetAmount,
        filingDate: extractedData.filingDate,
        plaintiff: extractedData.plaintiff,
        defendant: extractedData.defendant
      }
    })
    ElMessage.success('已跳转到案件创建页面')
  } else if (fillAction.value === 'existing' && selectedCaseId.value) {
    // In a real implementation, this would update the existing case
    ElMessage.success('已填充到现有案件')
    showFillDialog.value = false
  } else {
    ElMessage.warning('请选择案件')
  }
}

const handleSaveAsDocument = () => {
  ElMessage.info('保存为文书功能（需要先选择案件）')
}

const handleExportText = () => {
  if (!recognitionResult.value) return
  
  const blob = new Blob([recognitionResult.value.fullText], { type: 'text/plain;charset=utf-8' })
  const url = window.URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.setAttribute('download', `识别结果_${Date.now()}.txt`)
  document.body.appendChild(link)
  link.click()
  link.remove()
  window.URL.revokeObjectURL(url)
  
  ElMessage.success('导出成功')
}
</script>

<style scoped>
.document-ocr-container {
  padding: 20px;
}

.upload-card {
  margin-bottom: 20px;
}

.upload-area {
  margin: 20px 0;
}

.upload-actions {
  display: flex;
  justify-content: center;
  gap: 10px;
  margin-top: 20px;
}

.result-card {
  margin-top: 20px;
}

.result-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.extracted-form {
  margin-top: 20px;
}

.result-actions {
  display: flex;
  justify-content: center;
  gap: 10px;
  margin-top: 30px;
  padding-top: 20px;
  border-top: 1px solid #eee;
}
</style>
