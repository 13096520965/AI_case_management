<template>
  <div class="notification-alerts-container">
    <PageHeader title="超期预警" />

    <el-row :gutter="20" class="stats-row">
      <el-col :span="8">
        <el-card class="stat-card overdue">
          <div class="stat-content">
            <div class="stat-icon">
              <el-icon :size="40"><Warning /></el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-value">{{ overdueCount }}</div>
              <div class="stat-label">超期节点</div>
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="8">
        <el-card class="stat-card warning">
          <div class="stat-content">
            <div class="stat-icon">
              <el-icon :size="40"><Clock /></el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-value">{{ upcomingCount }}</div>
              <div class="stat-label">即将到期</div>
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="8">
        <el-card class="stat-card info">
          <div class="stat-content">
            <div class="stat-icon">
              <el-icon :size="40"><Document /></el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-value">{{ totalAlertsCount }}</div>
              <div class="stat-label">总预警数</div>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <el-card class="alerts-card">
      <div class="toolbar">
        <el-radio-group v-model="alertType" @change="handleAlertTypeChange">
          <el-radio-button label="all">全部预警</el-radio-button>
          <el-radio-button label="overdue">超期节点</el-radio-button>
          <el-radio-button label="upcoming">即将到期</el-radio-button>
        </el-radio-group>

        <el-button @click="handleRefresh" :loading="loading">
          <el-icon><Refresh /></el-icon>
          刷新
        </el-button>
      </div>

      <div 
        class="table-container" 
        ref="tableContainerRef"
        @scroll="handleScroll"
      >
        <el-table
          :data="displayedAlerts"
          v-loading="loading"
          stripe
          style="width: 100%"
          :row-class-name="getRowClassName"
        >
        <el-table-column label="状态" width="80">
          <template #default="{ row }">
            <el-tag :type="getStatusTagType(row)" size="small">
              {{ getStatusLabel(row) }}
            </el-tag>
          </template>
        </el-table-column>

        <el-table-column prop="caseName" label="案件名称" min-width="150">
          <template #default="{ row }">
            <el-link type="primary" @click="handleViewCase(row.caseId)">
              {{ row.caseName || `案件 #${row.caseId}` }}
            </el-link>
          </template>
        </el-table-column>

        <el-table-column prop="nodeName" label="节点名称" min-width="120" />

        <el-table-column prop="handler" label="经办人" width="100" />

        <el-table-column prop="deadline" label="截止时间" width="180">
          <template #default="{ row }">
            {{ formatDateTime(row.deadline) }}
          </template>
        </el-table-column>

        <el-table-column label="超期时长" width="120">
          <template #default="{ row }">
            <span :class="getOverdueClass(row)">
              {{ getOverdueDuration(row) }}
            </span>
          </template>
        </el-table-column>

        <el-table-column label="处理建议" min-width="200">
          <template #default="{ row }">
            <div class="suggestion">
              <el-icon><InfoFilled /></el-icon>
              <span>{{ getSuggestion(row) }}</span>
            </div>
          </template>
        </el-table-column>

        <el-table-column label="操作" width="180" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" size="small" text @click="handleProcess(row)">
              处理
            </el-button>
            <el-button type="warning" size="small" text @click="handleRemind(row)">
              提醒
            </el-button>
            <el-button size="small" text @click="handleViewDetails(row)">
              详情
            </el-button>
          </template>
        </el-table-column>
        </el-table>

        <div v-if="hasMore && !loading" class="load-more-hint">
          <span>下滑加载更多...</span>
        </div>

        <div v-if="loadingMore" class="loading-more">
          <el-icon class="is-loading"><Loading /></el-icon>
          <span>加载中...</span>
        </div>

        <div v-if="!hasMore && displayedAlerts.length > 0" class="no-more-hint">
          已加载全部数据
        </div>
      </div>
    </el-card>

    <!-- Process Dialog -->
    <el-dialog
      v-model="processDialogVisible"
      title="处理节点"
      width="500px"
    >
      <el-form :model="processForm" label-width="100px">
        <el-form-item label="节点名称">
          <el-input :value="selectedNode?.nodeName" disabled />
        </el-form-item>
        <el-form-item label="处理状态">
          <el-select v-model="processForm.status" placeholder="请选择状态" style="width: 100%">
            <el-option label="进行中" value="进行中" />
            <el-option label="已完成" value="已完成" />
          </el-select>
        </el-form-item>
        <el-form-item label="完成时间" v-if="processForm.status === '已完成'">
          <el-date-picker
            v-model="processForm.completionTime"
            type="datetime"
            placeholder="选择完成时间"
            style="width: 100%"
          />
        </el-form-item>
        <el-form-item label="处理说明">
          <el-input
            v-model="processForm.progress"
            type="textarea"
            :rows="4"
            placeholder="请输入处理说明"
          />
        </el-form-item>
      </el-form>

      <template #footer>
        <el-button @click="processDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleSubmitProcess" :loading="submitting">
          确定
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, reactive, nextTick } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Warning, Clock, Document, Refresh, InfoFilled, Loading } from '@element-plus/icons-vue'
import { useRouter } from 'vue-router'
import PageHeader from '@/components/common/PageHeader.vue'
import { formatDateTime } from '@/utils/format'
import request from '@/api/request'

