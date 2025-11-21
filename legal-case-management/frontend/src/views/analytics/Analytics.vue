<template>
  <div class="analytics-container">
    <PageHeader title="可视化驾驶舱" subtitle="全面的数据分析与可视化展示" />
    
    <!-- Filter Section -->
    <el-card shadow="never" class="filter-card">
      <el-form :inline="true" :model="filterForm" class="filter-form">
        <el-form-item label="主体">
          <el-input
            v-model="filterForm.partyName"
            placeholder="请输入主体名称"
            clearable
            style="width: 200px"
            @keyup.enter="loadData"
          />
        </el-form-item>
        
        <el-form-item label="案件类型">
          <el-select v-model="filterForm.caseType" placeholder="全部类型" clearable style="width: 150px">
            <el-option label="全部" value="" />
            <el-option label="民事" value="民事" />
            <el-option label="刑事" value="刑事" />
            <el-option label="行政" value="行政" />
            <el-option label="劳动仲裁" value="劳动仲裁" />
          </el-select>
        </el-form-item>
        
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
        
        <el-form-item label="产业板块">
          <el-select v-model="filterForm.industrySegment" placeholder="全部板块" clearable @change="loadData">
            <el-option label="全部" value="" />
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
        
        <el-form-item>
          <el-button type="primary" @click="loadData">
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

    <!-- Key Metrics Cards -->
    <el-row :gutter="20" class="metrics-row">
      <el-col :xs="24" :sm="12" :md="6">
        <el-card shadow="hover" class="metric-card">
          <div class="metric-content">
            <div class="metric-icon cases-icon">
              <el-icon :size="32"><Folder /></el-icon>
            </div>
            <div class="metric-info">
              <div class="metric-value">{{ metricsData.totalCases }}</div>
              <div class="metric-label">案件总量</div>
              <div class="metric-trend" :class="metricsData.casesTrend >= 0 ? 'up' : 'down'">
                <el-icon v-if="metricsData.casesTrend >= 0"><CaretTop /></el-icon>
                <el-icon v-else><CaretBottom /></el-icon>
                {{ Math.abs(metricsData.casesTrend) }}%
              </div>
            </div>
          </div>
        </el-card>
      </el-col>
      
      <el-col :xs="24" :sm="12" :md="6">
        <el-card shadow="hover" class="metric-card">
          <div class="metric-content">
            <div class="metric-icon amount-icon">
              <el-icon :size="32"><Money /></el-icon>
            </div>
            <div class="metric-info">
              <div class="metric-value">{{ formatAmount(metricsData.totalAmount) }}</div>
              <div class="metric-label">标的额总计</div>
              <div class="metric-trend" :class="metricsData.amountTrend >= 0 ? 'up' : 'down'">
                <el-icon v-if="metricsData.amountTrend >= 0"><CaretTop /></el-icon>
                <el-icon v-else><CaretBottom /></el-icon>
                {{ Math.abs(metricsData.amountTrend) }}%
              </div>
            </div>
          </div>
        </el-card>
      </el-col>
      
      <el-col :xs="24" :sm="12" :md="6">
        <el-card shadow="hover" class="metric-card">
          <div class="metric-content">
            <div class="metric-icon rate-icon">
              <el-icon :size="32"><TrendCharts /></el-icon>
            </div>
            <div class="metric-info">
              <div class="metric-value">{{ metricsData.winRate }}%</div>
              <div class="metric-label">平均胜诉率</div>
              <div class="metric-trend" :class="metricsData.winRateTrend >= 0 ? 'up' : 'down'">
                <el-icon v-if="metricsData.winRateTrend >= 0"><CaretTop /></el-icon>
                <el-icon v-else><CaretBottom /></el-icon>
                {{ Math.abs(metricsData.winRateTrend) }}%
              </div>
            </div>
          </div>
        </el-card>
      </el-col>
      
      <el-col :xs="24" :sm="12" :md="6">
        <el-card shadow="hover" class="metric-card">
          <div class="metric-content">
            <div class="metric-icon duration-icon">
              <el-icon :size="32"><Timer /></el-icon>
            </div>
            <div class="metric-info">
              <div class="metric-value">{{ metricsData.avgDuration }}</div>
              <div class="metric-label">平均办案周期(天)</div>
              <div class="metric-trend" :class="metricsData.durationTrend <= 0 ? 'up' : 'down'">
                <el-icon v-if="metricsData.durationTrend <= 0"><CaretTop /></el-icon>
                <el-icon v-else><CaretBottom /></el-icon>
                {{ Math.abs(metricsData.durationTrend) }}%
              </div>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <!-- Charts Row 1 -->
    <el-row :gutter="20" class="charts-row">
      <el-col :xs="24" :md="12">
        <el-card shadow="hover">
          <template #header>
            <div class="card-header">
              <span>案件类型分布</span>
              <el-tag size="small">饼图</el-tag>
            </div>
          </template>
          <div ref="caseTypeChartRef" class="chart-container"></div>
        </el-card>
      </el-col>
      
      <el-col :xs="24" :md="12">
        <el-card shadow="hover">
          <template #header>
            <div class="card-header">
              <span>案件状态分布</span>
              <el-tag size="small" type="success">环形图</el-tag>
            </div>
          </template>
          <div ref="caseStatusChartRef" class="chart-container"></div>
        </el-card>
      </el-col>
    </el-row>

    <!-- Charts Row 2 -->
    <el-row :gutter="20" class="charts-row">
      <el-col :xs="24">
        <el-card shadow="hover">
          <template #header>
            <div class="card-header">
              <span>案件数量趋势</span>
              <el-tag size="small" type="warning">折线图</el-tag>
            </div>
          </template>
          <div ref="caseTrendChartRef" class="chart-container-large"></div>
        </el-card>
      </el-col>
    </el-row>

    <!-- Charts Row 3 -->
    <el-row :gutter="20" class="charts-row">
      <el-col :xs="24" :md="12">
        <el-card shadow="hover">
          <template #header>
            <div class="card-header">
              <span>标的额分布</span>
              <el-tag size="small" type="danger">柱状图</el-tag>
            </div>
          </template>
          <div ref="amountDistChartRef" class="chart-container"></div>
        </el-card>
      </el-col>
      
      <el-col :xs="24" :md="12">
        <el-card shadow="hover">
          <template #header>
            <div class="card-header">
              <span>案由分布 TOP10</span>
              <el-tag size="small" type="info">横向柱状图</el-tag>
            </div>
          </template>
          <div ref="caseCauseChartRef" class="chart-container"></div>
        </el-card>
      </el-col>
    </el-row>

    <!-- Charts Row 4 -->
    <el-row :gutter="20" class="charts-row">
      <el-col :xs="24">
        <el-card shadow="hover">
          <template #header>
            <div class="card-header">
              <span>月度案件与标的额对比</span>
              <el-tag size="small" type="success">组合图</el-tag>
            </div>
          </template>
          <div ref="monthlyCompareChartRef" class="chart-container-large"></div>
        </el-card>
      </el-col>
    </el-row>

    <!-- Cost Analytics Section -->
    <el-row :gutter="20" class="charts-row">
      <el-col :xs="24">
        <el-card shadow="hover">
          <template #header>
            <div class="card-header">
              <span>成本分析</span>
              <el-tag size="small" type="warning">统计</el-tag>
            </div>
          </template>
          
          <!-- Cost Filter -->
          <el-form :inline="true" class="cost-filter-form">
            <el-form-item label="案件">
              <el-select 
                v-model="costFilterForm.caseId" 
                placeholder="输入案号搜索" 
                clearable
                filterable
                remote
                :remote-method="searchCases"
                :loading="caseSearchLoading"
                style="width: 250px"
                @visible-change="handleCaseSelectVisible"
              >
                <el-option 
                  v-for="caseItem in caseList" 
                  :key="caseItem.id" 
                  :label="caseItem.case_number" 
                  :value="caseItem.id" 
                />
                <template #footer>
                  <div v-if="hasMoreCases" style="text-align: center; padding: 8px;">
                    <el-button text @click="loadMoreCases">加载更多</el-button>
                  </div>
                </template>
              </el-select>
            </el-form-item>
            <el-form-item label="时间范围">
              <el-date-picker
                v-model="costDateRange"
                type="daterange"
                range-separator="至"
                start-placeholder="开始日期"
                end-placeholder="结束日期"
                format="YYYY-MM-DD"
                value-format="YYYY-MM-DD"
              />
            </el-form-item>
            <el-form-item>
              <el-button type="primary" @click="loadCostAnalytics">
                <el-icon><Search /></el-icon>
                查询
              </el-button>
              <el-button @click="resetCostFilter">
                <el-icon><Refresh /></el-icon>
                重置
              </el-button>
            </el-form-item>
          </el-form>
          
          <!-- Cost Summary Cards -->
          <el-row :gutter="16" class="cost-summary">
            <el-col :xs="24" :sm="12" :md="6">
              <div class="cost-stat-card">
                <div class="cost-stat-icon total">
                  <el-icon :size="24"><Money /></el-icon>
                </div>
                <div class="cost-stat-info">
                  <div class="cost-stat-value">{{ formatAmount(costAnalytics.totalCost) }}</div>
                  <div class="cost-stat-label">总成本</div>
                </div>
              </div>
            </el-col>
            
            <el-col :xs="24" :sm="12" :md="6">
              <div class="cost-stat-card">
                <div class="cost-stat-icon paid">
                  <el-icon :size="24"><CircleCheck /></el-icon>
                </div>
                <div class="cost-stat-info">
                  <div class="cost-stat-value">{{ formatAmount(costAnalytics.paidCost) }}</div>
                  <div class="cost-stat-label">已支付</div>
                </div>
              </div>
            </el-col>
            
            <el-col :xs="24" :sm="12" :md="6">
              <div class="cost-stat-card">
                <div class="cost-stat-icon unpaid">
                  <el-icon :size="24"><Clock /></el-icon>
                </div>
                <div class="cost-stat-info">
                  <div class="cost-stat-value">{{ formatAmount(costAnalytics.unpaidCost) }}</div>
                  <div class="cost-stat-label">待支付</div>
                </div>
              </div>
            </el-col>
            
            <el-col :xs="24" :sm="12" :md="6">
              <div class="cost-stat-card">
                <div class="cost-stat-icon count">
                  <el-icon :size="24"><Document /></el-icon>
                </div>
                <div class="cost-stat-info">
                  <div class="cost-stat-value">{{ costAnalytics.costCount }}</div>
                  <div class="cost-stat-label">成本项数</div>
                </div>
              </div>
            </el-col>
          </el-row>

          <!-- Cost Charts Row 1 -->
          <el-row :gutter="16" style="margin-top: 20px;">
            <el-col :xs="24" :md="12">
              <div class="cost-chart-title">成本占比分析</div>
              <div ref="costPieChartRef" class="chart-container"></div>
            </el-col>
            <el-col :xs="24" :md="12">
              <div class="cost-chart-title">成本趋势分析</div>
              <div ref="costTrendChartRef" class="chart-container"></div>
            </el-col>
          </el-row>

          <!-- Cost Charts Row 2 -->
          <el-row :gutter="16" style="margin-top: 20px;">
            <el-col :xs="24">
              <div class="cost-chart-title">各类费用对比</div>
              <div ref="costBarChartRef" class="chart-container"></div>
            </el-col>
          </el-row>

          <!-- Cost Breakdown Table -->
          <div style="margin-top: 20px;">
            <div class="cost-chart-title">成本明细</div>
            <el-table :data="costBreakdown" style="width: 100%" stripe>
              <el-table-column prop="cost_type" label="费用类型" width="150">
                <template #default="{ row }">
                  {{ getCostTypeName(row.cost_type) }}
                </template>
              </el-table-column>
              <el-table-column prop="total_amount" label="总金额" width="150">
                <template #default="{ row }">
                  {{ formatAmount(row.total_amount) }}
                </template>
              </el-table-column>
              <el-table-column prop="percentage" label="占比" width="100">
                <template #default="{ row }">
                  {{ row.percentage?.toFixed(2) }}%
                </template>
              </el-table-column>
              <el-table-column prop="count" label="项数" width="100" />
              <el-table-column prop="paid_amount" label="已支付" width="150">
                <template #default="{ row }">
                  {{ formatAmount(row.paid_amount) }}
                </template>
              </el-table-column>
              <el-table-column prop="unpaid_amount" label="待支付" width="150">
                <template #default="{ row }">
                  {{ formatAmount(row.unpaid_amount) }}
                </template>
              </el-table-column>
              <el-table-column label="支付进度">
                <template #default="{ row }">
                  <el-progress 
                    :percentage="row.total_amount > 0 ? (row.paid_amount / row.total_amount * 100) : 0" 
                    :color="row.paid_amount >= row.total_amount ? '#67C23A' : '#E6A23C'"
                  />
                </template>
              </el-table-column>
            </el-table>
          </div>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { 
  Folder, Money, TrendCharts, Timer, Search, Refresh,
  CaretTop, CaretBottom, CircleCheck, Clock, Document
} from '@element-plus/icons-vue'
import * as echarts from 'echarts'
import type { ECharts } from 'echarts'
import { analyticsApi } from '@/api/analytics'
import { caseApi } from '@/api/case'
import { ElMessage } from 'element-plus'
import PageHeader from '@/components/common/PageHeader.vue'

