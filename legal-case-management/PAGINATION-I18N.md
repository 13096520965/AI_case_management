# 分页组件中文化配置

## 🌐 修改内容

### 问题
分页组件显示英文文案，如 "Total"、"page"、"goto" 等。

### 解决方案
配置 Element Plus 中文语言包，使所有组件默认显示中文。

## 📝 修改文件

### 1. main.ts - 添加中文语言包

**文件位置**: `frontend/src/main.ts`

**修改前**:
```typescript
import { createApp } from 'vue'
import { createPinia } from 'pinia'
import router from './router'
import App from './App.vue'
import 'element-plus/dist/index.css'
import './styles/element-override.css'

const app = createApp(App)

app.use(createPinia())
app.use(router)

app.mount('#app')
```

**修改后**:
```typescript
import { createApp } from 'vue'
import { createPinia } from 'pinia'
import router from './router'
import App from './App.vue'
import ElementPlus from 'element-plus'
import zhCn from 'element-plus/dist/locale/zh-cn.mjs'
import 'element-plus/dist/index.css'
import './styles/element-override.css'

const app = createApp(App)

app.use(createPinia())
app.use(router)
app.use(ElementPlus, {
  locale: zhCn,
})

app.mount('#app')
```

### 2. NotificationCenter.vue - 优化分页组件

**文件位置**: `frontend/src/views/notification/NotificationCenter.vue`

**添加属性**:
```vue
<el-pagination
  v-if="total > pageSize"
  class="pagination"
  v-model:current-page="currentPage"
  v-model:page-size="pageSize"
  :page-sizes="[10, 20, 50, 100]"
  :total="total"
  layout="total, sizes, prev, pager, next, jumper"
  @size-change="handleSizeChange"
  @current-change="handlePageChange"
  :prev-text="'上一页'"
  :next-text="'下一页'"
  background
/>
```

### 3. NotificationAlerts.vue - 优化分页组件

**文件位置**: `frontend/src/views/notification/NotificationAlerts.vue`

**添加属性**:
```vue
<el-pagination
  v-if="total > pageSize"
  class="pagination"
  v-model:current-page="currentPage"
  v-model:page-size="pageSize"
  :page-sizes="[10, 20, 50, 100]"
  :total="total"
  layout="total, sizes, prev, pager, next, jumper"
  @size-change="handleSizeChange"
  @current-change="handlePageChange"
  :prev-text="'上一页'"
  :next-text="'下一页'"
  background
/>
```

## 🎯 效果对比

### 修改前（英文）
```
Total 49    20 / page    < 1 2 3 >    goto [__]
```

### 修改后（中文）
```
共 49 条    20 条/页    上一页 1 2 3 下一页    前往 [__] 页
```

## 📊 中文化内容

### 分页组件文案
| 英文 | 中文 |
|------|------|
| Total | 共 X 条 |
| / page | 条/页 |
| goto | 前往 X 页 |
| prev | 上一页 |
| next | 下一页 |

### 其他组件文案
配置中文语言包后，以下组件也会自动显示中文：

- **日期选择器**: 月份、星期等
- **时间选择器**: 时、分、秒等
- **表格**: 空数据提示等
- **对话框**: 确认、取消按钮等
- **消息提示**: 成功、警告、错误等
- **上传组件**: 上传提示等

## 🔧 配置说明

### Element Plus 语言包

Element Plus 支持多种语言，通过导入对应的语言包即可：

```typescript
// 中文简体
import zhCn from 'element-plus/dist/locale/zh-cn.mjs'

// 中文繁体
import zhTw from 'element-plus/dist/locale/zh-tw.mjs'

// 英文
import en from 'element-plus/dist/locale/en.mjs'

// 日文
import ja from 'element-plus/dist/locale/ja.mjs'
```

### 使用方式

```typescript
import ElementPlus from 'element-plus'
import zhCn from 'element-plus/dist/locale/zh-cn.mjs'

app.use(ElementPlus, {
  locale: zhCn,
})
```

## 🎨 分页组件增强

### 添加的属性

1. **prev-text**: 上一页按钮文字
2. **next-text**: 下一页按钮文字
3. **background**: 添加背景色，提升视觉效果

### 完整配置示例

```vue
<el-pagination
  v-model:current-page="currentPage"
  v-model:page-size="pageSize"
  :page-sizes="[10, 20, 50, 100]"
  :total="total"
  layout="total, sizes, prev, pager, next, jumper"
  :prev-text="'上一页'"
  :next-text="'下一页'"
  background
  @size-change="handleSizeChange"
  @current-change="handlePageChange"
/>
```

### Layout 选项说明

- **total**: 显示总条数
- **sizes**: 显示每页条数选择器
- **prev**: 显示上一页按钮
- **pager**: 显示页码
- **next**: 显示下一页按钮
- **jumper**: 显示跳转输入框

## 🧪 测试验证

### 1. 提醒列表页面
访问: http://localhost:5173/notifications

**检查项**:
- [ ] 分页显示"共 X 条"
- [ ] 显示"X 条/页"
- [ ] 显示"上一页"、"下一页"
- [ ] 显示"前往 X 页"
- [ ] 分页背景色正常

### 2. 超期预警页面
访问: http://localhost:5173/notifications/alerts

**检查项**:
- [ ] 分页显示"共 X 条"
- [ ] 显示"X 条/页"
- [ ] 显示"上一页"、"下一页"
- [ ] 显示"前往 X 页"
- [ ] 分页背景色正常

### 3. 其他组件
检查其他使用 Element Plus 组件的页面：

- [ ] 日期选择器显示中文月份
- [ ] 时间选择器显示中文
- [ ] 表格空数据显示中文
- [ ] 对话框按钮显示中文

## 📚 相关文档

- [Element Plus 国际化文档](https://element-plus.org/zh-CN/guide/i18n.html)
- [Element Plus 分页组件](https://element-plus.org/zh-CN/component/pagination.html)

## 💡 最佳实践

### 1. 统一配置
在 main.ts 中统一配置语言包，避免在每个组件中单独配置。

### 2. 动态切换语言
如果需要支持多语言切换：

```typescript
import { ref } from 'vue'
import zhCn from 'element-plus/dist/locale/zh-cn.mjs'
import en from 'element-plus/dist/locale/en.mjs'

const locale = ref(zhCn)

// 切换语言
const switchLanguage = (lang: 'zh-cn' | 'en') => {
  locale.value = lang === 'zh-cn' ? zhCn : en
}

app.use(ElementPlus, {
  locale: locale.value,
})
```

### 3. 自定义文案
如果需要自定义某些文案：

```typescript
import zhCn from 'element-plus/dist/locale/zh-cn.mjs'

const customLocale = {
  ...zhCn,
  el: {
    ...zhCn.el,
    pagination: {
      ...zhCn.el.pagination,
      goto: '跳转到',
      pagesize: '每页显示',
    }
  }
}

app.use(ElementPlus, {
  locale: customLocale,
})
```

## ✅ 修改完成

- [x] 配置 Element Plus 中文语言包
- [x] 优化提醒列表分页组件
- [x] 优化超期预警分页组件
- [x] 添加分页背景色
- [x] 重启前端服务

---

**修改时间**: 2025-11-21
**修改状态**: ✅ 已完成
**影响范围**: 全局 Element Plus 组件
**测试状态**: 待验证