interface ProcessNode {
  id: number
  caseId: number
  caseName?: string
  nodeName: string
  handler: string
  deadline: string
  completionTime?: string
  status: string
  progress?: string
}

const router = useRouter()

// State
const loading = ref(false)
const loadingMore = ref(false)
const submitting = ref(false)
const alertType = ref('all')
const pageSize = ref(20)
const currentLoadedCount = ref(0)
const alerts = ref<ProcessNode[]>([])
const allFilteredAlerts = ref<ProcessNode[]>([])
const processDialogVisible = ref(false)
const selectedNode = ref<ProcessNode | null>(null)
const tableContainerRef = ref<HTMLElement | null>(null)

const processForm = reactive({
  status: '进行中',
  completionTime: null as Date | null,
  progress: ''
})

// Computed
const overdueAlerts = computed(() => {
  return alerts.value.filter(alert => {
    const deadline = new Date(alert.deadline)
    const now = new Date()
    return deadline < now && alert.status !== '已完成'
  })
})

const upcomingAlerts = computed(() => {
  return alerts.value.filter(alert => {
    const deadline = new Date(alert.deadline)
    const now = new Date()
    const threeDaysLater = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000)
    return deadline >= now && deadline <= threeDaysLater && alert.status !== '已完成'
  })
})

const overdueCount = computed(() => overdueAlerts.value.length)
const upcomingCount = computed(() => upcomingAlerts.value.length)
const totalAlertsCount = computed(() => overdueCount.value + upcomingCount.value)

const displayedAlerts = computed(() => {
  return allFilteredAlerts.value.slice(0, currentLoadedCount.value)
})

const hasMore = computed(() => {
  return currentLoadedCount.value < allFilteredAlerts.value.length
})

const updateFilteredAlerts = () => {
  let filtered = alerts.value

  if (alertType.value === 'overdue') {
    filtered = overdueAlerts.value
  } else if (alertType.value === 'upcoming') {
    filtered = upcomingAlerts.value
  } else {
    filtered = [...overdueAlerts.value, ...upcomingAlerts.value]
  }

  allFilteredAlerts.value = filtered
  currentLoadedCount.value = Math.min(pageSize.value, filtered.length)
}

// Methods
const fetchAlerts = async () => {
  loading.value = true
  try {
    // Fetch overdue nodes - request interceptor already returns response.data
    const overdueResponse: any = await request.get('/nodes/overdue')
    const overdueNodes = overdueResponse?.data || []

    // Fetch upcoming nodes
    const upcomingResponse: any = await request.get('/nodes/upcoming')
    const upcomingNodes = upcomingResponse?.data?.nodes || upcomingResponse?.data || []

    // Combine nodes
    const allNodes = [...overdueNodes, ...upcomingNodes]
    
    // Transform nodes with case names
    const nodesWithCaseNames = allNodes.map((node: any) => ({
      id: node.id,
      caseId: node.case_id,
      caseName: node.case_name || node.caseName || `案件 #${node.case_id}`,
      nodeName: node.node_name || node.nodeName,
      handler: node.handler,
      deadline: node.deadline,
      completionTime: node.completion_time || node.completionTime,
      status: node.status,
      progress: node.progress
    }))

    alerts.value = nodesWithCaseNames
    updateFilteredAlerts()
    
    // 滚动到顶部
    await nextTick()
    if (tableContainerRef.value) {
      tableContainerRef.value.scrollTop = 0
    }
  } catch (error: any) {
    console.error('Error fetching alerts:', error)
    // Don't show error message here as the interceptor already handles it
  } finally {
    loading.value = false
  }
}

