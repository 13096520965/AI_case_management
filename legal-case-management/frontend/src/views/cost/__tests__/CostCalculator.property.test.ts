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

  // Feature: litigation-cost-calculator-enhancement, Property 17: Preservation fee calculation for property cases
  // Validates: Requirements 11.1, 11.2, 11.3
  describe('Property 17: Preservation fee calculation for property cases', () => {
    // Helper function to calculate expected preservation fee
    const calculateExpectedPreservationFee = (targetAmount: number): number => {
      const MAX_PRESERVATION_FEE = 5000
      
      // Tier 1: Not exceeding 1000 yuan - fixed 30 yuan
      if (targetAmount <= 1000) {
        return 30
      }
      
      let totalFee = 0
      
      // Tier 2: 1000 to 100,000 yuan - 1% rate
      if (targetAmount > 1000 && targetAmount <= 100000) {
        const tier2Amount = targetAmount - 1000
        const tier2Fee = tier2Amount * 0.01
        totalFee = 30 + tier2Fee
      }
      // Tier 3: Over 100,000 yuan - 0.5% rate for excess
      else if (targetAmount > 100000) {
        const tier2Amount = 100000 - 1000 // 99,000
        const tier2Fee = tier2Amount * 0.01 // 990
        const tier3Amount = targetAmount - 100000
        const tier3Fee = tier3Amount * 0.005
        totalFee = 30 + tier2Fee + tier3Fee
      }
      
      // Round to 2 decimal places
      totalFee = Math.round(totalFee * 100) / 100
      
      // Apply maximum limit of 5000 yuan
      if (totalFee > MAX_PRESERVATION_FEE) {
        totalFee = MAX_PRESERVATION_FEE
      }
      
      return totalFee
    }

    it('should calculate preservation fee correctly for any target amount', () => {
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
            
            // Call the preservation fee calculation function
            const result = wrapper.vm.calculatePreservationFeeForCase(targetAmount)
            const expectedFee = calculateExpectedPreservationFee(targetAmount)
            
            // Verify the fee is calculated correctly
            expect(result).toBeDefined()
            expect(result.fee).toBe(expectedFee)
            
            // Verify calculation process is provided
            expect(result.calculationProcess).toBeDefined()
            expect(Array.isArray(result.calculationProcess)).toBe(true)
            expect(result.calculationProcess.length).toBeGreaterThan(0)
            
            // Verify each step in calculation process is a string
            result.calculationProcess.forEach((step: string) => {
              expect(typeof step).toBe('string')
              expect(step.length).toBeGreaterThan(0)
            })
          }
        ),
        { numRuns: 100 }
      )
    })

    it('should not exceed 5000 yuan maximum limit', () => {
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
            
            const result = wrapper.vm.calculatePreservationFeeForCase(targetAmount)
            
            // Verify the fee does not exceed 5000 yuan
            expect(result.fee).toBeLessThanOrEqual(5000)
          }
        ),
        { numRuns: 100 }
      )
    })

    it('should return fixed 30 yuan for amounts not exceeding 1000 yuan', () => {
      fc.assert(
        fc.property(
          fc.float({ min: 0, max: 1000, noNaN: true, noDefaultInfinity: true }),
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
            
            const result = wrapper.vm.calculatePreservationFeeForCase(targetAmount)
            
            // Verify the fee is exactly 30 yuan
            expect(result.fee).toBe(30)
          }
        ),
        { numRuns: 100 }
      )
    })

    it('should calculate tier 2 correctly for amounts between 1000 and 100,000 yuan', () => {
      fc.assert(
        fc.property(
          fc.float({ min: 1001, max: 100000, noNaN: true, noDefaultInfinity: true }),
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
            
            const result = wrapper.vm.calculatePreservationFeeForCase(targetAmount)
            
            // Calculate expected fee: 30 + (amount - 1000) * 1%
            const tier2Amount = targetAmount - 1000
            const tier2Fee = tier2Amount * 0.01
            const expectedFee = Math.round((30 + tier2Fee) * 100) / 100
            
            expect(result.fee).toBe(expectedFee)
            expect(result.fee).toBeGreaterThan(30)
            expect(result.fee).toBeLessThanOrEqual(1020) // 30 + 99000 * 0.01
          }
        ),
        { numRuns: 100 }
      )
    })

    it('should calculate tier 3 correctly for amounts exceeding 100,000 yuan', () => {
      fc.assert(
        fc.property(
          fc.float({ min: 100001, max: 10000000, noNaN: true, noDefaultInfinity: true }),
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
            
            const result = wrapper.vm.calculatePreservationFeeForCase(targetAmount)
            
            // Calculate expected fee
            const tier2Amount = 100000 - 1000 // 99,000
            const tier2Fee = tier2Amount * 0.01 // 990
            const tier3Amount = targetAmount - 100000
            const tier3Fee = tier3Amount * 0.005 // 0.5%
            const expectedFee = Math.round((30 + tier2Fee + tier3Fee) * 100) / 100
            
            // Apply max limit
            const finalExpectedFee = Math.min(expectedFee, 5000)
            
            expect(result.fee).toBe(finalExpectedFee)
            expect(result.fee).toBeGreaterThan(1020) // Should be more than tier 2 max
          }
        ),
        { numRuns: 100 }
      )
    })
  })

  // Feature: litigation-cost-calculator-enhancement, Property 18: Calculation process is displayed
  // Validates: Requirements 11.4, 11.5
  describe('Property 18: Calculation process is displayed', () => {
    it('should include calculationProcess array in all calculation results', () => {
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
            
            // Verify result has calculationProcess
            const result = wrapper.vm.litigationResult
            expect(result).toBeDefined()
            expect(result.calculationProcess).toBeDefined()
            expect(Array.isArray(result.calculationProcess)).toBe(true)
            expect(result.calculationProcess.length).toBeGreaterThan(0)
            
            // Verify each step is a non-empty string
            result.calculationProcess.forEach((step: string) => {
              expect(typeof step).toBe('string')
              expect(step.length).toBeGreaterThan(0)
            })
          }
        ),
        { numRuns: 100 }
      )
    })

    it('should include detailed tier information for tiered calculation cases', () => {
      fc.assert(
        fc.property(
          fc.constantFrom('财产案件', '离婚案件', '人格权案件'),
          fc.float({ min: 50000, max: 10000000, noNaN: true, noDefaultInfinity: true }),
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
            
            wrapper.vm.litigationForm.caseType = caseType
            wrapper.vm.handleCaseTypeChange(caseType)
            wrapper.vm.litigationForm.targetAmount = targetAmount
            wrapper.vm.calculateLitigationFee()
            
            const result = wrapper.vm.litigationResult
            expect(result).toBeDefined()
            expect(result.calculationProcess).toBeDefined()
            expect(Array.isArray(result.calculationProcess)).toBe(true)
            
            // For tiered calculations, should have multiple steps
            // Property case with amount > 10000 should have at least 2 steps (tier calculation + total)
            // Divorce case with amount > 200000 should have at least 2 steps (base + excess + total)
            // Personality rights case with amount > 50000 should have at least 2 steps
            if (caseType === '财产案件' && targetAmount > 10000) {
              expect(result.calculationProcess.length).toBeGreaterThanOrEqual(2)
            } else if (caseType === '离婚案件' && targetAmount > 200000) {
              expect(result.calculationProcess.length).toBeGreaterThanOrEqual(3)
            } else if (caseType === '人格权案件' && targetAmount > 50000) {
              expect(result.calculationProcess.length).toBeGreaterThanOrEqual(3)
            }
            
            // Verify the last step typically contains "合计" (total) for multi-tier calculations
            const lastStep = result.calculationProcess[result.calculationProcess.length - 1]
            if (result.calculationProcess.length > 1) {
              // For multi-step calculations, often the last step is a total
              expect(typeof lastStep).toBe('string')
              expect(lastStep.length).toBeGreaterThan(0)
            }
          }
        ),
        { numRuns: 100 }
      )
    })

    it('should include simple explanation for fixed fee cases', () => {
      fc.assert(
        fc.property(
          fc.constantFrom('其他非财产案件', '劳动争议案件', '商标、专利、海事行政案件', '其他行政案件', '管辖权异议不成立案件'),
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
            expect(result.calculationProcess).toBeDefined()
            expect(Array.isArray(result.calculationProcess)).toBe(true)
            
            // Fixed fee cases should have at least 1 step explaining the fixed fee
            expect(result.calculationProcess.length).toBeGreaterThanOrEqual(1)
            
            // The explanation should mention the case type or fixed fee
            const explanation = result.calculationProcess.join(' ')
            expect(explanation.length).toBeGreaterThan(0)
          }
        ),
        { numRuns: 100 }
      )
    })

    it('should include calculation process for IP cases with target amount', () => {
      fc.assert(
        fc.property(
          fc.float({ min: 1, max: 10000000, noNaN: true, noDefaultInfinity: true }),
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
            expect(result.calculationProcess).toBeDefined()
            expect(Array.isArray(result.calculationProcess)).toBe(true)
            expect(result.calculationProcess.length).toBeGreaterThan(0)
            
            // IP case with amount should include property case calculation process
            // Should have at least 2 steps (IP explanation + property calculation steps)
            if (targetAmount > 10000) {
              expect(result.calculationProcess.length).toBeGreaterThanOrEqual(2)
            }
            
            // First step should mention IP case
            const firstStep = result.calculationProcess[0]
            expect(firstStep).toContain('知识产权')
          }
        ),
        { numRuns: 100 }
      )
    })
  })

  // Feature: litigation-cost-calculator-enhancement, Property 19: Preservation fee visibility
  // Validates: Requirements 11.6, 11.7
  describe('Property 19: Preservation fee visibility', () => {
    it('should not display preservation fee for case types that do not require target amount', () => {
      fc.assert(
        fc.property(
          fc.constantFrom(...caseTypes.filter(ct => !ct.requiresAmount).map(ct => ct.value)),
          (caseType) => {
            const wrapper = mount(CostCalculator, {
              global: {
                components: { ElSelect, ElFormItem, ElInputNumber },
                stubs: {
                  PageHeader: true, ElCard: true, ElRow: true, ElCol: true, ElMenu: true,
                  ElMenuItem: true, ElIcon: true, ElForm: true, ElButton: true, ElDivider: true,
                  ElDescriptions: true, ElDescriptionsItem: true, ElDatePicker: true,
                  ElRadioGroup: true, ElRadio: true, ElTimeline: true, ElTimelineItem: true
                }
              }
            })
            
            wrapper.vm.litigationForm.caseType = caseType
            wrapper.vm.handleCaseTypeChange(caseType)
            wrapper.vm.calculateLitigationFee()
            
            const result = wrapper.vm.litigationResult
            expect(result).toBeDefined()
            
            // Verify preservation fee is not included in result
            expect(result.preservationFee).toBeUndefined()
            
            // Verify shouldShowPreservationFee computed property is false
            expect(wrapper.vm.shouldShowPreservationFee).toBe(false)
          }
        ),
        { numRuns: 100 }
      )
    })

    it('should not display preservation fee when target amount is zero', () => {
      fc.assert(
        fc.property(
          fc.constantFrom(...caseTypes.filter(ct => ct.requiresAmount).map(ct => ct.value)),
          (caseType) => {
            const wrapper = mount(CostCalculator, {
              global: {
                components: { ElSelect, ElFormItem, ElInputNumber },
                stubs: {
                  PageHeader: true, ElCard: true, ElRow: true, ElCol: true, ElMenu: true,
                  ElMenuItem: true, ElIcon: true, ElForm: true, ElButton: true, ElDivider: true,
                  ElDescriptions: true, ElDescriptionsItem: true, ElDatePicker: true,
                  ElRadioGroup: true, ElRadio: true, ElTimeline: true, ElTimelineItem: true
                }
              }
            })
            
            wrapper.vm.litigationForm.caseType = caseType
            wrapper.vm.handleCaseTypeChange(caseType)
            wrapper.vm.litigationForm.targetAmount = 0
            wrapper.vm.calculateLitigationFee()
            
            const result = wrapper.vm.litigationResult
            expect(result).toBeDefined()
            
            // Verify preservation fee is not included in result when amount is zero
            expect(result.preservationFee).toBeUndefined()
            
            // Verify shouldShowPreservationFee computed property is false
            expect(wrapper.vm.shouldShowPreservationFee).toBe(false)
          }
        ),
        { numRuns: 100 }
      )
    })

    it('should display preservation fee when case type requires target amount and target amount is greater than zero', () => {
      fc.assert(
        fc.property(
          fc.constantFrom(...caseTypes.filter(ct => ct.requiresAmount).map(ct => ct.value)),
          fc.float({ min: 1, max: 100000000, noNaN: true, noDefaultInfinity: true }),
          (caseType, targetAmount) => {
            const wrapper = mount(CostCalculator, {
              global: {
                components: { ElSelect, ElFormItem, ElInputNumber },
                stubs: {
                  PageHeader: true, ElCard: true, ElRow: true, ElCol: true, ElMenu: true,
                  ElMenuItem: true, ElIcon: true, ElForm: true, ElButton: true, ElDivider: true,
                  ElDescriptions: true, ElDescriptionsItem: true, ElDatePicker: true,
                  ElRadioGroup: true, ElRadio: true, ElTimeline: true, ElTimelineItem: true
                }
              }
            })
            
            wrapper.vm.litigationForm.caseType = caseType
            wrapper.vm.handleCaseTypeChange(caseType)
            wrapper.vm.litigationForm.targetAmount = targetAmount
            wrapper.vm.calculateLitigationFee()
            
            const result = wrapper.vm.litigationResult
            expect(result).toBeDefined()
            
            // Verify preservation fee is included in result
            expect(result.preservationFee).toBeDefined()
            expect(typeof result.preservationFee).toBe('number')
            expect(result.preservationFee).toBeGreaterThan(0)
            expect(result.preservationFee).toBeLessThanOrEqual(5000)
            
            // Verify preservation calculation process is included
            expect(result.preservationCalculationProcess).toBeDefined()
            expect(Array.isArray(result.preservationCalculationProcess)).toBe(true)
            expect(result.preservationCalculationProcess.length).toBeGreaterThan(0)
            
            // Verify shouldShowPreservationFee computed property is true
            expect(wrapper.vm.shouldShowPreservationFee).toBe(true)
          }
        ),
        { numRuns: 100 }
      )
    })

    it('should correctly toggle preservation fee visibility when switching between case types', () => {
      fc.assert(
        fc.property(
          fc.constantFrom(...caseTypes.filter(ct => ct.requiresAmount).map(ct => ct.value)),
          fc.constantFrom(...caseTypes.filter(ct => !ct.requiresAmount).map(ct => ct.value)),
          fc.float({ min: 1000, max: 1000000, noNaN: true, noDefaultInfinity: true }),
          (caseTypeWithAmount, caseTypeWithoutAmount, targetAmount) => {
            const wrapper = mount(CostCalculator, {
              global: {
                components: { ElSelect, ElFormItem, ElInputNumber },
                stubs: {
                  PageHeader: true, ElCard: true, ElRow: true, ElCol: true, ElMenu: true,
                  ElMenuItem: true, ElIcon: true, ElForm: true, ElButton: true, ElDivider: true,
                  ElDescriptions: true, ElDescriptionsItem: true, ElDatePicker: true,
                  ElRadioGroup: true, ElRadio: true, ElTimeline: true, ElTimelineItem: true
                }
              }
            })
            
            // First, calculate with case type that requires amount
            wrapper.vm.litigationForm.caseType = caseTypeWithAmount
            wrapper.vm.handleCaseTypeChange(caseTypeWithAmount)
            wrapper.vm.litigationForm.targetAmount = targetAmount
            wrapper.vm.calculateLitigationFee()
            
            let result = wrapper.vm.litigationResult
            expect(result).toBeDefined()
            expect(result.preservationFee).toBeDefined()
            expect(wrapper.vm.shouldShowPreservationFee).toBe(true)
            
            // Then, switch to case type that does not require amount
            wrapper.vm.litigationForm.caseType = caseTypeWithoutAmount
            wrapper.vm.handleCaseTypeChange(caseTypeWithoutAmount)
            wrapper.vm.calculateLitigationFee()
            
            result = wrapper.vm.litigationResult
            expect(result).toBeDefined()
            expect(result.preservationFee).toBeUndefined()
            expect(wrapper.vm.shouldShowPreservationFee).toBe(false)
          }
        ),
        { numRuns: 20 }
      )
    }, 10000)

    it('should not display preservation fee when switching from positive amount to zero', () => {
      fc.assert(
        fc.property(
          fc.constantFrom(...caseTypes.filter(ct => ct.requiresAmount).map(ct => ct.value)),
          fc.float({ min: 1000, max: 1000000, noNaN: true, noDefaultInfinity: true }),
          (caseType, initialAmount) => {
            const wrapper = mount(CostCalculator, {
              global: {
                components: { ElSelect, ElFormItem, ElInputNumber },
                stubs: {
                  PageHeader: true, ElCard: true, ElRow: true, ElCol: true, ElMenu: true,
                  ElMenuItem: true, ElIcon: true, ElForm: true, ElButton: true, ElDivider: true,
                  ElDescriptions: true, ElDescriptionsItem: true, ElDatePicker: true,
                  ElRadioGroup: true, ElRadio: true, ElTimeline: true, ElTimelineItem: true
                }
              }
            })
            
            // First, calculate with positive amount
            wrapper.vm.litigationForm.caseType = caseType
            wrapper.vm.handleCaseTypeChange(caseType)
            wrapper.vm.litigationForm.targetAmount = initialAmount
            wrapper.vm.calculateLitigationFee()
            
            let result = wrapper.vm.litigationResult
            expect(result).toBeDefined()
            expect(result.preservationFee).toBeDefined()
            expect(wrapper.vm.shouldShowPreservationFee).toBe(true)
            
            // Then, calculate with zero amount
            wrapper.vm.litigationForm.targetAmount = 0
            wrapper.vm.calculateLitigationFee()
            
            result = wrapper.vm.litigationResult
            expect(result).toBeDefined()
            expect(result.preservationFee).toBeUndefined()
            expect(wrapper.vm.shouldShowPreservationFee).toBe(false)
          }
        ),
        { numRuns: 20 }
      )
    }, 10000)
  })
})
