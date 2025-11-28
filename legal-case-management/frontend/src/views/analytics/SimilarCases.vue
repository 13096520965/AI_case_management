<template>
  <div class="similar-cases-container">
    <PageHeader title="类案检索" subtitle="基于案件要素的智能相似案例匹配" />
    
    <!-- Search Form -->
    <el-card shadow="hover" class="search-card">
      <template #header>
        <div class="card-header">
          <span>检索条件</span>
          <el-tag type="info" size="small">模拟检索</el-tag>
        </div>
      </template>
      
      <el-form :model="searchForm" label-width="120px" @submit.prevent="handleSearch">
        <el-row :gutter="20">
          <el-col :xs="24" :md="12">
            <el-form-item label="案件类型" required>
              <el-select v-model="searchForm.caseType" placeholder="请选择案件类型" style="width: 100%">
                <el-option label="民事案件" value="民事案件" />
                <el-option label="刑事案件" value="刑事案件" />
                <el-option label="行政案件" value="行政案件" />
                <el-option label="劳动仲裁" value="劳动仲裁" />
              </el-select>
            </el-form-item>
          </el-col>
          
          <el-col :xs="24" :md="12">
            <el-form-item label="案由" required>
              <el-input 
                v-model="searchForm.caseCause" 
                placeholder="请输入案由，如：买卖合同纠纷"
              />
            </el-form-item>
          </el-col>
          
          <el-col :xs="24" :md="12">
            <el-form-item label="标的额">
              <el-input 
                v-model.number="searchForm.targetAmount" 
                type="number"
                placeholder="请输入标的额（元）"
              >
                <template #append>元</template>
              </el-input>
            </el-form-item>
          </el-col>
          
          <el-col :xs="24" :md="12">
            <el-form-item label="关键词">
              <el-select
                v-model="searchForm.keywords"
                multiple
                filterable
                allow-create
                placeholder="输入关键词后按回车添加"
                style="width: 100%"
              >
                <el-option label="违约" value="违约" />
                <el-option label="赔偿" value="赔偿" />
                <el-option label="解除合同" value="解除合同" />
                <el-option label="履行义务" value="履行义务" />
              </el-select>
            </el-form-item>
          </el-col>
          
          <el-col :xs="24">
            <el-form-item label="争议焦点">
              <el-input 
                v-model="searchForm.disputeFocus" 
                type="textarea"
                :rows="3"
                placeholder="请描述案件的主要争议焦点"
              />
            </el-form-item>
          </el-col>
        </el-row>
        
        <el-form-item>
          <el-button type="primary" @click="handleSearch" :loading="searching">
            <el-icon><Search /></el-icon>
            开始检索
          </el-button>
          <el-button @click="resetSearch">
            <el-icon><Refresh /></el-icon>
            重置
          </el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <!-- Search Results -->
    <el-card v-if="searchResults.length > 0" shadow="hover" class="results-card">
      <template #header>
        <div class="card-header">
          <span>检索结果</span>
          <el-tag type="success">找到 {{ searchResults.length }} 个相似案例</el-tag>
        </div>
      </template>
      
      <!-- Win Rate Analysis -->
      <el-alert 
        :title="`胜诉率分析：相似案例平均胜诉率为 ${averageWinRate}%`"
        type="success"
        :closable="false"
        class="analysis-alert"
      >
        <template #default>
          <div class="analysis-content">
            <div class="analysis-item">
              <span class="label">原告胜诉：</span>
              <span class="value">{{ winRateStats.plaintiff }}%</span>
            </div>
            <div class="analysis-item">
              <span class="label">被告胜诉：</span>
              <span class="value">{{ winRateStats.defendant }}%</span>
            </div>
            <div class="analysis-item">
              <span class="label">部分胜诉：</span>
              <span class="value">{{ winRateStats.partial }}%</span>
            </div>
            <div class="analysis-item">
              <span class="label">调解结案：</span>
              <span class="value">{{ winRateStats.mediation }}%</span>
            </div>
          </div>
        </template>
      </el-alert>
      
      <!-- Charts -->
      <el-row :gutter="20" class="charts-row">
        <el-col :xs="24" :md="12">
          <el-card shadow="never">
            <template #header>
              <span>判决结果分布</span>
            </template>
            <div ref="resultChartRef" class="chart-container"></div>
          </el-card>
        </el-col>
        
        <el-col :xs="24" :md="12">
          <el-card shadow="never">
            <template #header>
              <span>标的额分布</span>
            </template>
            <div ref="amountChartRef" class="chart-container"></div>
          </el-card>
        </el-col>
      </el-row>
      
      <!-- Case List -->
      <el-divider content-position="left">相似案例列表</el-divider>
      
      <div class="case-list">
        <div 
          v-for="(caseItem, index) in searchResults" 
          :key="index"
          class="case-item"
        >
          <div class="case-header">
            <div class="case-title">
              <el-tag :type="getSimilarityType(caseItem.similarity)" size="small" effect="dark">
                相似度 {{ caseItem.similarity }}%
              </el-tag>
              <span class="case-number">{{ caseItem.caseNumber }}</span>
            </div>
            <el-button type="primary" size="small" text @click="viewCaseDetail(caseItem)">
              查看详情
            </el-button>
          </div>
          
          <div class="case-content">
            <el-descriptions :column="2" size="small">
              <el-descriptions-item label="案由">{{ caseItem.caseCause }}</el-descriptions-item>
              <el-descriptions-item label="案件类型">{{ caseItem.caseType }}</el-descriptions-item>
              <el-descriptions-item label="标的额">{{ formatAmount(caseItem.targetAmount) }}</el-descriptions-item>
              <el-descriptions-item label="判决结果">
                <el-tag :type="getResultType(caseItem.result)" size="small">
                  {{ caseItem.result }}
                </el-tag>
              </el-descriptions-item>
              <el-descriptions-item label="审理法院">{{ caseItem.court }}</el-descriptions-item>
              <el-descriptions-item label="结案日期">{{ caseItem.closureDate }}</el-descriptions-item>
            </el-descriptions>
            
            <div class="case-summary">
              <div class="summary-label">案情摘要：</div>
              <div class="summary-text">{{ caseItem.summary }}</div>
            </div>
            
            <div class="case-tags">
              <el-tag 
                v-for="tag in caseItem.tags" 
                :key="tag"
                size="small"
                class="tag-item"
              >
                {{ tag }}
              </el-tag>
            </div>
          </div>
        </div>
      </div>
    </el-card>
    
    <!-- Empty State -->
    <el-card v-else-if="hasSearched" shadow="hover" class="empty-card">
      <TableEmpty description="未找到相似案例，请调整检索条件后重试" />
    </el-card>

    <!-- Case Detail Dialog -->
    <el-dialog 
      v-model="detailDialogVisible" 
      :title="selectedCase?.caseNumber"
      width="80%"
      top="5vh"
    >
      <div v-if="selectedCase" class="detail-content">
        <el-descriptions :column="2" border>
          <el-descriptions-item label="案号">{{ selectedCase.caseNumber }}</el-descriptions-item>
          <el-descriptions-item label="相似度">
            <el-tag :type="getSimilarityType(selectedCase.similarity)" size="small">
              {{ selectedCase.similarity }}%
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="案件类型">{{ selectedCase.caseType }}</el-descriptions-item>
          <el-descriptions-item label="案由">{{ selectedCase.caseCause }}</el-descriptions-item>
          <el-descriptions-item label="标的额">{{ formatAmount(selectedCase.targetAmount) }}</el-descriptions-item>
          <el-descriptions-item label="判决结果">
            <el-tag :type="getResultType(selectedCase.result)" size="small">
              {{ selectedCase.result }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="审理法院">{{ selectedCase.court }}</el-descriptions-item>
          <el-descriptions-item label="结案日期">{{ selectedCase.closureDate }}</el-descriptions-item>
        </el-descriptions>
        
        <el-divider content-position="left">案情摘要</el-divider>
        <div class="detail-section">{{ selectedCase.summary }}</div>
        
        <el-divider content-position="left">争议焦点</el-divider>
        <div class="detail-section">{{ selectedCase.disputeFocus }}</div>
        
        <el-divider content-position="left">裁判要旨</el-divider>
        <div class="detail-section">{{ selectedCase.judgmentSummary }}</div>
        
        <el-divider content-position="left">参考价值</el-divider>
        <div class="detail-section">{{ selectedCase.referenceValue }}</div>
      </div>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { Search, Refresh } from '@element-plus/icons-vue'
import * as echarts from 'echarts'
import type { ECharts } from 'echarts'
import { analyticsApi } from '@/api/analytics'
import { ElMessage } from 'element-plus'
import PageHeader from '@/components/common/PageHeader.vue'
import TableEmpty from '@/components/common/TableEmpty.vue'

interface SearchForm {
  caseType: string
  caseCause: string
  targetAmount: number | null
  keywords: string[]
  disputeFocus: string
}

interface SimilarCase {
  caseNumber: string
  caseType: string
  caseCause: string
  targetAmount: number
  result: string
  court: string
  closureDate: string
  summary: string
  disputeFocus: string
  judgmentSummary: string
  referenceValue: string
  similarity: number
  tags: string[]
}

const searchForm = ref<SearchForm>({
  caseType: '',
  caseCause: '',
  targetAmount: null,
  keywords: [],
  disputeFocus: ''
})

const searching = ref(false)
const hasSearched = ref(false)
const searchResults = ref<SimilarCase[]>([])
const selectedCase = ref<SimilarCase | null>(null)
const detailDialogVisible = ref(false)

const resultChartRef = ref<HTMLElement>()
const amountChartRef = ref<HTMLElement>()

let resultChart: ECharts | null = null
let amountChart: ECharts | null = null

const averageWinRate = computed(() => {
  if (searchResults.value.length === 0) return 0
  
  const winCount = searchResults.value.filter(c => 
    c.result === '原告胜诉' || c.result === '部分胜诉'
  ).length
  
  return Math.round((winCount / searchResults.value.length) * 100)
})

const winRateStats = computed(() => {
  if (searchResults.value.length === 0) {
    return { plaintiff: 0, defendant: 0, partial: 0, mediation: 0 }
  }
  
  const total = searchResults.value.length
  const plaintiff = searchResults.value.filter(c => c.result === '原告胜诉').length
  const defendant = searchResults.value.filter(c => c.result === '被告胜诉').length
  const partial = searchResults.value.filter(c => c.result === '部分胜诉').length
  const mediation = searchResults.value.filter(c => c.result === '调解结案').length
  
  return {
    plaintiff: Math.round((plaintiff / total) * 100),
    defendant: Math.round((defendant / total) * 100),
    partial: Math.round((partial / total) * 100),
    mediation: Math.round((mediation / total) * 100)
  }
})

const formatAmount = (amount: number = 0): string => {
  if (amount >= 100000000) {
    return (amount / 100000000).toFixed(2) + '亿'
  } else if (amount >= 10000) {
    return (amount / 10000).toFixed(2) + '万'
  }
  return amount.toFixed(2)
}

const getSimilarityType = (similarity: number): string => {
  if (similarity >= 80) return 'success'
  if (similarity >= 60) return 'warning'
  return 'info'
}

const getResultType = (result: string): string => {
  if (result === '原告胜诉') return 'success'
  if (result === '被告胜诉') return 'danger'
  if (result === '部分胜诉') return 'warning'
  return 'info'
}

const handleSearch = async () => {
  if (!searchForm.value.caseType || !searchForm.value.caseCause?.trim()) {
    ElMessage.warning('请填写案件类型和案由')
    return
  }
  
  searching.value = true
  hasSearched.value = true
  
  try {
    const params = {
      caseType: searchForm.value.caseType,
      caseCause: searchForm.value.caseCause?.trim() || '',
      keywords: searchForm.value.keywords,
      targetAmount: searchForm.value.targetAmount || undefined
    }
    
    const response = await analyticsApi.searchSimilarCases(params)
    searchResults.value = response.data || []
    
    if (searchResults.value.length > 0) {
      ElMessage.success(`找到 ${searchResults.value.length} 个相似案例`)
      
      // Wait for DOM update
      await new Promise(resolve => setTimeout(resolve, 100))
      initResultChart()
      initAmountChart()
    } else {
      ElMessage.info('未找到相似案例')
    }
  } catch (error) {
    console.error('Failed to search similar cases:', error)
    ElMessage.error('检索失败，请稍后重试')
  } finally {
    searching.value = false
  }
}

const resetSearch = () => {
  searchForm.value = {
    caseType: '',
    caseCause: '',
    targetAmount: null,
    keywords: [],
    disputeFocus: ''
  }
  searchResults.value = []
  hasSearched.value = false
}

const viewCaseDetail = (caseItem: SimilarCase) => {
  selectedCase.value = caseItem
  detailDialogVisible.value = true
}

const initResultChart = () => {
  if (!resultChartRef.value) return
  
  if (!resultChart) {
    resultChart = echarts.init(resultChartRef.value)
  }
  
  const resultCounts: Record<string, number> = {}
  searchResults.value.forEach(c => {
    resultCounts[c.result] = (resultCounts[c.result] || 0) + 1
  })
  
  const data = Object.entries(resultCounts).map(([name, value]) => ({
    name,
    value
  }))
  
  const option = {
    tooltip: {
      trigger: 'item',
      formatter: '{a} <br/>{b}: {c} ({d}%)'
    },
    legend: {
      orient: 'vertical',
      left: 'left'
    },
    series: [
      {
        name: '判决结果',
        type: 'pie',
        radius: '60%',
        data: data,
        emphasis: {
          itemStyle: {
            shadowBlur: 10,
            shadowOffsetX: 0,
            shadowColor: 'rgba(0, 0, 0, 0.5)'
          }
        }
      }
    ],
    color: ['#67c23a', '#f56c6c', '#e6a23c', '#409eff']
  }
  
  resultChart.setOption(option)
}

const initAmountChart = () => {
  if (!amountChartRef.value) return
  
  if (!amountChart) {
    amountChart = echarts.init(amountChartRef.value)
  }
  
  // Group by amount ranges
  const ranges = [
    { name: '10万以下', min: 0, max: 100000, count: 0 },
    { name: '10-50万', min: 100000, max: 500000, count: 0 },
    { name: '50-100万', min: 500000, max: 1000000, count: 0 },
    { name: '100-500万', min: 1000000, max: 5000000, count: 0 },
    { name: '500万以上', min: 5000000, max: Infinity, count: 0 }
  ]
  
  searchResults.value.forEach(c => {
    const range = ranges.find(r => c.targetAmount >= r.min && c.targetAmount < r.max)
    if (range) range.count++
  })
  
  const option = {
    tooltip: {
      trigger: 'axis',
      axisPointer: {
        type: 'shadow'
      }
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '3%',
      containLabel: true
    },
    xAxis: {
      type: 'category',
      data: ranges.map(r => r.name)
    },
    yAxis: {
      type: 'value',
      name: '案件数量'
    },
    series: [
      {
        name: '案件数量',
        type: 'bar',
        data: ranges.map(r => r.count),
        itemStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: '#83bff6' },
            { offset: 0.5, color: '#188df0' },
            { offset: 1, color: '#188df0' }
          ])
        }
      }
    ]
  }
  
  amountChart.setOption(option)
}

