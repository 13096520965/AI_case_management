import request from './request'

export interface PartyData {
  caseId: number
  partyType: string
  entityType: string
  name: string
  birthDate?: string
  unifiedCreditCode?: string
  legalRepresentative?: string
  idNumber?: string
  contactPhone?: string
  contactEmail?: string
  address?: string
}

// 转换驼峰命名到下划线命名
const toSnakeCase = (data: any) => {
  const result: any = {}
  if (data.partyType) result.party_type = data.partyType
  if (data.entityType) result.entity_type = data.entityType
  if (data.name) result.name = data.name
  if (data.unifiedCreditCode !== undefined) result.unified_credit_code = data.unifiedCreditCode
  if (data.legalRepresentative !== undefined) result.legal_representative = data.legalRepresentative
  if (data.idNumber !== undefined) result.id_number = data.idNumber
  if (data.birthDate !== undefined) result.birth_date = data.birthDate
  if (data.contactPhone !== undefined) result.contact_phone = data.contactPhone
  if (data.contactEmail !== undefined) result.contact_email = data.contactEmail
  if (data.address !== undefined) result.address = data.address
  return result
}

export const partyApi = {
  // Add litigation party to case
  addParty: (caseId: number, data: Omit<PartyData, 'caseId'>) => {
    const snakeCaseData = toSnakeCase(data)
    return request.post(`/cases/${caseId}/parties`, snakeCaseData)
  },
  
  // Get parties for a case
  getPartiesByCaseId: (caseId: number) => {
    return request.get(`/cases/${caseId}/parties`)
  },
  
  // Update party
  updateParty: (id: number, data: Partial<PartyData>) => {
    const snakeCaseData = toSnakeCase(data)
    return request.put(`/parties/${id}`, snakeCaseData)
  },
  
  // Delete party
  deleteParty: (id: number) => {
    return request.delete(`/parties/${id}`)
  },
  
  // Get party history cases
  getPartyHistory: (partyName: string) => {
    return request.get(`/parties/history`, { params: { name: partyName } })
  }
}
