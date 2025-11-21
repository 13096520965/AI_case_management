<template>
  <div class="cost-analytics-container">
    <PageHeader title="成本分析" :breadcrumb="breadcrumb" />
    
    <!-- Filter Section -->
    <el-card class="filter-card">
      <el-form :model="filterForm" label-width="100px">
        <el-row :gutter="20">
          <el-col :span="8">
            <el-form-item label="案件">
              <el-select 
                v-model="filterForm.caseId" 
                placeholder="选择案件" 
                clearable
                filterable
                style="width: 100%"
                @change="handleFilterChange"
              >
                <el-option 
                  v-for="caseItem in caseList" 
                  :key="caseItem.id" 
                  :label="`${caseItem.caseNumber || caseItem.internalNumber} - ${caseItem.caseCause}`" 
                  :value="caseItem.id" 
                />
              </el-select>
            </el-form-item>
          </el-col>
          
          <el-col :span="8">
            <el-form-item label="案件类型">
              <el-select 
                v-model="filterForm.caseType" 
                placeholder="选择案件类型" 
                clearable
                style="width: 100%"
                @change="handleFilterChange"
              >
                <el-option label="民事" value="民事" />
                <el-option label="刑事" value="刑事" />
                <el-option label="行政" value="行政" />
                <el-option label="劳动仲裁" value="劳动仲裁" />
              </el-select>
            </el-form-item>
          </el-col>

          <el-col :span="8">
            <el-form-item label="主体公司">
              <el-input
                v-model="filterForm.partyName"
                placeholder="输入公司名称"
                clearable
                @change="handleFilterChange"
              >
                <template #prefix>
                  <el-icon><Search /></el-icon>
                </template>
              </el-input>
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="20">
          <el-col :span="8">
            <el-form-item label="时间范围">
              <el-date-picker
                v-model="filterForm.dateRange"
                type="daterange"
                range-separator="至"
                start-placeholder="开始日期"
                end-placeholder="结束日期"
                value-format="YYYY-MM-DD"
                style="width: 100%"
                @change="handleFilterChange"
              />
            </el-form-item>
          </el-col>

          <el-col :span="8">
            <el-form-item label="费用类型">
              <el-select 
                v-model="filterForm.costType" 
                placeholder="选择费用类型" 
                clearable
                style="width: 100%"
                @change="handleFilterChange"
              >
                <el-option label="律师费" value="律师费" />
                <el-option label="诉讼费" value="诉讼费" />
                <el-option label="鉴定费" value="鉴定费" />
                <el-option label="差旅费" value="差旅费" />
                <el-option label="公证费" value="公证费" />
                <el-option label="其他费用" value="其他费用" />
              </el-select>
            </el-form-item>
          </el-col>

          <el-col :span="8">
            <el-form-item label="支付状态">
              <el-select 
                v-model="filterForm.paymentStatus" 
                placeholder="选择支付状态" 
                clearable
                style="width: 100%"
                @change="handleFilterChange"
              >
                <el-option label="已支付" value="已支付" />
                <el-option label="待支付" value="待支付" />
                <el-option label="部分支付" value="部分支付" />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>

        <el-row>
          <el-col :span="24">
            <el-form-item>
              <el-button type="primary" @click="loadAnalytics" :icon="Search">
                查询分析
              </el-button>
              <el-button @click="handleReset" :icon="Refresh">
                重置
              </el-button>
              <el-button type="success" @click="handleExport" :icon="Download">
                导出报表
              </el-button>
            </el-form-item>
          </el-col>
        </el-row>
      </el-form>
    </el-card>

    <!-- Summary Cards -->
    <el-row :gutter="20" class="summary-cards">
      <el-col :span="6">
        <el-card>
          <el-statistic title="总成本" :value="analytics.totalCost || 0" prefix="¥">
            <template #suffix>
              <span class="statistic-suffix">元</span>
            </template>
          </el-statistic>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card>
          <el-statistic title="已支付" :value="analytics.paidCost || 0" prefix="¥">
            <template #suffix>
              <span class="statistic-suffix">元</span>
            </template>
          </el-statistic>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card>
          <el-statistic title="待支付" :value="analytics.unpaidCost || 0" prefix="¥">
            <template #suffix>
              <span class="statistic-suffix">元</span>
            </template>
          </el-statistic>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card>
          <el-statistic title="成本项数" :value="analytics.costCount || 0">
            <template #suffix>
              <span class="statistic-suffix">项</span>
            </template>
          </el-statistic>
        </el-card>
      </el-col>
    </el-row>

    <!-- Charts Section -->
    <el-row :gutter="20" class="charts-section">
      <!-- Cost Distribution Pie Chart -->
      <el-col :span="12">
        <el-card>
          <template #header>
            <div class="card-header">
              <span>成本占比分析</span>
            </div>
          </template>
          <div ref="pieChartRef" class="chart-container"></div>
        </el-card>
      </el-col>

      <!-- Cost Trend Line Chart -->
      <el-col :span="12">
        <el-card>
          <template #header>
            <div class="card-header">
              <span>成本趋势分析</span>
            </div>
          </template>
          <div ref="lineChartRef" class="chart-container"></div>
        </el-card>
      </el-col>
    </el-row>

    <!-- Cost Type Bar Chart -->
    <el-row :gutter="20" class="charts-section">
      <el-col :span="24">
        <el-card>
          <template #header>
            <div class="card-header">
              <span>各类费用对比</span>
            </div>
          </template>
          <div ref="barChartRef" class="chart-container-large"></div>
        </el-card>
      </el-col>
    </el-row>

    <!-- Detailed Cost Breakdown -->
    <el-card class="breakdown-card">
      <template #header>
        <div class="card-header">
          <span>成本明细</span>
        </div>
      </template>
      <el-table :data="analytics.costBreakdown || []" style="width: 100%">
        <el-table-column prop="costType" label="费用类型" width="150" />
        <el-table-column prop="amount" label="金额（元）" width="150">
          <template #default="{ row }">
            ¥{{ row.amount?.toLocaleString() }}
          </template>
        </el-table-column>
        <el-table-column prop="percentage" label="占比" width="100">
          <template #default="{ row }">
            {{ row.percentage?.toFixed(2) }}%
          </template>
        </el-table-column>
        <el-table-column prop="count" label="项数" width="100" />
        <el-table-column prop="paidAmount" label="已支付" width="150">
          <template #default="{ row }">
            ¥{{ row.paidAmount?.toLocaleString() }}
          </template>
        </el-table-column>
        <el-table-column prop="unpaidAmount" label="待支付" width="150">
          <template #default="{ row }">
            ¥{{ row.unpaidAmount?.toLocaleString() }}
          </template>
        </el-table-column>
      </el-table>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, nextTick } from 'vue'
