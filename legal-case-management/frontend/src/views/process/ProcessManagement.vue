<template>
  <div class="process-management-container">
    <PageHeader title="流程管理" :show-back="true" />

    <el-card class="process-card">
      <template #header>
        <div class="card-header">
          <span>流程时间轴</span>
          <div class="header-actions">
            <el-button @click="handleApplyTemplate">引用模板</el-button>
            <el-button type="primary" @click="handleAddNode">添加节点</el-button>
          </div>
        </div>
      </template>

      <TableEmpty v-if="!loading && nodes.length === 0" description="暂无流程节点" />

      <el-timeline v-else>
        <el-timeline-item
          v-for="node in nodes"
          :key="node.id"
          :timestamp="formatTimestamp(node)"
          placement="top"
          :color="getNodeColor(node.status)"
          :hollow="node.status === '待处理'"
        >
          <el-card class="node-card" :class="`node-${node.status}`">
            <div class="node-header">
              <div class="node-title">
                <el-tag :type="getNodeTagType(node.status)" size="small">
                  {{ node.status }}
                </el-tag>
                <span class="node-name">{{ node.nodeName }}</span>
              </div>
              <div class="node-actions">
                <el-button link type="primary" @click="handleEditNode(node)">
                  编辑
                </el-button>
                <el-button link type="danger" @click="handleDeleteNode(node)">
                  删除
                </el-button>
              </div>
            </div>

            <div class="node-content">
              <div class="node-info">
                <div class="info-item" v-if="node.handler">
                  <span class="label">经办人：</span>
                  <span>{{ node.handler }}</span>
                </div>
                <div class="info-item" v-if="node.startTime">
                  <span class="label">开始时间：</span>
                  <span>{{ formatDate(node.startTime) }}</span>
                </div>
                <div class="info-item" v-if="node.deadline">
                  <span class="label">截止时间：</span>
                  <span :class="{ 'overdue': isOverdue(node) }">
                    {{ formatDate(node.deadline) }}
                    <el-tag v-if="isOverdue(node)" type="danger" size="small">超期</el-tag>
                  </span>
                </div>
                <div class="info-item" v-if="node.completionTime">
                  <span class="label">完成时间：</span>
                  <span>{{ formatDate(node.completionTime) }}</span>
                </div>
              </div>
              <div class="node-progress" v-if="node.progress">
                <span class="label">关键进展：</span>
                <p>{{ node.progress }}</p>
              </div>
            </div>
          </el-card>
        </el-timeline-item>
      </el-timeline>
    </el-card>

    <!-- Template Selection Dialog -->
    <el-dialog
      v-model="templateDialogVisible"
      title="选择流程模板"
      width="800px"
    >
      <!-- Search Bar -->
      <div class="template-search">
        <el-input
          v-model="templateSearchKeyword"
          placeholder="搜索模板名称或案件类型"
          clearable
          @input="handleTemplateSearch"
        >
          <template #prefix>
            <el-icon><Search /></el-icon>
          </template>
        </el-input>
        <el-select
          v-model="templateCaseTypeFilter"
          placeholder="案件类型"
          clearable
          @change="handleTemplateSearch"
          style="width: 150px; margin-left: 10px"
        >
          <el-option label="全部" value="" />
          <el-option label="民事" value="民事" />
          <el-option label="刑事" value="刑事" />
          <el-option label="行政" value="行政" />
          <el-option label="劳动仲裁" value="劳动仲裁" />
        </el-select>
      </div>

      <el-table
        :data="filteredTemplates"
        v-loading="loadingTemplates"
        @row-click="handleSelectTemplate"
        highlight-current-row
        style="cursor: pointer; margin-top: 16px"
      >
        <el-table-column prop="template_name" label="模板名称" min-width="200" />
        <el-table-column prop="case_type" label="案件类型" width="120" />
        <el-table-column prop="description" label="描述" min-width="200" show-overflow-tooltip />
        <el-table-column label="节点数" width="100">
          <template #default="{ row }">
            {{ row.node_count || 0 }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="100">
          <template #default="{ row }">
            <el-button type="primary" link @click.stop="handleApplyTemplateConfirm(row)">
              应用
            </el-button>
          </template>
        </el-table-column>
      </el-table>
      <template #empty>
        <TableEmpty description="暂无匹配的流程模板" />
      </template>
    </el-dialog>

    <!-- Node Edit Dialog -->
    <el-dialog
      v-model="dialogVisible"
      :title="dialogTitle"
      width="600px"
      @close="handleDialogClose"
    >
      <el-form
        ref="nodeFormRef"
        :model="nodeForm"
        :rules="nodeFormRules"
        label-width="100px"
      >
        <el-form-item label="节点名称" prop="nodeName">
          <el-input v-model="nodeForm.nodeName" placeholder="请输入节点名称" />
        </el-form-item>

        <el-form-item label="经办人" prop="handler">
          <el-input v-model="nodeForm.handler" placeholder="请输入经办人" />
        </el-form-item>

        <el-form-item label="开始时间" prop="startTime">
          <el-date-picker
            v-model="nodeForm.startTime"
            type="datetime"
            placeholder="选择开始时间"
            style="width: 100%"
          />
        </el-form-item>

        <el-form-item label="截止时间" prop="deadline">
          <el-date-picker
            v-model="nodeForm.deadline"
            type="datetime"
            placeholder="选择截止时间"
            style="width: 100%"
          />
        </el-form-item>

        <el-form-item label="完成时间" prop="completionTime">
          <el-date-picker
            v-model="nodeForm.completionTime"
            type="datetime"
            placeholder="选择完成时间"
            style="width: 100%"
          />
        </el-form-item>

        <el-form-item label="节点状态" prop="status">
          <el-select v-model="nodeForm.status" placeholder="请选择节点状态">
            <el-option label="待处理" value="待处理" />
            <el-option label="进行中" value="进行中" />
            <el-option label="已完成" value="已完成" />
            <el-option label="超期" value="超期" />
          </el-select>
        </el-form-item>

        <el-form-item label="关键进展" prop="progress">
          <el-input
            v-model="nodeForm.progress"
            type="textarea"
            :rows="4"
            placeholder="请输入关键进展"
          />
        </el-form-item>

        <el-form-item label="节点顺序" prop="nodeOrder">
          <el-input-number
            v-model="nodeForm.nodeOrder"
            :min="1"
            placeholder="节点顺序"
          />
        </el-form-item>
      </el-form>

      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleSubmitNode" :loading="submitting">
          确定
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRoute } from 'vue-router'
import { ElMessage, ElMessageBox, type FormInstance, type FormRules } from 'element-plus'
import { Search } from '@element-plus/icons-vue'
import { processNodeApi } from '@/api/processNode'
import { processTemplateApi } from '@/api/processTemplate'
import PageHeader from '@/components/common/PageHeader.vue'
import TableEmpty from '@/components/common/TableEmpty.vue'
import type { NodeStatus } from '@/types'

