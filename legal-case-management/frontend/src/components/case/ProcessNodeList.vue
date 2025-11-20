<template>
  <div class="process-node-list" v-loading="loading">
    <el-timeline v-if="nodeList.length > 0">
      <el-timeline-item
        v-for="node in nodeList"
        :key="node.id"
        :timestamp="formatDate(node.start_time)"
        :color="getNodeColor(node.status)"
      >
        <div class="timeline-content">
          <div class="node-header">
            <span class="node-name">{{ node.node_name }}</span>
            <el-tag :type="getStatusType(node.status)" size="small">
              {{ getStatusText(node.status) }}
            </el-tag>
          </div>
          <div class="node-info">
            <span>经办人: {{ node.handler || '-' }}</span>
            <span v-if="node.deadline">截止日期: {{ formatDate(node.deadline) }}</span>
          </div>
        </div>
      </el-timeline-item>
    </el-timeline>
    <el-empty v-if="nodeList.length === 0 && !loading" description="暂无流程节点" />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { processNodeApi } from '@/api/processNode'

interface Props {
  caseId: number
}

const props = defineProps<Props>()

const loading = ref(false)
const nodeList = ref<any[]>([])

const getStatusType = (status: string) => {
  const typeMap: Record<string, any> = {
    'pending': 'info',
    'in_progress': 'warning',
    'completed': 'success',
    'overdue': 'danger',
    '未开始': 'info',
    '进行中': 'warning',
    '已完成': 'success',
    '已逾期': 'danger'
  }
  return typeMap[status] || 'info'
}

const getStatusText = (status: string) => {
  const textMap: Record<string, string> = {
    'pending': '未开始',
    'in_progress': '进行中',
    'completed': '已完成',
    'overdue': '已逾期'
  }
  return textMap[status] || status
}

const getNodeColor = (status: string) => {
  const colorMap: Record<string, string> = {
    'pending': '#909399',
    'in_progress': '#E6A23C',
    'completed': '#67C23A',
    'overdue': '#F56C6C',
    '未开始': '#909399',
    '进行中': '#E6A23C',
    '已完成': '#67C23A',
    '已逾期': '#F56C6C'
  }
  return colorMap[status] || '#409EFF'
}

const formatDate = (dateString: string): string => {
  if (!dateString) return '-'
  const date = new Date(dateString)
  return date.toLocaleDateString('zh-CN')
}

const loadNodes = async () => {
  loading.value = true
  try {
    const response = await processNodeApi.getNodesByCaseId(props.caseId)
    // 响应拦截器已经返回了 response.data
    // 后端返回 { data: { nodes: [...] } }
    if (response && response.data) {
      nodeList.value = response.data.nodes || []
    } else {
      nodeList.value = []
    }
  } catch (error: any) {
    console.error('加载流程节点失败:', error)
    nodeList.value = []
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  loadNodes()
})
</script>

<style scoped>
.process-node-list {
  min-height: 200px;
}

.timeline-content {
  padding: 8px 0;
}

.node-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.node-name {
  font-weight: 500;
  font-size: 14px;
  color: #303133;
}

.node-info {
  display: flex;
  gap: 20px;
  font-size: 13px;
  color: #606266;
}

.node-info span {
  display: inline-block;
}
</style>
