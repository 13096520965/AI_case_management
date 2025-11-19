import request from './request'

export interface ProcessTemplateData {
  name: string
  caseType: string
  description?: string
  nodes: Array<{
    nodeName: string
    nodeType: string
    daysFromStart: number
    duration: number
    nodeOrder: number
  }>
}

export const processTemplateApi = {
  // Get all templates
  getTemplates: () => {
    return request.get('/templates')
  },
  
  // Get template by ID
  getTemplateById: (id: number) => {
    return request.get(`/templates/${id}`)
  },
  
  // Create template
  createTemplate: (data: ProcessTemplateData) => {
    return request.post('/templates', {
      template_name: data.name,
      case_type: data.caseType,
      description: data.description,
      nodes: data.nodes.map(node => ({
        node_name: node.nodeName,
        node_type: node.nodeType,
        deadline_days: node.duration, // 使用 duration 作为截止天数
        node_order: node.nodeOrder
      }))
    })
  },
  
  // Update template
  updateTemplate: (id: number, data: Partial<ProcessTemplateData>) => {
    return request.put(`/templates/${id}`, {
      template_name: data.name,
      case_type: data.caseType,
      description: data.description,
      nodes: data.nodes?.map(node => ({
        node_name: node.nodeName,
        node_type: node.nodeType,
        deadline_days: node.duration, // 使用 duration 作为截止天数
        node_order: node.nodeOrder
      }))
    })
  },
  
  // Delete template
  deleteTemplate: (id: number) => {
    return request.delete(`/templates/${id}`)
  },
  
  // Apply template to case
  applyTemplate: (caseId: number, templateId: number) => {
    return request.post(`/templates/apply/${caseId}`, { 
      template_id: templateId 
    })
  }
}
