<template>
  <div class="case-log-viewer">
    <el-card shadow="never">
      <template #header>
        <div class="card-header">
          <span class="card-title">
            <el-icon><Document /></el-icon>
            案件操作日志
          </span>
          <div class="header-actions">
            <el-button 
              type="primary" 
              :icon="Refresh" 
              @click="fetchLogs"
              :loading="loading"
            >
              刷新
            </el-button>
            <el-button 
              :icon="Download" 
              @click="exportLogs"
            >
              导出日志
            </el-button>
          </div>
        </div>
      </template>

      <!-- 筛选条件 -->
      <div class="filter-section">
        <el-form :inline="true" :model="filterForm">
          <el-form-item label="操作类型">
            <el-select 
              v-model="filterForm.actionType" 
              placeholder="全部类型"
              clearable
              style="width: 180px"
              @change="handleFilterChange"
            >
              <el-option label="全部" value="" />
              <el-option label="创建案件" value="CREATE_CASE" />
              <el-option label="编辑案件" value="UPDATE_CASE" />
              <el-option label="删除案件" value="DELETE_CASE" />
              <el-option label="查看案件" value="VIEW_CASE" />
              <el-option label="添加主体" value="ADD_PARTY" />
              <el-option label="编辑主体" value="UPDATE_PARTY" />
              <el-option label="删除主体" value="DELETE_PARTY" />
              <el-option label="添加证据" value="ADD_EVIDENCE" />
              <el-option label="更新证据" value="UPDATE_EVIDENCE" />
              <el-option label="删除证据" value="DELETE_EVIDENCE" />
              <el-option label="添加文书" value="ADD_DOCUMENT" />
              <el-option label="生成文书" value="GENERATE_DOCUMENT" />
              <el-option label="添加成本" value="ADD_COST" />
              <el-option label="状态变更" value="STATUS_CHANGE" />
            </el-select>
          </el-form-item>

          <el-form-item label="操作人">
            <el-input 
              v-model="filterForm.operator" 
              placeholder="输入操作人姓名"
              clearable
              style="width: 180px"
              @change="handleFilterChange"
            />
          </el-form-item>

          <el-form-item label="时间范围">
            <el-date-picker
              v-model="filterForm.dateRange"
              type="daterange"
              range-separator="至"
              start-placeholder="开始日期"
              end-placeholder="结束日期"
              style="width: 280px"
              @change="handleFilterChange"
            />
          </el-form-item>
        </el-form>
      </div>

      <!-- 日志列表 -->
      <el-table 
        :data="logs" 
        v-loading="loading"
        stripe
        style="width: 100%"
      >
        <el-table-column type="index" label="#" width="60" />
        
        <el-table-column prop="created_at" label="操作时间" width="180">
          <template #default="{ row }">
            {{ formatDateTime(row.created_at) }}
          </template>
        </el-table-column>

        <el-table-column prop="action_type" label="操作类型" width="120">
          <template #default="{ row }">
            <el-tag :type="getActionTypeTag(row.action_type)" size="small">
              {{ getActionTypeLabel(row.action_type) }}
            </el-tag>
          </template>
        </el-table-column>

        <el-table-column prop="action_description" label="操作描述" min-width="250" show-overflow-tooltip>
          <template #default="{ row }">
            {{ row.action_description || row.action || '-' }}
          </template>
        </el-table-column>

        <el-table-column prop="operator_name" label="操作人" width="120">
          <template #default="{ row }">
            {{ row.operator_name || row.operator || '-' }}
          </template>
        </el-table-column>

        <el-table-column prop="ip_address" label="IP地址" width="140" show-overflow-tooltip>
          <template #default="{ row }">
            {{ row.ip_address || '-' }}
          </template>
        </el-table-column>

        <el-table-column label="操作" width="100" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" link @click="viewLogDetail(row)">
              详情
            </el-button>
          </template>
        </el-table-column>
      </el-table>

      <!-- 分页 -->
      <div class="pagination-container">
        <el-pagination
          v-model:current-page="pagination.page"
          v-model:page-size="pagination.limit"
          :page-sizes="[10, 20, 50, 100]"
          :total="pagination.total"
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="handleSizeChange"
          @current-change="handlePageChange"
        />
      </div>
    </el-card>

    <!-- 日志详情对话框 -->
    <el-dialog
      v-model="detailDialogVisible"
      title="日志详情"
      width="700px"
    >
      <el-descriptions :column="1" border v-if="currentLog">
        <el-descriptions-item label="操作时间">
          {{ formatDateTime(currentLog.created_at) }}
        </el-descriptions-item>
        <el-descriptions-item label="操作类型">
          <el-tag :type="getActionTypeTag(currentLog.action_type)" size="small">
            {{ getActionTypeLabel(currentLog.action_type) }}
          </el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="操作描述">
          {{ currentLog.action_description || currentLog.action || '-' }}
        </el-descriptions-item>
        <el-descriptions-item label="操作人ID">
          {{ currentLog.operator_id || '-' }}
        </el-descriptions-item>
        <el-descriptions-item label="操作人姓名">
          {{ currentLog.operator_name || currentLog.operator || '-' }}
        </el-descriptions-item>
        <el-descriptions-item label="IP地址">
          {{ currentLog.ip_address || '-' }}
        </el-descriptions-item>
        <el-descriptions-item label="用户代理">
          <div style="word-break: break-all;">
            {{ currentLog.user_agent || '-' }}
          </div>
        </el-descriptions-item>
        <el-descriptions-item label="相关数据" v-if="currentLog.related_data">
          <el-input
            type="textarea"
            :rows="8"
            :value="formatRelatedData(currentLog.related_data)"
            readonly
          />
        </el-descriptions-item>
      </el-descriptions>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { Document, Refresh, Download } from '@element-plus/icons-vue'
