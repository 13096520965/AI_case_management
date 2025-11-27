# 遗留提醒数据清理

## 问题描述

提醒数据中存在两条遗留提醒，使用了不标准的 `related_type`：

1. **费用支付提醒** (ID: 85)
   - `related_type`: `case`（应为 `cost_record`）
   - 内容: "案件费用待支付，金额：5000元..."
   - 问题: 无法正确关联到具体的费用记录

2. **协作任务提醒** (ID: 86)
   - `related_type`: `task`（应为 `process_node`）
   - 内容: "协作任务"准备开庭材料"待完成..."
   - 问题: 无法正确关联到具体的节点

## 清理过程

### 诊断
运行诊断脚本识别遗留数据：
```bash
node diagnose-payment-task-notifications.js
```

结果：
- 费用支付提醒: 1 条（遗留数据）
- 协作任务提醒: 1 条（遗留数据）

### 清理
运行清理脚本删除遗留数据：
```bash
node clean-legacy-notifications.js
```

结果：
- 删除了 2 条遗留提醒
- 剩余 21 条有效提醒

### 验证
运行验证脚本确认清理结果：
```bash
node diagnose-all-invalid-notifications.js
```

结果：
- 总提醒数: 21 条
- 无效提醒: 0 条
- 所有提醒都有效

## 清理后的提醒分布

| 类型 | 数量 | 说明 |
|------|------|------|
| deadline | 14 条 | 节点到期提醒 |
| overdue | 6 条 | 节点超期提醒 |
| system | 1 条 | 系统通知 |
| **总计** | **21 条** | 全部有效 |

## 相关文件

- `backend/diagnose-payment-task-notifications.js` - 费用和任务提醒诊断脚本
- `backend/clean-legacy-notifications.js` - 遗留数据清理脚本
- `backend/diagnose-all-invalid-notifications.js` - 全量诊断脚本

## 后续保证

修复后的提醒系统确保：
- ✅ 所有提醒都使用标准的 `related_type`
- ✅ 所有提醒都有关联的案件
- ✅ 提醒列表页面只显示有效提醒
- ✅ 用户可以点击任何提醒跳转到对应案件
- ✅ 新生成的提醒都会经过关联案件的验证
