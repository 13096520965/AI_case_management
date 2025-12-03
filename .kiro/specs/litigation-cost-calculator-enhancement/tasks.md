# Implementation Plan

- [x] 1. 更新案件类型选项列表




  - 在CostCalculator.vue的诉讼费计算器部分添加所有9种案件类型选项
  - 更新el-select组件的el-option列表
  - 确保每个选项的label和value正确对应
  - _Requirements: 1.1, 2.1, 3.1, 4.1, 5.1, 6.1, 7.1, 8.1, 9.1_

- [x] 2. 实现标的额字段的条件显示逻辑





  - 创建案件类型配置对象，定义哪些案件类型需要标的额输入
  - 实现handleCaseTypeChange方法，根据案件类型显示或隐藏标的额字段
  - 当字段隐藏时清除标的额数值
  - _Requirements: 1.2, 2.2, 3.2, 4.2, 5.2, 6.2, 7.2, 8.2, 9.2, 10.1, 10.2, 10.3, 10.4_

- [x] 2.1 编写属性测试：字段可见性匹配案件类型

  - **Property 2: Field visibility matches case type requirements**
  - **Validates: Requirements 1.2, 2.2, 3.2, 4.2, 5.2, 6.2, 7.2, 8.2, 9.2, 10.1, 10.2**

- [x] 2.2 编写属性测试：UI立即更新

  - **Property 15: UI updates immediately on case type change**
  - **Validates: Requirements 10.3**

- [x] 2.3 编写属性测试：字段数据清除

  - **Property 16: Field data is cleared when hidden**
  - **Validates: Requirements 10.4**

- [x] 3. 实现财产案件计算函数





  - 创建或更新calculatePropertyCase函数
  - 实现10级分段累计计算逻辑
  - 处理不超过1万元的固定50元费用
  - 处理超过1万元的分段比例计算
  - _Requirements: 1.3, 1.4, 1.5_

- [x] 3.1 编写属性测试：财产案件分段计算


  - **Property 3: Property case tiered calculation**
  - **Validates: Requirements 1.3, 1.5**

- [x] 4. 实现其他非财产案件计算函数










  - 创建或更新calculateNonPropertyCase函数
  - 返回50-100元范围内的固定费用
  - _Requirements: 2.3_
 

- [x] 4.1 编写属性测试：非财产案件固定费用范围




  - **Property 4: Non-property case fixed fee range**
  - **Validates: Requirements 2.3**

- [x] 5. 实现知识产权民事案件计算函数




  - 创建或更新calculateIPCase函数
  - 当标的额为零或未输入时，返回500-1000元固定费用
  - 当标的额大于零时，调用财产案件计算函数
  - _Requirements: 3.3, 3.4_

- [x] 5.1 编写属性测试：知识产权案件无标的额












  - **Property 5: IP case with no amount**
  - **Validates: Requirements 3.3**

- [x] 5.2 编写属性测试：知识产权案件有标的额使用财产公式

  - **Property 6: IP case with amount uses property formula**
  - **Validates: Requirements 3.4**
-

- [x] 6. 实现劳动争议案件计算函数




  - 创建或更新calculateLaborCase函数
  - 返回固定10元费用
  - _Requirements: 4.3_

- [x] 6.1 编写属性测试：劳动争议案件固定费用

















  - **Property 7: Labor case fixed fee**
  - **Validates: Requirements 4.3**
-


- [x] 7. 实现行政案件计算函数



  - 创建或更新calculateSpecialAdminCase函数（商标、专利、海事行政案件，100元）
  - 创建或更新calculateAdminCase函数（其他行政案件，50元）
  - _Requirements: 5.3, 6.3_

- [x] 7.1 编写属性测试：特殊行政案件固定费用


  - **Property 8: Special admin case fixed fee**
  - **Validates: Requirements 5.3**

- [x] 7.2 编写属性测试：其他行政案件固定费用

  - **Property 9: Other admin case fixed fee**
  - **Validates: Requirements 6.3**

- [x] 8. 实现管辖权异议不成立案件计算函数





  - 创建或更新calculateJurisdictionCase函数
  - 返回50-100元范围内的固定费用
  - _Requirements: 7.3_

- [x] 8.1 编写属性测试：管辖权异议案件固定费用范围


  - **Property 10: Jurisdiction case fixed fee range**
  - **Validates: Requirements 7.3**

- [x] 9. 实现离婚案件计算函数




  - 创建calculateDivorceCase函数
  - 标的额为零或不超过20万元时，返回50-300元固定费用
  - 标的额超过20万元时，在固定费用基础上对超过部分按0.5%加收
  - _Requirements: 8.3, 8.4_

- [x] 9.1 编写属性测试：离婚案件财产超过阈值


  - **Property 11: Divorce case with property over threshold**
  - **Validates: Requirements 8.4**

- [x] 10. 实现人格权案件计算函数





  - 创建calculatePersonalityRightsCase函数
  - 标的额为零或不超过5万元时，返回100-500元固定费用
  - 标的额超过5万元至10万元时，在固定费用基础上对超过5万元部分按1%加收
  - 标的额超过10万元时，在固定费用基础上对超过10万元部分按0.5%加收
  - _Requirements: 9.3, 9.4, 9.5_

