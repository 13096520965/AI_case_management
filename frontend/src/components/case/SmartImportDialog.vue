<template>
  <el-dialog
    v-model="visible"
    title="智能导入案件信息"
    width="800px"
    :close-on-click-modal="false"
    @close="handleClose"
  >
    <div class="smart-import-container">
      <!-- 步骤指示器 -->
      <el-steps :active="currentStep" finish-status="success" align-center style="margin-bottom: 30px;">
        <el-step title="上传文件" />
        <el-step title="解析中" />
        <el-step title="确认信息" />
      </el-steps>

      <!-- 步骤1: 上传文件 -->
      <div v-if="currentStep === 0" class="upload-step">
        <el-upload
          ref="uploadRef"
          drag
          :auto-upload="false"
          :on-change="handleFileChange"
          :on-remove="handleFileRemove"
          :file-list="fileList"
          multiple
          accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
        >
          <el-icon class="el-icon--upload"><upload-filled /></el-icon>
          <div class="el-upload__text">
            将文件拖到此处，或<em>点击上传</em>
          </div>
          <template #tip>
            <div class="el-upload__tip">
              支持 PDF、Word、图片格式，可同时上传多个文件
            </div>
          </template>
        </el-upload>

        <div class="file-type-hints">
          <el-tag type="info" style="margin: 5px;">合同</el-tag>
          <el-tag type="info" style="margin: 5px;">判决书</el-tag>
          <el-tag type="info" style="margin: 5px;">立案通知书</el-tag>
          <el-tag type="info" style="margin: 5px;">证据材料</el-tag>
          <el-tag type="info" style="margin: 5px;">诉讼请求</el-tag>
        </div>
      </div>

      <!-- 步骤2: 解析中 -->
      <div v-if="currentStep === 1" class="parsing-step">
        <div class="parsing-animation">
          <el-icon class="rotating" :size="60" color="#409EFF"><Loading /></el-icon>
          <p class="parsing-text">正在解析文件，请稍候...</p>
          <p class="parsing-detail">{{ parsingStatus }}</p>
          <el-progress :percentage="parsingProgress" :stroke-width="8" />
        </div>
      </div>

      <!-- 步骤3: 确认信息 -->
      <div v-if="currentStep === 2" class="confirm-step">
        <el-alert
          title="解析完成"
          type="success"
          :closable="false"
          style="margin-bottom: 20px;"
        >
          系统已自动提取以下信息，请确认或修改后导入
        </el-alert>

        <el-form :model="extractedData" label-width="120px">
          <el-row :gutter="20">
            <el-col :span="12">
              <el-form-item label="案号">
                <el-input v-model="extractedData.caseNumber" />
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="案件类型">
                <el-select v-model="extractedData.caseType" style="width: 100%">
                  <el-option label="民事" value="民事" />
                  <el-option label="刑事" value="刑事" />
                  <el-option label="行政" value="行政" />
                  <el-option label="劳动仲裁" value="劳动仲裁" />
                </el-select>
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
              <el-form-item label="受理法院">
                <el-input v-model="extractedData.court" />
              </el-form-item>
            </el-col>
          </el-row>

          <el-row :gutter="20">
            <el-col :span="12">
              <el-form-item label="标的额（元）">
                <el-input-number 
                  v-model="extractedData.targetAmount" 
                  :min="0" 
                  :precision="2"
                  :controls="false"
                  style="width: 100%"
                />
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="立案日期">
                <el-date-picker
                  v-model="extractedData.filingDate"
                  type="date"
                  style="width: 100%"
                  format="YYYY-MM-DD"
                  value-format="YYYY-MM-DD"
                />
              </el-form-item>
            </el-col>
          </el-row>

          <!-- 当事人信息 -->
          <el-divider content-position="left">当事人信息</el-divider>
          <div v-if="extractedData.parties && extractedData.parties.length > 0">
            <div v-for="(party, index) in extractedData.parties" :key="index" class="party-item">
              <el-tag :type="party.party_type === '原告' ? 'success' : 'warning'" style="margin-right: 10px;">
                {{ party.party_type }}
              </el-tag>
              <span>{{ party.name }}</span>
              <span v-if="party.contact_phone" style="margin-left: 10px; color: #909399;">
                {{ party.contact_phone }}
              </span>
            </div>
          </div>
          <el-empty v-else description="未提取到当事人信息" :image-size="60" />

          <!-- 关键日期 -->
          <el-divider content-position="left">关键日期</el-divider>
          <div v-if="extractedData.keyDates && extractedData.keyDates.length > 0">
            <el-timeline>
              <el-timeline-item 
                v-for="(date, index) in extractedData.keyDates" 
                :key="index"
                :timestamp="date.date"
              >
                {{ date.event }}
              </el-timeline-item>
            </el-timeline>
          </div>
          <el-empty v-else description="未提取到关键日期" :image-size="60" />
        </el-form>
      </div>
    </div>

    <template #footer>
      <div class="dialog-footer">
        <el-button @click="handleClose">取消</el-button>
        <el-button 
          v-if="currentStep === 0" 
          type="primary" 
          @click="startParsing"
          :disabled="fileList.length === 0"
        >
          开始解析
        </el-button>
        <el-button 
          v-if="currentStep === 2" 
          type="primary" 
          @click="confirmImport"
        >
          确认导入
        </el-button>
      </div>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { ElMessage } from 'element-plus'