import { ElMessage } from 'element-plus'
import { Search, Refresh, Download } from '@element-plus/icons-vue'
import * as echarts from 'echarts'
import type { EChartsOption } from 'echarts'
import { costApi } from '@/api/cost'
import { caseApi } from '@/api/case'
import PageHeader from '@/components/common/PageHeader.vue'

const breadcrumb = [
  { title: '成本管理' },
  { title: '成本分析' }
]

const filterForm = reactive({
  caseId: null as number | null,
  caseType: '',
  partyName: '',
  dateRange: null as any,
  costType: '',
  paymentStatus: ''
})

const caseList = ref<any[]>([])
const analytics = ref<any>({})
const pieChartRef = ref<HTMLElement>()
const lineChartRef = ref<HTMLElement>()
const barChartRef = ref<HTMLElement>()

let pieChart: echarts.ECharts | null = null
let lineChart: echarts.ECharts | null = null
let barChart: echarts.ECharts | null = null

const loadCases = async () => {
  try {
    const response = await caseApi.getCases({ page: 1, pageSize: 100 })
    caseList.value = response.data?.list || []
  } catch (error) {
    console.error('Failed to load cases:', error)
  }
}

const loadAnalytics = async () => {
  // Build query parameters
  const params: any = {}
  
  if (filterForm.caseId) {
    params.caseId = filterForm.caseId
  }
  
  if (filterForm.caseType) {
    params.caseType = filterForm.caseType
  }
  
  if (filterForm.partyName) {
    params.partyName = filterForm.partyName
  }
  
  if (filterForm.dateRange && filterForm.dateRange.length === 2) {
    params.startDate = filterForm.dateRange[0]
    params.endDate = filterForm.dateRange[1]
  }
  
  if (filterForm.costType) {
    params.costType = filterForm.costType
  }
  
  if (filterForm.paymentStatus) {
    params.paymentStatus = filterForm.paymentStatus
  }

  // Check if at least one filter is applied
  if (Object.keys(params).length === 0) {
    ElMessage.warning('请至少选择一个筛选条件')
    return
  }

  try {
    // If specific case is selected, use the existing API
    if (filterForm.caseId) {
      const response = await costApi.getCostAnalytics(filterForm.caseId)
      analytics.value = response.data || {}
    } else {
      // For multi-dimensional search, we need to fetch all costs and aggregate
      const response = await costApi.getCosts(params)
      const costs = response.data?.list || []
      
      // Aggregate the data
      analytics.value = aggregateCostData(costs)
    }
    
    await nextTick()
    renderCharts()
  } catch (error) {
    ElMessage.error('加载成本分析数据失败')
    console.error(error)
  }
}

