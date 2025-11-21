# 推送到新分支指南

## 🎯 目标

将本地完整代码推送到GitHub的新分支 `feature/ai-complete-system`，避免直接覆盖main分支。

## 📋 步骤

### 1. 推送到新分支

```powershell
cd D:\kiro\AI_code\legal-case-management

# 推送当前main分支到远程的feature/ai-complete-system分支
git push origin main:feature/ai-complete-system
```

**如果需要认证：**
- Username: `13096520965`
- Password: `[你的GitHub Token]`

### 2. 验证推送

```powershell
# 查看远程分支
git branch -r

# 应该看到：
#   origin/feature/ai-complete-system
#   origin/main
#   origin/temlate-management
```

### 3. 在GitHub上查看

访问：https://github.com/13096520965/AI_case_management/branches

你应该能看到新分支 `feature/ai-complete-system`

### 4. 创建Pull Request（可选）

如果想合并到main分支：

1. 访问：https://github.com/13096520965/AI_case_management
2. 点击 "Pull requests"
3. 点击 "New pull request"
4. 选择：
   - base: `main`
   - compare: `feature/ai-complete-system`
5. 点击 "Create pull request"
6. 填写标题和描述
7. 点击 "Create pull request"
8. Review后点击 "Merge pull request"

## 🔐 认证方式

### 方式1：使用Token（推荐）

推送时会提示输入用户名和密码：
```
Username: 13096520965
Password: [粘贴你的Token]
```

### 方式2：配置Git Credential

```powershell
# 配置Git记住凭证
git config --global credential.helper manager-core

# 第一次推送时输入Token，之后会自动记住
```

### 方式3：在URL中包含Token（不推荐）

```powershell
# 临时使用（不会保存）
git push https://[token]@github.com/13096520965/AI_case_management.git main:feature/ai-complete-system
```

## 📊 推送内容

### 统计信息
- **文件数**: 297个
- **代码行数**: 69,321行
- **提交信息**: "feat: 完整的法律案件管理系统 - 包含AI助手、文书管理、证据管理等完整功能"

### 主要内容
- ✅ 完整的后端API系统
- ✅ Vue3前端应用
- ✅ AI助手集成（通义千问）
- ✅ 文书智能生成和审核
- ✅ 证据管理系统
- ✅ 流程管理
- ✅ 费用管理
- ✅ 数据分析
- ✅ 协作功能
- ✅ 归档系统
- ✅ 30+个详细文档

## ⚠️ 如果推送失败

### 问题1：认证失败

```
remote: Invalid username or password.
```

**解决方法：**
- 确认Token是否正确
- 确认Token有repo权限
- 尝试重新生成Token

### 问题2：网络超时

```
fatal: unable to access 'https://github.com/...': Failed to connect
```

**解决方法：**
```powershell
# 增加超时时间
git config --global http.postBuffer 524288000
git config --global http.lowSpeedLimit 0
git config --global http.lowSpeedTime 999999

# 重试推送
git push origin main:feature/ai-complete-system
```

### 问题3：文件太大

```
remote: error: File xxx is 100.00 MB; this exceeds GitHub's file size limit
```

**解决方法：**
```powershell
# 检查大文件
git ls-files -s | awk '$4 > 50000000 {print $4, $2}'

# 如果是node_modules或uploads，确保它们在.gitignore中
# 然后重新提交
```

## 🔄 推送后的操作

### 1. 切换到新分支工作

```powershell
# 创建并切换到本地的feature分支
git checkout -b feature/ai-complete-system

# 设置跟踪远程分支
git branch --set-upstream-to=origin/feature/ai-complete-system
```

### 2. 继续开发

```powershell
# 修改代码...

# 提交更改
git add .
git commit -m "feat: 添加新功能"

# 推送到feature分支
git push origin feature/ai-complete-system
```

### 3. 合并到main（在GitHub上）

1. 创建Pull Request
2. Review代码
3. 合并到main分支
4. 删除feature分支（可选）

## 📝 手动推送命令

如果自动推送有问题，可以手动执行：

```powershell
# 1. 确认当前状态
cd D:\kiro\AI_code\legal-case-management
git status

# 2. 查看提交历史
git log --oneline -5

# 3. 推送到新分支
git push origin main:feature/ai-complete-system

# 4. 如果需要强制推送（覆盖远程分支）
git push -f origin main:feature/ai-complete-system
```

## 🎉 成功标志

推送成功后，你会看到类似输出：

```
Enumerating objects: 500, done.
Counting objects: 100% (500/500), done.
Delta compression using up to 8 threads
Compressing objects: 100% (400/400), done.
Writing objects: 100% (500/500), 5.00 MiB | 1.00 MiB/s, done.
Total 500 (delta 200), reused 0 (delta 0)
remote: Resolving deltas: 100% (200/200), done.
To https://github.com/13096520965/AI_case_management.git
 * [new branch]      main -> feature/ai-complete-system
```

## 📚 相关链接

- **GitHub仓库**: https://github.com/13096520965/AI_case_management
- **分支列表**: https://github.com/13096520965/AI_case_management/branches
- **创建PR**: https://github.com/13096520965/AI_case_management/compare

## 💡 提示

1. **保护main分支**：在GitHub设置中可以设置分支保护规则
2. **Code Review**：通过PR可以进行代码审查
3. **CI/CD**：可以配置GitHub Actions自动测试和部署
4. **文档**：README.md会自动显示在仓库首页

---

**准备好了吗？执行推送命令！** 🚀

```powershell
git push origin main:feature/ai-complete-system
```