- [x] 10.1 编写属性测试：人格权案件第一档


  - **Property 12: Personality rights case tier 1**
  - **Validates: Requirements 9.4**

- [x] 10.2 编写属性测试：人格权案件第二档


  - **Property 13: Personality rights case tier 2**
  - **Validates: Requirements 9.5**

- [x] 11. 更新计算路由逻辑




  - 在calculateLitigationFee或主计算函数中添加switch/case分支
  - 根据案件类型路由到对应的计算函数
  - 确保所有9种案件类型都有对应的处理逻辑
  - _Requirements: 1.3, 2.3, 3.3, 3.4, 4.3, 5.3, 6.3, 7.3, 8.3, 8.4, 9.3, 9.4, 9.5_

- [x] 12. 实现结果显示逻辑









  - 确保计算完成后显示费用金额
  - 显示计算说明文字
  - 格式化金额显示（千分位分隔符）
  - _Requirements: 1.6, 2.4, 3.5, 4.4, 5.4, 6.4, 7.4, 8.5, 9.6_

- [x] 12.1 编写属性测试：结果显示




  - **Property 14: Results are displayed after calculation**
  - **Validates: Requirements 1.6, 2.4, 3.5, 4.4, 5.4, 6.4, 7.4, 8.5, 9.6**

- [x] 13. 添加输入验证




  - 验证标的额不能为负数
  - 验证必填字段
  - 显示适当的错误消息
  - _Requirements: All requirements (error handling)_

- [x] 13.1 编写单元测试：输入验证


  - 测试负数标的额被拒绝
  - 测试缺少必填字段时阻止计算
  - 测试错误消息正确显示

- [x] 14. Checkpoint - 确保所有测试通过




  - 确保所有测试通过，如有问题请询问用户

- [x] 15. 编写集成测试



  - 测试每种案件类型的完整计算流程
  - 测试案件类型切换行为
  - 测试边界值和特殊情况

- [x] 16. 编写属性测试：所有案件类型可用




  - **Property 1: All case types are available**
  - **Validates: Requirements 1.1, 2.1, 3.1, 4.1, 5.1, 6.1, 7.1, 8.1, 9.1**

- [x] 17. 实现保全费计算函数




  - 在CostCalculator.vue中创建calculatePreservationFeeForCase函数
  - 实现三档分段累计计算逻辑：不超过1000元固定30元，1000元至10万元按1%，超过10万元按0.5%
  - 应用5000元的最高限额
  - 返回包含fee和calculationProcess的对象
  - _Requirements: 11.1, 11.2, 11.3_

- [x] 17.1 编写属性测试：保全费计算


  - **Property 17: Preservation fee calculation for property cases**
  - **Validates: Requirements 11.1, 11.2, 11.3**
  - 测试任意标的额的保全费计算是否正确
  - 测试保全费不超过5000元的限制

- [x] 18. 更新计算函数以生成详细计算过程





  - 修改calculatePropertyCase函数，返回calculationProcess数组，列出每个分段的计算详情
  - 修改calculateDivorceCase函数，返回calculationProcess数组，显示基础费用和超额部分计算
  - 修改calculatePersonalityRightsCase函数，返回calculationProcess数组，显示各档计算详情
  - 修改calculateIPCase函数，当有标的额时包含计算过程
  - 其他固定费用案件返回简单的计算说明
  - _Requirements: 11.4, 11.5_

- [x] 18.1 编写属性测试：计算过程显示


  - **Property 18: Calculation process is displayed**
  - **Validates: Requirements 11.4, 11.5**
  - 测试所有案件类型的计算结果都包含calculationProcess
  - 测试分段计算的案件包含详细的分段信息

- [x] 19. 更新结果显示UI





  - 在el-descriptions中添加保全费显示项（使用v-if条件显示）
  - 添加计算过程显示区域，使用el-timeline或el-steps展示计算步骤
  - 实现保全费的条件显示逻辑：仅当案件类型需要标的额且标的额大于零时显示
  - 格式化计算过程的显示，确保清晰易读
  - _Requirements: 11.1, 11.6, 11.7_

- [x] 19.1 编写属性测试：保全费可见性


  - **Property 19: Preservation fee visibility**
  - **Validates: Requirements 11.6, 11.7**
  - 测试不需要标的额的案件类型不显示保全费
  - 测试标的额为零时不显示保全费
  - 测试标的额大于零时显示保全费

- [x] 20. 集成保全费到主计算流程





  - 在calculateLitigationFee函数中，判断案件类型是否需要标的额
  - 当需要标的额且标的额大于零时，调用calculatePreservationFeeForCase
  - 将保全费和保全费计算过程添加到litigationResult对象中
  - 确保保全费计算不影响诉讼费计算
  - _Requirements: 11.1, 11.2, 11.3_
-

- [x] 21. Checkpoint - 确保所有测试通过





















  - 运行所有单元测试和属性测试
  - 确保所有测试通过，如有问题请询问用户
  - 验证UI正确显示保全费和计算过程
