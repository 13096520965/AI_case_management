/**
 * API 使用示例
 * 此文件展示如何在组件中使用 API 模块
 */

import { 
  authApi, 
  caseApi, 
  partyApi, 
  evidenceApi,
  documentApi,
  costApi,
  notificationApi,
  analyticsApi
} from '@/api'

import type { 
  LoginParams, 
  CreateCaseData,
  PartyData,
  CostRecordData 
} from '@/api'

// ============ 认证示例 ============
export async function loginExample() {
  try {
    const loginData: LoginParams = {
      username: 'admin',
      password: '123456'
    }
    const response = await authApi.login(loginData)
    // 保存 token
    localStorage.setItem('token', response.token)
    return response
  } catch (error) {
    console.error('登录失败:', error)
    throw error
  }
}

// ============ 案件管理示例 ============
export async function createCaseExample() {
  try {
    const caseData: CreateCaseData = {
      caseType: '民事',
      caseCause: '合同纠纷',
      court: '北京市朝阳区人民法院',
      targetAmount: 100000,
      filingDate: '2024-01-15',
      status: 'active'
    }
    const newCase = await caseApi.createCase(caseData)
    console.log('案件创建成功:', newCase)
    return newCase
  } catch (error) {
    console.error('创建案件失败:', error)
    throw error
  }
}

export async function getCasesExample() {
  try {
    const cases = await caseApi.getCases({
      page: 1,
      pageSize: 10,
      status: 'active',
      caseType: '民事'
    })
    console.log('案件列表:', cases)
    return cases
  } catch (error) {
    console.error('获取案件列表失败:', error)
    throw error
  }
}

// ============ 诉讼主体示例 ============
export async function addPartyExample(caseId: number) {
  try {
    const partyData: Omit<PartyData, 'caseId'> = {
      partyType: '原告',
      entityType: '企业',
      name: '某某科技有限公司',
      unifiedCreditCode: '91110000XXXXXXXXXX',
      legalRepresentative: '张三',
      contactPhone: '13800138000',
      address: '北京市朝阳区某某街道'
    }
    const party = await partyApi.addParty(caseId, partyData)
    console.log('诉讼主体添加成功:', party)
    return party
  } catch (error) {
    console.error('添加诉讼主体失败:', error)
    throw error
  }
}

// ============ 证据上传示例 ============
export async function uploadEvidenceExample(file: File, caseId: number) {
  try {
    const formData = new FormData()
    formData.append('file', file)
    formData.append('caseId', caseId.toString())
    formData.append('category', '书证')
    formData.append('tags', '合同,发票')
    
    const evidence = await evidenceApi.uploadEvidence(formData)
    console.log('证据上传成功:', evidence)
    return evidence
  } catch (error) {
    console.error('上传证据失败:', error)
    throw error
  }
}

// ============ 文书上传示例 ============
export async function uploadDocumentExample(file: File, caseId: number) {
  try {
    const formData = new FormData()
    formData.append('file', file)
    formData.append('caseId', caseId.toString())
    formData.append('documentType', '起诉状')
    
    const document = await documentApi.uploadDocument(formData)
    console.log('文书上传成功:', document)
    return document
  } catch (error) {
    console.error('上传文书失败:', error)
    throw error
  }
}

// ============ 成本管理示例 ============
export async function createCostExample(caseId: number) {
  try {
    const costData: CostRecordData = {
      caseId,
      costType: '诉讼费',
      amount: 5000,
      paymentDate: '2024-01-20',
      paymentMethod: '银行转账',
      status: '已支付',
      payer: '原告',
      payee: '法院'
    }
    const cost = await costApi.createCost(costData)
    console.log('成本记录创建成功:', cost)
    return cost
  } catch (error) {
    console.error('创建成本记录失败:', error)
    throw error
  }
}

export async function calculateCostExample() {
  try {
    const result = await costApi.calculateCost({
      calculationType: 'litigation',
      targetAmount: 100000,
      caseType: '财产案件'
    })
    console.log('费用计算结果:', result)
    return result
  } catch (error) {
    console.error('费用计算失败:', error)
    throw error
  }
}

// ============ 提醒通知示例 ============
export async function getNotificationsExample() {
  try {
    const notifications = await notificationApi.getNotifications({
      status: 'unread',
      page: 1,
      pageSize: 20
    })
    console.log('提醒列表:', notifications)
    return notifications
  } catch (error) {
    console.error('获取提醒列表失败:', error)
    throw error
  }
}

// ============ 数据分析示例 ============
export async function getDashboardExample() {
  try {
    const dashboard = await analyticsApi.getDashboard({
      startDate: '2024-01-01',
      endDate: '2024-12-31'
    })
    console.log('驾驶舱数据:', dashboard)
    return dashboard
  } catch (error) {
    console.error('获取驾驶舱数据失败:', error)
    throw error
  }
}

// ============ 完整工作流示例 ============
export async function completeWorkflowExample() {
  try {
    // 1. 登录
    await loginExample()
    
    // 2. 创建案件
    const newCase = await createCaseExample()
    
    // 3. 添加诉讼主体
    await addPartyExample(newCase.id)
    
    // 4. 创建成本记录
    await createCostExample(newCase.id)
    
    // 5. 获取案件列表
    await getCasesExample()
    
    // 6. 获取驾驶舱数据
    await getDashboardExample()
    
    console.log('完整工作流执行成功')
  } catch (error) {
    console.error('工作流执行失败:', error)
    throw error
  }
}
