<template>
  <div class="process-templates-container">
    <PageHeader title="流程模板管理" />

    <el-card class="search-card">
      <el-form :inline="true">
        <el-form-item label="案件类型">
          <el-select v-model="searchForm.caseType" placeholder="全部" clearable style="width: 140px">
            <el-option label="民事" value="民事" />
            <el-option label="刑事" value="刑事" />
            <el-option label="行政" value="行政" />
            <el-option label="劳动仲裁" value="劳动仲裁" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="loadTemplates">查询</el-button>
          <el-button @click="handleReset">重置</el-button>
          <el-button type="primary" @click="handleAddTemplate">新建模板</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <el-card class="table-card">
      <el-table :data="templates" v-loading="loading" stripe>
        <el-table-column prop="id" label="ID" width="80" />
        <el-table-column prop="name" label="模板名称" min-width="150" />
        <el-table-column prop="caseType" label="案件类型" width="120">
          <template #default="{ row }">
            <el-tag>{{ row.caseType }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="description" label="描述" min-width="200" show-overflow-tooltip />
        <el-table-column label="节点数量" width="100">
          <template #default="{ row }">
            {{ row.nodes?.length || 0 }}
          </template>
        </el-table-column>
        <el-table-column prop="createdAt" label="创建时间" width="180">
          <template #default="{ row }">
            {{ formatDate(row.createdAt) }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="250" fixed="right">
          <template #default="{ row }">
            <el-button link type="primary" @click="handleViewTemplate(row)">
              查看
            </el-button>
            <el-button link type="primary" @click="handleEditTemplate(row)">
              编辑
            </el-button>
            <el-button link type="success" @click="handleApplyTemplate(row)">
              应用
            </el-button>
            <el-button link type="danger" @click="handleDeleteTemplate(row)">
              删除
            </el-button>
          </template>
        </el-table-column>
        <template #empty>
          <TableEmpty description="暂无流程模板" />
        </template>
      </el-table>
    </el-card>

    <!-- Template Form Dialog -->
    <el-dialog
      v-model="dialogVisible"
      :title="dialogTitle"
      width="800px"
      @close="handleDialogClose"
    >
      <el-form
        ref="templateFormRef"
        :model="templateForm"
        :rules="templateFormRules"
        label-width="100px"
      >
        <el-form-item label="模板名称" prop="name">
          <el-input v-model="templateForm.name" placeholder="请输入模板名称" />
        </el-form-item>

        <el-form-item label="案件类型" prop="caseType">
          <el-select v-model="templateForm.caseType" placeholder="请选择案件类型">
            <el-option label="民事" value="民事" />
            <el-option label="刑事" value="刑事" />
            <el-option label="行政" value="行政" />
            <el-option label="劳动仲裁" value="劳动仲裁" />
          </el-select>
        </el-form-item>

        <el-form-item label="模板描述" prop="description">
          <el-input
            v-model="templateForm.description"
            type="textarea"
            :rows="3"
            placeholder="请输入模板描述"
          />
        </el-form-item>

        <el-divider>流程节点配置</el-divider>

        <div class="nodes-section">
          <div
            v-for="(node, index) in templateForm.nodes"
            :key="index"
            class="node-item"
          >
            <div class="node-header">
              <span class="node-index">节点 {{ index + 1 }}</span>
              <el-button
                link
                type="danger"
                @click="handleRemoveNode(index)"
                :disabled="templateForm.nodes.length === 1"
              >
                删除
              </el-button>
            </div>

            <el-row :gutter="20">
              <el-col :span="12">
                <el-form-item
                  :prop="`nodes.${index}.nodeName`"
                  :rules="[{ required: true, message: '请输入节点名称', trigger: 'blur' }]"
                  label="节点名称"
                >
                  <el-input v-model="node.nodeName" placeholder="请输入节点名称" />
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item
                  :prop="`nodes.${index}.nodeType`"
                  :rules="[{ required: true, message: '请选择节点类型', trigger: 'change' }]"
                  label="节点类型"
                >
                  <el-select v-model="node.nodeType" placeholder="请选择节点类型">
                    <el-option label="立案" value="立案" />
                    <el-option label="送达" value="送达" />
                    <el-option label="举证" value="举证" />
                    <el-option label="开庭" value="开庭" />
                    <el-option label="调解" value="调解" />
                    <el-option label="判决" value="判决" />
                    <el-option label="执行" value="执行" />
                    <el-option label="其他" value="其他" />
                  </el-select>
                </el-form-item>
              </el-col>
            </el-row>

            <el-row :gutter="20">
              <el-col :span="8">
                <el-form-item
                  :prop="`nodes.${index}.daysFromStart`"
                  :rules="[{ required: true, message: '请输入天数', trigger: 'blur' }]"
                  label="距立案天数"
                >
                  <el-input-number
                    v-model="node.daysFromStart"
                    :min="0"
                    placeholder="天数"
                    style="width: 100%"
                  />
                </el-form-item>
              </el-col>
              <el-col :span="8">
                <el-form-item
                  :prop="`nodes.${index}.duration`"
                  :rules="[{ required: true, message: '请输入时限', trigger: 'blur' }]"
                  label="办理时限(天)"
                >
                  <el-input-number
                    v-model="node.duration"
                    :min="1"
                    placeholder="天数"
                    style="width: 100%"
                  />
                </el-form-item>
              </el-col>
              <el-col :span="8">
                <el-form-item
                  :prop="`nodes.${index}.nodeOrder`"
                  :rules="[{ required: true, message: '请输入顺序', trigger: 'blur' }]"
                  label="节点顺序"
                >
                  <el-input-number
                    v-model="node.nodeOrder"
                    :min="1"
                    placeholder="顺序"
                    style="width: 100%"
                  />
                </el-form-item>
              </el-col>
            </el-row>
          </div>

          <el-button type="primary" plain @click="handleAddNode" style="width: 100%">
            添加节点
          </el-button>
        </div>
      </el-form>

      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleSubmitTemplate" :loading="submitting">
          确定
        </el-button>
      </template>
    </el-dialog>

    <!-- Template View Dialog -->
    <el-dialog v-model="viewDialogVisible" title="模板详情" width="700px">
      <div v-if="viewingTemplate" class="template-detail">
        <el-descriptions :column="2" border>
          <el-descriptions-item label="模板名称">
            {{ viewingTemplate.name }}
          </el-descriptions-item>
          <el-descriptions-item label="案件类型">
            <el-tag>{{ viewingTemplate.caseType }}</el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="描述" :span="2">
            {{ viewingTemplate.description || '无' }}
          </el-descriptions-item>
        </el-descriptions>

        <el-divider>流程节点</el-divider>

        <el-timeline>
          <el-timeline-item
            v-for="(node, index) in viewingTemplate.nodes"
            :key="index"
            :timestamp="`第 ${node.nodeOrder} 步`"
            placement="top"
          >
            <el-card>
              <div class="view-node-content">
                <div class="view-node-title">{{ node.nodeName }}</div>
                <div class="view-node-info">
                  <span>类型：{{ node.nodeType }}</span>
                  <span>距立案：{{ node.daysFromStart }} 天</span>
                  <span>时限：{{ node.duration }} 天</span>
                </div>
              </div>
            </el-card>
          </el-timeline-item>
        </el-timeline>
      </div>
    </el-dialog>

    <!-- Apply Template Dialog -->
    <el-dialog v-model="applyDialogVisible" title="应用模板到案件" width="500px">
      <el-form :model="applyForm" label-width="100px">
        <el-form-item label="选择案件">
          <el-input
            v-model="applyForm.caseId"
            type="number"
            placeholder="请输入案件ID"
          />
        </el-form-item>
      </el-form>

      <template #footer>
        <el-button @click="applyDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleConfirmApply" :loading="applying">
          确定
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { ElMessage, ElMessageBox, type FormInstance, type FormRules } from 'element-plus'
import { processTemplateApi, type ProcessTemplateData } from '@/api/processTemplate'
import PageHeader from '@/components/common/PageHeader.vue'
import TableEmpty from '@/components/common/TableEmpty.vue'
import type { CaseType } from '@/types'

interface ProcessTemplate extends ProcessTemplateData {
  id: number
  createdAt?: string
}

interface TemplateNode {
  nodeName: string
  nodeType: string
  daysFromStart: number
  duration: number
  nodeOrder: number
}

const loading = ref(false)
const templates = ref<ProcessTemplate[]>([])
const dialogVisible = ref(false)
const viewDialogVisible = ref(false)
const applyDialogVisible = ref(false)
const dialogTitle = ref('新建模板')
const submitting = ref(false)
const applying = ref(false)
const templateFormRef = ref<FormInstance>()
const editingTemplateId = ref<number | null>(null)
const viewingTemplate = ref<ProcessTemplate | null>(null)
const applyingTemplate = ref<ProcessTemplate | null>(null)

const searchForm = ref({
  caseType: ''
})

const templateForm = ref<ProcessTemplateData>({
  name: '',
  caseType: '',
  description: '',
  nodes: [
    {
      nodeName: '',
      nodeType: '',
      daysFromStart: 0,
      duration: 1,
      nodeOrder: 1
    }
  ]
})

const applyForm = ref({
  caseId: ''
})

const templateFormRules: FormRules = {
  name: [{ required: true, message: '请输入模板名称', trigger: 'blur' }],
  caseType: [{ required: true, message: '请选择案件类型', trigger: 'change' }]
}

// Format date
const formatDate = (dateStr: string): string => {
  if (!dateStr) return ''
  const date = new Date(dateStr)
  return date.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  })
}

