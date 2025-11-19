# 智能案管系统设计文档（简化版）

## 概述

智能案管系统是一个法律案件全生命周期管理平台。考虑到本地开发环境限制，采用轻量级技术栈，实现零配置快速启动。

### 设计目标

- **快速启动**: 无需复杂的环境配置，开箱即用
- **功能完整**: 覆盖案件管理核心功能
- **易于扩展**: 预留接口，便于后期升级
- **用户友好**: 简洁直观的操作界面

### 技术栈选型

**前端**:
- Vue 3 (Composition API)
- TypeScript
- Element Plus (UI 组件库)
- Vue Router (路由管理)
- Pinia (状态管理)
- Axios (HTTP 客户端)

**后端**:
- Express.js (轻量级 Web 框架)
- SQLite3 (嵌入式数据库，无需配置)
- Multer (文件上传处理)
- JSON Web Token (JWT 认证)

**开发环境**:
- Node.js 16.x
- npm 8.x

**技术栈优势**:
- 零配置启动，无需安装数据库服务
- 轻量级，适合快速开发
- 完整的前后端分离架构
- 数据存储在本地文件，便于演示

## 系统架构

### 整体架构

```
┌─────────────────────────────────────────┐
│           前端应用 (Vue 3)               │
│  ┌─────────┬─────────┬─────────────┐   │
│  │案件管理 │证据管理 │流程管理     │   │
│  ├─────────┼─────────┼─────────────┤   │
│  │文书处理 │成本核算 │提醒预警     │   │
│  ├─────────┼─────────┼─────────────┤   │
│  │协同管理 │数据分析 │归档管理     │   │
│  └─────────┴─────────┴─────────────┘   │
└─────────────────────────────────────────┘
                    ↓ HTTP/REST API
┌─────────────────────────────────────────┐
│         后端服务 (Express.js)            │
│  ┌─────────────────────────────────┐   │
│  │      API 路由层                  │   │
│  ├─────────────────────────────────┤   │
│  │      业务逻辑层                  │   │
│  ├─────────────────────────────────┤   │
│  │      数据访问层                  │   │
│  └─────────────────────────────────┘   │
└─────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────┐
│           数据存储层                     │
│  ┌──────────────┬──────────────────┐   │
│  │ SQLite 数据库 │  本地文件存储    │   │
│  │ (案件/成本等) │  (证据/文书)     │   │
│  └──────────────┴──────────────────┘   │
└─────────────────────────────────────────┘
```

## 数据模型设计

### 核心数据表

