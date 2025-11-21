<<<<<<< HEAD
# 智能案管系统 - 前端

基于 Vue 3 + TypeScript + Element Plus 的法律案件管理系统前端应用。

## 技术栈

- **Vue 3** - 渐进式 JavaScript 框架
- **TypeScript** - JavaScript 的超集
- **Vite** - 下一代前端构建工具
- **Element Plus** - Vue 3 UI 组件库
- **Vue Router** - Vue.js 官方路由
- **Pinia** - Vue 状态管理库
- **Axios** - HTTP 客户端
- **ECharts** - 数据可视化图表库

## 项目结构

```
src/
├── api/              # API 接口定义
├── assets/           # 静态资源
├── components/       # 公共组件
├── router/           # 路由配置
├── stores/           # Pinia 状态管理
├── types/            # TypeScript 类型定义
├── utils/            # 工具函数
├── views/            # 页面视图
│   ├── auth/         # 认证相关页面
│   ├── dashboard/    # 驾驶舱
│   ├── case/         # 案件管理
│   ├── evidence/     # 证据管理
│   ├── process/      # 流程管理
│   ├── document/     # 文书管理
│   ├── cost/         # 成本管理
│   ├── notification/ # 提醒管理
│   ├── collaboration/# 协同管理
│   ├── analytics/    # 数据分析
│   └── archive/      # 归档管理
├── App.vue           # 根组件
└── main.ts           # 应用入口
```

## 开发指南

### 安装依赖

```bash
npm install
```

### 启动开发服务器

```bash
npm run dev
```

访问 http://localhost:5173

### 构建生产版本

```bash
npm run build
```

### 预览生产构建

```bash
npm run preview
```

## 功能特性

- ✅ Vue 3 Composition API
- ✅ TypeScript 类型支持
- ✅ Element Plus 自动导入
- ✅ Vue Router 路由管理
- ✅ Pinia 状态管理
- ✅ Axios 请求封装
- ✅ 路由守卫（认证检查）
- ✅ 请求/响应拦截器

## 配置说明

### Vite 配置

- 自动导入 Element Plus 组件
- 配置路径别名 `@` 指向 `src` 目录
- 配置开发服务器代理，转发 `/api` 请求到后端

### TypeScript 配置

- 严格模式
- 路径映射支持
- Vue 单文件组件类型支持

## 注意事项

1. 确保后端服务运行在 http://localhost:3000
2. 开发时前端运行在 http://localhost:5173
3. API 请求会自动添加 `/api` 前缀并代理到后端
=======
# Vue 3 + TypeScript + Vite

This template should help get you started developing with Vue 3 and TypeScript in Vite. The template uses Vue 3 `<script setup>` SFCs, check out the [script setup docs](https://v3.vuejs.org/api/sfc-script-setup.html#sfc-script-setup) to learn more.

Learn more about the recommended Project Setup and IDE Support in the [Vue Docs TypeScript Guide](https://vuejs.org/guide/typescript/overview.html#project-setup).
>>>>>>> a13d898 (feat: 完整的法律案件管理系统 - 包含AI助手、文书管理、证据管理等完整功能)
