# 首页待办事项样式清理

## 修改内容

### 1. 移除 border-left 颜色样式

**移除前的样式：**
```css
.todo-item.high {
  border-left: 3px solid #f56c6c;
}

.todo-item.medium {
  border-left: 3px solid #e6a23c;
}

.todo-item.low {
  border-left: 3px solid #409eff;
}
```

**现在：**
- ❌ 不再使用 border-left 样式
- ✅ 使用背景色区分未读状态
- ✅ 使用图标颜色区分提醒类型

### 2. 未读消息红点标注

**模板结构：**
```html
<div 
  class="todo-item"
  :class="{ 'is-unread': item.status === 'unread' }"
>
  <!-- 未读红点 - 只在未读时显示 -->
  <div class="item-dot" v-if="item.status === 'unread'"></div>
  
  <!-- 图标 - 根据类型显示不同颜色 -->
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

**红点样式：**
```css
.item-dot {
  position: absolute;
  left: 8px;        /* 距离左边 8px */
  top: 18px;        /* 距离顶部 18px */
  width: 6px;       /* 宽度 6px */
  height: 6px;      /* 高度 6px */
  border-radius: 50%;  /* 圆形 */
  background-color: #f56c6c;  /* 红色 */
}
```

## 视觉效果

### 未读消息
```
┌─────────────────────────────────────────┐
│ ● [⚠] 节点已逾期，请尽快处理            │  ← 蓝色背景 + 红点
│        案件编号: 2024-001               │
│        2小时前                          │
├─────────────────────────────────────────┤
│ ● [🕐] 节点即将到期                     │  ← 蓝色背景 + 红点
│        案件编号: 2024-002               │
│        3小时前                          │
└─────────────────────────────────────────┘
```

### 已读消息（不会显示在待办事项中）
```
待办事项只显示未读消息，已读消息会被移除
```

## 状态区分方式

| 元素 | 未读 | 已读 |
|------|------|------|
| 背景色 | #f0f9ff (浅蓝) | 不显示 |
| 红点 | ● 显示 | 不显示 |
| 图标颜色 | 根据类型 | 不显示 |
| border-left | ❌ 不使用 | ❌ 不使用 |

## 类型区分方式

通过图标颜色区分不同类型的提醒：

| 类型 | 图标 | 颜色 |
|------|------|------|
| 逾期 | Warning | #F56C6C (红色) |
| 截止 | Clock | #E6A23C (橙色) |
| 支付 | Money | #409EFF (蓝色) |
| 任务 | Document | #67C23A (绿色) |
| 其他 | Bell | #909399 (灰色) |

## 优势

1. **视觉简洁** - 移除了多余的边框，界面更清爽
2. **状态明确** - 红点清晰标识未读消息
3. **类型清晰** - 图标颜色区分不同类型
4. **一致性好** - 与 NotificationPopover 样式完全一致
5. **用户友好** - 红点位置醒目，易于识别

## 测试要点

1. ✅ 未读消息显示红点
2. ✅ 红点位置在左侧（left: 8px）
3. ✅ 没有 border-left 样式
4. ✅ 未读消息有浅蓝色背景
5. ✅ 不同类型显示不同颜色的图标
6. ✅ 点击后红点消失（消息被移除）
