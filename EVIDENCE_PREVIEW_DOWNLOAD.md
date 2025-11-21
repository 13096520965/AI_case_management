# 证据预览和下载功能

## 功能概述

为证据列表添加了预览和下载功能，用户可以直接在线预览图片、音频、视频和文本文件，也可以下载任何类型的证据文件。

## 功能特点

### 1. 预览功能

支持以下文件类型的在线预览：

| 文件类型 | 支持格式 | 预览方式 |
|---------|---------|---------|
| 图片 | JPG, PNG, GIF, BMP, WebP | 直接显示图片 |
| 音频 | MP3, WAV, OGG, AAC, M4A | 音频播放器 |
| 视频 | MP4, MPEG, MOV, AVI, WMV, WebM | 视频播放器 |
| 文本 | TXT | 文本内容显示 |

**不支持预览的文件类型**：
- PDF 文档
- Word 文档
- Excel 表格

这些文件会提示"该文件类型不支持预览，请下载后查看"。

### 2. 下载功能

支持所有文件类型的下载，包括：
- PDF 文档
- Word 文档
- Excel 表格
- 图片
- 音频
- 视频
- 文本文件

## 使用方法

### 预览证据

1. 在证据列表中找到要预览的证据
2. 点击"预览"按钮
3. 在弹出的对话框中查看内容

**图片预览**：
- 显示完整图片
- 支持缩放查看

**音频预览**：
- 显示音频播放器
- 支持播放、暂停、进度控制

**视频预览**：
- 显示视频播放器
- 支持播放、暂停、全屏、音量控制

**文本预览**：
- 显示文本内容
- 支持滚动查看

### 下载证据

1. 在证据列表中找到要下载的证据
2. 点击"下载"按钮
3. 浏览器会自动下载文件

**或者**：

1. 点击"预览"按钮打开预览对话框
2. 在预览对话框中点击"下载"按钮

## UI 改进

### 列宽调整

为了容纳操作列，调整了各列的宽度：

| 列名 | 调整前 | 调整后 |
|------|--------|--------|
| 文件名 | min-width="150" | min-width="120" |
| 文件类型 | width="120" | width="100" |
| 分类 | width="100" | width="80" |
| 上传时间 | width="160" | width="140" |
| 操作 | - | width="150" |

### 操作按钮

每条证据记录都有两个操作按钮：
- **预览**：蓝色链接按钮
- **下载**：绿色链接按钮

## 技术实现

### 前端实现

#### 1. 预览逻辑

```typescript
const handlePreviewEvidence = async (evidence: any) => {
  const fileType = evidence.fileType || ''
  
  if (fileType.startsWith('image/')) {
    // 图片预览
    evidencePreviewType.value = 'image'
    evidencePreviewUrl.value = `${API_URL}/evidence/${evidence.id}/download?token=${token}`
  } else if (fileType.startsWith('audio/')) {
    // 音频预览
    evidencePreviewType.value = 'audio'
    evidencePreviewUrl.value = `${API_URL}/evidence/${evidence.id}/download?token=${token}`
  } else if (fileType.startsWith('video/')) {
    // 视频预览
    evidencePreviewType.value = 'video'
    evidencePreviewUrl.value = `${API_URL}/evidence/${evidence.id}/download?token=${token}`
  } else if (fileType === 'text/plain') {
    // 文本预览
    evidencePreviewType.value = 'text'
    const response = await evidenceApi.downloadEvidence(evidence.id)
    evidencePreviewContent.value = await response.text()
  } else {
    // 不支持预览
    ElMessage.info('该文件类型不支持预览，请下载后查看')
  }
}
```

#### 2. 下载逻辑

```typescript
const handleDownloadEvidence = async (evidence: any) => {
  const response = await evidenceApi.downloadEvidence(evidence.id)
  const blob = await response.blob()
  const url = window.URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = evidence.fileName
  link.click()
  window.URL.revokeObjectURL(url)
}
```

### 后端接口

使用现有的下载接口：
- `GET /api/evidence/:id/download`

## 与文书预览的区别

| 功能 | 文书预览 | 证据预览 |
|------|---------|---------|
| 支持图片 | ❌ | ✅ |
| 支持音频 | ❌ | ✅ |
| 支持视频 | ❌ | ✅ |
| 支持文本 | ✅ | ✅ |
| 支持PDF | ❌ | ❌ |
| 支持Word | ❌ | ❌ |

## 测试验证

### 测试步骤

1. **刷新浏览器**（Ctrl+F5）
2. **进入案件详情页**
3. **找到"证据材料"模块**
4. **测试预览功能**：
   - 上传一张图片，点击"预览"
   - 上传一个音频文件，点击"预览"
   - 上传一个视频文件，点击"预览"
   - 上传一个文本文件，点击"预览"
5. **测试下载功能**：
   - 点击任意证据的"下载"按钮
   - 验证文件是否正确下载

### 预期结果

- ✅ 图片可以正常预览
- ✅ 音频可以播放
- ✅ 视频可以播放
- ✅ 文本可以查看
- ✅ PDF/Word 提示不支持预览
- ✅ 所有文件都可以下载
- ✅ 下载的文件名正确

## 常见问题

### Q1: 图片/音频/视频无法预览？

**A**: 
1. 检查浏览器是否支持该格式
2. 检查文件是否损坏
3. 检查网络连接

### Q2: 下载的文件名不对？

**A**: 
1. 确认上传时的文件名是否正确
2. 检查浏览器的下载设置

### Q3: 预览对话框显示空白？

**A**: 
1. 打开浏览器控制台查看错误
2. 检查文件是否存在
3. 检查权限设置

## 后续优化建议

1. **PDF 预览**
   - 集成 PDF.js 实现 PDF 在线预览

2. **Word 预览**
   - 使用 mammoth.js 转换 Word 为 HTML 预览

3. **图片优化**
   - 添加图片缩放功能
   - 添加图片旋转功能
   - 支持图片批量预览（画廊模式）

4. **视频优化**
   - 添加播放速度控制
   - 添加字幕支持
   - 添加截图功能

5. **音频优化**
   - 添加波形显示
   - 添加播放列表
   - 添加音频剪辑功能

## 更新日期

2025-11-19

## 修改的文件

- `frontend/src/views/case/CaseDetail.vue`
- `frontend/src/api/evidence.ts`
