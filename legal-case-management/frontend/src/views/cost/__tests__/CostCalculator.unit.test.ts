import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import CostCalculator from '../CostCalculator.vue'
import { ElMessage } from 'element-plus'
import { ElSelect, ElFormItem, ElInputNumber } from 'element-plus'

// Mock ElMessage
vi.mock('element-plus', async () => {
  const actual = await vi.importActual('element-plus')
  return {
    ...actual,
    ElMessage: {
      error: vi.fn(),
      success: vi.fn()
    }
  }
})

describe('CostCalculator - Input Validation Unit Tests', () => {
  beforeEach(() => {
    // Clear all mocks before each test
    vi.clearAllMocks()
  })

  describe('Negative target amount validation', () => {
    it('should reject negative target amount for property cases', () => {
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

      // Set up form with negative amount
      wrapper.vm.litigationForm.caseType = '财产案件'
      wrapper.vm.handleCaseTypeChange('财产案件')
      wrapper.vm.litigationForm.targetAmount = -1000

      // Attempt calculation
      wrapper.vm.calculateLitigationFee()

      // Verify error message was shown
      expect(ElMessage.error).toHaveBeenCalledWith('标的额不能为负数')
      
      // Verify no result was calculated
      expect(wrapper.vm.litigationResult).toBeNull()
    })

    it('should reject negative target amount for IP cases', () => {
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
      wrapper.vm.litigationForm.targetAmount = -5000

      wrapper.vm.calculateLitigationFee()

      expect(ElMessage.error).toHaveBeenCalledWith('标的额不能为负数')
      expect(wrapper.vm.litigationResult).toBeNull()
    })

    it('should reject negative target amount for divorce cases', () => {
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
      wrapper.vm.litigationForm.targetAmount = -100

      wrapper.vm.calculateLitigationFee()

      expect(ElMessage.error).toHaveBeenCalledWith('标的额不能为负数')
      expect(wrapper.vm.litigationResult).toBeNull()
    })

    it('should reject negative target amount for personality rights cases', () => {
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
      wrapper.vm.litigationForm.targetAmount = -200

      wrapper.vm.calculateLitigationFee()

      expect(ElMessage.error).toHaveBeenCalledWith('标的额不能为负数')
      expect(wrapper.vm.litigationResult).toBeNull()
    })

    it('should accept zero as valid target amount', () => {
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
      wrapper.vm.handleCaseTypeChange('财产案件')
      wrapper.vm.litigationForm.targetAmount = 0

      wrapper.vm.calculateLitigationFee()

      // Should not show negative amount error
      expect(ElMessage.error).not.toHaveBeenCalledWith('标的额不能为负数')
      
      // Should calculate successfully
      expect(wrapper.vm.litigationResult).toBeDefined()
      expect(wrapper.vm.litigationResult).not.toBeNull()
    })
  })

  describe('Missing required field validation', () => {
    it('should prevent calculation when case type is not selected', () => {
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

      // Clear case type
      wrapper.vm.litigationForm.caseType = ''

      wrapper.vm.calculateLitigationFee()

      expect(ElMessage.error).toHaveBeenCalledWith('请选择案件类型')
      expect(wrapper.vm.litigationResult).toBeNull()
    })

    it('should prevent calculation when target amount is missing for property cases', () => {
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
      wrapper.vm.handleCaseTypeChange('财产案件')
      wrapper.vm.litigationForm.targetAmount = null as any

      wrapper.vm.calculateLitigationFee()

      expect(ElMessage.error).toHaveBeenCalledWith('请输入标的额')
      expect(wrapper.vm.litigationResult).toBeNull()
    })

    it('should prevent calculation when target amount is undefined for IP cases', () => {
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
      wrapper.vm.litigationForm.targetAmount = undefined as any

      wrapper.vm.calculateLitigationFee()

      expect(ElMessage.error).toHaveBeenCalledWith('请输入标的额')
      expect(wrapper.vm.litigationResult).toBeNull()
    })

    it('should allow calculation for non-property cases without target amount', () => {
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

      wrapper.vm.litigationForm.caseType = '劳动争议案件'
      wrapper.vm.handleCaseTypeChange('劳动争议案件')
      // Target amount should be cleared when switching to non-property case
      expect(wrapper.vm.litigationForm.targetAmount).toBe(0)

      wrapper.vm.calculateLitigationFee()

      // Should not show missing field error
      expect(ElMessage.error).not.toHaveBeenCalledWith('请输入标的额')
      
      // Should calculate successfully
      expect(wrapper.vm.litigationResult).toBeDefined()
      expect(wrapper.vm.litigationResult).not.toBeNull()
      expect(wrapper.vm.litigationResult.fee).toBe(10)
    })
  })

  describe('Error message display', () => {
    it('should display appropriate error message for negative amounts', () => {
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
      wrapper.vm.handleCaseTypeChange('财产案件')
      wrapper.vm.litigationForm.targetAmount = -500

      wrapper.vm.calculateLitigationFee()

      expect(ElMessage.error).toHaveBeenCalledTimes(1)
      expect(ElMessage.error).toHaveBeenCalledWith('标的额不能为负数')
    })

    it('should display appropriate error message for missing case type', () => {
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

      wrapper.vm.litigationForm.caseType = ''

      wrapper.vm.calculateLitigationFee()

      expect(ElMessage.error).toHaveBeenCalledTimes(1)
      expect(ElMessage.error).toHaveBeenCalledWith('请选择案件类型')
    })

    it('should display appropriate error message for missing target amount', () => {
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
      wrapper.vm.litigationForm.targetAmount = null as any

      wrapper.vm.calculateLitigationFee()

      expect(ElMessage.error).toHaveBeenCalledTimes(1)
      expect(ElMessage.error).toHaveBeenCalledWith('请输入标的额')
    })

    it('should display success message when calculation succeeds', () => {
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
      wrapper.vm.handleCaseTypeChange('财产案件')
      wrapper.vm.litigationForm.targetAmount = 50000

      wrapper.vm.calculateLitigationFee()

      expect(ElMessage.success).toHaveBeenCalledTimes(1)
      expect(ElMessage.success).toHaveBeenCalledWith('计算完成')
      expect(wrapper.vm.litigationResult).toBeDefined()
      expect(wrapper.vm.litigationResult).not.toBeNull()
    })
  })

  describe('Validation order', () => {
    it('should check case type before target amount', () => {
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

      // Both case type and target amount are invalid
      wrapper.vm.litigationForm.caseType = ''
      wrapper.vm.litigationForm.targetAmount = -100

      wrapper.vm.calculateLitigationFee()

      // Should show case type error first
      expect(ElMessage.error).toHaveBeenCalledWith('请选择案件类型')
      expect(ElMessage.error).not.toHaveBeenCalledWith('标的额不能为负数')
    })

    it('should check if target amount is provided before checking if it is negative', () => {
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
      wrapper.vm.handleCaseTypeChange('财产案件')
      wrapper.vm.litigationForm.targetAmount = null as any

      wrapper.vm.calculateLitigationFee()

      // Should show missing field error, not negative error
      expect(ElMessage.error).toHaveBeenCalledWith('请输入标的额')
      expect(ElMessage.error).not.toHaveBeenCalledWith('标的额不能为负数')
    })
  })
})