const route = useRoute()
const caseId = computed(() => Number(route.params.id))

interface ProcessNode {
  id: number
  caseId: number
  nodeName: string
  handler?: string
  startTime?: string
  deadline?: string
  completionTime?: string
  status: NodeStatus
  progress?: string
  nodeOrder?: number
}

const loading = ref(false)
const nodes = ref<ProcessNode[]>([])
const dialogVisible = ref(false)
const dialogTitle = ref('添加节点')
const submitting = ref(false)
const nodeFormRef = ref<FormInstance>()
const editingNodeId = ref<number | null>(null)

// Template related
const templateDialogVisible = ref(false)
const loadingTemplates = ref(false)
const templates = ref<any[]>([])
const templateSearchKeyword = ref('')
const templateCaseTypeFilter = ref('')

// Filtered templates based on search
const filteredTemplates = computed(() => {
  let result = templates.value

  // Filter by keyword
  if (templateSearchKeyword.value) {
    const keyword = templateSearchKeyword.value.toLowerCase()
    result = result.filter(template => 
      template.template_name?.toLowerCase().includes(keyword) ||
      template.case_type?.toLowerCase().includes(keyword) ||
      template.description?.toLowerCase().includes(keyword)
    )
  }

  // Filter by case type
  if (templateCaseTypeFilter.value) {
    result = result.filter(template => 
      template.case_type === templateCaseTypeFilter.value
    )
  }

  return result
})