// Load templates
const loadTemplates = async () => {
  loading.value = true
  try {
    const response = await processTemplateApi.getTemplates()
    let rawData = response.data?.templates || response.data || []
    
    // Transform backend format to frontend format
    let data = rawData.map((t: any) => ({
      id: t.id,
      name: t.template_name,
      caseType: t.case_type,
      description: t.description,
      nodes: t.nodes?.map((n: any) => ({
        nodeName: n.node_name,
        nodeType: n.node_type,
        daysFromStart: 0, // 数据库中没有这个字段
        duration: n.deadline_days || 0, // 使用 deadline_days
        nodeOrder: n.node_order
      })) || [],
      createdAt: t.created_at
    }))
    
    // Filter by case type if selected
    if (searchForm.value.caseType) {
      data = data.filter((t: ProcessTemplate) => t.caseType === searchForm.value.caseType)
    }
    
    templates.value = data
  } catch (error: any) {
    ElMessage.error(error.message || '加载模板失败')
  } finally {
    loading.value = false
  }
}

// Handle reset
const handleReset = () => {
  searchForm.value.caseType = ''
  loadTemplates()
}

// Handle add template
const handleAddTemplate = () => {
  dialogTitle.value = '新建模板'
  editingTemplateId.value = null
  resetForm()
  dialogVisible.value = true
}