const handleAlertTypeChange = () => {
  updateFilteredAlerts()
  // 滚动到顶部
  nextTick(() => {
    if (tableContainerRef.value) {
      tableContainerRef.value.scrollTop = 0
    }
  })
}

const handleRefresh = () => {
  fetchAlerts()
}

const loadMore = async () => {
  if (loadingMore.value || !hasMore.value) return

  loadingMore.value = true
  
  // 模拟加载延迟，提供更好的用户体验
  await new Promise(resolve => setTimeout(resolve, 300))
  
  const nextCount = Math.min(
    currentLoadedCount.value + pageSize.value,
    allFilteredAlerts.value.length
  )
  
  currentLoadedCount.value = nextCount
  loadingMore.value = false
}

const handleScroll = (event: Event) => {
  const target = event.target as HTMLElement
  const scrollTop = target.scrollTop
  const scrollHeight = target.scrollHeight
  const clientHeight = target.clientHeight
  
  // 当滚动到距离底部100px时触发加载
  if (scrollHeight - scrollTop - clientHeight < 100) {
    loadMore()
  }
}

const handleViewCase = (caseId: number) => {
  router.push(`/cases/${caseId}`)
}

const handleProcess = (row: ProcessNode) => {
  selectedNode.value = row
  processForm.status = row.status === '已完成' ? '已完成' : '进行中'
  processForm.completionTime = row.completionTime ? new Date(row.completionTime) : null
  processForm.progress = row.progress || ''
  processDialogVisible.value = true
}

const handleSubmitProcess = async () => {
  if (!selectedNode.value) return

  submitting.value = true
  try {
    const updateData: any = {
      status: processForm.status,
      progress: processForm.progress
    }

    if (processForm.status === '已完成' && processForm.completionTime) {
      updateData.completion_time = processForm.completionTime.toISOString()
    }

    await request.put(`/nodes/${selectedNode.value.id}`, updateData)
    ElMessage.success('处理成功')
    processDialogVisible.value = false
    fetchAlerts()
  } catch (error: any) {
    ElMessage.error(error.message || '处理失败')
  } finally {
    submitting.value = false
  }
}

const handleRemind = async (row: ProcessNode) => {
  try {
    await ElMessageBox.confirm(`确定要发送提醒给 ${row.handler} 吗？`, '发送提醒', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })

    // Create notification
    await request.post('/notifications', {
      related_id: row.id,
      related_type: 'process_node',
      task_type: isOverdue(row) ? 'overdue' : 'deadline',
      scheduled_time: new Date().toISOString(),
      content: `节点"${row.nodeName}"${isOverdue(row) ? '已超期' : '即将到期'}，请及时处理`
    })

    ElMessage.success('提醒已发送')
  } catch (error: any) {
    if (error !== 'cancel') {
      ElMessage.error(error.message || '发送失败')
    }
  }
}

const handleViewDetails = (row: ProcessNode) => {
  router.push(`/cases/${row.caseId}`)
}

const isOverdue = (node: ProcessNode): boolean => {
  const deadline = new Date(node.deadline)
  const now = new Date()
  return deadline < now && node.status !== '已完成'
}

const getOverdueDuration = (node: ProcessNode): string => {
  const deadline = new Date(node.deadline)
  const now = new Date()
  const diffMs = now.getTime() - deadline.getTime()
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

  if (diffDays > 0) {
    return `超期 ${diffDays} 天`
  } else {
    const daysUntil = Math.ceil(-diffDays)
    if (daysUntil === 0) {
      return '今天到期'
    } else if (daysUntil === 1) {
      return '明天到期'
    } else {
      return `${daysUntil} 天后到期`
    }
  }
}

