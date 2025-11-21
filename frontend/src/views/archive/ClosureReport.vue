<template>
  <div class="closure-report-container">
    <PageHeader title="结案报告" :back-to="`/cases/${caseId}`" />

    <el-card v-loading="loading" class="form-card">
      <!-- 案件基本信息 -->
      <div v-if="caseInfo" class="case-info">
        <h3>案件信息</h3>
        <el-descriptions :column="2" border>
          <el-descriptions-item label="案件编号">{{ caseInfo.case_number }}</el-descriptions-item>
          <el-descriptions-item label="内部编号">{{ caseInfo.internal_number }}</el-descriptions-item>
          <el-descriptions-item label="案件类型">{{ caseInfo.case_type }}</el-descriptions-item>
          <el-descriptions-item label="案由">{{ caseInfo.case_cause }}</el-descriptions-item>
          <el-descriptions-item label="法院">{{ caseInfo.court }}</el-descriptions-item>
          <el-descriptions-item label="标的额">{{ formatAmount(caseInfo.target_amount) }}</el-descriptions-item>
        </el-descriptions>
      </div>

      <!-- 结案报告表单 -->
      <el-form
        ref="formRef"
        :model="formData"
        :rules="rules"
        label-width="120px"
        class="report-form"
      >
        <el-divider content-position="left">
          <h3>结案报告内容</h3>
        </el-divider>

        <el-form-item label="案件概述" prop="case_summary">
          <el-input
            v-model="formData.case_summary"
            type="textarea"
            :rows="4"
            placeholder="请简要概述案件基本情况、诉讼请求等"
          />
        </el-form-item>

        <el-form-item label="案件结果" prop="case_result">
          <el-select v-model="formData.case_result" placeholder="请选择案件结果" style="width: 100%">
            <el-option label="胜诉" value="胜诉" />
            <el-option label="部分胜诉" value="部分胜诉" />
            <el-option label="败诉" value="败诉" />
            <el-option label="调解" value="调解" />
            <el-option label="撤诉" value="撤诉" />
            <el-option label="其他" value="其他" />
          </el-select>
        </el-form-item>

        <el-form-item label="经验总结" prop="experience_summary">
          <el-input
            v-model="formData.experience_summary"
            type="textarea"
            :rows="6"
            placeholder="请总结办案过程中的成功经验、有效策略等"
          />
        </el-form-item>

        <el-form-item label="风险提示" prop="risk_warnings">
          <el-input
            v-model="formData.risk_warnings"
            type="textarea"
            :rows="6"
            placeholder="请记录案件中遇到的风险点、注意事项等"
          />
        </el-form-item>

        <el-form-item label="经验教训" prop="lessons_learned">
          <el-input
            v-model="formData.lessons_learned"
            type="textarea"
            :rows="4"
            placeholder="请记录需要改进的地方、避免的错误等"
          />
        </el-form-item>

        <el-form-item label="审批状态" prop="approval_status">
          <el-select v-model="formData.approval_status" placeholder="请选择审批状态" style="width: 100%">
            <el-option label="草稿" value="草稿" />
            <el-option label="待审批" value="待审批" />
            <el-option label="已审批" value="已审批" />
            <el-option label="已驳回" value="已驳回" />
          </el-select>
        </el-form-item>

        <el-form-item>
          <el-button type="primary" @click="handleSubmit" :loading="submitting">
            {{ isEdit ? '更新报告' : '创建报告' }}
          </el-button>
          <el-button @click="handleReset">重置</el-button>
          <el-button v-if="isEdit && formData.approval_status === '草稿'" type="success" @click="handleSubmitForApproval">
            提交审批
          </el-button>
        </el-form-item>
      </el-form>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage, ElMessageBox, type FormInstance, type FormRules } from 'element-plus'
import { archiveApi } from '@/api/archive'
import { caseApi } from '@/api/case'
import PageHeader from '@/components/common/PageHeader.vue'

const route = useRoute()
const router = useRouter()
const caseId = Number(route.params.caseId)

const loading = ref(false)
const submitting = ref(false)
const isEdit = ref(false)
const reportId = ref<number>()
const caseInfo = ref<any>(null)
const formRef = ref<FormInstance>()

const formData = reactive({
  case_id: caseId,
  case_summary: '',
  case_result: '',
  experience_summary: '',
  risk_warnings: '',
  lessons_learned: '',
  approval_status: '草稿',
  created_by: ''
})

const rules: FormRules = {
  case_summary: [
    { required: true, message: '请输入案件概述', trigger: 'blur' }
  ],
  case_result: [
    { required: true, message: '请选择案件结果', trigger: 'change' }
  ],
  experience_summary: [
    { required: true, message: '请输入经验总结', trigger: 'blur' }
  ],
  risk_warnings: [
    { required: true, message: '请输入风险提示', trigger: 'blur' }
  ]
}

const formatAmount = (amount: number) => {
  if (!amount) return '0.00'
  return `¥${amount.toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

const loadCaseInfo = async () => {
  try {
    const response = await caseApi.getCaseById(caseId)
    caseInfo.value = response.data.case
  } catch (error: any) {
    ElMessage.error(error.response?.data?.error?.message || '加载案件信息失败')
  }
}

const loadClosureReport = async () => {
  try {
    loading.value = true
    const response = await archiveApi.getClosureReportByCaseId(caseId)
    
    if (response.data.report) {
      isEdit.value = true
      reportId.value = response.data.report.id
      Object.assign(formData, response.data.report)
    }
  } catch (error: any) {
    // 404 表示还没有创建报告，这是正常的
    if (error.response?.status !== 404) {
      ElMessage.error(error.response?.data?.error?.message || '加载结案报告失败')
    }
  } finally {
    loading.value = false
  }
}

const handleSubmit = async () => {
  if (!formRef.value) return

  await formRef.value.validate(async (valid) => {
    if (!valid) return

    try {
      submitting.value = true

      if (isEdit.value && reportId.value) {
        await archiveApi.updateClosureReport(reportId.value, formData)
        ElMessage.success('结案报告更新成功')
      } else {
        const response = await archiveApi.createClosureReport(formData)
        isEdit.value = true
        reportId.value = response.data.report.id
        ElMessage.success('结案报告创建成功')
      }

      await loadClosureReport()
    } catch (error: any) {
      ElMessage.error(error.response?.data?.error?.message || '保存失败')
    } finally {
      submitting.value = false
    }
  })
}

const handleSubmitForApproval = async () => {
  try {
    await ElMessageBox.confirm('确定要提交审批吗？提交后将无法修改。', '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })

    formData.approval_status = '待审批'
    await handleSubmit()
  } catch {
    // 用户取消
  }
}

const handleReset = () => {
  formRef.value?.resetFields()
}

const handleBack = () => {
  router.push(`/cases/${caseId}`)
}

onMounted(async () => {
  await loadCaseInfo()
  await loadClosureReport()
})
</script>

<style scoped>
.closure-report-container {
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

.header-content h2 {
  margin: 0;
  font-size: 20px;
  font-weight: 600;
}

.form-card {
  margin-bottom: 20px;
}

.case-info {
  margin-bottom: 30px;
}

.case-info h3 {
  margin: 0 0 15px 0;
  font-size: 16px;
  font-weight: 600;
  color: #303133;
}

.report-form {
  margin-top: 20px;
}

.el-divider h3 {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: #303133;
}
</style>
