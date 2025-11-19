# 协同管理页面实现说明

## 实现概述

本次实现完成了任务 25（协同管理页面）的两个子任务：
- 25.1 实现协作成员管理
- 25.2 实现协作任务管理

## 实现的功能

### 1. 协作成员管理页面 (CollaborationMembers.vue)

**路由**: `/collaboration/cases/:id/members`

**功能特性**:
- ✅ 显示案件的所有协作成员列表
- ✅ 添加新的协作成员
  - 从用户列表中选择用户
  - 设置成员角色（主办律师、协办律师、助理、观察者）
  - 配置成员权限（查看案件、编辑案件、管理证据、管理文书、管理成本、分配任务）
- ✅ 编辑现有成员的角色和权限
- ✅ 移除协作成员（带确认提示）
- ✅ 显示成员的详细信息（姓名、用户名、邮箱、角色、权限、加入时间）

**UI 组件**:
- Element Plus Table 展示成员列表
- Element Plus Dialog 用于添加/编辑成员
- Element Plus Form 用于表单验证
- Element Plus Tag 用于显示角色和权限标签

### 2. 协作任务管理页面 (CollaborationTasks.vue)

**路由**: `/collaboration/cases/:id/tasks`

**功能特性**:
- ✅ 显示案件的所有协作任务列表
- ✅ 创建新的协作任务
  - 设置任务标题和描述
  - 分配负责人（从案件协作成员中选择）
  - 设置优先级（高、中、低）
  - 设置截止日期
- ✅ 查看任务详情
  - 显示完整的任务信息
  - 包括分配人、创建时间、完成时间等
- ✅ 编辑任务
  - 更新任务信息
  - 修改任务状态（待处理、进行中、已完成、已取消）
- ✅ 删除任务（带确认提示）
- ✅ 任务筛选
  - 按状态筛选
  - 按优先级筛选
- ✅ 超期提醒
  - 超期任务以红色高亮显示

**UI 组件**:
- Element Plus Table 展示任务列表
- Element Plus Dialog 用于创建/编辑/查看任务
- Element Plus Form 用于表单验证
- Element Plus Select 用于筛选
- Element Plus Tag 用于显示状态和优先级
- Element Plus Descriptions 用于显示任务详情

## 后端 API 增强

为了支持前端功能，添加了以下后端接口：

### 新增用户列表接口

**路由**: `GET /api/auth/users`

**功能**: 获取所有用户列表，用于在添加协作成员时选择用户

**实现文件**:
- `backend/src/controllers/authController.js` - 添加 `getAllUsers` 方法
- `backend/src/routes/auth.js` - 添加路由定义

**参数**:
- `page` (可选): 页码，默认 1
- `limit` (可选): 每页数量，默认 100
- `role` (可选): 按角色筛选

**返回**:
```json
{
  "message": "获取用户列表成功",
  "data": [
    {
      "id": 1,
      "username": "user1",
      "real_name": "张三",
      "email": "user1@example.com",
      "role": "user",
      "created_at": "2024-01-01 00:00:00"
    }
  ],
  "total": 10
}
```

## 技术实现细节

### 前端技术栈
- Vue 3 Composition API
- TypeScript
- Element Plus UI 组件库
- Axios 用于 HTTP 请求

### 状态管理
- 使用 Vue 3 的 `ref` 和 `reactive` 进行本地状态管理
- 通过 API 调用与后端同步数据

### 表单验证
- 使用 Element Plus 的表单验证规则
- 必填字段验证
- 异步提交处理

### 用户体验优化
- 加载状态指示器
- 操作成功/失败的消息提示
- 删除操作的二次确认
- 空状态提示
- 超期任务的视觉提醒

## 文件清单

### 前端文件
- `frontend/src/views/collaboration/CollaborationMembers.vue` - 协作成员管理页面
- `frontend/src/views/collaboration/CollaborationTasks.vue` - 协作任务管理页面

### 后端文件（修改）
- `backend/src/controllers/authController.js` - 添加获取用户列表方法
- `backend/src/routes/auth.js` - 添加用户列表路由

### 已存在的后端支持
- `backend/src/controllers/collaborationController.js` - 协作管理控制器
- `backend/src/routes/collaboration.js` - 协作管理路由
- `backend/src/models/CollaborationMember.js` - 协作成员模型
- `backend/src/models/CollaborationTask.js` - 协作任务模型

## 使用说明

### 访问协作成员管理
1. 进入案件详情页
2. 点击"协作成员"标签或导航到 `/collaboration/cases/{caseId}/members`
3. 点击"添加成员"按钮添加新成员
4. 在列表中可以编辑或移除现有成员

### 访问协作任务管理
1. 进入案件详情页
2. 点击"协作任务"标签或导航到 `/collaboration/cases/{caseId}/tasks`
3. 点击"创建任务"按钮创建新任务
4. 使用筛选器按状态或优先级过滤任务
5. 点击"查看"查看任务详情，点击"编辑"修改任务

## 测试建议

1. **成员管理测试**:
   - 添加不同角色的成员
   - 设置不同的权限组合
   - 编辑成员角色和权限
   - 移除成员

2. **任务管理测试**:
   - 创建不同优先级的任务
   - 分配任务给不同成员
   - 更新任务状态
   - 测试超期任务的显示
   - 使用筛选器过滤任务

3. **集成测试**:
   - 验证成员列表在任务分配时正确显示
   - 验证删除成员后相关任务的处理
   - 验证权限控制是否生效

## 注意事项

1. 需要先有用户数据才能添加协作成员
2. 任务的负责人只能从当前案件的协作成员中选择
3. 超期任务会以红色高亮显示，但不会自动更改状态
4. 所有操作都需要用户认证（JWT token）

## 后续优化建议

1. 添加实时通知功能，当任务被分配或状态更新时通知相关用户
2. 添加任务评论功能，方便团队协作讨论
3. 添加任务附件上传功能
4. 实现更细粒度的权限控制
5. 添加任务统计和报表功能
6. 支持任务批量操作
7. 添加任务模板功能
