import request from './request'

export interface DocumentData {
  caseId: number
  documentType: string
  fileName: string
  description?: string
}

export const documentApi = {
  // Upload document
  uploadDocument: (formData: FormData) => {
    return request.post('/documents/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    })
  },
  
  // Get documents for a case
  getDocumentsByCaseId: (caseId: number, params?: { documentType?: string }) => {
    return request.get(`/cases/${caseId}/documents`, { params })
  },
  
  // Get document by ID
  getDocumentById: (id: number) => {
    return request.get(`/documents/${id}`)
  },
  
  // Update document
  updateDocument: (id: number, data: { documentType?: string; description?: string }) => {
    return request.put(`/documents/${id}`, data)
  },
  
  // Delete document
  deleteDocument: (id: number) => {
    return request.delete(`/documents/${id}`)
  },
  
  // Download document
  downloadDocument: (id: number) => {
    return request.get(`/documents/${id}/download`, {
      responseType: 'blob'
    })
  },
  
  // OCR recognition
  ocrRecognize: (documentId: number) => {
    return request.post(`/documents/${documentId}/ocr`)
  }
}
