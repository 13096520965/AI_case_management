<template>
  <div class="document-templates-container">
    <PageHeader title="文书模板" />

    <!-- Filter and Actions -->
    <el-card class="action-card">
      <el-form :inline="true">
        <el-form-item label="关键字">
          <el-input
            v-model="searchKeyword"
            placeholder="搜索模板名称或描述"
            clearable
            style="width: 240px"
            @input="handleSearch"
          >
            <template #prefix>
              <el-icon><Search /></el-icon>
            </template>
          </el-input>
        </el-form-item>
        <el-form-item label="文书类型">
          <el-select v-model="filterType" placeholder="全部类型" clearable style="width: 180px" @change="handleSearch">
            <el-option label="全部类型" value="" />
            <el-option v-for="type in documentTypes" :key="type" :label="type" :value="type" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="showCreateDialog = true">
            <el-icon><Plus /></el-icon>
            新建模板
          </el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <!-- Template List -->
    <el-card v-loading="loading">
      <el-row :gutter="20">
        <el-col v-for="template in filteredTemplates" :key="template.id" :xs="24" :sm="12" :md="8" :lg="6">
          <el-card class="template-card" shadow="hover">
            <div class="template-header">
              <el-tag>{{ template.documentType }}</el-tag>
            </div>
            <h3 class="template-name">{{ template.name }}</h3>
            <p class="template-desc">{{ template.description || '暂无描述' }}</p>
            <div class="template-actions">
              <el-button link type="primary" @click="handlePreview(template)">预览</el-button>
              <el-button link type="primary" @click="handleGenerate(template)">生成文书</el-button>
              <el-button link type="warning" @click="handleEdit(template)">编辑</el-button>
              <el-button link type="danger" @click="handleDelete(template)">删除</el-button>
            </div>
          </el-card>
        </el-col>
      </el-row>
      <el-empty v-if="filteredTemplates.length === 0" :description="searchKeyword ? '未找到匹配的模板' : '暂无模板'" />
    </el-card>

    <!-- Create/Edit Template Dialog -->
    <el-dialog 
      v-model="showCreateDialog" 
      :title="editingTemplate ? '编辑模板' : '新建模板'" 
      width="800px"
      @close="resetForm"
    >
      <el-form :model="templateForm" :rules="templateRules" ref="templateFormRef" label-width="100px">
        <el-form-item label="模板名称" prop="name">
          <el-input v-model="templateForm.name" placeholder="例如：民事起诉状模板" />
        </el-form-item>
        <el-form-item label="文书类型" prop="documentType">
          <el-select v-model="templateForm.documentType" placeholder="请选择文书类型" style="width: 100%">
            <el-option v-for="type in documentTypes" :key="type" :label="type" :value="type" />
          </el-select>
        </el-form-item>
        <el-form-item label="模板内容" prop="content">
          <el-input 
            v-model="templateForm.content" 
            type="textarea" 
            :rows="12" 
            placeholder="输入模板内容，使用 {{变量名}} 表示可替换变量，例如：{{案号}}、{{原告}}、{{被告}}"
          />
        </el-form-item>
        <el-form-item label="变量说明">
          <el-tag v-for="variable in extractedVariables" :key="variable" style="margin-right: 8px">
            {{ variable }}
          </el-tag>
          <span v-if="extractedVariables.length === 0" class="text-muted">暂无变量</span>
        </el-form-item>
        <el-form-item label="模板描述">
          <el-input v-model="templateForm.description" type="textarea" :rows="2" placeholder="可选" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showCreateDialog = false">取消</el-button>
        <el-button type="primary" @click="handleSaveTemplate" :loading="saving">保存</el-button>
      </template>
    </el-dialog>

    <!-- Preview Dialog -->
    <el-dialog v-model="showPreviewDialog" title="模板预览" width="800px">
      <div class="preview-content">
        <h3>{{ previewTemplate?.name }}</h3>
        <el-divider />
        <div class="content-preview">{{ previewTemplate?.content }}</div>
      </div>
      <template #footer>
        <el-button @click="showPreviewDialog = false">关闭</el-button>
        <el-button type="primary" @click="handleGenerate(previewTemplate)">使用此模板</el-button>
      </template>
    </el-dialog>

    <!-- Generate Document Dialog -->
    <el-dialog v-model="showGenerateDialog" title="生成文书" width="900px">
      <el-form :model="generateForm" label-width="120px">
        <el-form-item label="选择案件">
          <el-select 
            v-model="generateForm.caseId" 
            placeholder="请选择案件" 
            style="width: 100%"
            filterable
            @change="handleCaseChange"
          >
            <el-option 
              v-for="caseItem in cases" 
              :key="caseItem.id" 
              :label="`${caseItem.caseNumber} - ${caseItem.caseCause}`" 
              :value="caseItem.id" 
            />
          </el-select>
        </el-form-item>
        
        <el-divider>填充变量</el-divider>
        
        <el-form-item 
          v-for="variable in currentTemplateVariables" 
          :key="variable" 
          :label="variable"
        >
          <el-input v-model="generateForm.variables[variable]" :placeholder="`请输入${variable}`" />
        </el-form-item>

        <el-divider>预览</el-divider>
        
        <div class="generated-preview">
          <el-input 
            v-model="generatedContent" 
            type="textarea" 
            :rows="15" 
            placeholder="文书内容预览"
          />
        </div>
      </el-form>
      <template #footer>
        <el-button @click="showGenerateDialog = false">取消</el-button>
        <el-button 
          type="success" 
          @click="handleSaveToCase"
          :disabled="!generateForm.caseId || !generatedContent"
          :loading="saving"
        >
          <el-icon><DocumentAdd /></el-icon>
          保存到案件
        </el-button>
        <el-button type="primary" @click="handleExport('word')">导出为 Word</el-button>
        <el-button type="primary" @click="handleExport('pdf')">导出为 PDF</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox, type FormInstance, type FormRules } from 'element-plus'
