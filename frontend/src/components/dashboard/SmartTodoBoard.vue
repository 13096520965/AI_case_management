<template>
  <el-card shadow="hover" class="smart-todo-board">
    <template #header>
      <div class="board-header">
        <div class="header-left">
          <el-icon :size="20" color="#409EFF"><Checked /></el-icon>
          <span class="header-title">智能待办看板</span>
          <el-tag size="small" type="danger" v-if="urgentCount > 0">{{ urgentCount }} 紧急</el-tag>
        </div>
        <div class="header-right">
          <el-button-group size="small">
            <el-button :type="viewMode === 'all' ? 'primary' : ''" @click="viewMode = 'all'">
              全部 ({{ todoList.length }})
            </el-button>
            <el-button :type="viewMode === 'urgent' ? 'primary' : ''" @click="viewMode = 'urgent'">
              紧急 ({{ urgentCount }})
            </el-button>
            <el-button :type="viewMode === 'today' ? 'primary' : ''" @click="viewMode = 'today'">
              今日 ({{ todayCount }})
            </el-button>
          </el-button-group>
          <el-button size="small" @click="refreshTodos" :loading="loading">
            <el-icon><Refresh /></el-icon>
          </el-button>
        </div>
      </div>
    </template>

    <div class="todo-board-content" v-loading="loading">
      <el-empty v-if="filteredTodos.length === 0" description="暂无待办事项" :image-size="100" />
      
      <div v-else class="todo-list">
        <div 
          v-for="todo in filteredTodos" 
          :key="todo.id"
          class="todo-card"
          :class="[
            `priority-${todo.priority}`,
            { 'is-overdue': todo.isOverdue, 'is-urgent': todo.isUrgent }
          ]"
          @click="handleTodoClick(todo)"
        >
          <!-- 优先级指示器 -->
          <div class="priority-indicator" :class="`priority-${todo.priority}`"></div>
          
          <div class="todo-main">
            <!-- 左侧图标 -->
            <div class="todo-icon-wrapper">
              <el-icon 
                :size="32" 
                :color="getTodoIconColor(todo)"
                class="todo-icon"
              >
                <component :is="getTodoIcon(todo)" />
              </el-icon>
            </div>

            <!-- 中间内容 -->
            <div class="todo-content">
              <div class="todo-header-row">
                <div class="todo-title">
                  {{ todo.title }}
                  <el-tag 
                    v-if="todo.isOverdue" 
                    type="danger" 
                    size="small" 
                    effect="dark"
                    style="margin-left: 8px;"
                  >
                    已超期
                  </el-tag>
                  <el-tag 
                    v-else-if="todo.isUrgent" 
                    type="warning" 
                    size="small"
                    style="margin-left: 8px;"
                  >
                    即将到期
                  </el-tag>
                </div>
                <div class="todo-score">
                  <el-tooltip content="智能优先级评分" placement="top">
                    <el-tag :type="getScoreType(todo.score)" size="small">
                      {{ todo.score }}分
                    </el-tag>
                  </el-tooltip>
                </div>
              </div>

              <div class="todo-description">
                <el-icon :size="14"><Document /></el-icon>
                {{ todo.caseNumber }} - {{ todo.caseCause }}
              </div>

              <div class="todo-meta">
                <div class="meta-item">
                  <el-icon :size="14"><Calendar /></el-icon>
                  <span>{{ formatDeadline(todo.deadline) }}</span>
                  <span v-if="todo.daysLeft !== null" class="days-left" :class="{ 'urgent': todo.daysLeft <= 3 }">
                    ({{ todo.daysLeft > 0 ? `还剩${todo.daysLeft}天` : `超期${Math.abs(todo.daysLeft)}天` }})
                  </span>
                </div>
                <div class="meta-item">
                  <el-icon :size="14"><User /></el-icon>
                  <span>{{ todo.handler || '未分配' }}</span>
                </div>
                <div class="meta-item" v-if="todo.targetAmount">
                  <el-icon :size="14"><Money /></el-icon>
                  <span>{{ formatAmount(todo.targetAmount) }}</span>
                </div>
              </div>

              <!-- 标签 -->
              <div class="todo-tags">
                <el-tag size="small" type="info">{{ todo.nodeType }}</el-tag>
                <el-tag size="small" :type="getCaseTypeTag(todo.caseType)">{{ todo.caseType }}</el-tag>
              </div>
            </div>

            <!-- 右侧操作 -->
            <div class="todo-actions">
              <el-button size="small" type="primary" @click.stop="handleComplete(todo)">
                完成
              </el-button>
              <el-button size="small" @click.stop="handleViewCase(todo)">
                查看
              </el-button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </el-card>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { 
  Checked, Refresh, Document, Calendar, User, Money,
  WarningFilled, Clock, DocumentChecked, Bell
} from '@element-plus/icons-vue'
import { processNodeApi } from '@/api/processNode'

