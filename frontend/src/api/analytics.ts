import request from './request'

export interface DashboardParams {
  startDate?: string
  endDate?: string
  caseType?: string
}

export interface LawyerEvaluationParams {
  lawyerId: number
  startDate?: string
  endDate?: string
}

export interface SimilarCasesParams {
  caseType: string
  caseCause: string
  keywords?: string[]
  targetAmount?: number
}

export const analyticsApi = {
  // Get dashboard data
  getDashboard: (params?: DashboardParams) => {
    return request.get('/analytics/dashboard', { params })
  },
  
  // Get case statistics
  getCaseStatistics: (params?: { startDate?: string; endDate?: string; groupBy?: string }) => {
    return request.get('/analytics/cases/statistics', { params })
  },
  
  // Get case type distribution
  getCaseTypeDistribution: (params?: { startDate?: string; endDate?: string }) => {
    return request.get('/analytics/cases/type-distribution', { params })
  },
  
  // Get case trend
  getCaseTrend: (params?: { startDate?: string; endDate?: string; interval?: string }) => {
    return request.get('/analytics/cases/trend', { params })
  },
  
  // Get lawyer evaluation
  getLawyerEvaluation: (lawyerId: number, params?: Omit<LawyerEvaluationParams, 'lawyerId'>) => {
    return request.get(`/analytics/lawyers/${lawyerId}/evaluation`, { params })
  },
  
  // Get all lawyers evaluation
  getAllLawyersEvaluation: (params?: { startDate?: string; endDate?: string }) => {
    return request.get('/analytics/lawyers/evaluation', { params })
  },
  
  // Search similar cases
  searchSimilarCases: (params: SimilarCasesParams) => {
    return request.post('/analytics/similar-cases', params)
  }
}
