<template>
  <div class="archive-search-container">
    <el-card class="search-card">
      <h2>归档案件检索</h2>
      
      <!-- 搜索表单 -->
      <el-form :model="searchForm" :inline="true" class="search-form">
        <el-form-item label="归档编号">
          <el-input
            v-model="searchForm.archive_number"
            placeholder="请输入归档编号"
            clearable
          />
        </el-form-item>

        <el-form-item label="案件编号">
          <el-input
            v-model="searchForm.case_number"
            placeholder="请输入案件编号"
            clearable
          />
        </el-form-item>

        <el-form-item label="案由">
          <el-input
            v-model="searchForm.case_cause"
            placeholder="请输入案由"
            clearable
          />
        </el-form-item>

        <el-form-item label="归档日期">
          <el-date-picker
            v-model="dateRange"
            type="daterange"
            range-separator="至"
            start-placeholder="开始日期"
            end-placeholder="结束日期"
            value-format="YYYY-MM-DD"
            @change="handleDateChange"
          />
        </el-form-item>

        <el-form-item label="归档人">
          <el-input
            v-model="searchForm.archived_by"
            placeholder="请输入归档人"
            clearable
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

    <!-- 归档列表 -->
    <el-card v-loading="loading" class="list-card">
      <div class="list-header">
        <h3>归档列表</h3>
        <div class="header-actions">
          <el-button type="primary" @click="handleCreateArchive">
            <el-icon><Plus /></el-icon>
            创建归档包
          </el-button>
        </div>
      </div>

      <el-table :data="archiveList" stripe style="width: 100%">
        <el-table-column prop="archive_number" label="归档编号" width="150" />
        <el-table-column prop="case_number" label="案件编号" width="150" />
        <el-table-column prop="case_type" label="案件类型" width="120" />
        <el-table-column prop="case_cause" label="案由" min-width="150" show-overflow-tooltip />
        <el-table-column prop="court" label="法院" min-width="150" show-overflow-tooltip />
        <el-table-column prop="target_amount" label="标的额" width="120" align="right">
          <template #default="{ row }">
            {{ formatAmount(row.target_amount) }}
          </template>
        </el-table-column>
        <el-table-column prop="archive_date" label="归档日期" width="120" />
        <el-table-column prop="archived_by" label="归档人" width="100" />
        <el-table-column label="操作" width="150" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" link @click="handleViewDetail(row)">
              查看详情
            </el-button>
          </template>
        </el-table-column>
      </el-table>

      <!-- 分页 -->
      <div class="pagination">
        <el-pagination
          v-model:current-page="pagination.page"
          v-model:page-size="pagination.limit"
          :page-sizes="[10, 20, 50, 100]"
          :total="pagination.total"
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="handleSearch"
          @current-change="handleSearch"
        />
      </div>
    </el-card>

    <!-- 归档详情对话框 -->
    <el-dialog
      v-model="detailDialogVisible"
      title="归档包详情"
      width="800px"
      destroy-on-close
    >
      <div v-if="currentArchive" v-loading="detailLoading">
        <el-descriptions :column="2" border>
          <el-descriptions-item label="归档编号">
            {{ currentArchive.archive_number }}
          </el-descriptions-item>
          <el-descriptions-item label="归档日期">
            {{ currentArchive.archive_date }}
          </el-descriptions-item>
          <el-descriptions-item label="归档人">
            {{ currentArchive.archived_by }}
          </el-descriptions-item>
          <el-descriptions-item label="归档位置">
            {{ currentArchive.archive_location }}
          </el-descriptions-item>
          <el-descriptions-item label="包大小">
            {{ formatSize(currentArchive.package_size) }}
          </el-descriptions-item>
          <el-descriptions-item label="包路径">
            {{ currentArchive.package_path }}
          </el-descriptions-item>
        </el-descriptions>

        <el-divider content-position="left">案件信息</el-divider>

        <el-descriptions v-if="currentCase" :column="2" border>
          <el-descriptions-item label="案件编号">
            {{ currentCase.case_number }}
          </el-descriptions-item>
          <el-descriptions-item label="内部编号">
            {{ currentCase.internal_number }}
          </el-descriptions-item>
          <el-descriptions-item label="案件类型">
            {{ currentCase.case_type }}
          </el-descriptions-item>
          <el-descriptions-item label="案由">
            {{ currentCase.case_cause }}
          </el-descriptions-item>
          <el-descriptions-item label="法院">
            {{ currentCase.court }}
          </el-descriptions-item>
          <el-descriptions-item label="标的额">
            {{ formatAmount(currentCase.target_amount) }}
          </el-descriptions-item>
          <el-descriptions-item label="立案日期">
            {{ currentCase.filing_date }}
          </el-descriptions-item>
          <el-descriptions-item label="案件状态">
            <el-tag :type="getStatusType(currentCase.status)">
              {{ currentCase.status }}
            </el-tag>
          </el-descriptions-item>
        </el-descriptions>

        <el-divider content-position="left">备注</el-divider>
        <div class="notes">
          {{ currentArchive.notes || '无' }}
        </div>
      </div>

      <template #footer>
        <el-button @click="detailDialogVisible = false">关闭</el-button>
        <el-button type="primary" @click="handleViewCase">查看案件详情</el-button>
      </template>
    </el-dialog>

    <!-- 创建归档包对话框 -->
    <el-dialog
      v-model="createDialogVisible"
      title="创建归档包"
      width="600px"
      destroy-on-close
    >
      <el-form
        ref="createFormRef"
        :model="createForm"
        :rules="createRules"
        label-width="100px"
      >
        <el-form-item label="选择案件" prop="case_id">
          <el-select
            v-model="createForm.case_id"
            placeholder="请选择案件"
            filterable
            style="width: 100%"
            @visible-change="handleCaseSelectVisible"
          >
            <el-option
              v-for="caseItem in availableCases"
              :key="caseItem.id"
              :label="`${caseItem.internal_number || caseItem.case_number} - ${caseItem.case_cause}`"
              :value="caseItem.id"
            />
          </el-select>
        </el-form-item>

        <el-form-item label="归档人" prop="archived_by">
          <el-input
            v-model="createForm.archived_by"
            placeholder="请输入归档人姓名"
          />
        </el-form-item>

        <el-form-item label="备注">
          <el-input
            v-model="createForm.notes"
            type="textarea"
            :rows="4"
            placeholder="请输入备注信息"
          />
        </el-form-item>
      </el-form>

      <template #footer>
        <el-button @click="createDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleConfirmCreate" :loading="creating">
          确定
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, type FormInstance, type FormRules } from 'element-plus'
import { Search, Refresh, Plus } from '@element-plus/icons-vue'
import { archiveApi } from '@/api/archive'
import { caseApi } from '@/api/case'