const getOverdueClass = (node: ProcessNode): string => {
  if (isOverdue(node)) {
    return 'overdue-text'
  }
  const deadline = new Date(node.deadline)
  const now = new Date()
  const diffDays = Math.ceil((deadline.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
  
  if (diffDays <= 1) {
    return 'urgent-text'
  } else if (diffDays <= 3) {
    return 'warning-text'
  }
  return 'normal-text'
}

const getStatusLabel = (node: ProcessNode): string => {
  if (isOverdue(node)) {
    return '超期'
  }
  return '即将到期'
}

const getStatusTagType = (node: ProcessNode): string => {
  if (isOverdue(node)) {
    return 'danger'
  }
  return 'warning'
}

const getRowClassName = ({ row }: { row: ProcessNode }): string => {
  if (isOverdue(row)) {
    return 'overdue-row'
  }
  return 'upcoming-row'
}

const getSuggestion = (node: ProcessNode): string => {
  if (isOverdue(node)) {
    const deadline = new Date(node.deadline)
    const now = new Date()
    const diffDays = Math.floor((now.getTime() - deadline.getTime()) / (1000 * 60 * 60 * 24))
    
    if (diffDays > 7) {
      return '严重超期，建议立即联系经办人并上报主管'
    } else if (diffDays > 3) {
      return '已超期多日，建议尽快联系经办人处理'
    } else {
      return '已超期，建议及时跟进处理进度'
    }
  } else {
    const deadline = new Date(node.deadline)
    const now = new Date()
    const diffDays = Math.ceil((deadline.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
    
    if (diffDays <= 1) {
      return '即将到期，建议立即处理'
    } else {
      return '注意截止时间，提前做好准备'
    }
  }
}

// Lifecycle
onMounted(() => {
  fetchAlerts()
})
</script>

<style scoped>
.notification-alerts-container {
  padding: 20px;
  min-width: 1100px;
}

.stats-row {
  margin-bottom: 20px;
  min-width: 1000px;
}

.stat-card {
  cursor: pointer;
  transition: transform 0.3s;
  min-width: 280px;
}

.stat-card:hover {
  transform: translateY(-4px);
}

.stat-card.overdue {
  border-left: 4px solid #f56c6c;
}

.stat-card.warning {
  border-left: 4px solid #e6a23c;
}

.stat-card.info {
  border-left: 4px solid #409eff;
}

.stat-content {
  display: flex;
  align-items: center;
  gap: 20px;
}

.stat-icon {
  color: #909399;
}

.stat-card.overdue .stat-icon {
  color: #f56c6c;
}

.stat-card.warning .stat-icon {
  color: #e6a23c;
}

.stat-card.info .stat-icon {
  color: #409eff;
}

.stat-info {
  flex: 1;
}

.stat-value {
  font-size: 32px;
  font-weight: bold;
  color: #303133;
  line-height: 1;
  margin-bottom: 8px;
}

.stat-label {
  font-size: 14px;
  color: #909399;
}

.alerts-card {
  min-height: 500px;
}

.toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.overdue-text {
  color: #f56c6c;
  font-weight: bold;
}

.urgent-text {
  color: #e6a23c;
  font-weight: bold;
}

.warning-text {
  color: #e6a23c;
}

.normal-text {
  color: #67c23a;
}

.suggestion {
  display: flex;
  align-items: center;
  gap: 8px;
  color: #606266;
  font-size: 13px;
}

.suggestion .el-icon {
  color: #409eff;
}

:deep(.overdue-row) {
  background-color: #fef0f0;
}

:deep(.upcoming-row) {
  background-color: #fdf6ec;
}

.table-container {
  max-height: 600px;
  overflow-y: auto;
  margin-top: 20px;
}

.load-more-hint {
  text-align: center;
  padding: 16px;
  color: #909399;
  font-size: 14px;
}

.loading-more {
  text-align: center;
  padding: 16px;
  color: #409eff;
  font-size: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
}

.loading-more .el-icon {
  font-size: 16px;
}

.no-more-hint {
  text-align: center;
  padding: 16px;
  color: #c0c4cc;
  font-size: 14px;
}

/* 自定义滚动条样式 */
.table-container::-webkit-scrollbar {
  width: 8px;
}

.table-container::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 4px;
}

.table-container::-webkit-scrollbar-thumb {
  background: #c1c1c1;
  border-radius: 4px;
}

.table-container::-webkit-scrollbar-thumb:hover {
  background: #a8a8a8;
}
</style>
