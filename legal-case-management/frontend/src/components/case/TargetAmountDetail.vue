<template>
  <div class="target-amount-detail">
    <el-card shadow="never" class="info-card">
      <template #header>
        <div class="card-header">
          <span class="card-title">
            <el-icon><Money /></el-icon>
            标的处理详情
          </span>
          <el-button 
            v-if="showButton"
            type="primary" 
            size="small" 
            @click="dialogVisible = true"
          >
            查看详情
          </el-button>
        </div>
      </template>

      <!-- 简要统计 -->
      <el-row :gutter="20">
        <el-col :span="6">
          <div class="stat-item">
            <div class="stat-label">标的总额</div>
            <div class="stat-value primary">{{ formatAmount(summary.totalAmount) }}</div>
          </div>
        </el-col>
        <el-col :span="6">
          <div class="stat-item">
            <div class="stat-label">已收回</div>
            <div class="stat-value success">{{ formatAmount(summary.recoveredAmount) }}</div>
          </div>
        </el-col>
        <el-col :span="6">
          <div class="stat-item">
            <div class="stat-label">剩余</div>
            <div class="stat-value warning">{{ formatAmount(summary.remainingAmount) }}</div>
          </div>
        </el-col>
        <el-col :span="6">
          <div class="stat-item">
            <div class="stat-label">回收率</div>
            <div class="stat-value info">{{ recoveryRate }}%</div>
          </div>
        </el-col>
      </el-row>
    </el-card>

    <!-- 详情对话框 -->
    <el-dialog
      v-model="dialogVisible"
      title="标的处理详情"
      width="1200px"
      :close-on-click-modal="false"
    >
      <el-tabs v-model="activeTab">
        <!-- 基本信息标签页 -->
        <el-tab-pane label="基本信息" name="basic">
          <el-form :model="detailData" label-width="120px">
            <el-row :gutter="20">
              <el-col :span="12">
                <el-form-item label="标的总额">
                  <el-input-number
                    v-model="detailData.totalAmount"
                    :min="0"
                    :precision="2"
                    :controls="false"
                    style="width: 100%"
                  />
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item label="违约金">
                  <el-input-number
                    v-model="detailData.penaltyAmount"
                    :min="0"
                    :precision="2"
                    :controls="false"
                    style="width: 100%"
                  />
                </el-form-item>
              </el-col>
            </el-row>

            <el-row :gutter="20">
              <el-col :span="12">
                <el-form-item label="诉讼成本">
                  <el-input-number
                    v-model="detailData.litigationCost"
                    :min="0"
                    :precision="2"
                    :controls="false"
                    style="width: 100%"
                  />
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item label="成本承担方">
                  <el-input v-model="detailData.costBearer" />
                </el-form-item>
              </el-col>
            </el-row>

            <el-row :gutter="20">
              <el-col :span="24">
                <el-form-item label="备注">
                  <el-input
                    v-model="detailData.notes"
                    type="textarea"
                    :rows="3"
                  />
                </el-form-item>
              </el-col>
            </el-row>

            <el-row>
              <el-col :span="24">
                <el-button type="primary" @click="handleSaveBasic">保存基本信息</el-button>
              </el-col>
            </el-row>
          </el-form>
        </el-tab-pane>

        <!-- 汇款记录标签页 -->
        <el-tab-pane label="汇款记录" name="payments">
          <div class="payment-header">
            <el-button type="primary" :icon="Plus" @click="handleAddPayment">
              添加汇款记录
            </el-button>
          </div>

          <el-table :data="payments" stripe border style="margin-top: 16px">
            <el-table-column type="index" label="#" width="60" />
            <el-table-column prop="paymentDate" label="汇款日期" width="120" />
            <el-table-column prop="amount" label="金额" width="130">
              <template #default="{ row }">
                <span class="amount-success">{{ formatAmount(row.amount) }}</span>
              </template>
            </el-table-column>
            <el-table-column prop="payer" label="付款方" width="150" />
            <el-table-column prop="payee" label="收款方" width="150" />
            <el-table-column prop="paymentMethod" label="支付方式" width="100" />
            <el-table-column prop="status" label="状态" width="100">
              <template #default="{ row }">
                <el-tag :type="getStatusTag(row.status)" size="small">
                  {{ row.status }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="notes" label="备注" min-width="150" show-overflow-tooltip />
            <el-table-column label="操作" width="150" fixed="right">
              <template #default="{ row, $index }">
                <el-button type="primary" link @click="handleEditPayment(row, $index)">
                  编辑
                </el-button>
                <el-button type="danger" link @click="handleDeletePayment($index)">
                  删除
                </el-button>
              </template>
            </el-table-column>
            <template #empty>
              <TableEmpty description="暂无汇款记录" />
            </template>
          </el-table>
        </el-tab-pane>
      </el-tabs>
    </el-dialog>

    <!-- 汇款记录表单对话框 -->
    <el-dialog
      v-model="paymentDialogVisible"
      :title="isEditPayment ? '编辑汇款记录' : '添加汇款记录'"
      width="600px"
    >
      <el-form ref="paymentFormRef" :model="paymentForm" :rules="paymentRules" label-width="100px">
        <el-form-item label="汇款日期" prop="paymentDate">
          <el-date-picker
            v-model="paymentForm.paymentDate"
            type="date"
            placeholder="选择日期"
            style="width: 100%"
            format="YYYY-MM-DD"
            value-format="YYYY-MM-DD"
          />
        </el-form-item>

        <el-form-item label="汇款金额" prop="amount">
          <el-input-number
            v-model="paymentForm.amount"
            :min="0"
            :precision="2"
            :controls="false"
            style="width: 100%"
          />
        </el-form-item>

        <el-form-item label="付款方" prop="payer">
          <el-input v-model="paymentForm.payer" />
        </el-form-item>

        <el-form-item label="收款方" prop="payee">
          <el-input v-model="paymentForm.payee" />
        </el-form-item>

        <el-form-item label="支付方式" prop="paymentMethod">
          <el-select v-model="paymentForm.paymentMethod" style="width: 100%">
            <el-option label="银行转账" value="银行转账" />
            <el-option label="现金" value="现金" />
            <el-option label="支票" value="支票" />
            <el-option label="其他" value="其他" />
          </el-select>
        </el-form-item>

        <el-form-item label="状态" prop="status">
          <el-select v-model="paymentForm.status" style="width: 100%">
            <el-option label="待汇款" value="待汇款" />
            <el-option label="已汇款" value="已汇款" />
            <el-option label="已确认" value="已确认" />
          </el-select>
        </el-form-item>

        <el-form-item label="备注" prop="notes">
          <el-input v-model="paymentForm.notes" type="textarea" :rows="3" />
        </el-form-item>
      </el-form>

      <template #footer>
        <el-button @click="paymentDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleSavePayment">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed } from 'vue'
