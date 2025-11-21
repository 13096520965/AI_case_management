# 智能文书生成与审核模块集成说明

## 功能概述

智能文书生成与审核模块已开发完成，提供以下核心功能：

### 1. 智能文书生成
- **支持文书类型**：
  - 起诉状
  - 答辩状
  - 代理词
  - 案件汇报材料
  - 证据清单
  - 法律意见书

- **智能能力**：
  - 基于案件信息自动填充
  - 自动获取诉讼主体信息
  - 支持个性化补充信息
  - 生成规范的法律文书格式

### 2. 智能文书审核
- **审核维度**：
  - 合规性检查（管辖法院、案号、日期格式等）
  - 逻辑性检查（论述充分性、逻辑连贯性）
  - 格式规范检查（标题、段落、签名等）
  - 完整性检查（必要要素、签名日期等）

- **审核结果**：
  - 问题分级（严重/警告/建议）
  - 详细问题描述和位置标注
  - 修改建议和法律依据
  - 优化建议和报告导出

## 文件结构

```
frontend/src/
├── components/document/
│   ├── SmartDocumentGenerator.vue    # 智能生成对话框
│   ├── SmartDocumentReviewer.vue     # 智能审核对话框
│   ├── IssueList.vue                 # 问题列表组件
│   └── DocumentManagement.vue        # 文书管理主组件
└── api/
    └── document.ts                    # 文书API

backend/src/
├── controllers/
│   └── documentController.js          # 文书控制器
└── routes/
    └── document.js                    # 文书路由
```

## 集成步骤

### 步骤1: 在案件详情页添加文书管理模块

在 `legal-case-management/frontend/src/views/case/CaseDetail.vue` 中添加：

```vue
<template>
  <div class="case-detail-container">
    <!-- ... 现有内容 ... -->
    
    <!-- 在流程节点卡片后面添加文书管理卡片 -->
    <el-card shadow="never" class="info-card">
      <template #header>
        <div class="card-header">
          <span class="card-title">案件文书管理</span>
          <el-tag type="info" size="small">智能AI辅助</el-tag>
        </div>
      </template>
      
      <DocumentManagement
        :case-id="caseId"
        :case-info="caseData"
        :parties="parties"
      />
    </el-card>
  </div>
</template>

<script setup lang="ts">
// ... 现有导入 ...
import DocumentManagement from '@/components/document/DocumentManagement.vue'

// ... 现有代码 ...

// 添加诉讼主体数据
const parties = ref<any[]>([])

// 在 fetchCaseData 函数中加载诉讼主体
const fetchCaseData = async () => {
  // ... 现有代码 ...
  
  // 加载诉讼主体
  try {
    const partiesResponse = await partyApi.getPartiesByCaseId(caseId)
    parties.value = partiesResponse.data.parties || []
  } catch (error) {
    console.error('加载诉讼主体失败:', error)
  }
}
</script>
```

### 步骤2: 创建数据库表

在数据库中创建 `documents` 表（如果还没有）：

```sql
CREATE TABLE IF NOT EXISTS documents (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  case_id INTEGER NOT NULL,
  document_type VARCHAR(50),
  document_name VARCHAR(200) NOT NULL,
  content TEXT NOT NULL,
  created_by INTEGER,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (case_id) REFERENCES cases(id) ON DELETE CASCADE,
  FOREIGN KEY (created_by) REFERENCES users(id)
);

CREATE INDEX idx_documents_case_id ON documents(case_id);
CREATE INDEX idx_documents_type ON documents(document_type);
```

### 步骤3: 重启后端服务

```bash
cd legal-case-management/backend
npm start
```

### 步骤4: 测试功能

1. 访问任意案件详情页
2. 找到"案件文书管理"模块
3. 点击"智能生成"按钮测试文书生成
4. 点击"智能审核"按钮测试文书审核

## 使用说明

### 智能生成文书

1. **选择模板**
   - 点击"智能生成"按钮
   - 选择需要生成的文书类型
   - 点击"下一步"

2. **确认信息**
   - 系统自动填充案件信息
   - 检查诉讼主体信息
   - 补充代理律师、律所等信息
   - 添加特殊说明（可选）
   - 点击"下一步"

3. **生成文书**
   - AI自动生成文书内容
   - 可在线编辑修改
   - 支持复制、下载
   - 点击"保存文书"保存到系统

### 智能审核文书

1. **上传或输入文书**
   - 点击"智能审核"按钮
   - 选择"上传文件"或"直接输入"
   - 上传文书文件或粘贴文书内容

