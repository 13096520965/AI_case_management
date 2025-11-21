<template>
  <div class="process-management-container">
    <PageHeader title="流程管理" :show-back="true" />
    
    <el-card class="process-card">
      <template #header>
        <div class="card-header">
          <span>流程时间轴</span>
          <!-- <el-button type="primary" @click="handleAddNode">添加节点</el-button> -->
        </div>
      </template>

      <el-empty v-if="!loading && nodes.length === 0" description="暂无流程节点" />

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
                <div class="info-item">
                  <span class="label">节点类型：</span>
                  <span>{{ node.nodeType }}</span>
                </div>
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

        <el-form-item label="节点类型" prop="nodeType">
          <el-select v-model="nodeForm.nodeType" placeholder="请选择节点类型">
            <el-option label="立案" value="立案" />
            <el-option label="送达" value="送达" />
            <el-option label="举证" value="举证" />
            <el-option label="开庭" value="开庭" />
            <el-option label="调解" value="调解" />
            <el-option label="判决" value="判决" />
            <el-option label="执行" value="执行" />
            <el-option label="其他" value="其他" />
          </el-select>
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
import { processNodeApi } from '@/api/processNode'
import PageHeader from '@/components/common/PageHeader.vue'
import type { NodeStatus } from '@/types'

const route = useRoute()
const caseId = computed(() => Number(route.params.id))

interface ProcessNode {
  id: number
  caseId: number
  nodeType: string
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

const nodeForm = ref({
  nodeName: '',
  nodeType: '',
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
  status: [{ required: true, message: '请选择节点状态', trigger: 'change' }]
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
      nodeType: node.node_type,
      nodeName: node.node_name,
      handler: node.handler,
      startTime: node.start_time,
      deadline: node.deadline,
      completionTime: node.completion_time,
      status: node.status,
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
    nodeType: node.nodeType,
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
    nodeType: '',
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

onMounted(() => {
  loadNodes()
})
</script>

<style scoped>
.process-management-container {
  padding: 20px;
}

.process-card {
  margin-top: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
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
