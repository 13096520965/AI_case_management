# 证据上传功能修复

## 问题描述

上传证据时报错：**Request failed with status code 500**

## 问题原因

### 1. 不支持 Word 文档格式

错误信息：
```
不支持的文件类型: application/vnd.openxmlformats-officedocument.wordprocessingml.document
仅支持 PDF、图片、音频、视频格式。
```

**原因**：证据上传的文件过滤器中没有包含 Word 文档的 MIME 类型。

### 2. 中文文件名编码问题

与文书上传相同，multer 处理中文文件名时会出现乱码。

## 解决方案

### 1. 扩展支持的文件类型

添加了以下文件类型的支持：
- Word 文档（.doc, .docx）
- Excel 文档（.xls, .xlsx）
- 文本文件（.txt）

**修改代码**：
```javascript
const allowedMimes = [
  // PDF
  'application/pdf',
  // Word
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  // Excel
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  // 文本
  'text/plain',
  // 图片
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/gif',
  'image/bmp',
  'image/webp',
  // 音频
  'audio/mpeg',
  'audio/mp3',
  'audio/wav',
  'audio/ogg',
  'audio/aac',
  'audio/m4a',
  // 视频
  'video/mp4',
  'video/mpeg',
  'video/quicktime',
  'video/x-msvideo',
  'video/x-ms-wmv',
  'video/webm'
];
```

### 2. 修复中文文件名编码

**修改代码**：
```javascript
// 在 storage 配置中
filename: (req, file, cb) => {
  // 解决中文文件名乱码问题
  const originalname = Buffer.from(file.originalname, 'latin1').toString('utf8');
  const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
  const ext = path.extname(originalname);
  cb(null, `${uniqueSuffix}${ext}`);
}

// 在 uploadEvidence 方法中
const originalname = Buffer.from(req.file.originalname, 'latin1').toString('utf8');
const evidenceData = {
  file_name: originalname,
  // ...
};
```

## 修改的文件

- `backend/src/controllers/evidenceController.js`

## 测试验证

### 测试步骤

1. **刷新浏览器**（Ctrl+F5）
2. **进入案件详情页**
3. **找到"证据材料"模块**
4. **点击"上传证据"按钮**
5. **选择一个 Word 文档**（如"测试证据.docx"）
6. **填写证据类别和标签**
7. **点击"上传"**

### 预期结果

- ✅ 上传成功
- ✅ 文件名正确显示（无乱码）
- ✅ 证据列表中显示新上传的证据

### 支持的文件类型

现在证据上传支持以下文件类型：

| 类型 | 格式 | MIME Type |
|------|------|-----------|
| PDF | .pdf | application/pdf |
| Word | .doc, .docx | application/msword, application/vnd.openxmlformats-officedocument.wordprocessingml.document |
| Excel | .xls, .xlsx | application/vnd.ms-excel, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet |
| 文本 | .txt | text/plain |
| 图片 | .jpg, .jpeg, .png, .gif, .bmp, .webp | image/* |
| 音频 | .mp3, .wav, .ogg, .aac, .m4a | audio/* |
| 视频 | .mp4, .mpeg, .mov, .avi, .wmv, .webm | video/* |

### 文件大小限制

- 最大文件大小：100MB

## 与文书上传的区别

| 功能 | 文书上传 | 证据上传 |
|------|---------|---------|
| 支持格式 | PDF、Word、TXT | PDF、Word、Excel、TXT、图片、音频、视频 |
| 文件大小限制 | 50MB | 100MB |
| 存储位置 | uploads/documents/ | uploads/evidence/ |
| 用途 | 法律文书 | 证据材料 |

## 常见问题

### Q1: 上传 Word 文档还是报错？

**A**: 
1. 确认后端服务已重启
2. 刷新浏览器（Ctrl+F5）
3. 检查文件大小是否超过 100MB

### Q2: 文件名显示乱码？

**A**: 
1. 确认后端代码已更新
2. 重启后端服务
3. 重新上传文件

### Q3: 提示"不支持的文件类型"？

**A**: 
1. 检查文件格式是否在支持列表中
2. 检查文件的 MIME 类型
3. 如果是特殊格式，可能需要添加到 allowedMimes 列表

## 更新日期

2025-11-19

## 测试状态

- ✅ Word 文档上传：待测试
- ✅ Excel 文档上传：待测试
- ✅ 中文文件名：待测试
- ✅ 图片上传：待测试
- ✅ 音频上传：待测试
- ✅ 视频上传：待测试

## 后续优化建议

1. **文件预览**
   - 添加图片预览功能
   - 添加 PDF 预览功能
   - 添加音频/视频播放功能

2. **文件管理**
   - 添加文件版本管理
   - 添加文件分类管理
   - 添加文件搜索功能

3. **性能优化**
   - 大文件分片上传
   - 文件压缩
   - 缩略图生成
