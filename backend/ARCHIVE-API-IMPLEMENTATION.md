# 归档管理 API 实施总结

## 概述

本文档记录了智能案管系统归档管理 API 的实施情况，包括结案报告管理、归档包管理和案例知识库三个核心功能模块。

## 实施日期

2024-11-17

## 数据库设计

### 1. 结案报告表 (closure_reports)

存储案件结案报告信息。

**字段说明:**
- `id`: 主键
- `case_id`: 案件ID（唯一，外键关联 cases 表）
- `case_summary`: 案件总结
- `case_result`: 案件结果
- `experience_summary`: 经验总结
- `risk_warnings`: 风险提示
- `lessons_learned`: 经验教训
- `created_by`: 创建人
- `approved_by`: 审批人
- `approval_status`: 审批状态（draft/approved/rejected）
- `created_at`: 创建时间
- `updated_at`: 更新时间

### 2. 归档包表 (archive_packages)

存储案件归档包信息。

**字段说明:**
- `id`: 主键
- `case_id`: 案件ID（唯一，外键关联 cases 表）
- `archive_number`: 归档编号（唯一，格式：AR + 年月 + 6位序号）
- `archive_date`: 归档日期
- `archive_location`: 归档位置
- `package_size`: 归档包大小（字节）
- `package_path`: 归档包路径
- `archived_by`: 归档人
- `notes`: 备注
- `created_at`: 创建时间

### 3. 案例知识库表 (case_knowledge)

存储案例知识信息。

**字段说明:**
- `id`: 主键
- `case_id`: 案件ID（可选，外键关联 cases 表）
- `archive_package_id`: 归档包ID（可选，外键关联 archive_packages 表）
- `case_cause`: 案由
- `dispute_focus`: 争议焦点
- `legal_issues`: 法律问题
- `case_result`: 案件结果
- `key_evidence`: 关键证据
- `legal_basis`: 法律依据
- `case_analysis`: 案例分析
- `practical_significance`: 实践意义
- `keywords`: 关键词
- `tags`: 标签
- `win_rate_reference`: 胜诉率参考
- `created_by`: 创建人
- `created_at`: 创建时间
- `updated_at`: 更新时间

## API 接口

### 结案报告管理

#### 1. 创建结案报告
- **接口**: `POST /api/archive/closure-report`
- **认证**: 需要
- **请求体**:
```json
{
  "case_id": 1,
  "case_summary": "案件总结",
  "case_result": "胜诉",
  "experience_summary": "经验总结",
  "risk_warnings": "风险提示",
  "lessons_learned": "经验教训",
  "created_by": "username",
  "approval_status": "draft"
}
```
- **响应**: 返回创建的结案报告信息

#### 2. 获取结案报告
- **接口**: `GET /api/archive/closure-report/:caseId`
- **认证**: 需要
- **参数**: caseId - 案件ID
- **响应**: 返回结案报告信息

#### 3. 更新结案报告
- **接口**: `PUT /api/archive/closure-report/:id`
- **认证**: 需要
- **参数**: id - 报告ID
- **请求体**: 需要更新的字段
- **响应**: 返回更新后的结案报告信息

### 归档包管理

#### 1. 创建归档包
- **接口**: `POST /api/archive/package`
- **认证**: 需要
- **请求体**:
```json
{
  "case_id": 1,
  "archived_by": "username",
  "notes": "归档备注"
}
```
- **功能**: 
  - 自动生成唯一归档编号（格式：AR202411000001）
  - 自动收集案件所有相关数据（诉讼主体、流程节点、证据、文书、成本记录）
  - 计算归档包大小
- **响应**: 返回归档包信息和数据摘要

#### 2. 检索归档案件
- **接口**: `GET /api/archive/search`
- **认证**: 需要
- **查询参数**:
  - `page`: 页码（默认1）
  - `limit`: 每页数量（默认10）
  - `archive_number`: 归档编号（模糊匹配）
  - `case_number`: 案号（模糊匹配）
  - `case_cause`: 案由（模糊匹配）
  - `archive_date_from`: 归档日期起始
  - `archive_date_to`: 归档日期结束
  - `archived_by`: 归档人
- **响应**: 返回归档包列表和分页信息

#### 3. 获取归档包详情
- **接口**: `GET /api/archive/package/:id`
- **认证**: 需要
- **参数**: id - 归档包ID
- **响应**: 返回归档包详情和关联的案件信息

### 案例知识库

#### 1. 创建案例知识
- **接口**: `POST /api/archive/knowledge`
- **认证**: 需要
- **请求体**:
```json
{
  "case_id": 1,
  "archive_package_id": 1,
  "case_cause": "合同纠纷",
  "dispute_focus": "争议焦点",
  "legal_issues": "法律问题",
  "case_result": "胜诉",
  "key_evidence": "关键证据",
  "legal_basis": "法律依据",
  "case_analysis": "案例分析",
  "practical_significance": "实践意义",
  "keywords": "关键词1,关键词2",
  "tags": "标签1,标签2",
  "win_rate_reference": 85.5,
  "created_by": "username"
}
```
- **响应**: 返回创建的案例知识信息

