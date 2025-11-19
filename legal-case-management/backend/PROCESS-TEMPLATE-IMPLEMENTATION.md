# 流程模板管理功能实现说明

## 功能概述

流程模板管理功能允许系统管理员创建、管理和应用流程模板到案件中。该功能支持为不同类型的案件（民事、刑事、行政、劳动仲裁）定义标准化的流程节点，并自动应用到新创建的案件中。

## 已实现的功能

### 1. 默认流程模板

系统预置了4个默认流程模板：

#### 民事案件标准流程（8个节点）
1. 立案受理 - 7天
2. 送达起诉状副本 - 5天
3. 被告答辩 - 15天
4. 举证期限 - 30天
5. 庭前准备 - 3天
6. 开庭审理 - 0天
7. 宣判 - 30天
8. 送达判决书 - 5天

#### 刑事案件标准流程（8个节点）
1. 立案侦查 - 30天
2. 侦查终结 - 60天
3. 审查起诉 - 30天
4. 提起公诉 - 7天
5. 法院受理 - 7天
6. 开庭审理 - 30天
7. 宣判 - 30天
8. 判决执行 - 10天

#### 行政案件标准流程（8个节点）
1. 立案审查 - 7天
2. 立案受理 - 3天
3. 送达起诉状副本 - 5天
4. 被告答辩 - 15天
5. 举证期限 - 30天
6. 开庭审理 - 0天
7. 宣判 - 45天
8. 送达判决书 - 10天

#### 劳动仲裁标准流程（8个节点）
1. 提交仲裁申请 - 1天
2. 仲裁受理 - 5天
3. 送达申请书副本 - 5天
4. 被申请人答辩 - 10天
5. 开庭审理 - 15天
6. 调解 - 7天
7. 作出裁决 - 30天
8. 送达裁决书 - 5天

### 2. 流程模板 CRUD 操作

#### 创建模板
- **接口**: `POST /api/templates`
- **功能**: 创建自定义流程模板，可以指定模板名称、案件类型、描述和节点列表
- **支持**: 同时创建模板和模板节点

#### 获取模板列表
- **接口**: `GET /api/templates`
- **功能**: 获取所有流程模板或按案件类型筛选
- **参数**: `case_type` (可选) - 按案件类型筛选

#### 获取模板详情
- **接口**: `GET /api/templates/:id`
- **功能**: 获取指定模板的详细信息，包括所有节点

#### 更新模板
- **接口**: `PUT /api/templates/:id`
- **功能**: 更新模板基本信息和节点列表
- **支持**: 完全替换节点列表

#### 删除模板
- **接口**: `DELETE /api/templates/:id`
- **功能**: 删除指定模板及其所有节点（级联删除）

### 3. 应用模板到案件

#### 自动应用默认模板
- **接口**: `POST /api/templates/apply/:caseId`
- **参数**: `case_type` - 案件类型
- **功能**: 根据案件类型自动选择并应用默认模板

#### 应用指定模板
- **接口**: `POST /api/templates/apply/:caseId`
- **参数**: `template_id` - 模板ID, `case_type` - 案件类型
- **功能**: 应用指定的模板到案件

#### 节点创建逻辑
- 根据模板节点的 `deadline_days` 自动计算每个节点的截止日期
- 所有节点初始状态为 `pending`
- 保持节点顺序（`node_order`）

### 4. 默认模板初始化

- **接口**: `POST /api/templates/initialize`
- **功能**: 初始化系统默认的4个流程模板
- **自动执行**: 在数据库初始化时自动执行（`init-db.js`）
- **幂等性**: 如果模板已存在，跳过初始化

## 数据库设计

