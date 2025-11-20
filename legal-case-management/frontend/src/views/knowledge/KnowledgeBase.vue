<template>
  <div class="knowledge-base-container">
    <el-card class="header-card">
      <div class="header-content">
        <h2>案例知识库</h2>
        <el-button type="primary" @click="handleCreate">
          <el-icon><Plus /></el-icon>
          添加案例
        </el-button>
      </div>
    </el-card>

    <!-- 搜索和分类 -->
    <el-card class="search-card">
      <el-form :model="searchForm" :inline="true">
        <el-form-item label="关键词">
          <el-input
            v-model="searchForm.keywords"
            placeholder="请输入关键词"
            clearable
            style="width: 200px"
          />
        </el-form-item>

        <el-form-item label="案由">
          <el-select
            v-model="searchForm.case_cause"
            placeholder="请选择案由"
            clearable
            style="width: 200px"
          >
            <el-option
              v-for="cause in caseCauseOptions"
              :key="cause"
              :label="cause"
              :value="cause"
            />
          </el-select>
        </el-form-item>

        <el-form-item label="争议焦点">
          <el-input
            v-model="searchForm.dispute_focus"
            placeholder="请输入争议焦点"
            clearable
            style="width: 200px"
          />
        </el-form-item>

        <el-form-item label="案件结果">
          <el-select
            v-model="searchForm.case_result"
            placeholder="请选择案件结果"
            clearable
            style="width: 150px"
          >
            <el-option label="胜诉" value="胜诉" />
            <el-option label="部分胜诉" value="部分胜诉" />
            <el-option label="败诉" value="败诉" />
            <el-option label="调解" value="调解" />
            <el-option label="撤诉" value="撤诉" />
          </el-select>
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

    <!-- 案由分类统计 -->
    <el-card v-loading="statsLoading" class="stats-card">
      <h3>案由分类统计</h3>
      <div class="stats-list">
        <el-tag
          v-for="stat in statistics"
          :key="stat.case_cause"
          class="stat-tag"
          :type="searchForm.case_cause === stat.case_cause ? 'primary' : 'info'"
          @click="handleFilterByCause(stat.case_cause)"
        >
          {{ stat.case_cause }} ({{ stat.count }})
        </el-tag>
      </div>
    </el-card>

    <!-- 知识列表 -->
    <el-card v-loading="loading" class="list-card">
      <div class="knowledge-list">
        <div
          v-for="item in knowledgeList"
          :key="item.id"
          class="knowledge-item"
          @click="handleViewDetail(item)"
        >
          <div class="item-header">
            <h3>{{ item.case_cause }}</h3>
            <div class="item-actions">
              <el-tag v-if="item.case_result" type="success" size="small">
                {{ item.case_result }}
              </el-tag>
              <el-button type="primary" link @click.stop="handleEdit(item)">
                编辑
              </el-button>
              <el-button type="danger" link @click.stop="handleDelete(item)">
                删除
              </el-button>
            </div>
          </div>

          <div class="item-content">
            <div class="content-row">
              <span class="label">争议焦点：</span>
              <span class="value">{{ item.dispute_focus || '无' }}</span>
            </div>
            <div class="content-row">
              <span class="label">法律问题：</span>
              <span class="value">{{ item.legal_issues || '无' }}</span>
            </div>
            <div v-if="item.keywords" class="content-row">
              <span class="label">关键词：</span>
              <div class="tags">
                <el-tag
                  v-for="keyword in parseKeywords(item.keywords)"
                  :key="keyword"
                  size="small"
                  class="keyword-tag"
                >
                  {{ keyword }}
                </el-tag>
              </div>
            </div>
          </div>

          <div class="item-footer">
            <span class="footer-info">创建时间：{{ formatDate(item.created_at) }}</span>
            <span v-if="item.win_rate_reference" class="footer-info">
              胜诉率参考：{{ item.win_rate_reference }}
            </span>
          </div>
        </div>

        <el-empty v-if="!loading && knowledgeList.length === 0" description="暂无案例知识" />
      </div>

      <!-- 分页 -->
      <div v-if="knowledgeList.length > 0" class="pagination">
        <el-pagination
          v-model:current-page="pagination.page"
          v-model:page-size="pagination.limit"
          :page-sizes="[10, 20, 50]"
          :total="pagination.total"
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="handleSearch"
          @current-change="handleSearch"
        />
      </div>
    </el-card>

    <!-- 详情对话框 -->
    <el-dialog
      v-model="detailDialogVisible"
      title="案例详情"
      width="900px"
      destroy-on-close
    >
      <div v-if="currentKnowledge" class="detail-content">
        <el-descriptions :column="2" border>
          <el-descriptions-item label="案由">
            {{ currentKnowledge.case_cause }}
          </el-descriptions-item>
          <el-descriptions-item label="案件结果">
            <el-tag v-if="currentKnowledge.case_result" type="success">
              {{ currentKnowledge.case_result }}
            </el-tag>
            <span v-else>-</span>
          </el-descriptions-item>
          <el-descriptions-item label="胜诉率参考" :span="2">
            {{ currentKnowledge.win_rate_reference || '-' }}
          </el-descriptions-item>
        </el-descriptions>

        <el-divider content-position="left">争议焦点</el-divider>
        <div class="detail-section">
          {{ currentKnowledge.dispute_focus || '无' }}
        </div>

        <el-divider content-position="left">法律问题</el-divider>
        <div class="detail-section">
          {{ currentKnowledge.legal_issues || '无' }}
        </div>

        <el-divider content-position="left">法律依据</el-divider>
        <div class="detail-section">
          {{ currentKnowledge.legal_basis || '无' }}
        </div>

        <el-divider content-position="left">关键证据</el-divider>
        <div class="detail-section">
          {{ currentKnowledge.key_evidence || '无' }}
        </div>

        <el-divider content-position="left">案例分析</el-divider>
        <div class="detail-section">
          {{ currentKnowledge.case_analysis || '无' }}
        </div>

        <el-divider content-position="left">实践意义</el-divider>
        <div class="detail-section">
          {{ currentKnowledge.practical_significance || '无' }}
        </div>

        <el-divider content-position="left">关键词</el-divider>
        <div class="detail-section">
          <el-tag
            v-for="keyword in parseKeywords(currentKnowledge.keywords)"
            :key="keyword"
            class="keyword-tag"
          >
            {{ keyword }}
          </el-tag>
          <span v-if="!currentKnowledge.keywords">无</span>
        </div>

        <el-divider content-position="left">标签</el-divider>
        <div class="detail-section">
          <el-tag
            v-for="tag in parseTags(currentKnowledge.tags)"
            :key="tag"
            type="success"
            class="keyword-tag"
          >
            {{ tag }}
          </el-tag>
          <span v-if="!currentKnowledge.tags">无</span>
        </div>
      </div>

      <template #footer>
        <el-button @click="detailDialogVisible = false">关闭</el-button>
        <el-button type="primary" @click="handleEditFromDetail">编辑</el-button>
      </template>
    </el-dialog>

    <!-- 创建/编辑对话框 -->
    <el-dialog
      v-model="formDialogVisible"
      :title="isEdit ? '编辑案例' : '添加案例'"
      width="800px"
      destroy-on-close
    >
      <el-form
        ref="formRef"
        :model="formData"
        :rules="formRules"
        label-width="120px"
      >
        <el-form-item label="案件ID">
          <el-input
            v-model.number="formData.case_id"
            placeholder="可选，关联已有案件"
            type="number"
          />
        </el-form-item>

        <el-form-item label="案由" prop="case_cause">
          <el-input
            v-model="formData.case_cause"
            placeholder="请输入案由"
          />
        </el-form-item>

        <el-form-item label="争议焦点" prop="dispute_focus">
          <el-input
            v-model="formData.dispute_focus"
            type="textarea"
            :rows="3"
            placeholder="请输入争议焦点"
          />
        </el-form-item>

        <el-form-item label="法律问题">
          <el-input
            v-model="formData.legal_issues"
            type="textarea"
            :rows="3"
            placeholder="请输入法律问题"
          />
        </el-form-item>

        <el-form-item label="案件结果">
          <el-select v-model="formData.case_result" placeholder="请选择案件结果" style="width: 100%">
            <el-option label="胜诉" value="胜诉" />
            <el-option label="部分胜诉" value="部分胜诉" />
            <el-option label="败诉" value="败诉" />
            <el-option label="调解" value="调解" />
            <el-option label="撤诉" value="撤诉" />
          </el-select>
        </el-form-item>

        <el-form-item label="关键证据">
          <el-input
            v-model="formData.key_evidence"
            type="textarea"
            :rows="3"
            placeholder="请输入关键证据"
          />
        </el-form-item>

        <el-form-item label="法律依据">
          <el-input
            v-model="formData.legal_basis"
            type="textarea"
            :rows="3"
            placeholder="请输入法律依据"
          />
        </el-form-item>

        <el-form-item label="案例分析">
          <el-input
            v-model="formData.case_analysis"
            type="textarea"
            :rows="4"
            placeholder="请输入案例分析"
          />
        </el-form-item>

        <el-form-item label="实践意义">
          <el-input
            v-model="formData.practical_significance"
            type="textarea"
            :rows="3"
            placeholder="请输入实践意义"
          />
        </el-form-item>

        <el-form-item label="关键词">
          <el-input
            v-model="formData.keywords"
            placeholder="多个关键词用逗号分隔"
          />
        </el-form-item>

        <el-form-item label="标签">
          <el-input
            v-model="formData.tags"
            placeholder="多个标签用逗号分隔"
          />
        </el-form-item>

        <el-form-item label="胜诉率参考">
          <el-input
            v-model="formData.win_rate_reference"
            placeholder="例如：70%"
          />
        </el-form-item>
      </el-form>

      <template #footer>
        <el-button @click="formDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleSubmit" :loading="submitting">
          确定
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox, type FormInstance, type FormRules } from 'element-plus'
import { Plus, Search, Refresh } from '@element-plus/icons-vue'
import { knowledgeApi } from '@/api/knowledge'

