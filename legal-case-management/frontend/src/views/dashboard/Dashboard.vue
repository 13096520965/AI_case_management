<template>
  <div class="dashboard-container">
    <el-row :gutter="20" class="stats-cards">
      <el-col :xs="24" :sm="12" :md="6">
        <el-card shadow="hover" class="stat-card">
          <div class="stat-content">
            <div class="stat-icon case-icon">
              <el-icon :size="40"><Folder /></el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-value">{{ dashboardData.totalCases || 0 }}</div>
              <div class="stat-label">案件总量</div>
            </div>
          </div>
        </el-card>
      </el-col>
      
      <el-col :xs="24" :sm="12" :md="6">
        <el-card shadow="hover" class="stat-card">
          <div class="stat-content">
            <div class="stat-icon amount-icon">
              <el-icon :size="40"><Money /></el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-value">{{ formatAmount(dashboardData.totalTargetAmount) }}</div>
              <div class="stat-label">标的额总计</div>
            </div>
          </div>
        </el-card>
      </el-col>
      
      <el-col :xs="24" :sm="12" :md="6">
        <el-card shadow="hover" class="stat-card">
          <div class="stat-content">
            <div class="stat-icon rate-icon">
              <el-icon :size="40"><TrendCharts /></el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-value">{{ dashboardData.averageWinRate || 0 }}%</div>
              <div class="stat-label">平均胜诉率</div>
            </div>
          </div>
        </el-card>
      </el-col>
      
      <el-col :xs="24" :sm="12" :md="6">
        <el-card shadow="hover" class="stat-card">
          <div class="stat-content">
            <div class="stat-icon todo-icon">
              <el-icon :size="40"><Bell /></el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-value">{{ dashboardData.pendingTasks || 0 }}</div>
              <div class="stat-label">待办事项</div>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <el-row :gutter="20" class="charts-row">
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
      
      <el-col :xs="24" :md="12">
        <el-card shadow="hover">
          <template #header>
            <div class="card-header">
              <span>案件数量趋势</span>
            </div>
          </template>
          <div ref="caseTrendChartRef" class="chart-container"></div>
        </el-card>
      </el-col>
    </el-row>

    <el-row :gutter="20" class="charts-row">
      <el-col :xs="24" :md="12">
        <el-card shadow="hover">
          <template #header>
            <div class="card-header">
              <span>成本分析</span>
            </div>
          </template>
          <div ref="costChartRef" class="chart-container"></div>
        </el-card>
      </el-col>
      
      <el-col :xs="24" :md="12">
        <el-card shadow="hover">
          <template #header>
            <div class="card-header">
              <span>待办事项</span>
            </div>
          </template>
          <div class="todo-list">
            <el-empty v-if="todoList.length === 0" description="暂无待办事项" />
            <div v-else>
              <div v-for="item in todoList" :key="item.id" class="todo-item" :class="item.priority">
                <div class="todo-icon">
                  <el-icon v-if="item.type === 'overdue'" color="#f56c6c"><WarningFilled /></el-icon>
                  <el-icon v-else-if="item.type === 'deadline'" color="#e6a23c"><Clock /></el-icon>
                  <el-icon v-else color="#409eff"><DocumentChecked /></el-icon>
                </div>
                <div class="todo-content">
                  <div class="todo-title">{{ item.title }}</div>
                  <div class="todo-desc">{{ item.description }}</div>
                  <div class="todo-time">{{ item.time }}</div>
                </div>
              </div>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { Folder, Money, TrendCharts, Bell, WarningFilled, Clock, DocumentChecked } from '@element-plus/icons-vue'
import * as echarts from 'echarts'
import type { ECharts } from 'echarts'
import { analyticsApi } from '@/api/analytics'
import { notificationApi } from '@/api/notification'
import { processNodeApi } from '@/api/processNode'
import { costApi } from '@/api/cost'
import { ElMessage } from 'element-plus'

interface DashboardData {
  totalCases: number
  totalTargetAmount: number
  averageWinRate: number
  pendingTasks: number
}

interface TodoItem {
  id: number
  type: 'overdue' | 'deadline' | 'payment'
  priority: 'high' | 'medium' | 'low'
  title: string
  description: string
  time: string
}

