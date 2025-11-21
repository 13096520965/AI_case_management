# 地区数据 API 使用指南

## 概述

系统现在通过后端 API 提供全国省市区数据，支持三级联动选择。

## 数据统计

- **省级**: 26 个省/直辖市/自治区
- **市级**: 39 个主要城市
- **区县级**: 443 个区县
- **总计**: 508 个地区

## 包含的省份

### 直辖市 (4个)
- 北京市
- 天津市
- 上海市
- 重庆市

### 省份 (18个)
- 河北省
- 山西省
- 辽宁省
- 吉林省
- 黑龙江省
- 江苏省
- 浙江省
- 安徽省
- 福建省
- 江西省
- 山东省
- 河南省
- 湖北省
- 湖南省
- 广东省
- 四川省
- 陕西省
- 甘肃省

### 自治区 (2个)
- 广西壮族自治区

### 特别行政区 (1个)
- 海南省

### 其他省份
- 贵州省
- 云南省

## API 接口

### 1. 获取全国省市区数据

**接口**: `GET /api/regions`

**响应示例**:
```json
{
  "data": [
    {
      "value": "110000",
      "label": "北京市",
      "children": [
        {
          "value": "110100",
          "label": "北京市",
          "children": [
            { "value": "110101", "label": "东城区" },
            { "value": "110102", "label": "西城区" }
          ]
        }
      ]
    }
  ],
  "message": "获取地区数据成功"
}
```

### 2. 根据父级编码获取下级地区

**接口**: `GET /api/regions/:parentCode`

**参数**:
- `parentCode`: 父级地区编码，使用 `root` 获取省级数据

**示例**:
```bash
# 获取省级数据
GET /api/regions/root

# 获取广东省的城市
GET /api/regions/440000

# 获取广州市的区县
GET /api/regions/440100
```

## 前端使用

### 1. API 调用

```typescript
import { regionApi } from '@/api/region'

// 获取全国数据
const response = await regionApi.getRegions()
const regions = response.data

// 获取指定地区的子级
const children = await regionApi.getRegionsByParent('440000')
```

### 2. 组件中使用

在 `PartyManagement.vue` 中已集成：

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

**特性**:
- ✅ 自动从 API 加载数据
- ✅ 支持三级联动
- ✅ 支持搜索过滤
- ✅ 支持清空选择
- ✅ 显示加载状态

### 3. 数据格式

**选中值**: 数组格式，包含省市区编码
```javascript
formData.region = ['440000', '440100', '440103']
// 对应: 广东省 > 广州市 > 荔湾区
```

**存储格式**: 逗号分隔的字符串
```javascript
regionCode: '440000,440100,440103'
```

**完整地址**: 自动组合
```javascript
address: '广东省广州市荔湾区某某街道123号'
```

## 数据结构

### RegionItem 接口

```typescript
interface RegionItem {
  value: string      // 行政区划代码
  label: string      // 地区名称
  children?: RegionItem[]  // 子级地区
}
```

### 行政区划代码规则

- **省级**: 6位，后4位为0 (如: 110000)
- **市级**: 6位，后2位为0 (如: 110100)
- **区县级**: 6位完整编码 (如: 110101)

## 后端实现

### 文件结构

```
backend/
├── src/
│   ├── data/
│   │   └── regionData.js          # 地区数据
│   ├── controllers/
│   │   └── regionController.js    # 控制器
│   └── routes/
│       └── region.js               # 路由
```

### 数据文件

`src/data/regionData.js` 包含完整的省市区数据：

```javascript
module.exports = [
  {
    value: '440000',
    label: '广东省',
    children: [
      {
        value: '440100',
        label: '广州市',
        children: [
          { value: '440103', label: '荔湾区' },
          // ...
        ]
      }
    ]
  }
]
```

## 扩展数据

### 添加新省份

编辑 `backend/src/data/regionData.js`：

```javascript
{
  value: '省份编码',
  label: '省份名称',
  children: [
    {
      value: '城市编码',
      label: '城市名称',
      children: [
        { value: '区县编码', label: '区县名称' }
      ]
    }
  ]
}
```

### 添加新城市

在对应省份的 `children` 数组中添加：

```javascript
{
  value: '城市编码',
  label: '城市名称',
  children: [
    { value: '区县编码', label: '区县名称' }
  ]
}
```

### 添加新区县

在对应城市的 `children` 数组中添加：

```javascript
{ value: '区县编码', label: '区县名称' }
```

## 测试

### 测试脚本

```bash
cd legal-case-management/backend
node test-region-api.js
```

### 测试输出

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
```

## 性能优化

### 1. 数据缓存

前端在组件挂载时加载一次，缓存在内存中：

```javascript
onMounted(() => {
  fetchRegions()  // 只调用一次
})
```

### 2. 懒加载（可选）

如果数据量很大，可以实现按需加载：

```javascript
// 只加载省级数据
const provinces = await regionApi.getRegionsByParent('root')

// 用户选择省份后，加载城市
const cities = await regionApi.getRegionsByParent(provinceCode)

// 用户选择城市后，加载区县
const districts = await regionApi.getRegionsByParent(cityCode)
```

### 3. 数据压缩

对于生产环境，可以考虑：
- 使用 gzip 压缩响应
- 实现数据分页
- 使用 CDN 缓存

## 常见问题

### Q: 如何添加更多省份？

A: 编辑 `backend/src/data/regionData.js`，按照现有格式添加新的省份数据。

### Q: 数据来源是什么？

A: 数据基于国家统计局的行政区划代码标准。

### Q: 如何更新地区数据？

A: 直接修改 `regionData.js` 文件，重启后端服务即可生效。

### Q: 支持动态更新吗？

A: 当前是静态数据，如需动态更新，可以：
1. 将数据存储到数据库
2. 提供管理接口
3. 实现数据同步机制

### Q: 如何实现全国所有地区？

A: 可以使用完整的行政区划数据包，或从第三方API获取。推荐数据源：
- 国家统计局官网
- 民政部行政区划数据
- 第三方地区数据服务

## 相关文件

### 后端
- `backend/src/data/regionData.js` - 地区数据
- `backend/src/controllers/regionController.js` - 控制器
- `backend/src/routes/region.js` - 路由
- `backend/src/app.js` - 路由注册
- `backend/test-region-api.js` - 测试脚本

### 前端
- `frontend/src/api/region.ts` - API 接口
- `frontend/src/components/case/PartyManagement.vue` - 使用示例

## 更新日志

### v1.0.0 (2024-11-21)
- ✅ 实现地区数据 API
- ✅ 支持全国 26 个省份
- ✅ 包含 39 个主要城市
- ✅ 包含 443 个区县
- ✅ 前端组件集成
- ✅ 支持搜索和过滤