const loading = ref(false)
const statsLoading = ref(false)
const submitting = ref(false)
const detailDialogVisible = ref(false)
const formDialogVisible = ref(false)
const isEdit = ref(false)
const knowledgeList = ref<any[]>([])
const statistics = ref<any[]>([])
const currentKnowledge = ref<any>(null)
const formRef = ref<FormInstance>()

const caseCauseOptions = [
  '买卖合同纠纷',
  '借款合同纠纷',
  '劳动争议',
  '房屋买卖合同纠纷',
  '租赁合同纠纷',
  '建设工程施工合同纠纷',
  '股权转让纠纷',
  '侵权责任纠纷',
  '婚姻家庭纠纷',
  '继承纠纷'
]

const searchForm = reactive({
  keywords: '',
  case_cause: '',
  dispute_focus: '',
  case_result: ''
})

const pagination = reactive({
  page: 1,
  limit: 10,
  total: 0
})

const formData = reactive({
  id: undefined as number | undefined,
  case_id: undefined as number | undefined,
  case_cause: '',
  dispute_focus: '',
  legal_issues: '',
  case_result: '',
  key_evidence: '',
  legal_basis: '',
  case_analysis: '',
  practical_significance: '',
  keywords: '',
  tags: '',
  win_rate_reference: ''
})

