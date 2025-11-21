# Git 安装和配置指南

## 📥 下载Git

### 方法1：官方网站下载（推荐）

1. 访问：https://git-scm.com/download/win
2. 页面会自动开始下载最新版本
3. 如果没有自动下载，点击"Click here to download manually"

### 方法2：使用winget（Windows 11）

```powershell
winget install --id Git.Git -e --source winget
```

### 方法3：使用Chocolatey

```powershell
choco install git
```

## 🔧 安装Git

### 安装步骤

1. **运行安装程序**
   - 双击下载的 `Git-x.xx.x-64-bit.exe`

2. **选择安装位置**
   - 默认：`C:\Program Files\Git`
   - 或选择自定义位置

3. **选择组件**（推荐默认选项）
   - ✅ Windows Explorer integration
   - ✅ Git Bash Here
   - ✅ Git GUI Here
   - ✅ Associate .git* configuration files
   - ✅ Associate .sh files to be run with Bash

4. **选择默认编辑器**
   - 推荐：Visual Studio Code
   - 或选择：Vim / Notepad++ / Nano

5. **调整PATH环境**（重要！）
   - ✅ 选择：**Git from the command line and also from 3rd-party software**
   - 这会自动将Git添加到系统PATH

6. **选择HTTPS传输后端**
   - 推荐：Use the OpenSSL library

7. **配置行尾转换**
   - Windows推荐：Checkout Windows-style, commit Unix-style line endings

8. **选择终端模拟器**
   - 推荐：Use MinTTY (the default terminal of MSYS2)

9. **配置额外选项**
   - ✅ Enable file system caching
   - ✅ Enable Git Credential Manager

10. **完成安装**
    - 点击 Install
    - 等待安装完成
    - 点击 Finish

## ✅ 验证安装

### 1. 打开PowerShell或CMD

```powershell
# 检查Git版本
git --version
```

**预期输出：**
```
git version 2.43.0.windows.1
```

### 2. 检查Git路径

```powershell
# 查看Git安装路径
where.exe git
```

**预期输出：**
```
C:\Program Files\Git\cmd\git.exe
```

## 🔐 配置Git

### 1. 设置用户信息

```powershell
# 设置用户名
git config --global user.name "你的名字"

# 设置邮箱
git config --global user.email "your.email@example.com"
```

### 2. 查看配置

```powershell
# 查看所有配置
git config --list

# 查看用户名
git config user.name

# 查看邮箱
git config user.email
```

### 3. 配置默认分支名

```powershell
# 设置默认分支名为main
git config --global init.defaultBranch main
```

### 4. 配置编辑器（可选）

```powershell
# 使用VS Code作为默认编辑器
git config --global core.editor "code --wait"

# 或使用Notepad++
git config --global core.editor "'C:/Program Files/Notepad++/notepad++.exe' -multiInst -notabbar -nosession -noPlugin"
```

### 5. 配置换行符处理

```powershell
# Windows系统推荐配置
git config --global core.autocrlf true
```

### 6. 配置凭证存储

```powershell
# 使用Git Credential Manager
git config --global credential.helper manager-core
```

## 🌐 配置环境变量（如果自动配置失败）

### 方法1：通过系统设置

1. **打开系统环境变量**
   - 按 `Win + X`
   - 选择"系统"
   - 点击"高级系统设置"
   - 点击"环境变量"

2. **编辑Path变量**
   - 在"系统变量"中找到"Path"
   - 点击"编辑"
   - 点击"新建"
   - 添加以下路径：
     ```
     C:\Program Files\Git\cmd
     C:\Program Files\Git\bin
     ```

3. **保存并重启**
   - 点击"确定"保存所有更改
   - 重启PowerShell或CMD

### 方法2：使用PowerShell命令

```powershell
# 以管理员身份运行PowerShell
# 添加Git到系统PATH
[Environment]::SetEnvironmentVariable(
    "Path",
    [Environment]::GetEnvironmentVariable("Path", "Machine") + ";C:\Program Files\Git\cmd;C:\Program Files\Git\bin",
    "Machine"
)
```

## 🎯 初始化项目仓库

