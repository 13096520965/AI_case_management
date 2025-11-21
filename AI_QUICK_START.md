# AI服务快速配置指南

## 5分钟快速开始

### 步骤 1: 选择AI服务

根据你的需求选择一个AI服务提供商：

| 提供商 | 优势 | 成本 | 推荐场景 |
|--------|------|------|----------|
| **Mock** | 免费，无需配置 | 免费 | 开发测试 |
| **OpenAI** | 质量高，生态好 | 中等 | 国际项目 |
| **通义千问** | 国内访问快 | 较低 | 国内项目 |
| **文心一言** | 中文理解好 | 较低 | 中文场景 |

### 步骤 2: 获取API Key

#### OpenAI
1. 访问 https://platform.openai.com/
2. 注册并登录
3. 进入 API Keys 页面
4. 点击 "Create new secret key"
5. 复制生成的 key（格式：`sk-...`）

#### 通义千问
1. 访问 https://dashscope.console.aliyun.com/
2. 登录阿里云账号
3. 开通 DashScope 服务
4. 创建 API Key
5. 复制生成的 key

#### 文心一言
1. 访问 https://cloud.baidu.com/
2. 登录百度账号
3. 开通文心一言服务
4. 创建应用
5. 获取 API Key 和 Secret Key

### 步骤 3: 配置环境变量

编辑 `backend/.env` 文件：

#### 使用 OpenAI
```env
AI_PROVIDER=openai
AI_API_KEY=sk-your-api-key-here
AI_MODEL=gpt-3.5-turbo
```

#### 使用通义千问
```env
AI_PROVIDER=qianwen
AI_API_KEY=your-api-key-here
AI_MODEL=qwen-turbo
```

#### 使用文心一言
```env
AI_PROVIDER=wenxin
AI_API_KEY=your-api-key-here
AI_SECRET_KEY=your-secret-key-here
AI_MODEL=completions
```

### 步骤 4: 重启服务

```bash
cd backend
npm start
```

### 步骤 5: 测试

```bash
node test-ai-service.js
```

看到 `✅ AI服务工作正常` 表示配置成功！

## 常见问题

### Q: 如何知道AI服务是否在工作？

查看控制台日志：
- `使用AI服务生成文书` - AI正在工作
- `使用模板生成文书` - 使用降级方案

### Q: 成本大概多少？

以 OpenAI GPT-3.5-turbo 为例：
- 生成一份文书：约 $0.01-0.03
- 审核一份文书：约 $0.005-0.02
- 每月100份文书：约 $1-5

### Q: 如何控制成本？

1. 开发环境使用 `mock` 模式
2. 设置合理的 `AI_MAX_TOKENS`
3. 选择性价比高的模型

### Q: 网络访问不了OpenAI怎么办？

1. 使用国内AI服务（通义千问、文心一言）
2. 配置代理服务器
3. 使用 OpenAI 兼容的中转服务

## 推荐配置

### 开发环境
```env
AI_PROVIDER=mock
```

### 测试环境
```env
AI_PROVIDER=qianwen
AI_API_KEY=your-test-key
AI_MODEL=qwen-turbo
AI_MAX_TOKENS=1500
```

### 生产环境
```env
AI_PROVIDER=openai
AI_API_KEY=your-production-key
AI_MODEL=gpt-3.5-turbo
AI_MAX_TOKENS=2000
AI_TIMEOUT=30000
```

## 下一步

- 查看完整文档：`AI_SERVICE_INTEGRATION.md`
- 运行测试：`node test-ai-service.js`
- 在前端使用：访问文书管理页面

## 技术支持

遇到问题？
1. 检查 `.env` 配置
2. 查看控制台日志
3. 运行测试脚本
4. 查看完整文档
