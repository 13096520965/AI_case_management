import request from './request'

export interface DocumentTemplateData {
  name: string
  documentType: string
  content: string
  variables?: string[]
  description?: string
}

export const documentTemplateApi = {
  // Get all templates
  getTemplates: (params?: { documentType?: string }) => {
    return request.get('/document-templates', { params })
  },
  
  // Get template by ID
  getTemplateById: (id: number) => {
    return request.get(`/document-templates/${id}`)
  },
  
  // Create template
  createTemplate: (data: DocumentTemplateData) => {
    return request.post('/document-templates', data)
  },
  
  // Update template
  updateTemplate: (id: number, data: Partial<DocumentTemplateData>) => {
    return request.put(`/document-templates/${id}`, data)
  },
  
  // Delete template
  deleteTemplate: (id: number) => {
    return request.delete(`/document-templates/${id}`)
  },
  
  // Generate document from template
  generateDocument: (templateId: number, data: { caseId: number; variables: Record<string, any> }) => {
    return request.post(`/document-templates/${templateId}/generate`, data)
  }
}
