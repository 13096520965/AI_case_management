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
        <el-card shadow="hover" class="chart-card">
          <template #header>
            <div class="card-header">
              <span>成本分析</span>
            </div>
          </template>
          <div ref="costChartRef" class="chart-container"></div>
        </el-card>
      </el-col>
      
      <el-col :xs="24" :md="12">
        <el-card shadow="hover" class="todo-card">
          <template #header>
            <div class="card-header todo-header">
              <div class="header-left">
                <span class="header-title">待办事项</span>
                <el-badge :value="totalAlerts" :max="99" class="alert-badge" />
              </div>
              <div class="header-right">
                <el-button 
                  :icon="RefreshIcon" 
                  circle 
                  size="small" 
                  @click="refreshAlertList"
                  :loading="loading"
                  title="刷新"
                />
              </div>
            </div>
          </template>
          <div 
            class="todo-list" 
            @scroll="handleScroll"
            v-loading="loading"
          >
            <TableEmpty v-if="alertList.length === 0 && !loading" description="暂无待办事项" />
            <div v-else>
              <div 
                v-for="item in alertList" 
                :key="item.id" 
                class="todo-item"
                :class="{ 'is-unread': item.status === 'unread' }"
                @click="handleAlertClick(item)"
              >
                <div class="item-dot" v-if="item.status === 'unread'"></div>
                <div class="item-icon">
                  <el-icon :size="18" :color="getNotificationColor(item)">
                    <component :is="getNotificationIcon(item)" />
                  </el-icon>
                </div>
                <div class="item-content">
                  <div class="item-text">{{ item.content }}</div>
                  <div class="item-desc" v-if="item.caseNumber">案件编号: {{ item.caseNumber }}</div>
                  <div class="item-time">{{ formatTime(item.scheduledTime) }}</div>
                </div>
              </div>
              <div v-if="hasMore" class="load-more">
                <el-text type="info" size="small">下滑加载更多...</el-text>
              </div>
              <div v-else-if="alertList.length > 0" class="no-more">
                <el-text type="info" size="small">没有更多了</el-text>
              </div>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, shallowRef } from 'vue'
import { useRouter } from 'vue-router'
import { Folder, Money, TrendCharts, Bell, Warning, Clock, Refresh, Document } from '@element-plus/icons-vue'
import * as echarts from 'echarts'
import type { ECharts } from 'echarts'
import { analyticsApi } from '@/api/analytics'
import { notificationApi } from '@/api/notification'
import { ElMessage } from 'element-plus'
import TableEmpty from '@/components/common/TableEmpty.vue'

const RefreshIcon = shallowRef(Refresh)

interface DashboardData {
  totalCases: number
  totalTargetAmount: number
  averageWinRate: number
  pendingTasks: number
}

interface AlertItem {
  id: number
  taskType: string
  type?: string
  content: string
  caseId?: number
  caseNumber?: string
  caseName?: string
  status: string
  scheduledTime: string
  createdAt: string
}

const router = useRouter()

const dashboardData = ref<DashboardData>({
  totalCases: 0,
  totalTargetAmount: 0,
  averageWinRate: 0,
  pendingTasks: 0
})

const alertList = ref<AlertItem[]>([])
const loading = ref(false)
const currentPage = ref(1)
const pageSize = ref(20)
const totalAlerts = ref(0)
const hasMore = ref(true)

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

const loadAlertList = async (append = false) => {
  if (loading.value) return
  
  try {
    loading.value = true
    
    const response = await notificationApi.getNotifications({ 
      page: currentPage.value,
      pageSize: pageSize.value,
      status: 'unread'  // 只获取未读提醒
    })
    
    console.log('Dashboard Alert Response:', response)
    
    if (response.data) {
      let newAlerts = []
      let total = 0
      
      // 检查返回的数据格式
      if (response.data.list) {
        // 分页格式
        newAlerts = response.data.list || []
        total = response.data.total || 0
      } else if (Array.isArray(response.data)) {
        // 数组格式（兼容旧接口）
        newAlerts = response.data
        total = response.data.length
      }
      
      console.log('New alerts:', newAlerts)
      console.log('Total:', total)
      
      if (append) {
        alertList.value = [...alertList.value, ...newAlerts]
      } else {
        alertList.value = newAlerts
      }
      
      totalAlerts.value = total
      hasMore.value = alertList.value.length < total
      
      console.log('Alert list after update:', alertList.value)
      console.log('Has more:', hasMore.value)
      
      // 同步更新待办事项数量
      dashboardData.value.pendingTasks = total
    }
  } catch (error) {
    console.error('Failed to load alert list:', error)
    ElMessage.error('加载待办事项失败')
  } finally {
    loading.value = false
  }
}

// 刷新提醒列表（重置到第一页）
const refreshAlertList = async () => {
  currentPage.value = 1
  await loadAlertList(false)
}

const handleScroll = (event: Event) => {
  const target = event.target as HTMLElement
  const scrollTop = target.scrollTop
  const scrollHeight = target.scrollHeight
  const clientHeight = target.clientHeight
  
  // 当滚动到底部附近时加载更多
  if (scrollHeight - scrollTop - clientHeight < 50 && hasMore.value && !loading.value) {
    currentPage.value++
    loadAlertList(true)
  }
}

