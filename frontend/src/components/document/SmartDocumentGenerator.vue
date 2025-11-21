<template>
  <el-dialog
    v-model="visible"
    title="智能文书生成"
    width="900px"
    :close-on-click-modal="false"
    @close="handleClose"
  >
    <div class="generator-container">
      <!-- 步骤指示器 -->
      <el-steps :active="currentStep" finish-status="success" align-center>
        <el-step title="选择模板" />
        <el-step title="确认信息" />
        <el-step title="生成文书" />
      </el-steps>

      <!-- 步骤1: 选择模板 -->
      <div v-if="currentStep === 0" class="step-content">
        <div class="template-selector">
          <h3>请选择文书类型</h3>
          <el-row :gutter="20">
            <el-col
              v-for="template in templates"
              :key="template.id"
              :span="8"
            >
              <el-card
                shadow="hover"
                :class="['template-card', { selected: selectedTemplate?.id === template.id }]"
                @click="selectTemplate(template)"
              >
                <div class="template-icon">
                  <el-icon :size="32" :color="template.color">
                    <component :is="template.icon" />
                  </el-icon>
                </div>
                <div class="template-name">{{ template.name }}</div>
                <div class="template-desc">{{ template.description }}</div>
              </el-card>
            </el-col>
          </el-row>
        </div>
      </div>

      <!-- 步骤2: 确认信息 -->
      <div v-if="currentStep === 1" class="step-content">
        <el-alert
          title="系统将基于以下案件信息生成文书"
          type="info"
          :closable="false"
          style="margin-bottom: 12px"
        />
        
        <el-descriptions :column="2" border size="small">
          <el-descriptions-item label="案号">
            {{ caseInfo.case_number || caseInfo.internal_number }}
          </el-descriptions-item>
          <el-descriptions-item label="案件类型">
            {{ caseInfo.case_type }}
          </el-descriptions-item>
          <el-descriptions-item label="案由">
            {{ caseInfo.case_cause }}
          </el-descriptions-item>
          <el-descriptions-item label="受理法院">
            {{ caseInfo.court }}
          </el-descriptions-item>
          <el-descriptions-item label="标的额">
            {{ formatAmount(caseInfo.target_amount) }}
          </el-descriptions-item>
          <el-descriptions-item label="立案日期">
            {{ caseInfo.filing_date }}
          </el-descriptions-item>
        </el-descriptions>

        <el-divider />

        <h4 style="margin: 12px 0 8px 0; font-size: 14px;">诉讼主体信息</h4>
        <el-table :data="parties" border size="small">
          <el-table-column prop="party_type" label="主体类型" width="100" />
          <el-table-column prop="name" label="名称" />
          <el-table-column prop="entity_type" label="实体类型" width="100" />
          <el-table-column prop="contact_phone" label="联系电话" width="130" />
        </el-table>

        <el-form :model="extraInfo" label-width="100px" size="small" style="margin-top: 12px">
          <el-form-item label="代理律师">
            <el-input v-model="extraInfo.lawyer" placeholder="请输入代理律师姓名" />
          </el-form-item>
          <el-form-item label="律所名称">
            <el-input v-model="extraInfo.lawFirm" placeholder="请输入律师事务所名称" />
          </el-form-item>
          <el-form-item label="特殊说明">
            <el-input
              v-model="extraInfo.notes"
              type="textarea"
              :rows="3"
              placeholder="如有特殊要求或补充信息，请在此填写"
            />
          </el-form-item>
        </el-form>
      </div>

      <!-- 步骤3: 生成结果 -->
      <div v-if="currentStep === 2" class="step-content">
        <div v-loading="generating" element-loading-text="AI正在生成文书，请稍候...">
          <el-alert
            v-if="!generating && generatedContent"
            title="文书生成成功！"
            type="success"
            :closable="false"
            style="margin-bottom: 12px"
          >
            <template #default>
              您可以在下方预览和编辑生成的文书内容，确认无误后点击"保存文书"按钮。
            </template>
          </el-alert>

          <div v-if="generatedContent" class="document-preview">
            <div class="preview-toolbar">
              <el-button-group>
                <el-button size="small" @click="copyContent">
                  <el-icon><CopyDocument /></el-icon>
                  复制
                </el-button>
                <el-button size="small" @click="downloadDocument">
                  <el-icon><Download /></el-icon>
                  下载
                </el-button>
                <el-button size="small" type="primary" @click="saveDocument">
                  <el-icon><Check /></el-icon>
                  保存文书
                </el-button>
              </el-button-group>
            </div>

            <el-input
              v-model="generatedContent"
              type="textarea"
              :rows="20"
              class="document-editor"
              placeholder="文书内容"
            />
          </div>
        </div>
      </div>
    </div>

    <template #footer>
      <div class="dialog-footer">
        <el-button @click="handleClose">取消</el-button>
        <el-button v-if="currentStep > 0" @click="prevStep">上一步</el-button>
        <el-button
          v-if="currentStep < 2"
          type="primary"
          :disabled="!canProceed"
          @click="nextStep"
        >
          下一步
        </el-button>
      </div>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { ElMessage } from 'element-plus'
import {
  Document, Tickets, Edit, Notebook, Files, Memo,
  CopyDocument, Download, Check
} from '@element-plus/icons-vue'
import { documentApi } from '@/api/document'

