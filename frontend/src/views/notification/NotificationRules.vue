<template>
  <div class="notification-rules-container">
    <PageHeader title="提醒规则配置" />

    <el-card>
      <div class="toolbar">
        <el-button type="primary" @click="handleCreate">
          <el-icon><Plus /></el-icon>
          新建规则
        </el-button>
        <el-button @click="handleRefresh" :loading="loading">
          <el-icon><Refresh /></el-icon>
          刷新
        </el-button>
      </div>

      <el-table
        :data="rules"
        v-loading="loading"
        stripe
        style="width: 100%; margin-top: 20px"
      >
        <el-table-column prop="id" label="ID" width="80" />
        <el-table-column prop="ruleName" label="规则名称" min-width="150" />
        <el-table-column prop="ruleType" label="规则类型" width="120">
          <template #default="{ row }">
            <el-tag :type="getRuleTypeTag(row.ruleType)" size="small">
              {{ getRuleTypeLabel(row.ruleType) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="triggerCondition" label="触发条件" min-width="150" />
        <el-table-column label="阈值" width="120">
          <template #default="{ row }">
            <span v-if="row.thresholdValue">
              {{ row.thresholdValue }} {{ row.thresholdUnit || '' }}
            </span>
            <span v-else>-</span>
          </template>
        </el-table-column>
        <el-table-column prop="frequency" label="提醒频次" width="120">
          <template #default="{ row }">
            {{ getFrequencyLabel(row.frequency) }}
          </template>
        </el-table-column>
        <el-table-column label="接收人" min-width="150">
          <template #default="{ row }">
            <el-tag
              v-for="(recipient, index) in parseRecipients(row.recipients)"
              :key="index"
              size="small"
              style="margin-right: 4px"
            >
              {{ recipient }}
            </el-tag>
            <span v-if="!row.recipients || parseRecipients(row.recipients).length === 0">-</span>
          </template>
        </el-table-column>
        <el-table-column label="状态" width="100">
          <template #default="{ row }">
            <el-switch
              v-model="row.isEnabled"
              @change="handleToggleStatus(row)"
              :loading="row.switching"
            />
          </template>
        </el-table-column>
        <el-table-column label="操作" width="180" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" size="small" text @click="handleEdit(row)">
              编辑
            </el-button>
            <el-button type="danger" size="small" text @click="handleDelete(row.id)">
              删除
            </el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <!-- Create/Edit Dialog -->
    <el-dialog
      v-model="dialogVisible"
      :title="dialogTitle"
      width="600px"
      @close="handleDialogClose"
    >
      <el-form
        ref="formRef"
        :model="formData"
        :rules="formRules"
        label-width="100px"
      >
        <el-form-item label="规则名称" prop="ruleName">
          <el-input v-model="formData.ruleName" placeholder="请输入规则名称" />
        </el-form-item>

        <el-form-item label="规则类型" prop="ruleType">
          <el-select v-model="formData.ruleType" placeholder="请选择规则类型" style="width: 100%">
            <el-option label="节点到期提醒" value="deadline" />
            <el-option label="节点超期预警" value="overdue" />
            <el-option label="费用支付提醒" value="payment" />
            <el-option label="协作任务提醒" value="task" />
          </el-select>
        </el-form-item>

        <el-form-item label="触发条件" prop="triggerCondition">
          <el-input
            v-model="formData.triggerCondition"
            type="textarea"
            :rows="2"
            placeholder="请输入触发条件描述"
          />
        </el-form-item>

        <el-form-item label="提醒阈值">
          <el-row :gutter="10">
            <el-col :span="12">
              <el-input-number
                v-model="formData.thresholdValue"
                :min="0"
                placeholder="阈值"
                style="width: 100%"
              />
            </el-col>
            <el-col :span="12">
              <el-select v-model="formData.thresholdUnit" placeholder="单位" style="width: 100%">
                <el-option label="天" value="天" />
                <el-option label="小时" value="小时" />
                <el-option label="分钟" value="分钟" />
              </el-select>
            </el-col>
          </el-row>
        </el-form-item>

        <el-form-item label="提醒频次" prop="frequency">
          <el-select v-model="formData.frequency" placeholder="请选择提醒频次" style="width: 100%">
            <el-option label="仅一次" value="once" />
            <el-option label="每天" value="daily" />
            <el-option label="每周" value="weekly" />
            <el-option label="每月" value="monthly" />
          </el-select>
        </el-form-item>

        <el-form-item label="接收人">
          <el-select
            v-model="formData.recipients"
            multiple
            filterable
            allow-create
            placeholder="请输入或选择接收人"
            style="width: 100%"
          >
            <el-option label="案件负责人" value="案件负责人" />
            <el-option label="协作成员" value="协作成员" />
            <el-option label="系统管理员" value="系统管理员" />
          </el-select>
        </el-form-item>

        <el-form-item label="规则描述">
          <el-input
            v-model="formData.description"
            type="textarea"
            :rows="3"
            placeholder="请输入规则描述（可选）"
          />
        </el-form-item>

        <el-form-item label="启用状态">
          <el-switch v-model="formData.isEnabled" />
        </el-form-item>
      </el-form>

      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleSubmit" :loading="submitting">
          确定
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox, FormInstance, FormRules } from 'element-plus'
import { Plus, Refresh } from '@element-plus/icons-vue'
import { notificationRuleApi } from '@/api/notification'
import PageHeader from '@/components/common/PageHeader.vue'

interface NotificationRule {
  id?: number
  ruleName: string
  ruleType: string
  triggerCondition: string
  thresholdValue?: number
  thresholdUnit?: string
  frequency: string
  recipients?: string[]
  isEnabled: boolean
  description?: string
  switching?: boolean
}

// State
const loading = ref(false)
const submitting = ref(false)
const dialogVisible = ref(false)
const isEditing = ref(false)
const editingId = ref<number | null>(null)
const rules = ref<NotificationRule[]>([])
const formRef = ref<FormInstance>()

const formData = reactive<NotificationRule>({
  ruleName: '',
  ruleType: '',
  triggerCondition: '',
  thresholdValue: undefined,
  thresholdUnit: '天',
  frequency: 'once',
  recipients: [],
  isEnabled: true,
  description: ''
})

const formRules: FormRules = {
  ruleName: [
    { required: true, message: '请输入规则名称', trigger: 'blur' }
  ],
  ruleType: [
    { required: true, message: '请选择规则类型', trigger: 'change' }
  ],
  triggerCondition: [
    { required: true, message: '请输入触发条件', trigger: 'blur' }
  ],
  frequency: [
    { required: true, message: '请选择提醒频次', trigger: 'change' }
  ]
}

// Computed
const dialogTitle = computed(() => isEditing.value ? '编辑规则' : '新建规则')

// Methods
const fetchRules = async () => {
  loading.value = true
  try {
    const response = await notificationRuleApi.getRules()
    // axios 拦截器已经返回了 response.data
    const data = Array.isArray(response) ? response : (response.rules || response.data || [])
    
    // 转换字段名从下划线到驼峰
    rules.value = data.map((rule: any) => ({
      id: rule.id,
      ruleName: rule.rule_name,
      ruleType: rule.rule_type,
      triggerCondition: rule.trigger_condition,
      thresholdValue: rule.threshold_value,
      thresholdUnit: rule.threshold_unit,
      frequency: rule.frequency,
      recipients: rule.recipients,
      isEnabled: rule.is_enabled === 1 || rule.is_enabled === true,
      description: rule.description,
      createdAt: rule.created_at,
      updatedAt: rule.updated_at,
      switching: false
    }))
  } catch (error: any) {
    ElMessage.error(error.message || '获取规则列表失败')
  } finally {
    loading.value = false
  }
}

const handleCreate = () => {
  isEditing.value = false
  editingId.value = null
  resetForm()
  dialogVisible.value = true
}

const handleEdit = (row: NotificationRule) => {
  isEditing.value = true
  editingId.value = row.id!
  Object.assign(formData, {
    ruleName: row.ruleName,
    ruleType: row.ruleType,
    triggerCondition: row.triggerCondition,
    thresholdValue: row.thresholdValue,
    thresholdUnit: row.thresholdUnit || '天',
    frequency: row.frequency,
    recipients: parseRecipients(row.recipients),
    isEnabled: row.isEnabled,
    description: row.description || ''
  })
  dialogVisible.value = true
}

const handleSubmit = async () => {
  if (!formRef.value) return

  await formRef.value.validate(async (valid) => {
    if (!valid) return

    submitting.value = true
    try {
      const submitData = {
        ruleName: formData.ruleName,
        ruleType: formData.ruleType,
        triggerCondition: formData.triggerCondition,
        thresholdValue: formData.thresholdValue,
        thresholdUnit: formData.thresholdUnit,
        frequency: formData.frequency,
        recipients: formData.recipients?.join(','),
        isEnabled: formData.isEnabled,
        description: formData.description
      }

      if (isEditing.value && editingId.value) {
        await notificationRuleApi.updateRule(editingId.value, submitData)
        ElMessage.success('更新成功')
      } else {
        await notificationRuleApi.createRule(submitData)
        ElMessage.success('创建成功')
      }

      dialogVisible.value = false
      fetchRules()
    } catch (error: any) {
      ElMessage.error(error.message || '操作失败')
    } finally {
      submitting.value = false
    }
  })
}

const handleToggleStatus = async (row: NotificationRule) => {
  row.switching = true
  try {
    const response = await notificationRuleApi.toggleRule(row.id!, row.isEnabled)
    if (response.data.success) {
      ElMessage.success(row.isEnabled ? '已启用' : '已禁用')
    }
  } catch (error: any) {
    // Revert on error
    row.isEnabled = !row.isEnabled
    ElMessage.error(error.message || '操作失败')
  } finally {
    row.switching = false
  }
}

const handleDelete = async (id: number) => {
  try {
    await ElMessageBox.confirm('确定要删除这条规则吗？', '确认删除', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })

    await notificationRuleApi.deleteRule(id)
    ElMessage.success('删除成功')
    fetchRules()
  } catch (error: any) {
    if (error !== 'cancel') {
      ElMessage.error(error.message || '删除失败')
    }
  }
}