**1. 案件表 (cases)**
```sql
CREATE TABLE cases (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  case_number VARCHAR(100) UNIQUE,
  internal_number VARCHAR(100) UNIQUE,
  case_type VARCHAR(50),
  case_cause VARCHAR(200),
  court VARCHAR(200),
  target_amount DECIMAL(15,2),
  filing_date DATE,
  status VARCHAR(50),
  team_id INTEGER,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

**2. 诉讼主体表 (litigation_parties)**
```sql
CREATE TABLE litigation_parties (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  case_id INTEGER,
  party_type VARCHAR(50),
  entity_type VARCHAR(50),
  name VARCHAR(200),
  unified_credit_code VARCHAR(100),
  legal_representative VARCHAR(100),
  id_number VARCHAR(50),
  contact_phone VARCHAR(50),
  contact_email VARCHAR(100),
  address TEXT,
  FOREIGN KEY (case_id) REFERENCES cases(id)
);
```

**3. 流程节点表 (process_nodes)**
```sql
CREATE TABLE process_nodes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  case_id INTEGER,
  node_type VARCHAR(50),
  node_name VARCHAR(100),
  handler VARCHAR(100),
  start_time DATETIME,
  deadline DATETIME,
  completion_time DATETIME,
  status VARCHAR(50),
  progress TEXT,
  node_order INTEGER,
  FOREIGN KEY (case_id) REFERENCES cases(id)
);
```

**4. 证据表 (evidence)**
```sql
CREATE TABLE evidence (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  case_id INTEGER,
  file_name VARCHAR(255),
  file_type VARCHAR(50),
  file_size INTEGER,
  storage_path VARCHAR(500),
  category VARCHAR(50),
  tags TEXT,
  uploaded_by VARCHAR(100),
  uploaded_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  version INTEGER DEFAULT 1,
  FOREIGN KEY (case_id) REFERENCES cases(id)
);
```

**5. 文书表 (documents)**
```sql
CREATE TABLE documents (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  case_id INTEGER,
  document_type VARCHAR(50),
  file_name VARCHAR(255),
  storage_path VARCHAR(500),
  extracted_content TEXT,
  uploaded_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (case_id) REFERENCES cases(id)
);
```

**6. 成本记录表 (cost_records)**
```sql
CREATE TABLE cost_records (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  case_id INTEGER,
  cost_type VARCHAR(50),
  amount DECIMAL(15,2),
  payment_date DATE,
  payment_method VARCHAR(50),
  voucher_number VARCHAR(100),
  payer VARCHAR(100),
  payee VARCHAR(100),
  status VARCHAR(50),
  due_date DATE,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (case_id) REFERENCES cases(id)
);
```

**7. 提醒任务表 (notification_tasks)**
```sql
CREATE TABLE notification_tasks (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  related_id INTEGER,
  related_type VARCHAR(50),
  task_type VARCHAR(50),
  scheduled_time DATETIME,
  content TEXT,
  status VARCHAR(50),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

**8. 用户表 (users)**
```sql
CREATE TABLE users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username VARCHAR(100) UNIQUE,
  password VARCHAR(255),
  real_name VARCHAR(100),
  email VARCHAR(100),
  role VARCHAR(50),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

## 目录结构设计

```
legal-case-management/
├── frontend/                    # 前端项目
│   ├── public/
│   ├── src/
│   │   ├── assets/             # 静态资源
│   │   ├── components/         # 公共组件
│   │   ├── views/              # 页面视图
│   │   │   ├── case/           # 案件管理
│   │   │   ├── evidence/       # 证据管理
│   │   │   ├── process/        # 流程管理
│   │   │   ├── document/       # 文书管理
│   │   │   ├── cost/           # 成本管理
│   │   │   ├── notification/   # 提醒管理
│   │   │   ├── collaboration/  # 协同管理
│   │   │   ├── analytics/      # 数据分析
│   │   │   └── archive/        # 归档管理
│   │   ├── router/             # 路由配置
│   │   ├── stores/             # 状态管理
│   │   ├── api/                # API 接口
│   │   ├── utils/              # 工具函数
│   │   ├── types/              # TypeScript 类型
│   │   ├── App.vue
│   │   └── main.ts
│   ├── package.json
│   ├── vite.config.ts
│   └── tsconfig.json
│
├── backend/                     # 后端项目
│   ├── src/
│   │   ├── routes/             # 路由定义
│   │   │   ├── case.js         # 案件路由
│   │   │   ├── evidence.js     # 证据路由
│   │   │   ├── document.js     # 文书路由
│   │   │   ├── cost.js         # 成本路由
│   │   │   ├── notification.js # 提醒路由
│   │   │   └── auth.js         # 认证路由
│   │   ├── controllers/        # 控制器
│   │   ├── services/           # 业务逻辑
│   │   ├── models/             # 数据模型
│   │   ├── middleware/         # 中间件
│   │   ├── utils/              # 工具函数
│   │   ├── config/             # 配置文件
│   │   └── app.js              # 应用入口
│   ├── database/               # 数据库文件
│   │   └── legal_case.db       # SQLite 数据库
│   ├── uploads/                # 上传文件存储
│   │   ├── evidence/           # 证据文件
│   │   └── documents/          # 文书文件
│   ├── package.json
│   └── .env
│
└── README.md                    # 项目说明
```

## API 接口设计

### 认证接口

- `POST /api/auth/login` - 用户登录
- `POST /api/auth/register` - 用户注册
- `GET /api/auth/profile` - 获取用户信息

### 案件管理接口

- `POST /api/cases` - 创建案件
- `GET /api/cases` - 获取案件列表
- `GET /api/cases/:id` - 获取案件详情
- `PUT /api/cases/:id` - 更新案件信息
- `DELETE /api/cases/:id` - 删除案件

### 诉讼主体接口

- `POST /api/cases/:caseId/parties` - 添加诉讼主体
- `GET /api/cases/:caseId/parties` - 获取诉讼主体列表
- `PUT /api/parties/:id` - 更新诉讼主体
- `DELETE /api/parties/:id` - 删除诉讼主体

### 流程节点接口

- `POST /api/cases/:caseId/nodes` - 创建流程节点
- `GET /api/cases/:caseId/nodes` - 获取流程节点列表
- `PUT /api/nodes/:id` - 更新节点状态
- `DELETE /api/nodes/:id` - 删除节点

### 证据管理接口

- `POST /api/evidence/upload` - 上传证据文件
- `GET /api/cases/:caseId/evidence` - 获取证据列表
- `GET /api/evidence/:id` - 获取证据详情
- `GET /api/evidence/:id/download` - 下载证据文件
- `DELETE /api/evidence/:id` - 删除证据

### 文书管理接口

- `POST /api/documents/upload` - 上传文书
- `GET /api/cases/:caseId/documents` - 获取文书列表
- `GET /api/documents/:id` - 获取文书详情
- `GET /api/documents/:id/download` - 下载文书

### 成本管理接口

- `POST /api/costs` - 创建成本记录
- `GET /api/cases/:caseId/costs` - 获取成本列表
- `PUT /api/costs/:id` - 更新成本记录
- `DELETE /api/costs/:id` - 删除成本记录
- `POST /api/costs/calculate` - 费用计算

### 提醒管理接口

- `GET /api/notifications` - 获取提醒列表
- `PUT /api/notifications/:id/read` - 标记已读

### 数据分析接口

- `GET /api/analytics/dashboard` - 获取驾驶舱数据
- `GET /api/analytics/cases/statistics` - 案件统计

## 前端页面设计

### 主要页面模块

**1. 登录页面** (`/login`)
- 用户名密码登录
- 记住登录状态

**2. 首页/驾驶舱** (`/dashboard`)
- 案件总览统计
- 待办事项提醒
- 数据可视化图表

**3. 案件管理** (`/cases`)
- 案件列表（支持筛选、搜索）
- 案件详情页
- 创建/编辑案件表单
- 诉讼主体管理

**4. 流程管理** (`/cases/:id/process`)
- 可视化时间轴
- 节点状态展示
- 节点详情编辑

**5. 证据管理** (`/cases/:id/evidence`)
- 证据列表
- 文件上传
- 在线预览
- 分类标签管理

**6. 文书管理** (`/cases/:id/documents`)
- 文书列表
- 文书上传
- 文书分类

**7. 成本管理** (`/cases/:id/costs`)
- 成本记录列表
- 费用计算器
- 成本统计图表

**8. 提醒中心** (`/notifications`)
- 提醒列表
- 提醒详情

**9. 数据分析** (`/analytics`)
- 可视化驾驶舱
- 案件统计报表

## 核心功能实现要点

### 1. 文件上传处理

使用 Multer 中间件处理文件上传，文件存储在本地 `uploads/` 目录：

```javascript
const multer = require('multer');
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/evidence/');
  },
  filename: (req, file, cb) => {
    const uniqueName = Date.now() + '-' + file.originalname;
    cb(null, uniqueName);
  }
});
const upload = multer({ storage });
```

### 2. JWT 认证

使用 JWT 进行用户认证：

```javascript
const jwt = require('jsonwebtoken');

