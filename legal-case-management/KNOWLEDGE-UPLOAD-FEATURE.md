# 案例知识库上传功能

## 功能描述

在案例知识库的"添加案例"弹窗中新增了【上传案例】功能：

1. 在弹窗最上方（案件ID上方）添加了上传按钮
2. 支持上传 PDF、Word 格式的案例文件
3. 上传后调用 OCR 接口自动识别文件内容并填充表单字段

## 实现细节

### 前端修改

**文件**: `frontend/src/views/knowledge/KnowledgeBase.vue`

1. 在添加案例弹窗中添加了上传组件
2. 实现了文件上传到OSS的逻辑（参考文书上传功能）
3. 调用 OCR API 进行文件解析
4. 从解析结果中提取字段并自动填充表单

### OCR API 调用流程

1. **上传文件到 OSS**
   - 调用 `https://x-fat.zhixinzg.com/code-app/file/getUploadSign` 获取上传签名
   - 使用签名将文件上传到 OSS

2. **提交 OCR 解析**
   - 调用 `https://xapi-fat.ygyg.cn/cbp/file/batch/parse` 提交文件进行解析
   - 返回 fileId

3. **轮询查询结果**
   - 调用 `https://xapi-fat.ygyg.cn/cbp/file/query` 查询解析结果
   - 轮询直到获取到 fileContent

4. **提取字段**
   - 从 OCR 识别的文本中提取案例知识字段
   - 自动填充到表单

### API 接口

**OCR 解析接口**

1. `POST /cbp/file/batch/parse` - 提交文件解析
   ```json
   { "fileUrls": ["https://..."] }
   ```

2. `POST /cbp/file/query` - 查询解析结果
   ```json
   { "fileIds": ["xxx"] }
   ```

## 支持的文件格式

- PDF (.pdf)
- Word (.doc, .docx)

## 自动识别字段

从 OCR 文本中提取以下字段：

| 字段 | 提取规则 |
|------|---------|
| 案由 | 匹配"案由："后的内容，或从文本中识别常见案由关键词 |
| 争议焦点 | 匹配"争议焦点："后的内容 |
| 法律问题 | 匹配"法律问题："后的内容 |
| 案件结果 | 识别"胜诉"、"败诉"、"调解"等关键词 |
| 关键证据 | 匹配"关键证据："或"主要证据："后的内容 |
| 法律依据 | 匹配"法律依据："或"适用法律："后的内容 |
| 关键词 | 从案由中提取 |

## 使用方式

1. 点击"添加案例"按钮打开弹窗
2. 点击"选择文件"按钮选择案例文件
3. 等待文件上传和 OCR 识别完成（显示"识别中..."）
4. 系统自动填充识别到的字段
5. 用户可以修改或补充其他字段
6. 点击"确定"保存案例

## 相关文件

- `frontend/src/views/knowledge/KnowledgeBase.vue` - 知识库页面
- `frontend/src/api/ocr.ts` - OCR API 封装
