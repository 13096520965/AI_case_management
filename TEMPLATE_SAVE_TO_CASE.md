# 文书模板生成并保存到案件功能

## 功能概述

在使用文书模板生成文书时，新增"保存到案件"功能，可以直接将生成的文书保存到选中的案件中，无需手动导出后再上传。

## 功能特性

### 1. 一键保存
- ✅ 生成文书后直接保存到案件
- ✅ 自动生成文书名称
- ✅ 自动关联案件和文书类型

### 2. 智能命名
文书名称格式：`模板名称_案号_日期`

示例：
- `民事起诉状模板_(2024)京0105民初12345号_20241120`
- `答辩状模板_AN202411000001_20241120`

### 3. 按钮状态
- 未选择案件时：按钮禁用
- 未生成内容时：按钮禁用
- 保存中：显示加载状态
- 保存成功：自动关闭对话框

## 使用流程

### 步骤 1: 选择模板
1. 进入"文书模板"页面
2. 点击任意模板的"生成文书"按钮

### 步骤 2: 选择案件
1. 在弹出的对话框中，点击"选择案件"下拉框
2. 选择要关联的案件
3. 系统自动填充案件相关变量

### 步骤 3: 填充变量
1. 检查自动填充的变量（案号、案由、法院等）
2. 手动填写或修改其他变量
3. 查看预览区域的文书内容

### 步骤 4: 保存文书
1. 点击"保存到案件"按钮
2. 等待保存完成
3. 提示"文书已成功保存到案件"

### 步骤 5: 查看文书
1. 进入对应案件的详情页
2. 切换到"文书管理"标签
3. 查看刚才保存的文书

## 界面变化

### 对话框底部按钮

**修改前**:
```
[取消] [导出为 Word] [导出为 PDF]
```

**修改后**:
```
[取消] [📄 保存到案件] [导出为 Word] [导出为 PDF]
```

### 按钮说明

| 按钮 | 功能 | 启用条件 |
|------|------|----------|
| 取消 | 关闭对话框 | 始终启用 |
| 保存到案件 | 保存文书到选中案件 | 已选择案件且已生成内容 |
| 导出为 Word | 下载为Word文档 | 始终启用 |
| 导出为 PDF | 下载为PDF文档 | 始终启用 |

## 技术实现

### 前端实现

**文件**: `frontend/src/views/document/DocumentTemplates.vue`

#### 1. 添加按钮

```vue
<el-button 
  type="success" 
  @click="handleSaveToCase"
  :disabled="!generateForm.caseId || !generatedContent"
  :loading="saving"
>
  <el-icon><DocumentAdd /></el-icon>
  保存到案件
</el-button>
```

#### 2. 保存方法

