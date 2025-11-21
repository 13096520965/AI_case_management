<template>
  <div class="cost-calculator-container">
    <PageHeader title="费用计算器" :breadcrumb="breadcrumb" />
    
    <el-row :gutter="20">
      <!-- Calculator Type Selection -->
      <el-col :span="6">
        <el-card class="calculator-menu">
          <el-menu :default-active="activeCalculator" @select="handleCalculatorChange">
            <el-menu-item index="litigation">
              <el-icon><Document /></el-icon>
              <span>诉讼费计算器</span>
            </el-menu-item>
            <el-menu-item index="lawyer">
              <el-icon><User /></el-icon>
              <span>律师费计算器</span>
            </el-menu-item>
            <el-menu-item index="preservation">
              <el-icon><Lock /></el-icon>
              <span>保全费计算器</span>
            </el-menu-item>
            <el-menu-item index="penalty">
              <el-icon><Money /></el-icon>
              <span>违约金计算器</span>
            </el-menu-item>
          </el-menu>
        </el-card>
      </el-col>

      <!-- Calculator Content -->
      <el-col :span="18">
        <!-- Litigation Fee Calculator -->
        <el-card v-if="activeCalculator === 'litigation'" class="calculator-card">
          <template #header>
            <div class="card-header">
              <span>诉讼费计算器</span>
            </div>
          </template>
          
          <el-form :model="litigationForm" label-width="120px">
            <el-form-item label="案件类型">
              <el-select v-model="litigationForm.caseType" placeholder="请选择案件类型">
                <el-option label="财产案件" value="财产案件" />
                <el-option label="非财产案件" value="非财产案件" />
                <el-option label="知识产权案件" value="知识产权案件" />
                <el-option label="劳动争议案件" value="劳动争议案件" />
              </el-select>
            </el-form-item>
            <el-form-item label="标的额（元）" v-if="litigationForm.caseType === '财产案件'">
              <el-input-number 
                v-model="litigationForm.targetAmount" 
                :min="0" 
                :precision="2"
                :step="1000"
                style="width: 100%"
              />
            </el-form-item>
            <el-form-item>
              <el-button type="primary" @click="calculateLitigationFee">计算</el-button>
              <el-button @click="resetLitigationForm">重置</el-button>
            </el-form-item>
          </el-form>

          <el-divider />

          <div v-if="litigationResult" class="result-section">
            <h3>计算结果</h3>
            <el-descriptions :column="1" border>
              <el-descriptions-item label="诉讼费">
                <span class="result-amount">¥{{ litigationResult.fee?.toLocaleString() }}</span>
              </el-descriptions-item>
              <el-descriptions-item label="计算说明">
                {{ litigationResult.description }}
              </el-descriptions-item>
            </el-descriptions>
          </div>
        </el-card>

        <!-- Lawyer Fee Calculator -->
        <el-card v-if="activeCalculator === 'lawyer'" class="calculator-card">
          <template #header>
            <div class="card-header">
              <span>律师费计算器</span>
            </div>
          </template>
          
          <el-form :model="lawyerForm" label-width="120px">
            <el-form-item label="收费方式">
              <el-select v-model="lawyerForm.feeType" placeholder="请选择收费方式">
                <el-option label="按标的额比例" value="按标的额比例" />
                <el-option label="固定收费" value="固定收费" />
                <el-option label="按时计费" value="按时计费" />
              </el-select>
            </el-form-item>
            <el-form-item label="标的额（元）" v-if="lawyerForm.feeType === '按标的额比例'">
              <el-input-number 
                v-model="lawyerForm.targetAmount" 
                :min="0" 
                :precision="2"
                :step="1000"
                style="width: 100%"
              />
            </el-form-item>
            <el-form-item label="费率（%）" v-if="lawyerForm.feeType === '按标的额比例'">
              <el-input-number 
                v-model="lawyerForm.rate" 
                :min="0" 
                :max="100"
                :precision="2"
                :step="0.5"
                style="width: 100%"
              />
            </el-form-item>
            <el-form-item label="固定金额（元）" v-if="lawyerForm.feeType === '固定收费'">
              <el-input-number 
                v-model="lawyerForm.fixedAmount" 
                :min="0" 
                :precision="2"
                :step="1000"
                style="width: 100%"
              />
            </el-form-item>
            <el-form-item label="小时费率（元/小时）" v-if="lawyerForm.feeType === '按时计费'">
              <el-input-number 
                v-model="lawyerForm.hourlyRate" 
                :min="0" 
                :precision="2"
                :step="100"
                style="width: 100%"
              />
            </el-form-item>
            <el-form-item label="工作小时数" v-if="lawyerForm.feeType === '按时计费'">
              <el-input-number 
                v-model="lawyerForm.hours" 
                :min="0" 
                :precision="1"
                :step="1"
                style="width: 100%"
              />
            </el-form-item>
            <el-form-item>
              <el-button type="primary" @click="calculateLawyerFee">计算</el-button>
              <el-button @click="resetLawyerForm">重置</el-button>
            </el-form-item>
          </el-form>

          <el-divider />

          <div v-if="lawyerResult" class="result-section">
            <h3>计算结果</h3>
            <el-descriptions :column="1" border>
              <el-descriptions-item label="律师费">
                <span class="result-amount">¥{{ lawyerResult.fee?.toLocaleString() }}</span>
              </el-descriptions-item>
              <el-descriptions-item label="计算说明">
                {{ lawyerResult.description }}
              </el-descriptions-item>
            </el-descriptions>
          </div>
        </el-card>

        <!-- Preservation Fee Calculator -->
        <el-card v-if="activeCalculator === 'preservation'" class="calculator-card">
          <template #header>
            <div class="card-header">
              <span>保全费计算器</span>
            </div>
          </template>
          
          <el-form :model="preservationForm" label-width="120px">
            <el-form-item label="保全标的额（元）">
              <el-input-number 
                v-model="preservationForm.targetAmount" 
                :min="0" 
                :precision="2"
                :step="1000"
                style="width: 100%"
              />
            </el-form-item>
            <el-form-item>
              <el-button type="primary" @click="calculatePreservationFee">计算</el-button>
              <el-button @click="resetPreservationForm">重置</el-button>
            </el-form-item>
          </el-form>

          <el-divider />

          <div v-if="preservationResult" class="result-section">
            <h3>计算结果</h3>
            <el-descriptions :column="1" border>
              <el-descriptions-item label="保全费">
                <span class="result-amount">¥{{ preservationResult.fee?.toLocaleString() }}</span>
              </el-descriptions-item>
              <el-descriptions-item label="计算说明">
                {{ preservationResult.description }}
              </el-descriptions-item>
            </el-descriptions>
          </div>
        </el-card>

        <!-- Penalty Calculator -->
        <el-card v-if="activeCalculator === 'penalty'" class="calculator-card">
          <template #header>
            <div class="card-header">
              <span>违约金计算器</span>
            </div>
          </template>
          
          <el-form :model="penaltyForm" label-width="120px">
            <el-form-item label="本金（元）">
              <el-input-number 
                v-model="penaltyForm.principal" 
                :min="0" 
                :precision="2"
                :step="1000"
                style="width: 100%"
              />
            </el-form-item>
            <el-form-item label="年利率（%）">
              <el-input-number 
                v-model="penaltyForm.interestRate" 
                :min="0" 
                :max="100"
                :precision="2"
                :step="0.1"
                style="width: 100%"
              />
            </el-form-item>
            <el-form-item label="起始日期">
              <el-date-picker 
                v-model="penaltyForm.startDate" 
                type="date" 
                placeholder="选择日期"
                value-format="YYYY-MM-DD"
                style="width: 100%"
              />
            </el-form-item>
            <el-form-item label="结束日期">
              <el-date-picker 
                v-model="penaltyForm.endDate" 
                type="date" 
                placeholder="选择日期"
                value-format="YYYY-MM-DD"
                style="width: 100%"
              />
            </el-form-item>
            <el-form-item label="计息方式">
              <el-radio-group v-model="penaltyForm.compoundInterest">
                <el-radio :label="false">单利</el-radio>
                <el-radio :label="true">复利</el-radio>
              </el-radio-group>
            </el-form-item>
            <el-form-item>
              <el-button type="primary" @click="calculatePenalty">计算</el-button>
              <el-button @click="resetPenaltyForm">重置</el-button>
            </el-form-item>
          </el-form>

          <el-divider />

          <div v-if="penaltyResult" class="result-section">
            <h3>计算结果</h3>
            <el-descriptions :column="1" border>
              <el-descriptions-item label="违约金/利息">
                <span class="result-amount">¥{{ penaltyResult.interest?.toLocaleString() }}</span>
              </el-descriptions-item>
              <el-descriptions-item label="本息合计">
                <span class="result-amount">¥{{ penaltyResult.total?.toLocaleString() }}</span>
              </el-descriptions-item>
              <el-descriptions-item label="计算天数">
                {{ penaltyResult.days }} 天
              </el-descriptions-item>
              <el-descriptions-item label="计算说明">
                {{ penaltyResult.description }}
              </el-descriptions-item>
            </el-descriptions>
          </div>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue'
