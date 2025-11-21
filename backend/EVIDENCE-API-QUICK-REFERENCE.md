# 证据管理 API 快速参考

## API 端点总览

### 基础证据管理

| 方法 | 端点 | 描述 | 日志记录 |
|------|------|------|----------|
| POST | `/api/evidence/upload` | 上传证据文件 | ✗ |
| GET | `/api/cases/:caseId/evidence` | 获取案件证据列表 | ✗ |
| GET | `/api/evidence/:id` | 获取证据详情 | ✓ (view) |
| GET | `/api/evidence/:id/download` | 下载证据文件 | ✓ (download) |
| PUT | `/api/evidence/:id` | 更新证据信息 | ✓ (update) |
| DELETE | `/api/evidence/:id` | 删除证据 | ✓ (delete) |

### 版本控制

| 方法 | 端点 | 描述 | 日志记录 |
|------|------|------|----------|
| POST | `/api/evidence/:id/version` | 上传新版本 | ✓ (upload_version) |
| GET | `/api/evidence/:id/versions` | 获取版本历史 | ✗ |
| GET | `/api/evidence/:id/versions/:version/download` | 下载特定版本 | ✓ (download_version) |

### 操作日志

| 方法 | 端点 | 描述 |
|------|------|------|
| GET | `/api/evidence/:id/logs` | 获取证据操作日志 |
| GET | `/api/cases/:caseId/evidence/logs` | 获取案件证据日志 |

## 请求示例

### 1. 上传证据

```javascript
const formData = new FormData();
formData.append('file', fileInput.files[0]);
formData.append('case_id', '1');
formData.append('category', '书证');
formData.append('tags', '合同,协议');

fetch('/api/evidence/upload', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`
  },
  body: formData
});
```

**响应:**
```json
{
  "message": "证据上传成功",
  "evidence": {
    "id": 1,
    "case_id": 1,
    "file_name": "contract.pdf",
    "file_type": "application/pdf",
    "file_size": 102400,
    "category": "书证",
    "tags": "合同,协议",
    "version": 1,
    "uploaded_by": "testuser",
    "uploaded_at": "2024-01-01T10:00:00.000Z"
  }
}
```

### 2. 获取证据列表

```javascript
fetch('/api/cases/1/evidence?category=书证&file_type=application/pdf', {
  headers: {
    'Authorization': `Bearer ${token}`
  }
});
```

**响应:**
```json
{
  "count": 2,
  "evidence": [
    {
      "id": 1,
      "file_name": "contract.pdf",
      "category": "书证",
      "version": 2
    },
    {
      "id": 2,
      "file_name": "agreement.pdf",
      "category": "书证",
      "version": 1
    }
  ]
}
```

### 3. 更新证据信息

```javascript
fetch('/api/evidence/1', {
  method: 'PUT',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    category: '物证',
    tags: '合同,协议,重要'
  })
});
```

### 4. 上传新版本

```javascript
const formData = new FormData();
formData.append('file', newVersionFile);

