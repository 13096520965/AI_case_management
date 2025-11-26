# 提醒通知最终显示实现

## 需求实现

### 1. 提醒列表关联信息优化

**原格式：**
```
关联: process_node #24
```

**新格式：**
```
关联案件编码:AN202511000007
关联案件编码:--  (当没有内部编号时)
```

**实现方式：**
- 显示案件的内部编号（如 AN202511000007）
- 没有内部编号时显示 `--`
- 样式保持不变
- 点击可跳转到对应的案件详情页面

### 2. 右上角提醒通知折行显示

**实现方式：**
- 添加 `overflow-wrap: break-word` 样式
- 添加 `max-width: 100%` 确保宽度限制
- 宽度不够时自动折行显示

## 修改文件

### 前端修改

#### 文件：`frontend/src/views/notification/NotificationCenter.vue`

**修改内容：**

```vue
<!-- 原代码 -->
<div class="notification-footer">
  <span class="notification-related">
    关联: 
    <el-link 
      v-if="notification.caseNumber"
      type="primary" 
      :underline="false"
      @click.stop="handleViewCase(notification)"
    >
      {{ notification.caseNumber }}
    </el-link>
    <span v-else>
      {{ notification.relatedType }} #{{ notification.relatedId }}
    </span>
  </span>
</div>

<!-- 新代码 -->
<div class="notification-footer">
  <span class="notification-related">
    <el-link 
      v-if="notification.internalNumber"
      type="primary" 
      :underline="false"
      @click.stop="handleNotificationClick(notification)"
    >
      关联案件编码:{{ notification.internalNumber }}
    </el-link>
    <span v-else>
      关联案件编码:--
    </span>
  </span>
</div>
```

#### 文件：`frontend/src/components/notification/NotificationPopover.vue`

**修改内容：**

```css
/* 原样式 */
.item-text {
  font-size: 14px;
  color: #606266;
  line-height: 1.5;
  margin-bottom: 4px;
  word-wrap: break-word;
  word-break: break-word;
  white-space: normal;
}

/* 新样式 */
.item-text {
  font-size: 14px;
  color: #606266;
  line-height: 1.5;
  margin-bottom: 4px;
  word-wrap: break-word;
  word-break: break-word;
  white-space: normal;
  overflow-wrap: break-word;
  max-width: 100%;
}

.text-line {
  margin-bottom: 4px;
  word-wrap: break-word;
  word-break: break-word;
  overflow-wrap: break-word;
  max-width: 100%;
}
```

## 显示效果

### 通知中心

**有内部编号的提醒：**
```
案号001案件节点"立案受理"将在 1 天后到期（截止日期：2025-11-26 09:40:22），请及时处理
关联案件编码:AN202511000007
```

**没有内部编号的提醒：**
```
案件节点"节点1"将在 3 天后到期（截止日期：2025-11-28 00:00:00），请及时处理
关联案件编码:--
```

### 右上角通知弹窗

**宽度充足时：**
```
案号001案件节点"立案受理"将在 1 天后到期（截止日期：2025-11-26 09:40:22），请及时处理
关联案件编码:AN202511000007
```

**宽度不足时（自动折行）：**
```
案号001案件节点"立案受理"将在 1 天后到期
（截止日期：2025-11-26 09:40:22），请及时处理
关联案件编码:AN202511000007
```

## 功能特性

✓ **关联信息优化**：显示案件编码而不是 `process_node #24`
✓ **默认值处理**：没有内部编号时显示 `--`
✓ **样式保持**：关联信息样式保持不变
✓ **点击跳转**：点击关联信息可跳转到案件详情页面
✓ **自动折行**：右上角通知宽度不足时自动折行显示
✓ **完整信息**：提醒包含所有必要的信息

## 数据流

```
后端返回通知数据
  ↓
包含 internalNumber 字段
  ↓
前端接收数据
  ↓
通知中心显示关联案件编码（有则显示，无则显示--）
右上角弹窗显示提醒文案（宽度不足时自动折行）
  ↓
点击关联信息跳转到案件详情页面
```

## 部署步骤

1. 部署前端修改
2. 刷新页面查看效果
3. 验证关联信息显示和点击跳转功能
4. 验证右上角通知的折行显示

## 验证清单

- [ ] 通知中心显示 `关联案件编码:AN202511000007`
- [ ] 没有内部编号时显示 `关联案件编码:--`
- [ ] 点击关联信息可跳转到案件详情页面
- [ ] 右上角通知宽度不足时自动折行
- [ ] 样式保持不变

## 相关文件

- `frontend/src/views/notification/NotificationCenter.vue`
- `frontend/src/components/notification/NotificationPopover.vue`
- `backend/src/controllers/notificationController.js`