import { caseApi } from '@/api/case'

// Props
const props = defineProps<{
  caseId: number
}>()

// State
const loading = ref(false)
const logs = ref<any[]>([])
const detailDialogVisible = ref(false)
const currentLog = ref<any>(null)

// Filter form
const filterForm = reactive({
  actionType: '',
  operator: '',
  dateRange: null as any
})

// Pagination
const pagination = reactive({
  page: 1,
  limit: 20,
  total: 0
})

// Fetch logs
const fetchLogs = async () => {
  loading.value = true
  try {
    const response = await caseApi.getCaseLogs(props.caseId, {
      page: pagination.page,
      limit: pagination.limit
    })
    
    if (response.data) {
      logs.value = response.data.logs || response.data.list || response.data || []
      
      if (response.data.pagination) {
        pagination.total = response.data.pagination.total || 0
      }
    }
  } catch (error: any) {
    ElMessage.error(error.message || '获取日志失败')
  } finally {
    loading.value = false
  }
}

// Filter change handler
const handleFilterChange = () => {
  pagination.page = 1
  fetchLogs()
}

// Page change handler
const handlePageChange = (page: number) => {
  pagination.page = page
  fetchLogs()
}

// Size change handler
const handleSizeChange = (size: number) => {
  pagination.limit = size
  pagination.page = 1
  fetchLogs()
}

// View log detail
const viewLogDetail = (log: any) => {
  currentLog.value = log
  detailDialogVisible.value = true
}

// Export logs
const exportLogs = () => {
  ElMessage.info('导出功能开发中...')
}

// Format date time
const formatDateTime = (dateStr: string) => {
  if (!dateStr) return '-'
  const date = new Date(dateStr)
  return date.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  })
}

// Get action type label
const getActionTypeLabel = (type: string) => {
  const labels: Record<string, string> = {
    'CREATE_CASE': '创建案件',
    'UPDATE_CASE': '编辑案件',
    'DELETE_CASE': '删除案件',
    'VIEW_CASE': '查看案件',
    'ADD_PARTY': '添加主体',
    'UPDATE_PARTY': '编辑主体',
    'DELETE_PARTY': '删除主体',
    'ADD_EVIDENCE': '添加证据',
    'UPDATE_EVIDENCE': '更新证据',
    'DELETE_EVIDENCE': '删除证据',
    'ADD_DOCUMENT': '添加文书',
    'GENERATE_DOCUMENT': '生成文书',
    'ADD_COST': '添加成本',
    'STATUS_CHANGE': '状态变更'
  }
  return labels[type] || type || '未知操作'
}

// Get action type tag
const getActionTypeTag = (type: string) => {
  const tags: Record<string, string> = {
    'CREATE_CASE': 'success',
    'UPDATE_CASE': '',
    'DELETE_CASE': 'danger',
    'VIEW_CASE': 'info',
    'ADD_PARTY': 'success',
    'UPDATE_PARTY': '',
    'DELETE_PARTY': 'danger',
    'ADD_EVIDENCE': 'success',
    'UPDATE_EVIDENCE': '',
    'DELETE_EVIDENCE': 'danger',
    'ADD_DOCUMENT': 'success',
    'GENERATE_DOCUMENT': 'success',
    'ADD_COST': 'success',
    'STATUS_CHANGE': 'warning'
  }
  return tags[type] || 'info'
}

// Format related data
const formatRelatedData = (data: any) => {
  if (!data) return '-'
  try {
    const parsed = typeof data === 'string' ? JSON.parse(data) : data
    return JSON.stringify(parsed, null, 2)
  } catch {
    return String(data)
  }
}

// Lifecycle
onMounted(() => {
  fetchLogs()
})
</script>

<style scoped>
.case-log-viewer {
  width: 100%;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.card-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 16px;
  font-weight: 600;
}

.header-actions {
  display: flex;
  gap: 8px;
}

.filter-section {
  margin-bottom: 16px;
  padding: 16px;
  background-color: #f5f7fa;
  border-radius: 4px;
}

.pagination-container {
  display: flex;
  justify-content: flex-end;
  margin-top: 16px;
}
</style>
