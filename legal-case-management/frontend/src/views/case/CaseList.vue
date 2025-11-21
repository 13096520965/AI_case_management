<template>
  <div class="case-list-container">
    <PageHeader title="案件管理" />
    
    <!-- Search and Filter Section -->
    <el-card class="search-card" shadow="never">
      <el-form :inline="true" :model="searchForm" class="search-form">
        <el-form-item label="关键词">
          <el-input
            v-model="searchForm.keyword"
            placeholder="案号、案由"
            clearable
            style="width: 200px"
            @clear="handleSearch"
          />
        </el-form-item>
        
        <el-form-item label="案件类型">
          <el-select
            v-model="searchForm.caseType"
            placeholder="请选择"
            clearable
            style="width: 140px"
            @change="handleSearch"
          >
            <el-option label="民事" value="民事" />
            <el-option label="刑事" value="刑事" />
            <el-option label="行政" value="行政" />
            <el-option label="劳动仲裁" value="劳动仲裁" />
          </el-select>
        </el-form-item>
        
        <el-form-item label="案件状态">
          <el-select
            v-model="searchForm.status"
            placeholder="请选择"
            clearable
            style="width: 120px"
            @change="handleSearch"
          >
            <el-option label="立案" value="立案" />
            <el-option label="审理中" value="审理中" />
            <el-option label="已结案" value="已结案" />
            <el-option label="已归档" value="已归档" />
          </el-select>
        </el-form-item>
        
        <el-form-item label="当事人">
          <el-input
            v-model="searchForm.partyName"
            placeholder="当事人姓名/名称"
            clearable
            style="width: 180px"
            @clear="handleSearch"
          />
        </el-form-item>
        
        <el-form-item>
          <el-button type="primary" @click="handleSearch">
            <el-icon><Search /></el-icon>
            搜索
          </el-button>
          <el-button @click="handleReset">
            <el-icon><Refresh /></el-icon>
            重置
          </el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <!-- Action Bar -->
    <div class="action-bar">
      <el-button type="primary" @click="handleCreate">
        <el-icon><Plus /></el-icon>
        新建案件
      </el-button>
    </div>

    <!-- Case List Table -->
    <el-card shadow="never">
      <el-table
        v-loading="loading"
        :data="caseList"
        stripe
        @sort-change="handleSortChange"
      >
        <el-table-column
          prop="internal_number"
          label="内部编号"
          width="150"
          sortable="custom"
        />
        <el-table-column
          prop="case_number"
          label="案号"
          width="180"
          sortable="custom"
        />
        <el-table-column
          prop="case_type"
          label="案件类型"
          width="100"
        >
          <template #default="{ row }">
            <el-tag :type="getCaseTypeTag(row.case_type)">
              {{ row.case_type }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column
          prop="case_cause"
          label="案由"
          min-width="150"
          show-overflow-tooltip
        />
        <el-table-column
          prop="court"
          label="法院"
          min-width="150"
          show-overflow-tooltip
        />
        <el-table-column
          prop="target_amount"
          label="标的额（元）"
          width="130"
          sortable="custom"
          align="right"
        >
          <template #default="{ row }">
            {{ formatAmount(row.target_amount) }}
          </template>
        </el-table-column>
        <el-table-column
          prop="filing_date"
          label="立案日期"
          width="120"
          sortable="custom"
        >
          <template #default="{ row }">
            {{ formatDate(row.filing_date) }}
          </template>
        </el-table-column>
        <el-table-column
          prop="status"
          label="状态"
          width="100"
        >
          <template #default="{ row }">
            <el-tag :type="getStatusTag(row.status)">
              {{ row.status }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column
          label="操作"
          width="200"
          fixed="right"
        >
          <template #default="{ row }">
            <el-button
              type="primary"
              link
              @click="handleView(row.id)"
            >
              查看
            </el-button>
            <el-button
              type="primary"
              link
              @click="handleEdit(row.id)"
            >
              编辑
            </el-button>
            <el-button
              type="danger"
              link
              @click="handleDelete(row.id)"
            >
              删除
            </el-button>
          </template>
        </el-table-column>
        <template #empty>
          <TableEmpty description="暂无案件数据" />
        </template>
      </el-table>

      <!-- Pagination -->
      <div class="pagination-container">
        <el-pagination
          v-model:current-page="pagination.page"
          v-model:page-size="pagination.pageSize"
          :page-sizes="[10, 20, 50, 100]"
          :total="pagination.total"
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="handleSizeChange"
          @current-change="handlePageChange"
        />
      </div>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Search, Refresh, Plus } from '@element-plus/icons-vue'
import { caseApi } from '@/api/case'
import { useCaseStore } from '@/stores/case'
import PageHeader from '@/components/common/PageHeader.vue'
import TableEmpty from '@/components/common/TableEmpty.vue'

const router = useRouter()
const caseStore = useCaseStore()

// State
const loading = ref(false)
const caseList = ref<any[]>([])
const searchForm = reactive({
  keyword: '',
  caseType: '',
  status: '',
  partyName: ''
})
const pagination = reactive({
  page: 1,
  pageSize: 10,
  total: 0
})
const sortField = ref('')
const sortOrder = ref('')

// Fetch case list
const fetchCaseList = async () => {
  loading.value = true
  try {
    const params: any = {
      page: pagination.page,
      limit: pagination.pageSize  // 后端使用 limit 而不是 pageSize
    }
    
    if (searchForm.keyword) {
      params.search = searchForm.keyword  // 后端使用 search 参数
    }
    if (searchForm.caseType) {
      params.case_type = searchForm.caseType  // 后端使用 case_type
    }
    if (searchForm.status) {
      params.status = searchForm.status
    }
    if (searchForm.partyName) {
      params.party_name = searchForm.partyName
    }
    if (sortField.value) {
      params.sortField = sortField.value
      params.sortOrder = sortOrder.value
    }
    
    const response = await caseApi.getCases(params)
    
    if (response.data) {
      // 后端返回的数据结构: { data: { cases: [], pagination: {} } }
      const data = response.data.cases || response.data.list || response.data
      caseList.value = Array.isArray(data) ? data : []
      
      // 从 pagination 对象或 total 字段获取总数
      if (response.data.pagination) {
        pagination.total = response.data.pagination.total || 0
      } else {
        pagination.total = response.data.total || caseList.value.length
      }
      
      // Update store
      caseStore.setCases(caseList.value)
      caseStore.setPagination(pagination.page, pagination.pageSize, pagination.total)
    } else {
      // 如果没有数据，设置为空数组
      caseList.value = []
      pagination.total = 0
    }
  } catch (error: any) {
    ElMessage.error(error.message || '获取案件列表失败')
  } finally {
    loading.value = false
  }
}

// Search handler
const handleSearch = () => {
  pagination.page = 1
  fetchCaseList()
}

// Reset handler
const handleReset = () => {
  searchForm.keyword = ''
  searchForm.caseType = ''
  searchForm.status = ''
  searchForm.partyName = ''
  sortField.value = ''
  sortOrder.value = ''
  pagination.page = 1
  fetchCaseList()
}

// Sort handler
const handleSortChange = ({ prop, order }: any) => {
  sortField.value = prop || ''
  sortOrder.value = order === 'ascending' ? 'asc' : order === 'descending' ? 'desc' : ''
  fetchCaseList()
}

// Pagination handlers
const handlePageChange = (page: number) => {
  pagination.page = page
  fetchCaseList()
}

const handleSizeChange = (size: number) => {
  pagination.pageSize = size
  pagination.page = 1
  fetchCaseList()
}

// Action handlers
const handleCreate = () => {
  router.push('/cases/create')
}

const handleView = (id: number) => {
  router.push(`/cases/${id}`)
}

const handleEdit = (id: number) => {
  router.push(`/cases/${id}/edit`)
}

const handleDelete = async (id: number) => {
  try {
    await ElMessageBox.confirm(
      '确定要删除该案件吗？删除后将无法恢复。',
      '删除确认',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )
    
    await caseApi.deleteCase(id)
    ElMessage.success('删除成功')
    
    // Update store
    caseStore.removeCase(id)
    
    // Refresh list
    fetchCaseList()
  } catch (error: any) {
    if (error !== 'cancel') {
      ElMessage.error(error.message || '删除失败')
    }
  }
}

// Utility functions
const getCaseTypeTag = (type: string) => {
  const tagMap: Record<string, string> = {
    '民事': '',
    '刑事': 'danger',
    '行政': 'warning',
    '劳动仲裁': 'success'
  }
  return tagMap[type] || ''
}

const getStatusTag = (status: string) => {
  const tagMap: Record<string, string> = {
    '立案': 'info',
    '审理中': '',
    '已结案': 'success',
    '已归档': 'info'
  }
  return tagMap[status] || ''
}

const formatAmount = (amount: number) => {
  if (!amount) return '-'
  return amount.toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

const formatDate = (date: string) => {
  if (!date) return '-'
  return date.split('T')[0]
}

// Lifecycle
onMounted(() => {
  fetchCaseList()
})
</script>

<style scoped>
.case-list-container {
  padding: 20px;
}

.search-card {
  margin-bottom: 20px;
}

.search-form {
  margin-bottom: 0;
}

.action-bar {
  margin-bottom: 20px;
}

.pagination-container {
  margin-top: 20px;
  display: flex;
  justify-content: flex-end;
}
</style>