import { ElMessage, ElMessageBox, type FormInstance, type FormRules } from 'element-plus'
import { Money, Plus } from '@element-plus/icons-vue'
import TableEmpty from '@/components/common/TableEmpty.vue'

const props = defineProps<{
  caseId: number
  showDetailButton?: boolean
}>()

// 默认显示详情按钮
const showButton = props.showDetailButton !== false

// State
const dialogVisible = ref(false)
const paymentDialogVisible = ref(false)
const activeTab = ref('basic')
const isEditPayment = ref(false)
const editingIndex = ref(-1)
const paymentFormRef = ref<FormInstance>()

// 详细数据
const detailData = reactive({
  totalAmount: 100000,
  penaltyAmount: 5000,
  litigationCost: 3000,
  costBearer: '被告',
  notes: ''
})

// 汇款记录
const payments = ref([
  {
    paymentDate: '2024-11-15',
    amount: 50000,
    payer: '被告公司',
    payee: '原告公司',
    paymentMethod: '银行转账',
    status: '已确认',
    notes: '第一笔款项'
  },
  {
    paymentDate: '2024-11-20',
    amount: 30000,
    payer: '被告公司',
    payee: '原告公司',
    paymentMethod: '银行转账',
    status: '待汇款',
    notes: '第二笔款项'
  }
])

