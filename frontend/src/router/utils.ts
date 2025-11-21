import type { RouteLocationRaw } from 'vue-router'
import router from './index'

/**
 * 编程式导航到指定路由
 * @param to 目标路由
 */
export function navigateTo(to: RouteLocationRaw) {
  return router.push(to)
}

/**
 * 替换当前路由（不会在历史记录中留下记录）
 * @param to 目标路由
 */
export function replaceTo(to: RouteLocationRaw) {
  return router.replace(to)
}

/**
 * 返回上一页
 */
export function goBack() {
  router.back()
}

/**
 * 前进到下一页
 */
export function goForward() {
  router.forward()
}

/**
 * 跳转到案件详情页
 * @param caseId 案件ID
 */
export function navigateToCaseDetail(caseId: number | string) {
  return navigateTo({
    name: 'CaseDetail',
    params: { id: caseId }
  })
}

/**
 * 跳转到案件编辑页
 * @param caseId 案件ID
 */
export function navigateToCaseEdit(caseId: number | string) {
  return navigateTo({
    name: 'CaseEdit',
    params: { id: caseId }
  })
}

/**
 * 跳转到流程管理页
 * @param caseId 案件ID
 */
export function navigateToProcessManagement(caseId: number | string) {
  return navigateTo({
    name: 'ProcessManagement',
    params: { id: caseId }
  })
}

/**
 * 跳转到证据管理页
 * @param caseId 案件ID
 */
export function navigateToEvidenceManagement(caseId: number | string) {
  return navigateTo({
    name: 'EvidenceManagement',
    params: { id: caseId }
  })
}

/**
 * 跳转到文书管理页
 * @param caseId 案件ID
 */
export function navigateToDocumentManagement(caseId: number | string) {
  return navigateTo({
    name: 'DocumentManagement',
    params: { id: caseId }
  })
}

/**
 * 跳转到成本管理页
 * @param caseId 案件ID
 */
export function navigateToCostManagement(caseId: number | string) {
  return navigateTo({
    name: 'CostManagement',
    params: { id: caseId }
  })
}

/**
 * 登出并跳转到登录页
 */
export function logout() {
  return replaceTo('/login')
}
