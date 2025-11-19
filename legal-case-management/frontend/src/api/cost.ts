import request from './request'

export interface CostRecordData {
  caseId: number
  costType: string
  amount: number
  paymentDate?: string
  paymentMethod?: string
  voucherNumber?: string
  payer?: string
  payee?: string
  status?: string
  dueDate?: string
  description?: string
}

export interface CostCalculateParams {
  calculationType: 'litigation' | 'lawyer' | 'preservation' | 'penalty'
  targetAmount?: number
  caseType?: string
  feeType?: string
  rate?: number
  principal?: number
  interestRate?: number
  startDate?: string
  endDate?: string
}

// 转换驼峰命名到下划线命名（用于创建）
const toSnakeCaseForCreate = (data: CostRecordData) => {
  const result: any = {}
  if (data.caseId !== undefined) result.case_id = data.caseId
  if (data.costType !== undefined) result.cost_type = data.costType
  if (data.amount !== undefined) result.amount = data.amount
  if (data.paymentDate !== undefined && data.paymentDate) result.payment_date = data.paymentDate
  if (data.paymentMethod !== undefined && data.paymentMethod) result.payment_method = data.paymentMethod
  if (data.voucherNumber !== undefined && data.voucherNumber) result.voucher_number = data.voucherNumber
  if (data.payer !== undefined && data.payer) result.payer = data.payer
  if (data.payee !== undefined && data.payee) result.payee = data.payee
  if (data.status !== undefined && data.status) result.status = data.status
  if (data.dueDate !== undefined && data.dueDate) result.due_date = data.dueDate
  // 注意：数据库表中没有 description 字段，不发送
  return result
}

// 转换驼峰命名到下划线命名（用于更新，排除 case_id）
const toSnakeCaseForUpdate = (data: Partial<CostRecordData>) => {
  const result: any = {}
  // 注意：更新时不包含 case_id
  if (data.costType !== undefined) result.cost_type = data.costType
  if (data.amount !== undefined) result.amount = data.amount
  if (data.paymentDate !== undefined && data.paymentDate) result.payment_date = data.paymentDate
  if (data.paymentMethod !== undefined && data.paymentMethod) result.payment_method = data.paymentMethod
  if (data.voucherNumber !== undefined && data.voucherNumber) result.voucher_number = data.voucherNumber
  if (data.payer !== undefined && data.payer) result.payer = data.payer
  if (data.payee !== undefined && data.payee) result.payee = data.payee
  if (data.status !== undefined && data.status) result.status = data.status
  if (data.dueDate !== undefined && data.dueDate) result.due_date = data.dueDate
  // 注意：数据库表中没有 description 字段，不发送
  return result
}

export const costApi = {
  // Create cost record
  createCost: (data: CostRecordData) => {
    return request.post('/costs', toSnakeCaseForCreate(data))
  },
  
  // Get costs for a case
  getCostsByCaseId: (caseId: number, params?: { costType?: string; status?: string }) => {
    return request.get(`/cases/${caseId}/costs`, { params })
  },
  
  // Get cost by ID
  getCostById: (id: number) => {
    return request.get(`/costs/${id}`)
  },
  
  // Update cost record
  updateCost: (id: number, data: Partial<CostRecordData>) => {
    return request.put(`/costs/${id}`, toSnakeCaseForUpdate(data))
  },
  
  // Delete cost record
  deleteCost: (id: number) => {
    return request.delete(`/costs/${id}`)
  },
  
  // Calculate fees
  calculateCost: (params: CostCalculateParams) => {
    return request.post('/costs/calculate', params)
  },
  
  // Get cost analytics
  getCostAnalytics: (caseId: number) => {
    return request.get(`/costs/analytics/${caseId}`)
  },
  
  // Upload attachment
  uploadAttachment: (formData: FormData) => {
    return request.post('/costs/attachments', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    })
  },
  
  // Get attachments for a cost record
  getCostAttachments: (costId: number) => {
    return request.get(`/costs/${costId}/attachments`)
  },
  
  // Delete attachment
  deleteAttachment: (attachmentId: number) => {
    return request.delete(`/costs/attachments/${attachmentId}`)
  }
}