const nodeForm = ref({
  nodeName: '',
  handler: '',
  startTime: '',
  deadline: '',
  completionTime: '',
  status: '待处理' as NodeStatus,
  progress: '',
  nodeOrder: 1
})

const nodeFormRules: FormRules = {
  nodeName: [{ required: true, message: '请输入节点名称', trigger: 'blur' }],
  nodeType: [{ required: true, message: '请选择节点类型', trigger: 'change' }],
  handler: [{ required: true, message: '请输入经办人', trigger: 'blur' }],
  status: [{ required: true, message: '请选择节点状态', trigger: 'change' }]
}

// Convert English status to Chinese
const convertStatusToChinese = (status: string): NodeStatus => {
  const statusMap: Record<string, NodeStatus> = {
    'pending': '待处理',
    'in_progress': '进行中',
    'completed': '已完成',
    'overdue': '超期'
  }
  return statusMap[status] || status as NodeStatus
}

// Convert Chinese status to English
const convertStatusToEnglish = (status: NodeStatus): string => {
  const statusMap: Record<NodeStatus, string> = {
    '待处理': 'pending',
    '进行中': 'in_progress',
    '已完成': 'completed',
    '超期': 'overdue'
  }
  return statusMap[status] || status
}

// Get node color based on status
const getNodeColor = (status: NodeStatus): string => {
  const colorMap: Record<NodeStatus, string> = {
    '待处理': '#909399',
    '进行中': '#E6A23C',
    '已完成': '#67C23A',
    '超期': '#F56C6C'
  }
  return colorMap[status] || '#909399'
}

// Get node tag type based on status
const getNodeTagType = (status: NodeStatus): 'info' | 'warning' | 'success' | 'danger' => {
  const typeMap: Record<NodeStatus, 'info' | 'warning' | 'success' | 'danger'> = {
    '待处理': 'info',
    '进行中': 'warning',
    '已完成': 'success',
    '超期': 'danger'
  }
  return typeMap[status] || 'info'
}

// Format timestamp for timeline
const formatTimestamp = (node: ProcessNode): string => {
  if (node.completionTime) {
    return formatDate(node.completionTime)
  }
  if (node.startTime) {
    return formatDate(node.startTime)
  }
  return '未设置时间'
}

// Format date
const formatDate = (dateStr: string): string => {
  if (!dateStr) return ''
  const date = new Date(dateStr)
  return date.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  })
}

// Check if node is overdue
const isOverdue = (node: ProcessNode): boolean => {
  if (!node.deadline || node.status === '已完成') return false
  return new Date(node.deadline) < new Date()
}

// Get active step index (first non-completed node)
const activeStepIndex = computed(() => {
  const index = nodes.value.findIndex(node => node.status !== '已完成')
  return index === -1 ? nodes.value.length : index
})

// Get step status for el-steps
const getStepStatus = (node: ProcessNode): 'wait' | 'process' | 'finish' | 'error' => {
  if (node.status === '已完成') return 'finish'
  if (node.status === '超期') return 'error'
  if (node.status === '进行中') return 'process'
  return 'wait'
}

// Get step icon
const getStepIcon = (node: ProcessNode): string | undefined => {
  if (node.status === '已完成') return 'CircleCheck'
  if (node.status === '超期') return 'CircleClose'
  if (node.status === '进行中') return 'Loading'
  return undefined
}

// Format step date
const formatStepDate = (node: ProcessNode): string => {
  if (node.completionTime) {
    return `完成: ${formatDate(node.completionTime)}`
  }
  if (node.deadline) {
    const isLate = isOverdue(node)
    return `${isLate ? '超期' : '截止'}: ${formatDate(node.deadline)}`
  }
  if (node.startTime) {
    return `开始: ${formatDate(node.startTime)}`
  }
  return ''
}

