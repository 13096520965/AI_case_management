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

        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="案件承接人" prop="handler">
              <el-input
                v-model="formData.handler"
                placeholder="请输入案件承接人"
              />
            </el-form-item>
          </el-col>
          
          <el-col :span="12">
            <el-form-item label="产业板块" prop="industrySegment">
              <el-select
                v-model="formData.industrySegment"
                placeholder="请选择产业板块"
                style="width: 100%"
              >
                <el-option label="新奥新智" value="新奥新智" />
                <el-option label="新奥股份" value="新奥股份" />
                <el-option label="新奥能源" value="新奥能源" />
                <el-option label="新地环保" value="新地环保" />
                <el-option label="新奥动力" value="新奥动力" />
                <el-option label="能源研究院" value="能源研究院" />
                <el-option label="新绎控股" value="新绎控股" />
                <el-option label="数能科技" value="数能科技" />
                <el-option label="新智认知" value="新智认知" />
                <el-option label="质信智购" value="质信智购" />
                <el-option label="新智感知" value="新智感知" />
                <el-option label="新智通才" value="新智通才" />
                <el-option label="财务公司" value="财务公司" />
                <el-option label="新奥国际" value="新奥国际" />
                <el-option label="河北金租" value="河北金租" />
                <el-option label="新博卓畅" value="新博卓畅" />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="是否外部代理" prop="isExternalAgent">
              <el-radio-group v-model="formData.isExternalAgent">
                <el-radio :label="false">否</el-radio>
                <el-radio :label="true">是</el-radio>
              </el-radio-group>
            </el-form-item>
          </el-col>
        </el-row>

        <template v-if="formData.isExternalAgent">
          <el-row :gutter="20">
            <el-col :span="12">
              <el-form-item label="律所名称" prop="lawFirmName">
                <el-input
                  v-model="formData.lawFirmName"
                  placeholder="请输入律所名称"
                />
              </el-form-item>
            </el-col>
            
            <el-col :span="12">
              <el-form-item label="代理律师" prop="agentLawyer">
                <el-input
                  v-model="formData.agentLawyer"
                  placeholder="请输入代理律师姓名"
                />
              </el-form-item>
            </el-col>
          </el-row>

          <el-row :gutter="20">
            <el-col :span="12">
              <el-form-item label="联系方式" prop="agentContact">
                <el-input
                  v-model="formData.agentContact"
                  placeholder="请输入联系方式"
                />
              </el-form-item>
            </el-col>
          </el-row>
        </template>

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
  teamId: undefined as number | undefined,
  handler: '',
  industrySegment: '',
  isExternalAgent: false,
  lawFirmName: '',
  agentLawyer: '',
  agentContact: ''
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
  ],  
  industrySegment: [
    { required: true, message: '请选择产业板块', trigger: 'change' }
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
      // 兼容后端返回的多种日期格式：数字(Excel序列号)、ISO 字符串、YYYY-MM-DD
      const parseToDateString = (d: any) => {
        if (d === null || d === undefined || d === '') return ''
        if (typeof d === 'number') {
          // Excel 序列号（基于 1899-12-30）
          const ts = Math.round((d - 25569) * 86400 * 1000)
          const dt = new Date(ts)
          if (!isNaN(dt.getTime())) return dt.toISOString().split('T')[0]
          return ''
        }
        if (typeof d === 'string') {
          if (d.includes('T')) return d.split('T')[0]
          if (/^\d{4}-\d{2}-\d{2}$/.test(d)) return d
          const parsed = Date.parse(d)
          if (!isNaN(parsed)) return new Date(parsed).toISOString().split('T')[0]
          return ''
        }
        return ''
      }

      formData.filingDate = parseToDateString(caseData.filing_date)
      formData.status = caseData.status ?? '立案'
      formData.handler = caseData.handler ?? ''
      formData.teamId = caseData.team_id ?? undefined
      formData.handler = caseData.handler ?? ''
      formData.industrySegment = caseData.industry_segment ?? ''
      // 规范化后端可能返回的多种格式（boolean / number 0|1 / string '0'|'1'|'true'|'false'）
      const externalAgentRaw = caseData.is_external_agent
      formData.isExternalAgent = (
        externalAgentRaw === 1 
      )
      formData.lawFirmName = caseData.law_firm_name ?? ''
      formData.agentLawyer = caseData.agent_lawyer ?? ''
      formData.agentContact = caseData.agent_contact ?? ''
      
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
        status: formData.status,
        industrySegment: formData.industrySegment,
        isExternalAgent: formData.isExternalAgent
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
      if (formData.handler) {
        submitData.handler = formData.handler
      }
      if (formData.isExternalAgent) {
        submitData.lawFirmName = formData.lawFirmName
        submitData.agentLawyer = formData.agentLawyer
        submitData.agentContact = formData.agentContact
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
