<template>
  <div class="cost-management-container">
    <PageHeader title="成本管理" :breadcrumb="breadcrumb"  :show-back="true" />
    
    <el-card class="filter-card">
      <el-form :inline="true" :model="filterForm">
        <el-form-item label="费用类型">
          <el-select v-model="filterForm.costType" placeholder="全部" clearable @change="loadCosts">
            <el-option label="全部" value="" />
            <el-option label="诉讼费" value="诉讼费" />
            <el-option label="律师费" value="律师费" />
            <el-option label="保全费" value="保全费" />
            <el-option label="鉴定费" value="鉴定费" />
            <el-option label="诉责险费" value="诉责险费" />
            <el-option label="公证费" value="公证费" />
            <el-option label="差旅费" value="差旅费" />
            <el-option label="其他费用" value="其他费用" />
          </el-select>
        </el-form-item>
        <el-form-item label="支付状态">
          <el-select v-model="filterForm.status" placeholder="全部" clearable @change="loadCosts">
            <el-option label="全部" value="" />
            <el-option label="待支付" value="待支付" />
            <el-option label="已支付" value="已支付" />
            <el-option label="已逾期" value="已逾期" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="showAddDialog">添加成本记录</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <el-card class="table-card">
      <el-table 
        :data="costList" 
        v-loading="loading"
        @sort-change="handleSortChange"
        style="width: 100%"
      >
        <el-table-column prop="costType" label="费用类型" width="120" />
        <el-table-column prop="amount" label="金额（元）" width="150" sortable="custom">
          <template #default="{ row }">
            <span class="amount">¥{{ row.amount?.toLocaleString() }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="paymentDate" label="支付日期" width="120" sortable="custom" />
        <el-table-column prop="dueDate" label="退费日期" width="120" sortable="custom" />
        <el-table-column prop="status" label="支付状态" width="100">
          <template #default="{ row }">
            <el-tag :type="getStatusType(row.status)">{{ row.status }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="paymentMethod" label="支付方式" width="120" />
        <el-table-column prop="payer" label="支付方" width="150" />
        <el-table-column prop="payee" label="收款方" width="150" />
        <el-table-column prop="voucherNumber" label="凭证号" width="150" />
        <el-table-column label="操作" width="180" fixed="right">
          <template #default="{ row }">
            <el-button link type="primary" size="small" @click="handleEdit(row)">编辑</el-button>
            <el-button link type="danger" size="small" @click="handleDelete(row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>

      <div class="summary-section">
        <el-statistic title="总成本" :value="totalCost" prefix="¥" />
      </div>
    </el-card>

    <!-- Add/Edit Dialog -->
    <el-dialog 
      v-model="dialogVisible" 
      :title="dialogTitle"
      width="600px"
    >
      <el-form :model="costForm" :rules="costRules" ref="costFormRef" label-width="100px">
        <el-form-item label="费用类型" prop="costType">
          <el-select v-model="costForm.costType" placeholder="请选择费用类型">
            <el-option label="诉讼费" value="诉讼费" />
            <el-option label="律师费" value="律师费" />
            <el-option label="保全费" value="保全费" />
            <el-option label="鉴定费" value="鉴定费" />
            <el-option label="诉责险费" value="诉责险费" />
            <el-option label="公证费" value="公证费" />
            <el-option label="差旅费" value="差旅费" />
            <el-option label="其他费用" value="其他费用" />
          </el-select>
        </el-form-item>
        <el-form-item label="金额" prop="amount">
          <el-input-number v-model="costForm.amount" :min="0" :precision="2" :step="100" />
        </el-form-item>
        <el-form-item label="支付日期" prop="paymentDate">
          <el-date-picker 
            v-model="costForm.paymentDate" 
            type="date" 
            placeholder="选择日期"
            value-format="YYYY-MM-DD"
          />
        </el-form-item>
        <el-form-item label="退费日期" prop="dueDate">
          <el-date-picker 
            v-model="costForm.dueDate" 
            type="date" 
            placeholder="选择日期"
            value-format="YYYY-MM-DD"
          />
        </el-form-item>
        <el-form-item label="支付状态" prop="status">
          <el-select v-model="costForm.status" placeholder="请选择状态">
            <el-option label="待支付" value="待支付" />
            <el-option label="已支付" value="已支付" />
            <el-option label="已逾期" value="已逾期" />
          </el-select>
        </el-form-item>
        <el-form-item label="支付方式" prop="paymentMethod">
          <el-select v-model="costForm.paymentMethod" placeholder="请选择支付方式">
            <el-option label="现金" value="现金" />
            <el-option label="银行转账" value="银行转账" />
            <el-option label="支票" value="支票" />
            <el-option label="其他" value="其他" />
          </el-select>
        </el-form-item>
        <el-form-item label="支付方" prop="payer">
          <el-input v-model="costForm.payer" placeholder="请输入支付方" />
        </el-form-item>
        <el-form-item label="收款方" prop="payee">
          <el-input v-model="costForm.payee" placeholder="请输入收款方" />
        </el-form-item>
        <el-form-item label="凭证号" prop="voucherNumber">
          <el-input v-model="costForm.voucherNumber" placeholder="请输入凭证号" />
        </el-form-item>
        <el-form-item label="备注" prop="description">
          <el-input 
            v-model="costForm.description" 
            type="textarea" 
            :rows="3"
            placeholder="请输入备注信息"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleSubmit">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { ElMessage, ElMessageBox, type FormInstance, type FormRules } from 'element-plus'
import { costApi, type CostRecordData } from '@/api/cost'
import PageHeader from '@/components/common/PageHeader.vue'

const route = useRoute()
const caseId = computed(() => Number(route.params.id))

const breadcrumb = [
  { title: '案件管理', path: '/cases' },
  { title: '案件详情', path: `/cases/${caseId.value}` },
  { title: '成本管理' }
]

const loading = ref(false)
const costList = ref<any[]>([])
const dialogVisible = ref(false)
const dialogTitle = ref('添加成本记录')
const costFormRef = ref<FormInstance>()
const editingId = ref<number | null>(null)

const filterForm = reactive({
  costType: '',
  status: ''
})

const costForm = reactive<CostRecordData>({
  caseId: caseId.value,
  costType: '',
  amount: 0,
  paymentDate: '',
  paymentMethod: '',
  voucherNumber: '',
  payer: '',
  payee: '',
  status: '待支付',
  dueDate: '',
  description: ''
})

const costRules: FormRules = {
  costType: [{ required: true, message: '请选择费用类型', trigger: 'change' }],
  amount: [{ required: true, message: '请输入金额', trigger: 'blur' }],
  status: [{ required: true, message: '请选择支付状态', trigger: 'change' }]
}

const totalCost = computed(() => {
  return costList.value.reduce((sum, item) => sum + (item.amount || 0), 0)
})

const getStatusType = (status: string) => {
  const typeMap: Record<string, any> = {
    '待支付': 'warning',
    '已支付': 'success',
    '已逾期': 'danger'
  }
  return typeMap[status] || 'info'
}

const loadCosts = async () => {
  loading.value = true
  try {
    const params: any = {}
    if (filterForm.costType) params.costType = filterForm.costType
    if (filterForm.status) params.status = filterForm.status
    
    const response = await costApi.getCostsByCaseId(caseId.value, params)
    if (response && response.data) {
      // 后端返回 { data: { costs: [...] } }
      const data = response.data.costs || []
      const list = Array.isArray(data) ? data : []
      
      // 转换字段名从下划线到驼峰
      costList.value = list.map((item: any) => ({
        id: item.id,
        caseId: item.case_id,
        costType: item.cost_type,
        amount: item.amount,
        paymentDate: item.payment_date,
        paymentMethod: item.payment_method,
        voucherNumber: item.voucher_number,
        payer: item.payer,
        payee: item.payee,
        status: item.status,
        dueDate: item.due_date,
        description: item.description
      }))
    }
  } catch (error) {
    console.error('加载成本记录失败:', error)
    ElMessage.error('加载成本记录失败')
    costList.value = []
  } finally {
    loading.value = false
  }
}

const handleSortChange = ({ prop, order }: any) => {
  if (!order) {
    loadCosts()
    return
  }
  
  costList.value.sort((a, b) => {
    const aVal = a[prop]
    const bVal = b[prop]
    
    if (order === 'ascending') {
      return aVal > bVal ? 1 : -1
    } else {
      return aVal < bVal ? 1 : -1
    }
  })
}

const showAddDialog = () => {
  dialogTitle.value = '添加成本记录'
  editingId.value = null
  resetForm()
  dialogVisible.value = true
}

const handleEdit = (row: any) => {
  dialogTitle.value = '编辑成本记录'
  editingId.value = row.id
  Object.assign(costForm, row)
  dialogVisible.value = true
}

const handleDelete = async (row: any) => {
  try {
    await ElMessageBox.confirm('确定要删除这条成本记录吗？', '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })
    
    await costApi.deleteCost(row.id)
    ElMessage.success('删除成功')
    loadCosts()
  } catch (error: any) {
    if (error !== 'cancel') {
      ElMessage.error('删除失败')
      console.error(error)
    }
  }
}

const handleSubmit = async () => {
  if (!costFormRef.value) return
  
  await costFormRef.value.validate(async (valid) => {
    if (!valid) return
    
    try {
      if (editingId.value) {
        await costApi.updateCost(editingId.value, costForm)
        ElMessage.success('更新成功')
      } else {
        await costApi.createCost(costForm)
        ElMessage.success('添加成功')
      }
      
      dialogVisible.value = false
      loadCosts()
    } catch (error) {
      ElMessage.error(editingId.value ? '更新失败' : '添加失败')
      console.error(error)
    }
  })
}

const resetForm = () => {
  Object.assign(costForm, {
    caseId: caseId.value,
    costType: '',
    amount: 0,
    paymentDate: '',
    paymentMethod: '',
    voucherNumber: '',
    payer: '',
    payee: '',
    status: '待支付',
    dueDate: '',
    description: ''
  })
  costFormRef.value?.clearValidate()
}

onMounted(() => {
  loadCosts()
})
</script>

<style scoped>
.cost-management-container {
  padding: 20px;
}

.filter-card {
  margin-bottom: 20px;
}

.table-card {
  margin-bottom: 20px;
}

.amount {
  font-weight: 600;
  color: #f56c6c;
}

.summary-section {
  margin-top: 20px;
  padding: 20px;
  background-color: #f5f7fa;
  border-radius: 4px;
  display: flex;
  justify-content: flex-end;
}
</style>
