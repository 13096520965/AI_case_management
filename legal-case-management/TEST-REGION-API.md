# 地区 API 测试指南

## 问题修复

### 问题
前端报错：`http://localhost:5174/src/utils/request` 404

### 原因
`region.ts` 中的导入路径错误：
```typescript
// ❌ 错误
import request from '@/utils/request'

// ✅ 正确
import request from './request'
```

### 解决方案
已修正导入路径，与其他 API 文件保持一致。

## 测试步骤

### 1. 启动后端服务

```bash
cd legal-case-management/backend
npm start
```

**预期输出**:
```
Server is running on port 3000
Environment: development
```

### 2. 测试后端 API

#### 方法 1: 使用 curl

```bash
# 测试获取全国数据
curl http://localhost:3000/api/regions

# 测试获取广东省的城市
curl http://localhost:3000/api/regions/440000
```

#### 方法 2: 使用浏览器

直接访问：
- http://localhost:3000/api/regions
- http://localhost:3000/api/regions/440000

#### 方法 3: 使用测试脚本

```bash
cd legal-case-management/backend
node test-region-api.js
```

**预期输出**:
```
============================================================
测试地区数据
============================================================

1. 数据结构验证
总省份数: 26

省份: 北京市 (110000)
  城市数: 1
    北京市: 16 个区县

...

============================================================
统计信息:
  省级: 26
  市级: 39
  区县级: 443
  总计: 508
============================================================

✓ 地区数据测试完成
```

### 3. 启动前端服务

```bash
cd legal-case-management/frontend
npm run dev
```

**预期输出**:
```
VITE v5.x.x  ready in xxx ms

➜  Local:   http://localhost:5173/
➜  Network: use --host to expose
```

### 4. 测试前端功能

#### 步骤 1: 打开浏览器
访问 http://localhost:5173

#### 步骤 2: 登录系统
使用测试账号登录

#### 步骤 3: 进入案件详情
1. 点击任意案件
2. 或创建新案件

#### 步骤 4: 添加诉讼主体
1. 点击"添加主体"按钮
2. 填写基本信息
3. 点击"所在地区"选择器

#### 步骤 5: 验证地区数据
- ✅ 选择器应该显示省份列表
- ✅ 选择省份后显示城市列表
- ✅ 选择城市后显示区县列表
- ✅ 支持搜索功能
- ✅ 支持清空选择

### 5. 检查浏览器控制台

打开浏览器开发者工具 (F12)，查看：

#### Network 标签
应该看到成功的请求：
```
Request URL: http://localhost:3000/api/regions
Status: 200 OK
Response: { data: [...], message: "获取地区数据成功" }
```

#### Console 标签
不应该有错误信息，如果有错误：
- ❌ `404 Not Found` - 检查后端是否启动
- ❌ `CORS error` - 检查 CORS 配置
- ❌ `Network error` - 检查网络连接

## 常见问题排查

### 问题 1: 404 Not Found

**症状**: 
```
GET http://localhost:3000/api/regions 404 (Not Found)
```

**检查清单**:
- [ ] 后端服务是否启动？
- [ ] 路由是否正确注册？
- [ ] URL 是否正确？

**解决方案**:
```bash
# 检查后端日志
cd legal-case-management/backend
npm start

# 检查路由注册
# 确认 app.js 中有：
app.use('/api/regions', require('./routes/region'));
```

### 问题 2: CORS Error

**症状**:
```
Access to XMLHttpRequest at 'http://localhost:3000/api/regions' 
from origin 'http://localhost:5173' has been blocked by CORS policy
```

**解决方案**:
检查 `backend/src/app.js` 中的 CORS 配置：
```javascript
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
  credentials: true
}));
```

### 问题 3: 空数据

**症状**: 
选择器显示为空

**检查清单**:
- [ ] API 返回数据格式是否正确？
- [ ] 前端是否正确解析数据？
- [ ] 是否有 JavaScript 错误？

**解决方案**:
```javascript
// 在浏览器控制台执行
console.log(regionOptions.value)

// 应该看到类似：
[
  {
    value: "110000",
    label: "北京市",
    children: [...]
  }
]
```

### 问题 4: 导入路径错误

**症状**:
```
Failed to resolve import "@/utils/request"
```

**解决方案**:
确保使用正确的导入路径：
```typescript
// ✅ 正确
import request from './request'

// ❌ 错误
import request from '@/utils/request'
```

## 验证清单

### 后端
- [ ] 服务启动成功
- [ ] API 返回 200 状态码
- [ ] 数据格式正确
- [ ] 包含 26 个省份
- [ ] 包含 39 个城市
- [ ] 包含 443 个区县

### 前端
- [ ] 服务启动成功
- [ ] 无导入错误
- [ ] 无 404 错误
- [ ] 地区选择器正常显示
- [ ] 三级联动正常工作
- [ ] 搜索功能正常
- [ ] 清空功能正常

### 功能
- [ ] 可以选择省份
- [ ] 可以选择城市
- [ ] 可以选择区县
- [ ] 可以搜索地区
- [ ] 可以清空选择
- [ ] 地址自动组合正确

## 成功标准

当以下所有条件满足时，表示测试通过：

1. ✅ 后端 API 返回正确数据
2. ✅ 前端成功加载数据
3. ✅ 地区选择器正常显示
4. ✅ 三级联动正常工作
5. ✅ 无控制台错误
6. ✅ 可以成功保存诉讼主体

## 测试数据示例

### 测试用例 1: 北京企业

```
主体身份: 原告
实体类型: 企业
企业名称: 北京某某科技有限公司
统一社会信用代码: 91110000XXXXXXXXXX
法定代表人: 张三
联系电话: 13800138000
电子邮箱: contact@example.com
所在地区: 北京市 > 北京市 > 朝阳区
详细地址: 建国路88号SOHO现代城A座1001室
```

### 测试用例 2: 广州个人

```
主体身份: 被告
实体类型: 个人
姓名: 李四
身份证号: 440101199001011234
联系电话: 13900139000
电子邮箱: lisi@example.com
所在地区: 广东省 > 广州市 > 天河区
详细地址: 天河路123号
```

### 测试用例 3: 上海企业

```
主体身份: 第三人
实体类型: 企业
企业名称: 上海某某贸易有限公司
统一社会信用代码: 91310000XXXXXXXXXX
法定代表人: 王五
联系电话: 13700137000
电子邮箱: info@example.com
所在地区: 上海市 > 上海市 > 浦东新区
详细地址: 世纪大道1号国金中心
```

## 性能测试

### 加载时间
- 首次加载地区数据: < 500ms
- 展开省份: < 100ms
- 展开城市: < 100ms
- 搜索响应: < 50ms

### 内存使用
- 地区数据大小: ~50KB
- 内存占用: < 5MB

## 下一步

测试通过后，可以：
1. 添加更多省份和城市
2. 实现数据库存储
3. 添加数据管理界面
4. 实现数据导入导出
5. 对接第三方地区数据服务

## 相关文档

- [地区 API 使用指南](./REGION-API-GUIDE.md)
- [更新总结](./REGION-API-UPDATE-SUMMARY.md)
- [快速启动指南](./QUICK-START-REGION-API.md)
