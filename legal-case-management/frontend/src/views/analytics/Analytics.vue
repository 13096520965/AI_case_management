<template>
  <div class="analytics-container">
    <PageHeader title="可视化驾驶舱" subtitle="全面的数据分析与可视化展示" />
    
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
        
        <el-form-item label="案件类型">
          <el-select v-model="filterForm.caseType" placeholder="全部类型" clearable @change="loadData">
            <el-option label="全部" value="" />
            <el-option label="民事案件" value="民事案件" />
            <el-option label="刑事案件" value="刑事案件" />
            <el-option label="行政案件" value="行政案件" />
            <el-option label="劳动仲裁" value="劳动仲裁" />
          </el-select>
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
        
        <el-form-item label="当事人">
          <el-input
            v-model="filterForm.partyName"
            placeholder="请输入当事人姓名/名称"
            clearable
            style="width: 200px"
            @clear="loadData"
          />
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
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { 
  Folder, Money, TrendCharts, Timer, Search, Refresh,
  CaretTop, CaretBottom
} from '@element-plus/icons-vue'
import * as echarts from 'echarts'
import type { ECharts } from 'echarts'
import { analyticsApi } from '@/api/analytics'
import { ElMessage } from 'element-plus'
import PageHeader from '@/components/common/PageHeader.vue'

interface FilterForm {
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

const caseTypeChartRef = ref<HTMLElement>()
const caseStatusChartRef = ref<HTMLElement>()
const caseTrendChartRef = ref<HTMLElement>()
const amountDistChartRef = ref<HTMLElement>()
const caseCauseChartRef = ref<HTMLElement>()
const monthlyCompareChartRef = ref<HTMLElement>()

let caseTypeChart: ECharts | null = null
let caseStatusChart: ECharts | null = null
let caseTrendChart: ECharts | null = null
let amountDistChart: ECharts | null = null
let caseCauseChart: ECharts | null = null
let monthlyCompareChart: ECharts | null = null

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
    startDate: '',
    endDate: '',
    caseType: ''
  }
  loadData()
}

const loadData = async () => {
  await Promise.all([
    loadMetrics(),
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
      startDate: filterForm.value.startDate,
      endDate: filterForm.value.endDate,
      industrySegment: filterForm.value.industrySegment,
      partyName: filterForm.value.partyName
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
      startDate: filterForm.value.startDate,
      endDate: filterForm.value.endDate,
      interval: 'month',
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
          type: 'cross'
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
        boundaryGap: false,
        data: data.map((item: any) => item.period)
      },
      yAxis: {
        type: 'value'
      },
      series: [
        {
          name: '案件数量',
          type: 'line',
          smooth: true,
          data: data.map((item: any) => item.count),
          areaStyle: {
            color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
              { offset: 0, color: 'rgba(64, 158, 255, 0.5)' },
              { offset: 1, color: 'rgba(64, 158, 255, 0.1)' }
            ])
          },
          itemStyle: {
            color: '#409eff'
          },
          lineStyle: {
            width: 3
          }
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
      startDate: filterForm.value.startDate,
      endDate: filterForm.value.endDate,
      interval: 'month',
      industrySegment: filterForm.value.industrySegment,
      partyName: filterForm.value.partyName
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
}

onMounted(async () => {
  await loadData()
  window.addEventListener('resize', handleResize)
})

onUnmounted(() => {
  window.removeEventListener('resize', handleResize)
  caseTypeChart?.dispose()
  caseStatusChart?.dispose()
  caseTrendChart?.dispose()
  amountDistChart?.dispose()
  caseCauseChart?.dispose()
  monthlyCompareChart?.dispose()
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
}
</style>
