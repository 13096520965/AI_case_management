# 路由系统文档

## 概述

本项目使用 Vue Router 4 实现前端路由管理，支持认证守卫、角色权限控制和页面标题自动设置。

## 文件结构

```
router/
├── index.ts       # 路由配置主文件
├── guards.ts      # 路由守卫实现
├── types.ts       # 路由类型定义
└── README.md      # 本文档
```

## 路由配置

### 已实现的路由

#### 认证路由
- `/login` - 登录页面
- `/register` - 注册页面

#### 主要功能路由
- `/dashboard` - 首页/驾驶舱
- `/cases` - 案件列表
- `/cases/create` - 创建案件
- `/cases/:id` - 案件详情
- `/cases/:id/edit` - 编辑案件
- `/cases/:id/process` - 流程管理
- `/cases/:id/evidence` - 证据管理
- `/cases/:id/documents` - 文书管理
- `/cases/:id/costs` - 成本管理

#### 流程管理
- `/process/templates` - 流程模板管理

#### 文书管理
- `/documents/templates` - 文书模板管理
- `/documents/ocr` - 文书OCR识别

#### 成本管理
- `/costs/calculator` - 费用计算器
- `/costs/analytics` - 成本分析

#### 提醒中心
- `/notifications` - 提醒中心
- `/notifications/rules` - 提醒规则配置
- `/notifications/alerts` - 超期预警

#### 协同管理
- `/collaboration/cases/:id/members` - 协作成员管理
- `/collaboration/cases/:id/tasks` - 协作任务管理

#### 数据分析
- `/analytics` - 数据分析驾驶舱
- `/analytics/lawyers` - 律师评价
- `/analytics/similar-cases` - 类案检索

#### 归档管理
- `/archive/closure-report/:caseId` - 结案报告
- `/archive/search` - 归档检索
- `/archive/knowledge` - 案例知识库

#### 错误页面
- `/:pathMatch(.*)` - 404页面

## 路由守卫

### 认证守卫

所有路由默认需要认证（`requiresAuth: true`），除非明确设置为 `false`。

```typescript
// 需要认证的路由（默认）
{
  path: '/dashboard',
  meta: { requiresAuth: true }
}

// 不需要认证的路由
{
  path: '/login',
  meta: { requiresAuth: false }
}
```

### 角色权限控制

可以通过 `meta.roles` 配置路由的角色权限：

```typescript
{
  path: '/admin',
  meta: { 
    requiresAuth: true,
    roles: ['admin', 'superadmin']
  }
}
```

### 自动重定向

- 未登录用户访问需要认证的页面 → 重定向到 `/login`
- 已登录用户访问登录/注册页面 → 重定向到 `/dashboard`
- 权限不足的用户 → 重定向到 `/dashboard`

### 页面标题

路由守卫会自动设置页面标题，格式为：`页面名称 - 智能案管系统`

可以通过 `meta.title` 自定义页面标题：

```typescript
{
  path: '/custom',
  meta: { title: '自定义页面' }
}
```

## 使用示例

### 编程式导航

```typescript
import { useRouter } from 'vue-router'

const router = useRouter()

// 跳转到案件详情
router.push({ name: 'CaseDetail', params: { id: '123' } })

// 跳转到案件列表并传递查询参数
router.push({ path: '/cases', query: { status: 'active' } })

// 返回上一页
router.back()
```

### 声明式导航

```vue
<template>
  <!-- 使用 name 导航 -->
  <router-link :to="{ name: 'CaseDetail', params: { id: caseId } }">
    查看详情
  </router-link>

  <!-- 使用 path 导航 -->
  <router-link to="/cases">案件列表</router-link>
</template>
```

### 获取路由参数

```typescript
import { useRoute } from 'vue-router'

const route = useRoute()

// 获取路径参数
const caseId = route.params.id

// 获取查询参数
const status = route.query.status
```

## 扩展路由

### 添加新路由

在 `router/index.ts` 中添加新路由：

```typescript
{
  path: '/new-feature',
  name: 'NewFeature',
  component: () => import('@/views/new-feature/NewFeature.vue'),
  meta: { 
    requiresAuth: true,
    title: '新功能',
    roles: ['admin'] // 可选：限制角色
  }
}
```

### 添加嵌套路由

```typescript
{
  path: '/parent',
  component: () => import('@/views/Parent.vue'),
  children: [
    {
      path: 'child',
      component: () => import('@/views/Child.vue')
    }
  ]
}
```

## 注意事项

1. 所有路由组件使用懒加载（`() => import()`）以优化性能
2. 路由切换时会自动滚动到页面顶部
3. 认证状态通过 `useUserStore` 管理
4. Token 存储在 localStorage 中
5. 路由错误会在控制台输出，便于调试

## 相关文件

- `src/stores/user.ts` - 用户状态管理
- `src/views/` - 页面组件目录
- `src/main.ts` - 应用入口，注册路由
