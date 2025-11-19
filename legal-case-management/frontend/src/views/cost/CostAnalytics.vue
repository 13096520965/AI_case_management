<template>
  <div class="cost-analytics-container">
    <PageHeader title="成本分析" :breadcrumb="breadcrumb" />
    
    <!-- Filter Section -->
    <el-card class="filter-card">
      <el-form :inline="true" :model="filterForm">
        <el-form-item label="案件">
          <el-select 
            v-model="filterForm.caseId" 
            placeholder="选择案件" 
            clearable
            filterable
            @change="loadAnalytics"
          >
            <el-option 
              v-for="caseItem in caseList" 
              :key="caseItem.id" 
              :label="caseItem.case_number" 
              :value="caseItem.id" 
            />
          </el-select>
        </el-form-item>
        <el-form-item label="时间范围">
          <el-date-picker
            v-model="filterForm.dateRange"
            type="daterange"
            range-separator="至"
            start-placeholder="开始日期"
            end-placeholder="结束日期"
            value-format="YYYY-MM-DD"
            @change="loadAnalytics"
          />
        </el-form-item>
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
  dateRange: null as any
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
  if (!filterForm.caseId) {
    ElMessage.warning('请选择案件')
    return
  }

  try {
    const response = await costApi.getCostAnalytics(filterForm.caseId)
    analytics.value = response.data || {}
    
    await nextTick()
    renderCharts()
  } catch (error) {
    ElMessage.error('加载成本分析数据失败')
    console.error(error)
  }
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
