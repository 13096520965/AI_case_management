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
}

// 转换驼峰命名到下划线命名
const toSnakeCase = (data: any) => {
  return {
    case_number: data.caseNumber,
    case_type: data.caseType,
    case_cause: data.caseCause,
    court: data.court,
    target_amount: data.targetAmount,
    filing_date: data.filingDate,
    status: data.status,
    team_id: data.teamId
  }
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