interface FilterForm {
  partyName: string
  startDate: string
  endDate: string
  caseType: string
  industrySegment: string
  partyName: string
}

interface MetricsData {
  totalCases: number
  casesTrend: number
  totalAmount: number
  amountTrend: number
  winRate: number
  winRateTrend: number
  avgDuration: number
  durationTrend: number
}

const dateRange = ref<[string, string]>()
const filterForm = ref<FilterForm>({
  partyName: '',
  startDate: '',
  endDate: '',
  caseType: '',
  industrySegment: '',
  partyName: ''
})

const metricsData = ref<MetricsData>({
  totalCases: 0,
  casesTrend: 0,
  totalAmount: 0,
  amountTrend: 0,
  winRate: 0,
  winRateTrend: 0,
  avgDuration: 0,
  durationTrend: 0
})

const costAnalytics = ref({
  totalCost: 0,
  paidCost: 0,
  unpaidCost: 0,
  costCount: 0
})

const costDateRange = ref<[string, string]>()
const costFilterForm = ref({
  caseId: null as number | null,
  startDate: '',
  endDate: ''
})

const caseList = ref<any[]>([])
const costBreakdown = ref<any[]>([])
const caseSearchLoading = ref(false)
const hasMoreCases = ref(true)
const casePage = ref(1)
const casePageSize = ref(20)
const caseSearchKeyword = ref('')

