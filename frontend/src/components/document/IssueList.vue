<template>
  <div class="issue-list">
    <el-empty v-if="issues.length === 0" description="未发现问题" />
    
    <div v-else class="issues-container">
      <div
        v-for="(issue, index) in issues"
        :key="index"
        class="issue-item"
        :class="`severity-${issue.severity}`"
      >
        <div class="issue-header">
          <div class="issue-left">
            <el-tag
              :type="getSeverityType(issue.severity)"
              size="small"
              effect="dark"
            >
              {{ getSeverityLabel(issue.severity) }}
            </el-tag>
            <el-tag type="info" size="small">{{ issue.category }}</el-tag>
            <span class="issue-title">{{ issue.title }}</span>
          </div>
          <div class="issue-actions">
            <el-button
              type="primary"
              size="small"
              link
              @click="$emit('fix', issue)"
            >
              <el-icon><Tools /></el-icon>
              修复
            </el-button>
          </div>
        </div>

        <div class="issue-body">
          <div class="issue-location">
            <el-icon><Location /></el-icon>
            <span>位置: {{ issue.location }}</span>
          </div>
          
          <div class="issue-description">
            <strong>问题描述:</strong>
            <p>{{ issue.description }}</p>
          </div>

          <div v-if="issue.example" class="issue-example">
            <strong>问题示例:</strong>
            <pre>{{ issue.example }}</pre>
          </div>

          <div class="issue-suggestion">
            <strong>修改建议:</strong>
            <p>{{ issue.suggestion }}</p>
          </div>

          <div v-if="issue.reference" class="issue-reference">
            <el-icon><Link /></el-icon>
            <span>参考依据: {{ issue.reference }}</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { Tools, Location, Link } from '@element-plus/icons-vue'

interface Props {
  issues: any[]
}

defineProps<Props>()
defineEmits(['fix'])

const getSeverityType = (severity: string) => {
  const types: Record<string, string> = {
    critical: 'danger',
    warning: 'warning',
    suggestion: 'info'
  }
  return types[severity] || 'info'
}

const getSeverityLabel = (severity: string) => {
  const labels: Record<string, string> = {
    critical: '严重',
    warning: '警告',
    suggestion: '建议'
  }
  return labels[severity] || severity
}
</script>

<style scoped>
.issue-list {
  padding: 10px 0;
}

.issues-container {
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.issue-item {
  border: 1px solid #dcdfe6;
  border-radius: 8px;
  padding: 15px;
  transition: all 0.3s;
}

.issue-item:hover {
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
}

.issue-item.severity-critical {
  border-left: 4px solid #f56c6c;
  background: #fef0f0;
}

.issue-item.severity-warning {
  border-left: 4px solid #e6a23c;
  background: #fdf6ec;
}

.issue-item.severity-suggestion {
  border-left: 4px solid #409eff;
  background: #ecf5ff;
}

.issue-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
}

.issue-left {
  display: flex;
  align-items: center;
  gap: 10px;
  flex: 1;
}

.issue-title {
  font-weight: bold;
  color: #303133;
  font-size: 15px;
}

.issue-body {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.issue-location {
  display: flex;
  align-items: center;
  gap: 5px;
  color: #909399;
  font-size: 13px;
}

.issue-description,
.issue-suggestion {
  color: #606266;
  line-height: 1.6;
}

.issue-description strong,
.issue-suggestion strong {
  display: block;
  margin-bottom: 5px;
  color: #303133;
}

.issue-example {
  background: #f5f7fa;
  padding: 10px;
  border-radius: 4px;
}

.issue-example strong {
  display: block;
  margin-bottom: 5px;
  color: #303133;
}

.issue-example pre {
  margin: 0;
  font-family: 'Courier New', monospace;
  font-size: 13px;
  color: #606266;
  white-space: pre-wrap;
  word-wrap: break-word;
}

.issue-reference {
  display: flex;
  align-items: center;
  gap: 5px;
  color: #909399;
  font-size: 13px;
  padding-top: 10px;
  border-top: 1px dashed #dcdfe6;
}
</style>