const formRules: FormRules = {
  case_cause: [
    { required: true, message: '请输入案由', trigger: 'blur' }
  ],
  dispute_focus: [
    { required: true, message: '请输入争议焦点', trigger: 'blur' }
  ]
}

const parseKeywords = (keywords: string) => {
  if (!keywords) return []
  return keywords.split(',').map(k => k.trim()).filter(k => k)
}

const parseTags = (tags: string) => {
  if (!tags) return []
  return tags.split(',').map(t => t.trim()).filter(t => t)
}

const formatDate = (dateStr: string) => {
  if (!dateStr) return '-'
  return new Date(dateStr).toLocaleDateString('zh-CN')
}

const loadKnowledgeList = async () => {
  try {
    loading.value = true

    const params = {
      page: pagination.page,
      limit: pagination.limit,
      ...searchForm
    }

    const response = await knowledgeApi.getList(params)
    knowledgeList.value = response.data.knowledge || []
    pagination.total = response.data.pagination?.total || 0
  } catch (error: any) {
    ElMessage.error(error.response?.data?.error?.message || '加载知识库失败')
  } finally {
    loading.value = false
  }
}

const loadStatistics = async () => {
  try {
    statsLoading.value = true
    const response = await knowledgeApi.getList({ limit: 1000 })
    
    // 手动统计案由分类
    const causeMap = new Map<string, number>()
    const knowledge = response.data.knowledge || []
    
    knowledge.forEach((item: any) => {
      const cause = item.case_cause
      causeMap.set(cause, (causeMap.get(cause) || 0) + 1)
    })

    statistics.value = Array.from(causeMap.entries())
      .map(([case_cause, count]) => ({ case_cause, count }))
      .sort((a, b) => b.count - a.count)
  } catch (error: any) {
    console.error('加载统计数据失败:', error)
  } finally {
    statsLoading.value = false
  }
}

const handleSearch = () => {
  pagination.page = 1
  loadKnowledgeList()
}

