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
              <el-select 
                v-model="litigationForm.caseType" 
                placeholder="请选择案件类型"
                @change="handleCaseTypeChange"
              >
                <el-option 
                  v-for="caseType in caseTypes" 
                  :key="caseType.value"
                  :label="caseType.label" 
                  :value="caseType.value" 
                />
              </el-select>
            </el-form-item>
            <el-form-item label="标的额（元）" v-if="requiresTargetAmount">
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

// Case Type Configuration
interface CaseTypeConfig {
  value: string
  label: string
  requiresAmount: boolean
  calculationMethod: string
}

const caseTypes: CaseTypeConfig[] = [
  { value: '财产案件', label: '财产案件', requiresAmount: true, calculationMethod: 'property' },
  { value: '其他非财产案件', label: '其他非财产案件', requiresAmount: false, calculationMethod: 'nonProperty' },
  { value: '知识产权民事案件', label: '知识产权民事案件', requiresAmount: true, calculationMethod: 'ip' },
  { value: '劳动争议案件', label: '劳动争议案件', requiresAmount: false, calculationMethod: 'labor' },
  { value: '商标、专利、海事行政案件', label: '商标、专利、海事行政案件', requiresAmount: false, calculationMethod: 'specialAdmin' },
  { value: '其他行政案件', label: '其他行政案件', requiresAmount: false, calculationMethod: 'admin' },
  { value: '管辖权异议不成立案件', label: '管辖权异议不成立案件', requiresAmount: false, calculationMethod: 'jurisdiction' },
  { value: '离婚案件', label: '离婚案件', requiresAmount: true, calculationMethod: 'divorce' },
  { value: '人格权案件', label: '人格权案件', requiresAmount: true, calculationMethod: 'personalityRights' }
]

// Litigation Fee Form
const litigationForm = reactive({
  caseType: '财产案件',
  targetAmount: 0
})

const litigationResult = ref<any>(null)

// Computed property to check if current case type requires amount
const requiresTargetAmount = ref(true)

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

// Handle case type change
const handleCaseTypeChange = (caseType: string) => {
  const config = caseTypes.find(ct => ct.value === caseType)
  if (config) {
    requiresTargetAmount.value = config.requiresAmount
    // Clear target amount when field is hidden
    if (!config.requiresAmount) {
      litigationForm.targetAmount = 0
    }
  }
}

// Fee Tier Interface
interface FeeTier {
  min: number
  max: number | null
  rate: number
  baseFee: number
}

// Property case fee tiers (10-tier system)
const propertyTiers: FeeTier[] = [
  { min: 0, max: 10000, rate: 0, baseFee: 50 },
  { min: 10000, max: 100000, rate: 2.5, baseFee: 50 },
  { min: 100000, max: 200000, rate: 2.0, baseFee: 2300 },
  { min: 200000, max: 500000, rate: 1.5, baseFee: 4300 },
  { min: 500000, max: 1000000, rate: 1.0, baseFee: 8800 },
  { min: 1000000, max: 2000000, rate: 0.9, baseFee: 13800 },
  { min: 2000000, max: 5000000, rate: 0.8, baseFee: 22800 },
  { min: 5000000, max: 10000000, rate: 0.7, baseFee: 46800 },
  { min: 10000000, max: 20000000, rate: 0.6, baseFee: 81800 },
  { min: 20000000, max: null, rate: 0.5, baseFee: 141800 }
]

// Calculate property case litigation fee
const calculatePropertyCase = (targetAmount: number): { fee: number; description: string } => {
  // Handle amounts not exceeding 10,000 yuan
  if (targetAmount <= 10000) {
    return {
      fee: 50,
      description: '标的额不超过1万元，收取固定费用50元'
    }
  }

  // For amounts exceeding 10,000, use tiered calculation
  let totalFee = 0
  let description = '按分段累计计算：'
  
  for (let i = 0; i < propertyTiers.length; i++) {
    const tier = propertyTiers[i]
    
    // Skip if target amount hasn't reached this tier
    if (targetAmount <= tier.min) {
      break
    }
    
    // Calculate the amount in this tier
    let amountInTier = 0
    if (tier.max === null) {
      // Last tier (no upper limit)
      amountInTier = targetAmount - tier.min
    } else if (targetAmount > tier.max) {
      // Amount exceeds this tier's max
      amountInTier = tier.max - tier.min
    } else {
      // Amount falls within this tier
      amountInTier = targetAmount - tier.min
    }
    
    // Calculate fee for this tier
    if (tier.rate === 0) {
      // First tier: fixed fee
      totalFee = tier.baseFee
    } else {
      // Other tiers: percentage-based
      const tierFee = amountInTier * (tier.rate / 100)
      totalFee += tierFee
    }
    
    // Stop if we've reached the tier containing the target amount
    if (tier.max === null || targetAmount <= tier.max) {
      break
    }
  }
  
  // Round to 2 decimal places
  totalFee = Math.round(totalFee * 100) / 100
  
  return {
    fee: totalFee,
    description: description + `标的额${targetAmount.toLocaleString()}元，诉讼费${totalFee.toLocaleString()}元`
  }
}

