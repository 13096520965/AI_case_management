# 文书智能模块 AI 服务接入指南

## 概述

文书智能模块现已支持接入真实的AI服务，包括：
- OpenAI (GPT-3.5/GPT-4)
- 通义千问 (Qianwen)
- 文心一言 (Wenxin)
- 模拟服务 (Mock) - 用于开发测试

系统采用**智能降级策略**：当AI服务不可用时，自动切换到模板生成和规则审核，确保系统稳定运行。

## 功能特性

### 1. 智能文书生成
- 使用AI根据案件信息自动生成专业法律文书
- 支持多种文书类型：起诉状、答辩状、代理词、案件汇报等
- AI生成失败时自动降级到模板生成

### 2. 智能文书审核
- 使用AI对文书进行全面审核
- 检查合规性、格式、逻辑、语言等多个维度
- AI审核失败时自动降级到规则审核

### 3. 多AI服务支持
- 灵活配置不同的AI服务提供商
- 统一的接口，方便切换
- 支持自定义API地址和模型

## 快速开始

### 1. 配置环境变量

复制 `.env.example` 到 `.env`：

```bash
cd backend
cp .env.example .env
```

### 2. 选择AI服务提供商

#### 选项 A: 使用模拟服务（默认）

```env
AI_PROVIDER=mock
```

适用于开发测试，不需要真实的API Key。

#### 选项 B: 使用 OpenAI

```env
AI_PROVIDER=openai
AI_API_KEY=sk-your-openai-api-key
AI_MODEL=gpt-3.5-turbo
AI_MAX_TOKENS=2000
AI_TIMEOUT=30000
```

#### 选项 C: 使用通义千问

```env
AI_PROVIDER=qianwen
AI_API_KEY=your-qianwen-api-key
AI_MODEL=qwen-turbo
AI_MAX_TOKENS=2000
AI_TIMEOUT=30000
```

#### 选项 D: 使用文心一言

```env
AI_PROVIDER=wenxin
AI_API_KEY=your-wenxin-api-key
AI_SECRET_KEY=your-wenxin-secret-key
AI_MODEL=completions
AI_MAX_TOKENS=2000
AI_TIMEOUT=30000
```

### 3. 重启服务

```bash
npm start
```

## 详细配置

### OpenAI 配置

#### 获取 API Key

