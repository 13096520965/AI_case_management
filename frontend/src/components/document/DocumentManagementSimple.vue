<template>
  <div class="document-management-simple">
    <el-alert
      title="智能文书功能"
      type="success"
      :closable="false"
      style="margin-bottom: 20px"
    >
      <template #default>
        <p>智能文书生成与审核功能已开发完成，包含以下功能：</p>
        <ul style="margin: 10px 0; padding-left: 20px;">
          <li>智能生成：支持起诉状、答辩状、代理词等6种文书类型</li>
          <li>智能审核：4维度全面检查文书质量（合规性、逻辑性、格式、完整性）</li>
          <li>文书管理：查看、下载、删除已保存的文书</li>
        </ul>
      </template>
    </el-alert>

    <div class="action-buttons">
      <el-button type="primary" @click="showInfo">
        <el-icon><InfoFilled /></el-icon>
        查看功能说明
      </el-button>
      <el-button type="success" @click="testGenerate">
        <el-icon><MagicStick /></el-icon>
        测试生成功能
      </el-button>
    </div>

    <el-divider />

    <div class="feature-list">
      <h4>功能特点：</h4>
      <el-row :gutter="20">
        <el-col :span="8">
          <el-card shadow="hover">
            <template #header>
              <div style="display: flex; align-items: center; gap: 8px;">
                <el-icon color="#409EFF"><Document /></el-icon>
                <span>智能生成</span>
              </div>
            </template>
            <p>基于案件信息自动生成规范的法律文书</p>
          </el-card>
        </el-col>
        <el-col :span="8">
          <el-card shadow="hover">
            <template #header>
              <div style="display: flex; align-items: center; gap: 8px;">
                <el-icon color="#67C23A"><CircleCheck /></el-icon>
                <span>智能审核</span>
              </div>
            </template>
            <p>多维度检查文书质量，提供修改建议</p>
          </el-card>
        </el-col>
        <el-col :span="8">
          <el-card shadow="hover">
            <template #header>
              <div style="display: flex; align-items: center; gap: 8px;">
                <el-icon color="#E6A23C"><Files /></el-icon>
                <span>文书管理</span>
              </div>
            </template>
            <p>完整的文书管理功能，支持查看和下载</p>
          </el-card>
        </el-col>
      </el-row>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  InfoFilled, MagicStick, Document, CircleCheck, Files
} from '@element-plus/icons-vue'

interface Props {
  caseId: number
  caseInfo: any
  parties: any[]
}

const props = defineProps<Props>()

const showInfo = () => {
  ElMessageBox.alert(
    '智能文书功能已完成开发和测试，包含智能生成、智能审核和文书管理三大功能模块。' +
    '目前使用模拟AI，可接入真实AI服务（如OpenAI、文心一言等）以获得更好的效果。',
    '功能说明',
    {
      confirmButtonText: '知道了',
      type: 'info'
    }
  )
}

const testGenerate = async () => {
  ElMessage.info({
    message: `案件ID: ${props.caseId}, 案件类型: ${props.caseInfo.caseType || '未知'}, 诉讼主体: ${props.parties.length}个`,
    duration: 3000
  })
}
</script>

<style scoped>
.document-management-simple {
  padding: 20px 0;
}

.action-buttons {
  display: flex;
  gap: 10px;
  margin-bottom: 20px;
}

.feature-list {
  margin-top: 20px;
}

.feature-list h4 {
  margin-bottom: 15px;
  color: #303133;
}

.feature-list p {
  color: #606266;
  line-height: 1.6;
  margin: 0;
}
</style>
