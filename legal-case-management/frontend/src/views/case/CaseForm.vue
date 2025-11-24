<template>
  <div class="case-form-container">
    <PageHeader :title="isEdit ? '编辑案件' : '新建案件'" :show-back="true" @back="goBack" />
    
    <!-- 新建案件提示 -->
    <el-alert
      v-if="!isEdit"
      title="新建案件流程"
      type="info"
      :closable="false"
      style="margin-bottom: 20px"
    >
      <template #default>
        <div>请先填写案件基本信息并保存，保存后可继续添加诉讼主体、流程节点、证据材料等详细信息。</div>
      </template>
    </el-alert>
    
    <el-card shadow="never" class="info-card">
        <template #header>
          <div class="card-header">
            <span class="card-title">基本信息</span>
          </div>
        </template>
      <el-form
        ref="formRef"
        :model="formData"
        :rules="formRules"
        label-width="120px"
      >
        
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="案号" prop="caseNumber">
              <el-input
                v-model="formData.caseNumber"
                placeholder="请输入案号（可选，系统将自动生成内部编号）"
              />
            </el-form-item>
          </el-col>
          
          <el-col :span="12">
            <el-form-item label="案件类型" prop="caseType">
              <el-select
                v-model="formData.caseType"
                placeholder="请选择案件类型"
                style="width: 100%"
              >
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
            <el-form-item label="案由" prop="caseCause">
              <el-input
                v-model="formData.caseCause"
                placeholder="请输入案由"
              />
            </el-form-item>
          </el-col>
          
          <el-col :span="12">
            <el-form-item label="受理法院" prop="court">
              <el-input
                v-model="formData.court"
                placeholder="请输入受理法院"
              />
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="标的额（元）" prop="targetAmount">
              <el-input-number
                v-model="formData.targetAmount"
                :min="0"
                :precision="2"
                :controls="false"
                placeholder="请输入标的额"
                style="width: 100%"
              />
            </el-form-item>
          </el-col>
          
          <el-col :span="12">
            <el-form-item label="立案日期" prop="filingDate">
              <el-date-picker
                v-model="formData.filingDate"
                type="date"
                placeholder="请选择立案日期"
                style="width: 100%"
                format="YYYY-MM-DD"
                value-format="YYYY-MM-DD"
              />
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="案件状态" prop="status">
              <el-select
                v-model="formData.status"
                placeholder="请选择案件状态"
                style="width: 100%"
              >
                <el-option label="立案" value="立案" />
                <el-option label="审理中" value="审理中" />
                <el-option label="已结案" value="已结案" />
                <el-option label="已归档" value="已归档" />
              </el-select>
            </el-form-item>
          </el-col>
          
          <el-col :span="12">
            <el-form-item label="承办人员" prop="handler">
              <el-input
                v-model="formData.handler"
                placeholder="请输入承办人员姓名"
              />
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="团队ID" prop="teamId">
              <el-input-number
                v-model="formData.teamId"
                :min="1"
                :controls="false"
                placeholder="请输入团队ID（可选）"
                style="width: 100%"
              />
            </el-form-item>
          </el-col>
        </el-row>

        <el-divider />

      </el-form>
    </el-card>

    <!-- 编辑模式下的额外模块 -->
    <template v-if="isEdit && caseId">
      <!-- 标的处理详情 -->
      <TargetAmountDetail :case-id="caseId" :show-detail-button="true" />

      <!-- 诉讼主体 -->
      <el-card shadow="never" class="info-card">
        <template #header>
          <div class="card-header">
            <span class="card-title">诉讼主体</span>
          </div>
        </template>
        <PartyManagement :case-id="caseId" />
      </el-card>

      <!-- 流程节点 -->
      <el-card shadow="never" class="info-card">
        <template #header>
          <div class="card-header">
            <span class="card-title">流程节点</span>
            <el-button type="primary" link @click="goToProcess">
              查看详情
            </el-button>
          </div>
        </template>
        <ProcessNodeList :case-id="caseId" />
      </el-card>

      <!-- 证据材料 -->
      <el-card shadow="never" class="info-card">
        <template #header>
          <div class="card-header">
            <span class="card-title">证据材料</span>
            <el-button type="primary" link @click="goToEvidence">
              查看详情
            </el-button>
          </div>
        </template>
        <EvidenceList :case-id="caseId" />
      </el-card>

      <!-- 文书材料 -->
      <el-card shadow="never" class="info-card">
        <template #header>
          <div class="card-header">
            <span class="card-title">文书材料</span>
            <el-button type="primary" link @click="goToDocuments">
              查看详情
            </el-button>
          </div>
        </template>
        <DocumentList :case-id="caseId" />
      </el-card>

      <!-- 成本记录 -->
      <el-card shadow="never" class="info-card">
        <template #header>
          <div class="card-header">
            <span class="card-title">成本记录</span>
            <el-button type="primary" link @click="goToCosts">
              查看详情
            </el-button>
          </div>
        </template>
        <CostList :case-id="caseId" />
      </el-card>
    </template>

    <!-- 固定底部按钮栏 -->
    <div class="fixed-footer">
      <div class="footer-content">
        <el-button @click="handleCancel">取消</el-button>
        <el-button type="primary" :loading="submitting" @click="handleSubmit">
          {{ isEdit ? '保存' : '创建' }}
        </el-button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage, type FormInstance, type FormRules } from 'element-plus'