2. **选择审核选项**
   - 合规性检查
   - 逻辑性检查
   - 格式规范检查
   - 完整性检查

3. **查看审核结果**
   - 查看问题统计
   - 按严重程度筛选问题
   - 查看详细问题描述和修改建议
   - 导出审核报告

## API接口说明

### 生成文书
```
POST /api/documents/generate
Content-Type: application/json
Authorization: Bearer <token>

{
  "caseId": 1,
  "templateType": "complaint",
  "caseInfo": { ... },
  "parties": [ ... ],
  "extraInfo": {
    "lawyer": "张律师",
    "lawFirm": "某某律师事务所",
    "notes": "特殊说明"
  }
}
```

### 审核文书
```
POST /api/documents/review
Content-Type: application/json
Authorization: Bearer <token>

{
  "caseId": 1,
  "content": "文书内容...",
  "options": ["compliance", "logic", "format", "completeness"],
  "caseInfo": { ... }
}
```

### 保存文书
```
POST /api/documents/save
Content-Type: application/json
Authorization: Bearer <token>

{
  "caseId": 1,
  "documentType": "complaint",
  "documentName": "起诉状",
  "content": "文书内容..."
}
```

### 获取文书列表
```
GET /api/cases/:caseId/documents
Authorization: Bearer <token>
```

## 功能特点

### 1. 智能化
- ✅ 基于案件信息自动生成
- ✅ 智能识别问题和风险
- ✅ 提供专业修改建议
- ✅ 引用法律依据

### 2. 规范化
- ✅ 符合法律文书格式规范
- ✅ 自动检查必要要素
- ✅ 统一文书模板
- ✅ 标准化审核流程

### 3. 便捷性
- ✅ 三步完成文书生成
- ✅ 支持在线编辑
- ✅ 一键复制下载
- ✅ 批量审核检查

### 4. 专业性
- ✅ 多维度审核检查
- ✅ 问题分级管理
- ✅ 详细修改建议
- ✅ 法律依据引用

## 扩展建议

### 1. 接入真实AI服务
当前使用模拟AI生成和审核，建议接入：
- OpenAI GPT-4
- 文心一言
- 通义千问
- 专业法律AI服务

### 2. 增强审核能力
- 引用法条准确性检查
- 案例引用规范性检查
- 数字金额一致性检查
- 时间逻辑合理性检查

### 3. 模板管理
- 支持自定义文书模板
- 模板版本管理
- 模板分享和导入
- 模板使用统计

### 4. 协作功能
- 文书多人协作编辑
- 审核意见批注
- 修改历史记录
- 文书审批流程

## 注意事项

1. **AI生成内容仅供参考**
   - 生成的文书需要人工审核
   - 根据实际情况修改完善
   - 确保事实准确、法律依据正确

2. **审核结果不能完全替代人工**
   - 审核结果仅作为辅助参考
   - 重要文书需要专业律师审核
   - 最终责任由使用者承担

3. **数据安全**
   - 文书内容涉及案件隐私
   - 注意数据加密和权限控制
   - 定期备份重要文书

4. **性能优化**
   - 大文件上传需要优化
   - 长文书审核可能耗时较长
   - 建议添加进度提示

## 测试用例

### 测试1: 生成起诉状
1. 进入案件详情页
2. 点击"智能生成"
3. 选择"起诉状"
4. 确认案件信息
5. 填写代理律师信息
6. 生成并保存

**预期结果**：生成符合规范的起诉状

### 测试2: 审核文书
1. 点击"智能审核"
2. 输入测试文书内容
3. 选择所有审核选项
4. 开始审核

**预期结果**：显示审核结果和问题列表

### 测试3: 文书管理
1. 查看文书列表
2. 点击"查看"查看文书详情
3. 点击"下载"下载文书
4. 点击"删除"删除文书

**预期结果**：所有操作正常执行

## 总结

智能文书生成与审核模块已完成开发，主要解决了：

✅ **文书撰写耗时**：通过AI自动生成，大幅减少撰写时间
✅ **文书易出错**：通过智能审核，自动发现问题和风险
✅ **格式不规范**：使用标准模板，确保文书格式统一
✅ **质量难保证**：多维度审核检查，提升文书质量

该模块可以显著提升律师工作效率，降低文书错误率，是法律案件管理系统的重要功能模块。

---

**开发完成时间**: 2025-11-19  
**状态**: ✅ 已完成，待集成测试  
**下一步**: 集成到案件详情页并进行功能测试
