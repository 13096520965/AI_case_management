<template>
  <div class="legal-assistant">
    <!-- 可拖拽的触发按钮 -->
    <div
      class="assistant-trigger"
      :style="{ left: position.x + 'px', top: position.y + 'px' }"
      @mousedown="startDrag"
      @click="handleClick"
    >
      <el-button 
        type="primary" 
        circle 
        size="large"
      >
        <el-icon :size="24"><ChatDotRound /></el-icon>
      </el-button>
    </div>

    <!-- 助手对话框 -->
    <el-drawer
      v-model="visible"
      title="法盾助手"
      direction="rtl"
      size="400px"
      :before-close="handleClose"
    >
      <div class="assistant-container">
        <!-- 欢迎信息 -->
        <div v-if="messages.length === 0" class="welcome-message">
          <el-icon :size="48" color="#409EFF"><ChatDotRound /></el-icon>
          <h3>您好！我是法盾助手</h3>
          <p>我可以帮您：</p>
          <ul>
            <li>查询案件信息</li>
            <li>生成法律文书</li>
            <li>查看待办事项</li>
            <li>快速导航到功能页面</li>
          </ul>
          <div class="quick-commands">
            <el-tag 
              v-for="cmd in quickCommands" 
              :key="cmd"
              @click="sendMessage(cmd)"
              style="cursor: pointer; margin: 4px;"
            >
              {{ cmd }}
            </el-tag>
          </div>
        </div>

        <!-- 消息列表 -->
        <div class="message-list" ref="messageList">
          <div 
            v-for="(msg, index) in messages" 
            :key="index"
            :class="['message-item', msg.type]"
          >
            <div class="message-avatar">
              <el-icon v-if="msg.type === 'user'" :size="20"><User /></el-icon>
              <el-icon v-else :size="20"><ChatDotRound /></el-icon>
            </div>
            <div class="message-content">
              <div class="message-text">{{ msg.text }}</div>
              <div v-if="msg.actions" class="message-actions">
                <el-button 
                  v-for="action in msg.actions" 
                  :key="action.label"
                  size="small"
                  type="primary"
                  link
                  @click="handleAction(action)"
                >
                  {{ action.label }}
                </el-button>
              </div>
              <div v-if="msg.data" class="message-data">
                <el-table :data="msg.data" size="small" max-height="200">
                  <el-table-column 
                    v-for="col in msg.columns" 
                    :key="col.prop"
                    :prop="col.prop" 
                    :label="col.label"
                    :width="col.width"
                  />
                </el-table>
              </div>
            </div>
          </div>
        </div>

        <!-- 输入框 -->
        <div class="input-container">
          <el-input
            v-model="inputText"
            placeholder="输入您的指令..."
            @keyup.enter="handleSend"
            :disabled="processing"
          >
            <template #append>
              <el-button 
                :icon="Position" 
                @click="handleSend"
                :loading="processing"
              />
            </template>
          </el-input>
        </div>
      </div>
    </el-drawer>
  </div>
</template>