// Calculate non-property case litigation fee
const calculateNonPropertyCase = (): { fee: number; description: string } => {
  // Fixed fee between 50-100 yuan for non-property cases
  // Using midpoint of the range as the standard fee
  const fee = 75
  
  return {
    fee: fee,
    description: '其他非财产案件，收取固定费用50元至100元'
  }
}

// Calculate IP (Intellectual Property) case litigation fee
const calculateIPCase = (targetAmount: number): { fee: number; description: string } => {
  // When target amount is zero or not provided, return fixed fee between 500-1000 yuan
  if (targetAmount === 0 || targetAmount === null || targetAmount === undefined) {
    const fee = 750 // Using midpoint of the range as the standard fee
    return {
      fee: fee,
      description: '知识产权民事案件，没有争议金额的，收取固定费用500元至1000元'
    }
  }
  
  // When target amount is greater than zero, use property case calculation
  const propertyResult = calculatePropertyCase(targetAmount)
  return {
    fee: propertyResult.fee,
    description: `知识产权民事案件，有争议金额的，按照财产案件标准计算：${propertyResult.description}`
  }
}

// Calculate labor dispute case litigation fee
const calculateLaborCase = (): { fee: number; description: string } => {
  // Fixed fee of 10 yuan for labor dispute cases
  return {
    fee: 10,
    description: '劳动争议案件，收取固定费用10元'
  }
}

// Calculate special administrative case litigation fee (trademark, patent, maritime)
const calculateSpecialAdminCase = (): { fee: number; description: string } => {
  // Fixed fee of 100 yuan for special administrative cases
  return {
    fee: 100,
    description: '商标、专利、海事行政案件，收取固定费用100元'
  }
}

// Calculate other administrative case litigation fee
const calculateAdminCase = (): { fee: number; description: string } => {
  // Fixed fee of 50 yuan for other administrative cases
  return {
    fee: 50,
    description: '其他行政案件，收取固定费用50元'
  }
}

// Calculate jurisdiction objection case litigation fee
const calculateJurisdictionCase = (): { fee: number; description: string } => {
  // Fixed fee between 50-100 yuan for jurisdiction objection cases
  // Using midpoint of the range as the standard fee
  const fee = 75
  
  return {
    fee: fee,
    description: '管辖权异议不成立案件，收取固定费用50元至100元'
  }
}

// Calculate divorce case litigation fee
const calculateDivorceCase = (targetAmount: number): { fee: number; description: string } => {
  const threshold = 200000 // 20万元
  const baseFeeMin = 50
  const baseFeeMax = 300
  const rate = 0.5 // 0.5%
  
  // When target amount is zero or not exceeding 200,000 yuan, return fixed fee between 50-300 yuan
  if (targetAmount === 0 || targetAmount === null || targetAmount === undefined || targetAmount <= threshold) {
    // Using midpoint of the range as the standard fee
    const fee = (baseFeeMin + baseFeeMax) / 2
    return {
      fee: fee,
      description: '离婚案件，标的额不超过20万元，收取固定费用50元至300元'
    }
  }
  
  // When target amount exceeds 200,000 yuan, add 0.5% of the excess amount to the base fee
  const baseFee = (baseFeeMin + baseFeeMax) / 2
  const excessAmount = targetAmount - threshold
  const additionalFee = excessAmount * (rate / 100)
  const totalFee = baseFee + additionalFee
  
  // Round to 2 decimal places
  const roundedFee = Math.round(totalFee * 100) / 100
  
  return {
    fee: roundedFee,
    description: `离婚案件，标的额${targetAmount.toLocaleString()}元，超过20万元部分按0.5%加收，诉讼费${roundedFee.toLocaleString()}元`
  }
}