interface Props {
  modelValue: boolean
  caseId: number
  caseInfo: any
  parties: any[]
}

const props = defineProps<Props>()
const emit = defineEmits(['update:modelValue', 'success'])

const visible = computed({
  get: () => props.modelValue,
  set: (val) => emit('update:modelValue', val)
})

const currentStep = ref(0)
const generating = ref(false)
const selectedTemplate = ref<any>(null)
const generatedContent = ref('')
const extraInfo = ref({
  lawyer: '',
  lawFirm: '',
  notes: ''
})

// 文书模板列表
const templates = ref([
  {
    id: 'complaint',
    name: '起诉状',
    description: '民事/行政起诉状',
    icon: Document,
    color: '#409EFF',
    type: 'complaint'
  },
  {
    id: 'defense',
    name: '答辩状',
    description: '针对起诉的答辩意见',
    icon: Tickets,
    color: '#67C23A',
    type: 'defense'
  },
  {
    id: 'agency_opinion',
    name: '代理词',
    description: '法庭辩论代理意见',
    icon: Edit,
    color: '#E6A23C',
    type: 'agency_opinion'
  },
  {
    id: 'case_report',
    name: '案件汇报材料',
    description: '内部案件情况汇报',
    icon: Notebook,
    color: '#F56C6C',
    type: 'case_report'
  },
  {
    id: 'evidence_list',
    name: '证据清单',
    description: '诉讼证据目录',
    icon: Files,
    color: '#909399',
    type: 'evidence_list'
  },
  {
    id: 'legal_opinion',
    name: '法律意见书',
    description: '专业法律分析意见',
    icon: Memo,
    color: '#606266',
    type: 'legal_opinion'
  }
])

const canProceed = computed(() => {
  if (currentStep.value === 0) {
    return selectedTemplate.value !== null
  }
  return true
})

const selectTemplate = (template: any) => {
  selectedTemplate.value = template
}

const nextStep = async () => {
  if (currentStep.value === 1) {
    // 开始生成文书
    await generateDocument()
  }
  currentStep.value++
}

const prevStep = () => {
  currentStep.value--
}

const generateDocument = async () => {
  generating.value = true
  try {
    const response = await documentApi.generateDocument({
      caseId: props.caseId,
      templateType: selectedTemplate.value.type,
      caseInfo: props.caseInfo,
      parties: props.parties,
      extraInfo: extraInfo.value
    })

    generatedContent.value = response.data.content
    ElMessage.success('文书生成成功')
  } catch (error) {
    console.error('生成文书失败:', error)
    ElMessage.error('文书生成失败，请重试')
    currentStep.value = 1 // 返回上一步
  } finally {
    generating.value = false
  }
}

const copyContent = () => {
  navigator.clipboard.writeText(generatedContent.value)
  ElMessage.success('已复制到剪贴板')
}

const downloadDocument = () => {
  const blob = new Blob([generatedContent.value], { type: 'text/plain;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `${selectedTemplate.value.name}_${props.caseInfo.internal_number}.txt`
  link.click()
  URL.revokeObjectURL(url)
  ElMessage.success('文书已下载')
}

const saveDocument = async () => {
  try {
    await documentApi.saveDocument({
      caseId: props.caseId,
      documentType: selectedTemplate.value.type,
      documentName: selectedTemplate.value.name,
      content: generatedContent.value
    })
    ElMessage.success('文书保存成功')
    emit('success')
    handleClose()
  } catch (error) {
    console.error('保存文书失败:', error)
    ElMessage.error('保存文书失败，请重试')
  }
}

const formatAmount = (amount: number) => {
  if (!amount) return '-'
  if (amount >= 100000000) return (amount / 100000000).toFixed(2) + '亿'
  if (amount >= 10000) return (amount / 10000).toFixed(2) + '万'
  return amount.toFixed(2)
}

const handleClose = () => {
  currentStep.value = 0
  selectedTemplate.value = null
  generatedContent.value = ''
  extraInfo.value = {
    lawyer: '',
    lawFirm: '',
    notes: ''
  }
  visible.value = false
}
</script>

<style scoped>
.generator-container {
  padding: 10px 0;
}

.step-content {
  margin-top: 15px;
  min-height: 300px;
}

.template-selector h3 {
  margin-bottom: 12px;
  color: #303133;
  font-size: 16px;
}

.template-card {
  cursor: pointer;
  text-align: center;
  padding: 12px 8px;
  transition: all 0.3s;
  margin-bottom: 12px;
}

.template-card:hover {
  transform: translateY(-3px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.template-card.selected {
  border: 2px solid #409EFF;
  background: #ecf5ff;
}

.template-icon {
  margin-bottom: 8px;
}

.template-name {
  font-size: 15px;
  font-weight: bold;
  color: #303133;
  margin-bottom: 5px;
}

.template-desc {
  font-size: 12px;
  color: #909399;
  line-height: 1.4;
}

.document-preview {
  border: 1px solid #dcdfe6;
  border-radius: 4px;
  overflow: hidden;
}

.preview-toolbar {
  padding: 10px;
  background: #f5f7fa;
  border-bottom: 1px solid #dcdfe6;
  display: flex;
  justify-content: flex-end;
}

.document-editor {
  font-family: 'Courier New', monospace;
  line-height: 1.8;
}

.document-editor :deep(textarea) {
  border: none;
  border-radius: 0;
  padding: 20px;
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}
</style>