<script setup lang="ts">
import { ref, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { ChatDotRound, User, Position } from '@element-plus/icons-vue'
import { caseApi } from '@/api/case'
import { processNodeApi } from '@/api/processNode'
import { assistantApi } from '@/api/assistant'

const router = useRouter()

const visible = ref(false)
const inputText = ref('')
const processing = ref(false)
const messageList = ref<HTMLElement>()

// 拖拽相关
const position = ref({ x: window.innerWidth - 100, y: window.innerHeight - 100 })
const isDragging = ref(false)
const dragStart = ref({ x: 0, y: 0 })
const clickTimeout = ref<any>(null)

interface Message {
  type: 'user' | 'assistant'
  text: string
  actions?: Array<{ label: string; type: string; data?: any }>
  data?: any[]
  columns?: Array<{ prop: string; label: string; width?: string }>
}

const messages = ref<Message[]>([])

const quickCommands = [
  '查询所有案件',
  '打开案件列表',
  '打开数据分析',
  '查看待办事项'
]

// 拖拽处理
const startDrag = (e: MouseEvent) => {
  isDragging.value = false
  dragStart.value = {
    x: e.clientX - position.value.x,
    y: e.clientY - position.value.y
  }

  const onMouseMove = (e: MouseEvent) => {
    isDragging.value = true
    position.value = {
      x: Math.max(0, Math.min(window.innerWidth - 70, e.clientX - dragStart.value.x)),
      y: Math.max(0, Math.min(window.innerHeight - 70, e.clientY - dragStart.value.y))
    }
  }

  const onMouseUp = () => {
    document.removeEventListener('mousemove', onMouseMove)
    document.removeEventListener('mouseup', onMouseUp)
    
    // 延迟重置拖拽状态，避免触发点击事件
    setTimeout(() => {
      isDragging.value = false
    }, 100)
  }

  document.addEventListener('mousemove', onMouseMove)
  document.addEventListener('mouseup', onMouseUp)
}

const handleClick = () => {
  if (!isDragging.value) {
    toggleAssistant()
  }
}

const toggleAssistant = () => {
  visible.value = !visible.value
}

const handleClose = () => {
  visible.value = false
}

const sendMessage = (text: string) => {
  inputText.value = text
  handleSend()
}

const handleSend = async () => {
  if (!inputText.value.trim() || processing.value) return

  const userMessage = inputText.value.trim()
  
  // 添加用户消息
  messages.value.push({
    type: 'user',
    text: userMessage
  })

  inputText.value = ''
  processing.value = true

  // 滚动到底部
  await nextTick()
  scrollToBottom()

  try {
    // 处理指令
    await processCommand(userMessage)
  } catch (error: any) {
    messages.value.push({
      type: 'assistant',
      text: '抱歉，处理您的请求时出现了错误。请稍后再试。'
    })
  } finally {
    processing.value = false
    await nextTick()
    scrollToBottom()
  }
}

const processCommand = async (command: string) => {
  const lowerCommand = command.toLowerCase()

  // 1. 导航功能 - 优先级最高
  if (lowerCommand.includes('打开') || lowerCommand.includes('跳转') || lowerCommand.includes('进入') || lowerCommand.includes('去')) {
    handleNavigation(command)
  }
  // 2. 查询所有案件
  else if (lowerCommand.includes('所有案件') || lowerCommand.includes('全部案件') || lowerCommand === '案件' || lowerCommand === '查询案件') {
    await handleAllCases()
  }
  // 3. 按状态查询案件
  else if (lowerCommand.includes('立案') || lowerCommand.includes('审理') || lowerCommand.includes('结案') || lowerCommand.includes('归档')) {
    await handleCasesByStatus(command)
  }
  // 4. 按类型查询案件
  else if (lowerCommand.includes('民事') || lowerCommand.includes('刑事') || lowerCommand.includes('行政') || lowerCommand.includes('劳动')) {
    await handleCasesByType(command)
  }
  // 5. 搜索案件（包含关键词）
  else if ((lowerCommand.includes('查询') || lowerCommand.includes('搜索') || lowerCommand.includes('查找')) && lowerCommand.includes('案件')) {
    await handleSearchCases(command)
  }
  // 6. 查看待办事项
  else if (lowerCommand.includes('待办') || lowerCommand.includes('todo') || lowerCommand.includes('任务')) {
    await handleTodoItems()
  }
  // 7. 查询本周开庭
  else if ((lowerCommand.includes('本周') || lowerCommand.includes('这周')) && lowerCommand.includes('开庭')) {
    await handleWeeklyHearings()
  }
  // 8. 查看超期节点
  else if (lowerCommand.includes('超期') || lowerCommand.includes('逾期') || lowerCommand.includes('延期')) {
    await handleOverdueNodes()
  }
  // 9. 帮助信息
  else if (lowerCommand.includes('帮助') || lowerCommand.includes('help') || lowerCommand === '?') {
    showHelp()
  }
  // 10. 默认 - 调用AI助手
  else {
    await handleAIChat(command)
  }
}

// 查询所有案件
const handleAllCases = async () => {
  try {
    const response = await caseApi.getCases({ page: 1, limit: 10 })
    const cases = response.data.cases || response.data.list || []
    const total = response.data.pagination?.total || response.data.total || cases.length

    if (cases.length === 0) {
      messages.value.push({
        type: 'assistant',
        text: '系统中暂无案件。'
      })
    } else {
      messages.value.push({
        type: 'assistant',
        text: `系统中共有 ${total} 个案件，以下是最近的案件：`,
        data: cases.map((c: any) => ({
          id: c.id,
          internal_number: c.internal_number,
          case_type: c.case_type,
          status: c.status
        })),
        columns: [
          { prop: 'internal_number', label: '内部编号', width: '140' },
          { prop: 'case_type', label: '类型', width: '70' },
          { prop: 'status', label: '状态', width: '80' }
        ],
        actions: [
          { label: '查看案件列表', type: 'navigate', data: '/cases' }
        ]
      })
    }
  } catch (error) {
    messages.value.push({
      type: 'assistant',
      text: '查询案件失败，请稍后再试。'
    })
  }
}

// 按状态查询案件
const handleCasesByStatus = async (command: string) => {
  let status = ''
  if (command.includes('立案')) status = '立案'
  else if (command.includes('审理')) status = '审理中'
  else if (command.includes('结案')) status = '已结案'
  else if (command.includes('归档')) status = '已归档'

  try {
    const response = await caseApi.getCases({ status, page: 1, limit: 10 })
    const cases = response.data.cases || response.data.list || []

    if (cases.length === 0) {
      messages.value.push({
        type: 'assistant',
        text: `没有找到状态为"${status}"的案件。`
      })
    } else {
      messages.value.push({
        type: 'assistant',
        text: `找到 ${cases.length} 个"${status}"的案件：`,
        data: cases.map((c: any) => ({
          id: c.id,
          internal_number: c.internal_number,
          case_cause: c.case_cause,
          filing_date: c.filing_date
        })),
        columns: [
          { prop: 'internal_number', label: '编号', width: '120' },
          { prop: 'case_cause', label: '案由', width: '100' },
          { prop: 'filing_date', label: '立案日期', width: '100' }
        ],
        actions: [
          { label: '查看详情', type: 'viewCase', data: cases[0].id }
        ]
      })
    }
  } catch (error) {
    messages.value.push({
      type: 'assistant',
      text: '查询案件失败，请稍后再试。'
    })
  }
}

// 按类型查询案件
const handleCasesByType = async (command: string) => {
  let caseType = ''
  if (command.includes('民事')) caseType = '民事'
  else if (command.includes('刑事')) caseType = '刑事'
  else if (command.includes('行政')) caseType = '行政'
  else if (command.includes('劳动')) caseType = '劳动仲裁'

  try {
    const response = await caseApi.getCases({ case_type: caseType, page: 1, limit: 10 })
    const cases = response.data.cases || response.data.list || []

    if (cases.length === 0) {
      messages.value.push({
        type: 'assistant',
        text: `没有找到"${caseType}"类型的案件。`
      })
    } else {
      messages.value.push({
        type: 'assistant',
        text: `找到 ${cases.length} 个"${caseType}"案件：`,
        data: cases.map((c: any) => ({
          id: c.id,
          internal_number: c.internal_number,
          case_cause: c.case_cause,
          status: c.status
        })),
        columns: [
          { prop: 'internal_number', label: '编号', width: '120' },
          { prop: 'case_cause', label: '案由', width: '100' },
          { prop: 'status', label: '状态', width: '70' }
        ],
        actions: [
          { label: '查看详情', type: 'viewCase', data: cases[0].id }
        ]
      })
    }
  } catch (error) {
    messages.value.push({
      type: 'assistant',
      text: '查询案件失败，请稍后再试。'
    })
  }
}

// 显示帮助信息
const showHelp = () => {
  messages.value.push({
    type: 'assistant',
    text: `我可以帮您完成以下操作：

📋 案件查询
• "查询所有案件"
• "查询审理中的案件"
• "查询民事案件"
• "搜索合同纠纷案件"

📍 页面导航
• "打开案件列表"
• "打开数据分析"
• "打开文书模板"
• "打开费用计算器"

✅ 待办事项
• "查看待办事项"
• "查看超期节点"

直接输入您的需求，我会尽力帮助您！`
  })
}

// AI智能对话
const handleAIChat = async (command: string) => {
  try {
    // 构建对话历史
    const history = messages.value
      .slice(-6) // 只保留最近3轮对话
      .map(msg => ({
        role: msg.type === 'user' ? 'user' : 'assistant',
        content: msg.text
      }))

    console.log('[助手] 发送请求:', { message: command, context: { history } })

    // 调用AI助手API
    const response = await assistantApi.chat({
      message: command,
      context: {
        history
      }
    })

    console.log('[助手] 收到响应:', response)
    console.log('[助手] response.success:', response.success)
    console.log('[助手] response.data:', response.data)

    // 显示AI回复
    // response已经被拦截器解包，格式为 { success: true, data: { message: "...", timestamp: "..." } }
    if (response && response.success && response.data && response.data.message) {
      console.log('[助手] 显示消息:', response.data.message)
      messages.value.push({
        type: 'assistant',
        text: response.data.message
      })
    } else {
      console.error('[助手] 响应格式错误:', response)
      throw new Error('响应格式错误')
    }
  } catch (error: any) {
    console.error('[助手] AI对话失败:', error)
    console.error('[助手] 错误详情:', error.response?.data || error.message)
    
    // 降级到本地匹配
    if (command.includes('案') || command.includes('纠纷') || command.includes('诉讼')) {
      await handleSearchCases(command)
    } else {
      messages.value.push({
        type: 'assistant',
        text: `抱歉，我暂时无法理解您的问题。

您可以尝试：
• 查询所有案件
• 打开案件列表
• 查看待办事项
• 输入"帮助"查看更多指令`,
        actions: [
          { label: '查看帮助', type: 'help' }
        ]
      })
    }
  }
}

// 查询本周开庭的案件
const handleWeeklyHearings = async () => {
  try {
    const response = await processNodeApi.getUpcomingNodes(7)
    const hearingNodes = response.data.nodes.filter((node: any) => 
      node.node_type === '开庭'
    )

    if (hearingNodes.length === 0) {
      messages.value.push({
        type: 'assistant',
        text: '本周没有安排开庭的案件。'
      })
    } else {
      messages.value.push({
        type: 'assistant',
        text: `找到 ${hearingNodes.length} 个本周开庭的案件：`,
        data: hearingNodes.map((node: any) => ({
          case_number: node.case_number || '-',
          node_name: node.node_name,
          deadline: node.deadline
        })),
        columns: [
          { prop: 'case_number', label: '案号', width: '150' },
          { prop: 'node_name', label: '节点', width: '100' },
          { prop: 'deadline', label: '日期', width: '120' }
        ],
        actions: [
          { label: '查看全部', type: 'navigate', data: '/process/upcoming' }
        ]
      })
    }
  } catch (error) {
    messages.value.push({
      type: 'assistant',
      text: '查询开庭信息失败，请稍后再试。'
    })
  }
}

// 查看待办事项
const handleTodoItems = async () => {
  try {
    const response = await processNodeApi.getOverdueNodes()
    const pendingNodes = response.data.filter((node: any) => 
      node.status === '待处理' || node.status === '进行中'
    )

    if (pendingNodes.length === 0) {
      messages.value.push({
        type: 'assistant',
        text: '太棒了！您目前没有待办事项。'
      })
    } else {
      messages.value.push({
        type: 'assistant',
        text: `您有 ${pendingNodes.length} 个待办事项：`,
        data: pendingNodes.slice(0, 5).map((node: any) => ({
          node_name: node.node_name,
          status: node.status,
          deadline: node.deadline
        })),
        columns: [
          { prop: 'node_name', label: '节点', width: '120' },
          { prop: 'status', label: '状态', width: '80' },
          { prop: 'deadline', label: '截止日期', width: '120' }
        ],
        actions: [
          { label: '查看全部待办', type: 'navigate', data: '/notifications' }
        ]
      })
    }
  } catch (error) {
    messages.value.push({
      type: 'assistant',
      text: '查询待办事项失败，请稍后再试。'
    })
  }
}

// 需要维护的案件
const handleMaintenanceCases = async () => {
  try {
    const response = await caseApi.getCases({ status: '审理中' })
    const cases = response.data.cases || response.data.list || []

    if (cases.length === 0) {
      messages.value.push({
        type: 'assistant',
        text: '目前没有需要维护的案件。'
      })
    } else {
      messages.value.push({
        type: 'assistant',
        text: `找到 ${cases.length} 个审理中的案件需要关注：`,
        data: cases.slice(0, 5).map((c: any) => ({
          internal_number: c.internal_number,
          case_type: c.case_type,
          status: c.status
        })),
        columns: [
          { prop: 'internal_number', label: '内部编号', width: '140' },
          { prop: 'case_type', label: '类型', width: '80' },
          { prop: 'status', label: '状态', width: '80' }
        ],
        actions: [
          { label: '查看案件列表', type: 'navigate', data: '/cases' }
        ]
      })
    }
  } catch (error) {
    messages.value.push({
      type: 'assistant',
      text: '查询案件信息失败，请稍后再试。'
    })
  }
}

// 查看超期节点
const handleOverdueNodes = async () => {
  try {
    const response = await processNodeApi.getOverdueNodes()
    const overdueNodes = response.data || []

    if (overdueNodes.length === 0) {
      messages.value.push({
        type: 'assistant',
        text: '太好了！目前没有超期的节点。'
      })
    } else {
      messages.value.push({
        type: 'assistant',
        text: `⚠️ 发现 ${overdueNodes.length} 个超期节点，请及时处理：`,
        data: overdueNodes.slice(0, 5).map((node: any) => ({
          node_name: node.node_name,
          deadline: node.deadline,
          overdue_days: node.overdue_days
        })),
        columns: [
          { prop: 'node_name', label: '节点', width: '120' },
          { prop: 'deadline', label: '截止日期', width: '100' },
          { prop: 'overdue_days', label: '超期天数', width: '80' }
        ],
        actions: [
          { label: '查看全部超期', type: 'navigate', data: '/notifications/alerts' }
        ]
      })
    }
  } catch (error) {
    messages.value.push({
      type: 'assistant',
      text: '查询超期节点失败，请稍后再试。'
    })
  }
}

// 搜索案件
const handleSearchCases = async (command: string) => {
  // 提取关键词
  const keyword = command.replace(/查询|搜索|案件/g, '').trim()
  
  if (!keyword) {
    messages.value.push({
      type: 'assistant',
      text: '请告诉我您要查询的案件关键词，例如："查询合同纠纷案件"'
    })
    return
  }

  try {
    const response = await caseApi.getCases({ search: keyword })
    const cases = response.data.cases || response.data.list || []

    if (cases.length === 0) {
      messages.value.push({
        type: 'assistant',
        text: `没有找到包含"${keyword}"的案件。`
      })
    } else {
      messages.value.push({
        type: 'assistant',
        text: `找到 ${cases.length} 个相关案件：`,
        data: cases.slice(0, 5).map((c: any) => ({
          id: c.id,
          internal_number: c.internal_number,
          case_type: c.case_type,
          case_cause: c.case_cause
        })),
        columns: [
          { prop: 'internal_number', label: '编号', width: '120' },
          { prop: 'case_type', label: '类型', width: '70' },
          { prop: 'case_cause', label: '案由', width: '110' }
        ],
        actions: cases.length > 0 ? [
          { label: '查看详情', type: 'viewCase', data: cases[0].id }
        ] : undefined
      })
    }
  } catch (error) {
    messages.value.push({
      type: 'assistant',
      text: '搜索案件失败，请稍后再试。'
    })
  }
}

// 生成文书
const handleGenerateDocument = (command: string) => {
  messages.value.push({
    type: 'assistant',
    text: '文书生成功能正在开发中。您可以前往"文书模板"页面手动生成文书。',
    actions: [
      { label: '前往文书模板', type: 'navigate', data: '/documents/templates' }
    ]
  })
}

// 导航功能
const handleNavigation = (command: string) => {
  const lowerCommand = command.toLowerCase()
  
  const navigationMap: Record<string, { path: string; name: string; keywords: string[] }> = {
    cases: { path: '/cases', name: '案件列表', keywords: ['案件列表', '案件管理', '案件'] },
    dashboard: { path: '/dashboard', name: '首页', keywords: ['首页', '驾驶舱', '主页'] },
    analytics: { path: '/analytics', name: '数据分析', keywords: ['数据分析', '统计', '分析'] },
    documents: { path: '/documents/templates', name: '文书模板', keywords: ['文书', '模板', '文档'] },
    costs: { path: '/costs/calculator', name: '费用计算器', keywords: ['成本', '费用', '计算器'] },
    notifications: { path: '/notifications', name: '提醒中心', keywords: ['提醒', '通知', '待办'] },
    knowledge: { path: '/archive/knowledge', name: '案例知识库', keywords: ['知识库', '案例库'] }
  }
  
  let matchedNav: { path: string; name: string } | null = null
  
  for (const nav of Object.values(navigationMap)) {
    if (nav.keywords.some(keyword => lowerCommand.includes(keyword))) {
      matchedNav = nav
      break
    }
  }
  
  if (matchedNav) {
    messages.value.push({
      type: 'assistant',
      text: `好的，正在为您打开${matchedNav.name}...`
    })
    setTimeout(() => {
      router.push(matchedNav!.path)
      visible.value = false
    }, 500)
  } else {
    messages.value.push({
      type: 'assistant',
      text: '我可以帮您打开以下页面：\n• 案件列表\n• 数据分析\n• 文书模板\n• 费用计算器\n• 提醒中心\n• 案例知识库\n\n请告诉我您想去哪里？'
    })
  }
}

// 处理操作
const handleAction = (action: any) => {
  if (action.type === 'navigate') {
    router.push(action.data)
    visible.value = false
  } else if (action.type === 'viewCase') {
    router.push(`/cases/${action.data}`)
    visible.value = false
  } else if (action.type === 'help') {
    showHelp()
  }
}

// 滚动到底部
const scrollToBottom = () => {
  if (messageList.value) {
    messageList.value.scrollTop = messageList.value.scrollHeight
  }
}
</script>

<style scoped>
.legal-assistant {
  position: relative;
}

.assistant-trigger {
  position: fixed;
  z-index: 1000;
  cursor: move;
  user-select: none;
}

.assistant-trigger .el-button {
  box-shadow: 0 4px 12px rgba(64, 158, 255, 0.4);
  transition: all 0.3s;
}

.assistant-trigger:hover .el-button {
  transform: scale(1.1);
  box-shadow: 0 6px 16px rgba(64, 158, 255, 0.6);
}

.assistant-trigger:active {
  cursor: grabbing;
}

.assistant-container {
  display: flex;
  flex-direction: column;
  height: 100%;
}

.welcome-message {
  text-align: center;
  padding: 40px 20px;
  color: #606266;
}

.welcome-message h3 {
  margin: 20px 0 10px;
  color: #303133;
}

.welcome-message ul {
  text-align: left;
  display: inline-block;
  margin: 20px 0;
}

.welcome-message li {
  margin: 8px 0;
}

.quick-commands {
  margin-top: 20px;
}

.message-list {
  flex: 1;
  overflow-y: auto;
  padding: 20px;
}

.message-item {
  display: flex;
  margin-bottom: 20px;
  animation: fadeIn 0.3s;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.message-item.user {
  flex-direction: row-reverse;
}

.message-avatar {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: #f0f2f5;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.message-item.user .message-avatar {
  background: #409EFF;
  color: white;
}

.message-content {
  max-width: 70%;
  margin: 0 12px;
}

.message-item.user .message-content {
  text-align: right;
}

.message-text {
  background: #f0f2f5;
  padding: 12px 16px;
  border-radius: 8px;
  line-height: 1.6;
  white-space: pre-wrap;
  word-break: break-word;
}

.message-item.user .message-text {
  background: #409EFF;
  color: white;
}

.message-actions {
  margin-top: 8px;
}

.message-data {
  margin-top: 12px;
  background: white;
  border-radius: 4px;
  overflow: hidden;
}

.input-container {
  padding: 20px;
  border-top: 1px solid #ebeef5;
  background: white;
}
</style>
