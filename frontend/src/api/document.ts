import request from './request'

export interface GenerateDocumentParams {
  caseId: number
  templateType: string
  caseInfo: any
  parties: any[]
  extraInfo: any
}

export interface ReviewDocumentParams {
  caseId: number
  content: string
  options: string[]
  caseInfo: any
}

export interface SaveDocumentParams {
  caseId: number
  documentType: string
  documentName: string
  content: string
}

export const documentApi = {
  // 智能生成文书
  generateDocument: (params: GenerateDocumentParams) => {
    return request.post('/documents/generate', params)
  },

  // 智能审核文书
  reviewDocument: (params: ReviewDocumentParams) => {
    return request.post('/documents/review', params)
  },

  // 保存文书
  saveDocument: (params: SaveDocumentParams) => {
    return request.post('/documents/save', params)
  },

  // 获取案件文书列表
  getDocumentsByCaseId: (caseId: number) => {
    return request.get(`/cases/${caseId}/documents`)
  },

  // 获取文书详情
  getDocumentById: (id: number) => {
    return request.get(`/documents/${id}`)
  },

  // 删除文书
  deleteDocument: (id: number) => {
    return request.delete(`/documents/${id}`)
  },

  // 下载文书（返回原始axios响应，不经过拦截器处理）
  downloadDocument: async (id: number) => {
    const token = localStorage.getItem('token')
    const response = await fetch(`${import.meta.env.VITE_API_BASE_URL || '/api'}/documents/${id}/download`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    })
    if (!response.ok) {
      throw new Error('下载失败')
    }
    return response.blob()
  },

  // 上传文书
  uploadDocument: (formData: FormData) => {
    return request.post('/documents/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    })
  },

  // 预览文书
  previewDocument: (id: number) => {
    return request.get(`/documents/${id}/preview`)
  }
}
