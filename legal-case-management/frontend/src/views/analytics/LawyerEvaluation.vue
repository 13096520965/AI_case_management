<template>
  <div class="lawyer-evaluation-container">
    <PageHeader title="律师评价" subtitle="律师绩效评估与综合评分" />
    
    <!-- Filter Section -->
    <el-card shadow="never" class="filter-card">
      <el-form :inline="true" :model="filterForm" class="filter-form">
        <el-form-item label="时间范围">
          <el-date-picker
            v-model="dateRange"
            type="daterange"
            range-separator="至"
            start-placeholder="开始日期"
            end-placeholder="结束日期"
            format="YYYY-MM-DD"
            value-format="YYYY-MM-DD"
            @change="handleDateRangeChange"
          />
        </el-form-item>
        
        <el-form-item>
          <el-button type="primary" @click="loadLawyersList">
            <el-icon><Search /></el-icon>
            查询
          </el-button>
          <el-button @click="resetFilter">
            <el-icon><Refresh /></el-icon>
            重置
          </el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <!-- Lawyers List -->
    <el-card shadow="hover" class="lawyers-card">
      <template #header>
        <div class="card-header">
          <span>律师评价列表</span>
          <el-tag>共 {{ lawyersList.length }} 位律师</el-tag>
        </div>
      </template>
      
      <el-table 
        :data="lawyersList" 
        v-loading="loading"
        stripe
        @row-click="handleRowClick"
        style="cursor: pointer;"
      >
        <el-table-column prop="name" label="律师姓名" width="120" />
        <el-table-column prop="totalCases" label="办案数量" width="100" align="center" />
        <el-table-column prop="winRate" label="胜诉率" width="100" align="center">
          <template #default="{ row }">
            <el-tag :type="getWinRateType(row.winRate)" size="small">
              {{ row.winRate }}%
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="avgDuration" label="平均办案周期(天)" width="150" align="center" />
        <el-table-column prop="totalAmount" label="标的额总计" width="150" align="right">
          <template #default="{ row }">
            {{ formatAmount(row.totalAmount) }}
          </template>
        </el-table-column>
        <el-table-column prop="score" label="综合评分" width="120" align="center">
          <template #default="{ row }">
            <el-rate 
              v-model="row.score" 
              disabled 
              show-score 
              text-color="#ff9900"
              :max="5"
            />
          </template>
        </el-table-column>
        <el-table-column label="评价等级" width="120" align="center">
          <template #default="{ row }">
            <el-tag :type="getScoreType(row.score)" effect="dark">
              {{ getScoreLevel(row.score) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="150" align="center" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" size="small" @click.stop="viewDetail(row)">
              查看详情
            </el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <!-- Lawyer Detail Dialog -->
    <el-dialog 
      v-model="detailDialogVisible" 
      :title="`${selectedLawyer?.name} - 评价详情`"
      width="90%"
      top="5vh"
    >
      <div v-if="selectedLawyer" class="detail-content">
        <!-- Summary Cards -->
        <el-row :gutter="20" class="summary-row">
          <el-col :xs="24" :sm="12" :md="6">
            <el-card shadow="hover" class="summary-card">
              <div class="summary-item">
                <div class="summary-icon cases-icon">
                  <el-icon :size="24"><Folder /></el-icon>
                </div>
                <div class="summary-info">
                  <div class="summary-value">{{ selectedLawyer.totalCases }}</div>
                  <div class="summary-label">办案数量</div>
                </div>
              </div>
            </el-card>
          </el-col>
          
          <el-col :xs="24" :sm="12" :md="6">
            <el-card shadow="hover" class="summary-card">
              <div class="summary-item">
                <div class="summary-icon rate-icon">
                  <el-icon :size="24"><TrendCharts /></el-icon>
                </div>
                <div class="summary-info">
                  <div class="summary-value">{{ selectedLawyer.winRate }}%</div>
                  <div class="summary-label">胜诉率</div>
                </div>
              </div>
            </el-card>
          </el-col>
          
          <el-col :xs="24" :sm="12" :md="6">
            <el-card shadow="hover" class="summary-card">
              <div class="summary-item">
                <div class="summary-icon duration-icon">
                  <el-icon :size="24"><Timer /></el-icon>
                </div>
                <div class="summary-info">
                  <div class="summary-value">{{ selectedLawyer.avgDuration }}</div>
                  <div class="summary-label">平均周期(天)</div>
                </div>
              </div>
            </el-card>
          </el-col>
          
          <el-col :xs="24" :sm="12" :md="6">
            <el-card shadow="hover" class="summary-card">
              <div class="summary-item">
                <div class="summary-icon amount-icon">
                  <el-icon :size="24"><Money /></el-icon>
                </div>
                <div class="summary-info">
                  <div class="summary-value">{{ formatAmount(selectedLawyer.totalAmount) }}</div>
                  <div class="summary-label">标的额总计</div>
                </div>
              </div>
            </el-card>
          </el-col>
        </el-row>

        <!-- Evaluation Dimensions -->
        <el-row :gutter="20" class="charts-row">
          <el-col :xs="24" :md="12">
            <el-card shadow="hover">
              <template #header>
                <div class="card-header">
                  <span>评价维度雷达图</span>
                </div>
              </template>
              <div ref="radarChartRef" class="chart-container"></div>
            </el-card>
          </el-col>
          
          <el-col :xs="24" :md="12">
            <el-card shadow="hover">
              <template #header>
                <div class="card-header">
                  <span>案件类型分布</span>
                </div>
              </template>
              <div ref="caseTypeChartRef" class="chart-container"></div>
            </el-card>
          </el-col>
        </el-row>

        <!-- Performance Trend -->
        <el-row :gutter="20" class="charts-row">
          <el-col :xs="24">
            <el-card shadow="hover">
              <template #header>
                <div class="card-header">
                  <span>办案趋势</span>
                </div>
              </template>
              <div ref="trendChartRef" class="chart-container-large"></div>
            </el-card>
          </el-col>
        </el-row>

        <!-- Evaluation Report -->
        <el-card shadow="hover" class="report-card">
          <template #header>
            <div class="card-header">
              <span>评价报告</span>
              <el-button type="primary" size="small" @click="exportReport">
                <el-icon><Download /></el-icon>
                导出报告
              </el-button>
            </div>
          </template>
          
          <div class="report-content">
            <el-descriptions :column="2" border>
              <el-descriptions-item label="律师姓名">{{ selectedLawyer.name }}</el-descriptions-item>
              <el-descriptions-item label="综合评分">
                <el-rate v-model="selectedLawyer.score" disabled show-score />
              </el-descriptions-item>
              <el-descriptions-item label="评价等级">
                <el-tag :type="getScoreType(selectedLawyer.score)" effect="dark">
                  {{ getScoreLevel(selectedLawyer.score) }}
                </el-tag>
              </el-descriptions-item>
              <el-descriptions-item label="统计周期">
                {{ filterForm.startDate || '全部' }} 至 {{ filterForm.endDate || '全部' }}
              </el-descriptions-item>
            </el-descriptions>
            
            <el-divider content-position="left">评价维度明细</el-divider>
            
            <el-row :gutter="20">
              <el-col :span="12">
                <div class="dimension-item">
                  <div class="dimension-label">专业能力</div>
                  <el-progress 
                    :percentage="selectedLawyer.dimensions?.professional || 0" 
                    :color="getProgressColor(selectedLawyer.dimensions?.professional || 0)"
                  />
                </div>
              </el-col>
              <el-col :span="12">
                <div class="dimension-item">
                  <div class="dimension-label">工作效率</div>
                  <el-progress 
                    :percentage="selectedLawyer.dimensions?.efficiency || 0"
                    :color="getProgressColor(selectedLawyer.dimensions?.efficiency || 0)"
                  />
                </div>
              </el-col>
              <el-col :span="12">
                <div class="dimension-item">
                  <div class="dimension-label">案件质量</div>
                  <el-progress 
                    :percentage="selectedLawyer.dimensions?.quality || 0"
                    :color="getProgressColor(selectedLawyer.dimensions?.quality || 0)"
                  />
                </div>
              </el-col>
              <el-col :span="12">
                <div class="dimension-item">
                  <div class="dimension-label">客户满意度</div>
                  <el-progress 
                    :percentage="selectedLawyer.dimensions?.satisfaction || 0"
                    :color="getProgressColor(selectedLawyer.dimensions?.satisfaction || 0)"
                  />
                </div>
              </el-col>
              <el-col :span="12">
                <div class="dimension-item">
                  <div class="dimension-label">团队协作</div>
                  <el-progress 
                    :percentage="selectedLawyer.dimensions?.teamwork || 0"
                    :color="getProgressColor(selectedLawyer.dimensions?.teamwork || 0)"
                  />
                </div>
              </el-col>
              <el-col :span="12">
                <div class="dimension-item">
                  <div class="dimension-label">创新能力</div>
                  <el-progress 
                    :percentage="selectedLawyer.dimensions?.innovation || 0"
                    :color="getProgressColor(selectedLawyer.dimensions?.innovation || 0)"
                  />
                </div>
              </el-col>
            </el-row>
            
            <el-divider content-position="left">综合评语</el-divider>
            
            <div class="evaluation-text">
              <p>{{ generateEvaluationText() }}</p>
            </div>
          </div>
        </el-card>
      </div>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { 
  Folder, Money, TrendCharts, Timer, Search, Refresh, Download
} from '@element-plus/icons-vue'
import * as echarts from 'echarts'
import type { ECharts } from 'echarts'
import { analyticsApi } from '@/api/analytics'
import { ElMessage } from 'element-plus'
import PageHeader from '@/components/common/PageHeader.vue'

interface FilterForm {
  startDate: string
  endDate: string
}

interface LawyerEvaluation {
  id: number
  name: string
  totalCases: number
  winRate: number
  avgDuration: number
  totalAmount: number
  score: number
  dimensions?: {
    professional: number
    efficiency: number
    quality: number
    satisfaction: number
    teamwork: number
    innovation: number
  }
  caseTypeDistribution?: any[]
  performanceTrend?: any[]
}

const dateRange = ref<[string, string]>()
const filterForm = ref<FilterForm>({
  startDate: '',
  endDate: ''
})

const loading = ref(false)
const lawyersList = ref<LawyerEvaluation[]>([])
const selectedLawyer = ref<LawyerEvaluation | null>(null)
const detailDialogVisible = ref(false)

const radarChartRef = ref<HTMLElement>()
const caseTypeChartRef = ref<HTMLElement>()
const trendChartRef = ref<HTMLElement>()

let radarChart: ECharts | null = null
let caseTypeChart: ECharts | null = null
let trendChart: ECharts | null = null

const formatAmount = (amount: number = 0): string => {
  if (amount >= 100000000) {
    return (amount / 100000000).toFixed(2) + '亿'
  } else if (amount >= 10000) {
    return (amount / 10000).toFixed(2) + '万'
  }
  return amount.toFixed(2)
}

const getWinRateType = (rate: number): string => {
  if (rate >= 80) return 'success'
  if (rate >= 60) return 'warning'
  return 'danger'
}

const getScoreType = (score: number): string => {
  if (score >= 4.5) return 'success'
  if (score >= 3.5) return 'warning'
  return 'danger'
}

const getScoreLevel = (score: number): string => {
  if (score >= 4.5) return '优秀'
  if (score >= 3.5) return '良好'
  if (score >= 2.5) return '合格'
  return '待提升'
}

const getProgressColor = (percentage: number): string => {
  if (percentage >= 80) return '#67c23a'
  if (percentage >= 60) return '#e6a23c'
  return '#f56c6c'
}

const handleDateRangeChange = (value: [string, string] | null) => {
  if (value) {
    filterForm.value.startDate = value[0]
    filterForm.value.endDate = value[1]
  } else {
    filterForm.value.startDate = ''
    filterForm.value.endDate = ''
  }
}

const resetFilter = () => {
  dateRange.value = undefined
  filterForm.value = {
    startDate: '',
    endDate: ''
  }
  loadLawyersList()
}

const loadLawyersList = async () => {
  loading.value = true
  try {
    const params = {
      startDate: filterForm.value.startDate,
      endDate: filterForm.value.endDate
    }
    
    const response = await analyticsApi.getAllLawyersEvaluation(params)
    lawyersList.value = response.data || []
  } catch (error) {
    console.error('Failed to load lawyers list:', error)
    ElMessage.error('加载律师列表失败')
  } finally {
    loading.value = false
  }
}

const handleRowClick = (row: LawyerEvaluation) => {
  viewDetail(row)
}

const viewDetail = async (lawyer: LawyerEvaluation) => {
  selectedLawyer.value = lawyer
  detailDialogVisible.value = true
  
  // Wait for dialog to render
  await new Promise(resolve => setTimeout(resolve, 100))
  
  initRadarChart()
  initCaseTypeChart()
  initTrendChart()
}

const initRadarChart = () => {
  if (!radarChartRef.value || !selectedLawyer.value) return
  
  if (!radarChart) {
    radarChart = echarts.init(radarChartRef.value)
  }
  
  const dimensions = selectedLawyer.value.dimensions || {
    professional: 0,
    efficiency: 0,
    quality: 0,
    satisfaction: 0,
    teamwork: 0,
    innovation: 0
  }
  
  const option = {
    tooltip: {
      trigger: 'item'
    },
    radar: {
      indicator: [
        { name: '专业能力', max: 100 },
        { name: '工作效率', max: 100 },
        { name: '案件质量', max: 100 },
        { name: '客户满意度', max: 100 },
        { name: '团队协作', max: 100 },
        { name: '创新能力', max: 100 }
      ],
      radius: '60%'
    },
    series: [
      {
        name: '评价维度',
        type: 'radar',
        data: [
          {
            value: [
              dimensions.professional,
              dimensions.efficiency,
              dimensions.quality,
              dimensions.satisfaction,
              dimensions.teamwork,
              dimensions.innovation
            ],
            name: selectedLawyer.value.name,
            areaStyle: {
              color: 'rgba(64, 158, 255, 0.3)'
            },
            itemStyle: {
              color: '#409eff'
            }
          }
        ]
      }
    ]
  }
  
  radarChart.setOption(option)
}

const initCaseTypeChart = () => {
  if (!caseTypeChartRef.value || !selectedLawyer.value) return
  
  if (!caseTypeChart) {
    caseTypeChart = echarts.init(caseTypeChartRef.value)
  }
  
  const data = selectedLawyer.value.caseTypeDistribution || []
  
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
        name: '案件类型',
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
    ]
  }
  
  caseTypeChart.setOption(option)
}