interface SmartTodo {
  id: number
  caseId: number
  caseNumber: string
  caseCause: string
  caseType: string
  nodeType: string
  title: string
  deadline: string
  handler: string
  targetAmount: number
  priority: 'critical' | 'high' | 'medium' | 'low'
  score: number
  isOverdue: boolean
  isUrgent: boolean
  daysLeft: number | null
}

const router = useRouter()
const loading = ref(false)
const todoList = ref<SmartTodo[]>([])
const viewMode = ref<'all' | 'urgent' | 'today'>('all')

// 添加缓存时间戳，避免频繁刷新
let lastLoadTime = 0
const CACHE_DURATION = 30000 // 30秒缓存

const urgentCount = computed(() => 
  todoList.value.filter(t => t.isOverdue || t.isUrgent).length
)

const todayCount = computed(() => 
  todoList.value.filter(t => t.daysLeft !== null && t.daysLeft === 0).length
)

const filteredTodos = computed(() => {
  let filtered = todoList.value
  
  if (viewMode.value === 'urgent') {
    filtered = filtered.filter(t => t.isOverdue || t.isUrgent)
  } else if (viewMode.value === 'today') {
    filtered = filtered.filter(t => t.daysLeft !== null && t.daysLeft === 0)
  }
  
  return filtered
})

// 智能计算优先级评分
const calculatePriorityScore = (node: any, caseData: any): number => {
  let score = 50 // 基础分

  // 1. 时效性评分 (0-30分)
  const daysLeft = node.daysLeft
  if (daysLeft !== null) {
    if (daysLeft < 0) score += 30 // 已超期
    else if (daysLeft <= 1) score += 25
    else if (daysLeft <= 3) score += 20
    else if (daysLeft <= 7) score += 15
    else if (daysLeft <= 14) score += 10
    else score += 5
  }

  // 2. 标的额评分 (0-25分)
  const amount = caseData.target_amount || 0
  if (amount >= 10000000) score += 25 // 1000万以上
  else if (amount >= 5000000) score += 20 // 500万以上
  else if (amount >= 1000000) score += 15 // 100万以上
  else if (amount >= 500000) score += 10 // 50万以上
  else if (amount >= 100000) score += 5 // 10万以上

  // 3. 节点类型重要性 (0-15分)
  const importantNodes = ['开庭', '判决', '上诉', '执行']
  if (importantNodes.includes(node.node_type)) score += 15
  else if (['举证', '答辩'].includes(node.node_type)) score += 10
  else score += 5

  // 4. 案件类型影响 (0-10分)
  if (caseData.case_type === '刑事') score += 10
  else if (caseData.case_type === '行政') score += 8
  else if (caseData.case_type === '民事') score += 6
  else score += 4

  return Math.min(100, Math.round(score))
}

// 根据评分确定优先级
const getPriorityLevel = (score: number): 'critical' | 'high' | 'medium' | 'low' => {
  if (score >= 85) return 'critical'
  if (score >= 70) return 'high'
  if (score >= 50) return 'medium'
  return 'low'
}