// 汇款表单
const paymentForm = reactive({
  paymentDate: '',
  amount: 0,
  payer: '',
  payee: '',
  paymentMethod: '',
  status: '待汇款',
  notes: ''
})

const paymentRules: FormRules = {
  paymentDate: [{ required: true, message: '请选择汇款日期', trigger: 'change' }],
  amount: [{ required: true, message: '请输入汇款金额', trigger: 'blur' }],
  payer: [{ required: true, message: '请输入付款方', trigger: 'blur' }],
  payee: [{ required: true, message: '请输入收款方', trigger: 'blur' }],
  paymentMethod: [{ required: true, message: '请选择支付方式', trigger: 'change' }],
  status: [{ required: true, message: '请选择状态', trigger: 'change' }]
}

// 计算汇总数据
const summary = computed(() => {
  const confirmedPayments = payments.value.filter(p => p.status === '已确认')
  const recoveredAmount = confirmedPayments.reduce((sum, p) => sum + p.amount, 0)
  const remainingAmount = detailData.totalAmount - recoveredAmount
  
  return {
    totalAmount: detailData.totalAmount,
    recoveredAmount,
    remainingAmount
  }
})

// 回收率
const recoveryRate = computed(() => {
  if (summary.value.totalAmount === 0) return '0.00'
  return ((summary.value.recoveredAmount / summary.value.totalAmount) * 100).toFixed(2)
})

// 格式化金额
const formatAmount = (amount: number | undefined) => {
  if (!amount && amount !== 0) return '-'
  return `¥${amount.toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

// 获取状态标签
const getStatusTag = (status: string) => {
  const map: Record<string, string> = {
    '待汇款': 'warning',
    '已汇款': 'info',
    '已确认': 'success'
  }
  return map[status] || 'info'
}

// 保存基本信息
const handleSaveBasic = () => {
  ElMessage.success('基本信息保存成功')
  // TODO: 调用API保存
}

// 添加汇款记录
const handleAddPayment = () => {
  isEditPayment.value = false
  editingIndex.value = -1
  Object.assign(paymentForm, {
    paymentDate: '',
    amount: 0,
    payer: '',
    payee: '',
    paymentMethod: '',
    status: '待汇款',
    notes: ''
  })
  paymentDialogVisible.value = true
}

// 编辑汇款记录
const handleEditPayment = (row: any, index: number) => {
  isEditPayment.value = true
  editingIndex.value = index
  Object.assign(paymentForm, row)
  paymentDialogVisible.value = true
}

// 保存汇款记录
const handleSavePayment = async () => {
  if (!paymentFormRef.value) return
  
  await paymentFormRef.value.validate((valid) => {
    if (!valid) return
    
    if (isEditPayment.value) {
      payments.value[editingIndex.value] = { ...paymentForm }
      ElMessage.success('汇款记录更新成功')
    } else {
      payments.value.push({ ...paymentForm })
      ElMessage.success('汇款记录添加成功')
    }
    
    paymentDialogVisible.value = false
    // TODO: 调用API保存
  })
}

// 删除汇款记录
const handleDeletePayment = async (index: number) => {
  try {
    await ElMessageBox.confirm('确定要删除该汇款记录吗？', '删除确认', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })
    
    payments.value.splice(index, 1)
    ElMessage.success('删除成功')
    // TODO: 调用API删除
  } catch {
    // 用户取消
  }
}
</script>

<style scoped>
.target-amount-detail {
  width: 100%;
}

.target-amount-detail :deep(.info-card) {
  margin-bottom: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.card-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 16px;
  font-weight: 600;
}

.stat-item {
  text-align: center;
  padding: 16px;
  background: #f5f7fa;
  border-radius: 8px;
}

.stat-label {
  font-size: 14px;
  color: #909399;
  margin-bottom: 8px;
}

.stat-value {
  font-size: 24px;
  font-weight: 600;
}

.stat-value.primary {
  color: #409eff;
}

.stat-value.success {
  color: #67c23a;
}

.stat-value.warning {
  color: #e6a23c;
}

.stat-value.info {
  color: #909399;
}

.payment-header {
  margin-bottom: 16px;
}

.amount-success {
  color: #67c23a;
  font-weight: 600;
}
</style>