// Load nodes
const loadNodes = async () => {
  loading.value = true
  try {
    const response = await processNodeApi.getNodesByCaseId(caseId.value)
    const rawNodes = response.data?.nodes || response.data || []
    
    // Transform backend format to frontend format
    nodes.value = rawNodes.map((node: any) => ({
      id: node.id,
      caseId: node.case_id,
      nodeName: node.node_name,
      handler: node.handler,
      startTime: node.start_time,
      deadline: node.deadline,
      completionTime: node.completion_time,
      status: convertStatusToChinese(node.status),
      progress: node.progress,
      nodeOrder: node.node_order
    })).sort((a: ProcessNode, b: ProcessNode) => 
      (a.nodeOrder || 0) - (b.nodeOrder || 0)
    )
  } catch (error: any) {
    ElMessage.error(error.message || '加载流程节点失败')
  } finally {
    loading.value = false
  }
}

// Handle add node
const handleAddNode = () => {
  dialogTitle.value = '添加节点'
  editingNodeId.value = null
  resetForm()
  dialogVisible.value = true
}

// Handle edit node
const handleEditNode = (node: ProcessNode) => {
  dialogTitle.value = '编辑节点'
  editingNodeId.value = node.id
  nodeForm.value = {
    nodeName: node.nodeName,
    handler: node.handler || '',
    startTime: node.startTime || '',
    deadline: node.deadline || '',
    completionTime: node.completionTime || '',
    status: node.status,
    progress: node.progress || '',
    nodeOrder: node.nodeOrder || 1
  }
  dialogVisible.value = true
}

