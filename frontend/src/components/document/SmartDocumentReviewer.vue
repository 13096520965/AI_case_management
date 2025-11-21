<template>
  <el-dialog
    v-model="visible"
    title="智能文书审核"
    width="1000px"
    :close-on-click-modal="false"
    @close="handleClose"
  >
    <div class="reviewer-container">
      <!-- 上传或输入文书 -->
      <div v-if="!reviewResult" class="upload-section">
        <el-tabs v-model="inputMode">
          <el-tab-pane label="上传文件" name="upload">
            <el-upload
              class="upload-area"
              drag
              :auto-upload="false"
              :on-change="handleFileChange"
              :show-file-list="false"
              accept=".txt,.doc,.docx,.pdf"
            >
              <el-icon class="el-icon--upload"><UploadFilled /></el-icon>
              <div class="el-upload__text">
                将文件拖到此处，或<em>点击上传</em>
              </div>
              <template #tip>
                <div class="el-upload__tip">
                  支持 .txt, .doc, .docx, .pdf 格式，文件大小不超过10MB
                </div>
              </template>
            </el-upload>
            
            <div v-if="uploadedFile" class="file-info">
              <el-icon><Document /></el-icon>
              <span>{{ uploadedFile.name }}</span>
              <el-button type="danger" link @click="removeFile">
                <el-icon><Delete /></el-icon>
              </el-button>
            </div>
          </el-tab-pane>

          <el-tab-pane label="直接输入" name="text">
            <el-input
              v-model="documentText"
              type="textarea"
              :rows="15"
              placeholder="请粘贴或输入需要审核的文书内容..."
              class="document-input"
            />
          </el-tab-pane>
        </el-tabs>

        <div class="review-options">
          <h4>审核选项</h4>
          <el-checkbox-group v-model="reviewOptions">
            <el-checkbox label="compliance">合规性检查</el-checkbox>
            <el-checkbox label="logic">逻辑性检查</el-checkbox>
            <el-checkbox label="format">格式规范检查</el-checkbox>
            <el-checkbox label="completeness">完整性检查</el-checkbox>
          </el-checkbox-group>
        </div>

        <div class="action-buttons">
          <el-button
            type="primary"
            size="large"
            :loading="reviewing"
            :disabled="!canReview"
            @click="startReview"
          >
            <el-icon><MagicStick /></el-icon>
            开始智能审核
          </el-button>
        </div>
      </div>

      <!-- 审核结果 -->
      <div v-else class="review-result">
        <el-result
          :icon="getResultIcon()"
          :title="getResultTitle()"
          :sub-title="getResultSubtitle()"
        >
          <template #extra>
            <el-button type="primary" @click="resetReview">重新审核</el-button>
            <el-button @click="exportReport">导出报告</el-button>
          </template>
        </el-result>

        <!-- 问题统计 -->
        <el-row :gutter="20" class="stats-row">
          <el-col :span="6">
            <el-statistic title="总问题数" :value="reviewResult.totalIssues">
              <template #suffix>个</template>
            </el-statistic>
          </el-col>
          <el-col :span="6">
            <el-statistic title="严重问题" :value="reviewResult.criticalIssues">
              <template #suffix>个</template>
            </el-statistic>
          </el-col>
          <el-col :span="6">
            <el-statistic title="警告问题" :value="reviewResult.warningIssues">
              <template #suffix>个</template>
            </el-statistic>
          </el-col>
          <el-col :span="6">
            <el-statistic title="建议优化" :value="reviewResult.suggestionIssues">
              <template #suffix>个</template>
            </el-statistic>
          </el-col>
        </el-row>

        <!-- 问题详情 -->
        <el-tabs v-model="activeTab" class="issues-tabs">
          <el-tab-pane label="所有问题" name="all">
            <IssueList :issues="reviewResult.issues" @fix="handleFix" />
          </el-tab-pane>
          <el-tab-pane :label="`严重 (${reviewResult.criticalIssues})`" name="critical">
            <IssueList
              :issues="reviewResult.issues.filter((i: any) => i.severity === 'critical')"
              @fix="handleFix"
            />
          </el-tab-pane>
          <el-tab-pane :label="`警告 (${reviewResult.warningIssues})`" name="warning">
            <IssueList
              :issues="reviewResult.issues.filter((i: any) => i.severity === 'warning')"
              @fix="handleFix"
            />
          </el-tab-pane>
          <el-tab-pane :label="`建议 (${reviewResult.suggestionIssues})`" name="suggestion">
            <IssueList
              :issues="reviewResult.issues.filter((i: any) => i.severity === 'suggestion')"
              @fix="handleFix"
            />
          </el-tab-pane>
        </el-tabs>

        <!-- 修改建议 -->
        <el-card v-if="reviewResult.suggestions.length > 0" class="suggestions-card">
          <template #header>
            <div class="card-header">
              <el-icon><Lightbulb /></el-icon>
              <span>优化建议</span>
            </div>
          </template>
          <el-timeline>
            <el-timeline-item
              v-for="(suggestion, index) in reviewResult.suggestions"
              :key="index"
              :icon="Lightbulb"
              :color="getSuggestionColor(suggestion.priority)"
            >
              <div class="suggestion-item">
                <div class="suggestion-title">{{ suggestion.title }}</div>
                <div class="suggestion-content">{{ suggestion.content }}</div>
              </div>
            </el-timeline-item>
          </el-timeline>
        </el-card>
      </div>
    </div>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { ElMessage } from 'element-plus'
