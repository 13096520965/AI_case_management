<template>
  <div class="party-management">
    <!-- Party List -->
    <div class="party-list">
      <div class="list-header">
        <el-button v-if="!props.readonly" type="primary" @click="handleAdd">
          <el-icon><Plus /></el-icon>
          添加主体
        </el-button>
      </div>

      <el-table :data="parties" stripe v-loading="loading">
        <el-table-column prop="party_type" label="主体身份" width="100">
          <template #default="{ row }">
            <el-tag :type="getPartyTypeTag(row.party_type)">
              {{ row.party_type }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="entity_type" label="实体类型" width="100">
          <template #default="{ row }">
            <el-tag :type="row.entity_type === '企业' ? 'success' : 'info'" plain>
              {{ row.entity_type }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="name" label="名称" min-width="150" show-overflow-tooltip />
        <el-table-column label="标识信息" min-width="150">
          <template #default="{ row }">
            {{ row.entity_type === '企业' ? row.unified_credit_code : row.id_number }}
          </template>
        </el-table-column>
        <el-table-column prop="contact_phone" label="联系电话" width="130" />
        <el-table-column prop="address" label="地址" min-width="200" show-overflow-tooltip />
        <el-table-column v-if="!props.readonly" label="操作" width="200" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" link @click="handleEdit(row)">
              编辑
            </el-button>
            <el-button type="primary" link @click="handleViewHistory(row)">
              历史案件
            </el-button>
            <el-button type="danger" link @click="handleDelete(row.id)">
              删除
            </el-button>
          </template>
        </el-table-column>
        <template #empty>
          <TableEmpty description="暂无诉讼主体" />
        </template>
      </el-table>
    </div>

    <!-- Party Form Dialog -->
    <el-dialog
      v-model="dialogVisible"
      :title="isEdit ? '编辑诉讼主体' : '添加诉讼主体'"
      width="700px"
      @close="handleDialogClose"
    >
      <el-form
        ref="formRef"
        :model="formData"
        :rules="formRules"
        label-width="140px"
      >
        <el-form-item label="主体身份" prop="partyType">
          <el-select
            v-model="formData.partyType"
            placeholder="请选择主体身份"
            style="width: 100%"
          >
            <el-option label="原告" value="原告" />
            <el-option label="被告" value="被告" />
            <el-option label="第三人" value="第三人" />
          </el-select>
        </el-form-item>

        <el-form-item label="实体类型" prop="entityType">
          <el-radio-group v-model="formData.entityType" @change="handleEntityTypeChange">
            <el-radio label="企业">企业</el-radio>
            <el-radio label="个人">个人</el-radio>
          </el-radio-group>
        </el-form-item>

        <!-- Enterprise Fields -->
        <template v-if="formData.entityType === '企业'">
          <el-form-item label="企业名称" prop="name">
            <el-input
              v-model="formData.name"
              placeholder="请输入企业名称"
            />
          </el-form-item>

          <el-form-item label="统一社会信用代码" prop="unifiedCreditCode">
            <el-input
              v-model="formData.unifiedCreditCode"
              placeholder="请输入统一社会信用代码（18位）"
              maxlength="18"
              style="width: 100%; font-family: monospace; letter-spacing: 1px;"
              show-word-limit
            />
          </el-form-item>

          <el-form-item label="法定代表人" prop="legalRepresentative">
            <el-input
              v-model="formData.legalRepresentative"
              placeholder="请输入法定代表人"
            />
          </el-form-item>
        </template>

        <!-- Individual Fields -->
        <template v-else>
          <el-form-item label="姓名" prop="name">
            <el-input
              v-model="formData.name"
              placeholder="请输入姓名"
            />
          </el-form-item>

          <el-form-item label="出生日期" prop="birthDate">
            <el-date-picker
              v-model="formData.birthDate"
              type="date"
              placeholder="选择出生日期"
              format="YYYY-MM-DD"
              value-format="YYYY-MM-DD"
              default-value="1960-01-01"
              style="width: 100%"
            />
          </el-form-item>

          <el-form-item label="身份证号" prop="idNumber">
            <el-input
              v-model="formData.idNumber"
              placeholder="请输入身份证号（18位）"
              maxlength="18"
              style="width: 100%; font-family: monospace; letter-spacing: 1px;"
              show-word-limit
            />
          </el-form-item>
        </template>

        <!-- Common Fields -->
        <el-form-item label="联系电话" prop="contactPhone">
          <el-input
            v-model="formData.contactPhone"
            placeholder="请输入联系电话"
            maxlength="20"
          />
        </el-form-item>

        <el-form-item label="电子邮箱" prop="contactEmail">
          <el-input
            v-model="formData.contactEmail"
            placeholder="请输入电子邮箱"
          />
        </el-form-item>

        <el-form-item label="所在地区" prop="region">
          <el-cascader
            v-model="formData.region"
            :options="regionOptions"
            placeholder="请选择省/市/区"
            style="width: 100%"
            :props="{ expandTrigger: 'hover' }"
            :loading="regionLoading"
            clearable
            filterable
          />
        </el-form-item>

        <el-form-item label="详细地址" prop="detailAddress">
          <el-input
            v-model="formData.detailAddress"
            type="textarea"
            :rows="3"
            placeholder="请输入详细地址（街道、门牌号等）"
          />
        </el-form-item>
      </el-form>

      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="submitting" @click="handleSubmit">
          确定
        </el-button>
      </template>
    </el-dialog>

    <!-- Party History Dialog -->
    <el-dialog
      v-model="historyDialogVisible"
      :title="`${currentParty?.name} 的历史案件`"
      width="1000px"
    >
      <el-table :data="historyList" v-loading="historyLoading" stripe>
        <el-table-column prop="case_number" label="案号" width="180" show-overflow-tooltip />
        <el-table-column prop="case_type" label="案件类型" width="120" />
        <el-table-column prop="case_cause" label="案由" min-width="150" show-overflow-tooltip />
        <el-table-column prop="court" label="法院" min-width="150" show-overflow-tooltip />
        <el-table-column label="立案日期" width="120">
          <template #default="{ row }">
            {{ row.filing_date || '-' }}
          </template>
        </el-table-column>
        <el-table-column prop="status" label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="getStatusTag(row.status)" size="small">
              {{ row.status }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="100" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" link @click="viewCase(row.id)">
              查看
            </el-button>
          </template>
        </el-table-column>
      </el-table>

      <TableEmpty v-if="historyList.length === 0 && !historyLoading" description="暂无历史案件" />
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, watch, computed } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox, type FormInstance, type FormRules } from 'element-plus'
import { Plus } from '@element-plus/icons-vue'
import { partyApi } from '@/api/party'
import { regionApi, type RegionItem } from '@/api/region'
import TableEmpty from '@/components/common/TableEmpty.vue'

// Props
const props = defineProps<{
  caseId: number
  readonly?: boolean
}>()

// Emits
const emit = defineEmits<{
  refresh: []
}>()

const router = useRouter()

// State
const loading = ref(false)
const parties = ref<any[]>([])
const dialogVisible = ref(false)
const historyDialogVisible = ref(false)
const submitting = ref(false)
const historyLoading = ref(false)
const isEdit = ref(false)
const currentParty = ref<any>(null)
const historyList = ref<any[]>([])
const formRef = ref<FormInstance>()

// Form data
const formData = reactive({
  partyType: '',
  entityType: '企业',
  name: '',
  birthDate: '',
  unifiedCreditCode: '',
  legalRepresentative: '',
  idNumber: '',
  contactPhone: '',
  contactEmail: '',
  region: [] as string[],
  detailAddress: '',
  address: '' // 保留用于兼容，实际由 region + detailAddress 组合
})

// Region options
const regionOptions = ref<RegionItem[]>([])
const regionLoading = ref(false)

// Validation rules
const formRules: FormRules = {
  partyType: [
    { required: true, message: '请选择主体身份', trigger: 'change' }
  ],
  entityType: [
    { required: true, message: '请选择实体类型', trigger: 'change' }
  ],
  name: [
    { required: true, message: '请输入名称', trigger: 'blur' },
    { min: 2, max: 200, message: '名称长度在 2 到 200 个字符', trigger: 'blur' }
  ],
  unifiedCreditCode: [
    { required: true, message: '请输入统一社会信用代码', trigger: 'blur' },
    { 
      pattern: /^[0-9A-HJ-NPQRTUWXY]{2}\d{6}[0-9A-HJ-NPQRTUWXY]{10}$/,
      message: '请输入有效的统一社会信用代码',
      trigger: 'blur'
    }
  ],
  legalRepresentative: [
    { required: true, message: '请输入法定代表人', trigger: 'blur' },
    { min: 2, max: 50, message: '法定代表人长度在 2 到 50 个字符', trigger: 'blur' }
  ],
  idNumber: [
    { required: true, message: '请输入身份证号', trigger: 'blur' },
    {
      pattern: /(^\d{15}$)|(^\d{18}$)|(^\d{17}(\d|X|x)$)/,
      message: '请输入有效的身份证号',
      trigger: 'blur'
    }
  ],
  birthDate: [
    { required: true, message: '请选择出生日期', trigger: 'blur' },
  ],
  contactPhone: [
    { required: true, message: '请输入联系电话', trigger: 'blur' },
    {
      pattern: /^1[3-9]\d{9}$/,
      message: '请输入有效的手机号码',
      trigger: 'blur'
    }
  ],
  contactEmail: [
    {
      type: 'email',
      message: '请输入有效的电子邮箱',
      trigger: 'blur'
    }
  ],
  region: [
    { required: true, message: '请选择所在地区', trigger: 'change' }
  ],
  detailAddress: [
    { required: true, message: '请输入详细地址', trigger: 'blur' },
    { min: 5, max: 200, message: '详细地址长度在 5 到 200 个字符', trigger: 'blur' }
  ]
}

// Fetch region data
const fetchRegions = async () => {
  regionLoading.value = true
  try {
    const response = await regionApi.getRegions()
    if (response.data) {
      regionOptions.value = response.data
    }
  } catch (error: any) {
    ElMessage.error(error.message || '获取地区数据失败')
    // 如果获取失败，使用空数组
    regionOptions.value = []
  } finally {
    regionLoading.value = false
  }
}

// Fetch parties
const fetchParties = async () => {
  loading.value = true
  try {
    const response = await partyApi.getPartiesByCaseId(props.caseId)
    if (response.data) {
      // 后端可能返回 { data: { parties: [...] } } 或 { data: [...] }
      const data = response.data.parties || response.data
      parties.value = Array.isArray(data) ? data : []
    }
  } catch (error: any) {
    ElMessage.error(error.message || '获取诉讼主体失败')
  } finally {
    loading.value = false
  }
}

// Fetch party history
const fetchPartyHistory = async (partyName: string) => {
  historyLoading.value = true
  try {
    const response = await partyApi.getPartyHistory(partyName)
    if (response.data) {
      // 后端可能返回 { data: { cases: [...] } } 或 { data: [...] }
      const data = response.data.cases || response.data
      historyList.value = Array.isArray(data) ? data : []
    }
  } catch (error: any) {
    ElMessage.error(error.message || '获取历史案件失败')
  } finally {
    historyLoading.value = false
  }
}

// Handle entity type change
const handleEntityTypeChange = () => {
  // Clear entity-specific fields
  formData.unifiedCreditCode = ''
  formData.legalRepresentative = ''
  formData.idNumber = ''
  formData.birthDate = ''
}

// Handle add
const handleAdd = () => {
  isEdit.value = false
  currentParty.value = null
  resetForm()
  dialogVisible.value = true
}

// Handle edit
const handleEdit = (party: any) => {
  isEdit.value = true
  currentParty.value = party
  
  // Populate form - 后端返回的是下划线命名
  formData.partyType = party.party_type || ''
  formData.entityType = party.entity_type || ''
  formData.name = party.name || ''
  formData.unifiedCreditCode = party.unified_credit_code || ''
  formData.legalRepresentative = party.legal_representative || ''
  formData.idNumber = party.id_number || ''
  formData.birthDate = party.birth_date || ''
  formData.contactPhone = party.contact_phone || ''
  formData.contactEmail = party.contact_email || ''
  
  // 解析地址：尝试从 address 中分离省市区和详细地址
  // 如果后端存储了 region_code 和 detail_address，优先使用
  if (party.region_code) {
    formData.region = party.region_code.split(',')
  } else {
    formData.region = []
  }
  formData.detailAddress = party.detail_address || party.address || ''
  formData.address = party.address || ''
  
  dialogVisible.value = true
}

// Handle delete
const handleDelete = async (partyId: number) => {
  try {
    await ElMessageBox.confirm(
      '确定要删除该诉讼主体吗？',
      '删除确认',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )
    
    await partyApi.deleteParty(partyId)
    ElMessage.success('删除成功')
    fetchParties()
    emit('refresh')
  } catch (error: any) {
    if (error !== 'cancel') {
      ElMessage.error(error.message || '删除失败')
    }
  }
}

// Handle view history
const handleViewHistory = async (party: any) => {
  currentParty.value = party
  historyList.value = []
  historyDialogVisible.value = true
  await fetchPartyHistory(party.name)
}

// View case
const viewCase = (caseId: number) => {
  router.push(`/cases/${caseId}`)
  historyDialogVisible.value = false
}

// 计算完整地址
const getFullAddress = () => {
  if (formData.region.length === 0) return formData.detailAddress
  
  // 从 regionOptions 中获取选中的省市区名称
  const labels: string[] = []
  let currentLevel = regionOptions.value
  
  for (const code of formData.region) {
    const found = currentLevel.find(item => item.value === code)
    if (found) {
      labels.push(found.label)
      currentLevel = found.children || []
    }
  }
  
  return labels.join('') + formData.detailAddress
}

// Handle submit
const handleSubmit = async () => {
  if (!formRef.value) return
  
  await formRef.value.validate(async (valid) => {
    if (!valid) return
    
    submitting.value = true
    
    try {
      // 组合完整地址
      const fullAddress = getFullAddress()
      
      const submitData: any = {
        partyType: formData.partyType,
        entityType: formData.entityType,
        name: formData.name,
        birthDate: formData.birthDate,
        contactPhone: formData.contactPhone,
        contactEmail: formData.contactEmail,
        address: fullAddress,
        regionCode: formData.region.join(','), // 保存地区编码
        detailAddress: formData.detailAddress
      }
      
      if (formData.entityType === '企业') {
        submitData.unifiedCreditCode = formData.unifiedCreditCode
        submitData.legalRepresentative = formData.legalRepresentative
      } else {
        submitData.idNumber = formData.idNumber
      }
      
      if (isEdit.value && currentParty.value) {
        // Update party
        await partyApi.updateParty(currentParty.value.id, submitData)
        ElMessage.success('更新成功')
      } else {
        // Add party
        await partyApi.addParty(props.caseId, submitData)
        ElMessage.success('添加成功')
      }
      
      dialogVisible.value = false
      fetchParties()
      emit('refresh')
    } catch (error: any) {
      ElMessage.error(error.message || (isEdit.value ? '更新失败' : '添加失败'))
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
  formData.partyType = ''
  formData.entityType = '企业'
  formData.name = ''
  formData.birthDate = ''
  formData.unifiedCreditCode = ''
  formData.legalRepresentative = ''
  formData.idNumber = ''
  formData.contactPhone = ''
  formData.contactEmail = ''
  formData.region = []
  formData.detailAddress = ''
  formData.address = ''
  
  formRef.value?.clearValidate()
}

// Utility functions
const getPartyTypeTag = (type: string) => {
  const tagMap: Record<string, string> = {
    '原告': 'success',
    '被告': 'danger',
    '第三人': 'warning'
  }
  return tagMap[type] || ''
}

const getStatusTag = (status: string) => {
  const tagMap: Record<string, string> = {
    '立案': 'info',
    '审理中': '',
    '已结案': 'success',
    '已归档': 'info'
  }
  return tagMap[status] || ''
}

// Watch caseId changes
watch(() => props.caseId, () => {
  if (props.caseId) {
    fetchParties()
  }
}, { immediate: true })

// Lifecycle
onMounted(() => {
  fetchRegions()
  fetchParties()
})
</script>

<style scoped>
.party-management {
  width: 100%;
}

.party-list {
  width: 100%;
}

.list-header {
  display: flex;
  justify-content: flex-end;
  align-items: center;
  margin-bottom: 16px;
}
</style>