const aggregateCostData = (costs: any[]) => {
  const totalCost = costs.reduce((sum, cost) => sum + (cost.amount || 0), 0)
  const paidCost = costs.filter(c => c.payment_status === '已支付').reduce((sum, cost) => sum + (cost.amount || 0), 0)
  const unpaidCost = totalCost - paidCost
  
  // Group by cost type
  const costByType: Record<string, any> = {}
  costs.forEach(cost => {
    const type = cost.cost_type || '其他'
    if (!costByType[type]) {
      costByType[type] = {
        costType: type,
        amount: 0,
        count: 0,
        paidAmount: 0,
        unpaidAmount: 0
      }
    }
    costByType[type].amount += cost.amount || 0
    costByType[type].count += 1
    if (cost.payment_status === '已支付') {
      costByType[type].paidAmount += cost.amount || 0
    } else {
      costByType[type].unpaidAmount += cost.amount || 0
    }
  })
  
  const costBreakdown = Object.values(costByType).map((item: any) => ({
    ...item,
    percentage: totalCost > 0 ? (item.amount / totalCost) * 100 : 0
  }))
  
  // Generate trend data (group by date)
  const costsByDate: Record<string, number> = {}
  costs.forEach(cost => {
    const date = cost.cost_date || cost.created_at?.split('T')[0] || ''
    if (date) {
      costsByDate[date] = (costsByDate[date] || 0) + (cost.amount || 0)
    }
  })
  
  const sortedDates = Object.keys(costsByDate).sort()
  let cumulative = 0
  const trendData = sortedDates.map(date => {
    cumulative += costsByDate[date]
    return {
      date,
      cumulativeAmount: cumulative
    }
  })
  
  return {
    totalCost,
    paidCost,
    unpaidCost,
    costCount: costs.length,
    costBreakdown,
    trendData
  }
}

const handleFilterChange = () => {
  // Auto-load when filters change (optional, can be removed if you want manual search only)
  // loadAnalytics()
}

const handleReset = () => {
  filterForm.caseId = null
  filterForm.caseType = ''
  filterForm.partyName = ''
  filterForm.dateRange = null
  filterForm.costType = ''
  filterForm.paymentStatus = ''
  analytics.value = {}
  
  // Clear charts
  pieChart?.clear()
  lineChart?.clear()
  barChart?.clear()
}

const handleExport = () => {
  if (!analytics.value.costBreakdown || analytics.value.costBreakdown.length === 0) {
    ElMessage.warning('暂无数据可导出')
    return
  }
  
  // Generate CSV content
  let csvContent = '成本分析报表\n\n'
  csvContent += '总成本,已支付,待支付,成本项数\n'
  csvContent += `${analytics.value.totalCost},${analytics.value.paidCost},${analytics.value.unpaidCost},${analytics.value.costCount}\n\n`
  csvContent += '费用类型,金额,占比,项数,已支付,待支付\n'
  
  analytics.value.costBreakdown.forEach((item: any) => {
    csvContent += `${item.costType},${item.amount},${item.percentage.toFixed(2)}%,${item.count},${item.paidAmount},${item.unpaidAmount}\n`
  })
  
  // Create and download file
  const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' })
  const url = window.URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.setAttribute('download', `成本分析报表_${new Date().toISOString().split('T')[0]}.csv`)
  document.body.appendChild(link)
  link.click()
  link.remove()
  window.URL.revokeObjectURL(url)
  
  ElMessage.success('报表导出成功')
}

