import request from './request'

export interface TargetAmountDetailData {
  total_amount?: number
  penalty_amount?: number
  litigation_cost?: number
  cost_bearer?: string
  notes?: string
}

export interface PaymentRecordData {
  payment_date: string
  amount: number
  payer: string
  payee: string
  payment_method: string
  status: string
  notes?: string
}

export const targetAmountApi = {
  // 获取标的处理详情（包含汇款记录）
  getTargetAmountDetail: (caseId: number) => {
    return request.get(`/cases/${caseId}/target-amount`)
  },

  // 更新标的处理详情
  updateTargetAmountDetail: (caseId: number, data: TargetAmountDetailData) => {
    return request.put(`/cases/${caseId}/target-amount`, data)
  },

  // 创建汇款记录
  createPaymentRecord: (caseId: number, data: PaymentRecordData) => {
    return request.post(`/cases/${caseId}/payments`, data)
  },

  // 更新汇款记录
  updatePaymentRecord: (id: number, data: Partial<PaymentRecordData>) => {
    return request.put(`/payments/${id}`, data)
  },

  // 删除汇款记录
  deletePaymentRecord: (id: number) => {
    return request.delete(`/payments/${id}`)
  }
}
