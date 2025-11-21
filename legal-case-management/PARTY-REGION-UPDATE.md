# 诉讼主体地址字段更新说明

## 更新内容

### 前端更新

1. **新增省市区级联选择器**
   - 使用 Element Plus 的 Cascader 组件
   - 支持省/市/区三级联动选择
   - 数据源：`src/utils/regionData.ts`（包含主要城市数据）

2. **新增详细地址字段**
   - 独立的详细地址输入框
   - 用于输入街道、门牌号等具体信息

3. **必填项更新**
   - ✅ 统一社会信用代码（企业必填）
   - ✅ 法定代表人（企业必填）
   - ✅ 身份证号（个人必填）
   - ✅ 电子邮箱（必填）
   - ✅ 所在地区（必填）
   - ✅ 详细地址（必填）

4. **表单验证规则**
   ```javascript
   - 统一社会信用代码：18位，符合国标格式
   - 法定代表人：2-50个字符
   - 身份证号：15或18位，支持X结尾
   - 电子邮箱：标准邮箱格式
   - 联系电话：11位手机号
   - 所在地区：必须选择省市区
   - 详细地址：5-200个字符
   ```

### 后端更新

1. **数据库表结构**
   - 新增字段：`region_code` (VARCHAR(100)) - 存储地区编码（逗号分隔）
   - 新增字段：`detail_address` (TEXT) - 存储详细地址
   - 保留字段：`address` (TEXT) - 存储完整地址（省市区+详细地址）

2. **数据迁移**
   - 迁移脚本：`backend/migrate-party-fields.js`
   - 保留现有数据
   - 新字段默认为空

3. **API 支持**
   - 创建诉讼主体时接收新字段
   - 更新诉讼主体时支持新字段
   - 查询时返回所有字段

## 数据结构

### 前端提交数据格式

```javascript
{
  partyType: "原告",
  entityType: "企业",
  name: "某某科技有限公司",
  unifiedCreditCode: "91110000XXXXXXXXXX",
  legalRepresentative: "张三",
  contactPhone: "13800138000",
  contactEmail: "contact@example.com",
  region: ["440000", "440100", "440103"], // 省市区编码数组
  detailAddress: "某某街道123号",
  address: "广东省广州市荔湾区某某街道123号", // 自动组合
  regionCode: "440000,440100,440103" // 自动转换
}
```

### 后端存储格式

```sql
INSERT INTO litigation_parties (
  case_id, party_type, entity_type, name,
  unified_credit_code, legal_representative,
  contact_phone, contact_email,
  address, region_code, detail_address
) VALUES (
  1, '原告', '企业', '某某科技有限公司',
  '91110000XXXXXXXXXX', '张三',
  '13800138000', 'contact@example.com',
  '广东省广州市荔湾区某某街道123号',
  '440000,440100,440103',
  '某某街道123号'
);
```

## 使用说明

### 1. 运行数据库迁移

```bash
cd legal-case-management/backend
node migrate-party-fields.js
```

### 2. 前端使用

在案件详情页面，点击"添加主体"按钮：

1. 选择主体身份（原告/被告/第三人）
2. 选择实体类型（企业/个人）
3. 填写基本信息
4. **选择所在地区**（省市区级联选择）
5. **填写详细地址**（街道、门牌号等）
6. 填写联系方式

### 3. 地区数据扩展

如需添加更多城市，编辑 `frontend/src/utils/regionData.ts`：

```typescript
export const regionData: RegionItem[] = [
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
]
```

或者从后端 API 动态加载地区数据。

## 兼容性说明

1. **向后兼容**
   - 旧数据的 `address` 字段保持不变
   - 新数据会同时填充 `address`、`region_code` 和 `detail_address`
   - 编辑旧数据时，如果没有 `region_code`，地区选择器为空

2. **数据展示**
   - 列表页面显示完整地址（`address` 字段）
   - 编辑时优先使用 `region_code` 和 `detail_address`
   - 如果没有分离的地址数据，显示完整地址

## 验证测试

### 测试用例

1. **企业主体**
   - ✅ 必填项：统一社会信用代码、法定代表人、电子邮箱、地区、详细地址
   - ✅ 格式验证：信用代码18位、邮箱格式、手机号格式

2. **个人主体**
   - ✅ 必填项：身份证号、电子邮箱、地区、详细地址
   - ✅ 格式验证：身份证15或18位、邮箱格式、手机号格式

3. **地区选择**
   - ✅ 省市区三级联动
   - ✅ 必须选择到区级
   - ✅ 自动组合完整地址

4. **数据保存**
   - ✅ 完整地址自动组合
   - ✅ 地区编码正确保存
   - ✅ 详细地址独立保存

## 相关文件

### 前端
- `frontend/src/components/case/PartyManagement.vue` - 主体管理组件
- `frontend/src/utils/regionData.ts` - 地区数据

### 后端
- `backend/src/config/initDatabase.js` - 数据库初始化
- `backend/src/models/LitigationParty.js` - 主体模型
- `backend/src/controllers/partyController.js` - 主体控制器
- `backend/src/config/migrations/003_add_party_region_fields.js` - 迁移脚本
- `backend/migrate-party-fields.js` - 迁移执行脚本

## 注意事项

1. 地区数据目前只包含主要城市，实际使用时建议：
   - 使用完整的国家标准地区数据
   - 或从后端 API 动态加载
   - 或使用第三方地区数据包

2. 地区编码使用国家标准行政区划代码

3. 完整地址由系统自动组合，无需手动输入省市区

4. 建议定期更新地区数据以保持准确性
