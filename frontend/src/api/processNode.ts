import request from './request'

export interface ProcessNodeData {
  caseId: number
  nodeType: string
  nodeName: string
  handler?: string
  startTime?: string
  deadline?: string
  completionTime?: string
  status?: string
  progress?: string
  nodeOrder?: number
}

export const processNodeApi = {
  // Create process node
  createNode: (caseId: number, data: Omit<ProcessNodeData, 'caseId'>) => {
    return request.post(`/cases/${caseId}/nodes`, {
      node_type: data.nodeType,
      node_name: data.nodeName,
      handler: data.handler,
      start_time: data.startTime,
      deadline: data.deadline,
      completion_time: data.completionTime,
      status: data.status,
      progress: data.progress,
      node_order: data.nodeOrder
    })
  },
  
  // Get nodes for a case
  getNodesByCaseId: (caseId: number) => {
    return request.get(`/cases/${caseId}/nodes`)
  },
  
  // Update node
  updateNode: (id: number, data: Partial<ProcessNodeData>) => {
    return request.put(`/nodes/${id}`, {
      node_type: data.nodeType,
      node_name: data.nodeName,
      handler: data.handler,
      start_time: data.startTime,
      deadline: data.deadline,
      completion_time: data.completionTime,
      status: data.status,
      progress: data.progress,
      node_order: data.nodeOrder
    })
  },
  
  // Delete node
  deleteNode: (id: number) => {
    return request.delete(`/nodes/${id}`)
  },
  
  // Get node status calculation
  getNodeStatus: (id: number) => {
    return request.get(`/nodes/${id}/status`)
  },
  
  // Get overdue nodes
  getOverdueNodes: () => {
    return request.get('/nodes/overdue')
  },
  
  // Get upcoming nodes
  getUpcomingNodes: (days: number = 7) => {
    return request.get(`/nodes/upcoming?days=${days}`)
  }
}