import { Plus, Search, DocumentAdd } from '@element-plus/icons-vue'
import { documentTemplateApi } from '@/api/documentTemplate'
import { documentApi } from '@/api/document'
import { caseApi } from '@/api/case'
import PageHeader from '@/components/common/PageHeader.vue'

// Document types
const documentTypes = [
  '起诉状',
  '答辩状',
  '上诉状',
  '申请书',
  '判决书',
  '裁定书',
  '调解书',
  '通知书',
  '其他'
]

// State
const loading = ref(false)
const saving = ref(false)
const templates = ref<any[]>([])
const cases = ref<any[]>([])
const filterType = ref('')
const searchKeyword = ref('')
const showCreateDialog = ref(false)
const showPreviewDialog = ref(false)
const showGenerateDialog = ref(false)
const editingTemplate = ref<any>(null)
const previewTemplate = ref<any>(null)
const currentTemplate = ref<any>(null)

// Forms
const templateForm = reactive({
  name: '',
  documentType: '',
  content: '',
  description: ''
})

const generateForm = reactive({
  caseId: null as number | null,
  variables: {} as Record<string, string>
})

const templateFormRef = ref<FormInstance>()
const templateRules: FormRules = {
  name: [{ required: true, message: '请输入模板名称', trigger: 'blur' }],
  documentType: [{ required: true, message: '请选择文书类型', trigger: 'change' }],
  content: [{ required: true, message: '请输入模板内容', trigger: 'blur' }]
}

// Computed
const filteredTemplates = computed(() => {
  let result = templates.value

  // Filter by type
  if (filterType.value) {
    result = result.filter(t => t.documentType === filterType.value)
  }

  // Filter by keyword
  if (searchKeyword.value) {
    const keyword = searchKeyword.value.toLowerCase()
    result = result.filter(t => 
      t.name.toLowerCase().includes(keyword) || 
      (t.description && t.description.toLowerCase().includes(keyword))
    )
  }

  return result
})

const extractedVariables = computed(() => {
  const regex = /\{\{([^}]+)\}\}/g
  const matches = templateForm.content.matchAll(regex)
  const variables = new Set<string>()
  for (const match of matches) {
    variables.add(match[1].trim())
  }
  return Array.from(variables)
})

const currentTemplateVariables = computed(() => {
  if (!currentTemplate.value) return []
  const regex = /\{\{([^}]+)\}\}/g
  const matches = currentTemplate.value.content.matchAll(regex)
  const variables = new Set<string>()
  for (const match of matches) {
    variables.add(match[1].trim())
  }
  return Array.from(variables)
})

const generatedContent = computed(() => {
  if (!currentTemplate.value) return ''
  let content = currentTemplate.value.content
  for (const [key, value] of Object.entries(generateForm.variables)) {
    content = content.replace(new RegExp(`\\{\\{${key}\\}\\}`, 'g'), value || `{{${key}}}`)
  }
  return content
})

// Methods
const loadTemplates = async () => {
  loading.value = true
  try {
    // Load all templates, filtering will be done on client side
    const response = await documentTemplateApi.getTemplates()
    templates.value = response.data || []
  } catch (error) {
    ElMessage.error('加载模板列表失败')
    console.error(error)
  } finally {
    loading.value = false
  }
}

const handleSearch = () => {
  // Filtering is handled by computed property filteredTemplates
  // This function is just a placeholder for potential future enhancements
}

const loadCases = async () => {
  try {
    const response = await caseApi.getCases({ page: 1, limit: 100 })
    cases.value = response.data?.cases || []
  } catch (error) {
    console.error('加载案件列表失败', error)
  }
}

const handlePreview = (template: any) => {
  previewTemplate.value = template
  showPreviewDialog.value = true
}

const handleGenerate = (template: any) => {
  currentTemplate.value = template
  generateForm.caseId = null
  generateForm.variables = {}
  showGenerateDialog.value = true
  showPreviewDialog.value = false
}