// Handle edit template
const handleEditTemplate = async (template: ProcessTemplate) => {
  try {
    // 从后端获取完整的模板详情（包括节点信息）
    const response = await processTemplateApi.getTemplateById(template.id)
    if (response.data) {
      const templateData = response.data.template || response.data
      
      dialogTitle.value = '编辑模板'
      editingTemplateId.value = template.id
      
      // 转换字段名从下划线到驼峰
      templateForm.value = {
        name: templateData.template_name || templateData.name,
        caseType: templateData.case_type || templateData.caseType,
        description: templateData.description || '',
        nodes: (templateData.nodes || []).map((node: any) => ({
          nodeName: node.node_name || node.nodeName || '',
          nodeType: node.node_type || node.nodeType || '',
          daysFromStart: 0, // 数据库中没有这个字段
          duration: node.deadline_days || node.duration || 0,
          nodeOrder: node.node_order || node.nodeOrder || 0
        }))
      }
      
      dialogVisible.value = true
    }
  } catch (error: any) {
    ElMessage.error(error.message || '获取模板详情失败')
  }
}

// Handle view template
const handleViewTemplate = async (template: ProcessTemplate) => {
  try {
    // 从后端获取完整的模板详情（包括节点信息）
    const response = await processTemplateApi.getTemplateById(template.id)
    if (response.data) {
      // 后端可能返回 { data: { template: {...} } } 或 { data: {...} }
      const templateData = response.data.template || response.data
      
      // 转换字段名从下划线到驼峰
      viewingTemplate.value = {
        id: templateData.id,
        name: templateData.template_name || templateData.name,
        caseType: templateData.case_type || templateData.caseType,
        description: templateData.description,
        nodes: (templateData.nodes || []).map((node: any) => ({
          nodeName: node.node_name || node.nodeName,
          nodeType: node.node_type || node.nodeType,
          daysFromStart: 0, // 数据库中没有这个字段
          duration: node.deadline_days || node.duration || 0,
          nodeOrder: node.node_order || node.nodeOrder
        }))
      }
      viewDialogVisible.value = true
    }
  } catch (error: any) {
    ElMessage.error(error.message || '获取模板详情失败')
  }
}

