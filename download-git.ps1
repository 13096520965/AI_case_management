# Git 自动下载和安装脚本

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "   Git 自动下载和安装" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

# 检查是否已安装Git
Write-Host "检查Git是否已安装..." -ForegroundColor Yellow
$gitInstalled = Get-Command git -ErrorAction SilentlyContinue

if ($gitInstalled) {
    $gitVersion = git --version
    Write-Host "✅ Git已安装: $gitVersion" -ForegroundColor Green
    Write-Host "`n是否要重新安装？(Y/N)" -ForegroundColor Yellow
    $reinstall = Read-Host
    if ($reinstall -ne 'Y' -and $reinstall -ne 'y') {
        Write-Host "`n跳过安装。" -ForegroundColor Yellow
        exit 0
    }
}

# 下载Git
Write-Host "`n正在下载Git安装程序..." -ForegroundColor Yellow

$gitUrl = "https://github.com/git-for-windows/git/releases/download/v2.43.0.windows.1/Git-2.43.0-64-bit.exe"
$downloadPath = "$env:TEMP\Git-Installer.exe"

try {
    # 使用Invoke-WebRequest下载
    Write-Host "下载地址: $gitUrl" -ForegroundColor Gray
    Write-Host "保存位置: $downloadPath" -ForegroundColor Gray
    
    $ProgressPreference = 'SilentlyContinue'
    Invoke-WebRequest -Uri $gitUrl -OutFile $downloadPath -UseBasicParsing
    
    Write-Host "✅ 下载完成！" -ForegroundColor Green
    
    # 询问是否立即安装
    Write-Host "`n是否立即安装Git？(Y/N)" -ForegroundColor Yellow
    $install = Read-Host
    
    if ($install -eq 'Y' -or $install -eq 'y') {
        Write-Host "`n正在启动安装程序..." -ForegroundColor Yellow
        Write-Host "请按照安装向导完成安装。" -ForegroundColor Cyan
        Write-Host "`n推荐设置：" -ForegroundColor Cyan
        Write-Host "  1. 安装位置：默认 (C:\Program Files\Git)" -ForegroundColor Gray
        Write-Host "  2. 组件：保持默认选择" -ForegroundColor Gray
        Write-Host "  3. 默认编辑器：Visual Studio Code" -ForegroundColor Gray
        Write-Host "  4. PATH环境：Git from the command line and also from 3rd-party software" -ForegroundColor Gray
        Write-Host "  5. HTTPS后端：Use the OpenSSL library" -ForegroundColor Gray
        Write-Host "  6. 行尾转换：Checkout Windows-style, commit Unix-style" -ForegroundColor Gray
        Write-Host "  7. 终端模拟器：Use MinTTY" -ForegroundColor Gray
        Write-Host "  8. 额外选项：全部勾选`n" -ForegroundColor Gray
        
        # 启动安装程序
        Start-Process -FilePath $downloadPath -Wait
        
        Write-Host "`n安装完成！" -ForegroundColor Green
        Write-Host "请重启PowerShell以使PATH环境变量生效。`n" -ForegroundColor Yellow
        
        # 验证安装
        Write-Host "验证安装..." -ForegroundColor Yellow
        $env:Path = [System.Environment]::GetEnvironmentVariable("Path","Machine") + ";" + [System.Environment]::GetEnvironmentVariable("Path","User")
        
        $gitCheck = Get-Command git -ErrorAction SilentlyContinue
        if ($gitCheck) {
            $version = & git --version
            Write-Host "✅ Git安装成功: $version" -ForegroundColor Green
        } else {
            Write-Host "⚠️  请重启PowerShell后运行: git --version" -ForegroundColor Yellow
        }
    } else {
        Write-Host "`n安装程序已下载到: $downloadPath" -ForegroundColor Cyan
        Write-Host "您可以稍后手动运行安装。" -ForegroundColor Cyan
    }
    
} catch {
    Write-Host "`n❌ 下载失败: $_" -ForegroundColor Red
    Write-Host "`n请手动下载Git：" -ForegroundColor Yellow
    Write-Host "  访问: https://git-scm.com/download/win" -ForegroundColor Cyan
    Write-Host "  或使用winget: winget install --id Git.Git -e --source winget" -ForegroundColor Cyan
}

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "   下一步" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "1. 重启PowerShell" -ForegroundColor Gray
Write-Host "2. 运行: git --version" -ForegroundColor Gray
Write-Host "3. 配置用户信息:" -ForegroundColor Gray
Write-Host "   git config --global user.name `"你的名字`"" -ForegroundColor Gray
Write-Host "   git config --global user.email `"your.email@example.com`"" -ForegroundColor Gray
Write-Host "4. 查看完整指南: GIT_INSTALLATION_GUIDE.md`n" -ForegroundColor Gray