const handleRefresh = () => {
  fetchRules()
}

const handleDialogClose = () => {
  resetForm()
}

const resetForm = () => {
  formRef.value?.resetFields()
  Object.assign(formData, {
    ruleName: '',
    ruleType: '',
    triggerCondition: '',
    thresholdValue: undefined,
    thresholdUnit: '天',
    frequency: 'once',
    recipients: [],
    isEnabled: true,
    description: ''
  })
}

const getRuleTypeLabel = (type: string): string => {
  const labelMap: Record<string, string> = {
    deadline: '节点到期',
    overdue: '节点超期',
    payment: '费用支付',
    task: '协作任务'
  }
  return labelMap[type] || type
}

const getRuleTypeTag = (type: string): string => {
  const tagMap: Record<string, string> = {
    deadline: 'warning',
    overdue: 'danger',
    payment: 'primary',
    task: 'success'
  }
  return tagMap[type] || 'info'
}

const getFrequencyLabel = (frequency: string): string => {
  const labelMap: Record<string, string> = {
    once: '仅一次',
    daily: '每天',
    weekly: '每周',
    monthly: '每月'
  }
  return labelMap[frequency] || frequency
}

const parseRecipients = (recipients: any): string[] => {
  if (!recipients) return []
  if (Array.isArray(recipients)) return recipients
  if (typeof recipients === 'string') {
    return recipients.split(',').filter(r => r.trim())
  }
  return []
}

// Lifecycle
onMounted(() => {
  fetchRules()
})
</script>

<style scoped>
.notification-rules-container {
  padding: 20px;
}

.toolbar {
  display: flex;
  gap: 10px;
}
</style>