import { caseApi } from '@/api/case'
import { useCaseStore } from '@/stores/case'
import PageHeader from '@/components/common/PageHeader.vue'
import TargetAmountDetail from '@/components/case/TargetAmountDetail.vue'
import PartyManagement from '@/components/case/PartyManagement.vue'
import ProcessNodeList from '@/components/case/ProcessNodeList.vue'
import EvidenceList from '@/components/case/EvidenceList.vue'
import DocumentList from '@/components/case/DocumentList.vue'
import CostList from '@/components/case/CostList.vue'

const route = useRoute()
const router = useRouter()
const caseStore = useCaseStore()

// State
const formRef = ref<FormInstance>()
const submitting = ref(false)
const isEdit = computed(() => !!route.params.id && route.name === 'CaseEdit')
const caseId = computed(() => Number(route.params.id))

// Form data
const formData = reactive({
  caseNumber: '',
  caseType: '',
  caseCause: '',
  court: '',
  targetAmount: undefined as number | undefined,
  filingDate: '',
  status: '立案',
  handler: '',
  teamId: undefined as number | undefined
})

// Form validation rules
const formRules: FormRules = {
  caseType: [
    { required: true, message: '请选择案件类型', trigger: 'change' }
  ],
  caseCause: [
    { required: true, message: '请输入案由', trigger: 'blur' },
    { min: 2, max: 200, message: '案由长度在 2 到 200 个字符', trigger: 'blur' }
  ],
  court: [
    { required: true, message: '请输入受理法院', trigger: 'blur' },
    { min: 2, max: 200, message: '法院名称长度在 2 到 200 个字符', trigger: 'blur' }
  ],
  targetAmount: [
    { type: 'number', message: '请输入有效的数字', trigger: 'blur' }
  ],
  status: [
    { required: true, message: '请选择案件状态', trigger: 'change' }
  ],
  handler: [
    { min: 2, max: 50, message: '承办人员姓名长度在 2 到 50 个字符', trigger: 'blur' }
  ]
}

