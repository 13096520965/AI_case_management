import request from './request'

export interface ChatRequest {
  message: string
  context?: {
    caseInfo?: any
    history?: Array<{ role: string; content: string }>
  }
}

export interface ChatResponse {
  success: boolean
  data: {
    message: string
    timestamp: string
  }
}

export interface AskRequest {
  question: string
  caseId?: number
}

export interface AskResponse {
  success: boolean
  data: {
    question: string
    answer: string
    timestamp: string
  }
}

/**
 * 法盾助手API
 */
export const assistantApi = {
  /**
   * 对话接口
   */
  chat(data: ChatRequest) {
    return request<ChatResponse>({
      url: '/api/assistant/chat',
      method: 'post',
      data
    })
  },

  /**
   * 法律问答接口
   */
  ask(data: AskRequest) {
    return request<AskResponse>({
      url: '/api/assistant/ask',
      method: 'post',
      data
    })
  }
}