const handleReset = () => {
  Object.assign(searchForm, {
    keywords: '',
    case_cause: '',
    dispute_focus: '',
    case_result: ''
  })
  handleSearch()
}

const handleFilterByCause = (cause: string) => {
  searchForm.case_cause = searchForm.case_cause === cause ? '' : cause
  handleSearch()
}

const handleViewDetail = (item: any) => {
  currentKnowledge.value = item
  detailDialogVisible.value = true
}

const handleCreate = () => {
  isEdit.value = false
  resetForm()
  formDialogVisible.value = true
}

const handleEdit = (item: any) => {
  isEdit.value = true
  Object.assign(formData, item)
  formDialogVisible.value = true
}

const handleEditFromDetail = () => {
  detailDialogVisible.value = false
  handleEdit(currentKnowledge.value)
}

const handleDelete = async (item: any) => {
  try {
    await ElMessageBox.confirm('确定要删除这条案例知识吗？', '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })

    await knowledgeApi.delete(item.id)
    ElMessage.success('删除成功')
    await loadKnowledgeList()
    await loadStatistics()
  } catch (error: any) {
    if (error !== 'cancel') {
      ElMessage.error(error.response?.data?.error?.message || '删除失败')
    }
  }
}

const handleSubmit = async () => {
  if (!formRef.value) return

  await formRef.value.validate(async (valid) => {
    if (!valid) return

    try {
      submitting.value = true

      if (isEdit.value && formData.id) {
        await knowledgeApi.update(formData.id, formData)
        ElMessage.success('更新成功')
      } else {
        await knowledgeApi.create(formData)
        ElMessage.success('创建成功')
      }

      formDialogVisible.value = false
      await loadKnowledgeList()
      await loadStatistics()
    } catch (error: any) {
      ElMessage.error(error.response?.data?.error?.message || '操作失败')
    } finally {
      submitting.value = false
    }
  })
}

const resetForm = () => {
  Object.assign(formData, {
    id: undefined,
    case_id: undefined,
    case_cause: '',
    dispute_focus: '',
    legal_issues: '',
    case_result: '',
    key_evidence: '',
    legal_basis: '',
    case_analysis: '',
    practical_significance: '',
    keywords: '',
    tags: '',
    win_rate_reference: ''
  })
}

onMounted(async () => {
  await loadKnowledgeList()
  await loadStatistics()
})
</script>

<style scoped>
.knowledge-base-container {
  padding: 20px;
}

.header-card {
  margin-bottom: 20px;
}

.header-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.header-content h2 {
  margin: 0;
  font-size: 20px;
  font-weight: 600;
}

.search-card {
  margin-bottom: 20px;
}

.stats-card {
  margin-bottom: 20px;
}

.stats-card h3 {
  margin: 0 0 15px 0;
  font-size: 16px;
  font-weight: 600;
}

.stats-list {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.stat-tag {
  cursor: pointer;
  transition: all 0.3s;
}

.stat-tag:hover {
  transform: translateY(-2px);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.list-card {
  margin-bottom: 20px;
}

.knowledge-list {
  min-height: 400px;
}

.knowledge-item {
  padding: 20px;
  margin-bottom: 15px;
  border: 1px solid #e4e7ed;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.3s;
}

.knowledge-item:hover {
  border-color: #409eff;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
}

.item-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
}

.item-header h3 {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
  color: #303133;
}

.item-actions {
  display: flex;
  align-items: center;
  gap: 10px;
}

.item-content {
  margin-bottom: 15px;
}

.content-row {
  display: flex;
  margin-bottom: 10px;
  line-height: 1.6;
}

.content-row .label {
  flex-shrink: 0;
  width: 100px;
  color: #909399;
  font-size: 14px;
}

.content-row .value {
  flex: 1;
  color: #606266;
  font-size: 14px;
}

.tags {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.keyword-tag {
  margin-right: 8px;
  margin-bottom: 8px;
}

.item-footer {
  display: flex;
  justify-content: space-between;
  padding-top: 10px;
  border-top: 1px solid #f0f0f0;
}

.footer-info {
  font-size: 12px;
  color: #909399;
}

.pagination {
  margin-top: 20px;
  display: flex;
  justify-content: flex-end;
}

.detail-content {
  max-height: 600px;
  overflow-y: auto;
}

.detail-section {
  padding: 15px;
  background-color: #f5f7fa;
  border-radius: 4px;
  line-height: 1.8;
  white-space: pre-wrap;
  min-height: 60px;
}
</style>