### 1. 初始化现有项目

```powershell
# 进入项目目录
cd D:\kiro\AI_code\legal-case-management

# 初始化Git仓库
git init

# 查看状态
git status
```

### 2. 创建.gitignore文件

```powershell
# 创建.gitignore
@"
# Node modules
node_modules/
npm-debug.log*

# Environment variables
.env
.env.local

# Build output
dist/
build/
*.log

# IDE
.vscode/
.idea/
*.swp
*.swo

# OS
.DS_Store
Thumbs.db

# Database
*.db
*.sqlite

# Uploads
uploads/
"@ | Out-File -FilePath .gitignore -Encoding utf8
```

### 3. 添加文件并提交

```powershell
# 添加所有文件
git add .

# 查看将要提交的文件
git status

# 提交
git commit -m "Initial commit: Legal Case Management System"
```

## 🔗 连接远程仓库（可选）

### GitHub

```powershell
# 添加远程仓库
git remote add origin https://github.com/yourusername/legal-case-management.git

# 推送到远程
git push -u origin main
```

### Gitee（国内）

```powershell
# 添加远程仓库
git remote add origin https://gitee.com/yourusername/legal-case-management.git

# 推送到远程
git push -u origin main
```

## 📚 常用Git命令

### 基本操作

```powershell
# 查看状态
git status

# 添加文件
git add <file>
git add .  # 添加所有文件

# 提交
git commit -m "提交说明"

# 查看历史
git log
git log --oneline  # 简洁模式

# 查看差异
git diff
```

### 分支操作

```powershell
# 查看分支
git branch

# 创建分支
git branch <branch-name>

# 切换分支
git checkout <branch-name>

# 创建并切换分支
git checkout -b <branch-name>

# 合并分支
git merge <branch-name>

# 删除分支
git branch -d <branch-name>
```

### 远程操作

```powershell
# 查看远程仓库
git remote -v

# 拉取更新
git pull

# 推送更新
git push

# 克隆仓库
git clone <url>
```

### 撤销操作

```powershell
# 撤销工作区修改
git checkout -- <file>

# 撤销暂存区
git reset HEAD <file>

# 撤销提交
git reset --soft HEAD^  # 保留修改
git reset --hard HEAD^  # 丢弃修改
```

## 🛠️ 故障排除

### 问题1：git命令未找到

**解决方法：**
1. 确认Git已安装
2. 检查PATH环境变量
3. 重启终端
4. 重启电脑

### 问题2：权限错误

**解决方法：**
```powershell
# 以管理员身份运行PowerShell
# 或配置凭证管理器
git config --global credential.helper manager-core
```

### 问题3：换行符警告

**解决方法：**
```powershell
# 配置自动转换
git config --global core.autocrlf true
```

### 问题4：中文文件名乱码

**解决方法：**
```powershell
# 配置支持中文
git config --global core.quotepath false
```

## 🎓 学习资源

### 官方文档
- Git官方文档：https://git-scm.com/doc
- Git Book（中文）：https://git-scm.com/book/zh/v2

### 在线教程
- GitHub Learning Lab：https://lab.github.com/
- Git教程（廖雪峰）：https://www.liaoxuefeng.com/wiki/896043488029600

### 可视化工具
- GitHub Desktop：https://desktop.github.com/
- GitKraken：https://www.gitkraken.com/
- SourceTree：https://www.sourcetreeapp.com/

## ✅ 快速验证清单

完成安装后，运行以下命令验证：

```powershell
# 1. 检查版本
git --version

# 2. 检查配置
git config --list

# 3. 测试基本命令
cd D:\kiro\AI_code\legal-case-management
git status

# 4. 查看帮助
git help
```

如果所有命令都能正常运行，说明Git已成功安装和配置！

## 📝 下一步

1. ✅ 安装Git
2. ✅ 配置用户信息
3. ✅ 初始化项目仓库
4. ✅ 创建.gitignore
5. ✅ 进行首次提交
6. 🔄 连接远程仓库（可选）
7. 🚀 开始使用版本控制

---

**Git安装和配置完成！** 🎉
