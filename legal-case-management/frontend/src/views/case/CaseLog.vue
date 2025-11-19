<template>
  <div class="case-log-container">
    <PageHeader title="案件日志" :breadcrumb="breadcrumb" />
    
    <el-card class="filter-card">
      <el-form :inline="true">
        <el-form-item label="操作类型">
          <el-select v-model="filterType" placeholder="全部" clearable @change="loadLogs">
            <el-option label="全部" value="" />
            <el-option label="创建案件" value="CREATE_CASE" />
            <el-option label="查看案件" value="VIEW_CASE" />
            <el-option label="更新案件" value="UPDATE_CASE" />
            <el-option label="删除案件" value="DELETE_CASE" />
            <el-option label="添加主体" value="ADD_PARTY" />
            <el-option label="添加节点" value="ADD_NODE" />
            <el-option label="上传证据" value="UPLOAD_EVIDENCE" />
            <el-option label="上传文书" value="UPLOAD_DOCUMENT" />
            <el-option label="添加成本" value="ADD_COST" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="loadStatistics">查看统计</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <el-card class="table-card">
      <el-timeline>
        <el-timeline-item
          v-for="log in logList"
          :key="log.id"
          :timestamp="formatDateTime(log.created_at)"
          placement="top"
          :type="getTimelineType(log.action_type)"
        >
          <el-card>
            <div class="log-header">
              <el-tag :type="getActionTagType(log.action_type)">
                {{ getActionTypeName(log.action_type) }}
              </el-tag>
              <span class="operator">操作人: {{ log.operator_name || '系统' }}</span>
            </div>
            <div class="log-description">
              {{ log.action_description }}
            </div>
            <div class="log-meta" v-if="log.ip_address">
              <el-text size="small" type="info">
                IP: {{ log.ip_address }}
              </el-text>
            </div>
          </el-card>
        </el-timeline-item>
      </el-timeline>

      <el-empty v-if="logList.length === 0 && !loading" description="暂无日志记录" />

      <div class="pagination" v-if="total > 0">
        <el-pagination
          v-model:current-page="currentPage"
          v-model:page-size="pageSize"
          :total="total"
          :page-sizes="[20, 50, 100]"
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="loadLogs"
          @current-change="loadLogs"
        />
      </div>
    </el-card>

    <!-- Statistics Dialog -->
    <el-dialog v-model="showStatistics" title="操作统计" width="600px">
      <el-table :data="statistics" v-loading="loadingStats">
        <el-table-column prop="action_type" label="操作类型" width="200">
          <template #default="{ row }">
            {{ getActionTypeName(row.action_type) }}
          </template>
        </el-table-column>
        <el-table-column prop="count" label="操作次数" width="120" />
        <el-table-column label="最后操作时间" min-width="180">
          <template #default="{ row }">
            {{ formatDateTime(row.last_action_time) }}
          </template>
        </el-table-column>
      </el-table>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { ElMessage } from 'element-plus'
import { caseLogApi } from '@/api/caseLog'
import PageHeader from '@/components/common/PageHeader.vue'

const route = useRoute()
const caseId = computed(() => Number(route.params.id))

const breadcrumb = [
  { title: '案件管理', path: '/cases' },
  { title: '案件详情', path: `/cases/${caseId.value}` },
  { title: '案件日志' }
]

const loading = ref(false)
const loadingStats = ref(false)
const logList = ref<any[]>([])
const statistics = ref<any[]>([])
const filterType = ref('')
const currentPage = ref(1)
const pageSize = ref(50)
const total = ref(0)
const showStatistics = ref(false)

const actionTypeMap: Record<string, string> = {
  CREATE_CASE: '创建案件',
  VIEW_CASE: '查看案件',
  UPDATE_CASE: '更新案件',
  DELETE_CASE: '删除案件',
  ADD_PARTY: '添加主体',
  ADD_NODE: '添加节点',
  UPLOAD_EVIDENCE: '上传证据',
  UPLOAD_DOCUMENT: '上传文书',
  ADD_COST: '添加成本'
}

const getActionTypeName = (type: string) => {
  return actionTypeMap[type] || type
}

const getActionTagType = (type: string) => {
  const typeMap: Record<string, any> = {
    CREATE_CASE: 'success',
    VIEW_CASE: 'info',
    UPDATE_CASE: 'warning',
    DELETE_CASE: 'danger',
    ADD_PARTY: 'success',
    ADD_NODE: 'success',
    UPLOAD_EVIDENCE: 'success',
    UPLOAD_DOCUMENT: 'success',
    ADD_COST: 'success'
  }
  return typeMap[type] || ''
}

const getTimelineType = (type: string) => {
  const typeMap: Record<string, any> = {
    CREATE_CASE: 'success',
    DELETE_CASE: 'danger',
    UPDATE_CASE: 'warning'
  }
  return typeMap[type] || 'primary'
}

const loadLogs = async () => {
  loading.value = true
  try {
    const params: any = {
      page: currentPage.value,
      limit: pageSize.value
    }
    
    if (filterType.value) {
      params.action_type = filterType.value
    }
    
    const response = await caseLogApi.getCaseLogs(caseId.value, params)
    
    if (response && response.data) {
      logList.value = response.data.logs || []
      total.value = response.data.pagination?.total || 0
    }
  } catch (error: any) {
    console.error('加载日志失败:', error)
    ElMessage.error('加载日志失败')
    logList.value = []
  } finally {
    loading.value = false
  }
}

const loadStatistics = async () => {
  loadingStats.value = true
  showStatistics.value = true
  try {
    const response = await caseLogApi.getCaseLogStatistics(caseId.value)
    
    if (response && response.data) {
      statistics.value = response.data.statistics || []
    }
  } catch (error: any) {
    console.error('加载统计失败:', error)
    ElMessage.error('加载统计失败')
    statistics.value = []
  } finally {
    loadingStats.value = false
  }
}

const formatDateTime = (dateString: string): string => {
  if (!dateString) return ''
  const date = new Date(dateString)
  return date.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  })
}

onMounted(() => {
  loadLogs()
})
</script>

<style scoped>
.case-log-container {
  padding: 20px;
}

.filter-card {
  margin-bottom: 20px;
}

.table-card {
  min-height: 400px;
}

.log-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
}

.operator {
  font-size: 14px;
  color: #606266;
}

.log-description {
  margin-bottom: 8px;
  font-size: 14px;
  line-height: 1.6;
}

.log-meta {
  margin-top: 8px;
  padding-top: 8px;
  border-top: 1px solid #ebeef5;
}

.pagination {
  margin-top: 20px;
  display: flex;
  justify-content: flex-end;
}
</style>