// Calculate personality rights case litigation fee
const calculatePersonalityRightsCase = (targetAmount: number): { fee: number; description: string } => {
  const baseFeeMin = 100
  const baseFeeMax = 500
  const tier1Threshold = 50000 // 5万元
  const tier2Threshold = 100000 // 10万元
  const tier1Rate = 1.0 // 1%
  const tier2Rate = 0.5 // 0.5%
  
  // When target amount is zero or not exceeding 50,000 yuan, return fixed fee between 100-500 yuan
  if (targetAmount === 0 || targetAmount === null || targetAmount === undefined || targetAmount <= tier1Threshold) {
    // Using midpoint of the range as the standard fee
    const fee = (baseFeeMin + baseFeeMax) / 2
    return {
      fee: fee,
      description: '人格权案件，标的额不超过5万元，收取固定费用100元至500元'
    }
  }
  
  // Calculate base fee (midpoint of the range)
  const baseFee = (baseFeeMin + baseFeeMax) / 2
  
  // When target amount exceeds 50,000 but not exceeding 100,000 yuan
  if (targetAmount > tier1Threshold && targetAmount <= tier2Threshold) {
    const excessAmount = targetAmount - tier1Threshold
    const additionalFee = excessAmount * (tier1Rate / 100)
    const totalFee = baseFee + additionalFee
    
    // Round to 2 decimal places
    const roundedFee = Math.round(totalFee * 100) / 100
    
    return {
      fee: roundedFee,
      description: `人格权案件，标的额${targetAmount.toLocaleString()}元，超过5万元部分按1%加收，诉讼费${roundedFee.toLocaleString()}元`
    }
  }
  
  // When target amount exceeds 100,000 yuan
  if (targetAmount > tier2Threshold) {
    // Calculate fee for tier 1 (50,000 to 100,000)
    const tier1Amount = tier2Threshold - tier1Threshold
    const tier1Fee = tier1Amount * (tier1Rate / 100)
    
    // Calculate fee for tier 2 (above 100,000)
    const tier2Amount = targetAmount - tier2Threshold
    const tier2Fee = tier2Amount * (tier2Rate / 100)
    
    const totalFee = baseFee + tier1Fee + tier2Fee
    
    // Round to 2 decimal places
    const roundedFee = Math.round(totalFee * 100) / 100
    
    return {
      fee: roundedFee,
      description: `人格权案件，标的额${targetAmount.toLocaleString()}元，超过5万元至10万元部分按1%加收，超过10万元部分按0.5%加收，诉讼费${roundedFee.toLocaleString()}元`
    }
  }
  
  // Fallback (should not reach here)
  return {
    fee: baseFee,
    description: '人格权案件，收取固定费用100元至500元'
  }
}

const calculateLitigationFee = () => {
  try {
    // Validate case type is selected
    if (!litigationForm.caseType) {
      ElMessage.error('请选择案件类型')
      return
    }

    // Find case type configuration
    const config = caseTypes.find(ct => ct.value === litigationForm.caseType)
    if (!config) {
      ElMessage.error('无效的案件类型')
      return
    }

    // Validate target amount if required by case type
    if (config.requiresAmount) {
      // Check if target amount is provided
      if (litigationForm.targetAmount === null || litigationForm.targetAmount === undefined) {
        ElMessage.error('请输入标的额')
        return
      }
      
      // Check if target amount is negative
      if (litigationForm.targetAmount < 0) {
        ElMessage.error('标的额不能为负数')
        return
      }
    }

    // Route to appropriate calculation function
    let result: { fee: number; description: string }
    
    switch (config.calculationMethod) {
      case 'property':
        result = calculatePropertyCase(litigationForm.targetAmount)
        break
      case 'nonProperty':
        result = calculateNonPropertyCase()
        break
      case 'ip':
        result = calculateIPCase(litigationForm.targetAmount)
        break
      case 'labor':
        result = calculateLaborCase()
        break
      case 'specialAdmin':
        result = calculateSpecialAdminCase()
        break
      case 'admin':
        result = calculateAdminCase()
        break
      case 'jurisdiction':
        result = calculateJurisdictionCase()
        break
      case 'divorce':
        result = calculateDivorceCase(litigationForm.targetAmount)
        break
      case 'personalityRights':
        result = calculatePersonalityRightsCase(litigationForm.targetAmount)
        break
      default:
        ElMessage.error('该案件类型的计算功能尚未实现')
        return
    }

    litigationResult.value = result
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
