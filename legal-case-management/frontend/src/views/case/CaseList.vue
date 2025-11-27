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
        
        <el-form-item label="产业板块">
          <el-select
            v-model="searchForm.industrySegment"
            placeholder="请选择"
            clearable
            style="width: 150px"
            @change="handleSearch"
          >
            <el-option label="新奥新智" value="新奥新智" />
            <el-option label="新奥股份" value="新奥股份" />
            <el-option label="新奥能源" value="新奥能源" />
            <el-option label="新地环保" value="新地环保" />
            <el-option label="新奥动力" value="新奥动力" />
            <el-option label="能源研究院" value="能源研究院" />
            <el-option label="新绎控股" value="新绎控股" />
            <el-option label="数能科技" value="数能科技" />
            <el-option label="新智认知" value="新智认知" />
            <el-option label="质信智购" value="质信智购" />
            <el-option label="新智感知" value="新智感知" />
            <el-option label="新智通才" value="新智通才" />
            <el-option label="财务公司" value="财务公司" />
            <el-option label="新奥国际" value="新奥国际" />
            <el-option label="河北金租" value="河北金租" />
            <el-option label="新博卓畅" value="新博卓畅" />
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
        
        <el-form-item label="案件承接人">
          <el-input
            v-model="searchForm.handler"
            placeholder="承接人姓名"
            clearable
            style="width: 150px"
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
      <el-button style="margin-left:8px" @click="handleImportClick">
        导入案件
      </el-button>
      <input ref="importFile" type="file" accept=".xls,.xlsx" style="display:none" @change="handleFileChange" />
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
          prop="handler"
          label="案件承接人"
          width="120"
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
          prop="industry_segment"
          label="产业板块"
          width="120"
          show-overflow-tooltip
        />
       
        <el-table-column
          prop="is_external_agent"
          label="外部代理"
          width="100"
          align="center"
        >
          <template #default="{ row }">
            <el-tag :type="row.is_external_agent ? 'success' : 'info'" size="small">
              {{ row.is_external_agent ? '是' : '否' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column
          prop="law_firm_name"
          label="律所名称"
          width="150"
          show-overflow-tooltip
        >
          <template #default="{ row }">
            {{ row.law_firm_name || '-' }}
          </template>
        </el-table-column>
        <el-table-column
          prop="agent_lawyer"
          label="代理律师"
          width="120"
          show-overflow-tooltip
        >
          <template #default="{ row }">
            {{ row.agent_lawyer || '-' }}
          </template>
        </el-table-column>
        <el-table-column
          prop="agent_contact"
          label="联系方式"
          width="130"
          show-overflow-tooltip
        >
          <template #default="{ row }">
            {{ row.agent_contact || '-' }}
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
  industrySegment: '',
  partyName: '',
  handler: ''
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
    if (searchForm.industrySegment) {
      params.industry_segment = searchForm.industrySegment
    }
    if (searchForm.partyName) {
      params.party_name = searchForm.partyName
    }
    if (searchForm.handler) {
      params.handler = searchForm.handler
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
  searchForm.handler = ''
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

// 导入相关
const importFile = ref<HTMLInputElement | null>(null)
const handleImportClick = () => {
  importFile.value = (document.querySelector('input[ref]') as HTMLInputElement) || null
  // Prefer using the local ref - Vue template ref would be better, but this is a simple fallback
  const el = document.querySelector('input[type="file"]') as HTMLInputElement
  if (el) el.click()
}

const handleFileChange = async (e: Event) => {
  const input = e.target as HTMLInputElement
  if (!input || !input.files || input.files.length === 0) return
  const file = input.files[0]
  const form = new FormData()
  form.append('file', file)

  try {
    loading.value = true
    const response = await caseApi.importCases(form)
    if (response && response.data && response.data.results) {
      const r = response.data.results
      ElMessage.success(`导入完成：共 ${r.total} 行，成功 ${r.success} 行，失败 ${r.failures.length} 行`)
      if (r.failures.length > 0) {
        console.error('导入失败详情：', r.failures)
        // 显示失败详情弹窗（包含行号与原因），并在必要时可复制或查看
        const listHtml = `<div style="max-height:300px;overflow:auto"><table style="width:100%;border-collapse:collapse"><thead><tr><th style="text-align:left;padding:6px;border-bottom:1px solid #ebeef5">行号</th><th style="text-align:left;padding:6px;border-bottom:1px solid #ebeef5">原因</th></tr></thead><tbody>${r.failures.map(f=>`<tr><td style="padding:6px;border-bottom:1px solid #f2f6fc">${f.row}</td><td style="padding:6px;border-bottom:1px solid #f2f6fc">${f.reason}</td></tr>`).join('')}</tbody></table></div>`
        ElMessageBox.alert(listHtml, '导入失败详情', { dangerouslyUseHTMLString: true, confirmButtonText: '关闭' })
        // 生成 CSV 并触发下载，供用户离线查看和修正
        try {
          const csvHeader = 'row,reason\n'
          const csvBody = r.failures.map((f: any) => `${f.row},"${(f.reason||'').replace(/"/g, '""')}"`).join('\n')
          const csvContent = csvHeader + csvBody
          const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
          const url = URL.createObjectURL(blob)
          const a = document.createElement('a')
          const ts = new Date().toISOString().replace(/[:.]/g, '-')
          a.href = url
          a.download = `case-import-failures-${ts}.csv`
          document.body.appendChild(a)
          a.click()
          document.body.removeChild(a)
          URL.revokeObjectURL(url)
        } catch (e) {
          console.error('生成失败 CSV 失败', e)
        }
      }
      // 如果有成功则刷新列表
      if (r.success > 0) fetchCaseList()
    } else {
      ElMessage.success('导入已完成')
      fetchCaseList()
    }
  } catch (err: any) {
    console.error('导入失败：', err)
    ElMessage.error(err?.message || '导入失败')
  } finally {
    loading.value = false
    // 清空 input
    const el = document.querySelector('input[type="file"]') as HTMLInputElement
    if (el) el.value = ''
  }
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

const formatDate = (date: any) => {
  if (date === null || date === undefined || date === '') return '-'

  // Excel 导入时可能得到序列号（数字），将其转换为日期
  if (typeof date === 'number') {
    try {
      // Excel 序列号转换（基于 1899-12-30 起算）
      const timestamp = Math.round((date - 25569) * 86400 * 1000)
      const d = new Date(timestamp)
      if (!isNaN(d.getTime())) return d.toISOString().split('T')[0]
    } catch (e) {
      return '-'
    }
  }

  if (typeof date === 'string') {
    // ISO 字符串
    if (date.includes('T')) return date.split('T')[0]
    // 已是 YYYY-MM-DD 格式
    if (/^\d{4}-\d{2}-\d{2}$/.test(date)) return date
    // 尝试解析其他字符串格式
    const parsed = Date.parse(date)
    if (!isNaN(parsed)) return new Date(parsed).toISOString().split('T')[0]
    return date
  }

  return '-'
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
