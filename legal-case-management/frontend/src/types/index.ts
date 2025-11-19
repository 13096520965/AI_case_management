// Common types for the application

export interface ApiResponse<T = any> {
  code: number
  message: string
  data: T
}

export interface PaginationParams {
  page: number
  pageSize: number
}

export interface PaginationResponse<T> {
  list: T[]
  total: number
  page: number
  pageSize: number
}

export type CaseType = '民事' | '刑事' | '行政' | '劳动仲裁'
export type CaseStatus = '立案' | '审理中' | '已结案' | '已归档'
export type PartyType = '原告' | '被告' | '第三人'
export type EntityType = '企业' | '个人'
export type NodeStatus = '待处理' | '进行中' | '已完成' | '超期'
export type CostType = '诉讼费' | '律师费' | '保全费' | '鉴定费' | '其他'
export type PaymentStatus = '待支付' | '已支付' | '已退回'

// Evidence types
export interface Evidence {
  id: number
  caseId: number
  fileName: string
  fileType: string
  fileSize: number
  storagePath: string
  category?: string
  tags?: string
  description?: string
  uploadedBy: string
  uploadedAt: string
  version: number
}

export type EvidenceCategory = '书证' | '物证' | '视听资料' | '电子数据' | '证人证言' | '鉴定意见' | '勘验笔录' | '其他'
export type ViewMode = 'list' | 'grid'