const caseTypeChartRef = ref<HTMLElement>()
const caseStatusChartRef = ref<HTMLElement>()
const caseTrendChartRef = ref<HTMLElement>()
const amountDistChartRef = ref<HTMLElement>()
const caseCauseChartRef = ref<HTMLElement>()
const monthlyCompareChartRef = ref<HTMLElement>()
const costPieChartRef = ref<HTMLElement>()
const costTrendChartRef = ref<HTMLElement>()
const costBarChartRef = ref<HTMLElement>()

let caseTypeChart: ECharts | null = null
let caseStatusChart: ECharts | null = null
let caseTrendChart: ECharts | null = null
let amountDistChart: ECharts | null = null
let caseCauseChart: ECharts | null = null
let monthlyCompareChart: ECharts | null = null
let costPieChart: ECharts | null = null
let costTrendChart: ECharts | null = null
let costBarChart: ECharts | null = null

const formatAmount = (amount: number = 0): string => {
  if (amount >= 100000000) {
    return (amount / 100000000).toFixed(2) + '亿'
  } else if (amount >= 10000) {
    return (amount / 10000).toFixed(2) + '万'
  }
  return amount.toFixed(2)
}

const handleDateRangeChange = (value: [string, string] | null) => {
  if (value) {
    filterForm.value.startDate = value[0]
    filterForm.value.endDate = value[1]
  } else {
    filterForm.value.startDate = ''
    filterForm.value.endDate = ''
  }
  loadData()
}

