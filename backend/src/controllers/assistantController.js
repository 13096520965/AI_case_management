const aiService = require('../services/aiService');

/**
 * 法盾助手控制器
 */
class AssistantController {
  /**
   * 处理用户消息
   */
  async chat(req, res) {
    try {
      const { message, context } = req.body;

      if (!message || !message.trim()) {
        return res.status(400).json({
          success: false,
          message: '消息内容不能为空'
        });
      }

      // 构建对话上下文
      const prompt = buildChatPrompt(message, context);

      // 调用AI服务
      const response = await aiService.chat(prompt);

      res.json({
        success: true,
        data: {
          message: response,
          timestamp: new Date().toISOString()
        }
      });
    } catch (error) {
      console.error('助手对话失败:', error);
      res.status(500).json({
        success: false,
        message: '处理消息失败',
        error: error.message
      });
    }
  }

  /**
   * 智能问答
   */
  async ask(req, res) {
    try {
      const { question, caseId } = req.body;

      if (!question || !question.trim()) {
        return res.status(400).json({
          success: false,
          message: '问题不能为空'
        });
      }

      // 构建法律问答提示词
      const prompt = buildLegalQAPrompt(question, caseId);

      // 调用AI服务
      const answer = await aiService.chat(prompt);

      res.json({
        success: true,
        data: {
          question,
          answer,
          timestamp: new Date().toISOString()
        }
      });
    } catch (error) {
      console.error('法律问答失败:', error);
      res.status(500).json({
        success: false,
        message: '问答失败',
        error: error.message
      });
    }
  }
}

/**
 * 构建对话提示词
 */
function buildChatPrompt(message, context = {}) {
  const systemPrompt = `你是"法盾助手"，一个专业的法律案件管理助手。你的职责是：

1. 帮助用户查询和管理案件信息
2. 提供法律知识咨询和建议
3. 协助生成和审核法律文书
4. 提醒用户重要的案件节点和待办事项
5. 解答用户关于系统使用的问题

回答要求：
- 专业、准确、简洁
- 使用友好、易懂的语言
- 如果涉及法律问题，要提供法律依据
- 如果不确定，要明确告知用户
- 回答长度控制在200字以内，除非用户要求详细解释

当前系统信息：
- 系统名称：法律案件管理系统
- 主要功能：案件管理、文书生成、流程跟踪、费用管理、数据分析`;

  let userPrompt = `用户问题：${message}`;

  // 添加上下文信息
  if (context.caseInfo) {
    userPrompt += `\n\n相关案件信息：${JSON.stringify(context.caseInfo, null, 2)}`;
  }

  if (context.history && context.history.length > 0) {
    userPrompt += `\n\n对话历史：\n${context.history.map(h => `${h.role}: ${h.content}`).join('\n')}`;
  }

  return `${systemPrompt}\n\n${userPrompt}`;
}

/**
 * 构建法律问答提示词
 */
function buildLegalQAPrompt(question, caseId) {
  const systemPrompt = `你是一位专业的法律顾问，擅长解答各类法律问题。

回答要求：
1. 提供准确的法律分析和建议
2. 引用相关法律法规作为依据
3. 考虑实际情况，给出可操作的建议
4. 如果问题涉及复杂情况，建议咨询专业律师
5. 语言专业但易懂，避免过于晦涩的法律术语

回答格式：
【法律分析】
...

【法律依据】
...

【建议】
...`;

  let userPrompt = `法律问题：${question}`;

  if (caseId) {
    userPrompt += `\n\n（此问题与案件ID ${caseId} 相关）`;
  }

  return `${systemPrompt}\n\n${userPrompt}`;
}

module.exports = new AssistantController();
