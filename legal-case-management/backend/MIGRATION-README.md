# 证据路径迁移 - 快速参考

## 快速开始

### 1. 备份数据库（必须！）
```bash
cp backend/database/legal_case.db backend/database/legal_case.db.backup
```

### 2. 模拟运行（查看将要进行的更改）
```bash
cd backend
node migrate-evidence-paths.js --dry-run --verbose
```

### 3. 执行实际迁移
```bash
cd backend
node migrate-evidence-paths.js
```

### 4. 验证结果
```bash
cd backend
node test-evidence-preview-fix.js
```

## 命令参数

| 参数 | 说明 |
|------|------|
| `--dry-run` | 模拟运行，不修改数据库 |
| `--verbose` | 显示详细日志 |

## 迁移内容

脚本会转换以下路径格式：

**转换前（完整路径）：**
```
C:\Users\username\project\backend\uploads\evidence\file.pdf
/Users/username/project/backend/uploads/evidence/file.pdf
```

**转换后（相对路径）：**
```
/uploads/evidence/file.pdf
```

## 影响的表

- `evidence` - 主证据表
- `evidence_versions` - 证据版本历史表

## 常见问题

### Q: 迁移是否安全？
A: 是的，但请务必先备份数据库。建议先使用 `--dry-run` 模拟运行。

### Q: 迁移需要多长时间？
A: 通常几秒钟即可完成。具体时间取决于证据记录数量。

### Q: 如果迁移失败怎么办？
A: 恢复数据库备份：
```bash
cp backend/database/legal_case.db.backup backend/database/legal_case.db
```

### Q: 迁移后需要重启服务吗？
A: 建议重启后端服务以确保更改生效。

### Q: 已经是相对路径的记录会被修改吗？
A: 不会。脚本会自动跳过已经是相对路径格式的记录。

## 验证清单

迁移完成后，请验证以下功能：

- [ ] 证据列表中的缩略图正常显示
- [ ] 点击预览按钮可以查看文件
- [ ] 下载功能正常工作
- [ ] 版本历史可以正常访问
- [ ] 新上传的文件使用正确的路径格式

## 技术支持

详细文档请参考：[MIGRATION-GUIDE.md](./MIGRATION-GUIDE.md)

## 相关文件

- `migrate-evidence-paths.js` - 迁移脚本
- `MIGRATION-GUIDE.md` - 详细迁移指南
- `test-evidence-preview-fix.js` - 测试脚本
