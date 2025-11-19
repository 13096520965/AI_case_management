import request from './request'

export interface CollaborationMemberData {
  caseId: number
  userId: number
  userName: string
  role: string
  permissions?: string
}

export interface CollaborationTaskData {
  caseId: number
  taskName: string
  description?: string
  assignedTo?: number
  assignedToName?: string
  dueDate?: string
  priority?: string
  status?: string
}

export const collaborationApi = {
  // Add collaboration member
  addMember: (caseId: number, data: Omit<CollaborationMemberData, 'caseId'>) => {
    return request.post(`/collaboration/cases/${caseId}/members`, data)
  },
  
  // Get members for a case
  getMembersByCaseId: (caseId: number) => {
    return request.get(`/collaboration/cases/${caseId}/members`)
  },
  
  // Update member
  updateMember: (id: number, data: Partial<CollaborationMemberData>) => {
    return request.put(`/collaboration/members/${id}`, data)
  },
  
  // Remove member
  removeMember: (id: number) => {
    return request.delete(`/collaboration/members/${id}`)
  },
  
  // Create collaboration task
  createTask: (data: CollaborationTaskData) => {
    return request.post('/collaboration/tasks', data)
  },
  
  // Get tasks for a case
  getTasksByCaseId: (caseId: number, params?: { status?: string; assignedTo?: number }) => {
    return request.get(`/collaboration/cases/${caseId}/tasks`, { params })
  },
  
  // Get task by ID
  getTaskById: (id: number) => {
    return request.get(`/collaboration/tasks/${id}`)
  },
  
  // Update task
  updateTask: (id: number, data: Partial<CollaborationTaskData>) => {
    return request.put(`/collaboration/tasks/${id}`, data)
  },
  
  // Delete task
  deleteTask: (id: number) => {
    return request.delete(`/collaboration/tasks/${id}`)
  }
}