const renderCharts = () => {
  renderPieChart()
  renderLineChart()
  renderBarChart()
}

const renderPieChart = () => {
  if (!pieChartRef.value) return
  
  if (!pieChart) {
    pieChart = echarts.init(pieChartRef.value)
  }

  const costBreakdown = analytics.value.costBreakdown || []
  const data = costBreakdown.map((item: any) => ({
    name: item.costType,
    value: item.amount
  }))

  const option: EChartsOption = {
    tooltip: {
      trigger: 'item',
      formatter: '{a} <br/>{b}: ¥{c} ({d}%)'
    },
    legend: {
      orient: 'vertical',
      right: 10,
      top: 'center'
    },
    series: [
      {
        name: '成本占比',
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
        data: data
      }
    ]
  }

  pieChart.setOption(option)
}

const renderLineChart = () => {
  if (!lineChartRef.value) return
  
  if (!lineChart) {
    lineChart = echarts.init(lineChartRef.value)
  }

  const trendData = analytics.value.trendData || []
  const dates = trendData.map((item: any) => item.date)
  const amounts = trendData.map((item: any) => item.cumulativeAmount)

  const option: EChartsOption = {
    tooltip: {
      trigger: 'axis',
      formatter: (params: any) => {
        const param = params[0]
        return `${param.name}<br/>累计成本: ¥${param.value?.toLocaleString()}`
      }
    },
    xAxis: {
      type: 'category',
      data: dates,
      boundaryGap: false
    },
    yAxis: {
      type: 'value',
      axisLabel: {
        formatter: '¥{value}'
      }
    },
    series: [
      {
        name: '累计成本',
        type: 'line',
        smooth: true,
        areaStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: 'rgba(64, 158, 255, 0.5)' },
            { offset: 1, color: 'rgba(64, 158, 255, 0.1)' }
          ])
        },
        data: amounts
      }
    ],
    grid: {
      left: '3%',
      right: '4%',
      bottom: '3%',
      containLabel: true
    }
  }

  lineChart.setOption(option)
}

const renderBarChart = () => {
  if (!barChartRef.value) return
  
  if (!barChart) {
    barChart = echarts.init(barChartRef.value)
  }

  const costBreakdown = analytics.value.costBreakdown || []
  const costTypes = costBreakdown.map((item: any) => item.costType)
  const paidAmounts = costBreakdown.map((item: any) => item.paidAmount)
  const unpaidAmounts = costBreakdown.map((item: any) => item.unpaidAmount)

  const option: EChartsOption = {
    tooltip: {
      trigger: 'axis',
      axisPointer: {
        type: 'shadow'
      },
      formatter: (params: any) => {
        let result = `${params[0].name}<br/>`
        params.forEach((param: any) => {
          result += `${param.seriesName}: ¥${param.value?.toLocaleString()}<br/>`
        })
        return result
      }
    },
    legend: {
      data: ['已支付', '待支付']
    },
    xAxis: {
      type: 'category',
      data: costTypes
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
        stack: 'total',
        itemStyle: {
          color: '#67C23A'
        },
        data: paidAmounts
      },
      {
        name: '待支付',
        type: 'bar',
        stack: 'total',
        itemStyle: {
          color: '#E6A23C'
        },
        data: unpaidAmounts
      }
    ],
    grid: {
      left: '3%',
      right: '4%',
      bottom: '3%',
      containLabel: true
    }
  }

  barChart.setOption(option)
}

onMounted(() => {
  loadCases()
  
  // Handle window resize
  window.addEventListener('resize', () => {
    pieChart?.resize()
    lineChart?.resize()
    barChart?.resize()
  })
})
</script>

<style scoped>
.cost-analytics-container {
  padding: 20px;
}

.filter-card {
  margin-bottom: 20px;
}

.summary-cards {
  margin-bottom: 20px;
}

.charts-section {
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

.card-header {
  font-size: 16px;
  font-weight: 600;
}

.statistic-suffix {
  font-size: 14px;
  color: #909399;
  margin-left: 4px;
}

.breakdown-card {
  margin-top: 20px;
}
</style>
