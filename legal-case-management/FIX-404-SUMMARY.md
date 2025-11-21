# 404 错误修复总结

## 问题描述

前端访问时报错：
```
http://localhost:5174/src/utils/request 404 Not Found
```

## 问题原因

`frontend/src/api/region.ts` 文件中的导入路径错误：

```typescript
// ❌ 错误的导入路径
import request from '@/utils/request'
```

实际上 `request.ts` 文件位于 `src/api/request.ts`，而不是 `src/utils/request.ts`。

## 解决方案

### 修改前
```typescript
import request from '@/utils/request'
```

### 修改后
```typescript
import request from './request'
```

## 修复文件

- ✅ `frontend/src/api/region.ts` - 已修正导入路径

## 验证

### 1. 检查导入路径

所有 API 文件现在都使用统一的导入方式：

```typescript
// ✅ 正确 - 所有 API 文件
import request from './request'
```

### 2. 文件位置确认

```
frontend/src/
├── api/
│   ├── request.ts          ← request 文件在这里
│   ├── region.ts           ← 使用 './request'
│   ├── case.ts             ← 使用 './request'
│   ├── party.ts            ← 使用 './request'
│   └── ...                 ← 其他 API 文件
└── utils/
    └── regionData.ts       ← 旧的静态数据（已废弃）
```

### 3. 测试步骤

```bash
# 1. 启动后端
cd legal-case-management/backend
npm start

# 2. 启动前端
cd legal-case-management/frontend
npm run dev

# 3. 访问前端
# 打开浏览器访问 http://localhost:5173

# 4. 测试地区选择
# 进入案件详情 > 添加主体 > 选择地区
```

### 4. 预期结果

- ✅ 无 404 错误
- ✅ 地区数据正常加载
- ✅ 选择器显示省市区列表
- ✅ 三级联动正常工作

## 相关文件

### 已修改
- `frontend/src/api/region.ts` - 修正导入路径

### 无需修改
- `frontend/src/api/request.ts` - 保持不变
- `frontend/src/components/case/PartyManagement.vue` - 保持不变
- 其他 API 文件 - 已经使用正确路径

## 技术说明

### 为什么使用相对路径？

在同一目录下的文件之间导入，使用相对路径更简洁：

```typescript
// ✅ 推荐 - 相对路径
import request from './request'

// ⚠️ 也可以 - 绝对路径（但不必要）
import request from '@/api/request'

// ❌ 错误 - 路径不存在
import request from '@/utils/request'
```

### TypeScript 路径别名

项目配置了路径别名 `@` 指向 `src` 目录：

```typescript
// tsconfig.json 或 vite.config.ts
{
  "compilerOptions": {
    "paths": {
      "@/*": ["./src/*"]
    }
  }
}
```

所以：
- `@/api/request` = `src/api/request.ts` ✅
- `@/utils/request` = `src/utils/request.ts` ❌ (不存在)

## 预防措施

### 1. 统一导入规范

所有 API 文件都应该使用相同的导入方式：

```typescript
// 在 src/api/ 目录下的文件
import request from './request'
```

### 2. 代码检查

可以添加 ESLint 规则来检查导入路径：

```javascript
// .eslintrc.js
rules: {
  'import/no-unresolved': 'error'
}
```

### 3. 类型检查

TypeScript 会在编译时检查导入路径：

```bash
npm run type-check
```

## 常见错误

### 错误 1: 路径不存在
```typescript
// ❌ 文件不存在
import request from '@/utils/request'
```

### 错误 2: 路径拼写错误
```typescript
// ❌ 拼写错误
import request from './requset'
```

### 错误 3: 扩展名错误
```typescript
// ❌ 不需要扩展名
import request from './request.ts'

// ✅ 正确
import request from './request'
```

## 测试清单

- [x] 修正导入路径
- [x] 验证文件无语法错误
- [x] 检查其他 API 文件的导入方式
- [ ] 启动后端服务
- [ ] 启动前端服务
- [ ] 测试地区选择功能
- [ ] 验证无 404 错误
- [ ] 验证数据正常加载

## 状态

🟢 **已修复**

- ✅ 导入路径已修正
- ✅ 文件无语法错误
- ✅ 与其他 API 文件保持一致
- ⏳ 等待运行时测试验证

## 下一步

1. 启动服务进行测试
2. 验证功能正常工作
3. 如有其他问题，查看 [TEST-REGION-API.md](./TEST-REGION-API.md)
