# 提醒类型清理总结

## 修改时间
2025-11-21

## 修改内容

### 1. 移除"协作任务提醒"类别 ✅

**位置**: 提醒规则 > 新建规则弹窗 > 规则类型

**修改前**:
- 节点到期提醒 (deadline)
- 节点超期预警 (overdue)
- 费用支付提醒 (payment)
- 协作任务提醒 (task) ← 已移除

**修改后**:
- 节点到期提醒 (deadline)
- 节点超期预警 (overdue)
- 费用支付提醒 (payment)

**修改文件**:
- `frontend/src/views/notification/NotificationRules.vue`

**代码变更**:
```vue
<!-- 移除了这一行 -->
<!-- <el-option label="协作任务提醒" value="task" /> -->
```

### 2. 清除 node_overdue 类型数据 ✅

**问题说明**:
`node_overdue` 是系统自动生成的节点超期预警数据类型，与业务中使用的 `overdue` 类型重复。

**数据示例**:
```
【超期预警】流程节点"立案受理"已超期 2 天
【超期预警】流程节点"送达起诉状副本"已超期 4 天
【超期预警】流程节点"第一次庭审"已超期 661 天
```

**清理结果**:
- 删除前: 13 条 node_overdue 数据
- 删除后: 0 条
- 保留的提醒类型: deadline, node_deadline, overdue, payment, system, task

**清理脚本**:
- `backend/remove-node-overdue.js`

**执行命令**:
```bash
cd backend
node remove-node-overdue.js
```

### 3. 禁用 node_overdue 自动生成 ✅

**问题**: 定时任务每小时检查超期节点，会自动生成 `node_overdue` 类型的提醒

**解决方案**: 注释掉生成逻辑

**修改文件**:
- `backend/src/services/notificationScheduler.js`

**修改内容**:
```javascript
async checkOverdueNodes() {
  // 注释掉 node_overdue 类型的生成逻辑
  // 业务中不需要这种类型的提醒
  /*
  for (const node of nodes) {
    await NotificationTask.create({
      task_type: 'node_overdue',  // 已禁用
      ...
    });
  }
  */
  
  console.log(`检查到 ${nodes.length} 个超期节点（node_overdue 类型已禁用）`);
}
```

## 提醒类型说明

### 当前支持的提醒类型

| 类型 | 说明 | 使用场景 | 状态 |
|------|------|----------|------|
| deadline | 节点到期提醒 | 节点即将到期时提醒 | ✅ 使用中 |
| node_deadline | 系统节点到期 | 系统自动检测到期节点 | ✅ 使用中 |
| overdue | 节点超期预警 | 节点已超期时预警 | ✅ 使用中 |
| payment | 费用支付提醒 | 费用待支付时提醒 | ✅ 使用中 |
| system | 系统通知 | 系统级通知消息 | ✅ 使用中 |
| task | 协作任务 | 协作任务提醒（仅数据） | ⚠️ 不可新建 |

### 已废弃的提醒类型

| 类型 | 说明 | 废弃原因 | 状态 |
|------|------|----------|------|
| node_overdue | 系统节点超期 | 与 overdue 重复 | ❌ 已禁用 |

## 数据清理前后对比

### 清理前
```
deadline (pending): 2 条
deadline (unread): 1 条
node_deadline (pending): 14 条
node_deadline (read): 1 条
node_overdue (pending): 13 条  ← 已清除
overdue (unread): 1 条
payment (unread): 1 条
system (unread): 1 条
task (unread): 1 条

总计: 35 条
```

### 清理后
```
deadline (pending): 2 条
deadline (unread): 1 条
node_deadline (pending): 14 条
node_deadline (read): 1 条
overdue (unread): 1 条
payment (unread): 1 条
system (unread): 1 条
task (unread): 1 条

总计: 22 条
```

**减少**: 13 条 (37%)

## 影响范围

### 前端
- ✅ 提醒规则页面 - 移除"协作任务提醒"选项
- ✅ 提醒列表 - 不再显示 node_overdue 类型数据
- ✅ 提醒弹出层 - 不再显示 node_overdue 类型数据

