# 证据管理 API 实施总结

## 概述

已完成证据管理 API 的所有功能实现，包括文件上传、证据管理、版本控制和操作日志。

## 实施的功能

### 1. 文件上传功能 (任务 8.1)

**实现内容:**
- 配置 Multer 文件上传中间件
- 支持 PDF、图片、音频、视频格式
- 自动生成唯一文件名
- 文件大小限制 100MB
- 文件类型验证

**API 端点:**
- `POST /api/evidence/upload` - 上传证据文件

**文件存储:**
- 存储路径: `backend/uploads/evidence/`
- 文件命名: `{timestamp}-{random}-{sanitized-filename}.{ext}`

### 2. 证据管理接口 (任务 8.2)

**实现内容:**
- 获取案件证据列表（支持分类和文件类型筛选）
- 获取证据详情
- 下载证据文件
- 更新证据信息（分类、标签）
- 删除证据（同时删除文件）

**API 端点:**
- `GET /api/cases/:caseId/evidence` - 获取案件证据列表
- `GET /api/evidence/:id` - 获取证据详情
- `GET /api/evidence/:id/download` - 下载证据文件
- `PUT /api/evidence/:id` - 更新证据信息
- `DELETE /api/evidence/:id` - 删除证据

### 3. 证据版本控制 (任务 8.3)

**实现内容:**
- 新增 `evidence_versions` 表存储历史版本
- 上传新版本时自动保存旧版本
- 查看所有版本历史
- 下载特定版本的文件

**数据库表:**
```sql
CREATE TABLE evidence_versions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  evidence_id INTEGER NOT NULL,
  version INTEGER NOT NULL,
  file_name VARCHAR(255) NOT NULL,
  file_type VARCHAR(50),
  file_size INTEGER,
  storage_path VARCHAR(500) NOT NULL,
  category VARCHAR(50),
  tags TEXT,
  uploaded_by VARCHAR(100),
  uploaded_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (evidence_id) REFERENCES evidence(id) ON DELETE CASCADE
);
```

**API 端点:**
- `POST /api/evidence/:id/version` - 上传证据新版本
- `GET /api/evidence/:id/versions` - 获取版本历史
- `GET /api/evidence/:id/versions/:version/download` - 下载特定版本

### 4. 证据操作日志 (任务 8.4)

**实现内容:**
- 新增 `evidence_operation_logs` 表记录所有操作
- 自动记录查看、下载、修改、删除等操作
- 记录操作人、时间、IP 地址
- 提供日志查询和统计功能

**数据库表:**
```sql
CREATE TABLE evidence_operation_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  evidence_id INTEGER NOT NULL,
  operation_type VARCHAR(50) NOT NULL,
  operator VARCHAR(100) NOT NULL,
  operation_time DATETIME DEFAULT CURRENT_TIMESTAMP,
  ip_address VARCHAR(50),
  details TEXT,
  FOREIGN KEY (evidence_id) REFERENCES evidence(id) ON DELETE CASCADE
);
```

**操作类型:**
- `view` - 查看证据详情
- `download` - 下载证据文件
- `update` - 更新证据信息
- `delete` - 删除证据
- `upload_version` - 上传新版本
- `download_version` - 下载历史版本

**API 端点:**
- `GET /api/evidence/:id/logs` - 获取证据操作日志
- `GET /api/cases/:caseId/evidence/logs` - 获取案件所有证据的操作日志

## 文件结构

```
backend/
├── src/
│   ├── controllers/
│   │   └── evidenceController.js          # 证据控制器（新增）
│   ├── routes/
│   │   ├── evidence.js                    # 证据路由（新增）
│   │   └── case.js                        # 案件路由（更新）
│   ├── models/
│   │   ├── Evidence.js                    # 证据模型（已存在）
│   │   ├── EvidenceVersion.js             # 证据版本模型（新增）
│   │   └── EvidenceOperationLog.js        # 操作日志模型（新增）
│   ├── middleware/
│   │   └── evidenceLogger.js              # 日志记录中间件（新增）
│   └── config/
│       └── initDatabase.js                # 数据库初始化（更新）
├── uploads/
│   └── evidence/                          # 证据文件存储目录
└── test-evidence-api.js                   # API 测试脚本（新增）
```

