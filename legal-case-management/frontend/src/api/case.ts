import request from './request'

export interface CaseParams {
  page?: number
  pageSize?: number
  status?: string
  caseType?: string
  keyword?: string
  startDate?: string
  endDate?: string
}

export interface CreateCaseData {
  caseNumber?: string
  caseType: string
  caseCause: string
  court: string
  targetAmount?: number
  filingDate?: string
  status?: string
  caseResult?: string
  handler?: string
  industrySegment?: string
  isExternalAgent?: boolean
  lawFirmName?: string
  agentLawyer?: string
  agentContact?: string
  caseBackground?: string
}

// 转换驼峰命名到下划线命名
const toSnakeCase = (data: any) => {
  const result: any = {
    case_number: data.caseNumber,
    case_type: data.caseType,
    case_cause: data.caseCause,
    court: data.court,
    target_amount: data.targetAmount,
    filing_date: data.filingDate,
    status: data.status,
    // team_id removed per updated requirements
  }
  
  if (data.handler !== undefined) result.handler = data.handler
  if (data.industrySegment !== undefined) result.industry_segment = data.industrySegment
  if (data.isExternalAgent !== undefined) result.is_external_agent = data.isExternalAgent
  if (data.lawFirmName !== undefined) result.law_firm_name = data.lawFirmName
  if (data.agentLawyer !== undefined) result.agent_lawyer = data.agentLawyer
  if (data.agentContact !== undefined) result.agent_contact = data.agentContact
  if (data.caseBackground !== undefined) result.case_background = data.caseBackground
  if (data.caseResult !== undefined) result.case_result = data.caseResult
  
  return result
}

export const caseApi = {
  // Get case list with pagination and filters
  getCases: (params?: CaseParams) => {
    return request.get('/cases', { params })
  },
  
  // Get case by ID
  getCaseById: (id: number) => {
    return request.get(`/cases/${id}`)
  },
  
  // Create new case
  createCase: (data: CreateCaseData) => {
    const snakeCaseData = toSnakeCase(data)
    return request.post('/cases', snakeCaseData)
  },
  
  // Update case
  updateCase: (id: number, data: Partial<CreateCaseData>) => {
    const snakeCaseData = toSnakeCase(data)
    return request.put(`/cases/${id}`, snakeCaseData)
  },
  
  // Delete case
  deleteCase: (id: number) => {
    return request.delete(`/cases/${id}`)
  },

  // 导入案件（Excel）
  importCases: (formData: FormData) => {
    return request.post('/cases/import', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    })
  },

  // 下载案件导入模板（返回 Blob 并带文件名）
  downloadImportTemplate: async () => {
    // 使用 fetch 以便读取 headers 中的 Content-Disposition
    const token = localStorage.getItem('token')
    const res = await fetch((import.meta.env.VITE_API_BASE_URL || '/api') + '/cases/import/template', {
      method: 'GET',
      headers: token ? { 'Authorization': `Bearer ${token}` } : {}
    })
    if (!res.ok) throw new Error('下载模板失败')
    const blob = await res.blob()
    // 尝试从 headers 中解析文件名
    const disposition = res.headers.get('content-disposition') || ''
    let filename = 'case_import_template.xlsx'
    const match = disposition.match(/filename\*=UTF-8''(.+)|filename="?([^";]+)"?/) 
    if (match) {
      filename = decodeURIComponent(match[1] || match[2])
    }
    return { blob, filename }
  },

  // Get case operation logs
  getCaseLogs: (id: number, params?: { page?: number; limit?: number }) => {
    return request.get(`/cases/${id}/logs`, { params })
  },
  // Get case parties
  getCaseParties: (caseId: number) => {
    return request.get(`/cases/${caseId}/parties`)
  }
}
