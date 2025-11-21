<template>
  <div class="collaboration-tasks-container">
    <PageHeader title="协作任务管理">
      <template #extra>
        <el-button type="primary" @click="showAddDialog">
          <el-icon><Plus /></el-icon>
          创建任务
        </el-button>
      </template>
    </PageHeader>
    
    <el-card>

      <!-- 筛选器 -->
      <div class="filter-bar">
        <el-select
          v-model="filterStatus"
          placeholder="任务状态"
          clearable
          style="width: 150px; margin-right: 10px"
          @change="fetchTasks"
        >
          <el-option label="待处理" value="pending" />
          <el-option label="进行中" value="in_progress" />
          <el-option label="已完成" value="completed" />
          <el-option label="已取消" value="cancelled" />
        </el-select>

        <el-select
          v-model="filterPriority"
          placeholder="优先级"
          clearable
          style="width: 150px; margin-right: 10px"
          @change="fetchTasks"
        >
          <el-option label="高" value="high" />
          <el-option label="中" value="medium" />
          <el-option label="低" value="low" />
        </el-select>
      </div>

      <!-- 任务列表 -->
      <el-table
        v-loading="loading"
        :data="filteredTasks"
        style="width: 100%; margin-top: 20px"
      >
        <el-table-column prop="task_title" label="任务标题" min-width="200" />
        <el-table-column prop="task_description" label="任务描述" min-width="250" show-overflow-tooltip />
        <el-table-column prop="assigned_to_name" label="负责人" width="120">
          <template #default="{ row }">
            {{ row.assigned_to_name || '未分配' }}
          </template>
        </el-table-column>
        <el-table-column prop="priority" label="优先级" width="100">
          <template #default="{ row }">
            <el-tag :type="getPriorityType(row.priority)" size="small">
              {{ getPriorityLabel(row.priority) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="status" label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="getStatusType(row.status)" size="small">
              {{ getStatusLabel(row.status) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="due_date" label="截止日期" width="120">
          <template #default="{ row }">
            <span :class="{ 'overdue': isOverdue(row) }">
              {{ formatDate(row.due_date) }}
            </span>
          </template>
        </el-table-column>
        <el-table-column prop="created_at" label="创建时间" width="180">
          <template #default="{ row }">
            {{ formatDateTime(row.created_at) }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="200" fixed="right">
          <template #default="{ row }">
            <el-button link type="primary" size="small" @click="viewTask(row)">
              查看
            </el-button>
            <el-button link type="primary" size="small" @click="editTask(row)">
              编辑
            </el-button>
            <el-popconfirm
              title="确定要删除该任务吗？"
              @confirm="deleteTask(row.id)"
            >
              <template #reference>
                <el-button link type="danger" size="small">
                  删除
                </el-button>
              </template>
            </el-popconfirm>
          </template>
        </el-table-column>
      </el-table>

      <!-- 空状态 -->
      <el-empty v-if="!loading && tasks.length === 0" description="暂无协作任务" />
    </el-card>

    <!-- 创建/编辑任务对话框 -->
    <el-dialog
      v-model="dialogVisible"
      :title="isEdit ? '编辑任务' : '创建任务'"
      width="600px"
    >
      <el-form
        ref="formRef"
        :model="form"
        :rules="rules"
        label-width="100px"
      >
        <el-form-item label="任务标题" prop="task_title">
          <el-input v-model="form.task_title" placeholder="请输入任务标题" />
        </el-form-item>

        <el-form-item label="任务描述" prop="task_description">
          <el-input
            v-model="form.task_description"
            type="textarea"
            :rows="4"
            placeholder="请输入任务描述"
          />
        </el-form-item>

        <el-form-item label="负责人" prop="assigned_to">
          <el-select
            v-model="form.assigned_to"
            placeholder="请选择负责人"
            filterable
            clearable
            style="width: 100%"
          >
            <el-option
              v-for="member in members"
              :key="member.user_id"
              :label="`${member.real_name} (${member.role})`"
              :value="member.user_id"
            />
          </el-select>
        </el-form-item>

        <el-form-item label="优先级" prop="priority">
          <el-select v-model="form.priority" placeholder="请选择优先级" style="width: 100%">
            <el-option label="高" value="high" />
            <el-option label="中" value="medium" />
            <el-option label="低" value="low" />
          </el-select>
        </el-form-item>

        <el-form-item label="状态" prop="status" v-if="isEdit">
          <el-select v-model="form.status" placeholder="请选择状态" style="width: 100%">
            <el-option label="待处理" value="pending" />
            <el-option label="进行中" value="in_progress" />
            <el-option label="已完成" value="completed" />
            <el-option label="已取消" value="cancelled" />
          </el-select>
        </el-form-item>

        <el-form-item label="截止日期" prop="due_date">
          <el-date-picker
            v-model="form.due_date"
            type="date"
            placeholder="选择截止日期"
            style="width: 100%"
            format="YYYY-MM-DD"
            value-format="YYYY-MM-DD"
          />
        </el-form-item>
      </el-form>

      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="submitForm" :loading="submitting">
          确定
        </el-button>
      </template>
    </el-dialog>

    <!-- 查看任务详情对话框 -->
    <el-dialog
      v-model="viewDialogVisible"
      title="任务详情"
      width="600px"
    >
      <el-descriptions :column="1" border v-if="currentTask">
        <el-descriptions-item label="任务标题">
          {{ currentTask.task_title }}
        </el-descriptions-item>
        <el-descriptions-item label="任务描述">
          {{ currentTask.task_description || '无' }}
        </el-descriptions-item>
        <el-descriptions-item label="负责人">
          {{ currentTask.assigned_to_name || '未分配' }}
        </el-descriptions-item>
        <el-descriptions-item label="分配人">
          {{ currentTask.assigned_by_name || '-' }}
        </el-descriptions-item>
        <el-descriptions-item label="优先级">
          <el-tag :type="getPriorityType(currentTask.priority)" size="small">
            {{ getPriorityLabel(currentTask.priority) }}
          </el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="状态">
          <el-tag :type="getStatusType(currentTask.status)" size="small">
            {{ getStatusLabel(currentTask.status) }}
          </el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="截止日期">
          {{ formatDate(currentTask.due_date) }}
        </el-descriptions-item>
        <el-descriptions-item label="创建时间">
          {{ formatDateTime(currentTask.created_at) }}
        </el-descriptions-item>
        <el-descriptions-item label="完成时间" v-if="currentTask.completed_at">
          {{ formatDateTime(currentTask.completed_at) }}
        </el-descriptions-item>
      </el-descriptions>

      <template #footer>
        <el-button @click="viewDialogVisible = false">关闭</el-button>
        <el-button type="primary" @click="editTaskFromView">编辑</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, reactive, computed } from 'vue'
import { useRoute } from 'vue-router'
import { ElMessage, type FormInstance, type FormRules } from 'element-plus'
import { Plus } from '@element-plus/icons-vue'
import { collaborationApi } from '@/api/collaboration'
import PageHeader from '@/components/common/PageHeader.vue'

const route = useRoute()
const caseId = ref(Number(route.params.id))

// 数据
const loading = ref(false)
const tasks = ref<any[]>([])
const members = ref<any[]>([])
const filterStatus = ref('')
const filterPriority = ref('')

// 对话框
const dialogVisible = ref(false)
const viewDialogVisible = ref(false)
const isEdit = ref(false)
const submitting = ref(false)
const formRef = ref<FormInstance>()
const currentTask = ref<any>(null)

// 表单
const form = reactive({
  id: 0,
  task_title: '',
  task_description: '',
  assigned_to: null as number | null,
  priority: 'medium',
  status: 'pending',
  due_date: ''
})

const rules: FormRules = {
  task_title: [{ required: true, message: '请输入任务标题', trigger: 'blur' }],
  priority: [{ required: true, message: '请选择优先级', trigger: 'change' }]
}

// 过滤后的任务列表
const filteredTasks = computed(() => {
  let result = tasks.value

  if (filterStatus.value) {
    result = result.filter(task => task.status === filterStatus.value)
  }

  if (filterPriority.value) {
    result = result.filter(task => task.priority === filterPriority.value)
  }

  return result
})

// 获取任务列表
const fetchTasks = async () => {
  loading.value = true
  try {
    const res = await collaborationApi.getTasksByCaseId(caseId.value)
    tasks.value = res.data.data || []
  } catch (error: any) {
    ElMessage.error(error.response?.data?.error || '获取任务列表失败')
  } finally {
    loading.value = false
  }
}

// 获取成员列表
const fetchMembers = async () => {
  try {
    const res = await collaborationApi.getMembersByCaseId(caseId.value)
    members.value = res.data.data || []
  } catch (error: any) {
    console.error('获取成员列表失败:', error)
  }
}

// 显示添加对话框
const showAddDialog = () => {
  isEdit.value = false
  resetForm()
  dialogVisible.value = true
  fetchMembers()
}

// 查看任务
const viewTask = (task: any) => {
  currentTask.value = task
  viewDialogVisible.value = true
}

// 从查看对话框编辑
const editTaskFromView = () => {
  viewDialogVisible.value = false
  editTask(currentTask.value)
}

// 编辑任务
const editTask = (task: any) => {
  isEdit.value = true
  form.id = task.id
  form.task_title = task.task_title
  form.task_description = task.task_description || ''
  form.assigned_to = task.assigned_to
  form.priority = task.priority
  form.status = task.status
  form.due_date = task.due_date || ''
  dialogVisible.value = true
  fetchMembers()
}

// 提交表单
const submitForm = async () => {
  if (!formRef.value) return

  await formRef.value.validate(async (valid) => {
    if (!valid) return

    submitting.value = true
    try {
      const data: any = {
        task_title: form.task_title,
        task_description: form.task_description,
        assigned_to: form.assigned_to,
        priority: form.priority,
        due_date: form.due_date || null
      }

      if (isEdit.value) {
        data.status = form.status
        await collaborationApi.updateTask(form.id, data)
        ElMessage.success('任务更新成功')
      } else {
        data.case_id = caseId.value
        await collaborationApi.createTask(data)
        ElMessage.success('任务创建成功')
      }

      dialogVisible.value = false
      fetchTasks()
    } catch (error: any) {
      ElMessage.error(error.response?.data?.error || '操作失败')
    } finally {
      submitting.value = false
    }
  })
}

// 删除任务
const deleteTask = async (id: number) => {
  try {
    await collaborationApi.deleteTask(id)
    ElMessage.success('任务删除成功')
    fetchTasks()
  } catch (error: any) {
    ElMessage.error(error.response?.data?.error || '删除任务失败')
  }
}

// 重置表单
const resetForm = () => {
  form.id = 0
  form.task_title = ''
  form.task_description = ''
  form.assigned_to = null
  form.priority = 'medium'
  form.status = 'pending'
  form.due_date = ''
  formRef.value?.clearValidate()
}

// 获取优先级类型
const getPriorityType = (priority: string) => {
  const typeMap: Record<string, any> = {
    high: 'danger',
    medium: 'warning',
    low: 'success'
  }
  return typeMap[priority] || ''
}

// 获取优先级标签
const getPriorityLabel = (priority: string) => {
  const labelMap: Record<string, string> = {
    high: '高',
    medium: '中',
    low: '低'
  }
  return labelMap[priority] || priority
}

// 获取状态类型
const getStatusType = (status: string) => {
  const typeMap: Record<string, any> = {
    pending: 'info',
    in_progress: 'warning',
    completed: 'success',
    cancelled: 'danger'
  }
  return typeMap[status] || ''
}

// 获取状态标签
const getStatusLabel = (status: string) => {
  const labelMap: Record<string, string> = {
    pending: '待处理',
    in_progress: '进行中',
    completed: '已完成',
    cancelled: '已取消'
  }
  return labelMap[status] || status
}

// 判断是否超期
const isOverdue = (task: any) => {
  if (!task.due_date || task.status === 'completed' || task.status === 'cancelled') {
    return false
  }
  return new Date(task.due_date) < new Date()
}

// 格式化日期
const formatDate = (date: string) => {
  if (!date) return '-'
  return new Date(date).toLocaleDateString('zh-CN')
}

// 格式化日期时间
const formatDateTime = (date: string) => {
  if (!date) return '-'
  return new Date(date).toLocaleString('zh-CN')
}

onMounted(() => {
  fetchTasks()
})
</script>

<style scoped>
.collaboration-tasks-container {
  padding: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.title {
  font-size: 18px;
  font-weight: 600;
}

.filter-bar {
  display: flex;
  align-items: center;
}

.overdue {
  color: #f56c6c;
  font-weight: 600;
}
</style>
