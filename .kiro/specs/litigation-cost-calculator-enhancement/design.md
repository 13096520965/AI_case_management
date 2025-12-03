# Design Document

## Overview

本设计文档描述了诉讼费计算器案件类型扩展功能的技术实现方案。该功能将在现有诉讼费计算器基础上添加9种案件类型，每种类型都有其特定的费用计算规则。所有计算标准严格遵循《诉讼费用交纳办法》第十三条的规定。

## Architecture

### System Components

```
┌─────────────────────────────────────────────────────────┐
│                    CostCalculator.vue                    │
│  ┌───────────────────────────────────────────────────┐  │
│  │           UI Layer (Template)                     │  │
│  │  - Case Type Selector                             │  │
│  │  - Target Amount Input (conditional)              │  │
│  │  - Calculate Button                               │  │
│  │  - Result Display                                 │  │
│  └───────────────────────────────────────────────────┘  │
│  ┌───────────────────────────────────────────────────┐  │
│  │         Presentation Logic (Script)               │  │
│  │  - Form State Management                          │  │
│  │  - UI Visibility Control                          │  │
│  │  - Event Handlers                                 │  │
│  └───────────────────────────────────────────────────┘  │
│  ┌───────────────────────────────────────────────────┐  │
│  │       Calculation Engine (Functions)              │  │
│  │  - calculatePropertyCase()                        │  │
│  │  - calculateNonPropertyCase()                     │  │
│  │  - calculateIPCase()                              │  │
│  │  - calculateLaborCase()                           │  │
│  │  - calculateAdminCase()                           │  │
│  │  - calculateSpecialAdminCase()                    │  │
│  │  - calculateJurisdictionCase()                    │  │
│  │  - calculateDivorceCase()                         │  │
│  │  - calculatePersonalityRightsCase()               │  │
│  └───────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────┘
```

### Data Flow

```
User Selection → Case Type Change → UI Update (show/hide amount field)
                                  ↓
User Input → Target Amount → Validation
                           ↓
Calculate Button Click → Route to Calculation Function
                       ↓
Calculation Engine → Apply Fee Formula → Return Result
                                       ↓
Result Display ← Format Result ← Calculation Complete
```

## Components and Interfaces

### Case Type Configuration

```typescript
interface CaseTypeConfig {
  value: string           // 案件类型值
  label: string          // 显示标签
  requiresAmount: boolean // 是否需要标的额
  calculationMethod: string // 计算方法名称
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
```

### Calculation Result Interface

```typescript
interface CalculationResult {
  fee: number           // 计算出的诉讼费
  description: string   // 计算说明
  preservationFee?: number  // 保全费（可选）
  calculationProcess?: string[]  // 详细计算过程（可选）
  breakdown?: {         // 可选的费用明细
    baseFee?: number
    additionalFee?: number
    tiers?: Array<{
      range: string
      amount: number
      rate: number
      fee: number
    }>
  }
}
```

### Form State

```typescript
interface LitigationForm {
  caseType: string      // 案件类型
  targetAmount: number  // 标的额
}
```

## Data Models

### Preservation Fee Calculation Tiers (保全费)

保全费按照《诉讼费用交纳办法》第十四条规定计算：

```typescript
interface PreservationFeeTier {
  min: number          // 最小金额（不含）
  max: number | null   // 最大金额（含），null表示无上限
  rate: number         // 费率（百分比）
  baseFee: number      // 基础费用
}

const preservationTiers: PreservationFeeTier[] = [
  { min: 0, max: 1000, rate: 0, baseFee: 30 },
  { min: 1000, max: 100000, rate: 1.0, baseFee: 30 },
  { min: 100000, max: null, rate: 0.5, baseFee: 1020 }
]

const MAX_PRESERVATION_FEE = 5000  // 保全费最高不超过5000元
```

计算规则：
- 财产数额不超过1000元或者不涉及财产数额的，每件交纳30元
- 超过1000元至10万元的部分，按照1%交纳
- 超过10万元的部分，按照0.5%交纳
- 保全费最高不超过5000元

### Fee Calculation Tiers (财产案件)

```typescript
interface FeeTier {
  min: number          // 最小金额（不含）
  max: number | null   // 最大金额（含），null表示无上限
  rate: number         // 费率（百分比）
  baseFee: number      // 基础费用
}

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
```

### Fixed Fee Cases

```typescript
interface FixedFeeConfig {
  caseType: string
  minFee: number
  maxFee: number
}

const fixedFeeCases: FixedFeeConfig[] = [
  { caseType: '其他非财产案件', minFee: 50, maxFee: 100 },
  { caseType: '劳动争议案件', minFee: 10, maxFee: 10 },
  { caseType: '商标、专利、海事行政案件', minFee: 100, maxFee: 100 },
  { caseType: '其他行政案件', minFee: 50, maxFee: 50 },
  { caseType: '管辖权异议不成立案件', minFee: 50, maxFee: 100 }
]
```