// 加载智能待办
const loadSmartTodos = async () => {
  // 检查缓存
  const now = Date.now()
  if (todoList.value.length > 0 && now - lastLoadTime < CACHE_DURATION) {
    console.log('使用缓存的待办数据')
    return
  }
  
  loading.value = true
  try {
    // 并行获取超期和即将到期的节点
    const [overdueResponse, upcomingResponse] = await Promise.all([
      processNodeApi.getOverdueNodes().catch(err => {
        console.warn('Failed to load overdue nodes:', err)
        return { data: [] }
      }),
      processNodeApi.getUpcomingNodes(14).catch(err => {
        console.warn('Failed to load upcoming nodes:', err)
        return { data: { nodes: [] } }
      })
    ])
    
    const overdueNodes = overdueResponse.data || []
    const upcomingNodes = upcomingResponse.data?.nodes || []
    
    // 合并节点并去重
    const combinedNodes = [...overdueNodes, ...upcomingNodes]
    const uniqueNodes = Array.from(
      new Map(combinedNodes.map(node => [node.id, node])).values()
    )
    
    // 处理节点数据（后端已经包含案件信息，无需额外请求）
    const todos: SmartTodo[] = uniqueNodes.map(node => {
      // 计算剩余天数
      let daysLeft: number | null = null
      let isOverdue = false
      let isUrgent = false
      
      if (node.deadline) {
        const deadline = new Date(node.deadline)
        const today = new Date()
        today.setHours(0, 0, 0, 0)
        deadline.setHours(0, 0, 0, 0)
        
        daysLeft = Math.ceil((deadline.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
        isOverdue = daysLeft < 0
        isUrgent = daysLeft >= 0 && daysLeft <= 3
      }
      
      // 使用后端返回的案件信息
      const caseData = {
        case_number: node.case_number,
        internal_number: node.internal_number,
        case_cause: node.case_cause || '未知',
        case_type: node.case_type || '民事',
        target_amount: node.target_amount || 0
      }
      
      // 计算优先级评分
      const nodeWithDays = { ...node, daysLeft }
      const score = calculatePriorityScore(nodeWithDays, caseData)
      const priority = getPriorityLevel(score)
      
      return {
        id: node.id,
        caseId: node.case_id,
        caseNumber: caseData.case_number || caseData.internal_number || `案件${node.case_id}`,
        caseCause: caseData.case_cause,
        caseType: caseData.case_type,
        nodeType: node.node_type || '其他',
        title: node.node_name || '未命名节点',
        deadline: node.deadline || '',
        handler: node.handler || '',
        targetAmount: caseData.target_amount,
        priority,
        score,
        isOverdue,
        isUrgent,
        daysLeft
      }
    })
    
    // 按优先级评分排序（高分在前）
    todos.sort((a, b) => b.score - a.score)
    
    // 限制显示数量，避免渲染过多DOM
    todoList.value = todos.slice(0, 50)
    
    // 更新缓存时间
    lastLoadTime = Date.now()
    
  } catch (error) {
    console.error('Failed to load smart todos:', error)
    ElMessage.error('加载待办事项失败')
  } finally {
    loading.value = false
  }
}

const refreshTodos = () => {
  // 强制刷新，忽略缓存
  lastLoadTime = 0
  loadSmartTodos()
}

const getTodoIcon = (todo: SmartTodo) => {
  if (todo.isOverdue) return WarningFilled
  if (todo.isUrgent) return Clock
  if (todo.nodeType === '开庭') return Bell
  return DocumentChecked
}

const getTodoIconColor = (todo: SmartTodo) => {
  if (todo.isOverdue) return '#f56c6c'
  if (todo.isUrgent) return '#e6a23c'
  if (todo.priority === 'critical') return '#f56c6c'
  if (todo.priority === 'high') return '#e6a23c'
  return '#409eff'
}

const getScoreType = (score: number) => {
  if (score >= 85) return 'danger'
  if (score >= 70) return 'warning'
  if (score >= 50) return 'success'
  return 'info'
}

const getCaseTypeTag = (type: string) => {
  const tagMap: Record<string, string> = {
    '民事': '',
    '刑事': 'danger',
    '行政': 'warning',
    '劳动仲裁': 'success'
  }
  return tagMap[type] || ''
}

const formatAmount = (amount: number): string => {
  if (amount >= 100000000) return (amount / 100000000).toFixed(2) + '亿'
  if (amount >= 10000) return (amount / 10000).toFixed(2) + '万'
  return amount.toFixed(2)
}

const formatDeadline = (deadline: string): string => {
  if (!deadline) return '-'
  return deadline.split('T')[0]
}

const handleTodoClick = (todo: SmartTodo) => {
  router.push(`/cases/${todo.caseId}`)
}

const handleComplete = async (todo: SmartTodo) => {
  ElMessage.info('完成功能开发中...')
}

const handleViewCase = (todo: SmartTodo) => {
  router.push(`/cases/${todo.caseId}`)
}

onMounted(() => {
  loadSmartTodos()
})
</script>

<style scoped>
.smart-todo-board {
  height: 100%;
}

.board-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 10px;
}

.header-title {
  font-weight: bold;
  font-size: 16px;
}

.header-right {
  display: flex;
  gap: 10px;
}

.todo-board-content {
  max-height: 600px;
  overflow-y: auto;
  /* 优化滚动性能 */
  overflow-scrolling: touch;
  -webkit-overflow-scrolling: touch;
  will-change: scroll-position;
}

.todo-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.todo-card {
  position: relative;
  border: 1px solid #ebeef5;
  border-radius: 8px;
  padding: 16px;
  transition: all 0.3s;
  cursor: pointer;
  background: white;
  /* 优化渲染性能 */
  contain: layout style paint;
  will-change: transform;
}

.todo-card:hover {
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
  transform: translateY(-2px);
}

.todo-card.is-overdue {
  border-left: 4px solid #f56c6c;
  background: #fef0f0;
}

.todo-card.is-urgent {
  border-left: 4px solid #e6a23c;
  background: #fdf6ec;
}

.todo-card.priority-critical {
  border-left: 4px solid #f56c6c;
}

.todo-card.priority-high {
  border-left: 4px solid #e6a23c;
}

.todo-card.priority-medium {
  border-left: 4px solid #409eff;
}

.priority-indicator {
  position: absolute;
  top: 0;
  right: 0;
  width: 0;
  height: 0;
  border-style: solid;
  border-width: 0 30px 30px 0;
  border-color: transparent #f56c6c transparent transparent;
}

.priority-indicator.priority-critical {
  border-color: transparent #f56c6c transparent transparent;
}

.priority-indicator.priority-high {
  border-color: transparent #e6a23c transparent transparent;
}

.priority-indicator.priority-medium {
  border-color: transparent #409eff transparent transparent;
}

.priority-indicator.priority-low {
  border-color: transparent #909399 transparent transparent;
}

.todo-main {
  display: flex;
  gap: 16px;
  align-items: flex-start;
}

.todo-icon-wrapper {
  flex-shrink: 0;
  width: 48px;
  height: 48px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f5f7fa;
  border-radius: 8px;
}

.todo-content {
  flex: 1;
  min-width: 0;
}

.todo-header-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.todo-title {
  font-size: 16px;
  font-weight: 600;
  color: #303133;
  display: flex;
  align-items: center;
}

.todo-score {
  flex-shrink: 0;
}

.todo-description {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 14px;
  color: #606266;
  margin-bottom: 8px;
}

.todo-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
  margin-bottom: 8px;
}

.meta-item {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 13px;
  color: #909399;
}

.days-left {
  font-weight: 500;
  color: #409eff;
}

.days-left.urgent {
  color: #f56c6c;
}

.todo-tags {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.todo-actions {
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

@media (max-width: 768px) {
  .todo-main {
    flex-direction: column;
  }
  
  .todo-actions {
    flex-direction: row;
    width: 100%;
  }
  
  .todo-actions .el-button {
    flex: 1;
  }
}
</style>