const resetFilter = () => {
  dateRange.value = undefined
  filterForm.value = {
    partyName: '',
    startDate: '',
    endDate: '',
    caseType: ''
  }
  loadData()
}

const loadData = async () => {
  await Promise.all([
    loadMetrics(),
    loadCostAnalytics(),
    initCaseTypeChart(),
    initCaseStatusChart(),
    initCaseTrendChart(),
    initAmountDistChart(),
    initCaseCauseChart(),
    initMonthlyCompareChart()
  ])
}

const loadMetrics = async () => {
  try {
    const params = {
      partyName: filterForm.value.partyName,
      startDate: filterForm.value.startDate,
      endDate: filterForm.value.endDate,
      caseType: filterForm.value.caseType,
      industrySegment: filterForm.value.industrySegment,
      partyName: filterForm.value.partyName
    }
    
    const response = await analyticsApi.getDashboard(params)
    if (response.data?.summary) {
      const summary = response.data.summary
      metricsData.value = {
        totalCases: summary.totalCases || 0,
        casesTrend: summary.casesTrend || 0,
        totalAmount: summary.totalTargetAmount || 0,
        amountTrend: summary.amountTrend || 0,
        winRate: summary.averageWinRate || 0,
        winRateTrend: summary.winRateTrend || 0,
        avgDuration: summary.avgDuration || 0,
        durationTrend: summary.durationTrend || 0
      }
    }
  } catch (error) {
    console.error('Failed to load metrics:', error)
  }
}

const initCaseTypeChart = async () => {
  if (!caseTypeChartRef.value) return
  
  try {
    const params = {
      partyName: filterForm.value.partyName,
      startDate: filterForm.value.startDate,
      endDate: filterForm.value.endDate,
      caseType: filterForm.value.caseType,
      industrySegment: filterForm.value.industrySegment
    }
    
    const response = await analyticsApi.getCaseTypeDistribution(params)
    const data = response.data || []
    
    if (!caseTypeChart) {
      caseTypeChart = echarts.init(caseTypeChartRef.value)
    }
    
    const option = {
      tooltip: {
        trigger: 'item',
        formatter: '{a} <br/>{b}: {c} ({d}%)'
      },
      legend: {
        orient: 'vertical',
        left: 'left',
        top: 'center'
      },
      series: [
        {
          name: '案件类型',
          type: 'pie',
          radius: ['40%', '70%'],
          avoidLabelOverlap: false,
          itemStyle: {
            borderRadius: 10,
            borderColor: '#fff',
            borderWidth: 2
          },
          label: {
            show: false,
            position: 'center'
          },
          emphasis: {
            label: {
              show: true,
              fontSize: 20,
              fontWeight: 'bold'
            }
          },
          labelLine: {
            show: false
          },
          data: data.map((item: any) => ({
            value: item.count,
            name: item.case_type || '未分类'
          }))
        }
      ]
    }
    
    caseTypeChart.setOption(option)
  } catch (error) {
    console.error('Failed to init case type chart:', error)
  }
}

const initCaseStatusChart = async () => {
  if (!caseStatusChartRef.value) return
  
  try {
    const params = {
      partyName: filterForm.value.partyName,
      startDate: filterForm.value.startDate,
      endDate: filterForm.value.endDate,
      caseType: filterForm.value.caseType,
      industrySegment: filterForm.value.industrySegment,
      partyName: filterForm.value.partyName
    }
    
    const response = await analyticsApi.getDashboard(params)
    const statusData = response.data?.caseStatusDistribution || []
    
    if (!caseStatusChart) {
      caseStatusChart = echarts.init(caseStatusChartRef.value)
    }
    
    const option = {
      tooltip: {
        trigger: 'item',
        formatter: '{a} <br/>{b}: {c} ({d}%)'
      },
      legend: {
        orient: 'vertical',
        right: 'right',
        top: 'center'
      },
      series: [
        {
          name: '案件状态',
          type: 'pie',
          radius: ['50%', '70%'],
          center: ['40%', '50%'],
          avoidLabelOverlap: false,
          itemStyle: {
            borderRadius: 10,
            borderColor: '#fff',
            borderWidth: 2
          },
          label: {
            show: true,
            formatter: '{b}: {d}%'
          },
          emphasis: {
            label: {
              show: true,
              fontSize: 16,
              fontWeight: 'bold'
            }
          },
          data: statusData.map((item: any) => ({
            value: item.count,
            name: item.status || '未知'
          }))
        }
      ],
      color: ['#5470c6', '#91cc75', '#fac858', '#ee6666', '#73c0de']
    }
    
    caseStatusChart.setOption(option)
  } catch (error) {
    console.error('Failed to init case status chart:', error)
  }
}