const initTrendChart = () => {
  if (!trendChartRef.value || !selectedLawyer.value) return
  
  if (!trendChart) {
    trendChart = echarts.init(trendChartRef.value)
  }
  
  const data = selectedLawyer.value.performanceTrend || []
  
  const option = {
    tooltip: {
      trigger: 'axis'
    },
    legend: {
      data: ['办案数量', '胜诉率']
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '3%',
      containLabel: true
    },
    xAxis: {
      type: 'category',
      boundaryGap: false,
      data: data.map((item: any) => item.period)
    },
    yAxis: [
      {
        type: 'value',
        name: '办案数量'
      },
      {
        type: 'value',
        name: '胜诉率(%)',
        max: 100
      }
    ],
    series: [
      {
        name: '办案数量',
        type: 'line',
        data: data.map((item: any) => item.caseCount),
        smooth: true,
        itemStyle: {
          color: '#409eff'
        }
      },
      {
        name: '胜诉率',
        type: 'line',
        yAxisIndex: 1,
        data: data.map((item: any) => item.winRate),
        smooth: true,
        itemStyle: {
          color: '#67c23a'
        }
      }
    ]
  }
  
  trendChart.setOption(option)
}

const generateEvaluationText = (): string => {
  if (!selectedLawyer.value) return ''
  
  const lawyer = selectedLawyer.value
  const level = getScoreLevel(lawyer.score)
  
  let text = `${lawyer.name}律师在统计周期内共办理案件${lawyer.totalCases}件，`
  text += `胜诉率达到${lawyer.winRate}%，`
  text += `平均办案周期为${lawyer.avgDuration}天，`
  text += `涉及标的额总计${formatAmount(lawyer.totalAmount)}。`
  
  text += `\n\n综合评价等级为"${level}"。`
  
  if (lawyer.score >= 4.5) {
    text += '该律师表现优异，专业能力突出，工作效率高，案件质量优秀，深受客户好评。建议继续保持并发挥示范带头作用。'
  } else if (lawyer.score >= 3.5) {
    text += '该律师表现良好，各项指标均衡发展，具有较强的专业能力和工作责任心。建议在某些维度上继续提升。'
  } else if (lawyer.score >= 2.5) {
    text += '该律师表现合格，基本达到工作要求。建议加强专业学习，提高工作效率，改进案件质量。'
  } else {
    text += '该律师表现有待提升，需要在多个维度上加强改进。建议制定针对性的提升计划，加强培训和指导。'
  }
  
  return text
}