const handleResize = () => {
  resultChart?.resize()
  amountChart?.resize()
}

onMounted(() => {
  window.addEventListener('resize', handleResize)
})

onUnmounted(() => {
  window.removeEventListener('resize', handleResize)
  resultChart?.dispose()
  amountChart?.dispose()
})
</script>

<style scoped>
.similar-cases-container {
  padding: 20px;
}

.search-card {
  margin-bottom: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-weight: bold;
  font-size: 16px;
}

.results-card {
  margin-bottom: 20px;
}

.analysis-alert {
  margin-bottom: 20px;
}

.analysis-content {
  display: flex;
  gap: 30px;
  margin-top: 10px;
  flex-wrap: wrap;
}

.analysis-item {
  display: flex;
  align-items: center;
  gap: 8px;
}

.analysis-item .label {
  color: #606266;
  font-size: 14px;
}

.analysis-item .value {
  font-weight: bold;
  font-size: 16px;
  color: #303133;
}

.charts-row {
  margin-bottom: 20px;
}

.chart-container {
  width: 100%;
  height: 300px;
}

.case-list {
  margin-top: 20px;
}

.case-item {
  border: 1px solid #ebeef5;
  border-radius: 4px;
  padding: 20px;
  margin-bottom: 15px;
  transition: all 0.3s;
}

.case-item:hover {
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
  border-color: #409eff;
}

.case-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
}

.case-title {
  display: flex;
  align-items: center;
  gap: 10px;
}

.case-number {
  font-size: 16px;
  font-weight: bold;
  color: #303133;
}

.case-content {
  margin-top: 15px;
}

.case-summary {
  margin: 15px 0;
  padding: 15px;
  background-color: #f5f7fa;
  border-radius: 4px;
}

.summary-label {
  font-weight: bold;
  color: #606266;
  margin-bottom: 8px;
}

.summary-text {
  color: #303133;
  line-height: 1.6;
}

.case-tags {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  margin-top: 10px;
}

.tag-item {
  margin: 0;
}

.empty-card {
  margin-top: 20px;
}

.detail-content {
  max-height: 70vh;
  overflow-y: auto;
}

.detail-section {
  padding: 15px;
  background-color: #f5f7fa;
  border-radius: 4px;
  line-height: 1.8;
  color: #303133;
  margin-bottom: 10px;
}

@media (max-width: 768px) {
  .analysis-content {
    flex-direction: column;
    gap: 15px;
  }
  
  .case-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 10px;
  }
}
</style>
