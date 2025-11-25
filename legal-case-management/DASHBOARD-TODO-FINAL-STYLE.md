# 首页待办事项卡片最终样式调整

## 问题描述

1. 刷新按钮被遮挡
2. 数据颜色和图标样式与其他提醒消息不一致

## 解决方案

### 1. 修复刷新按钮被遮挡

**问题原因**: header-right 没有设置 `margin-left: auto`，导致按钮位置不正确

**解决方法**:
```css
.header-right {
  display: flex;
  align-items: center;
  flex-shrink: 0;
  margin-left: auto;  /* 确保按钮在最右侧 */
}
```

### 2. 统一图标和颜色样式

参考 `NotificationPopover.vue` 的设计，实现一致的视觉效果。

#### 图标映射

```typescript
const getNotificationIcon = (alert: AlertItem) => {
  const taskType = alert.taskType || alert.type || ''
  
  if (taskType.includes('overdue')) {
    return Warning      // 逾期 - 警告图标
  } else if (taskType.includes('deadline')) {
    return Clock        // 截止 - 时钟图标
  } else if (taskType.includes('payment')) {
    return Money        // 支付 - 金钱图标
  } else if (taskType.includes('task')) {
    return Document     // 任务 - 文档图标
  }
  return Bell           // 默认 - 铃铛图标
}
```

#### 颜色映射

```typescript
const getNotificationColor = (alert: AlertItem): string => {
  const taskType = alert.taskType || alert.type || ''
  
  if (taskType.includes('overdue')) {
    return '#F56C6C'    // 逾期 - 红色
  } else if (taskType.includes('deadline')) {
    return '#E6A23C'    // 截止 - 橙色
  } else if (taskType.includes('payment')) {
    return '#409EFF'    // 支付 - 蓝色
  } else if (taskType.includes('task')) {
    return '#67C23A'    // 任务 - 绿色
  }
  return '#909399'      // 默认 - 灰色
}
```

### 3. 统一列表项样式

#### 模板结构

```html
<div 
  class="todo-item"
  :class="{ 'is-unread': item.status === 'pending' }"
  @click="handleAlertClick(item)"
>
  <!-- 未读标记点 -->
  <div class="item-dot" v-if="item.status === 'pending'"></div>
  
  <!-- 图标 -->
  <div class="item-icon">
    <el-icon :size="18" :color="getNotificationColor(item)">
      <component :is="getNotificationIcon(item)" />
    </el-icon>
  </div>
  
  <!-- 内容 -->
  <div class="item-content">
    <div class="item-text">{{ item.content }}</div>
    <div class="item-desc" v-if="item.caseNumber">案件编号: {{ item.caseNumber }}</div>
    <div class="item-time">{{ formatTime(item.scheduledTime) }}</div>
  </div>
</div>
```

#### 样式定义

```css
.todo-item {
  position: relative;
  display: flex;
  align-items: flex-start;
  padding: 12px 16px;
  cursor: pointer;
  transition: background-color 0.3s;
}

.todo-item:hover {
  background-color: #f5f7fa;
}

/* 未读状态 */
.todo-item.is-unread {
  background-color: #f0f9ff;
}

.todo-item.is-unread:hover {
  background-color: #e6f4ff;
}

/* 未读标记点 */
.item-dot {
  position: absolute;
  left: 8px;
  top: 18px;
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background-color: #f56c6c;
}

/* 图标 */
.item-icon {
  flex-shrink: 0;
  margin-right: 12px;
  margin-top: 2px;
}

/* 内容区域 */
.item-content {
  flex: 1;
  min-width: 0;
}

.item-text {
  font-size: 14px;
  color: #606266;
  line-height: 1.5;
  margin-bottom: 4px;
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
}

.item-desc {
  font-size: 12px;
  color: #909399;
  margin-bottom: 4px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.item-time {
  font-size: 12px;
  color: #909399;
}
```

## 视觉效果对比

### 修改前
- ❌ 刷新按钮被遮挡
- ❌ 使用固定的图标和颜色
- ❌ 有边框和优先级类名
- ❌ 显示"待处理"标签

### 修改后
- ✅ 刷新按钮完全可见
- ✅ 根据类型动态显示图标和颜色
- ✅ 未读状态有背景色高亮
- ✅ 左侧有红点标记未读
- ✅ 与 NotificationPopover 样式一致

## 颜色和图标对应关系

| 类型 | 图标 | 颜色 | 说明 |
|------|------|------|------|
| overdue | Warning | #F56C6C (红色) | 逾期提醒 |
| deadline | Clock | #E6A23C (橙色) | 截止日期 |
| payment | Money | #409EFF (蓝色) | 支付提醒 |
| task | Document | #67C23A (绿色) | 任务提醒 |
| 其他 | Bell | #909399 (灰色) | 默认提醒 |

## 布局结构

```
┌─────────────────────────────────────────┐
│ 待办事项  [5]                    [刷新]  │  ← 标题栏
├─────────────────────────────────────────┤
│ ● [⚠] 节点已逾期，请尽快处理            │  ← 未读（蓝色背景）
│        案件编号: 2024-001               │
│        2小时前                          │
├─────────────────────────────────────────┤
│   [🕐] 节点即将到期                     │  ← 已读（白色背景）
│        案件编号: 2024-002               │
│        3小时前                          │
├─────────────────────────────────────────┤
│ ● [💰] 待支付费用提醒                   │  ← 未读（蓝色背景）
│        案件编号: 2024-003               │
│        昨天                             │
└─────────────────────────────────────────┘
```

## 测试要点

1. ✅ 刷新按钮完全可见且可点击
2. ✅ 不同类型显示不同颜色的图标
3. ✅ 未读提醒有蓝色背景和红点标记
4. ✅ 悬停时背景色变化
5. ✅ 内容过长时正确截断
6. ✅ 与 NotificationPopover 样式一致
7. ✅ 响应式布局正常

## 依赖的图标组件

```typescript
import { 
  Bell,      // 默认
  Warning,   // 逾期
  Clock,     // 截止
  Money,     // 支付
  Document,  // 任务
  Refresh    // 刷新按钮
} from '@element-plus/icons-vue'
```

## 注意事项

1. 使用 `component :is` 动态渲染图标组件
2. 图标大小统一为 18px
3. 未读标记点位置为 `left: 8px, top: 18px`
4. 内容文本最多显示2行，超出显示省略号
5. 时间格式使用相对时间（如"2小时前"）
