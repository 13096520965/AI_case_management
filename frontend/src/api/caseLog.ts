import request from './request'

export interface CaseLogParams {
  page?: number
  limit?: number
  action_type?: string
}

export const caseLogApi = {
  // Get case logs
  getCaseLogs: (caseId: number, params?: CaseLogParams) => {
    return request.get(`/cases/${caseId}/logs`, { params })
  },
  
  // Get case log statistics
  getCaseLogStatistics: (caseId: number) => {
    return request.get(`/cases/${caseId}/logs/statistics`)
  },
  
  // Get operator logs
  getOperatorLogs: (operatorId: number, params?: { page?: number; limit?: number }) => {
    return request.get(`/operators/${operatorId}/logs`, { params })
  }
}
