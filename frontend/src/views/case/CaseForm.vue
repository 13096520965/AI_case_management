<template>
  <div class="case-form-container">
    <PageHeader :title="isEdit ? '编辑案件' : '新建案件'" />
    
    <el-card shadow="never">
      <!-- 智能导入按钮 -->
      <div class="smart-import-section" v-if="!isEdit">
        <el-alert
          title="智能导入"
          type="info"
          :closable="false"
          style="margin-bottom: 20px;"
        >
          <template #default>
            <div style="display: flex; align-items: center; justify-content: space-between;">
              <span style="flex: 1; padding-right: 20px;">上传案件相关文件（合同、判决书、立案通知书等），系统将自动提取关键信息并填充表单</span>
              <el-button type="primary" @click="showSmartImport = true" style="margin-left: auto;">
                <el-icon><MagicStick /></el-icon>
                智能导入
              </el-button>
            </div>
          </template>
        </el-alert>
      </div>

      <el-form
        ref="formRef"
        :model="formData"
        :rules="formRules"
        label-width="120px"
        class="case-form"
      >
        <el-divider content-position="left">基本信息</el-divider>
        
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
                :disabled="isArchived"
              >
                <el-option label="立案" value="立案" />
                <el-option label="审理中" value="审理中" />
                <el-option label="已结案" value="已结案" />
                <!-- 已归档状态只能通过创建归档包来设置，不能手动选择 -->
              </el-select>
              <div v-if="isArchived" style="color: #909399; font-size: 12px; margin-top: 4px;">
                已归档的案件不可修改状态
              </div>
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

        <el-divider />

        <el-form-item>
          <el-button type="primary" :loading="submitting" @click="handleSubmit">
            {{ isEdit ? '保存' : '创建' }}
          </el-button>
          <el-button @click="handleCancel">
            取消
          </el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <!-- 智能导入对话框 -->
    <SmartImportDialog 
      v-model="showSmartImport"
      @import-success="handleImportSuccess"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage, type FormInstance, type FormRules } from 'element-plus'
import { MagicStick } from '@element-plus/icons-vue'
import { caseApi } from '@/api/case'
import { useCaseStore } from '@/stores/case'
import PageHeader from '@/components/common/PageHeader.vue'
import SmartImportDialog from '@/components/case/SmartImportDialog.vue'

const route = useRoute()
const router = useRouter()
const caseStore = useCaseStore()

// State
const formRef = ref<FormInstance>()
const submitting = ref(false)
const isEdit = computed(() => !!route.params.id && route.name === 'CaseEdit')
const caseId = computed(() => Number(route.params.id))
const isArchived = computed(() => formData.status === '已归档')

// Smart Import State
const showSmartImport = ref(false)

// Form data
const formData = reactive({
  caseNumber: '',
  caseType: '',
  caseCause: '',
  court: '',
  targetAmount: undefined as number | undefined,
  filingDate: '',
  status: '立案',
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
      
      // 后端返回的是驼峰命名
      formData.caseNumber = caseData.caseNumber ?? ''
      formData.caseType = caseData.caseType ?? ''
      formData.caseCause = caseData.caseCause ?? ''
      formData.court = caseData.court ?? ''
      formData.targetAmount = caseData.targetAmount ?? undefined
      formData.filingDate = caseData.filingDate ? caseData.filingDate.split('T')[0] : ''
      formData.status = caseData.status ?? '立案'
      formData.teamId = caseData.teamId ?? undefined
      
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
        caseNumber: caseData.caseNumber,
        caseType: caseData.caseType,
        caseCause: caseData.caseCause,
        court: caseData.court,
        targetAmount: caseData.targetAmount,
        filingDate: caseData.filingDate,
        status: caseData.status,
        teamId: caseData.teamId
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

// Handle smart import success
const handleImportSuccess = (data: any) => {
  // 填充基本信息
  if (data.caseNumber) formData.caseNumber = data.caseNumber
  if (data.caseType) formData.caseType = data.caseType
  if (data.caseCause) formData.caseCause = data.caseCause
  if (data.court) formData.court = data.court
  if (data.targetAmount) formData.targetAmount = data.targetAmount
  if (data.filingDate) formData.filingDate = data.filingDate
  
  // 提示用户
  ElMessage.success({
    message: '智能导入成功！已自动填充案件信息，请检查并完善其他信息',
    duration: 3000
  })
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
        ElMessage.success('案件创建成功')
        
        // Update store
        if (response.data) {
          caseStore.addCase(response.data)
        }
        
        // Navigate to list page
        router.push('/cases')
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
}

.case-form {
  max-width: 1000px;
}

:deep(.el-divider__text) {
  font-weight: 600;
  color: #303133;
}
</style>
