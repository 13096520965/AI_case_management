# UI 改进说明

## 证据列表优化

### 1. 列宽调整

**调整前**：
- 文件名：min-width="200" （太宽）
- 文件类型：width="100" （太窄，显示不全）
- 分类：width="120"
- 上传时间：width="180"

**调整后**：
- 文件名：min-width="150" （适中）
- 文件类型：width="120" （加宽，显示完整）
- 分类：width="100" （缩小）
- 上传时间：width="160" （缩小）

### 2. 文件类型显示优化

**优化前**：
显示 MIME 类型，如：
- `application/vnd.openxmlformats-officedocument.wordprocessingml.document`
- `application/pdf`
- `image/jpeg`

**优化后**：
显示易懂的中文标签，如：
- `Word文档`
- `PDF文档`
- `JPEG图片`

### 文件类型映射表

| MIME Type | 显示标签 |
|-----------|---------|
| application/pdf | PDF文档 |
| application/msword | Word文档 |
| application/vnd.openxmlformats-officedocument.wordprocessingml.document | Word文档 |
| application/vnd.ms-excel | Excel表格 |
| application/vnd.openxmlformats-officedocument.spreadsheetml.sheet | Excel表格 |
| text/plain | 文本文件 |
| image/jpeg, image/jpg | JPEG图片 |
| image/png | PNG图片 |
| image/gif | GIF图片 |
| image/bmp | BMP图片 |
| image/webp | WebP图片 |
| audio/mpeg, audio/mp3 | MP3音频 |
| audio/wav | WAV音频 |
| audio/ogg | OGG音频 |
| audio/aac | AAC音频 |
| audio/m4a | M4A音频 |
| video/mp4 | MP4视频 |
| video/mpeg | MPEG视频 |
| video/quicktime | MOV视频 |
| video/x-msvideo | AVI视频 |
| video/x-ms-wmv | WMV视频 |
| video/webm | WebM视频 |

### 实现代码

```typescript
const getFileTypeLabel = (mimeType: string) => {
  if (!mimeType) return '未知'
  
  const typeMap: Record<string, string> = {
    'application/pdf': 'PDF文档',
    'application/msword': 'Word文档',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'Word文档',
    // ... 更多映射
  }
  
  return typeMap[mimeType] || mimeType.split('/')[1]?.toUpperCase() || '其他'
}
```

### 使用方式

在表格列中使用模板：

```vue
<el-table-column prop="fileType" label="文件类型" width="120">
  <template #default="{ row }">
    {{ getFileTypeLabel(row.fileType) }}
  </template>
</el-table-column>
```

## 效果对比

### 优化前
```
文件名                                    | 文件类型 | 分类 | 上传时间
证据证明材料.docx                         | applica... | 书证 | 2025-11-19 15:33:02
```

### 优化后
```
文件名              | 文件类型   | 分类 | 上传时间
证据证明材料.docx   | Word文档   | 书证 | 2025-11-19 15:33
```

## 其他可优化的地方

### 1. 文书列表

可以应用相同的优化：
- 调整列宽
- 优化文件类型显示

### 2. 成本记录列表

可以优化：
- 金额格式化（添加千分位）
- 日期格式统一

### 3. 流程节点列表

可以优化：
- 状态标签颜色
- 日期格式统一

## 更新日期

2025-11-19

## 测试验证

1. **刷新浏览器**（Ctrl+F5）
2. **进入案件详情页**
3. **查看证据列表**
4. **验证列宽是否合适**
5. **验证文件类型显示是否易懂**

## 预期结果

- ✅ 文件名列宽度适中
- ✅ 文件类型列显示完整
- ✅ 文件类型显示为中文标签
- ✅ 整体布局更加美观
