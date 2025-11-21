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
  teamId?: number
  handler?: string
  industrySegment?: string
  isExternalAgent?: boolean
  lawFirmName?: string
  agentLawyer?: string
  agentContact?: string
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
    team_id: data.teamId
  }
  
  if (data.handler !== undefined) result.handler = data.handler
  if (data.industrySegment !== undefined) result.industry_segment = data.industrySegment
  if (data.isExternalAgent !== undefined) result.is_external_agent = data.isExternalAgent
  if (data.lawFirmName !== undefined) result.law_firm_name = data.lawFirmName
  if (data.agentLawyer !== undefined) result.agent_lawyer = data.agentLawyer
  if (data.agentContact !== undefined) result.agent_contact = data.agentContact
  
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

  // Get case parties
  getCaseParties: (caseId: number) => {
    return request.get(`/cases/${caseId}/parties`)
  }
}