### 后端
- ✅ 定时任务 - 停止生成 node_overdue 类型数据
- ✅ 数据库 - 清除所有 node_overdue 类型数据
- ✅ API - 不再返回 node_overdue 类型数据

### 数据库
- ✅ notification_tasks 表 - 删除 13 条 node_overdue 数据
- ✅ 数据完整性 - 保持良好

## 验证步骤

### 1. 验证前端修改
```bash
# 访问提醒规则页面
http://localhost:5173/notifications/rules

# 点击"新建规则"
# 检查"规则类型"下拉框
# 应该只有3个选项：节点到期提醒、节点超期预警、费用支付提醒
```

### 2. 验证数据清理
```bash
# 检查 node_overdue 数据
sqlite3 database/legal_case.db "SELECT COUNT(*) FROM notification_tasks WHERE task_type = 'node_overdue';"
# 应该返回: 0

# 检查所有提醒类型
sqlite3 database/legal_case.db "SELECT task_type, COUNT(*) FROM notification_tasks GROUP BY task_type;"
# 应该不包含 node_overdue
```

### 3. 验证定时任务
```bash
# 查看后端日志
# 应该看到: "检查到 X 个超期节点（node_overdue 类型已禁用）"
# 不应该看到: "创建超期预警: XXX"
```

## 相关文件

### 修改的文件
1. `frontend/src/views/notification/NotificationRules.vue`
   - 移除"协作任务提醒"选项

2. `backend/src/services/notificationScheduler.js`
   - 禁用 node_overdue 生成逻辑

### 新增的文件
1. `backend/remove-node-overdue.js`
   - 清理 node_overdue 数据的脚本

2. `NOTIFICATION-TYPE-CLEANUP.md`
   - 本文档

## 注意事项

### 1. task 类型说明
- **前端**: 不能在规则中新建 task 类型
- **数据**: 现有的 task 类型数据保留
- **原因**: 协作任务提醒不通过规则系统管理

### 2. node_overdue vs overdue
- **node_overdue**: 系统自动生成（已废弃）
- **overdue**: 通过规则系统管理（推荐使用）
- **区别**: overdue 更灵活，可配置规则

### 3. 数据迁移
如果需要将 node_overdue 转换为 overdue：
```sql
UPDATE notification_tasks 
SET task_type = 'overdue' 
WHERE task_type = 'node_overdue';
```

### 4. 恢复方法
如果需要恢复 node_overdue 功能：
1. 取消 `notificationScheduler.js` 中的注释
2. 重启后端服务
3. 等待定时任务执行

## 后续建议

### 1. 统一提醒类型
建议只使用以下类型：
- `deadline` - 到期提醒
- `overdue` - 超期预警
- `payment` - 费用提醒
- `system` - 系统通知

### 2. 清理 node_deadline
`node_deadline` 与 `deadline` 功能类似，建议评估是否需要合并。

### 3. 规则系统优化
- 所有提醒都通过规则系统管理
- 避免硬编码的提醒类型
- 提供更灵活的配置选项

### 4. 文档完善
- 更新用户手册
- 说明各提醒类型的用途
- 提供配置示例

## 测试清单

- [x] 前端规则类型选项正确
- [x] node_overdue 数据已清除
- [x] 定时任务不再生成 node_overdue
- [x] 提醒列表显示正常
- [x] 提醒弹出层显示正常
- [x] 数据库数据完整
- [x] 后端日志正常

## 总结

通过本次修改：
1. ✅ 移除了"协作任务提醒"规则类别
2. ✅ 清除了 13 条 node_overdue 数据
3. ✅ 禁用了 node_overdue 自动生成
4. ✅ 提醒类型更加清晰统一
5. ✅ 减少了数据冗余

系统提醒功能更加简洁明了，符合实际业务需求。

---

**修改完成时间**: 2025-11-21  
**修改人员**: AI Assistant  
**测试状态**: 已验证  
**部署状态**: 已完成
