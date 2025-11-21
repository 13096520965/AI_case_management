# 文书上传功能修复总结

## 修复的问题

### 1. 文书名乱码问题 ✅

**问题描述**：上传包含中文的文件名时，显示为乱码。

**原因**：multer 在处理文件名时，默认使用 latin1 编码，导致中文乱码。

**解决方案**：
- 在 multer 的 storage 配置中，使用 `Buffer.from(file.originalname, 'latin1').toString('utf8')` 转换文件名编码
- 在保存到数据库时，也进行相同的编码转换

**修改文件**：
- `backend/src/controllers/documentController.js`

### 2. 文书管理页面数据不互通 ✅

**问题描述**：点击"查看详情"进入文书管理页面后，看不到文书列表。

**原因**：
1. 数据字段映射不一致：DocumentManagement 页面使用 `item.file_name`，但应该使用 `item.document_name`
2. API 响应数据结构处理不一致

**解决方案**：
- 统一使用 `response.data.documents` 获取文书列表
- 统一使用 `item.document_name` 作为文件名
- 统一使用 `item.created_at` 作为上传时间

**修改文件**：
- `frontend/src/views/document/DocumentManagement.vue`
- `frontend/src/views/case/CaseDetail.vue`

### 3. 添加预览和下载功能 ✅

**问题描述**：文书列表中没有预览和下载功能。

**解决方案**：

#### 后端实现

1. **下载接口** (`GET /api/documents/:id/download`)
   - 如果是上传的文件，使用 `res.download()` 直接下载文件
   - 如果是智能生成的文书，生成文本文件下载
   - 正确设置文件名编码，避免中文乱码

2. **预览接口** (`GET /api/documents/:id/preview`)
   - 如果是上传的文件，根据文件类型设置 Content-Type
   - PDF 文件可以在浏览器中直接预览
   - 文本文件返回文本内容
   - 如果是智能生成的文书，返回 JSON 格式的内容

3. **删除功能增强**
   - 删除数据库记录的同时，删除物理文件
   - 避免磁盘空间浪费

#### 前端实现

1. **案件详情页**
   - 在文书列表表格中添加"操作"列
   - 添加"预览"、"下载"、"删除"按钮
   - 实现预览对话框，显示文书内容
   - 实现下载功能，使用 Blob 和 URL.createObjectURL
   - 实现删除功能，带确认提示

2. **API 方法**
   - 添加 `previewDocument` 方法
   - 修改 `downloadDocument` 方法，使用 fetch API 获取 blob

**修改文件**：
- `backend/src/controllers/documentController.js`
- `backend/src/routes/document.js`
- `frontend/src/views/case/CaseDetail.vue`
- `frontend/src/api/document.ts`

## 技术细节

### 文件名编码转换

```javascript
// 解决中文文件名乱码
const originalname = Buffer.from(req.file.originalname, 'latin1').toString('utf8');
```

### 下载文件

```javascript
// 后端
res.download(document.file_path, document.document_name, (err) => {
  // 错误处理
});

// 前端
const blob = await documentApi.downloadDocument(doc.id)
const url = window.URL.createObjectURL(blob)
const link = document.createElement('a')
link.href = url
link.download = doc.fileName
link.click()
window.URL.revokeObjectURL(url)
```

### 预览文书

```javascript
// 后端 - 智能生成的文书
res.json({
  data: {
    content: document.content
  }
});

// 后端 - 上传的文件
res.setHeader('Content-Type', contentType);
res.setHeader('Content-Disposition', `inline; filename="${encodeURIComponent(document.document_name)}"`);
const fileStream = fs.createReadStream(document.file_path);
fileStream.pipe(res);
```

## 数据库字段说明

`smart_documents` 表字段：
- `document_name`: 文书名称（显示名称）
- `file_name`: 物理文件名（存储在服务器上的文件名）
- `file_path`: 文件路径（完整的物理路径）
- `file_size`: 文件大小（字节）
- `content`: 文书内容（智能生成的文书使用此字段）

## 测试验证

### 1. 测试文件名编码

```bash
# 上传一个包含中文的文件
# 预期：文件名正确显示中文
```

### 2. 测试数据互通

```bash
# 1. 在案件详情页上传文书
# 2. 点击"查看详情"进入文书管理页面
# 3. 预期：能看到刚才上传的文书
```

### 3. 测试预览功能

```bash
# 1. 点击文书列表中的"预览"按钮
# 2. 预期：弹出对话框显示文书内容
```

### 4. 测试下载功能

```bash
# 1. 点击文书列表中的"下载"按钮
# 2. 预期：浏览器开始下载文件，文件名正确
```

### 5. 测试删除功能

```bash
# 1. 点击文书列表中的"删除"按钮
# 2. 确认删除
# 3. 预期：文书从列表中消失，物理文件也被删除
```

## 后续优化建议

1. **文件预览增强**
   - 支持 PDF 文件的在线预览（使用 PDF.js）
   - 支持 Word 文件的在线预览（转换为 HTML）
   - 支持图片文件的预览

2. **文件管理优化**
   - 添加文件版本管理
   - 添加文件分享功能
   - 添加文件权限控制

3. **性能优化**
   - 大文件分片上传
   - 文件压缩
   - CDN 加速

4. **用户体验优化**
   - 上传进度显示
   - 拖拽上传
   - 批量上传
   - 批量下载

## 更新日期

2025-11-19
