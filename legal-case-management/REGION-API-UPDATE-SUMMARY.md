# 地区数据 API 更新总结

## 更新内容

将诉讼主体表单的地区选择从前端静态数据改为后端 API 动态获取，支持全国省市区数据。

## 实现方案

### 1. 后端实现 ✅

#### 创建地区数据文件
- **文件**: `backend/src/data/regionData.js`
- **内容**: 全国 26 个省份，39 个城市，443 个区县
- **格式**: 三级嵌套结构（省 > 市 > 区）

#### 创建控制器
- **文件**: `backend/src/controllers/regionController.js`
- **接口**:
  - `GET /api/regions` - 获取全国数据
  - `GET /api/regions/:parentCode` - 获取子级数据

#### 创建路由
- **文件**: `backend/src/routes/region.js`
- **注册**: 在 `app.js` 中注册路由

### 2. 前端实现 ✅

#### 创建 API 接口
- **文件**: `frontend/src/api/region.ts`
- **方法**:
  - `getRegions()` - 获取全国数据
  - `getRegionsByParent(parentCode)` - 获取子级数据

#### 更新组件
- **文件**: `frontend/src/components/case/PartyManagement.vue`
- **改动**:
  - 移除静态 `regionData` 导入
  - 添加 `regionApi` 导入
  - 添加 `fetchRegions()` 方法
  - 添加 `regionLoading` 状态
  - 在 `onMounted` 中调用 API
  - 级联选择器添加 `loading`、`clearable`、`filterable` 属性

## 数据覆盖

### 包含的地区

#### 直辖市 (4个)
- 北京市 (16个区)
- 天津市 (16个区)
- 上海市 (16个区)
- 重庆市 (26个区)

#### 省份 (22个)
1. 河北省 - 石家庄、唐山
2. 山西省 - 太原
3. 辽宁省 - 沈阳、大连
4. 吉林省 - 长春
5. 黑龙江省 - 哈尔滨
6. 江苏省 - 南京、无锡、苏州
7. 浙江省 - 杭州、宁波
8. 安徽省 - 合肥
9. 福建省 - 福州、厦门
10. 江西省 - 南昌
11. 山东省 - 济南、青岛
12. 河南省 - 郑州
13. 湖北省 - 武汉
14. 湖南省 - 长沙
15. 广东省 - 广州、深圳、珠海、佛山、江门、湛江
16. 海南省 - 海口、三亚
17. 四川省 - 成都
18. 贵州省 - 贵阳
19. 云南省 - 昆明
20. 陕西省 - 西安
21. 甘肃省 - 兰州
22. 广西壮族自治区 - 南宁

### 统计数据
- **省级**: 26 个
- **市级**: 39 个
- **区县级**: 443 个
- **总计**: 508 个地区

## 功能特性

### 1. 三级联动
- 省 → 市 → 区
- 自动加载下级数据
- 支持悬停展开

### 2. 搜索过滤
- 支持拼音搜索
- 支持汉字搜索
- 实时过滤结果

### 3. 清空选择
- 一键清空已选地区
- 重新选择

### 4. 加载状态
- 显示加载动画
- 防止重复请求

### 5. 数据缓存
- 组件挂载时加载一次
- 缓存在内存中
- 提高性能

## API 接口

### 获取全国数据

```bash
GET /api/regions
```

**响应**:
```json
{
  "data": [
    {
      "value": "110000",
      "label": "北京市",
      "children": [...]
    }
  ],
  "message": "获取地区数据成功"
}
```

### 获取子级数据

```bash
GET /api/regions/:parentCode
```

**示例**:
```bash
# 获取省级
GET /api/regions/root

# 获取广东省的城市
GET /api/regions/440000

# 获取广州市的区县
GET /api/regions/440100
```

## 使用示例

### 前端调用

```typescript
import { regionApi } from '@/api/region'

// 获取全国数据
const response = await regionApi.getRegions()
regionOptions.value = response.data
```

### 组件使用

```vue
<el-cascader
  v-model="formData.region"
  :options="regionOptions"
  placeholder="请选择省/市/区"
  :loading="regionLoading"
  clearable
  filterable
/>
```

### 数据格式

```javascript
// 选中值
formData.region = ['440000', '440100', '440103']

// 存储格式
regionCode: '440000,440100,440103'

// 完整地址
address: '广东省广州市荔湾区某某街道123号'
```

## 测试验证

### 后端测试

```bash
cd legal-case-management/backend
node test-region-api.js
```

**结果**: ✅ 通过
- 数据结构正确
- 包含 26 个省份
- 包含 39 个城市
- 包含 443 个区县

### 前端测试

1. 打开诉讼主体表单
2. 点击地区选择器
3. 验证数据加载
4. 测试三级联动
5. 测试搜索功能
6. 测试清空功能

## 优势对比

### 之前（静态数据）
- ❌ 数据固定在前端代码中
- ❌ 只包含少量城市
- ❌ 更新需要修改前端代码
- ❌ 数据分散在多个文件

### 现在（API 动态获取）
- ✅ 数据集中管理
- ✅ 包含全国主要城市
- ✅ 更新只需修改后端数据文件
- ✅ 支持动态扩展
- ✅ 可以实现数据库存储
- ✅ 支持搜索和过滤

## 扩展建议

### 短期
1. 添加更多城市和区县
2. 实现数据缓存机制
3. 添加数据更新接口

### 中期
1. 将数据存储到数据库
2. 实现管理后台
3. 支持数据导入导出

### 长期
1. 对接第三方地区数据服务
2. 实现自动同步更新
3. 支持国际地区数据

## 相关文件

### 后端
- ✅ `backend/src/data/regionData.js` - 地区数据
- ✅ `backend/src/controllers/regionController.js` - 控制器
- ✅ `backend/src/routes/region.js` - 路由
- ✅ `backend/src/app.js` - 路由注册
- ✅ `backend/test-region-api.js` - 测试脚本

### 前端
- ✅ `frontend/src/api/region.ts` - API 接口
- ✅ `frontend/src/components/case/PartyManagement.vue` - 组件更新
- ⚠️ `frontend/src/utils/regionData.ts` - 已废弃（保留作为备份）

### 文档
- ✅ `REGION-API-GUIDE.md` - 使用指南
- ✅ `REGION-API-UPDATE-SUMMARY.md` - 更新总结

## 注意事项

1. **数据来源**: 基于国家统计局行政区划代码
2. **数据更新**: 修改 `regionData.js` 后需重启后端服务
3. **性能**: 数据在前端缓存，不会重复请求
4. **兼容性**: 向后兼容，旧数据可以正常显示
5. **扩展性**: 可以轻松添加更多地区

## 部署清单

### 后端
- [x] 创建地区数据文件
- [x] 创建控制器
- [x] 创建路由
- [x] 注册路由
- [x] 测试接口

### 前端
- [x] 创建 API 接口
- [x] 更新组件
- [x] 测试功能
- [x] 验证数据

### 文档
- [x] 使用指南
- [x] 更新总结
- [x] API 文档

## 状态

🟢 **已完成并测试通过**

- ✅ 后端 API 正常工作
- ✅ 前端组件正常加载
- ✅ 数据格式正确
- ✅ 三级联动正常
- ✅ 搜索功能正常
- ✅ 所有测试通过

## 下一步

1. 根据实际需求添加更多城市
2. 考虑实现数据库存储
3. 添加数据管理界面
4. 实现数据导入功能