const dashboardData = ref<DashboardData>({
  totalCases: 0,
  totalTargetAmount: 0,
  averageWinRate: 0,
  pendingTasks: 0
})

const todoList = ref<TodoItem[]>([])

const caseTypeChartRef = ref<HTMLElement>()
const caseTrendChartRef = ref<HTMLElement>()
const costChartRef = ref<HTMLElement>()

let caseTypeChart: ECharts | null = null
let caseTrendChart: ECharts | null = null
let costChart: ECharts | null = null

const formatAmount = (amount: number = 0): string => {
  if (amount >= 100000000) {
    return (amount / 100000000).toFixed(2) + '亿'
  } else if (amount >= 10000) {
    return (amount / 10000).toFixed(2) + '万'
  }
  return amount.toFixed(2)
}

const loadDashboardData = async () => {
  try {
    const response = await analyticsApi.getDashboard()
    if (response.data) {
      const data = response.data
      dashboardData.value = {
        totalCases: data.summary?.totalCases || 0,
        totalTargetAmount: data.summary?.totalTargetAmount || 0,
        averageWinRate: data.summary?.averageWinRate || 0,
        pendingTasks: (data.alerts?.pendingNodes || 0) + (data.alerts?.overdueNodes || 0)
      }
    }
  } catch (error) {
    console.error('Failed to load dashboard data:', error)
    ElMessage.error('加载驾驶舱数据失败')
  }
}

const loadTodoList = async () => {
  try {
    const todos: TodoItem[] = []
    
    // Get pending notifications
    const notificationResponse = await notificationApi.getNotifications({ 
      status: 'pending',
      pageSize: 5 
    })
    
    if (notificationResponse.data?.list) {
      notificationResponse.data.list.forEach((notification: any) => {
        let type: 'overdue' | 'deadline' | 'payment' = 'deadline'
        let priority: 'high' | 'medium' | 'low' = 'medium'
        
        if (notification.taskType === 'overdue_warning') {
          type = 'overdue'
          priority = 'high'
        } else if (notification.taskType === 'payment_reminder') {
          type = 'payment'
          priority = 'medium'
        }
        
        todos.push({
          id: notification.id,
          type,
          priority,
          title: notification.content || '待办事项',
          description: `案件相关提醒`,
          time: notification.scheduledTime || ''
        })
      })
    }
    
    todoList.value = todos
  } catch (error) {
    console.error('Failed to load todo list:', error)
  }
}

const initCaseTypeChart = async () => {
  if (!caseTypeChartRef.value) return
  
  try {
    const response = await analyticsApi.getDashboard()
    const data = response.data?.caseTypeDistribution || []
    
    caseTypeChart = echarts.init(caseTypeChartRef.value)
    
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
          radius: '50%',
          data: data.map((item: any) => ({
            value: item.count,
            name: item.case_type || '未分类'
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
    
    caseTypeChart.setOption(option)
  } catch (error) {
    console.error('Failed to init case type chart:', error)
  }
}

const initCaseTrendChart = async () => {
  if (!caseTrendChartRef.value) return
  
  try {
    const response = await analyticsApi.getDashboard()
    const data = response.data?.caseTrend || []
    
    caseTrendChart = echarts.init(caseTrendChartRef.value)
    
    const option = {
      tooltip: {
        trigger: 'axis'
      },
      xAxis: {
        type: 'category',
        data: data.map((item: any) => item.month),
        boundaryGap: false
      },
      yAxis: {
        type: 'value'
      },
      series: [
        {
          name: '案件数量',
          type: 'line',
          data: data.map((item: any) => item.count),
          smooth: true,
          areaStyle: {
            color: 'rgba(64, 158, 255, 0.2)'
          },
          itemStyle: {
            color: '#409eff'
          }
        }
      ]
    }
    
    caseTrendChart.setOption(option)
  } catch (error) {
    console.error('Failed to init case trend chart:', error)
  }
}

const initCostChart = async () => {
  if (!costChartRef.value) return
  
  try {
    // Mock cost data - in real scenario, this would come from an API
    const costData = [
      { type: '诉讼费', amount: 50000 },
      { type: '律师费', amount: 120000 },
      { type: '保全费', amount: 30000 },
      { type: '鉴定费', amount: 20000 },
      { type: '其他', amount: 10000 }
    ]
    
    costChart = echarts.init(costChartRef.value)
    
    const option = {
      tooltip: {
        trigger: 'axis',
        axisPointer: {
          type: 'shadow'
        }
      },
      xAxis: {
        type: 'category',
        data: costData.map(item => item.type)
      },
      yAxis: {
        type: 'value',
        axisLabel: {
          formatter: (value: number) => {
            if (value >= 10000) {
              return (value / 10000) + '万'
            }
            return value.toString()
          }
        }
      },
      series: [
        {
          name: '费用',
          type: 'bar',
          data: costData.map(item => item.amount),
          itemStyle: {
            color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
              { offset: 0, color: '#83bff6' },
              { offset: 0.5, color: '#188df0' },
              { offset: 1, color: '#188df0' }
            ])
          },
          emphasis: {
            itemStyle: {
              color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
                { offset: 0, color: '#2378f7' },
                { offset: 0.7, color: '#2378f7' },
                { offset: 1, color: '#83bff6' }
              ])
            }
          }
        }
      ]
    }
    
    costChart.setOption(option)
  } catch (error) {
    console.error('Failed to init cost chart:', error)
  }
}

