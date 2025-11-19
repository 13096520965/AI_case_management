import request from './request'

export interface EvidenceData {
  caseId: number
  fileName: string
  fileType: string
  fileSize: number
  category?: string
  tags?: string
  description?: string
}

export const evidenceApi = {
  // Upload evidence file
  uploadEvidence: (formData: FormData) => {
    return request.post('/evidence/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    })
  },
  
  // Get evidence list for a case
  getEvidenceByCaseId: (caseId: number, params?: { category?: string; tags?: string }) => {
    return request.get(`/cases/${caseId}/evidence`, { params })
  },
  
  // Get evidence by ID
  getEvidenceById: (id: number) => {
    return request.get(`/evidence/${id}`)
  },
  
  // Update evidence metadata
  updateEvidence: (id: number, data: { category?: string; tags?: string; description?: string }) => {
    return request.put(`/evidence/${id}`, data)
  },
  
  // Delete evidence
  deleteEvidence: (id: number) => {
    return request.delete(`/evidence/${id}`)
  },
  
  // Download evidence
  downloadEvidence: (id: number) => {
    return request.get(`/evidence/${id}/download`, {
      responseType: 'blob'
    })
  },
  
  // Get evidence versions
  getEvidenceVersions: (id: number) => {
    return request.get(`/evidence/${id}/versions`)
  },
  
  // Get evidence operation logs
  getEvidenceLogs: (id: number) => {
    return request.get(`/evidence/${id}/logs`)
  }
}
