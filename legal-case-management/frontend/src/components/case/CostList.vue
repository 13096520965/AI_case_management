<template>
  <div class="cost-list">
    <el-table 
      :data="costList" 
      v-loading="loading" 
      stripe 
      max-height="300" 
      show-summary 
      :summary-method="getCostSummary"
    >
      <el-table-column prop="costType" label="费用类型" width="120" />
      <el-table-column prop="amount" label="金额（元）" width="150" align="right">
        <template #default="{ row }">
          {{ formatAmount(row.amount) }}
        </template>
      </el-table-column>
      <el-table-column prop="paymentDate" label="支付日期" width="120">
        <template #default="{ row }">
          {{ formatDate(row.paymentDate) }}
        </template>
      </el-table-column>
      <el-table-column prop="status" label="状态" width="100">
        <template #default="{ row }">
          <el-tag :type="getStatusType(row.status)" size="small">
            {{ row.status }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="payer" label="支付方" min-width="120" />
      <template #empty>
        <TableEmpty description="暂无成本记录" />
      </template>
    </el-table>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { costApi } from '@/api/cost'
import TableEmpty from '@/components/common/TableEmpty.vue'

interface Props {
  caseId: number
}

const props = defineProps<Props>()

const loading = ref(false)
const costList = ref<any[]>([])

const getStatusType = (status: string) => {
  const typeMap: Record<string, any> = {
    '待支付': 'warning',
    '已支付': 'success',
    '已逾期': 'danger'
  }
  return typeMap[status] || 'info'
}

const formatAmount = (amount: number): string => {
  if (!amount) return '¥0.00'
  return '¥' + amount.toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

const formatDate = (dateString: string): string => {
  if (!dateString) return '-'
  const date = new Date(dateString)
  return date.toLocaleDateString('zh-CN')
}

const getCostSummary = (param: any) => {
  const { columns, data } = param
  const sums: string[] = []
  
  columns.forEach((column: any, index: number) => {
    if (index === 0) {
      sums[index] = '合计'
      return
    }
    
    if (column.property === 'amount') {
      const values = data.map((item: any) => Number(item.amount))
      const total = values.reduce((prev: number, curr: number) => {
        const value = Number(curr)
        if (!isNaN(value)) {
          return prev + value
        } else {
          return prev
        }
      }, 0)
      sums[index] = formatAmount(total)
    } else {
      sums[index] = ''
    }
  })
  
  return sums
}

const loadCosts = async () => {
  loading.value = true
  try {
    const response = await costApi.getCostsByCaseId(props.caseId)
    if (response && response.data) {
      const data = response.data.costs || []
      const list = Array.isArray(data) ? data : []
      
      costList.value = list.map((item: any) => ({
        id: item.id,
        caseId: item.case_id,
        costType: item.cost_type,
        amount: item.amount,
        paymentDate: item.payment_date,
        status: item.status,
        payer: item.payer
      }))
    }
  } catch (error: any) {
    console.error('加载成本记录失败:', error)
    ElMessage.error('加载成本记录失败')
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  loadCosts()
})
</script>

<style scoped>
.cost-list {
  min-height: 200px;
}
</style>