const handleResize = () => {
  caseTypeChart?.resize()
  caseTrendChart?.resize()
  costChart?.resize()
}

onMounted(async () => {
  await loadDashboardData()
  await loadTodoList()
  await initCaseTypeChart()
  await initCaseTrendChart()
  await initCostChart()
  
  window.addEventListener('resize', handleResize)
})

onUnmounted(() => {
  window.removeEventListener('resize', handleResize)
  caseTypeChart?.dispose()
  caseTrendChart?.dispose()
  costChart?.dispose()
})
</script>

<style scoped>
.dashboard-container {
  padding: 20px;
}

.stats-cards {
  margin-bottom: 20px;
}

.stat-card {
  margin-bottom: 20px;
}

.stat-content {
  display: flex;
  align-items: center;
  gap: 20px;
}

.stat-icon {
  width: 60px;
  height: 60px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.case-icon {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}

.amount-icon {
  background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
  color: white;
}

.rate-icon {
  background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
  color: white;
}

.todo-icon {
  background: linear-gradient(135deg, #43e97b 0%, #38f9d7 100%);
  color: white;
}

.stat-info {
  flex: 1;
}

.stat-value {
  font-size: 28px;
  font-weight: bold;
  color: #303133;
  margin-bottom: 5px;
}

.stat-label {
  font-size: 14px;
  color: #909399;
}

.charts-row {
  margin-bottom: 20px;
}

.card-header {
  font-weight: bold;
  font-size: 16px;
}

.chart-container {
  width: 100%;
  height: 350px;
}

.todo-list {
  max-height: 350px;
  overflow-y: auto;
}

.todo-item {
  display: flex;
  gap: 15px;
  padding: 15px;
  border-bottom: 1px solid #ebeef5;
  transition: background-color 0.3s;
}

.todo-item:hover {
  background-color: #f5f7fa;
}

.todo-item:last-child {
  border-bottom: none;
}

.todo-item.high {
  border-left: 3px solid #f56c6c;
}

.todo-item.medium {
  border-left: 3px solid #e6a23c;
}

.todo-item.low {
  border-left: 3px solid #409eff;
}

.todo-icon {
  flex-shrink: 0;
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: #f5f7fa;
  border-radius: 50%;
}

.todo-content {
  flex: 1;
}

.todo-title {
  font-size: 14px;
  font-weight: 500;
  color: #303133;
  margin-bottom: 5px;
}

.todo-desc {
  font-size: 13px;
  color: #606266;
  margin-bottom: 5px;
}

.todo-time {
  font-size: 12px;
  color: #909399;
}

@media (max-width: 768px) {
  .stat-value {
    font-size: 24px;
  }
  
  .chart-container {
    height: 300px;
  }
}
</style>