const exportReport = () => {
  ElMessage.success('评价报告导出功能开发中...')
}

const handleResize = () => {
  radarChart?.resize()
  caseTypeChart?.resize()
  trendChart?.resize()
}

onMounted(() => {
  loadLawyersList()
  window.addEventListener('resize', handleResize)
})

onUnmounted(() => {
  window.removeEventListener('resize', handleResize)
  radarChart?.dispose()
  caseTypeChart?.dispose()
  trendChart?.dispose()
})
</script>

<style scoped>
.lawyer-evaluation-container {
  padding: 20px;
}

.filter-card {
  margin-bottom: 20px;
}

.filter-form {
  margin: 0;
}

.lawyers-card {
  margin-bottom: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-weight: bold;
  font-size: 16px;
}

.detail-content {
  max-height: 70vh;
  overflow-y: auto;
}

.summary-row {
  margin-bottom: 20px;
}

.summary-card {
  margin-bottom: 10px;
}

.summary-item {
  display: flex;
  align-items: center;
  gap: 15px;
}

.summary-icon {
  width: 50px;
  height: 50px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
}

.cases-icon {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.rate-icon {
  background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
}

.duration-icon {
  background: linear-gradient(135deg, #43e97b 0%, #38f9d7 100%);
}

.amount-icon {
  background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
}

.summary-info {
  flex: 1;
}

.summary-value {
  font-size: 24px;
  font-weight: bold;
  color: #303133;
  margin-bottom: 5px;
}

.summary-label {
  font-size: 13px;
  color: #909399;
}

.charts-row {
  margin-bottom: 20px;
}

.chart-container {
  width: 100%;
  height: 350px;
}

.chart-container-large {
  width: 100%;
  height: 400px;
}

.report-card {
  margin-top: 20px;
}

.report-content {
  padding: 10px 0;
}

.dimension-item {
  margin-bottom: 20px;
}

.dimension-label {
  font-size: 14px;
  color: #606266;
  margin-bottom: 8px;
}

.evaluation-text {
  padding: 15px;
  background-color: #f5f7fa;
  border-radius: 4px;
  line-height: 1.8;
  color: #606266;
  white-space: pre-line;
}

@media (max-width: 768px) {
  .chart-container {
    height: 300px;
  }
  
  .chart-container-large {
    height: 350px;
  }
}
</style>