import { ElMessage } from 'element-plus'
import { Document, User, Lock, Money } from '@element-plus/icons-vue'
import { costApi } from '@/api/cost'
import PageHeader from '@/components/common/PageHeader.vue'

const breadcrumb = [
  { title: '成本管理' },
  { title: '费用计算器' }
]

const activeCalculator = ref('litigation')

// Litigation Fee Form
const litigationForm = reactive({
  caseType: '财产案件',
  targetAmount: 0
})

const litigationResult = ref<any>(null)

// Lawyer Fee Form
const lawyerForm = reactive({
  feeType: '按标的额比例',
  targetAmount: 0,
  rate: 5,
  fixedAmount: 0,
  hourlyRate: 0,
  hours: 0
})

const lawyerResult = ref<any>(null)

// Preservation Fee Form
const preservationForm = reactive({
  targetAmount: 0
})

const preservationResult = ref<any>(null)

// Penalty Form
const penaltyForm = reactive({
  principal: 0,
  interestRate: 6,
  startDate: '',
  endDate: '',
  compoundInterest: false
})

const penaltyResult = ref<any>(null)

const handleCalculatorChange = (index: string) => {
  activeCalculator.value = index
}

const calculateLitigationFee = async () => {
  try {
    const response = await costApi.calculateCost({
      calculationType: 'litigation',
      caseType: litigationForm.caseType,
      targetAmount: litigationForm.targetAmount
    })
    litigationResult.value = response.data
    ElMessage.success('计算完成')
  } catch (error) {
    ElMessage.error('计算失败')
    console.error(error)
  }
}