const initCaseTrendChart = async () => {
  if (!caseTrendChartRef.value) return
  
  try {
    const params = {
      partyName: filterForm.value.partyName,
      startDate: filterForm.value.startDate,
      endDate: filterForm.value.endDate,
      caseType: filterForm.value.caseType,
      interval: 'month'
      industrySegment: filterForm.value.industrySegment,
      partyName: filterForm.value.partyName
    }
    
    const response = await analyticsApi.getCaseTrend(params)
    const data = response.data || []
    
    if (!caseTrendChart) {
      caseTrendChart = echarts.init(caseTrendChartRef.value)
    }
    
    const option = {
      tooltip: {
        trigger: 'axis',
        axisPointer: {
          type: 'cross',
          crossStyle: {
            color: '#999'
          }
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
        boundaryGap: true,
        data: data.map((item: any) => item.period)
      },
      yAxis: {
        type: 'value'
      },
      series: [
        {
          name: '案件数量',
          type: 'bar',
          data: data.map((item: any) => item.count),
          itemStyle: {
            color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
              { offset: 0, color: '#409eff' },
              { offset: 1, color: '#66b1ff' }
            ])
          },
          barWidth: '60%'
        },
        {
          name: '趋势线',
          type: 'line',
          smooth: true,
          data: data.map((item: any) => item.count),
          itemStyle: {
            color: '#F56C6C'
          },
          lineStyle: {
            width: 3
          },
          symbol: 'circle',
          symbolSize: 8
        }
      ]
    }
    
    caseTrendChart.setOption(option)
  } catch (error) {
    console.error('Failed to init case trend chart:', error)
  }
}

const initAmountDistChart = async () => {
  if (!amountDistChartRef.value) return
  
  try {
    const params = {
      partyName: filterForm.value.partyName,
      startDate: filterForm.value.startDate,
      endDate: filterForm.value.endDate,
      caseType: filterForm.value.caseType,
      industrySegment: filterForm.value.industrySegment,
      partyName: filterForm.value.partyName
    }
    
    const response = await analyticsApi.getDashboard(params)
    const amountData = response.data?.amountDistribution || []
    
    if (!amountDistChart) {
      amountDistChart = echarts.init(amountDistChartRef.value)
    }
    
    const option = {
      tooltip: {
        trigger: 'axis',
        axisPointer: {
          type: 'shadow'
        },
        formatter: (params: any) => {
          const item = params[0]
          return `${item.name}<br/>${item.seriesName}: ${formatAmount(item.value)}`
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
        data: amountData.map((item: any) => item.range)
      },
      yAxis: {
        type: 'value',
        name: '案件数量'
      },
      series: [
        {
          name: '案件数量',
          type: 'bar',
          data: amountData.map((item: any) => item.count),
          itemStyle: {
            color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
              { offset: 0, color: '#83bff6' },
              { offset: 0.5, color: '#188df0' },
              { offset: 1, color: '#188df0' }
            ])
          },
          barWidth: '60%'
        }
      ]
    }
    
    amountDistChart.setOption(option)
  } catch (error) {
    console.error('Failed to init amount distribution chart:', error)
  }
}

const initCaseCauseChart = async () => {
  if (!caseCauseChartRef.value) return
  
  try {
    const params = {
      partyName: filterForm.value.partyName,
      startDate: filterForm.value.startDate,
      endDate: filterForm.value.endDate,
      caseType: filterForm.value.caseType,
      industrySegment: filterForm.value.industrySegment,
      partyName: filterForm.value.partyName
    }
    
    const response = await analyticsApi.getDashboard(params)
    const causeData = (response.data?.caseCauseDistribution || []).slice(0, 10)
    
    if (!caseCauseChart) {
      caseCauseChart = echarts.init(caseCauseChartRef.value)
    }
    
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
        type: 'value'
      },
      yAxis: {
        type: 'category',
        data: causeData.map((item: any) => item.case_cause).reverse()
      },
      series: [
        {
          name: '案件数量',
          type: 'bar',
          data: causeData.map((item: any) => item.count).reverse(),
          itemStyle: {
            color: new echarts.graphic.LinearGradient(0, 0, 1, 0, [
              { offset: 0, color: '#667eea' },
              { offset: 1, color: '#764ba2' }
            ])
          },
          label: {
            show: true,
            position: 'right'
          }
        }
      ]
    }
    
    caseCauseChart.setOption(option)
  } catch (error) {
    console.error('Failed to init case cause chart:', error)
  }
}