```typescript
const handleSaveToCase = async () => {
  if (!generateForm.caseId || !generatedContent.value) {
    ElMessage.warning('请选择案件并生成文书内容')
    return
  }

  try {
    saving.value = true
    
    // 获取案件信息
    const caseResponse = await caseApi.getCaseById(generateForm.caseId)
    const caseData = caseResponse.data
    const caseNumber = caseData.caseNumber || caseData.internalNumber || '未知案号'
    
    // 生成文书名称
    const documentName = `${currentTemplate.value.name}_${caseNumber}_${new Date().toLocaleDateString('zh-CN').replace(/\//g, '')}`
    
    // 保存文书
    await documentApi.saveDocument({
      caseId: generateForm.caseId,
      documentType: currentTemplate.value.documentType,
      documentName: documentName,
      content: generatedContent.value
    })
    
    ElMessage.success('文书已成功保存到案件')
    showGenerateDialog.value = false
  } catch (error: any) {
    ElMessage.error(error.message || '保存文书失败')
  } finally {
    saving.value = false
  }
}
```

#### 3. 导入依赖

```typescript
import { DocumentAdd } from '@element-plus/icons-vue'
import { documentApi } from '@/api/document'
```

### 后端API

使用现有的文书保存API：

**接口**: `POST /api/documents/save`

**请求参数**:
```typescript
{
  caseId: number        // 案件ID
  documentType: string  // 文书类型
  documentName: string  // 文书名称
  content: string       // 文书内容
}
```

**响应**:
```json
{
  "message": "文书保存成功",
  "data": {
    "id": 123
  }
}
```

## 使用场景

### 场景 1: 快速生成起诉状

1. 选择"民事起诉状模板"
2. 选择案件"(2024)京0105民初12345号"
3. 系统自动填充：
   - 案号：(2024)京0105民初12345号
   - 案由：合同纠纷
   - 法院：北京市朝阳区人民法院
   - 标的额：100,000元
4. 手动填充：
   - 原告：张三
   - 被告：李四
   - 第三人：（留空）
5. 点击"保存到案件"
6. 文书自动保存为：`民事起诉状模板_(2024)京0105民初12345号_20241120`

### 场景 2: 批量生成文书

1. 为同一案件生成多份文书：
   - 起诉状
   - 证据清单
   - 代理词
2. 每份文书都可以直接保存到案件
3. 在案件详情页统一查看和管理

### 场景 3: 模板测试

1. 创建新模板后测试效果
2. 选择测试案件
3. 生成文书查看效果
4. 如果满意，保存到案件
5. 如果不满意，修改模板后重新生成

## 优势

### 1. 提高效率
- ⏱️ 节省导出-上传的时间
- 🚀 一键完成文书保存
- 📝 自动生成规范的文书名称

### 2. 减少错误
- ✅ 自动关联案件
- ✅ 自动设置文书类型
- ✅ 避免手动上传时选错案件

### 3. 改善体验
- 💡 操作流程更顺畅
- 🎯 功能更加集成
- 📊 便于文书管理

## 注意事项

### 1. 必须选择案件
- 如果未选择案件，"保存到案件"按钮将被禁用
- 提示用户先选择案件

### 2. 必须生成内容
- 如果未生成文书内容，按钮将被禁用
- 确保有内容可以保存

### 3. 文书名称唯一性
- 使用时间戳确保文书名称唯一
- 格式：`模板名_案号_日期`

### 4. 保存位置
- 文书保存在 `smart_documents` 表中
- 与案件通过 `case_id` 关联
- 可以在案件详情页查看

## 后续优化建议

### 1. 文书名称自定义
- 允许用户在保存前修改文书名称
- 提供名称模板配置

### 2. 保存选项
- 保存并继续编辑
- 保存并生成新文书
- 保存并查看案件

### 3. 批量操作
- 一次为多个案件生成相同文书
- 批量保存到多个案件

### 4. 版本管理
- 保存文书的多个版本
- 支持版本对比和回滚

### 5. 通知功能
- 文书保存后发送通知
- 提醒相关人员查看

## 相关文件

### 前端
- `frontend/src/views/document/DocumentTemplates.vue` - 模板管理页面（已修改）
- `frontend/src/api/document.ts` - 文书API接口

### 后端
- `backend/src/controllers/documentController.js` - 文书控制器
- `backend/src/routes/document.js` - 文书路由

## 测试验证

### 测试步骤

1. **准备测试数据**
   - 创建一个测试案件
   - 创建一个文书模板

2. **测试保存功能**
   - 点击"生成文书"
   - 选择测试案件
   - 填充变量
   - 点击"保存到案件"

3. **验证结果**
   - 检查是否提示"文书已成功保存到案件"
   - 进入案件详情页
   - 切换到"文书管理"标签
   - 查看是否有新保存的文书

4. **测试按钮状态**
   - 未选择案件时，按钮应该禁用
   - 选择案件后，按钮应该启用
   - 保存时，按钮应该显示加载状态

### 预期结果

- ✅ 文书成功保存到案件
- ✅ 文书名称格式正确
- ✅ 文书内容完整
- ✅ 可以在案件详情页查看
- ✅ 按钮状态正确

## 更新日期

2024-11-20

## 版本

v1.0.0
