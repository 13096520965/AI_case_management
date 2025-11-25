# 通知 UI 改进总结

## 修改内容

### 1. 提醒通知弹窗 (NotificationPopover.vue)
- **移除案件编码展示**：不再在通知文案中展示关联案件编码
- **添加案件编码字段**：在时间下方添加单独的案件编码字段，仅在有有效编码时显示
- **点击跳转**：点击通知时跳转到对应的案件详情页面
- **未读样式**：未读消息不显示背景色，仅通过左侧红点标识

### 2. 提醒中心列表 (NotificationCenter.vue)
- **移除文案中的案件编码**：通知内容中不再包含案件编码
- **添加下方字段**：在通知下方单独显示案件编码字段
- **修复 `--` 显示问题**：当案件内部编号不存在时，正确显示 `--`
- **点击跳转**：点击通知时跳转到对应的案件详情页面
- **数据获取优化**：自动获取关联案件的内部编号

### 3. 超期预警列表 (NotificationAlerts.vue)
- **案件名称链接**：案件名称已支持点击跳转到案件详情
- **添加下划线属性**：移除链接的下划线，保持界面整洁

### 4. 数据模型更新 (notification.ts)
- **扩展 Notification 接口**：添加以下可选字段：
  - `caseId?: number` - 关联案件 ID
  - `internalNumber?: string` - 案件内部编号
  - `linkUrl?: string` - 跳转链接

## 技术改进

### 响应处理
- 修复了 API 响应处理逻辑，适配响应拦截器返回 `response.data` 的设计
- 移除了不必要的 `response.success` 检查

### 数据流
- 通知获取时自动关联案件信息
- 支持从节点 ID 反向查询案件编号
- 优化了异步数据加载流程

## 用户体验改进

1. **界面更清晰**：案件编码单独显示，不混淆在通知文案中
2. **快速导航**：点击通知直接跳转到案件详情，提高工作效率
3. **视觉反馈**：未读消息通过红点标识，已读消息无背景色，区分明确
4. **数据完整性**：自动获取案件编号，确保信息完整

## 文件修改列表

- `legal-case-management/frontend/src/components/notification/NotificationPopover.vue`
- `legal-case-management/frontend/src/views/notification/NotificationCenter.vue`
- `legal-case-management/frontend/src/views/notification/NotificationAlerts.vue`
- `legal-case-management/frontend/src/stores/notification.ts`

## 测试建议

1. 验证通知弹窗中案件编码的显示
2. 验证通知列表中案件编码的显示
3. 测试点击通知跳转到案件详情的功能
4. 验证未读消息的样式（无背景色，仅红点）
5. 测试案件编号为空时的 `--` 显示