const handleCaseChange = async (caseId: number) => {
  try {
    const response = await caseApi.getCaseById(caseId)
    const caseData = response.data
    
    // Auto-fill common variables
    generateForm.variables = {
      '案号': caseData.caseNumber || '',
      '案由': caseData.caseCause || '',
      '法院': caseData.court || '',
      '标的额': caseData.targetAmount ? `${caseData.targetAmount}元` : '',
      '立案日期': caseData.filingDate || '',
      ...generateForm.variables
    }
  } catch (error) {
    console.error('加载案件详情失败', error)
  }
}

const handleEdit = (template: any) => {
  editingTemplate.value = template
  templateForm.name = template.name
  templateForm.documentType = template.documentType
  templateForm.content = template.content
  templateForm.description = template.description || ''
  showCreateDialog.value = true
}

const handleDelete = async (template: any) => {
  try {
    await ElMessageBox.confirm('确定要删除该模板吗？', '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })

    await documentTemplateApi.deleteTemplate(template.id)
    ElMessage.success('删除成功')
    loadTemplates()
  } catch (error: any) {
    if (error !== 'cancel') {
      ElMessage.error('删除失败')
      console.error(error)
    }
  }
}

const handleSaveTemplate = async () => {
  if (!templateFormRef.value) return
  
  await templateFormRef.value.validate(async (valid) => {
    if (!valid) return

    saving.value = true
    try {
      const data = {
        name: templateForm.name,
        documentType: templateForm.documentType,
        content: templateForm.content,
        description: templateForm.description,
        variables: extractedVariables.value
      }

      if (editingTemplate.value) {
        await documentTemplateApi.updateTemplate(editingTemplate.value.id, data)
        ElMessage.success('更新成功')
      } else {
        await documentTemplateApi.createTemplate(data)
        ElMessage.success('创建成功')
      }

      showCreateDialog.value = false
      loadTemplates()
    } catch (error) {
      ElMessage.error(editingTemplate.value ? '更新失败' : '创建失败')
      console.error(error)
    } finally {
      saving.value = false
    }
  })
}

const handleSaveToCase = async () => {
  if (!generateForm.caseId || !generatedContent.value) {
    ElMessage.warning('请选择案件并生成文书内容')
    return
  }

  try {
    saving.value = true
    
    // 获取案件信息用于生成文书名称
    const caseResponse = await caseApi.getCaseById(generateForm.caseId)
    const caseData = caseResponse.data
    const caseNumber = caseData.caseNumber || caseData.internalNumber || '未知案号'
    
    // 生成文书名称
    const documentName = `${currentTemplate.value.name}_${caseNumber}_${new Date().toLocaleDateString('zh-CN').replace(/\//g, '')}`
    
    await documentApi.saveDocument({
      caseId: generateForm.caseId,
      documentType: currentTemplate.value.documentType,
      documentName: documentName,
      content: generatedContent.value
    })
    
    ElMessage.success('文书已成功保存到案件')
    showGenerateDialog.value = false
  } catch (error: any) {
    ElMessage.error(error.message || '保存文书失败')
    console.error('保存文书错误:', error)
  } finally {
    saving.value = false
  }
}

const handleExport = (format: 'word' | 'pdf') => {
  // Create a blob with the content
  const content = generatedContent.value
  const blob = new Blob([content], { type: 'text/plain;charset=utf-8' })
  const url = window.URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.setAttribute('download', `${currentTemplate.value.name}.${format === 'word' ? 'doc' : 'txt'}`)
  document.body.appendChild(link)
  link.click()
  link.remove()
  window.URL.revokeObjectURL(url)
  
  ElMessage.success(`已导出为 ${format.toUpperCase()} 格式（简化版）`)
}

const resetForm = () => {
  editingTemplate.value = null
  templateForm.name = ''
  templateForm.documentType = ''
  templateForm.content = ''
  templateForm.description = ''
  templateFormRef.value?.resetFields()
}

onMounted(() => {
  loadTemplates()
  loadCases()
})
</script>

<style scoped>
.document-templates-container {
  padding: 20px;
}

.action-card {
  margin-bottom: 20px;
}

.template-card {
  margin-bottom: 20px;
  height: 220px;
  display: flex;
  flex-direction: column;
}

.template-header {
  margin-bottom: 10px;
}

.template-name {
  font-size: 16px;
  font-weight: bold;
  margin: 10px 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.template-desc {
  color: #666;
  font-size: 14px;
  margin-bottom: 15px;
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  flex: 1;
}

.template-actions {
  display: flex;
  justify-content: space-between;
  border-top: 1px solid #eee;
  padding-top: 10px;
}

.preview-content {
  padding: 20px;
}

.content-preview {
  white-space: pre-wrap;
  background: #f5f5f5;
  padding: 15px;
  border-radius: 4px;
  max-height: 400px;
  overflow-y: auto;
}

.generated-preview {
  margin-top: 10px;
}

.text-muted {
  color: #999;
}
</style>
