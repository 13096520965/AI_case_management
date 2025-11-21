# 公共组件使用文档

## 布局组件

### AppLayout
主应用布局组件，包含 Header、Sidebar、Footer 和主内容区域。

```vue
<template>
  <AppLayout>
    <router-view />
  </AppLayout>
</template>

<script setup>
import { AppLayout } from '@/components'
</script>
```

### AppHeader
应用头部组件，包含菜单切换、通知、用户信息等。

**Props:**
- `collapsed` (boolean): 侧边栏是否折叠

**Events:**
- `toggle-sidebar`: 切换侧边栏折叠状态

### AppSidebar
侧边栏导航组件。

**Props:**
- `collapsed` (boolean): 是否折叠

### AppFooter
页脚组件。

## 通用组件

### DataTable
数据表格组件，支持分页、排序、选择等功能。

```vue
<template>
  <DataTable
    :data="tableData"
    :loading="loading"
    :total="total"
    v-model:current-page="currentPage"
    v-model:page-size="pageSize"
    @page-change="handlePageChange"
    @selection-change="handleSelectionChange"
  >
    <el-table-column type="selection" width="55" />
    <el-table-column prop="name" label="名称" />
    <el-table-column prop="date" label="日期" sortable />
  </DataTable>
</template>

<script setup>
import { ref } from 'vue'
import { DataTable } from '@/components'

const tableData = ref([])
const loading = ref(false)
const total = ref(0)
const currentPage = ref(1)
const pageSize = ref(10)

const handlePageChange = (page, size) => {
  // 加载数据
}

const handleSelectionChange = (selection) => {
  // 处理选择变化
}
</script>
```

**Props:**
- `data` (array): 表格数据
- `loading` (boolean): 加载状态
- `total` (number): 总记录数
- `currentPage` (number): 当前页码
- `pageSize` (number): 每页条数
- `pageSizes` (array): 每页条数选项
- `showPagination` (boolean): 是否显示分页

**Events:**
- `page-change`: 分页变化
- `selection-change`: 选择变化
- `sort-change`: 排序变化

### FileUpload
文件上传组件，支持拖拽、多文件、文件类型和大小限制。

```vue
<template>
  <FileUpload
    action="/api/upload"
    :headers="{ Authorization: token }"
    accept=".pdf,.jpg,.png"
    :max-size="10"
    :multiple="true"
    :limit="5"
    drag
    tip="支持 PDF、JPG、PNG 格式，单个文件不超过 10MB"
    @success="handleSuccess"
    @error="handleError"
  />
</template>

<script setup>
import { FileUpload } from '@/components'

const handleSuccess = (response, file, fileList) => {
  console.log('上传成功', response)
}

const handleError = (error, file, fileList) => {
  console.log('上传失败', error)
}
</script>
```

**Props:**
- `action` (string): 上传地址
- `headers` (object): 请求头
- `data` (object): 额外参数
- `multiple` (boolean): 是否支持多选
- `limit` (number): 最大上传数量
- `accept` (string): 接受的文件类型
- `drag` (boolean): 是否支持拖拽
- `maxSize` (number): 最大文件大小（MB）
- `tip` (string): 提示文本

**Events:**
- `success`: 上传成功
- `error`: 上传失败
- `remove`: 移除文件
- `preview`: 预览文件
- `exceed`: 超出限制

### FormDialog
表单对话框组件。

```vue
<template>
  <FormDialog
    v-model="dialogVisible"
    title="添加用户"
    :form-data="formData"
    :rules="rules"
    :loading="loading"
    @confirm="handleConfirm"
    @cancel="handleCancel"
  >
    <template #default="{ formData }">
      <el-form-item label="用户名" prop="username">
        <el-input v-model="formData.username" />
      </el-form-item>
      <el-form-item label="邮箱" prop="email">
        <el-input v-model="formData.email" />
      </el-form-item>
    </template>
  </FormDialog>
</template>

<script setup>
import { ref } from 'vue'
import { FormDialog } from '@/components'

const dialogVisible = ref(false)
const loading = ref(false)
const formData = ref({
  username: '',
  email: ''
})

const rules = {
  username: [{ required: true, message: '请输入用户名' }],
  email: [{ required: true, message: '请输入邮箱' }]
}

const handleConfirm = async (data) => {
  loading.value = true
  // 提交数据
  loading.value = false
  dialogVisible.value = false
}

const handleCancel = () => {
  dialogVisible.value = false
}
</script>
```

