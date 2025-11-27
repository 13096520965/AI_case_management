import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import * as fc from 'fast-check'
import CostCalculator from '../CostCalculator.vue'
import { ElSelect, ElFormItem, ElInputNumber } from 'element-plus'

// Case type configuration matching the component
const caseTypes = [
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

// Property case fee tiers (matching the component implementation)
const propertyTiers = [
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

// Helper function to calculate expected property case fee
const calculateExpectedPropertyFee = (targetAmount: number): number => {
  if (targetAmount <= 10000) {
    return 50
  }

  let totalFee = 0
  
  for (let i = 0; i < propertyTiers.length; i++) {
    const tier = propertyTiers[i]
    
    if (targetAmount <= tier.min) {
      break
    }
    
    let amountInTier = 0
    if (tier.max === null) {
      amountInTier = targetAmount - tier.min
    } else if (targetAmount > tier.max) {
      amountInTier = tier.max - tier.min
    } else {
      amountInTier = targetAmount - tier.min
    }
    
    if (tier.rate === 0) {
      totalFee = tier.baseFee
    } else {
      const tierFee = amountInTier * (tier.rate / 100)
      totalFee += tierFee
    }
    
    if (tier.max === null || targetAmount <= tier.max) {
      break
    }
  }
  
  return Math.round(totalFee * 100) / 100
}

describe('CostCalculator - Property-Based Tests', () => {
  // Feature: litigation-cost-calculator-enhancement, Property 1: All case types are available
  // Validates: Requirements 1.1, 2.1, 3.1, 4.1, 5.1, 6.1, 7.1, 8.1, 9.1
  describe('Property 1: All case types are available', () => {
    it('should have all required case types available in the dropdown', () => {
      fc.assert(
        fc.property(
          fc.constantFrom(...caseTypes.map(ct => ct.value)),
          (requiredCaseType) => {
            const wrapper = mount(CostCalculator, {
              global: {
                components: { ElSelect, ElFormItem, ElInputNumber },
                stubs: {
                  PageHeader: true, ElCard: true, ElRow: true, ElCol: true, ElMenu: true,
                  ElMenuItem: true, ElIcon: true, ElForm: true, ElButton: true, ElDivider: true,
                  ElDescriptions: true, ElDescriptionsItem: true, ElDatePicker: true,
                  ElRadioGroup: true, ElRadio: true
                }
              }
            })
            
            // Get the component's caseTypes data
            const componentCaseTypes = wrapper.vm.caseTypes
            
            // Verify the required case type exists in the component's case types
            const caseTypeExists = componentCaseTypes.some((ct: any) => ct.value === requiredCaseType)
            expect(caseTypeExists).toBe(true)
            
            // Also verify the case type can be selected
            wrapper.vm.litigationForm.caseType = requiredCaseType
            expect(wrapper.vm.litigationForm.caseType).toBe(requiredCaseType)
          }
        ),
        { numRuns: 100 }
      )
    })

    it('should have exactly 9 case types available', () => {
      const wrapper = mount(CostCalculator, {
        global: {
          components: { ElSelect, ElFormItem, ElInputNumber },
          stubs: {
            PageHeader: true, ElCard: true, ElRow: true, ElCol: true, ElMenu: true,
            ElMenuItem: true, ElIcon: true, ElForm: true, ElButton: true, ElDivider: true,
            ElDescriptions: true, ElDescriptionsItem: true, ElDatePicker: true,
            ElRadioGroup: true, ElRadio: true
          }
        }
      })
      
      const componentCaseTypes = wrapper.vm.caseTypes
      expect(componentCaseTypes).toBeDefined()
      expect(componentCaseTypes.length).toBe(9)
    })

    it('should have all case types with correct labels matching values', () => {
      fc.assert(
        fc.property(
          fc.constantFrom(...caseTypes.map(ct => ct.value)),
          (caseTypeValue) => {
            const wrapper = mount(CostCalculator, {
              global: {
                components: { ElSelect, ElFormItem, ElInputNumber },
                stubs: {
                  PageHeader: true, ElCard: true, ElRow: true, ElCol: true, ElMenu: true,
                  ElMenuItem: true, ElIcon: true, ElForm: true, ElButton: true, ElDivider: true,
                  ElDescriptions: true, ElDescriptionsItem: true, ElDatePicker: true,
                  ElRadioGroup: true, ElRadio: true
                }
              }
            })
            
            const componentCaseTypes = wrapper.vm.caseTypes
            const caseType = componentCaseTypes.find((ct: any) => ct.value === caseTypeValue)
            
            expect(caseType).toBeDefined()
            expect(caseType.label).toBe(caseTypeValue)
            expect(caseType.value).toBe(caseTypeValue)
          }
        ),
        { numRuns: 100 }
      )
    })
  })

  // Feature: litigation-cost-calculator-enhancement, Property 3: Property case tiered calculation
  // Validates: Requirements 1.3, 1.5
  describe('Property 3: Property case tiered calculation', () => {
    it('should calculate property case fee using 10-tier formula for any target amount', () => {
      fc.assert(
        fc.property(
          fc.float({ min: 0, max: 100000000, noNaN: true, noDefaultInfinity: true }),
          (targetAmount) => {
            const wrapper = mount(CostCalculator, {
              global: {
                components: { ElSelect, ElFormItem, ElInputNumber },
                stubs: {
                  PageHeader: true, ElCard: true, ElRow: true, ElCol: true, ElMenu: true,
                  ElMenuItem: true, ElIcon: true, ElForm: true, ElButton: true, ElDivider: true,
                  ElDescriptions: true, ElDescriptionsItem: true, ElDatePicker: true,
                  ElRadioGroup: true, ElRadio: true
                }
              }
            })
            wrapper.vm.litigationForm.caseType = '财产案件'
            wrapper.vm.litigationForm.targetAmount = targetAmount
            wrapper.vm.calculateLitigationFee()
            const result = wrapper.vm.litigationResult
            const expectedFee = calculateExpectedPropertyFee(targetAmount)
            expect(result).toBeDefined()
            expect(result.fee).toBe(expectedFee)
            expect(result.description).toBeDefined()
            expect(typeof result.description).toBe('string')
            expect(result.description.length).toBeGreaterThan(0)
          }
        ),
        { numRuns: 100 }
      )
    })

    it('should return fixed 50 yuan fee for amounts not exceeding 10,000', () => {
      fc.assert(
        fc.property(
          fc.float({ min: 0, max: 10000, noNaN: true, noDefaultInfinity: true }),
          (targetAmount) => {
            const wrapper = mount(CostCalculator, {
              global: {
                components: { ElSelect, ElFormItem, ElInputNumber },
                stubs: {
                  PageHeader: true, ElCard: true, ElRow: true, ElCol: true, ElMenu: true,
                  ElMenuItem: true, ElIcon: true, ElForm: true, ElButton: true, ElDivider: true,
                  ElDescriptions: true, ElDescriptionsItem: true, ElDatePicker: true,
                  ElRadioGroup: true, ElRadio: true
                }
              }
            })
            wrapper.vm.litigationForm.caseType = '财产案件'
            wrapper.vm.litigationForm.targetAmount = targetAmount
            wrapper.vm.calculateLitigationFee()
            const result = wrapper.vm.litigationResult
            expect(result).toBeDefined()
            expect(result.fee).toBe(50)
          }
        ),
        { numRuns: 100 }
      )
    })

    it('should calculate tiered fees correctly for amounts exceeding 10,000', () => {
      fc.assert(
        fc.property(
          fc.float({ min: 10001, max: 100000000, noNaN: true, noDefaultInfinity: true }),
          (targetAmount) => {
            const wrapper = mount(CostCalculator, {
              global: {
                components: { ElSelect, ElFormItem, ElInputNumber },
                stubs: {
                  PageHeader: true, ElCard: true, ElRow: true, ElCol: true, ElMenu: true,
                  ElMenuItem: true, ElIcon: true, ElForm: true, ElButton: true, ElDivider: true,
                  ElDescriptions: true, ElDescriptionsItem: true, ElDatePicker: true,
                  ElRadioGroup: true, ElRadio: true
                }
              }
            })
            wrapper.vm.litigationForm.caseType = '财产案件'
            wrapper.vm.litigationForm.targetAmount = targetAmount
            wrapper.vm.calculateLitigationFee()
            const result = wrapper.vm.litigationResult
            const expectedFee = calculateExpectedPropertyFee(targetAmount)
            expect(result).toBeDefined()
            expect(result.fee).toBe(expectedFee)
            expect(result.fee).toBeGreaterThan(50)
          }
        ),
        { numRuns: 100 }
      )
    })
  })

  // Feature: litigation-cost-calculator-enhancement, Property 2: Field visibility matches case type requirements
  // Validates: Requirements 1.2, 2.2, 3.2, 4.2, 5.2, 6.2, 7.2, 8.2, 9.2, 10.1, 10.2
  describe('Property 2: Field visibility matches case type requirements', () => {
    it('should show/hide target amount field based on case type requirements', () => {
      fc.assert(
        fc.property(
          fc.constantFrom(...caseTypes.map(ct => ct.value)),
          (caseType) => {
            const wrapper = mount(CostCalculator, {
              global: {
                components: { ElSelect, ElFormItem, ElInputNumber },
                stubs: {
                  PageHeader: true, ElCard: true, ElRow: true, ElCol: true, ElMenu: true,
                  ElMenuItem: true, ElIcon: true, ElForm: true, ElButton: true, ElDivider: true,
                  ElDescriptions: true, ElDescriptionsItem: true, ElDatePicker: true,
                  ElRadioGroup: true, ElRadio: true
                }
              }
            })
            const config = caseTypes.find(ct => ct.value === caseType)
            wrapper.vm.litigationForm.caseType = caseType
            wrapper.vm.handleCaseTypeChange(caseType)
            wrapper.vm.$nextTick()
            expect(wrapper.vm.requiresTargetAmount).toBe(config?.requiresAmount)
            if (config?.requiresAmount) {
              expect(wrapper.vm.requiresTargetAmount).toBe(true)
            } else {
              expect(wrapper.vm.requiresTargetAmount).toBe(false)
            }
          }
        ),
        { numRuns: 100 }
      )
    })
  })

  // Feature: litigation-cost-calculator-enhancement, Property 15: UI updates immediately on case type change
  // Validates: Requirements 10.3
  describe('Property 15: UI updates immediately on case type change', () => {
    it('should update UI state immediately when case type changes', () => {
      fc.assert(
        fc.property(
          fc.constantFrom(...caseTypes.map(ct => ct.value)),
          fc.constantFrom(...caseTypes.map(ct => ct.value)),
          (initialCaseType, newCaseType) => {
            const wrapper = mount(CostCalculator, {
              global: {
                components: { ElSelect, ElFormItem, ElInputNumber },
                stubs: {
                  PageHeader: true, ElCard: true, ElRow: true, ElCol: true, ElMenu: true,
                  ElMenuItem: true, ElIcon: true, ElForm: true, ElButton: true, ElDivider: true,
                  ElDescriptions: true, ElDescriptionsItem: true, ElDatePicker: true,
                  ElRadioGroup: true, ElRadio: true
                }
              }
            })
            wrapper.vm.litigationForm.caseType = initialCaseType
            wrapper.vm.handleCaseTypeChange(initialCaseType)
            const initialConfig = caseTypes.find(ct => ct.value === initialCaseType)
            const initialRequiresAmount = wrapper.vm.requiresTargetAmount
            wrapper.vm.litigationForm.caseType = newCaseType
            wrapper.vm.handleCaseTypeChange(newCaseType)
            const newConfig = caseTypes.find(ct => ct.value === newCaseType)
            const newRequiresAmount = wrapper.vm.requiresTargetAmount
            expect(newRequiresAmount).toBe(newConfig?.requiresAmount)
            if (initialConfig?.requiresAmount !== newConfig?.requiresAmount) {
              expect(initialRequiresAmount).not.toBe(newRequiresAmount)
            }
          }
        ),
        { numRuns: 100 }
      )
    })
  })

  // Feature: litigation-cost-calculator-enhancement, Property 16: Field data is cleared when hidden
  // Validates: Requirements 10.4
  describe('Property 16: Field data is cleared when hidden', () => {
    it('should clear target amount when switching to case type that does not require amount', () => {
      fc.assert(
        fc.property(
          fc.constantFrom(...caseTypes.filter(ct => ct.requiresAmount).map(ct => ct.value)),
          fc.constantFrom(...caseTypes.filter(ct => !ct.requiresAmount).map(ct => ct.value)),
          fc.float({ min: 1, max: 1000000, noNaN: true }),
          (caseTypeWithAmount, caseTypeWithoutAmount, targetAmount) => {
            const wrapper = mount(CostCalculator, {
              global: {
                components: { ElSelect, ElFormItem, ElInputNumber },
                stubs: {
                  PageHeader: true, ElCard: true, ElRow: true, ElCol: true, ElMenu: true,
                  ElMenuItem: true, ElIcon: true, ElForm: true, ElButton: true, ElDivider: true,
                  ElDescriptions: true, ElDescriptionsItem: true, ElDatePicker: true,
                  ElRadioGroup: true, ElRadio: true
                }
              }
            })
            wrapper.vm.litigationForm.caseType = caseTypeWithAmount
            wrapper.vm.handleCaseTypeChange(caseTypeWithAmount)
            wrapper.vm.litigationForm.targetAmount = targetAmount
            expect(wrapper.vm.litigationForm.targetAmount).toBe(targetAmount)
            wrapper.vm.litigationForm.caseType = caseTypeWithoutAmount
            wrapper.vm.handleCaseTypeChange(caseTypeWithoutAmount)
            expect(wrapper.vm.litigationForm.targetAmount).toBe(0)
          }
        ),
        { numRuns: 100 }
      )
    })
  })

  // Feature: litigation-cost-calculator-enhancement, Property 4: Non-property case fixed fee range
  // Validates: Requirements 2.3
  describe('Property 4: Non-property case fixed fee range', () => {
    it('should return fee between 50 and 100 yuan inclusive for non-property cases', () => {
      fc.assert(
        fc.property(
          fc.constant('其他非财产案件'),
          (caseType) => {
            const wrapper = mount(CostCalculator, {
              global: {
                components: { ElSelect, ElFormItem, ElInputNumber },
                stubs: {
                  PageHeader: true, ElCard: true, ElRow: true, ElCol: true, ElMenu: true,
                  ElMenuItem: true, ElIcon: true, ElForm: true, ElButton: true, ElDivider: true,
                  ElDescriptions: true, ElDescriptionsItem: true, ElDatePicker: true,
                  ElRadioGroup: true, ElRadio: true
                }
              }
            })
            wrapper.vm.litigationForm.caseType = caseType
            wrapper.vm.handleCaseTypeChange(caseType)
            wrapper.vm.calculateLitigationFee()
            const result = wrapper.vm.litigationResult
            expect(result).toBeDefined()
            expect(result.fee).toBeGreaterThanOrEqual(50)
            expect(result.fee).toBeLessThanOrEqual(100)
            expect(result.description).toBeDefined()
            expect(typeof result.description).toBe('string')
            expect(result.description.length).toBeGreaterThan(0)
          }
        ),
        { numRuns: 100 }
      )
    })
  })

  // Feature: litigation-cost-calculator-enhancement, Property 5: IP case with no amount
  // Validates: Requirements 3.3
  describe('Property 5: IP case with no amount', () => {
    it('should return fee between 500 and 1000 yuan inclusive for IP cases with zero or no target amount', () => {
      fc.assert(
        fc.property(
          fc.constant(0),
          (targetAmount) => {
            const wrapper = mount(CostCalculator, {
              global: {
                components: { ElSelect, ElFormItem, ElInputNumber },
                stubs: {
                  PageHeader: true, ElCard: true, ElRow: true, ElCol: true, ElMenu: true,
                  ElMenuItem: true, ElIcon: true, ElForm: true, ElButton: true, ElDivider: true,
                  ElDescriptions: true, ElDescriptionsItem: true, ElDatePicker: true,
                  ElRadioGroup: true, ElRadio: true
                }
              }
            })
            wrapper.vm.litigationForm.caseType = '知识产权民事案件'
            wrapper.vm.handleCaseTypeChange('知识产权民事案件')
            wrapper.vm.litigationForm.targetAmount = targetAmount
            wrapper.vm.calculateLitigationFee()
            const result = wrapper.vm.litigationResult
            expect(result).toBeDefined()
            expect(result.fee).toBeGreaterThanOrEqual(500)
            expect(result.fee).toBeLessThanOrEqual(1000)
            expect(result.description).toBeDefined()
            expect(typeof result.description).toBe('string')
            expect(result.description.length).toBeGreaterThan(0)
          }
        ),
        { numRuns: 100 }
      )
    })
  })

  // Feature: litigation-cost-calculator-enhancement, Property 6: IP case with amount uses property formula
  // Validates: Requirements 3.4
  describe('Property 6: IP case with amount uses property formula', () => {
    it('should calculate IP case fee using property case formula when target amount is greater than zero', () => {
      fc.assert(
        fc.property(
          fc.float({ min: Math.fround(0.01), max: 100000000, noNaN: true, noDefaultInfinity: true }),
          (targetAmount) => {
            const wrapper = mount(CostCalculator, {
              global: {
                components: { ElSelect, ElFormItem, ElInputNumber },
                stubs: {
                  PageHeader: true, ElCard: true, ElRow: true, ElCol: true, ElMenu: true,
                  ElMenuItem: true, ElIcon: true, ElForm: true, ElButton: true, ElDivider: true,
                  ElDescriptions: true, ElDescriptionsItem: true, ElDatePicker: true,
                  ElRadioGroup: true, ElRadio: true
                }
              }
            })
            wrapper.vm.litigationForm.caseType = '知识产权民事案件'
            wrapper.vm.handleCaseTypeChange('知识产权民事案件')
            wrapper.vm.litigationForm.targetAmount = targetAmount
            wrapper.vm.calculateLitigationFee()
            const ipResult = wrapper.vm.litigationResult
            const expectedFee = calculateExpectedPropertyFee(targetAmount)
            expect(ipResult).toBeDefined()
            expect(ipResult.fee).toBe(expectedFee)
            expect(ipResult.description).toBeDefined()
            expect(typeof ipResult.description).toBe('string')
            expect(ipResult.description.length).toBeGreaterThan(0)
          }
        ),
        { numRuns: 100 }
      )
    })
  })

  // Feature: litigation-cost-calculator-enhancement, Property 7: Labor case fixed fee
  // Validates: Requirements 4.3
  describe('Property 7: Labor case fixed fee', () => {
    it('should return exactly 10 yuan for any labor dispute case calculation', () => {
      fc.assert(
        fc.property(
          fc.constant('劳动争议案件'),
          (caseType) => {
            const wrapper = mount(CostCalculator, {
              global: {
                components: { ElSelect, ElFormItem, ElInputNumber },
                stubs: {
                  PageHeader: true, ElCard: true, ElRow: true, ElCol: true, ElMenu: true,
                  ElMenuItem: true, ElIcon: true, ElForm: true, ElButton: true, ElDivider: true,
                  ElDescriptions: true, ElDescriptionsItem: true, ElDatePicker: true,
                  ElRadioGroup: true, ElRadio: true
                }
              }
            })
            wrapper.vm.litigationForm.caseType = caseType
            wrapper.vm.handleCaseTypeChange(caseType)
            wrapper.vm.calculateLitigationFee()
            const result = wrapper.vm.litigationResult
            expect(result).toBeDefined()
            expect(result.fee).toBe(10)
            expect(result.description).toBeDefined()
            expect(typeof result.description).toBe('string')
            expect(result.description.length).toBeGreaterThan(0)
          }
        ),
        { numRuns: 100 }
      )
    })
  })

  // Feature: litigation-cost-calculator-enhancement, Property 8: Special admin case fixed fee
  // Validates: Requirements 5.3
  describe('Property 8: Special admin case fixed fee', () => {
    it('should return exactly 100 yuan for any special administrative case calculation', () => {
      fc.assert(
        fc.property(
          fc.constant('商标、专利、海事行政案件'),
          (caseType) => {
            const wrapper = mount(CostCalculator, {
              global: {
                components: { ElSelect, ElFormItem, ElInputNumber },
                stubs: {
                  PageHeader: true, ElCard: true, ElRow: true, ElCol: true, ElMenu: true,
                  ElMenuItem: true, ElIcon: true, ElForm: true, ElButton: true, ElDivider: true,
                  ElDescriptions: true, ElDescriptionsItem: true, ElDatePicker: true,
                  ElRadioGroup: true, ElRadio: true
                }
              }
            })
            wrapper.vm.litigationForm.caseType = caseType
            wrapper.vm.handleCaseTypeChange(caseType)
            wrapper.vm.calculateLitigationFee()
            const result = wrapper.vm.litigationResult
            expect(result).toBeDefined()
            expect(result.fee).toBe(100)
            expect(result.description).toBeDefined()
            expect(typeof result.description).toBe('string')
            expect(result.description.length).toBeGreaterThan(0)
          }
        ),
        { numRuns: 100 }
      )
    })
  })

  // Feature: litigation-cost-calculator-enhancement, Property 9: Other admin case fixed fee
  // Validates: Requirements 6.3
  describe('Property 9: Other admin case fixed fee', () => {
    it('should return exactly 50 yuan for any other administrative case calculation', () => {
      fc.assert(
        fc.property(
          fc.constant('其他行政案件'),
          (caseType) => {
            const wrapper = mount(CostCalculator, {
              global: {
                components: { ElSelect, ElFormItem, ElInputNumber },
                stubs: {
                  PageHeader: true, ElCard: true, ElRow: true, ElCol: true, ElMenu: true,
                  ElMenuItem: true, ElIcon: true, ElForm: true, ElButton: true, ElDivider: true,
                  ElDescriptions: true, ElDescriptionsItem: true, ElDatePicker: true,
                  ElRadioGroup: true, ElRadio: true
                }
              }
            })
            wrapper.vm.litigationForm.caseType = caseType
            wrapper.vm.handleCaseTypeChange(caseType)
            wrapper.vm.calculateLitigationFee()
            const result = wrapper.vm.litigationResult
            expect(result).toBeDefined()
            expect(result.fee).toBe(50)
            expect(result.description).toBeDefined()
            expect(typeof result.description).toBe('string')
            expect(result.description.length).toBeGreaterThan(0)
          }
        ),
        { numRuns: 100 }
      )
    })
  })

  // Feature: litigation-cost-calculator-enhancement, Property 10: Jurisdiction case fixed fee range
  // Validates: Requirements 7.3
  describe('Property 10: Jurisdiction case fixed fee range', () => {
    it('should return fee between 50 and 100 yuan inclusive for jurisdiction objection cases', () => {
      fc.assert(
        fc.property(
          fc.constant('管辖权异议不成立案件'),
          (caseType) => {
            const wrapper = mount(CostCalculator, {
              global: {
                components: { ElSelect, ElFormItem, ElInputNumber },
                stubs: {
                  PageHeader: true, ElCard: true, ElRow: true, ElCol: true, ElMenu: true,
                  ElMenuItem: true, ElIcon: true, ElForm: true, ElButton: true, ElDivider: true,
                  ElDescriptions: true, ElDescriptionsItem: true, ElDatePicker: true,
                  ElRadioGroup: true, ElRadio: true
                }
              }
            })
            wrapper.vm.litigationForm.caseType = caseType
            wrapper.vm.handleCaseTypeChange(caseType)
            wrapper.vm.calculateLitigationFee()
            const result = wrapper.vm.litigationResult
            expect(result).toBeDefined()
            expect(result.fee).toBeGreaterThanOrEqual(50)
            expect(result.fee).toBeLessThanOrEqual(100)
            expect(result.description).toBeDefined()
            expect(typeof result.description).toBe('string')
            expect(result.description.length).toBeGreaterThan(0)
          }
        ),
        { numRuns: 100 }
      )
    })
  })

  // Feature: litigation-cost-calculator-enhancement, Property 12: Personality rights case tier 1
  // Validates: Requirements 9.4
  describe('Property 12: Personality rights case tier 1', () => {
    it('should calculate personality rights case fee as base fee plus 1% of amount exceeding 50,000 yuan for amounts between 50,000 and 100,000', () => {
      fc.assert(
        fc.property(
          fc.float({ min: 50001, max: 100000, noNaN: true, noDefaultInfinity: true }),
          (targetAmount) => {
            const wrapper = mount(CostCalculator, {
              global: {
                components: { ElSelect, ElFormItem, ElInputNumber },
                stubs: {
                  PageHeader: true, ElCard: true, ElRow: true, ElCol: true, ElMenu: true,
                  ElMenuItem: true, ElIcon: true, ElForm: true, ElButton: true, ElDivider: true,
                  ElDescriptions: true, ElDescriptionsItem: true, ElDatePicker: true,
                  ElRadioGroup: true, ElRadio: true
                }
              }
            })
            wrapper.vm.litigationForm.caseType = '人格权案件'
            wrapper.vm.handleCaseTypeChange('人格权案件')
            wrapper.vm.litigationForm.targetAmount = targetAmount
            wrapper.vm.calculateLitigationFee()
            const result = wrapper.vm.litigationResult
            
            // Calculate expected fee
            const baseFee = (100 + 500) / 2 // 300
            const tier1Threshold = 50000
            const excessAmount = targetAmount - tier1Threshold
            const additionalFee = excessAmount * 0.01 // 1%
            const expectedFee = Math.round((baseFee + additionalFee) * 100) / 100
            
            expect(result).toBeDefined()
            expect(result.fee).toBe(expectedFee)
            expect(result.fee).toBeGreaterThan(baseFee)
            expect(result.description).toBeDefined()
            expect(typeof result.description).toBe('string')
            expect(result.description.length).toBeGreaterThan(0)
          }
        ),
        { numRuns: 100 }
      )
    })

    it('should return base fee for personality rights cases with amount at or below 50,000 yuan', () => {
      fc.assert(
        fc.property(
          fc.float({ min: 0, max: 50000, noNaN: true, noDefaultInfinity: true }),
          (targetAmount) => {
            const wrapper = mount(CostCalculator, {
              global: {
                components: { ElSelect, ElFormItem, ElInputNumber },
                stubs: {
                  PageHeader: true, ElCard: true, ElRow: true, ElCol: true, ElMenu: true,
                  ElMenuItem: true, ElIcon: true, ElForm: true, ElButton: true, ElDivider: true,
                  ElDescriptions: true, ElDescriptionsItem: true, ElDatePicker: true,
                  ElRadioGroup: true, ElRadio: true
                }
              }
            })
            wrapper.vm.litigationForm.caseType = '人格权案件'
            wrapper.vm.handleCaseTypeChange('人格权案件')
            wrapper.vm.litigationForm.targetAmount = targetAmount
            wrapper.vm.calculateLitigationFee()
            const result = wrapper.vm.litigationResult
            
            // Expected base fee (midpoint of 100-500 range)
            const expectedFee = (100 + 500) / 2 // 300
            
            expect(result).toBeDefined()
            expect(result.fee).toBe(expectedFee)
            expect(result.fee).toBeGreaterThanOrEqual(100)
            expect(result.fee).toBeLessThanOrEqual(500)
            expect(result.description).toBeDefined()
            expect(typeof result.description).toBe('string')
            expect(result.description.length).toBeGreaterThan(0)
          }
        ),
        { numRuns: 100 }
      )
    })
  })

  // Feature: litigation-cost-calculator-enhancement, Property 13: Personality rights case tier 2
  // Validates: Requirements 9.5
  describe('Property 13: Personality rights case tier 2', () => {
    it('should calculate personality rights case fee as base fee plus 1% of amount from 50,000-100,000 plus 0.5% of amount exceeding 100,000', () => {
      fc.assert(
        fc.property(
          fc.float({ min: 100001, max: 100000000, noNaN: true, noDefaultInfinity: true }),
          (targetAmount) => {
            const wrapper = mount(CostCalculator, {
              global: {
                components: { ElSelect, ElFormItem, ElInputNumber },
                stubs: {
                  PageHeader: true, ElCard: true, ElRow: true, ElCol: true, ElMenu: true,
                  ElMenuItem: true, ElIcon: true, ElForm: true, ElButton: true, ElDivider: true,
                  ElDescriptions: true, ElDescriptionsItem: true, ElDatePicker: true,
                  ElRadioGroup: true, ElRadio: true
                }
              }
            })
            wrapper.vm.litigationForm.caseType = '人格权案件'
            wrapper.vm.handleCaseTypeChange('人格权案件')
            wrapper.vm.litigationForm.targetAmount = targetAmount
            wrapper.vm.calculateLitigationFee()
            const result = wrapper.vm.litigationResult
            
            // Calculate expected fee
            const baseFee = (100 + 500) / 2 // 300
            const tier1Threshold = 50000
            const tier2Threshold = 100000
            
            // Tier 1: 50,000 to 100,000 at 1%
            const tier1Amount = tier2Threshold - tier1Threshold // 50,000
            const tier1Fee = tier1Amount * 0.01 // 500
            
            // Tier 2: above 100,000 at 0.5%
            const tier2Amount = targetAmount - tier2Threshold
            const tier2Fee = tier2Amount * 0.005 // 0.5%
            
            const expectedFee = Math.round((baseFee + tier1Fee + tier2Fee) * 100) / 100
            
            expect(result).toBeDefined()
            expect(result.fee).toBe(expectedFee)
            expect(result.fee).toBeGreaterThan(baseFee + tier1Fee)
            expect(result.description).toBeDefined()
            expect(typeof result.description).toBe('string')
            expect(result.description.length).toBeGreaterThan(0)
          }
        ),
        { numRuns: 100 }
      )
    })
  })

  // Feature: litigation-cost-calculator-enhancement, Property 14: Results are displayed after calculation
  // Validates: Requirements 1.6, 2.4, 3.5, 4.4, 5.4, 6.4, 7.4, 8.5, 9.6
  describe('Property 14: Results are displayed after calculation', () => {
    it('should display both fee and description for any successful calculation', () => {
      fc.assert(
        fc.property(
          fc.constantFrom(...caseTypes.map(ct => ct.value)),
          fc.float({ min: 0, max: 100000000, noNaN: true, noDefaultInfinity: true }),
          (caseType, targetAmount) => {
            const wrapper = mount(CostCalculator, {
              global: {
                components: { ElSelect, ElFormItem, ElInputNumber },
                stubs: {
                  PageHeader: true, ElCard: true, ElRow: true, ElCol: true, ElMenu: true,
                  ElMenuItem: true, ElIcon: true, ElForm: true, ElButton: true, ElDivider: true,
                  ElDescriptions: true, ElDescriptionsItem: true, ElDatePicker: true,
                  ElRadioGroup: true, ElRadio: true
                }
              }
            })
            
            // Set up the form
            wrapper.vm.litigationForm.caseType = caseType
            wrapper.vm.handleCaseTypeChange(caseType)
            
            const config = caseTypes.find(ct => ct.value === caseType)
            if (config?.requiresAmount) {
              wrapper.vm.litigationForm.targetAmount = targetAmount
            }
            
            // Perform calculation
            wrapper.vm.calculateLitigationFee()
            
            // Verify result is displayed
            const result = wrapper.vm.litigationResult
            expect(result).toBeDefined()
            expect(result).not.toBeNull()
            
            // Verify fee is displayed
            expect(result.fee).toBeDefined()
            expect(typeof result.fee).toBe('number')
            expect(result.fee).toBeGreaterThanOrEqual(0)
            
            // Verify description is displayed
            expect(result.description).toBeDefined()
            expect(typeof result.description).toBe('string')
            expect(result.description.length).toBeGreaterThan(0)
            
            // Verify fee can be formatted with toLocaleString (thousand separators)
            const formattedFee = result.fee.toLocaleString()
            expect(formattedFee).toBeDefined()
            expect(typeof formattedFee).toBe('string')
          }
        ),
        { numRuns: 100 }
      )
    })
  })

  // Feature: litigation-cost-calculator-enhancement, Property 11: Divorce case with property over threshold
  // Validates: Requirements 8.4
  describe('Property 11: Divorce case with property over threshold', () => {
    it('should calculate divorce case fee as base fee plus 0.5% of amount exceeding 200,000 yuan', () => {
      fc.assert(
        fc.property(
          fc.float({ min: 200001, max: 100000000, noNaN: true, noDefaultInfinity: true }),
          (targetAmount) => {
            const wrapper = mount(CostCalculator, {
              global: {
                components: { ElSelect, ElFormItem, ElInputNumber },
                stubs: {
                  PageHeader: true, ElCard: true, ElRow: true, ElCol: true, ElMenu: true,
                  ElMenuItem: true, ElIcon: true, ElForm: true, ElButton: true, ElDivider: true,
                  ElDescriptions: true, ElDescriptionsItem: true, ElDatePicker: true,
                  ElRadioGroup: true, ElRadio: true
                }
              }
            })
            wrapper.vm.litigationForm.caseType = '离婚案件'
            wrapper.vm.handleCaseTypeChange('离婚案件')
            wrapper.vm.litigationForm.targetAmount = targetAmount
            wrapper.vm.calculateLitigationFee()
            const result = wrapper.vm.litigationResult
            
            // Calculate expected fee
            const threshold = 200000
            const baseFee = (50 + 300) / 2 // 175
            const excessAmount = targetAmount - threshold
            const additionalFee = excessAmount * 0.005 // 0.5%
            const expectedFee = Math.round((baseFee + additionalFee) * 100) / 100
            
            expect(result).toBeDefined()
            expect(result.fee).toBe(expectedFee)
            expect(result.fee).toBeGreaterThan(baseFee)
            expect(result.description).toBeDefined()
            expect(typeof result.description).toBe('string')
            expect(result.description.length).toBeGreaterThan(0)
          }
        ),
        { numRuns: 100 }
      )
    })

    it('should return base fee for divorce cases with amount at or below 200,000 yuan', () => {
      fc.assert(
        fc.property(
          fc.float({ min: 0, max: 200000, noNaN: true, noDefaultInfinity: true }),
          (targetAmount) => {
            const wrapper = mount(CostCalculator, {
              global: {
                components: { ElSelect, ElFormItem, ElInputNumber },
                stubs: {
                  PageHeader: true, ElCard: true, ElRow: true, ElCol: true, ElMenu: true,
                  ElMenuItem: true, ElIcon: true, ElForm: true, ElButton: true, ElDivider: true,
                  ElDescriptions: true, ElDescriptionsItem: true, ElDatePicker: true,
                  ElRadioGroup: true, ElRadio: true
                }
              }
            })
            wrapper.vm.litigationForm.caseType = '离婚案件'
            wrapper.vm.handleCaseTypeChange('离婚案件')
            wrapper.vm.litigationForm.targetAmount = targetAmount
            wrapper.vm.calculateLitigationFee()
            const result = wrapper.vm.litigationResult
            
            // Expected base fee (midpoint of 50-300 range)
            const expectedFee = (50 + 300) / 2 // 175
            
            expect(result).toBeDefined()
            expect(result.fee).toBe(expectedFee)
            expect(result.fee).toBeGreaterThanOrEqual(50)
            expect(result.fee).toBeLessThanOrEqual(300)
            expect(result.description).toBeDefined()
            expect(typeof result.description).toBe('string')
            expect(result.description.length).toBeGreaterThan(0)
          }
        ),
        { numRuns: 100 }
      )
    })
  })
})
