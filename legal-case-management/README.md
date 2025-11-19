# 智能案管系统 (Legal Case Management System)

## 项目简介

智能案管系统是一个法律案件全生命周期管理平台，旨在帮助律师事务所和法务团队高效管理案件、证据、文书、成本等核心业务。系统采用前后端分离架构，提供直观的用户界面和完善的功能模块。

## 核心功能

- **案件管理**: 案件信息录入、诉讼主体管理、案件状态跟踪
- **流程管理**: 可视化流程时间轴、节点状态监控、流程模板配置
- **证据管理**: 证据文件上传、分类标签、在线预览、版本控制
- **文书管理**: 文书上传归档、模板生成、OCR 识别（预留）
- **成本管理**: 费用记录、诉讼费/律师费计算器、成本分析
- **提醒预警**: 节点超期预警、费用支付提醒、自定义提醒规则
- **协同管理**: 团队协作、任务分配、权限控制
- **数据分析**: 可视化驾驶舱、律师评价、类案检索（预留）
- **归档管理**: 结案报告、案件归档、案例知识库

## 技术栈

### 前端
- **框架**: Vue 3 (Composition API)
- **语言**: TypeScript
- **UI 组件**: Element Plus
- **路由**: Vue Router
- **状态管理**: Pinia
- **HTTP 客户端**: Axios
- **图表**: ECharts
- **构建工具**: Vite

### 后端
- **框架**: Express.js
- **数据库**: SQLite3 (嵌入式，零配置)
- **文件上传**: Multer
- **认证**: JSON Web Token (JWT)
- **密码加密**: bcryptjs
- **跨域**: cors
- **环境变量**: dotenv

## 项目结构

```
legal-case-management/
├── frontend/                    # 前端项目
│   ├── public/                 # 静态资源
│   ├── src/
│   │   ├── assets/            # 资源文件
│   │   ├── components/        # 公共组件
│   │   ├── views/             # 页面视图
│   │   ├── router/            # 路由配置
│   │   ├── stores/            # 状态管理
│   │   ├── api/               # API 接口
│   │   ├── utils/             # 工具函数
│   │   ├── types/             # TypeScript 类型
│   │   ├── App.vue
│   │   └── main.ts
│   ├── package.json
│   ├── vite.config.ts
│   └── tsconfig.json
│
├── backend/                     # 后端项目
│   ├── src/
│   │   ├── routes/            # 路由定义
│   │   ├── controllers/       # 控制器
│   │   ├── services/          # 业务逻辑
│   │   ├── models/            # 数据模型
│   │   ├── middleware/        # 中间件
│   │   ├── utils/             # 工具函数
│   │   ├── config/            # 配置文件
│   │   └── app.js             # 应用入口
│   ├── database/              # 数据库文件
│   ├── uploads/               # 上传文件存储
│   ├── package.json
│   └── .env
│
└── README.md                    # 项目说明
```

## 快速开始

### 环境要求

- Node.js >= 16.x
- npm >= 8.x

### 安装依赖

**后端**:
```bash
cd backend
npm install
```

**前端**:
```bash
cd frontend
npm install
```

### 开发环境启动

**启动后端服务** (默认端口: 3000):
```bash
cd backend
npm run dev
```

**启动前端服务** (默认端口: 5173):
```bash
cd frontend
npm run dev
```

访问 http://localhost:5173 即可使用系统。

### 生产环境部署

**构建前端**:
```bash
cd frontend
npm run build
```

**启动后端**:
```bash
cd backend
npm install --production
npm start
```

## 默认账号

系统初始化后会创建默认管理员账号：

- 用户名: `admin`
- 密码: `admin123`

**请在首次登录后立即修改密码！**

## 主要特性

### 零配置启动
- 使用 SQLite 嵌入式数据库，无需安装配置数据库服务
- 数据文件存储在本地，便于开发和演示
- 开箱即用，快速上手

### 完整的案件管理流程
- 支持民事、刑事、行政、劳动仲裁等多种案件类型
- 可视化流程时间轴，清晰展示案件进展
- 自动计算节点超期状态，及时预警

### 智能费用计算
- 内置诉讼费计算器（按标的额分段计算）
- 律师费计算器（支持标的额比例、固定收费、按时计费）
- 保全费、违约金计算（支持复利）
- 成本统计分析和可视化

### 灵活的提醒系统
- 节点超期自动预警
- 费用支付到期提醒
- 自定义提醒规则和频次
- 支持系统消息推送（预留短信/邮件接口）

### 数据可视化
- 驾驶舱展示关键指标
- 案件类型分布、数量趋势图表
- 成本分析图表
- 律师评价统计

## 开发指南

### API 文档

后端 API 遵循 RESTful 规范，主要接口包括：

- **认证**: `/api/auth/*`
- **案件**: `/api/cases/*`
- **诉讼主体**: `/api/parties/*`
- **流程节点**: `/api/nodes/*`
- **证据**: `/api/evidence/*`
- **文书**: `/api/documents/*`
- **成本**: `/api/costs/*`
- **提醒**: `/api/notifications/*`
- **分析**: `/api/analytics/*`

详细 API 文档请参考 `backend/docs/api.md`（待完善）。

### 数据库结构

系统使用 SQLite 数据库，主要数据表：

- `cases` - 案件表
- `litigation_parties` - 诉讼主体表
- `process_nodes` - 流程节点表
- `evidence` - 证据表
- `documents` - 文书表
- `cost_records` - 成本记录表
- `notification_tasks` - 提醒任务表
- `users` - 用户表

数据库初始化脚本位于 `backend/src/config/database.sql`（待创建）。

## 后期扩展

系统预留了多个扩展接口，便于后期升级：

1. **数据库升级**: 可从 SQLite 迁移到 PostgreSQL/MySQL
2. **AI 功能**: 预留 OCR 识别、类案检索接口
3. **云存储**: 可将文件存储迁移到 OSS/S3
4. **消息推送**: 预留短信、邮件服务接口
5. **移动端**: 可开发配套移动应用
6. **权限细化**: 可实现更细粒度的 RBAC 权限控制

## 贡献指南

欢迎提交 Issue 和 Pull Request！

## 许可证

MIT License

## 联系方式

如有问题或建议，请通过以下方式联系：

- 提交 Issue
- 发送邮件至: [email]

---

**注意**: 本系统为演示版本，使用 SQLite 数据库和本地文件存储。生产环境建议升级到企业级数据库和云存储服务。