### process_templates 表
```sql
CREATE TABLE process_templates (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  template_name VARCHAR(100) NOT NULL,
  case_type VARCHAR(50) NOT NULL,
  description TEXT,
  is_default BOOLEAN DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

### process_template_nodes 表
```sql
CREATE TABLE process_template_nodes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  template_id INTEGER NOT NULL,
  node_type VARCHAR(50) NOT NULL,
  node_name VARCHAR(100) NOT NULL,
  deadline_days INTEGER,
  node_order INTEGER NOT NULL,
  description TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (template_id) REFERENCES process_templates(id) ON DELETE CASCADE
);
```

## 代码结构

### 模型层 (Models)
- **文件**: `src/models/ProcessTemplate.js`
- **类**: 
  - `ProcessTemplate` - 流程模板数据访问
  - `ProcessTemplateNode` - 流程模板节点数据访问

### 服务层 (Services)
- **文件**: `src/services/processTemplateService.js`
- **功能**:
  - 默认模板初始化
  - 应用模板到案件
  - 获取模板详情（包含节点）

### 控制器层 (Controllers)
- **文件**: `src/controllers/processTemplateController.js`
- **接口**:
  - `createTemplate` - 创建模板
  - `getTemplates` - 获取模板列表
  - `getTemplateById` - 获取模板详情
  - `updateTemplate` - 更新模板
  - `deleteTemplate` - 删除模板
  - `applyTemplateToCase` - 应用模板到案件
  - `initializeDefaultTemplates` - 初始化默认模板

### 路由层 (Routes)
- **文件**: `src/routes/processTemplate.js`
- **基础路径**: `/api/templates`

## 测试验证

### 测试脚本
- **文件**: `test-process-template.js`
- **测试内容**:
  1. 用户登录认证
  2. 获取所有流程模板
  3. 按案件类型筛选模板
  4. 获取模板详情（包含节点）
  5. 创建自定义模板
  6. 更新模板
  7. 创建测试案件
  8. 应用默认模板到案件
  9. 应用指定模板到案件
  10. 删除模板
  11. 验证删除结果

### 测试结果
✅ 所有测试通过
- 4个默认模板成功创建
- 模板 CRUD 操作正常
- 模板应用到案件功能正常
- 节点自动创建和截止日期计算正确

## 使用示例

### 1. 初始化数据库和默认模板
```bash
node init-db.js
```

### 2. 获取所有民事案件模板
```javascript
GET /api/templates?case_type=民事
Authorization: Bearer <token>
```

### 3. 创建自定义模板
```javascript
POST /api/templates
Authorization: Bearer <token>
Content-Type: application/json

{
  "template_name": "简易民事案件流程",
  "case_type": "民事",
  "description": "简易程序民事案件流程",
  "is_default": 0,
  "nodes": [
    {
      "node_type": "立案",
      "node_name": "立案受理",
      "deadline_days": 3,
      "node_order": 1,
      "description": "简易程序立案"
    },
    {
      "node_type": "开庭",
      "node_name": "开庭审理",
      "deadline_days": 15,
      "node_order": 2,
      "description": "简易程序开庭"
    }
  ]
}
```

### 4. 应用默认模板到案件
```javascript
POST /api/templates/apply/123
Authorization: Bearer <token>
Content-Type: application/json

{
  "case_type": "民事"
}
```

### 5. 应用指定模板到案件
```javascript
POST /api/templates/apply/123
Authorization: Bearer <token>
Content-Type: application/json

{
  "template_id": 5,
  "case_type": "民事"
}
```

## 注意事项

1. **默认模板**: 每个案件类型只能有一个默认模板（`is_default = 1`）
2. **级联删除**: 删除模板时会自动删除所有关联的模板节点
3. **节点顺序**: 节点按 `node_order` 字段排序
4. **截止日期**: 从当前日期开始计算，加上 `deadline_days` 天数
5. **认证要求**: 所有接口都需要 JWT 认证

## 后续扩展建议

1. **模板版本控制**: 支持模板版本管理，保留历史版本
2. **模板共享**: 支持团队间共享模板
3. **模板导入导出**: 支持 JSON 格式的模板导入导出
4. **节点依赖关系**: 支持节点间的依赖关系定义
5. **条件节点**: 支持根据条件动态添加或跳过节点
6. **模板统计**: 统计模板使用频率和效果

## 相关文件

- `src/models/ProcessTemplate.js` - 模板数据模型
- `src/services/processTemplateService.js` - 模板业务逻辑
- `src/controllers/processTemplateController.js` - 模板控制器
- `src/routes/processTemplate.js` - 模板路由
- `src/config/initDatabase.js` - 数据库初始化
- `init-db.js` - 数据库初始化脚本
- `test-process-template.js` - 功能测试脚本