## API 使用示例

### 1. 上传证据

```bash
curl -X POST http://localhost:3000/api/evidence/upload \
  -H "Authorization: Bearer {token}" \
  -F "file=@/path/to/file.pdf" \
  -F "case_id=1" \
  -F "category=书证" \
  -F "tags=合同,协议"
```

### 2. 获取案件证据列表

```bash
curl -X GET "http://localhost:3000/api/cases/1/evidence?category=书证" \
  -H "Authorization: Bearer {token}"
```

### 3. 下载证据

```bash
curl -X GET http://localhost:3000/api/evidence/1/download \
  -H "Authorization: Bearer {token}" \
  -o downloaded-file.pdf
```

### 4. 更新证据信息

```bash
curl -X PUT http://localhost:3000/api/evidence/1 \
  -H "Authorization: Bearer {token}" \
  -H "Content-Type: application/json" \
  -d '{"category":"物证","tags":"更新的标签"}'
```

### 5. 上传新版本

```bash
curl -X POST http://localhost:3000/api/evidence/1/version \
  -H "Authorization: Bearer {token}" \
  -F "file=@/path/to/new-version.pdf"
```

### 6. 获取版本历史

```bash
curl -X GET http://localhost:3000/api/evidence/1/versions \
  -H "Authorization: Bearer {token}"
```

### 7. 获取操作日志

```bash
curl -X GET http://localhost:3000/api/evidence/1/logs \
  -H "Authorization: Bearer {token}"
```

## 测试

运行测试脚本验证所有功能:

```bash
# 1. 启动后端服务
cd backend
npm run dev

# 2. 在另一个终端运行测试
node test-evidence-api.js
```

测试脚本会自动执行以下操作:
1. 用户登录
2. 创建测试案件
3. 上传证据文件
4. 获取证据列表
5. 获取证据详情
6. 更新证据信息
7. 上传新版本
8. 获取版本历史
9. 获取操作日志
10. 获取案件证据日志

## 技术要点

### 文件上传处理
- 使用 Multer 中间件处理 multipart/form-data
- 自动创建上传目录
- 文件名清理和唯一化
- 文件类型和大小验证

### 版本控制
- 主表存储当前版本
- 历史表存储所有旧版本
- 版本号自动递增
- 保留所有版本的文件

### 操作日志
- 使用中间件自动记录
- 记录操作类型、操作人、时间、IP
- 支持日志查询和统计
- 不影响主业务流程

### 错误处理
- 文件上传失败时自动清理
- 数据库操作失败时回滚
- 友好的错误提示信息

## 安全考虑

1. **认证授权**: 所有接口都需要 JWT 认证
2. **文件类型验证**: 只允许特定类型的文件上传
3. **文件大小限制**: 限制单个文件最大 100MB
4. **路径安全**: 文件名清理，防止路径遍历攻击
5. **操作审计**: 记录所有操作日志，便于追溯

## 后续优化建议

1. **文件存储**: 考虑迁移到云存储（OSS/S3）
2. **缩略图生成**: 为图片和视频生成缩略图
3. **文件预览**: 实现在线预览功能
4. **批量操作**: 支持批量上传和下载
5. **权限细化**: 实现更细粒度的权限控制
6. **文件加密**: 对敏感证据进行加密存储
7. **自动清理**: 定期清理已删除证据的文件
8. **压缩优化**: 对大文件进行压缩存储

## 相关需求

- 需求 4: 证据管理
- 需求 5: 证据分类和标签
- 需求 6: 证据版本控制和操作日志
- 需求 29: 用户认证和权限管理