// Handle delete node
const handleDeleteNode = async (node: ProcessNode) => {
  try {
    await ElMessageBox.confirm('确定要删除该节点吗？', '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })
    
    await processNodeApi.deleteNode(node.id)
    ElMessage.success('删除成功')
    loadNodes()
  } catch (error: any) {
    if (error !== 'cancel') {
      ElMessage.error(error.message || '删除失败')
    }
  }
}

// Handle submit node
const handleSubmitNode = async () => {
  if (!nodeFormRef.value) return
  
  await nodeFormRef.value.validate(async (valid) => {
    if (!valid) return
    
    submitting.value = true
    try {
      const formData = {
        ...nodeForm.value,
        status: convertStatusToEnglish(nodeForm.value.status),
        startTime: nodeForm.value.startTime || undefined,
        deadline: nodeForm.value.deadline || undefined,
        completionTime: nodeForm.value.completionTime || undefined
      }
      
      if (editingNodeId.value) {
        await processNodeApi.updateNode(editingNodeId.value, formData)
        ElMessage.success('更新成功')
      } else {
        await processNodeApi.createNode(caseId.value, formData)
        ElMessage.success('添加成功')
      }
      
      dialogVisible.value = false
      loadNodes()
    } catch (error: any) {
      ElMessage.error(error.message || '操作失败')
    } finally {
      submitting.value = false
    }
  })
}

// Handle dialog close
const handleDialogClose = () => {
  resetForm()
}

// Reset form
const resetForm = () => {
  nodeForm.value = {
    nodeName: '',
    handler: '',
    startTime: '',
    deadline: '',
    completionTime: '',
    status: '待处理',
    progress: '',
    nodeOrder: nodes.value.length + 1
  }
  nodeFormRef.value?.clearValidate()
}

// Handle apply template
const handleApplyTemplate = async () => {
  templateDialogVisible.value = true
  templateSearchKeyword.value = ''
  templateCaseTypeFilter.value = ''
  await loadTemplates()
}

// Handle template search
const handleTemplateSearch = () => {
  // The filtering is handled by the computed property
}

// Load templates
const loadTemplates = async () => {
  loadingTemplates.value = true
  try {
    const response = await processTemplateApi.getTemplates()
    // 后端返回 { data: { templates: [...] } }
    if (response && response.data) {
      templates.value = response.data.templates || []
    } else {
      templates.value = []
    }
  } catch (error: any) {
    ElMessage.error(error.message || '加载模板失败')
    templates.value = []
  } finally {
    loadingTemplates.value = false
  }
}

// Handle select template
const handleSelectTemplate = (row: any) => {
  // Optional: highlight selected row
}

// Handle apply template confirm
const handleApplyTemplateConfirm = async (template: any) => {
  try {
    // 检查是否已有流程节点
    if (nodes.value.length > 0) {
      // 如果已有节点，提示用户确认是否替换
      await ElMessageBox.confirm(
        `当前案件已存在 ${nodes.value.length} 个流程节点。应用模板"${template.template_name}"将删除所有现有节点并替换为模板节点。此操作不可恢复，是否继续？`,
        '警告：将替换现有节点',
        {
          confirmButtonText: '确定替换',
          cancelButtonText: '取消',
          type: 'warning',
          distinguishCancelAndClose: true
        }
      )
      
      // 用户确认后，先删除所有现有节点
      for (const node of nodes.value) {
        try {
          await processNodeApi.deleteNode(node.id)
        } catch (error) {
          console.error('删除节点失败:', error)
        }
      }
    } else {
      // 如果没有节点，只需要简单确认
      await ElMessageBox.confirm(
        `确定要应用模板"${template.template_name}"吗？这将根据模板创建流程节点。`,
        '确认应用',
        {
          confirmButtonText: '确定',
          cancelButtonText: '取消',
          type: 'info'
        }
      )
    }
    
    // Apply template
    await processTemplateApi.applyTemplate(caseId.value, template.id)
    ElMessage.success('模板应用成功')
    templateDialogVisible.value = false
    loadNodes()
  } catch (error: any) {
    if (error !== 'cancel') {
      ElMessage.error(error.message || '应用模板失败')
    }
  }
}

onMounted(() => {
  loadNodes()
})
</script>

<style scoped>
.process-management-container {
  padding: 20px;
}

.process-steps-card {
  margin-bottom: 20px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}

.process-steps-card :deep(.el-card__body) {
  padding: 30px 20px;
}

.steps-header {
  margin-bottom: 20px;
  text-align: center;
}

.steps-header h3 {
  margin: 0;
  font-size: 20px;
  font-weight: 600;
  color: white;
}

.process-steps-card :deep(.el-steps) {
  background: transparent;
}

.process-steps-card :deep(.el-step__title) {
  color: white;
  font-weight: 500;
}

.process-steps-card :deep(.el-step__description) {
  color: rgba(255, 255, 255, 0.8);
}

.process-steps-card :deep(.el-step__head.is-finish .el-step__line) {
  background-color: rgba(255, 255, 255, 0.6);
}

.process-steps-card :deep(.el-step__head.is-process .el-step__icon) {
  color: #409eff;
  border-color: #409eff;
  background: white;
}

.process-steps-card :deep(.el-step__head.is-finish .el-step__icon) {
  color: #67c23a;
  border-color: #67c23a;
  background: white;
}

.process-steps-card :deep(.el-step__head.is-error .el-step__icon) {
  color: #f56c6c;
  border-color: #f56c6c;
  background: white;
}

.process-steps-card :deep(.el-step__head.is-wait .el-step__icon) {
  color: rgba(255, 255, 255, 0.6);
  border-color: rgba(255, 255, 255, 0.6);
}

.step-desc {
  font-size: 12px;
  line-height: 1.5;
}

.step-date {
  margin-top: 4px;
  font-size: 11px;
  opacity: 0.9;
}

.process-card {
  margin-top: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.header-actions {
  display: flex;
  gap: 10px;
}

.template-search {
  display: flex;
  align-items: center;
  margin-bottom: 16px;
}

.node-card {
  margin-bottom: 10px;
}

.node-card.node-超期 {
  border-left: 3px solid #f56c6c;
}

.node-card.node-进行中 {
  border-left: 3px solid #e6a23c;
}

.node-card.node-已完成 {
  border-left: 3px solid #67c23a;
}

.node-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.node-title {
  display: flex;
  align-items: center;
  gap: 10px;
}

.node-name {
  font-size: 16px;
  font-weight: 500;
}

.node-actions {
  display: flex;
  gap: 5px;
}

.node-content {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.node-info {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 8px;
}

.info-item {
  display: flex;
  align-items: center;
  font-size: 14px;
}

.info-item .label {
  color: #909399;
  margin-right: 8px;
}

.info-item .overdue {
  color: #f56c6c;
  display: flex;
  align-items: center;
  gap: 5px;
}

.node-progress {
  padding-top: 8px;
  border-top: 1px solid #ebeef5;
}

.node-progress .label {
  color: #909399;
  font-size: 14px;
  margin-bottom: 5px;
  display: block;
}

.node-progress p {
  margin: 0;
  font-size: 14px;
  line-height: 1.6;
  color: #606266;
}
</style>