// 生成 token
const token = jwt.sign({ userId: user.id }, 'secret_key', { expiresIn: '24h' });

// 验证 token 中间件
const authMiddleware = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Unauthorized' });
  
  try {
    const decoded = jwt.verify(token, 'secret_key');
    req.userId = decoded.userId;
    next();
  } catch (error) {
    res.status(401).json({ error: 'Invalid token' });
  }
};
```

### 3. 数据库操作

使用 SQLite3 进行数据库操作：

```javascript
const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./database/legal_case.db');

// 查询示例
db.all('SELECT * FROM cases WHERE status = ?', ['active'], (err, rows) => {
  if (err) throw err;
  console.log(rows);
});
```

### 4. 费用计算器

实现诉讼费、律师费等计算逻辑：

```javascript
// 诉讼费计算（简化版）
function calculateLitigationFee(targetAmount, caseType) {
  if (caseType === '财产案件') {
    if (targetAmount <= 10000) return 50;
    if (targetAmount <= 100000) return targetAmount * 0.025;
    // 更多分段计算...
  }
  return 0;
}
```

### 5. 提醒调度

使用定时任务检查并发送提醒：

```javascript
const cron = require('node-cron');

// 每天检查一次待发送的提醒
cron.schedule('0 9 * * *', () => {
  checkAndSendNotifications();
});
```

## 开发和部署

### 开发环境启动

**后端启动**:
```bash
cd backend
npm install
npm run dev
```

**前端启动**:
```bash
cd frontend
npm install
npm run dev
```

### 生产环境部署

**后端**:
```bash
cd backend
npm install --production
npm start
```

**前端**:
```bash
cd frontend
npm install
npm run build
# 将 dist 目录部署到 Web 服务器
```

## 后期扩展方向

1. **数据库升级**: 从 SQLite 迁移到 PostgreSQL/MySQL
2. **AI 功能集成**: 对接 OCR 和 NLP 服务
3. **云存储**: 文件存储迁移到 OSS/S3
4. **消息推送**: 集成短信、邮件服务
5. **移动端**: 开发移动应用
6. **权限细化**: 实现更细粒度的权限控制