### Special Calculation Cases

```typescript
// 离婚案件
interface DivorceConfig {
  baseFeeMin: number    // 50
  baseFeeMax: number    // 300
  threshold: number     // 200000
  rate: number          // 0.5%
}

// 人格权案件
interface PersonalityRightsConfig {
  baseFeeMin: number    // 100
  baseFeeMax: number    // 500
  tier1Threshold: number // 50000
  tier1Rate: number      // 1%
  tier2Threshold: number // 100000
  tier2Rate: number      // 0.5%
}

// 知识产权民事案件
interface IPConfig {
  noAmountFeeMin: number  // 500
  noAmountFeeMax: number  // 1000
  usePropertyTiers: boolean // true when amount > 0
}
```

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property Reflection

After reviewing all testable properties from the prework, I've identified the following redundancies:

1. **UI Display Properties (1.6, 2.4, 3.5, etc.)**: All "display results" criteria are identical and can be consolidated into one property
2. **Field Visibility Properties**: Properties 1.2, 2.2, 3.2, 4.2, 5.2, 6.2, 7.2, 8.2, 9.2 can be consolidated into properties 10.1 and 10.2 which cover all case types
3. **Dropdown Option Tests**: Properties 1.1, 2.1, 3.1, 4.1, 5.1, 6.1, 7.1, 8.1, 9.1 can be consolidated into a single property that all required options exist

After consolidation, here are the unique properties:

### Property 1: All case types are available
*For any* required case type from the specification, the case type dropdown SHALL contain that option
**Validates: Requirements 1.1, 2.1, 3.1, 4.1, 5.1, 6.1, 7.1, 8.1, 9.1**

### Property 2: Field visibility matches case type requirements
*For any* case type selection, the target amount field SHALL be visible if and only if the case type requires a target amount
**Validates: Requirements 1.2, 2.2, 3.2, 4.2, 5.2, 6.2, 7.2, 8.2, 9.2, 10.1, 10.2**

### Property 3: Property case tiered calculation
*For any* target amount in a property case, the calculated fee SHALL equal the sum of fees from all applicable tiers using the 10-tier formula
**Validates: Requirements 1.3, 1.5**

### Property 4: Non-property case fixed fee range
*For any* "其他非财产案件" calculation, the fee SHALL be between 50 and 100 yuan inclusive
**Validates: Requirements 2.3**

### Property 5: IP case with no amount
*For any* "知识产权民事案件" with zero or no target amount, the fee SHALL be between 500 and 1000 yuan inclusive
**Validates: Requirements 3.3**

### Property 6: IP case with amount uses property formula
*For any* "知识产权民事案件" with target amount greater than zero, the calculated fee SHALL equal the property case calculation for that amount
**Validates: Requirements 3.4**

### Property 7: Labor case fixed fee
*For any* "劳动争议案件" calculation, the fee SHALL equal 10 yuan
**Validates: Requirements 4.3**

### Property 8: Special admin case fixed fee
*For any* "商标、专利、海事行政案件" calculation, the fee SHALL equal 100 yuan
**Validates: Requirements 5.3**

### Property 9: Other admin case fixed fee
*For any* "其他行政案件" calculation, the fee SHALL equal 50 yuan
**Validates: Requirements 6.3**

### Property 10: Jurisdiction case fixed fee range
*For any* "管辖权异议不成立案件" calculation, the fee SHALL be between 50 and 100 yuan inclusive
**Validates: Requirements 7.3**

### Property 11: Divorce case with property over threshold
*For any* "离婚案件" with target amount exceeding 200,000 yuan, the calculated fee SHALL equal base fee plus 0.5% of the amount exceeding 200,000
**Validates: Requirements 8.4**

### Property 12: Personality rights case tier 1
*For any* "人格权案件" with target amount between 50,000 and 100,000 yuan, the calculated fee SHALL equal base fee plus 1% of the amount exceeding 50,000
**Validates: Requirements 9.4**

### Property 13: Personality rights case tier 2
*For any* "人格权案件" with target amount exceeding 100,000 yuan, the calculated fee SHALL equal base fee plus 1% of amount from 50,000-100,000 plus 0.5% of amount exceeding 100,000
**Validates: Requirements 9.5**

### Property 14: Results are displayed after calculation
*For any* successful calculation, the system SHALL display both the calculated fee and a description
**Validates: Requirements 1.6, 2.4, 3.5, 4.4, 5.4, 6.4, 7.4, 8.5, 9.6**

### Property 15: UI updates immediately on case type change
*For any* case type change, the UI SHALL update field visibility without requiring additional user action
**Validates: Requirements 10.3**

### Property 16: Field data is cleared when hidden
*For any* case type change that hides the target amount field, the target amount value SHALL be reset to zero
**Validates: Requirements 10.4**