const getNotificationIcon = (alert: AlertItem) => {
  const taskType = alert.taskType || alert.type || ''
  
  if (taskType.includes('overdue')) {
    return Warning
  } else if (taskType.includes('deadline')) {
    return Clock
  } else if (taskType.includes('payment')) {
    return Money
  } else if (taskType.includes('task')) {
    return Document
  }
  return Bell
}

const getNotificationColor = (alert: AlertItem): string => {
  const taskType = alert.taskType || alert.type || ''
  
  if (taskType.includes('overdue')) {
    return '#F56C6C'
  } else if (taskType.includes('deadline')) {
    return '#E6A23C'
  } else if (taskType.includes('payment')) {
    return '#409EFF'
  } else if (taskType.includes('task')) {
    return '#67C23A'
  }
  return '#909399'
}

const formatTime = (time: string): string => {
  if (!time) return ''
  const date = new Date(time)
  const now = new Date()
  const diff = now.getTime() - date.getTime()
  const days = Math.floor(diff / (1000 * 60 * 60 * 24))
  
  if (days === 0) {
    const hours = Math.floor(diff / (1000 * 60 * 60))
    if (hours === 0) {
      const minutes = Math.floor(diff / (1000 * 60))
      return minutes <= 0 ? '刚刚' : `${minutes}分钟前`
    }
    return `${hours}小时前`
  } else if (days === 1) {
    return '昨天'
  } else if (days < 7) {
    return `${days}天前`
  }
  
  return date.toLocaleDateString('zh-CN')
}

const handleAlertClick = async (alert: AlertItem) => {
  try {
    // 标记为已读
    await notificationApi.markAsRead(alert.id)
    
    // 更新本地列表，移除已读项
    alertList.value = alertList.value.filter(item => item.id !== alert.id)
    totalAlerts.value = Math.max(0, totalAlerts.value - 1)
    dashboardData.value.pendingTasks = totalAlerts.value
    
    // 跳转到案件详情或提醒中心
    if (alert.caseId) {
      router.push(`/cases/${alert.caseId}`)
    } else {
      router.push('/notifications/alerts')
    }
  } catch (error) {
    console.error('Failed to handle alert click:', error)
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
  await loadAlertList()
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

/* 图表卡片样式 */
.chart-card :deep(.el-card__header) {
  padding: 16px 20px;
  border-bottom: 1px solid #ebeef5;
}

.chart-card :deep(.el-card__body) {
  padding: 20px;
}

/* 待办事项卡片样式 */
.todo-card {
  display: flex;
  flex-direction: column;
  height: 100%;
}

.todo-card :deep(.el-card__header) {
  padding: 12px 16px;
  border-bottom: 1px solid #f0f0f0;
}

.todo-card :deep(.el-card__body) {
  padding: 0;
  flex: 1;
  overflow: hidden;
}

.todo-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  gap: 12px;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 8px;
  flex: 1;
  min-width: 0;
}

.header-title {
  font-size: 16px;
  font-weight: 600;
  color: #303133;
  white-space: nowrap;
}

.header-right {
  display: flex;
  align-items: center;
  flex-shrink: 0;
  margin-left: auto;
}

.alert-badge {
  flex-shrink: 0;
}

.todo-list {
  height: 350px;
  overflow-y: auto;
  overflow-x: hidden;
  position: relative;
  padding: 8px 0;
  word-wrap: break-word;
}

.todo-list::-webkit-scrollbar {
  width: 6px;
}

.todo-list::-webkit-scrollbar-thumb {
  background-color: #dcdfe6;
  border-radius: 3px;
}

.todo-list::-webkit-scrollbar-thumb:hover {
  background-color: #c0c4cc;
}

.todo-item {
  position: relative;
  display: flex;
  align-items: flex-start;
  padding: 12px 16px;
  cursor: pointer;
  transition: background-color 0.3s;
  border-bottom: 1px solid #ebeef5;
}

.todo-item:first-child {
  border-top: 1px solid #ebeef5;
}

.todo-item:hover {
  background-color: #f5f7fa;
}

.item-dot {
  position: absolute;
  left: 8px;
  top: 18px;
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background-color: #f56c6c;
}

.item-icon {
  flex-shrink: 0;
  margin-right: 12px;
  margin-top: 2px;
}

.item-content {
  flex: 1;
  min-width: 0;
}

.item-text {
  font-size: 14px;
  color: #606266;
  line-height: 1.5;
  margin-bottom: 4px;
  word-wrap: break-word;
  word-break: break-word;
  white-space: normal;
}

.item-desc {
  font-size: 12px;
  color: #909399;
  margin-bottom: 4px;
  word-wrap: break-word;
  word-break: break-word;
  white-space: normal;
}

.item-time {
  font-size: 12px;
  color: #909399;
}

.load-more,
.no-more {
  text-align: center;
  padding: 15px;
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