import {
  UploadFilled, Document, Delete, MagicStick,
  Lightbulb, SuccessFilled, WarningFilled, CircleCheckFilled
} from '@element-plus/icons-vue'
import { documentApi } from '@/api/document'
import IssueList from './IssueList.vue'

interface Props {
  modelValue: boolean
  caseId: number
  caseInfo: any
}

const props = defineProps<Props>()
const emit = defineEmits(['update:modelValue', 'success'])

const visible = computed({
  get: () => props.modelValue,
  set: (val) => emit('update:modelValue', val)
})

const inputMode = ref('upload')
const uploadedFile = ref<any>(null)
const documentText = ref('')
const reviewing = ref(false)
const reviewOptions = ref(['compliance', 'logic', 'format', 'completeness'])
const reviewResult = ref<any>(null)
const activeTab = ref('all')

const canReview = computed(() => {
  if (inputMode.value === 'upload') {
    return uploadedFile.value !== null
  }
  return documentText.value.trim().length > 0
})

const handleFileChange = (file: any) => {
  uploadedFile.value = file
  // 读取文件内容
  const reader = new FileReader()
  reader.onload = (e) => {
    documentText.value = e.target?.result as string
  }
  reader.readAsText(file.raw)
}

const removeFile = () => {
  uploadedFile.value = null
  documentText.value = ''
}

const startReview = async () => {
  reviewing.value = true
  try {
    const response = await documentApi.reviewDocument({
      caseId: props.caseId,
      content: documentText.value,
      options: reviewOptions.value,
      caseInfo: props.caseInfo
    })

    reviewResult.value = response.data
    ElMessage.success('文书审核完成')
  } catch (error) {
    console.error('审核失败:', error)
    ElMessage.error('文书审核失败，请重试')
  } finally {
    reviewing.value = false
  }
}

const resetReview = () => {
  reviewResult.value = null
  documentText.value = ''
  uploadedFile.value = null
  activeTab.value = 'all'
}

const getResultIcon = () => {
  if (!reviewResult.value) return SuccessFilled
  if (reviewResult.value.criticalIssues > 0) return WarningFilled
  if (reviewResult.value.warningIssues > 0) return CircleCheckFilled
  return SuccessFilled
}

const getResultTitle = () => {
  if (!reviewResult.value) return '审核完成'
  if (reviewResult.value.criticalIssues > 0) return '发现严重问题'
  if (reviewResult.value.warningIssues > 0) return '发现一些问题'
  return '文书质量良好'
}

const getResultSubtitle = () => {
  if (!reviewResult.value) return ''
  if (reviewResult.value.criticalIssues > 0) {
    return `发现 ${reviewResult.value.criticalIssues} 个严重问题，建议立即修改`
  }
  if (reviewResult.value.warningIssues > 0) {
    return `发现 ${reviewResult.value.warningIssues} 个警告问题，建议优化`
  }
  return '未发现明显问题，可以使用'
}

const getSuggestionColor = (priority: string) => {
  const colors: Record<string, string> = {
    high: '#f56c6c',
    medium: '#e6a23c',
    low: '#409eff'
  }
  return colors[priority] || '#909399'
}

const handleFix = (issue: any) => {
  ElMessage.info('自动修复功能开发中...')
}

const exportReport = () => {
  const report = generateReport()
  const blob = new Blob([report], { type: 'text/plain;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `文书审核报告_${new Date().getTime()}.txt`
  link.click()
  URL.revokeObjectURL(url)
  ElMessage.success('报告已导出')
}

const generateReport = () => {
  let report = '文书审核报告\n'
  report += '='.repeat(50) + '\n\n'
  report += `审核时间: ${new Date().toLocaleString()}\n`
  report += `案件编号: ${props.caseInfo.internal_number}\n`
  report += `总问题数: ${reviewResult.value.totalIssues}\n`
  report += `严重问题: ${reviewResult.value.criticalIssues}\n`
  report += `警告问题: ${reviewResult.value.warningIssues}\n`
  report += `建议优化: ${reviewResult.value.suggestionIssues}\n\n`
  
  report += '问题详情\n'
  report += '-'.repeat(50) + '\n\n'
  
  reviewResult.value.issues.forEach((issue: any, index: number) => {
    report += `${index + 1}. [${issue.severity.toUpperCase()}] ${issue.title}\n`
    report += `   位置: ${issue.location}\n`
    report += `   描述: ${issue.description}\n`
    report += `   建议: ${issue.suggestion}\n\n`
  })
  
  return report
}

const handleClose = () => {
  resetReview()
  visible.value = false
}
</script>

<style scoped>
.reviewer-container {
  padding: 20px 0;
}

.upload-section {
  min-height: 400px;
}

.upload-area {
  margin: 20px 0;
}

.file-info {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px;
  background: #f5f7fa;
  border-radius: 4px;
  margin-top: 10px;
}

.document-input :deep(textarea) {
  font-family: 'Courier New', monospace;
  line-height: 1.8;
}

.review-options {
  margin: 30px 0;
  padding: 20px;
  background: #f5f7fa;
  border-radius: 4px;
}

.review-options h4 {
  margin-bottom: 15px;
  color: #303133;
}

.action-buttons {
  text-align: center;
  margin-top: 30px;
}

.review-result {
  min-height: 500px;
}

.stats-row {
  margin: 30px 0;
}

.issues-tabs {
  margin-top: 30px;
}

.suggestions-card {
  margin-top: 20px;
}

.card-header {
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: bold;
}

.suggestion-item {
  padding: 10px 0;
}

.suggestion-title {
  font-weight: bold;
  color: #303133;
  margin-bottom: 5px;
}

.suggestion-content {
  color: #606266;
  line-height: 1.6;
}
</style>
