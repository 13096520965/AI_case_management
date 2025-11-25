# 标的处理详情功能设置指南

## 功能概述

标的处理详情功能允许用户在案件编辑页面：
- 查看和编辑标的总额、违约金、诉讼成本等基本信息
- 管理汇款记录（添加、编辑、删除）
- 实时查看回收金额统计和回收率

## 数据库设置

### 1. 创建数据库表

**重要**: 必须在服务器停止状态下执行

```bash
cd legal-case-management/backend

# 停止后端服务器（如果正在运行）
# 然后执行：
node create-target-amount-tables.js
```

这将创建两个表：
- `target_amount_details` - 标的处理详情表
- `payment_records` - 汇款记录表

### 2. 启动服务器

```bash
npm run dev
```

## API 接口

### 标的处理详情

#### 获取详情
```
GET /api/cases/:caseId/target-amount
```

响应：
```json
{
  "data": {
    "detail": {
      "id": 1,
      "case_id": 36,
      "total_amount": 150000,
      "penalty_amount": 10000,
      "litigation_cost": 5000,
      "cost_bearer": "被告方",
      "notes": "备注信息"
    },
    "payments": [...],
    "summary": {
      "totalAmount": 150000,
      "recoveredAmount": 60000,
      "remainingAmount": 90000
    }
  }
}
```

#### 更新详情
```
PUT /api/cases/:caseId/target-amount
```

请求体：
```json
{
  "total_amount": 150000,
  "penalty_amount": 10000,
  "litigation_cost": 5000,
  "cost_bearer": "被告方",
  "notes": "备注信息"
}
```

### 汇款记录

#### 创建汇款记录
```
POST /api/cases/:caseId/payments
```

请求体：
```json
{
  "payment_date": "2024-11-21",
  "amount": 50000,
  "payer": "被告公司",
  "payee": "原告公司",
  "payment_method": "银行转账",
  "status": "已确认",
  "notes": "第一笔回款"
}
```

#### 更新汇款记录
```
PUT /api/payments/:id
```

#### 删除汇款记录
```
DELETE /api/payments/:id
```

## 前端使用

### 1. 在案件编辑页面

组件已自动集成到 `CaseForm.vue` 中：

```vue
<TargetAmountDetail :case-id="caseId" />
```

### 2. 功能说明

**简要统计卡片**：
- 显示标的总额、已收回、剩余、回收率
- 点击"查看详情"按钮打开详情对话框

**详情对话框**：
- **基本信息标签页**：
  - 编辑标的总额、违约金、诉讼成本
  - 设置成本承担方
  - 添加备注信息
  - 点击"保存基本信息"按钮保存

- **汇款记录标签页**：
  - 查看所有汇款记录列表
  - 点击"添加汇款记录"创建新记录
  - 点击"编辑"修改现有记录
  - 点击"删除"删除记录

### 3. 汇款状态

- **待汇款**：计划中的汇款
- **已汇款**：已经汇出但未确认
- **已确认**：已确认到账（只有此状态计入回收金额）

## 测试

### 运行测试脚本

```bash
cd legal-case-management/backend
node test-target-amount-api.js
```

测试脚本将：
1. 创建标的处理详情
2. 更新基本信息
3. 添加汇款记录
4. 更新汇款记录
5. 删除汇款记录
6. 验证统计数据

### 前端测试步骤

1. **硬刷新浏览器**
   - Windows/Linux: `Ctrl + Shift + R`
   - Mac: `Cmd + Shift + R`

2. **进入案件编辑页面**
   - 选择任意案件
   - 点击"编辑"按钮

3. **查看标的处理详情**
   - 页面会显示"标的处理详情"卡片
   - 显示简要统计信息

4. **编辑基本信息**
   - 点击"查看详情"按钮
   - 切换到"基本信息"标签页
   - 修改各项数据
   - 点击"保存基本信息"

5. **管理汇款记录**
   - 切换到"汇款记录"标签页
   - 点击"添加汇款记录"
   - 填写表单并保存
   - 尝试编辑和删除记录

## 数据库表结构

### target_amount_details

| 字段 | 类型 | 说明 |
|------|------|------|
| id | INTEGER | 主键 |
| case_id | INTEGER | 案件ID（唯一） |
| total_amount | REAL | 标的总额 |
| penalty_amount | REAL | 违约金 |
| litigation_cost | REAL | 诉讼成本 |
| cost_bearer | TEXT | 成本承担方 |
| notes | TEXT | 备注 |
| created_at | DATETIME | 创建时间 |
| updated_at | DATETIME | 更新时间 |

### payment_records

| 字段 | 类型 | 说明 |
|------|------|------|
| id | INTEGER | 主键 |
| case_id | INTEGER | 案件ID |
| payment_date | DATE | 汇款日期 |
| amount | REAL | 金额 |
| payer | TEXT | 付款方 |
| payee | TEXT | 收款方 |
| payment_method | TEXT | 支付方式 |
| status | TEXT | 状态 |
| notes | TEXT | 备注 |
| created_at | DATETIME | 创建时间 |
| updated_at | DATETIME | 更新时间 |

## 故障排除

### 问题：API 返回 "no such table" 错误

**解决方案**：
1. 停止后端服务器
2. 运行 `node create-target-amount-tables.js`
3. 重新启动服务器

### 问题：前端显示空数据

**解决方案**：
1. 检查浏览器控制台是否有错误
2. 硬刷新浏览器清除缓存
3. 检查后端服务器是否正常运行
4. 验证数据库表是否存在

### 问题：保存后数据丢失

**解决方案**：
- 检查数据库文件路径是否正确
- 确认 `saveDatabase()` 函数被正确调用
- 查看服务器日志是否有错误信息

## 相关文件

### 后端
- `src/models/TargetAmountDetail.js` - 标的详情模型
- `src/models/PaymentRecord.js` - 汇款记录模型
- `src/controllers/targetAmountController.js` - 控制器
- `src/routes/targetAmount.js` - 路由
- `database/migrations/007_create_target_amount_tables.sql` - 数据库迁移
- `create-target-amount-tables.js` - 表创建脚本
- `test-target-amount-api.js` - API测试脚本

### 前端
- `src/components/case/TargetAmountDetail.vue` - 主组件
- `src/api/targetAmount.ts` - API接口
- `src/views/case/CaseForm.vue` - 案件表单（集成组件）

## 功能特点

✅ 自动创建默认记录（首次访问时）
✅ 实时计算回收金额和回收率
✅ 只统计"已确认"状态的汇款
✅ 支持多种支付方式
✅ 完整的CRUD操作
✅ 数据验证和错误处理
✅ 响应式设计
✅ 友好的用户界面

## 下一步

功能已完整实现并可以使用。如需扩展功能，可以考虑：
- 添加汇款凭证上传
- 导出汇款记录报表
- 汇款提醒功能
- 批量导入汇款记录
- 汇款统计图表