fetch('/api/evidence/1/version', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`
  },
  body: formData
});
```

**响应:**
```json
{
  "message": "证据新版本上传成功",
  "evidence": {
    "id": 1,
    "version": 2,
    "file_name": "contract-v2.pdf",
    "uploaded_by": "testuser"
  }
}
```

### 5. 获取版本历史

```javascript
fetch('/api/evidence/1/versions', {
  headers: {
    'Authorization': `Bearer ${token}`
  }
});
```

**响应:**
```json
{
  "current": {
    "id": 1,
    "version": 2,
    "file_name": "contract-v2.pdf",
    "is_current": true
  },
  "history": [
    {
      "id": 1,
      "evidence_id": 1,
      "version": 1,
      "file_name": "contract.pdf",
      "uploaded_at": "2024-01-01T10:00:00.000Z"
    }
  ],
  "total_versions": 2
}
```

### 6. 获取操作日志

```javascript
fetch('/api/evidence/1/logs?limit=50&offset=0', {
  headers: {
    'Authorization': `Bearer ${token}`
  }
});
```

**响应:**
```json
{
  "evidence_id": 1,
  "logs": [
    {
      "id": 5,
      "operation_type": "download",
      "operator": "testuser",
      "operation_time": "2024-01-01T12:00:00.000Z",
      "ip_address": "127.0.0.1"
    },
    {
      "id": 4,
      "operation_type": "update",
      "operator": "testuser",
      "operation_time": "2024-01-01T11:30:00.000Z",
      "details": "{\"updated_fields\":[\"category\",\"tags\"]}"
    }
  ],
  "stats": [
    { "operation_type": "view", "count": 3 },
    { "operation_type": "download", "count": 2 },
    { "operation_type": "update", "count": 1 }
  ],
  "count": 2
}
```

## 支持的文件类型

### PDF
- `application/pdf`

### 图片
- `image/jpeg`, `image/jpg`
- `image/png`
- `image/gif`
- `image/bmp`
- `image/webp`

### 音频
- `audio/mpeg`, `audio/mp3`
- `audio/wav`
- `audio/ogg`
- `audio/aac`
- `audio/m4a`

### 视频
- `video/mp4`
- `video/mpeg`
- `video/quicktime`
- `video/x-msvideo`
- `video/x-ms-wmv`
- `video/webm`

## 错误代码

| 状态码 | 错误信息 | 说明 |
|--------|----------|------|
| 400 | 请选择要上传的文件 | 未提供文件 |
| 400 | 案件 ID 不能为空 | 缺少必需参数 |
| 400 | 不支持的文件类型 | 文件类型不在允许列表中 |
| 401 | Unauthorized | 未提供或无效的认证令牌 |
| 404 | 证据不存在 | 指定的证据 ID 不存在 |
| 404 | 证据文件不存在 | 文件已被删除或移动 |
| 500 | 上传证据失败 | 服务器内部错误 |

## 数据模型

### Evidence (证据)
```javascript
{
  id: INTEGER,
  case_id: INTEGER,
  file_name: STRING,
  file_type: STRING,
  file_size: INTEGER,
  storage_path: STRING,
  category: STRING,
  tags: STRING,
  uploaded_by: STRING,
  uploaded_at: DATETIME,
  version: INTEGER,
  parent_id: INTEGER
}
```

### EvidenceVersion (证据版本)
```javascript
{
  id: INTEGER,
  evidence_id: INTEGER,
  version: INTEGER,
  file_name: STRING,
  file_type: STRING,
  file_size: INTEGER,
  storage_path: STRING,
  category: STRING,
  tags: STRING,
  uploaded_by: STRING,
  uploaded_at: DATETIME
}
```

### EvidenceOperationLog (操作日志)
```javascript
{
  id: INTEGER,
  evidence_id: INTEGER,
  operation_type: STRING,  // view, download, update, delete, upload_version, download_version
  operator: STRING,
  operation_time: DATETIME,
  ip_address: STRING,
  details: STRING  // JSON
}
```

## 配置

### 文件上传限制
- 最大文件大小: 100MB
- 存储路径: `backend/uploads/evidence/`
- 文件命名格式: `{timestamp}-{random}-{sanitized-filename}.{ext}`

### 日志配置
- 自动记录的操作: view, download, update, delete, upload_version, download_version
- 不记录的操作: upload (初次上传), 获取列表, 获取版本历史, 查询日志

## 注意事项

1. **认证**: 所有接口都需要在请求头中包含有效的 JWT token
2. **文件清理**: 删除证据时会同时删除物理文件
3. **版本保留**: 上传新版本时，旧版本文件会被保留
4. **日志异步**: 操作日志记录是异步的，不会影响主业务流程
5. **IP 地址**: 操作日志会记录客户端 IP 地址
6. **文件名安全**: 上传的文件名会被清理，移除特殊字符