const initMonthlyCompareChart = async () => {
  if (!monthlyCompareChartRef.value) return
  
  try {
    const params = {
      partyName: filterForm.value.partyName,
      startDate: filterForm.value.startDate,
      endDate: filterForm.value.endDate,
      caseType: filterForm.value.caseType,
      interval: 'month',
      industrySegment: filterForm.value.industrySegment
    }
    
    const response = await analyticsApi.getCaseTrend(params)
    const data = response.data || []
    
    if (!monthlyCompareChart) {
      monthlyCompareChart = echarts.init(monthlyCompareChartRef.value)
    }
    
    const option = {
      tooltip: {
        trigger: 'axis',
        axisPointer: {
          type: 'cross',
          crossStyle: {
            color: '#999'
          }
        }
      },
      legend: {
        data: ['案件数量', '标的额']
      },
      grid: {
        left: '3%',
        right: '4%',
        bottom: '3%',
        containLabel: true
      },
      xAxis: {
        type: 'category',
        data: data.map((item: any) => item.period),
        axisPointer: {
          type: 'shadow'
        }
      },
      yAxis: [
        {
          type: 'value',
          name: '案件数量',
          axisLabel: {
            formatter: '{value}'
          }
        },
        {
          type: 'value',
          name: '标的额',
          axisLabel: {
            formatter: (value: number) => formatAmount(value)
          }
        }
      ],
      series: [
        {
          name: '案件数量',
          type: 'bar',
          data: data.map((item: any) => item.count),
          itemStyle: {
            color: '#5470c6'
          }
        },
        {
          name: '标的额',
          type: 'line',
          yAxisIndex: 1,
          data: data.map((item: any) => item.totalAmount || 0),
          smooth: true,
          itemStyle: {
            color: '#91cc75'
          },
          lineStyle: {
            width: 3
          }
        }
      ]
    }
    
    monthlyCompareChart.setOption(option)
  } catch (error) {
    console.error('Failed to init monthly compare chart:', error)
  }
}

const handleResize = () => {
  caseTypeChart?.resize()
  caseStatusChart?.resize()
  caseTrendChart?.resize()
  amountDistChart?.resize()
  caseCauseChart?.resize()
  monthlyCompareChart?.resize()
  costPieChart?.resize()
  costTrendChart?.resize()
  costBarChart?.resize()
}

onMounted(async () => {
  await Promise.all([
    loadData(),
    loadCaseList()
  ])
  window.addEventListener('resize', handleResize)
})

// 处理成本日期范围变化
const handleCostDateRangeChange = (value: [string, string] | null) => {
  if (value) {
    costFilterForm.value.startDate = value[0]
    costFilterForm.value.endDate = value[1]
  } else {
    costFilterForm.value.startDate = ''
    costFilterForm.value.endDate = ''
  }
}

// 重置成本筛选
const resetCostFilter = () => {
  costDateRange.value = undefined
  costFilterForm.value = {
    caseId: null,
    startDate: '',
    endDate: ''
  }
  loadCostAnalytics()
}

// 获取费用类型名称
const getCostTypeName = (type: string) => {
  const typeMap: Record<string, string> = {
    'court_fee': '诉讼费',
    'attorney_fee': '律师费',
    'appraisal_fee': '鉴定费',
    'notary_fee': '公证费',
    'other': '其他费用'
  }
  return typeMap[type] || type
}

// 加载案件列表
const loadCaseList = async (reset = false) => {
  try {
    if (reset) {
      casePage.value = 1
      caseList.value = []
    }
    
    caseSearchLoading.value = true
    
    // 调用案件列表API
    const response = await caseApi.getCases({
      page: casePage.value,
      pageSize: casePageSize.value,
      keyword: caseSearchKeyword.value
    })
    
    const cases = response.data?.cases || []
    
    if (reset) {
      caseList.value = cases
    } else {
      caseList.value = [...caseList.value, ...cases]
    }
    
    hasMoreCases.value = cases.length >= casePageSize.value
  } catch (error) {
    console.error('Failed to load case list:', error)
  } finally {
    caseSearchLoading.value = false
  }
}

// 搜索案件
const searchCases = async (keyword: string) => {
  caseSearchKeyword.value = keyword
  await loadCaseList(true)
}

// 加载更多案件
const loadMoreCases = async () => {
  casePage.value++
  await loadCaseList(false)
}

// 处理下拉框显示/隐藏
const handleCaseSelectVisible = (visible: boolean) => {
  if (visible && caseList.value.length === 0) {
    loadCaseList(true)
  }
}