import { UploadFilled, Loading } from '@element-plus/icons-vue'

interface Props {
  modelValue: boolean
}

interface Emits {
  (e: 'update:modelValue', value: boolean): void
  (e: 'import-success', data: any): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const visible = computed({
  get: () => props.modelValue,
  set: (val) => emit('update:modelValue', val)
})

const currentStep = ref(0)
const fileList = ref<any[]>([])
const uploadRef = ref()
const parsingProgress = ref(0)
const parsingStatus = ref('准备解析...')

const extractedData = ref({
  caseNumber: '',
  caseType: '',
  caseCause: '',
  court: '',
  targetAmount: undefined as number | undefined,
  filingDate: '',
  parties: [] as any[],
  keyDates: [] as any[]
})

const handleFileChange = (file: any, files: any[]) => {
  fileList.value = files
}

const handleFileRemove = (file: any, files: any[]) => {
  fileList.value = files
}

const startParsing = async () => {
  if (fileList.value.length === 0) {
    ElMessage.warning('请先上传文件')
    return
  }

  currentStep.value = 1
  parsingProgress.value = 0
  parsingStatus.value = '正在读取文件...'

  // 模拟解析过程
  await simulateParsing()
}

const simulateParsing = async () => {
  // 模拟OCR和NLP解析过程
  const steps = [
    { progress: 20, status: '正在进行OCR识别...' },
    { progress: 40, status: '正在提取文本内容...' },
    { progress: 60, status: '正在分析案件信息...' },
    { progress: 80, status: '正在识别当事人信息...' },
    { progress: 100, status: '解析完成！' }
  ]

  for (const step of steps) {
    await new Promise(resolve => setTimeout(resolve, 800))
    parsingProgress.value = step.progress
    parsingStatus.value = step.status
  }

  // 模拟提取的数据
  extractedData.value = {
    caseNumber: '(2025)京0105民初12345号',
    caseType: '民事',
    caseCause: '合同纠纷',
    court: '北京市朝阳区人民法院',
    targetAmount: 500000,
    filingDate: '2025-11-20',
    parties: [
      { party_type: '原告', name: '张三', contact_phone: '13800138000' },
      { party_type: '被告', name: '李四', contact_phone: '13900139000' }
    ],
    keyDates: [
      { date: '2025-11-20', event: '立案' },
      { date: '2025-12-05', event: '举证期限' },
      { date: '2025-12-20', event: '开庭审理' }
    ]
  }

  await new Promise(resolve => setTimeout(resolve, 500))
  currentStep.value = 2
}

const confirmImport = () => {
  emit('import-success', extractedData.value)
  ElMessage.success('信息已导入，请继续完善其他信息')
  handleClose()
}

const handleClose = () => {
  visible.value = false
  // 重置状态
  setTimeout(() => {
    currentStep.value = 0
    fileList.value = []
    parsingProgress.value = 0
    parsingStatus.value = '准备解析...'
    extractedData.value = {
      caseNumber: '',
      caseType: '',
      caseCause: '',
      court: '',
      targetAmount: undefined,
      filingDate: '',
      parties: [],
      keyDates: []
    }
  }, 300)
}
</script>

<style scoped>
.smart-import-container {
  min-height: 400px;
}

.upload-step {
  padding: 20px 0;
}

.file-type-hints {
  margin-top: 20px;
  text-align: center;
}

.parsing-step {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 300px;
}

.parsing-animation {
  text-align: center;
  width: 100%;
}

.rotating {
  animation: rotate 2s linear infinite;
}

@keyframes rotate {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

.parsing-text {
  font-size: 18px;
  font-weight: 500;
  margin: 20px 0 10px;
  color: #303133;
}

.parsing-detail {
  font-size: 14px;
  color: #909399;
  margin-bottom: 30px;
}

.confirm-step {
  max-height: 500px;
  overflow-y: auto;
}

.party-item {
  padding: 10px;
  background: #f5f7fa;
  border-radius: 4px;
  margin-bottom: 10px;
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
}
</style>
