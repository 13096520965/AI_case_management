import request from './request'

/**
 * 知识条目数据接口
 */
export interface KnowledgeData {
  case_id?: number
  archive_package_id?: number
  case_cause: string
  dispute_focus: string
  legal_issues?: string
  case_result?: string
  key_evidence?: string
  legal_basis?: string
  case_analysis?: string
  practical_significance?: string
  keywords?: string
  tags?: string
  win_rate_reference?: string
  created_by?: string
}

/**
 * 搜索和筛选参数接口
 */
export interface SearchParams {
  keyword?: string
  case_cause?: string
  dispute_focus?: string
  keywords?: string
  tags?: string
  case_result?: string
  page?: number
  limit?: number
  pageSize?: number
}

/**
 * 知识库 API Client
 * 提供案例知识库相关的 API 调用方法
 */
export const knowledgeApi = {
  /**
   * 获取知识列表
   * @param params 查询参数（支持分页和筛选）
   * @returns 知识列表和分页信息
   */
  getList: (params?: SearchParams) => {
    // 统一使用 limit 作为分页参数
    const queryParams = params ? {
      ...params,
      limit: params.limit || params.pageSize
    } : undefined
    return request.get('/knowledge', { params: queryParams })
  },

  /**
   * 创建知识条目
   * @param data 知识条目数据
   * @returns 创建的知识条目
   */
  create: (data: KnowledgeData) => {
    return request.post('/knowledge', data)
  },

  /**
   * 获取知识详情
   * @param id 知识条目 ID
   * @returns 知识条目详情
   */
  getById: (id: number) => {
    return request.get(`/knowledge/${id}`)
  },

  /**
   * 更新知识条目
   * @param id 知识条目 ID
   * @param data 更新的数据
   * @returns 更新后的知识条目
   */
  update: (id: number, data: Partial<KnowledgeData>) => {
    return request.put(`/knowledge/${id}`, data)
  },

  /**
   * 删除知识条目
   * @param id 知识条目 ID
   * @returns 删除结果
   */
  delete: (id: number) => {
    return request.delete(`/knowledge/${id}`)
  },

  /**
   * 搜索知识条目
   * @param params 搜索参数
   * @returns 搜索结果和分页信息
   */
  search: (params: SearchParams) => {
    // 统一使用 limit 作为分页参数
    const queryParams = {
      ...params,
      limit: params.limit || params.pageSize
    }
    return request.get('/knowledge/search', { params: queryParams })
  }
}