// Fetch case data for editing
const fetchCaseData = async () => {
  if (!isEdit.value) return
  
  try {
    const response = await caseApi.getCaseById(caseId.value)
    
    console.log('API Response:', response)
    console.log('Response data:', response.data)
    
    if (response.data) {
      // 后端返回的数据可能在 response.data.case 中
      const caseData = response.data.case || response.data
      console.log('Case data:', caseData)
      
      // 后端返回的是下划线命名，需要映射到驼峰命名
      formData.caseNumber = caseData.case_number ?? ''
      formData.caseType = caseData.case_type ?? ''
      formData.caseCause = caseData.case_cause ?? ''
      formData.court = caseData.court ?? ''
      formData.targetAmount = caseData.target_amount ?? undefined
      formData.filingDate = caseData.filing_date ? caseData.filing_date.split('T')[0] : ''
      formData.status = caseData.status ?? '立案'
      formData.handler = caseData.handler ?? ''
      formData.teamId = caseData.team_id ?? undefined
      
      console.log('Form data after mapping:', {
        caseNumber: formData.caseNumber,
        caseType: formData.caseType,
        caseCause: formData.caseCause,
        court: formData.court,
        targetAmount: formData.targetAmount,
        filingDate: formData.filingDate,
        status: formData.status,
        teamId: formData.teamId
      })
      console.log('Raw case data fields:', {
        case_number: caseData.case_number,
        case_type: caseData.case_type,
        case_cause: caseData.case_cause,
        court: caseData.court,
        target_amount: caseData.target_amount,
        filing_date: caseData.filing_date,
        status: caseData.status,
        team_id: caseData.team_id
      })
      
      // Update store
      caseStore.setCurrentCase(caseData)
    }
  } catch (error: any) {
    console.error('Fetch case error:', error)
    ElMessage.error(error.message || '获取案件信息失败')
    router.push('/cases')
  }
}

// Submit handler
const handleSubmit = async () => {
  if (!formRef.value) return
  
  await formRef.value.validate(async (valid) => {
    if (!valid) return
    
    submitting.value = true
    
    try {
      const submitData: any = {
        caseType: formData.caseType,
        caseCause: formData.caseCause,
        court: formData.court,
        status: formData.status
      }
      
      if (formData.caseNumber) {
        submitData.caseNumber = formData.caseNumber
      }
      if (formData.targetAmount !== undefined) {
        submitData.targetAmount = formData.targetAmount
      }
      if (formData.filingDate) {
        submitData.filingDate = formData.filingDate
      }
      if (formData.handler) {
        submitData.handler = formData.handler
      }
      if (formData.teamId !== undefined) {
        submitData.teamId = formData.teamId
      }
      
      if (isEdit.value) {
        // Update case
        await caseApi.updateCase(caseId.value, submitData)
        ElMessage.success('案件更新成功')
        
        // Update store
        caseStore.updateCase(caseId.value, submitData)
        
        // Navigate to detail page
        router.push(`/cases/${caseId.value}`)
      } else {
        // Create case
        const response = await caseApi.createCase(submitData)
        ElMessage.success('案件基本信息创建成功，请继续添加其他信息')
        
        // Update store
        if (response.data) {
          caseStore.addCase(response.data)
        }
        
        // Get the new case ID from response
        const newCaseId = response.data?.case?.id || response.data?.id
        
        if (newCaseId) {
          // Navigate to edit page to continue adding other information
          router.push(`/cases/${newCaseId}/edit`)
        } else {
          // Fallback to list page if no ID returned
          router.push('/cases')
        }
      }
    } catch (error: any) {
      ElMessage.error(error.message || (isEdit.value ? '更新失败' : '创建失败'))
    } finally {
      submitting.value = false
    }
  })
}

// Cancel handler
const handleCancel = () => {
  router.back()
}

// Navigation methods
const goBack = () => {
  router.push('/cases')
}

const goToProcess = () => {
  router.push(`/cases/${caseId.value}/process`)
}

const goToEvidence = () => {
  router.push(`/cases/${caseId.value}/evidence`)
}

const goToDocuments = () => {
  router.push(`/cases/${caseId.value}/documents`)
}

const goToCosts = () => {
  router.push(`/cases/${caseId.value}/costs`)
}

// Lifecycle
onMounted(() => {
  if (isEdit.value) {
    fetchCaseData()
  }
})
</script>

<style scoped>
.case-form-container {
  padding: 20px;
  min-height: calc(100vh - 120px);
  display: flex;
  flex-direction: column;
}

/* 与详情页面一致的卡片样式 */
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

/* 固定底部按钮栏 */
.fixed-footer {
  position: sticky;
  bottom: 0;
  background: #fff;
  border-top: 1px solid #e8e8e8;
  box-shadow: 0 -2px 8px rgba(0, 0, 0, 0.08);
  margin: 20px -20px -20px -20px;
  padding: 16px 20px;
  z-index: 100;
}

.footer-content {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}

:deep(.el-divider__text) {
  font-weight: 600;
  color: #303133;
}
</style>
