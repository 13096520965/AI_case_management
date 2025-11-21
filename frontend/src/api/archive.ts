import request from './request'

export interface ClosureReportData {
  caseId: number
  caseResult: string
  resultDescription?: string
  experienceSummary?: string
  riskWarning?: string
  recommendations?: string
  createdBy?: string
}

export interface ArchivePackageData {
  caseId: number
  archiveNumber?: string
  archiveDate?: string
  archiveLocation?: string
  notes?: string
}

export interface CaseKnowledgeData {
  caseId: number
  caseCause: string
  disputeFocus: string
  legalBasis?: string
  judgmentSummary?: string
  experienceSummary?: string
  keywords?: string
  isPublic?: boolean
}

export const archiveApi = {
  // Create closure report
  createClosureReport: (data: ClosureReportData) => {
    return request.post('/archive/closure-report', data)
  },
  
  // Get closure report by case ID
  getClosureReportByCaseId: (caseId: number) => {
    return request.get(`/archive/closure-report/${caseId}`)
  },
  
  // Update closure report
  updateClosureReport: (id: number, data: Partial<ClosureReportData>) => {
    return request.put(`/archive/closure-report/${id}`, data)
  },
  
  // Create archive package
  createArchivePackage: (data: ArchivePackageData) => {
    return request.post('/archive/package', data)
  },
  
  // Search archived cases
  searchArchive: (params?: { 
    keyword?: string
    caseType?: string
    caseCause?: string
    startDate?: string
    endDate?: string
    page?: number
    pageSize?: number
  }) => {
    return request.get('/archive/search', { params })
  },
  
  // Get archive package by ID
  getArchivePackageById: (id: number) => {
    return request.get(`/archive/package/${id}`)
  },
  
  // Create case knowledge
  createKnowledge: (data: CaseKnowledgeData) => {
    return request.post('/archive/knowledge', data)
  },
  
  // Search knowledge base
  searchKnowledge: (params?: {
    keyword?: string
    caseCause?: string
    disputeFocus?: string
    page?: number
    pageSize?: number
  }) => {
    return request.get('/archive/knowledge', { params })
  },
  
  // Get knowledge by ID
  getKnowledgeById: (id: number) => {
    return request.get(`/archive/knowledge/${id}`)
  },
  
  // Update knowledge
  updateKnowledge: (id: number, data: any) => {
    // 只发送case_knowledge表中存在的字段
    const updateData: any = {}
    if (data.case_id !== undefined) updateData.case_id = data.case_id
    if (data.archive_package_id !== undefined) updateData.archive_package_id = data.archive_package_id
    if (data.case_cause !== undefined) updateData.case_cause = data.case_cause
    if (data.dispute_focus !== undefined) updateData.dispute_focus = data.dispute_focus
    if (data.legal_issues !== undefined) updateData.legal_issues = data.legal_issues
    if (data.case_result !== undefined) updateData.case_result = data.case_result
    if (data.key_evidence !== undefined) updateData.key_evidence = data.key_evidence
    if (data.legal_basis !== undefined) updateData.legal_basis = data.legal_basis
    if (data.case_analysis !== undefined) updateData.case_analysis = data.case_analysis
    if (data.practical_significance !== undefined) updateData.practical_significance = data.practical_significance
    if (data.keywords !== undefined) updateData.keywords = data.keywords
    if (data.tags !== undefined) updateData.tags = data.tags
    if (data.win_rate_reference !== undefined) updateData.win_rate_reference = data.win_rate_reference
    if (data.created_by !== undefined) updateData.created_by = data.created_by
    return request.put(`/archive/knowledge/${id}`, updateData)
  },
  
  // Delete knowledge
  deleteKnowledge: (id: number) => {
    return request.delete(`/archive/knowledge/${id}`)
  }
}
