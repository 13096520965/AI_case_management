# 地区 API 快速启动指南

## 快速开始

### 1. 启动后端服务

```bash
cd legal-case-management/backend
npm start
```

### 2. 测试 API

```bash
# 测试地区数据
curl http://localhost:3000/api/regions

# 或使用测试脚本
node test-region-api.js
```

### 3. 启动前端

```bash
cd legal-case-management/frontend
npm run dev
```

### 4. 使用功能

1. 打开案件详情页面
2. 点击"添加主体"按钮
3. 在地区选择器中选择省市区
4. 填写详细地址
5. 保存

## API 测试

### 使用 curl

```bash
# 获取全国数据
curl http://localhost:3000/api/regions

# 获取广东省的城市
curl http://localhost:3000/api/regions/440000

# 获取广州市的区县
curl http://localhost:3000/api/regions/440100
```

### 使用浏览器

直接访问：
- http://localhost:3000/api/regions
- http://localhost:3000/api/regions/440000
- http://localhost:3000/api/regions/440100

### 响应示例

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

## 前端使用

### 在组件中

```vue
<template>
  <el-cascader
    v-model="region"
    :options="regionOptions"
    placeholder="请选择省/市/区"
    :loading="loading"
    clearable
    filterable
  />
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { regionApi } from '@/api/region'

const region = ref([])
const regionOptions = ref([])
const loading = ref(false)

const fetchRegions = async () => {
  loading.value = true
  try {
    const response = await regionApi.getRegions()
    regionOptions.value = response.data
  } catch (error) {
    console.error('获取地区数据失败:', error)
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  fetchRegions()
})
</script>
```

### 获取选中的地区名称

```javascript
const getRegionLabels = (codes) => {
  const labels = []
  let currentLevel = regionOptions.value
  
  for (const code of codes) {
    const found = currentLevel.find(item => item.value === code)
    if (found) {
      labels.push(found.label)
      currentLevel = found.children || []
    }
  }
  
  return labels.join('')
}

// 使用
const regionCodes = ['440000', '440100', '440103']
const fullAddress = getRegionLabels(regionCodes) + '某某街道123号'
// 结果: 广东省广州市荔湾区某某街道123号
```

## 数据格式

### 选中值

```javascript
// 数组格式
region = ['440000', '440100', '440103']
// 对应: 广东省 > 广州市 > 荔湾区
```

### 存储格式

```javascript
// 逗号分隔
regionCode = '440000,440100,440103'
```

### 完整地址

```javascript
// 自动组合
address = '广东省广州市荔湾区某某街道123号'
```

## 常用地区编码

### 直辖市

| 地区 | 编码 |
|------|------|
| 北京市 | 110000 |
| 天津市 | 120000 |
| 上海市 | 310000 |
| 重庆市 | 500000 |

### 主要省份

| 地区 | 编码 |
|------|------|
| 河北省 | 130000 |
| 山西省 | 140000 |
| 辽宁省 | 210000 |
| 吉林省 | 220000 |
| 黑龙江省 | 230000 |
| 江苏省 | 320000 |
| 浙江省 | 330000 |
| 安徽省 | 340000 |
| 福建省 | 350000 |
| 江西省 | 360000 |
| 山东省 | 370000 |
| 河南省 | 410000 |
| 湖北省 | 420000 |
| 湖南省 | 430000 |
| 广东省 | 440000 |
| 广西壮族自治区 | 450000 |
| 海南省 | 460000 |
| 四川省 | 510000 |
| 贵州省 | 520000 |
| 云南省 | 530000 |
| 陕西省 | 610000 |
| 甘肃省 | 620000 |

### 主要城市

| 城市 | 编码 |
|------|------|
| 北京市 | 110100 |
| 上海市 | 310100 |
| 广州市 | 440100 |
| 深圳市 | 440300 |
| 成都市 | 510100 |
| 杭州市 | 330100 |
| 南京市 | 320100 |
| 武汉市 | 420100 |
| 西安市 | 610100 |

## 故障排查

### 问题 1: API 返回 404

**原因**: 路由未注册

**解决**:
```javascript
// 检查 app.js 中是否有
app.use('/api/regions', require('./routes/region'));
```

### 问题 2: 前端无法加载数据

**原因**: CORS 或网络问题

**解决**:
1. 检查后端是否启动
2. 检查 CORS 配置
3. 查看浏览器控制台错误

### 问题 3: 数据为空

**原因**: 数据文件路径错误

**解决**:
```javascript
// 检查 regionController.js 中的导入
const regionData = require('../data/regionData');
```

### 问题 4: 级联选择器不显示

**原因**: 数据格式不正确

**解决**:
确保数据格式为：
```javascript
{
  value: '编码',
  label: '名称',
  children: [...]
}
```

## 性能优化

### 1. 前端缓存

```javascript
// 只在组件挂载时加载一次
onMounted(() => {
  if (regionOptions.value.length === 0) {
    fetchRegions()
  }
})
```

### 2. 懒加载

```javascript
// 按需加载子级数据
const loadChildren = async (parentCode) => {
  const response = await regionApi.getRegionsByParent(parentCode)
  return response.data
}
```

### 3. 本地存储

```javascript
// 缓存到 localStorage
const cacheRegions = (data) => {
  localStorage.setItem('regions', JSON.stringify(data))
}

const getCachedRegions = () => {
  const cached = localStorage.getItem('regions')
  return cached ? JSON.parse(cached) : null
}
```

## 扩展功能

### 1. 添加新地区

编辑 `backend/src/data/regionData.js`：

```javascript
{
  value: '新省份编码',
  label: '新省份名称',
  children: [
    {
      value: '新城市编码',
      label: '新城市名称',
      children: [
        { value: '新区县编码', label: '新区县名称' }
      ]
    }
  ]
}
```

### 2. 实现搜索

```javascript
const searchRegion = (keyword) => {
  // 递归搜索
  const search = (data, keyword) => {
    const results = []
    for (const item of data) {
      if (item.label.includes(keyword)) {
        results.push(item)
      }
      if (item.children) {
        results.push(...search(item.children, keyword))
      }
    }
    return results
  }
  
  return search(regionOptions.value, keyword)
}
```

### 3. 获取完整路径

```javascript
const getFullPath = (code) => {
  // 递归查找路径
  const findPath = (data, code, path = []) => {
    for (const item of data) {
      const newPath = [...path, item]
      if (item.value === code) {
        return newPath
      }
      if (item.children) {
        const result = findPath(item.children, code, newPath)
        if (result) return result
      }
    }
    return null
  }
  
  return findPath(regionOptions.value, code)
}
```

## 相关资源

- [使用指南](./REGION-API-GUIDE.md)
- [更新总结](./REGION-API-UPDATE-SUMMARY.md)
- [Element Plus Cascader 文档](https://element-plus.org/zh-CN/component/cascader.html)

## 技术支持

如有问题，请查看：
1. 浏览器控制台错误
2. 后端服务日志
3. API 响应数据
4. 相关文档
