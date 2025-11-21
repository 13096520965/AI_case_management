# 立案日期显示问题调试指南

## 问题

历史案件对话框中，立案日期列没有显示数据。

## 已确认的信息

### 1. 数据库字段存在 ✅
```
cases 表包含 filing_date (DATE) 字段
```

### 2. 数据库有数据 ✅
```
ID: 33, 案号: 2025111701, 立案日期: 2025-11-17
ID: 34, 案号: 冀1091民初8255号, 立案日期: 2025-11-18
ID: 35, 案号: 案号1, 立案日期: null
```

### 3. 前端代码已更新 ✅
```vue
<el-table-column label="立案日期" width="120">
  <template #default="{ row }">
    {{ row.filing_date || '-' }}
  </template>
</el-table-column>
```

## 可能的原因

### 原因 1: 浏览器缓存 ⭐ 最可能

浏览器缓存了旧的组件代码，没有加载最新的更改。

**解决方案**:
1. 硬刷新浏览器：
   - Windows/Linux: `Ctrl + Shift + R`
   - Mac: `Cmd + Shift + R`
2. 或清除浏览器缓存后刷新

### 原因 2: 前端服务未重启

前端开发服务器没有检测到文件变化。

**解决方案**:
```bash
# 重启前端服务
cd legal-case-management/frontend
# 停止当前服务 (Ctrl+C)
npm run dev
```

### 原因 3: 后端数据格式问题

后端返回的数据格式不正确。

**检查方法**:
打开浏览器开发者工具 (F12) → Network 标签 → 查找 `/api/parties/history` 请求 → 查看响应数据

**预期响应**:
```json
{
  "data": {
    "name": "某某公司",
    "cases": [
      {
        "id": 33,
        "case_number": "2025111701",
        "case_type": "民事",
        "case_cause": "案由1",
        "filing_date": "2025-11-17",
        "status": "审理中"
      }
    ]
  }
}
```

### 原因 4: 数据为 null

该案件的 filing_date 字段为 null。

**检查方法**:
查看具体案件的数据，如果 filing_date 为 null，会显示 `-`

## 调试步骤

### 步骤 1: 硬刷新浏览器 ⭐ 先试这个

```
Windows/Linux: Ctrl + Shift + R
Mac: Cmd + Shift + R
```

### 步骤 2: 检查浏览器控制台

1. 打开浏览器开发者工具 (F12)
2. 切换到 Console 标签
3. 查看是否有错误信息

### 步骤 3: 检查网络请求

1. 打开浏览器开发者工具 (F12)
2. 切换到 Network 标签
3. 点击"历史案件"按钮
4. 查找 `/api/parties/history` 请求
5. 点击该请求，查看 Response 标签
6. 确认响应数据中是否包含 `filing_date` 字段

**示例检查**:
```javascript
// 在浏览器控制台执行
console.log(historyList.value)
// 查看数据结构
```

### 步骤 4: 检查组件数据

在浏览器控制台执行：
```javascript
// 查看历史案件数据
console.log('历史案件数据:', historyList)
```

### 步骤 5: 手动测试 API

```bash
# 获取案件数据（需要替换实际的案件ID）
curl http://localhost:3000/api/cases/33
```

## 快速修复方案

### 方案 1: 强制刷新（推荐）⭐

1. 关闭浏览器标签页
2. 重新打开 http://localhost:5173
3. 硬刷新：`Ctrl + Shift + R` (Windows) 或 `Cmd + Shift + R` (Mac)
4. 登录并测试

### 方案 2: 清除缓存

1. 打开浏览器设置
2. 清除浏览器缓存
3. 重新访问网站

### 方案 3: 重启前端服务

```bash
# 停止前端服务
# 在前端终端按 Ctrl+C

# 重新启动
cd legal-case-management/frontend
npm run dev
```

### 方案 4: 使用隐身模式测试

1. 打开浏览器隐身/无痕模式
2. 访问 http://localhost:5173
3. 测试功能

## 验证清单

完成以下检查：

- [ ] 硬刷新浏览器 (Ctrl+Shift+R 或 Cmd+Shift+R)
- [ ] 检查浏览器控制台是否有错误
- [ ] 检查 Network 标签中的 API 响应
- [ ] 确认响应数据包含 filing_date 字段
- [ ] 确认 filing_date 不是 null
- [ ] 尝试隐身模式测试

## 预期结果

### 正确显示

```
历史案件对话框
┌────────────────────────────────────────────────────┐
│ 案号          │案件类型│案由    │法院    │立案日期    │
├───────────────┼────────┼────────┼────────┼───────────┤
│ 2025111701    │民事    │案由1   │XX法院  │2025-11-17 │
│ 冀1091民初... │民事    │买卖... │XX法院  │2025-11-18 │
│ 案号1         │行政    │行政... │XX法院  │-          │
└────────────────────────────────────────────────────┘
```

### 字段说明

- 有日期：显示 `YYYY-MM-DD` 格式（如 `2025-11-17`）
- 无日期：显示 `-`

## 代码更新说明

### 更新内容

```vue
<!-- 之前 -->
<el-table-column prop="filing_date" label="立案日期" width="120" />

<!-- 现在 -->
<el-table-column label="立案日期" width="120">
  <template #default="{ row }">
    {{ row.filing_date || '-' }}
  </template>
</el-table-column>
```

### 改进点

1. ✅ 使用自定义模板渲染
2. ✅ 处理 null 值（显示 `-`）
3. ✅ 确保数据正确显示

## 如果问题仍然存在

### 检查后端返回

在浏览器控制台执行：
```javascript
// 查看完整的响应数据
fetch('/api/parties/history?name=测试主体名称', {
  headers: {
    'Authorization': 'Bearer ' + localStorage.getItem('token')
  }
})
.then(r => r.json())
.then(data => console.log('API响应:', data))
```

### 检查组件状态

在 PartyManagement.vue 中添加调试日志：
```javascript
const fetchPartyHistory = async (partyName: string) => {
  historyLoading.value = true
  try {
    const response = await partyApi.getPartyHistory(partyName)
    console.log('历史案件响应:', response) // 添加这行
    if (response.data) {
      const data = response.data.cases || response.data
      console.log('历史案件数据:', data) // 添加这行
      historyList.value = Array.isArray(data) ? data : []
    }
  } catch (error: any) {
    ElMessage.error(error.message || '获取历史案件失败')
  } finally {
    historyLoading.value = false
  }
}
```

## 联系支持

如果以上方法都无法解决问题，请提供：

1. 浏览器控制台的错误信息（截图）
2. Network 标签中 API 响应数据（截图）
3. 使用的浏览器和版本
4. 是否已经硬刷新浏览器

---

**最可能的解决方案**: 硬刷新浏览器 (Ctrl+Shift+R 或 Cmd+Shift+R) ⭐