**Props:**
- `modelValue` (boolean): 对话框显示状态
- `title` (string): 标题
- `formData` (object): 表单数据
- `rules` (object): 验证规则
- `width` (string|number): 宽度
- `loading` (boolean): 提交加载状态

**Events:**
- `confirm`: 确认提交
- `cancel`: 取消

### SearchForm
搜索表单组件。

```vue
<template>
  <SearchForm
    :search-data="searchData"
    @search="handleSearch"
    @reset="handleReset"
  >
    <template #default="{ searchData }">
      <el-form-item label="案号">
        <el-input v-model="searchData.caseNumber" placeholder="请输入案号" />
      </el-form-item>
      <el-form-item label="状态">
        <el-select v-model="searchData.status" placeholder="请选择状态">
          <el-option label="全部" value="" />
          <el-option label="进行中" value="active" />
          <el-option label="已结案" value="closed" />
        </el-select>
      </el-form-item>
    </template>
  </SearchForm>
</template>

<script setup>
import { ref } from 'vue'
import { SearchForm } from '@/components'

const searchData = ref({
  caseNumber: '',
  status: ''
})

const handleSearch = (data) => {
  console.log('搜索', data)
}

const handleReset = () => {
  console.log('重置')
}
</script>
```

**Props:**
- `searchData` (object): 搜索数据
- `inline` (boolean): 是否行内表单

**Events:**
- `search`: 搜索
- `reset`: 重置

### PageHeader
页面头部组件。

```vue
<template>
  <PageHeader
    title="案件详情"
    subtitle="案号：2024-001"
    show-back
    @back="handleBack"
  >
    <template #extra>
      <el-button type="primary">编辑</el-button>
      <el-button>删除</el-button>
    </template>
  </PageHeader>
</template>

<script setup>
import { PageHeader } from '@/components'

const handleBack = () => {
  // 返回逻辑
}
</script>
```

**Props:**
- `title` (string): 标题
- `subtitle` (string): 副标题
- `showBack` (boolean): 是否显示返回按钮

**Events:**
- `back`: 返回

## 使用示例

完整的页面示例：

```vue
<template>
  <div class="page-container">
    <PageHeader title="案件管理">
      <template #extra>
        <el-button type="primary" @click="handleAdd">新增案件</el-button>
      </template>
    </PageHeader>

    <SearchForm
      :search-data="searchData"
      @search="loadData"
      @reset="loadData"
    >
      <template #default="{ searchData }">
        <el-form-item label="案号">
          <el-input v-model="searchData.caseNumber" />
        </el-form-item>
      </template>
    </SearchForm>

    <DataTable
      :data="tableData"
      :loading="loading"
      :total="total"
      v-model:current-page="currentPage"
      v-model:page-size="pageSize"
      @page-change="loadData"
    >
      <el-table-column prop="caseNumber" label="案号" />
      <el-table-column prop="caseCause" label="案由" />
      <el-table-column label="操作">
        <template #default="{ row }">
          <el-button link @click="handleEdit(row)">编辑</el-button>
          <el-button link type="danger" @click="handleDelete(row)">删除</el-button>
        </template>
      </el-table-column>
    </DataTable>

    <FormDialog
      v-model="dialogVisible"
      title="案件信息"
      :form-data="formData"
      :rules="rules"
      @confirm="handleSubmit"
    >
      <template #default="{ formData }">
        <el-form-item label="案号" prop="caseNumber">
          <el-input v-model="formData.caseNumber" />
        </el-form-item>
      </template>
    </FormDialog>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { PageHeader, SearchForm, DataTable, FormDialog } from '@/components'

// 数据和方法...
</script>
```
