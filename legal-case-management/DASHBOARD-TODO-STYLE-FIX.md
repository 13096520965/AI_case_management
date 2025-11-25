# 首页待办事项卡片样式调整

## 问题描述

首页待办事项卡片存在样式问题：
1. 标题栏部分内容被遮挡
2. 标题栏元素排布不合理
3. 内容区域滚动不流畅

## 解决方案

### 1. 标题栏布局优化

**修改前：**
```html
<div class="card-header">
  <span>待办事项</span>
  <el-badge :value="totalAlerts" :max="99" class="alert-badge" />
  <el-button ... />
</div>
```

**修改后：**
```html
<div class="card-header todo-header">
  <div class="header-left">
    <span class="header-title">待办事项</span>
    <el-badge :value="totalAlerts" :max="99" class="alert-badge" />
  </div>
  <div class="header-right">
    <el-button ... />
  </div>
</div>
```

### 2. 样式调整

#### 标题栏样式

```css
/* 待办事项卡片 */
.todo-card :deep(.el-card__header) {
  padding: 16px 20px;
  border-bottom: 1px solid #ebeef5;
}

.todo-card :deep(.el-card__body) {
  padding: 0;
  flex: 1;
  overflow: hidden;
}

/* 标题栏布局 */
.todo-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  gap: 16px;
}

/* 左侧区域 */
.header-left {
  display: flex;
  align-items: center;
  gap: 10px;
  flex: 1;
  min-width: 0;  /* 防止内容溢出 */
}

.header-title {
  font-weight: bold;
  font-size: 16px;
  white-space: nowrap;  /* 标题不换行 */
}

/* 右侧区域 */
.header-right {
  display: flex;
  align-items: center;
  flex-shrink: 0;  /* 防止按钮被压缩 */
}

.alert-badge {
  flex-shrink: 0;  /* 防止徽章被压缩 */
}
```

#### 内容区域样式

```css
.todo-list {
  height: 350px;  /* 固定高度 */
  overflow-y: auto;  /* 垂直滚动 */
  overflow-x: hidden;  /* 隐藏横向滚动 */
  position: relative;
}

/* 自定义滚动条 */
.todo-list::-webkit-scrollbar {
  width: 6px;
}

.todo-list::-webkit-scrollbar-thumb {
  background-color: #dcdfe6;
  border-radius: 3px;
}

.todo-list::-webkit-scrollbar-thumb:hover {
  background-color: #c0c4cc;
}
```

## 布局结构

```
┌─────────────────────────────────────────┐
│ 待办事项  [5]                    [刷新]  │  ← 标题栏（左右排布）
├─────────────────────────────────────────┤
│ ┌─────────────────────────────────────┐ │
│ │ [图标] 提醒内容                      │ │
│ │        案件编号: XXX                 │ │
│ │        2小时前              [待处理] │ │
│ ├─────────────────────────────────────┤ │
│ │ [图标] 提醒内容                      │ │  ← 内容区域（可滚动）
│ │        案件编号: XXX                 │ │
│ │        3小时前              [待处理] │ │
│ ├─────────────────────────────────────┤ │
│ │ ...更多内容...                       │ │
│ │ ↓ 滚动查看更多                       │ │
│ └─────────────────────────────────────┘ │
└─────────────────────────────────────────┘
```

## 关键特性

### 1. 标题栏完全展示
- 使用 `justify-content: space-between` 实现左右分布
- 左侧：标题 + 徽章
- 右侧：刷新按钮
- 使用 `flex-shrink: 0` 防止按钮和徽章被压缩
- 使用 `white-space: nowrap` 防止标题换行

### 2. 内容区域滚动
- 固定高度 350px
- `overflow-y: auto` 启用垂直滚动
- `overflow-x: hidden` 隐藏横向滚动
- 自定义滚动条样式，更美观

### 3. 响应式设计
- 使用 `min-width: 0` 防止flex子元素溢出
- 使用 `gap` 属性设置间距
- 保持与其他卡片高度一致

## 测试要点

1. ✅ 标题栏所有元素完全可见
2. ✅ 标题、徽章、按钮左右排布合理
3. ✅ 内容超出时出现滚动条
4. ✅ 滚动条样式美观
5. ✅ 滚动加载更多功能正常
6. ✅ 响应式布局在不同屏幕尺寸下正常
7. ✅ 与其他卡片高度保持一致

## 浏览器兼容性

- ✅ Chrome/Edge (Webkit)
- ✅ Firefox
- ✅ Safari
- ✅ 移动端浏览器

注意：自定义滚动条样式使用 `::-webkit-scrollbar`，在Firefox中会使用默认样式。