// 加载成本分析数据
const loadCostAnalytics = async () => {
  try {
    const params: any = {
      partyName: filterForm.value.partyName,
      startDate: costFilterForm.value.startDate || filterForm.value.startDate,
      endDate: costFilterForm.value.endDate || filterForm.value.endDate,
      caseType: filterForm.value.caseType
    }
    
    if (costFilterForm.value.caseId) {
      params.caseId = costFilterForm.value.caseId
    }
    
    const response = await analyticsApi.getDashboard(params)
    if (response.data?.costSummary) {
      const summary = response.data.costSummary
      costAnalytics.value = {
        totalCost: summary.totalCost || 0,
        paidCost: summary.paidCost || 0,
        unpaidCost: summary.unpaidCost || 0,
        costCount: summary.costCount || 0
      }
    }
    
    // 加载成本明细
    if (response.data?.costBreakdown) {
      costBreakdown.value = response.data.costBreakdown
    }
    
    // 重新初始化成本图表
    await Promise.all([
      initCostPieChart(),
      initCostTrendChart(),
      initCostBarChart()
    ])
  } catch (error) {
    console.error('Failed to load cost analytics:', error)
  }
}

// 初始化成本类型分布图表
const initCostTypeChart = async () => {
  if (!costTypeChartRef.value) return
  
  try {
    const params = {
      partyName: filterForm.value.partyName,
      startDate: filterForm.value.startDate,
      endDate: filterForm.value.endDate,
      caseType: filterForm.value.caseType
    }
    
    const response = await analyticsApi.getDashboard(params)
    const costTypeData = response.data?.costTypeDistribution || []
    
    if (!costTypeChart) {
      costTypeChart = echarts.init(costTypeChartRef.value)
    }
    
    const option = {
      tooltip: {
        trigger: 'item',
        formatter: '{b}: ¥{c} ({d}%)'
      },
      legend: {
        orient: 'vertical',
        right: 10,
        top: 'center'
      },
      series: [
        {
          name: '成本类型',
          type: 'pie',
          radius: '60%',
          data: costTypeData.map((item: any) => ({
            value: item.amount || 0,
            name: item.cost_type || '其他'
          })),
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
    
    costTypeChart.setOption(option)
  } catch (error) {
    console.error('Failed to init cost type chart:', error)
  }
}

// 初始化成本支付状态图表
const initCostStatusChart = async () => {
  if (!costStatusChartRef.value) return
  
  try {
    const params = {
      partyName: filterForm.value.partyName,
      startDate: filterForm.value.startDate,
      endDate: filterForm.value.endDate,
      caseType: filterForm.value.caseType
    }
    
    const response = await analyticsApi.getDashboard(params)
    const costStatusData = response.data?.costStatusDistribution || []
    
    if (!costStatusChart) {
      costStatusChart = echarts.init(costStatusChartRef.value)
    }
    
    const option = {
      tooltip: {
        trigger: 'item',
        formatter: '{b}: ¥{c} ({d}%)'
      },
      legend: {
        orient: 'vertical',
        right: 10,
        top: 'center'
      },
      series: [
        {
          name: '支付状态',
          type: 'pie',
          radius: ['40%', '70%'],
          avoidLabelOverlap: false,
          itemStyle: {
            borderRadius: 10,
            borderColor: '#fff',
            borderWidth: 2
          },
          label: {
            show: true,
            formatter: '{b}: {d}%'
          },
          data: costStatusData.map((item: any) => ({
            value: item.amount || 0,
            name: item.status === 'paid' ? '已支付' : item.status === 'unpaid' ? '待支付' : '其他'
          })),
          color: ['#67C23A', '#E6A23C', '#909399']
        }
      ]
    }
    
    costStatusChart.setOption(option)
  } catch (error) {
    console.error('Failed to init cost status chart:', error)
  }
}

// 初始化成本占比分析图表
const initCostPieChart = async () => {
  if (!costPieChartRef.value) return
  
  try {
    if (!costPieChart) {
      costPieChart = echarts.init(costPieChartRef.value)
    }
    
    const option = {
      tooltip: {
        trigger: 'item',
        formatter: '{b}: ¥{c} ({d}%)'
      },
      legend: {
        orient: 'vertical',
        left: 'left'
      },
      series: [
        {
          name: '成本占比',
          type: 'pie',
          radius: '60%',
          data: costBreakdown.value.map((item: any) => ({
            value: item.total_amount || 0,
            name: getCostTypeName(item.cost_type)
          })),
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
    
    costPieChart.setOption(option)
  } catch (error) {
    console.error('Failed to init cost pie chart:', error)
  }
}

// 初始化成本趋势分析图表
const initCostTrendChart = async () => {
  if (!costTrendChartRef.value) return
  
  try {
    if (!costTrendChart) {
      costTrendChart = echarts.init(costTrendChartRef.value)
    }
    
    // 模拟趋势数据（实际应从后端获取）
    const months = ['1月', '2月', '3月', '4月', '5月', '6月']
    const data = [50000, 65000, 45000, 80000, 70000, 90000]
    
    const option = {
      tooltip: {
        trigger: 'axis'
      },
      xAxis: {
        type: 'category',
        data: months
      },
      yAxis: {
        type: 'value',
        axisLabel: {
          formatter: '¥{value}'
        }
      },
      series: [
        {
          name: '成本',
          type: 'line',
          data: data,
          smooth: true,
          areaStyle: {
            color: {
              type: 'linear',
              x: 0,
              y: 0,
              x2: 0,
              y2: 1,
              colorStops: [
                { offset: 0, color: 'rgba(64, 158, 255, 0.3)' },
                { offset: 1, color: 'rgba(64, 158, 255, 0.05)' }
              ]
            }
          },
          itemStyle: {
            color: '#409EFF'
          }
        }
      ]
    }
    
    costTrendChart.setOption(option)
  } catch (error) {
    console.error('Failed to init cost trend chart:', error)
  }
}

// 初始化各类费用对比图表
const initCostBarChart = async () => {
  if (!costBarChartRef.value) return
  
  try {
    if (!costBarChart) {
      costBarChart = echarts.init(costBarChartRef.value)
    }
    
    const option = {
      tooltip: {
        trigger: 'axis',
        axisPointer: {
          type: 'shadow'
        }
      },
      legend: {
        data: ['已支付', '待支付']
      },
      xAxis: {
        type: 'category',
        data: costBreakdown.value.map((item: any) => getCostTypeName(item.cost_type))
      },
      yAxis: {
        type: 'value',
        axisLabel: {
          formatter: '¥{value}'
        }
      },
      series: [
        {
          name: '已支付',
          type: 'bar',
          data: costBreakdown.value.map((item: any) => item.paid_amount || 0),
          itemStyle: {
            color: '#67C23A'
          }
        },
        {
          name: '待支付',
          type: 'bar',
          data: costBreakdown.value.map((item: any) => item.unpaid_amount || 0),
          itemStyle: {
            color: '#E6A23C'
          }
        }
      ]
    }
    
    costBarChart.setOption(option)
  } catch (error) {
    console.error('Failed to init cost bar chart:', error)
  }
}

onUnmounted(() => {
  window.removeEventListener('resize', handleResize)
  caseTypeChart?.dispose()
  caseStatusChart?.dispose()
  caseTrendChart?.dispose()
  amountDistChart?.dispose()
  caseCauseChart?.dispose()
  monthlyCompareChart?.dispose()
  costPieChart?.dispose()
  costTrendChart?.dispose()
  costBarChart?.dispose()
})
</script>

<style scoped>
.analytics-container {
  padding: 20px;
}

.filter-card {
  margin-bottom: 20px;
}

.filter-form {
  margin: 0;
}

.metrics-row {
  margin-bottom: 20px;
}

.metric-card {
  margin-bottom: 20px;
}

.metric-content {
  display: flex;
  align-items: center;
  gap: 20px;
}

.metric-icon {
  width: 60px;
  height: 60px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
}

.cases-icon {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.amount-icon {
  background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
}

.rate-icon {
  background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
}

.duration-icon {
  background: linear-gradient(135deg, #43e97b 0%, #38f9d7 100%);
}

.metric-info {
  flex: 1;
}

.metric-value {
  font-size: 28px;
  font-weight: bold;
  color: #303133;
  margin-bottom: 5px;
}

.metric-label {
  font-size: 14px;
  color: #909399;
  margin-bottom: 5px;
}

.metric-trend {
  font-size: 12px;
  display: flex;
  align-items: center;
  gap: 4px;
}

.metric-trend.up {
  color: #67c23a;
}

.metric-trend.down {
  color: #f56c6c;
}

.charts-row {
  margin-bottom: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-weight: bold;
  font-size: 16px;
}

.chart-container {
  width: 100%;
  height: 350px;
}

.chart-container-large {
  width: 100%;
  height: 400px;
}

/* Cost Analytics Styles */
.cost-filter-form {
  margin-bottom: 20px;
  padding-bottom: 20px;
  border-bottom: 1px solid #EBEEF5;
}

.cost-summary {
  margin-bottom: 20px;
}

.cost-stat-card {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 20px;
  background: #f5f7fa;
  border-radius: 8px;
  transition: all 0.3s;
}

.cost-stat-card:hover {
  background: #ecf5ff;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.cost-stat-icon {
  width: 48px;
  height: 48px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
}

.cost-stat-icon.total {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.cost-stat-icon.paid {
  background: linear-gradient(135deg, #67C23A 0%, #85CE61 100%);
}

.cost-stat-icon.unpaid {
  background: linear-gradient(135deg, #E6A23C 0%, #F56C6C 100%);
}

.cost-stat-icon.count {
  background: linear-gradient(135deg, #409EFF 0%, #66B1FF 100%);
}

.cost-stat-info {
  flex: 1;
}

.cost-stat-value {
  font-size: 24px;
  font-weight: 600;
  color: #303133;
  margin-bottom: 4px;
}

.cost-stat-label {
  font-size: 14px;
  color: #909399;
}

.cost-chart-title {
  font-size: 14px;
  font-weight: 500;
  color: #606266;
  margin-bottom: 12px;
  padding-left: 8px;
  border-left: 3px solid #409EFF;
}

@media (max-width: 768px) {
  .metric-value {
    font-size: 24px;
  }
  
  .chart-container {
    height: 300px;
  }
  
  .chart-container-large {
    height: 350px;
  }
  
  .cost-stat-value {
    font-size: 20px;
  }
  
  .cost-stat-card {
    margin-bottom: 12px;
  }
}
</style>