const calculateLawyerFee = async () => {
  try {
    const params: any = {
      calculationType: 'lawyer',
      feeType: lawyerForm.feeType
    }
    
    if (lawyerForm.feeType === '按标的额比例') {
      params.targetAmount = lawyerForm.targetAmount
      params.rate = lawyerForm.rate
    } else if (lawyerForm.feeType === '固定收费') {
      params.targetAmount = lawyerForm.fixedAmount
    } else if (lawyerForm.feeType === '按时计费') {
      params.rate = lawyerForm.hourlyRate
      params.targetAmount = lawyerForm.hours
    }
    
    const response = await costApi.calculateCost(params)
    lawyerResult.value = response.data
    ElMessage.success('计算完成')
  } catch (error) {
    ElMessage.error('计算失败')
    console.error(error)
  }
}

const calculatePreservationFee = async () => {
  try {
    const response = await costApi.calculateCost({
      calculationType: 'preservation',
      targetAmount: preservationForm.targetAmount
    })
    preservationResult.value = response.data
    ElMessage.success('计算完成')
  } catch (error) {
    ElMessage.error('计算失败')
    console.error(error)
  }
}

const calculatePenalty = async () => {
  try {
    const response = await costApi.calculateCost({
      calculationType: 'penalty',
      principal: penaltyForm.principal,
      interestRate: penaltyForm.interestRate,
      startDate: penaltyForm.startDate,
      endDate: penaltyForm.endDate
    })
    penaltyResult.value = response.data
    ElMessage.success('计算完成')
  } catch (error) {
    ElMessage.error('计算失败')
    console.error(error)
  }
}

const resetLitigationForm = () => {
  litigationForm.caseType = '财产案件'
  litigationForm.targetAmount = 0
  litigationResult.value = null
}

const resetLawyerForm = () => {
  lawyerForm.feeType = '按标的额比例'
  lawyerForm.targetAmount = 0
  lawyerForm.rate = 5
  lawyerForm.fixedAmount = 0
  lawyerForm.hourlyRate = 0
  lawyerForm.hours = 0
  lawyerResult.value = null
}

const resetPreservationForm = () => {
  preservationForm.targetAmount = 0
  preservationResult.value = null
}

const resetPenaltyForm = () => {
  penaltyForm.principal = 0
  penaltyForm.interestRate = 6
  penaltyForm.startDate = ''
  penaltyForm.endDate = ''
  penaltyForm.compoundInterest = false
  penaltyResult.value = null
}
</script>

<style scoped>
.cost-calculator-container {
  padding: 20px;
}

.calculator-menu {
  position: sticky;
  top: 20px;
}

.calculator-card {
  min-height: 500px;
}

.card-header {
  font-size: 18px;
  font-weight: 600;
}

.result-section {
  margin-top: 20px;
}

.result-section h3 {
  margin-bottom: 15px;
  color: #303133;
}

.result-amount {
  font-size: 24px;
  font-weight: 700;
  color: #f56c6c;
}
</style>