1. 访问 [OpenAI Platform](https://platform.openai.com/)
2. 注册/登录账号
3. 进入 API Keys 页面
4. 创建新的 API Key

#### 配置示例

```env
AI_PROVIDER=openai
AI_API_KEY=sk-proj-xxxxxxxxxxxxxxxxxxxxx
AI_API_URL=https://api.openai.com/v1/chat/completions
AI_MODEL=gpt-3.5-turbo
AI_MAX_TOKENS=2000
AI_TIMEOUT=30000
```

#### 模型选择

- `gpt-3.5-turbo`: 性价比高，响应快
- `gpt-4`: 质量更高，成本更高
- `gpt-4-turbo`: 平衡性能和成本

#### 使用代理（可选）

如果需要使用代理访问OpenAI：

```env
AI_API_URL=https://your-proxy-domain.com/v1/chat/completions
```

### 通义千问配置

#### 获取 API Key

1. 访问 [阿里云控制台](https://dashscope.console.aliyun.com/)
2. 开通 DashScope 服务
3. 创建 API Key

#### 配置示例

```env
AI_PROVIDER=qianwen
AI_API_KEY=sk-xxxxxxxxxxxxxxxxxxxxx
AI_API_URL=https://dashscope.aliyuncs.com/api/v1/services/aigc/text-generation/generation
AI_MODEL=qwen-turbo
AI_MAX_TOKENS=2000
AI_TIMEOUT=30000
```

#### 模型选择

- `qwen-turbo`: 快速响应，适合大多数场景
- `qwen-plus`: 更强的理解和生成能力
- `qwen-max`: 最强性能，适合复杂任务

### 文心一言配置

#### 获取 API Key

1. 访问 [百度智能云](https://cloud.baidu.com/)
2. 开通文心一言服务
3. 创建应用，获取 API Key 和 Secret Key

#### 配置示例

```env
AI_PROVIDER=wenxin
AI_API_KEY=your-api-key
AI_SECRET_KEY=your-secret-key
AI_MODEL=completions
AI_MAX_TOKENS=2000
AI_TIMEOUT=30000
```

#### 模型选择

- `completions`: ERNIE-Bot
- `eb-instant`: ERNIE-Bot-turbo
- `completions_pro`: ERNIE-Bot 4.0

## 使用示例

### 1. 生成文书

前端调用：

```javascript
import { generateDocument } from '@/api/document'

const result = await generateDocument({
  caseId: 1,
  templateType: 'complaint', // 起诉状
  caseInfo: {
    case_cause: '合同纠纷',
    court: '北京市朝阳区人民法院',
    target_amount: 100000,
    filing_date: '2024-01-01'
  },
  parties: [
    {
      party_type: '原告',
      name: '张三',
      entity_type: '自然人',
      contact_phone: '13800138000'
    },
    {
      party_type: '被告',
      name: '李四',
      entity_type: '自然人',
      contact_phone: '13900139000'
    }
  ],
  extraInfo: {
    lawyer: '王律师',
    lawFirm: '某某律师事务所',
    notes: '双方签订合同后，被告未按约定支付款项'
  }
})

console.log(result.data.content) // AI生成的文书内容
```

### 2. 审核文书

前端调用：

```javascript
import { reviewDocument } from '@/api/document'

const result = await reviewDocument({
  caseId: 1,
  content: '民事起诉状\n\n原告：张三...',
  options: ['compliance', 'format', 'logic', 'language'],
  caseInfo: {
    case_cause: '合同纠纷',
    court: '北京市朝阳区人民法院',
    case_number: '(2024)京0105民初12345号'
  }
})

console.log(result.data.score) // 审核评分
console.log(result.data.issues) // 发现的问题
console.log(result.data.suggestions) // 优化建议
```

## 工作原理

### 智能降级策略

```
用户请求
  ↓
尝试调用AI服务
  ↓
AI服务可用？
  ├─ 是 → 使用AI生成/审核
  └─ 否 → 降级到模板/规则
       ↓
     返回结果
```

### 文书生成流程

1. **构建提示词**: 根据案件信息和文书类型构建专业的提示词
2. **调用AI服务**: 发送请求到配置的AI服务
3. **处理响应**: 解析AI返回的文书内容
4. **降级处理**: 如果AI失败，使用模板生成

### 文书审核流程

1. **构建审核提示**: 根据审核选项构建审核要求
2. **调用AI服务**: 发送文书内容到AI服务
3. **解析结果**: 解析AI返回的审核结果（JSON格式）
4. **降级处理**: 如果AI失败，使用规则审核

## 提示词设计

### 文书生成提示词

系统会自动构建包含以下信息的提示词：

- **角色定位**: "你是一位专业的法律文书撰写专家"
- **案件信息**: 案由、案号、法院、标的额等
- **当事人信息**: 原告、被告的详细信息
- **补充信息**: 案件说明、律师信息等
- **格式要求**: 严格按照法律文书规范

### 文书审核提示词

系统会自动构建包含以下信息的提示词：

- **角色定位**: "你是一位专业的法律文书审核专家"
- **案件信息**: 案由、案号、法院等
- **审核项目**: 合规性、格式、逻辑、语言等
- **文书内容**: 待审核的完整文书
- **输出格式**: 要求返回JSON格式的审核结果

## 成本控制

### Token 使用估算

- **文书生成**: 约 500-2000 tokens（输入） + 1000-3000 tokens（输出）
- **文书审核**: 约 1000-3000 tokens（输入） + 500-1500 tokens（输出）

### 成本优化建议

1. **选择合适的模型**
   - 开发测试: 使用 mock 模式
   - 生产环境: 根据预算选择模型

2. **控制 Token 数量**
   - 设置合理的 `AI_MAX_TOKENS`
   - 精简提示词内容

3. **使用缓存**
   - 相同案件的文书可以缓存
   - 减少重复调用

4. **监控使用量**
   - 定期检查API使用情况
   - 设置使用限额

## 错误处理

### 常见错误

#### 1. API Key 无效

```
错误: AI文书生成失败: OpenAI API Key未配置
解决: 检查 .env 文件中的 AI_API_KEY 配置
```

#### 2. 网络超时

```
错误: AI文书生成失败: timeout of 30000ms exceeded
解决: 增加 AI_TIMEOUT 值或检查网络连接
```

#### 3. Token 超限

```
错误: AI文书生成失败: maximum context length exceeded
解决: 减少输入内容或增加 AI_MAX_TOKENS
```

#### 4. 配额不足

```
错误: AI文书生成失败: insufficient quota
解决: 检查API账户余额或配额
```

### 降级保护

所有错误都会触发自动降级：

- **文书生成失败** → 使用模板生成
- **文书审核失败** → 使用规则审核

系统会在控制台输出降级信息：

```
AI文书生成失败: [错误信息]
使用模板生成文书
```

## 测试验证

### 1. 测试AI服务连接

创建测试脚本 `test-ai-service.js`:

```javascript
const { generateDocumentWithAI, reviewDocumentWithAI } = require('./src/services/aiService');

async function testAI() {
  console.log('测试AI服务...\n');
  
  // 测试文书生成
  console.log('1. 测试文书生成');
  const content = await generateDocumentWithAI(
    'complaint',
    {
      case_cause: '合同纠纷',
      court: '北京市朝阳区人民法院',
      target_amount: 100000
    },
    [
      { party_type: '原告', name: '张三', entity_type: '自然人' },
      { party_type: '被告', name: '李四', entity_type: '自然人' }
    ],
    { lawyer: '王律师', lawFirm: '某某律师事务所' }
  );
  
  if (content) {
    console.log('✅ AI生成成功');
    console.log('内容长度:', content.length);
  } else {
    console.log('⚠️  使用模板生成');
  }
  
  // 测试文书审核
  console.log('\n2. 测试文书审核');
  const review = await reviewDocumentWithAI(
    '民事起诉状\n\n原告：张三...',
    ['compliance', 'format'],
    { case_cause: '合同纠纷', court: '北京市朝阳区人民法院' }
  );
  
  if (review && review.score) {
    console.log('✅ AI审核成功');
    console.log('评分:', review.score);
    console.log('问题数:', review.issues?.length || 0);
  } else {
    console.log('⚠️  使用规则审核');
  }
}

testAI().catch(console.error);
```

运行测试：

```bash
node test-ai-service.js
```

### 2. 测试降级机制

临时设置错误的API Key，验证降级是否正常工作：

```env
AI_PROVIDER=openai
AI_API_KEY=invalid-key
```

预期结果：
- 系统会尝试调用AI服务
- 调用失败后自动降级
- 使用模板生成或规则审核
- 返回正常结果

## 性能优化

### 1. 响应时间

- **AI服务**: 通常 3-10 秒
- **模板生成**: 通常 < 100 毫秒
- **规则审核**: 通常 < 200 毫秒

### 2. 并发处理

系统支持并发处理多个请求，但需要注意：

- AI服务可能有并发限制
- 建议设置请求队列
- 监控API使用率

### 3. 缓存策略

可以实现缓存机制：

```javascript
// 缓存相同案件的生成结果
const cacheKey = `doc_${caseId}_${templateType}`;
const cached = cache.get(cacheKey);
if (cached) return cached;

const result = await generateDocumentWithAI(...);
cache.set(cacheKey, result, 3600); // 缓存1小时
```

## 安全建议

### 1. API Key 保护

- ✅ 使用环境变量存储
- ✅ 不要提交到版本控制
- ✅ 定期轮换 API Key
- ❌ 不要在前端暴露

### 2. 内容过滤

- 对用户输入进行验证
- 过滤敏感信息
- 限制输入长度

### 3. 访问控制

- 只有授权用户可以使用AI功能
- 记录所有AI调用日志
- 设置使用配额

## 监控和日志

### 日志记录

系统会自动记录：

```javascript
console.log('使用AI服务生成文书');
console.log('AI文书生成失败:', error.message);
console.log('使用模板生成文书');
```

### 建议监控指标

- AI服务调用次数
- 成功率和失败率
- 平均响应时间
- Token 使用量
- 降级触发次数

## 常见问题

### Q1: 如何切换AI服务提供商？

修改 `.env` 文件中的 `AI_PROVIDER` 配置，然后重启服务。

### Q2: AI生成的文书质量如何？

AI生成的文书质量取决于：
- 选择的模型（GPT-4 > GPT-3.5）
- 提供的案件信息完整度
- 提示词的设计质量

建议：
- 使用更强大的模型
- 提供详细的案件信息
- 生成后人工审核

### Q3: 如何处理AI服务不稳定？

系统已内置降级机制：
- AI失败自动切换到模板/规则
- 不影响系统正常使用
- 建议监控降级频率

### Q4: 成本如何控制？

- 开发环境使用 mock 模式
- 生产环境选择性价比高的模型
- 设置合理的 Token 限制
- 实现缓存机制

### Q5: 支持自定义AI服务吗？

支持！在 `aiService.js` 中添加新的服务提供商：

```javascript
case 'custom':
  return await callCustomAI(prompt, options);
```

## 更新日志

### v1.0.0 (2024-11-20)

- ✅ 支持 OpenAI、通义千问、文心一言
- ✅ 智能降级机制
- ✅ 文书生成和审核
- ✅ 完整的错误处理
- ✅ 环境变量配置

## 技术支持

如有问题，请查看：
- 系统日志: `backend/logs/`
- 错误信息: 控制台输出
- 配置文件: `backend/.env`

## 相关文件

- `backend/src/services/aiService.js` - AI服务核心模块
- `backend/src/controllers/documentController.js` - 文书控制器
- `backend/.env.example` - 环境变量示例
- `backend/.env` - 实际配置（不提交到版本控制）

## 下一步计划

- [ ] 支持更多AI服务提供商
- [ ] 实现请求缓存机制
- [ ] 添加使用量统计
- [ ] 优化提示词模板
- [ ] 支持流式输出
- [ ] 添加文书模板管理