### Property 17: Preservation fee calculation for property cases
*For any* case with target amount greater than zero, the preservation fee SHALL be calculated according to the three-tier preservation fee formula and SHALL not exceed 5000 yuan
**Validates: Requirements 11.1, 11.2, 11.3**

### Property 18: Calculation process is displayed
*For any* successful calculation, the system SHALL display a detailed calculation process including all steps and formulas used
**Validates: Requirements 11.3, 11.4**

### Property 19: Preservation fee visibility
*For any* case type that does not require target amount or has target amount equal to zero, the preservation fee field SHALL not be displayed
**Validates: Requirements 11.5, 11.6**

## Error Handling

### Input Validation

1. **Negative Amount Validation**: Target amount must be non-negative
   - Error message: "标的额不能为负数"
   - Action: Prevent calculation, highlight field

2. **Missing Required Amount**: For case types requiring amount, validate before calculation
   - Error message: "请输入标的额"
   - Action: Prevent calculation, highlight field

3. **Invalid Case Type**: Ensure selected case type is valid
   - Error message: "请选择案件类型"
   - Action: Prevent calculation, highlight field

### Calculation Errors

1. **Overflow Protection**: Handle extremely large amounts
   - Maximum supported amount: 999,999,999,999 (1 trillion - 1)
   - Error message: "标的额超出计算范围"

2. **Precision Handling**: Round results to 2 decimal places
   - Use banker's rounding for fairness

### UI Error States

1. **Network Errors**: If backend API fails (future consideration)
   - Show error notification
   - Allow retry

2. **Invalid State Recovery**: If form enters invalid state
   - Reset to default state
   - Clear all inputs

## Testing Strategy

### Unit Testing

We will use Vitest as the testing framework for this Vue 3 application.

**Test Coverage Areas:**
1. **Calculation Functions**: Test each calculation function with specific examples
   - Example: `calculatePropertyCase(50000)` should return correct fee
   - Example: `calculateLaborCase()` should return 10
   - Edge cases: zero amounts, boundary values (exactly 10000, 200000, etc.)

2. **UI Behavior**: Test component rendering and interactions
   - Example: Selecting "财产案件" shows amount field
   - Example: Selecting "劳动争议案件" hides amount field
   - Example: Calculate button triggers calculation

3. **Form Validation**: Test input validation logic
   - Example: Negative amounts are rejected
   - Example: Missing required fields prevent calculation

### Property-Based Testing

We will use fast-check as the property-based testing library for JavaScript/TypeScript.

**Configuration:**
- Each property test will run a minimum of 100 iterations
- Each test will be tagged with a comment referencing the design document property

**Property Test Requirements:**
- Each correctness property MUST be implemented by a SINGLE property-based test
- Tests MUST be tagged using format: `// Feature: litigation-cost-calculator-enhancement, Property {number}: {property_text}`
- Tests MUST reference the property number from this design document

**Property Test Coverage:**
1. **Property 1-2**: UI state properties (may use component testing)
2. **Property 3**: Generate random amounts, verify tiered calculation
3. **Property 4, 7-10**: Generate random inputs, verify fixed fees or ranges
4. **Property 6**: Generate random amounts, verify IP = Property calculation
5. **Property 11-13**: Generate random amounts in ranges, verify special calculations
6. **Property 14-16**: UI behavior properties (component testing)
7. **Property 17**: Generate random amounts, verify preservation fee tiered calculation
8. **Property 18**: Verify calculation process is present and contains expected steps
9. **Property 19**: Verify preservation fee visibility based on case type and amount

### Integration Testing

1. **End-to-End User Flows**:
   - Select each case type and perform calculation
   - Verify results match expected values
   - Test case type switching behavior

2. **Cross-Browser Testing**:
   - Test in Chrome, Firefox, Safari, Edge
   - Verify UI renders correctly
   - Verify calculations are consistent

## Implementation Notes

### Calculation Precision

All monetary calculations will use JavaScript's native number type with proper rounding:
- Intermediate calculations maintain full precision
- Final results rounded to 2 decimal places using `Math.round(value * 100) / 100`
- Display formatted with thousand separators using `toLocaleString()`

### Performance Considerations

- Calculations are synchronous and fast (< 1ms)
- No need for debouncing or throttling
- Form state updates are reactive (Vue 3 reactivity system)

### Accessibility

- All form fields have proper labels
- Error messages are announced to screen readers
- Keyboard navigation fully supported
- Color contrast meets WCAG AA standards

### Internationalization

Currently Chinese only, but structure supports future i18n:
- Case type labels can be externalized
- Error messages can be externalized
- Number formatting respects locale

### Browser Compatibility

- Target: Modern browsers (Chrome 90+, Firefox 88+, Safari 14+, Edge 90+)
- Uses ES6+ features (const, arrow functions, template literals)
- Vue 3 composition API
- Element Plus UI components
