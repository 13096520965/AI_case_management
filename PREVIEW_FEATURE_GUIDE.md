# 文书预览功能说明

## 功能概述

文书预览功能允许用户在线查看文书内容，无需下载。

## 支持的文件类型

### ✅ 支持预览

1. **文本文件（.txt）**
   - 直接显示文件内容
   - 支持中文显示
   - 无乱码

2. **智能生成的文书**
   - 显示生成的文书内容
   - 格式化显示

### ❌ 不支持预览

1. **Word 文档（.doc, .docx）**
   - 提示：该文件类型不支持在线预览，请下载后查看
   - 原因：Word 是二进制格式，需要专门的解析库

2. **PDF 文件（.pdf）**
   - 提示：该文件类型不支持在线预览，请下载后查看
   - 原因：需要集成 PDF.js 等库才能预览

## 使用方法

### 1. 预览文本文件

1. 在文书列表中找到文本文件（.txt）
2. 点击"预览"按钮
3. 在弹出的对话框中查看内容

**预期结果**：
- ✅ 弹出预览对话框
- ✅ 显示文件内容
- ✅ 中文正常显示
- ✅ 无乱码

### 2. 预览 Word/PDF 文件

1. 在文书列表中找到 Word 或 PDF 文件
2. 点击"预览"按钮

**预期结果**：
- ✅ 提示"该文件类型不支持在线预览，请下载后查看"
- ✅ 不会弹出预览对话框
- ✅ 不会显示乱码

### 3. 预览智能生成的文书

1. 在文书列表中找到智能生成的文书
2. 点击"预览"按钮
3. 在弹出的对话框中查看内容

**预期结果**：
- ✅ 弹出预览对话框
- ✅ 显示生成的文书内容
- ✅ 格式化显示

## 技术实现

### 后端逻辑

```javascript
// 只支持文本文件的预览
if (ext === '.txt') {
  // 读取文本文件内容
  const content = fs.readFileSync(document.file_path, 'utf8');
  res.json({
    data: {
      content: content,
      fileType: 'text'
    }
  });
} else {
  // 其他文件类型不支持预览
  return res.status(400).json({
    error: {
      message: '该文件类型不支持在线预览，请下载后查看'
    }
  });
}
```

### 前端逻辑

```javascript
// 先检查文件类型
const ext = fileName.substring(fileName.lastIndexOf('.')).toLowerCase()

// 只有文本文件和智能生成的文书支持预览
if (ext && ext !== '.txt' && doc.filePath) {
  ElMessage.info('该文件类型不支持在线预览，请下载后查看')
  return
}
```

## 为什么 Word/PDF 不支持预览？

### Word 文档

Word 文档是二进制格式，包含复杂的格式信息（字体、样式、图片等）。如果直接以文本方式读取，会显示乱码。

**解决方案**：
1. 使用专门的库解析 Word 文档（如 mammoth.js）
2. 将 Word 转换为 HTML 后显示
3. 使用在线 Office 预览服务

### PDF 文件

PDF 也是二进制格式，需要专门的渲染引擎。

**解决方案**：
1. 集成 PDF.js 库
2. 使用浏览器原生的 PDF 预览功能
3. 使用第三方 PDF 预览服务

## 后续优化建议

### 1. 支持 PDF 预览

```javascript
// 使用 PDF.js
import * as pdfjsLib from 'pdfjs-dist'

// 渲染 PDF
const loadingTask = pdfjsLib.getDocument(pdfUrl)
loadingTask.promise.then(pdf => {
  // 渲染每一页
})
```

### 2. 支持 Word 预览

```javascript
// 使用 mammoth.js
import mammoth from 'mammoth'

// 转换 Word 为 HTML
mammoth.convertToHtml({ arrayBuffer: wordBuffer })
  .then(result => {
    // 显示 HTML
  })
```

### 3. 支持图片预览

```javascript
// 直接显示图片
<img :src="imageUrl" />
```

## 测试验证

### 测试脚本

```bash
# 测试文本文件预览
node backend/test-preview.js

# 测试 Word 文档预览（应该返回错误）
node backend/test-word-preview.js
```

### 浏览器测试

1. **测试文本文件预览**
   - 上传一个 .txt 文件
   - 点击"预览"
   - 验证内容正确显示

2. **测试 Word 文档预览**
   - 上传一个 .docx 文件
   - 点击"预览"
   - 验证提示"该文件类型不支持在线预览，请下载后查看"

3. **测试智能生成的文书预览**
   - 使用智能生成功能生成文书
   - 点击"预览"
   - 验证内容正确显示

## 常见问题

### Q1: 为什么 Word 文档显示乱码？

**A**: Word 文档是二进制格式，不能直接以文本方式显示。现在系统会提示"该文件类型不支持在线预览，请下载后查看"，不会再显示乱码。

### Q2: 如何预览 Word 文档？

**A**: 目前不支持 Word 文档的在线预览，请使用下载功能下载后查看。后续版本会考虑集成 Word 预览功能。

### Q3: 文本文件预览时中文乱码怎么办？

**A**: 
1. 确认文件编码为 UTF-8
2. 确认后端已正确处理编码
3. 如果还有问题，请联系技术支持

### Q4: 预览对话框一闪而过？

**A**: 这是正常的，说明文件类型不支持预览。系统会显示提示信息。

## 更新日期

2025-11-19

## 测试状态

- ✅ 文本文件预览：正常
- ✅ Word 文档预览：正确提示不支持
- ✅ PDF 文件预览：正确提示不支持
- ✅ 智能生成文书预览：正常
- ✅ 无乱码问题
