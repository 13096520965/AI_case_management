# Requirements Document

## Introduction

本文档定义了诉讼费计算器案件类型扩展功能的需求。该功能旨在为法律案件管理系统的诉讼费计算器添加更多案件类型选项，以支持更全面的诉讼费用计算场景。所有计算标准基于《诉讼费用交纳办法》第十三条的规定。

## Glossary

- **诉讼费计算器 (Litigation Cost Calculator)**: 用于计算不同类型法律案件诉讼费用的工具
- **案件类型 (Case Type)**: 法律案件的分类，不同类型有不同的费用计算规则
- **标的额 (Target Amount)**: 案件涉及的财产金额或争议金额
- **系统 (System)**: 法律案件管理系统的诉讼费计算器模块

## Requirements

### Requirement 1

**User Story:** 作为法律工作者，我希望在诉讼费计算器中选择"财产案件"类型，以便计算基于标的额的诉讼费用。

#### Acceptance Criteria

1. WHEN 用户访问诉讼费计算器 THEN 系统 SHALL 在案件类型下拉列表中显示"财产案件"选项
2. WHEN 用户选择"财产案件" THEN 系统 SHALL 显示标的额输入字段
3. WHEN 用户输入标的额并点击计算 THEN 系统 SHALL 根据分段累计方式计算诉讼费
4. WHEN 标的额不超过1万元 THEN 系统 SHALL 收取50元固定费用
5. WHEN 标的额超过1万元 THEN 系统 SHALL 按照10个分段比例累计计算诉讼费
6. WHEN 计算完成 THEN 系统 SHALL 显示计算结果和计算说明

### Requirement 2

**User Story:** 作为法律工作者，我希望在诉讼费计算器中选择"其他非财产案件"类型，以便计算非财产类案件的固定诉讼费用。

#### Acceptance Criteria

1. WHEN 用户访问诉讼费计算器 THEN 系统 SHALL 在案件类型下拉列表中显示"其他非财产案件"选项
2. WHEN 用户选择"其他非财产案件" THEN 系统 SHALL 隐藏标的额输入字段
3. WHEN 用户点击计算 THEN 系统 SHALL 收取50元至100元的固定诉讼费
4. WHEN 计算完成 THEN 系统 SHALL 显示计算结果和计算说明

### Requirement 3

**User Story:** 作为法律工作者，我希望在诉讼费计算器中选择"知识产权民事案件"类型，以便计算知识产权相关案件的诉讼费用。

#### Acceptance Criteria

1. WHEN 用户访问诉讼费计算器 THEN 系统 SHALL 在案件类型下拉列表中显示"知识产权民事案件"选项
2. WHEN 用户选择"知识产权民事案件" THEN 系统 SHALL 显示标的额输入字段
3. WHEN 标的额为零或未输入 THEN 系统 SHALL 收取500元至1000元的固定费用
4. WHEN 标的额大于零 THEN 系统 SHALL 按照财产案件标准计算诉讼费
5. WHEN 计算完成 THEN 系统 SHALL 显示计算结果和计算说明

### Requirement 4

**User Story:** 作为法律工作者，我希望在诉讼费计算器中选择"劳动争议案件"类型，以便计算劳动纠纷案件的诉讼费用。

#### Acceptance Criteria

1. WHEN 用户访问诉讼费计算器 THEN 系统 SHALL 在案件类型下拉列表中显示"劳动争议案件"选项
2. WHEN 用户选择"劳动争议案件" THEN 系统 SHALL 隐藏标的额输入字段
3. WHEN 用户点击计算 THEN 系统 SHALL 收取10元固定诉讼费
4. WHEN 计算完成 THEN 系统 SHALL 显示计算结果和计算说明

### Requirement 5

**User Story:** 作为法律工作者，我希望在诉讼费计算器中选择"商标、专利、海事行政案件"类型，以便计算特殊行政案件的诉讼费用。

#### Acceptance Criteria

