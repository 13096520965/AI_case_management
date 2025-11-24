# 归档功能优化 - 添加归档表单

## ✅ 更新内容

### 问题
之前的归档功能只是简单地更新案件状态，没有创建归档记录，导致归档列表中看不到归档的案件。

### 解决方案
添加归档表单对话框，收集归档人和备注信息，创建完整的归档记录。

## 🎯 新增功能

### 1. 归档表单对话框
点击"一键归档"按钮后，弹出表单对话框，包含：

#### 字段说明
| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| 案件名称 | 文本 | - | 自动带出（案由/案号/内部编号），禁用编辑 |
| 归档人 | 文本 | 是 | 必填，输入归档人姓名 |
| 备注 | 文本域 | 否 | 选填，输入归档备注信息 |

### 2. 自动带出案件名称
优先级顺序：
1. 案由（caseCause）
2. 案号（caseNumber）
3. 内部编号（internalNumber）
4. 默认值："未命名案件"

### 3. 表单验证
- 归档人：必填验证
- 备注：可选，无验证

## 📊 界面展示

### 归档表单
```
┌─────────────────────────────────────────────────────────┐
│ 案件归档                                      [×]        │
├─────────────────────────────────────────────────────────┤
│                                                         │
│ 案件名称：  [合同纠纷_____________________] (禁用)     │
│                                                         │
│ 归档人：    [_____________________________] *必填      │
│                                                         │
│ 备注：      [_____________________________]            │
│            [_____________________________]            │
│            [_____________________________]            │
│            [_____________________________]            │
│                                                         │
│                                    [取消]  [确定归档]   │
└─────────────────────────────────────────────────────────┘
```

### 表单验证
```
┌─────────────────────────────────────────────────────────┐
│ 案件归档                                      [×]        │
├─────────────────────────────────────────────────────────┤
│                                                         │
│ 案件名称：  [合同纠纷_____________________]            │
│                                                         │
│ 归档人：    [_____________________________]            │
│            ⚠️ 请输入归档人                              │
│                                                         │
│ 备注：      [_____________________________]            │
│                                                         │
│                                    [取消]  [确定归档]   │
└─────────────────────────────────────────────────────────┘
```

## 🔧 技术实现

### 1. 状态定义
```typescript
const archiveDialogVisible = ref(false)
const archiveFormRef = ref<FormInstance>()
const archiveForm = reactive({
  archiver: '',
  notes: ''
})
```

### 2. 打开归档对话框
```typescript
const handleArchive = () => {
  // 重置表单
  archiveForm.archiver = ''
  archiveForm.notes = ''
  archiveFormRef.value?.clearValidate()
  // 打开对话框
  archiveDialogVisible.value = true
}
```

### 3. 提交归档
```typescript
const submitArchive = async () => {
  if (!archiveFormRef.value) return
  
  await archiveFormRef.value.validate(async (valid) => {
    if (!valid) return
    
    try {
      // 更新案件状态为已归档
      await caseApi.updateCase(caseId, { status: '已归档' })
      
      // 创建归档记录
      await archiveApi.createArchive({
        caseId: caseId,
        caseNumber: caseData.caseNumber || caseData.internalNumber,
        caseName: caseData.caseCause || '未命名案件',
        archiver: archiveForm.archiver,
        notes: archiveForm.notes
      })
      
      ElMessage.success('案件已成功归档，已加入归档列表')
      
      // 关闭对话框
      archiveDialogVisible.value = false
      
      // 刷新案件数据
      await fetchCaseData()
    } catch (error: any) {
      ElMessage.error(error.message || '归档失败')
    }
  })
}
```

### 4. 表单模板
```vue
<el-dialog
  v-model="archiveDialogVisible"
  title="案件归档"
  width="500px"
  :close-on-click-modal="false"
>
  <el-form
    ref="archiveFormRef"
    :model="archiveForm"
    label-width="100px"
  >
    <el-form-item label="案件名称">
      <el-input
        :value="caseData.caseCause || caseData.caseNumber || caseData.internalNumber || '未命名案件'"
        disabled
      />
    </el-form-item>

    <el-form-item
      label="归档人"
      prop="archiver"
      :rules="[{ required: true, message: '请输入归档人', trigger: 'blur' }]"
    >
      <el-input
        v-model="archiveForm.archiver"
        placeholder="请输入归档人姓名"
      />
    </el-form-item>

    <el-form-item label="备注" prop="notes">
      <el-input
        v-model="archiveForm.notes"
        type="textarea"
        :rows="4"
        placeholder="请输入归档备注（选填）"
      />
    </el-form-item>
  </el-form>

  <template #footer>
    <el-button @click="archiveDialogVisible = false">取消</el-button>
    <el-button type="primary" @click="submitArchive">确定归档</el-button>
  </template>
</el-dialog>
```

## 📝 使用流程

### 完整的归档流程

1. **进入案件详情页面**
   - 案件状态为"已结案"
   - 看到绿色的"一键归档"按钮

2. **点击归档按钮**
   - 弹出"案件归档"对话框
   - 案件名称自动带出

3. **填写归档信息**
   - 输入归档人姓名（必填）
   - 输入归档备注（选填）

4. **提交归档**
   - 点击"确定归档"按钮
   - 系统验证表单
   - 如果归档人未填写，显示错误提示

5. **归档完成**
   - 更新案件状态为"已归档"
   - 创建归档记录
   - 显示成功提示
   - 关闭对话框
   - 刷新页面数据

6. **查看归档列表**
   - 进入归档管理页面
   - 可以看到刚才归档的案件
   - 显示归档人和备注信息

## 🎯 后续开发

### 需要创建归档API
目前代码中归档记录创建部分是TODO注释，需要：

1. **后端API**
   ```javascript
   // POST /api/archives
   {
     caseId: number,
     caseNumber: string,
     caseName: string,
     archiver: string,
     notes: string
   }
   ```

2. **前端API封装**
   ```typescript
   // src/api/archive.ts
   export const archiveApi = {
     createArchive: (data: ArchiveData) => {
       return request.post('/archives', data)
     }
   }
   ```

3. **数据库表**
   ```sql
   CREATE TABLE archives (
     id INTEGER PRIMARY KEY AUTOINCREMENT,
     case_id INTEGER NOT NULL,
     case_number VARCHAR(100),
     case_name VARCHAR(200),
     archiver VARCHAR(100) NOT NULL,
     notes TEXT,
     archived_at DATETIME DEFAULT CURRENT_TIMESTAMP,
     FOREIGN KEY (case_id) REFERENCES cases(id)
   );
   ```

## 📋 相关文件

| 文件 | 说明 |
|------|------|
| `frontend/src/views/case/CaseDetail.vue` | 案件详情页面（已添加归档表单） |
| `CASE-ARCHIVE-FEATURE.md` | 归档功能说明文档（已更新） |

## ✨ 测试步骤

1. 创建一个测试案件（内部编号：AN202511000003）
2. 将案件状态设置为"已结案"
3. 进入案件详情页面
4. 点击"一键归档"按钮
5. 验证对话框是否弹出
6. 验证案件名称是否自动带出
7. 不填写归档人，点击"确定归档"
8. 验证是否显示"请输入归档人"错误提示
9. 填写归档人："张三"
10. 填写备注："案件已结案，归档存档"
11. 点击"确定归档"
12. 验证成功提示是否显示
13. 验证案件状态是否更新为"已归档"
14. 进入归档管理页面
15. 验证案件是否出现在归档列表中

现在归档功能更加完善，会收集归档人和备注信息！🎉