#### 2. 检索案例知识库
- **接口**: `GET /api/archive/knowledge`
- **认证**: 需要
- **查询参数**:
  - `page`: 页码（默认1）
  - `limit`: 每页数量（默认10）
  - `case_cause`: 案由（模糊匹配）
  - `dispute_focus`: 争议焦点（模糊匹配）
  - `keywords`: 关键词（模糊匹配，搜索关键词、案例分析、法律问题）
  - `tags`: 标签（模糊匹配）
  - `case_result`: 案件结果（精确匹配）
- **响应**: 返回案例知识列表和分页信息

#### 3. 获取案例知识统计
- **接口**: `GET /api/archive/knowledge/statistics`
- **认证**: 需要
- **响应**: 返回按案由分类的统计信息

#### 4. 获取案例知识详情
- **接口**: `GET /api/archive/knowledge/:id`
- **认证**: 需要
- **参数**: id - 知识ID
- **响应**: 返回案例知识详情

#### 5. 更新案例知识
- **接口**: `PUT /api/archive/knowledge/:id`
- **认证**: 需要
- **参数**: id - 知识ID
- **请求体**: 需要更新的字段
- **响应**: 返回更新后的案例知识信息

## 核心功能实现

### 1. 归档编号自动生成

归档编号格式：`AR + 年份 + 月份 + 6位序号`

示例：`AR202411000001`

实现逻辑：
1. 获取当前年月作为前缀
2. 查询当月最大序号
3. 序号递增并补零到6位
4. 拼接生成唯一编号

### 2. 案件数据自动打包

创建归档包时自动收集：
- 案件基本信息
- 诉讼主体列表
- 流程节点列表
- 证据文件列表
- 文书列表
- 成本记录列表
- 结案报告

### 3. 多维度检索

支持以下检索维度：
- 归档编号
- 案号（法院案号/内部编号）
- 案由
- 归档日期范围
- 归档人
- 关键词（全文检索）
- 标签

### 4. 案例知识分类

支持按以下维度分类和统计：
- 案由
- 争议焦点
- 案件结果
- 标签

## 测试结果

所有 API 接口测试通过：

✓ 结案报告管理
  - 创建结案报告
  - 获取结案报告
  - 更新结案报告

✓ 归档包管理
  - 创建归档包（自动生成编号、自动打包数据）
  - 检索归档案件（多维度检索）
  - 获取归档包详情

✓ 案例知识库
  - 创建案例知识
  - 检索案例知识库（关键词搜索）
  - 获取案例知识统计（按案由分类）
  - 更新案例知识

## 文件清单

### 数据模型
- `src/models/ClosureReport.js` - 结案报告模型
- `src/models/ArchivePackage.js` - 归档包模型
- `src/models/CaseKnowledge.js` - 案例知识模型

### 控制器
- `src/controllers/archiveController.js` - 归档管理控制器

### 路由
- `src/routes/archive.js` - 归档管理路由

### 数据库
- `src/config/initDatabase.js` - 数据库初始化脚本（已更新）

### 测试
- `test-archive-api.js` - API 测试脚本

## 使用示例

### 1. 创建结案报告

```bash
curl -X POST http://localhost:3000/api/archive/closure-report \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "case_id": 1,
    "case_summary": "案件总结",
    "case_result": "胜诉",
    "experience_summary": "经验总结",
    "created_by": "username"
  }'
```

### 2. 创建归档包

```bash
curl -X POST http://localhost:3000/api/archive/package \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "case_id": 1,
    "archived_by": "username",
    "notes": "归档备注"
  }'
```

### 3. 检索案例知识库

```bash
curl -X GET "http://localhost:3000/api/archive/knowledge?keywords=合同&page=1&limit=10" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

## 注意事项

1. **唯一性约束**: 每个案件只能有一个结案报告和一个归档包
2. **归档编号**: 自动生成，格式固定，确保唯一性
3. **数据完整性**: 创建归档包前建议先创建结案报告
4. **权限控制**: 所有接口都需要认证，建议根据实际需求添加角色权限控制
5. **文件存储**: 当前归档包路径为逻辑路径，实际文件存储需要根据业务需求实现

## 后续优化建议

1. **物理归档**: 实现归档包的物理文件打包（ZIP/TAR）
2. **归档审批**: 添加归档审批流程
3. **归档恢复**: 实现归档案件的恢复功能
4. **全文检索**: 集成 Elasticsearch 实现更强大的全文检索
5. **案例推荐**: 基于案例知识库实现智能案例推荐
6. **数据导出**: 支持归档数据导出为 PDF/Word 格式
7. **归档统计**: 添加归档数据的统计分析功能

## 总结

归档管理 API 已成功实施，包含结案报告管理、归档包管理和案例知识库三个核心模块。所有功能经过测试验证，可以正常使用。系统支持案件的完整归档流程，为后续的案例知识管理和数据分析提供了基础。