1. WHEN 用户访问诉讼费计算器 THEN 系统 SHALL 在案件类型下拉列表中显示"商标、专利、海事行政案件"选项
2. WHEN 用户选择"商标、专利、海事行政案件" THEN 系统 SHALL 隐藏标的额输入字段
3. WHEN 用户点击计算 THEN 系统 SHALL 收取100元固定诉讼费
4. WHEN 计算完成 THEN 系统 SHALL 显示计算结果和计算说明

### Requirement 6

**User Story:** 作为法律工作者，我希望在诉讼费计算器中选择"其他行政案件"类型，以便计算一般行政案件的诉讼费用。

#### Acceptance Criteria

1. WHEN 用户访问诉讼费计算器 THEN 系统 SHALL 在案件类型下拉列表中显示"其他行政案件"选项
2. WHEN 用户选择"其他行政案件" THEN 系统 SHALL 隐藏标的额输入字段
3. WHEN 用户点击计算 THEN 系统 SHALL 收取50元固定诉讼费
4. WHEN 计算完成 THEN 系统 SHALL 显示计算结果和计算说明

### Requirement 7

**User Story:** 作为法律工作者，我希望在诉讼费计算器中选择"管辖权异议不成立案件"类型，以便计算管辖权异议案件的诉讼费用。

#### Acceptance Criteria

1. WHEN 用户访问诉讼费计算器 THEN 系统 SHALL 在案件类型下拉列表中显示"管辖权异议不成立案件"选项
2. WHEN 用户选择"管辖权异议不成立案件" THEN 系统 SHALL 隐藏标的额输入字段
3. WHEN 用户点击计算 THEN 系统 SHALL 收取50元至100元的固定诉讼费
4. WHEN 计算完成 THEN 系统 SHALL 显示计算结果和计算说明

### Requirement 8

**User Story:** 作为法律工作者，我希望在诉讼费计算器中选择"离婚案件"类型，以便计算离婚案件的诉讼费用。

#### Acceptance Criteria

1. WHEN 用户访问诉讼费计算器 THEN 系统 SHALL 在案件类型下拉列表中显示"离婚案件"选项
2. WHEN 用户选择"离婚案件" THEN 系统 SHALL 显示标的额输入字段
3. WHEN 标的额为零或不超过20万元 THEN 系统 SHALL 收取50元至300元的固定费用
4. WHEN 标的额超过20万元 THEN 系统 SHALL 在固定费用基础上对超过部分按0.5%加收
5. WHEN 计算完成 THEN 系统 SHALL 显示计算结果和计算说明

### Requirement 9

**User Story:** 作为法律工作者，我希望在诉讼费计算器中选择"人格权案件"类型，以便计算侵害人格权案件的诉讼费用。

#### Acceptance Criteria

1. WHEN 用户访问诉讼费计算器 THEN 系统 SHALL 在案件类型下拉列表中显示"人格权案件"选项
2. WHEN 用户选择"人格权案件" THEN 系统 SHALL 显示标的额输入字段
3. WHEN 标的额为零或不超过5万元 THEN 系统 SHALL 收取100元至500元的固定费用
4. WHEN 标的额超过5万元至10万元 THEN 系统 SHALL 在固定费用基础上对超过5万元部分按1%加收
5. WHEN 标的额超过10万元 THEN 系统 SHALL 在固定费用基础上对超过10万元部分按0.5%加收
6. WHEN 计算完成 THEN 系统 SHALL 显示计算结果和计算说明

### Requirement 10

**User Story:** 作为法律工作者，我希望系统能够根据不同案件类型自动显示或隐藏标的额输入字段，以便提供更好的用户体验。

#### Acceptance Criteria

1. WHEN 用户选择需要标的额的案件类型 THEN 系统 SHALL 显示标的额输入字段
2. WHEN 用户选择不需要标的额的案件类型 THEN 系统 SHALL 隐藏标的额输入字段
3. WHEN 案件类型切换 THEN 系统 SHALL 立即更新界面显示状态
4. WHEN 标的额字段被隐藏 THEN 系统 SHALL 清除之前输入的标的额数值