// Handle apply template
const handleApplyTemplate = (template: ProcessTemplate) => {
  applyingTemplate.value = template
  applyForm.value.caseId = ''
  applyDialogVisible.value = true
}

// Handle confirm apply
const handleConfirmApply = async () => {
  if (!applyForm.value.caseId) {
    ElMessage.warning('请输入案件ID')
    return
  }
  
  if (!applyingTemplate.value) return
  
  applying.value = true
  try {
    await processTemplateApi.applyTemplate(
      Number(applyForm.value.caseId),
      applyingTemplate.value.id
    )
    ElMessage.success('应用模板成功')
    applyDialogVisible.value = false
  } catch (error: any) {
    ElMessage.error(error.message || '应用模板失败')
  } finally {
    applying.value = false
  }
}

// Handle delete template
const handleDeleteTemplate = async (template: ProcessTemplate) => {
  try {
    await ElMessageBox.confirm('确定要删除该模板吗？', '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })
    
    await processTemplateApi.deleteTemplate(template.id)
    ElMessage.success('删除成功')
    loadTemplates()
  } catch (error: any) {
    if (error !== 'cancel') {
      ElMessage.error(error.message || '删除失败')
    }
  }
}

// Handle add node
const handleAddNode = () => {
  const maxOrder = Math.max(...templateForm.value.nodes.map(n => n.nodeOrder), 0)
  templateForm.value.nodes.push({
    nodeName: '',
    nodeType: '',
    daysFromStart: 0,
    duration: 1,
    nodeOrder: maxOrder + 1
  })
}

// Handle remove node
const handleRemoveNode = (index: number) => {
  templateForm.value.nodes.splice(index, 1)
}

// Handle submit template
const handleSubmitTemplate = async () => {
  if (!templateFormRef.value) return
  
  await templateFormRef.value.validate(async (valid) => {
    if (!valid) return
    
    // Validate nodes
    if (templateForm.value.nodes.length === 0) {
      ElMessage.warning('请至少添加一个节点')
      return
    }
    
    submitting.value = true
    try {
      if (editingTemplateId.value) {
        await processTemplateApi.updateTemplate(editingTemplateId.value, templateForm.value)
        ElMessage.success('更新成功')
      } else {
        await processTemplateApi.createTemplate(templateForm.value)
        ElMessage.success('创建成功')
      }
      
      dialogVisible.value = false
      loadTemplates()
    } catch (error: any) {
      ElMessage.error(error.message || '操作失败')
    } finally {
      submitting.value = false
    }
  })
}

// Handle dialog close
const handleDialogClose = () => {
  resetForm()
}

// Reset form
const resetForm = () => {
  templateForm.value = {
    name: '',
    caseType: '',
    description: '',
    nodes: [
      {
        nodeName: '',
        nodeType: '',
        daysFromStart: 0,
        duration: 1,
        nodeOrder: 1
      }
    ]
  }
  templateFormRef.value?.clearValidate()
}

onMounted(() => {
  loadTemplates()
})
</script>

<style scoped>
.process-templates-container {
  padding: 20px;
}

.search-card {
  margin-top: 20px;
}

.table-card {
  margin-top: 20px;
}

.nodes-section {
  max-height: 400px;
  overflow-y: auto;
  padding: 10px;
  background-color: #f5f7fa;
  border-radius: 4px;
}

.node-item {
  background-color: white;
  padding: 15px;
  margin-bottom: 15px;
  border-radius: 4px;
  border: 1px solid #dcdfe6;
}

.node-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
  padding-bottom: 10px;
  border-bottom: 1px solid #ebeef5;
}

.node-index {
  font-weight: 500;
  color: #409eff;
}

.template-detail {
  padding: 10px 0;
}

.view-node-content {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.view-node-title {
  font-size: 16px;
  font-weight: 500;
  color: #303133;
}

.view-node-info {
  display: flex;
  gap: 20px;
  font-size: 14px;
  color: #606266;
}
</style>