const router = useRouter()

const loading = ref(false)
const detailLoading = ref(false)
const creating = ref(false)
const archiveList = ref<any[]>([])
const availableCases = ref<any[]>([])
const dateRange = ref<[string, string] | null>(null)
const detailDialogVisible = ref(false)
const createDialogVisible = ref(false)
const currentArchive = ref<any>(null)
const currentCase = ref<any>(null)
const createFormRef = ref<FormInstance>()

const searchForm = reactive({
  archive_number: '',
  case_number: '',
  case_cause: '',
  archive_date_from: '',
  archive_date_to: '',
  archived_by: ''
})

const pagination = reactive({
  page: 1,
  limit: 10,
  total: 0
})

const createForm = reactive({
  case_id: undefined as number | undefined,
  archived_by: '',
  notes: ''
})

const createRules: FormRules = {
  case_id: [
    { required: true, message: '请输入案件ID', trigger: 'blur' },
    { type: 'number', message: '案件ID必须是数字', trigger: 'blur' }
  ],
  archived_by: [
    { required: true, message: '请输入归档人', trigger: 'blur' }
  ]
}

const formatAmount = (amount: number) => {
  if (!amount) return '¥0.00'
  return `¥${amount.toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

const formatSize = (bytes: number) => {
  if (!bytes) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return `${(bytes / Math.pow(k, i)).toFixed(2)} ${sizes[i]}`
}

const getStatusType = (status: string) => {
  const typeMap: Record<string, any> = {
    '进行中': 'primary',
    '已结案': 'success',
    '已归档': 'info',
    '已撤诉': 'warning'
  }
  return typeMap[status] || 'info'
}

const handleDateChange = (value: [string, string] | null) => {
  if (value) {
    searchForm.archive_date_from = value[0]
    searchForm.archive_date_to = value[1]
  } else {
    searchForm.archive_date_from = ''
    searchForm.archive_date_to = ''
  }
}

const loadArchiveList = async () => {
  try {
    loading.value = true

    const params = {
      page: pagination.page,
      limit: pagination.limit,
      ...searchForm
    }

    const response = await archiveApi.searchArchive(params)
    archiveList.value = response.data.packages || []
    pagination.total = response.data.pagination?.total || 0
  } catch (error: any) {
    ElMessage.error(error.response?.data?.error?.message || '加载归档列表失败')
  } finally {
    loading.value = false
  }
}

const handleSearch = () => {
  pagination.page = 1
  loadArchiveList()
}

const handleReset = () => {
  Object.assign(searchForm, {
    archive_number: '',
    case_number: '',
    case_cause: '',
    archive_date_from: '',
    archive_date_to: '',
    archived_by: ''
  })
  dateRange.value = null
  handleSearch()
}

const handleViewDetail = async (row: any) => {
  try {
    detailLoading.value = true
    detailDialogVisible.value = true

    const response = await archiveApi.getArchivePackageById(row.id)
    currentArchive.value = response.data.package
    currentCase.value = response.data.case
  } catch (error: any) {
    ElMessage.error(error.response?.data?.error?.message || '加载归档详情失败')
    detailDialogVisible.value = false
  } finally {
    detailLoading.value = false
  }
}

const handleViewCase = () => {
  if (currentCase.value) {
    router.push(`/cases/${currentCase.value.id}`)
    detailDialogVisible.value = false
  }
}

const handleCreateArchive = () => {
  loadAvailableCases()
  createDialogVisible.value = true
}

// 加载可归档的案件列表（已结案但未归档的案件）
const loadAvailableCases = async () => {
  try {
    const response = await caseApi.getCases({ status: '已结案', limit: 100 })
    if (response && response.data) {
      // 后端返回 { data: { cases: [...], pagination: {...} } }
      const data = response.data.cases || []
      availableCases.value = Array.isArray(data) ? data : []
    }
  } catch (error: any) {
    console.error('加载案件列表失败:', error)
    ElMessage.error('加载案件列表失败')
    availableCases.value = []
  }
}

// 下拉框显示时加载案件
const handleCaseSelectVisible = (visible: boolean) => {
  if (visible && availableCases.value.length === 0) {
    loadAvailableCases()
  }
}

const handleConfirmCreate = async () => {
  if (!createFormRef.value) return

  await createFormRef.value.validate(async (valid) => {
    if (!valid) return

    try {
      creating.value = true

      await archiveApi.createArchivePackage(createForm)
      ElMessage.success('归档包创建成功')
      createDialogVisible.value = false
      
      // 重置表单
      createFormRef.value?.resetFields()
      
      // 刷新列表
      await loadArchiveList()
    } catch (error: any) {
      ElMessage.error(error.response?.data?.error?.message || '创建归档包失败')
    } finally {
      creating.value = false
    }
  })
}

onMounted(() => {
  loadArchiveList()
})
</script>

<style scoped>
.archive-search-container {
  padding: 20px;
}

.search-card {
  margin-bottom: 20px;
}

.search-card h2 {
  margin: 0 0 20px 0;
  font-size: 20px;
  font-weight: 600;
}

.search-form {
  margin-top: 20px;
}

.list-card {
  margin-bottom: 20px;
}

.list-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.list-header h3 {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
}

.pagination {
  margin-top: 20px;
  display: flex;
  justify-content: flex-end;
}

.notes {
  padding: 10px;
  background-color: #f5f7fa;
  border-radius: 4px;
  min-height: 60px;
  white-space: pre-wrap;
}
</style>
