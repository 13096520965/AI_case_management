import type { Router } from 'vue-router'
import { useUserStore } from '@/stores/user'

/**
 * 设置路由守卫
 * @param router Vue Router 实例
 */
export function setupRouterGuards(router: Router) {
  // 全局前置守卫 - 认证检查
  router.beforeEach((to, from, next) => {
    // 获取用户store
    const userStore = useUserStore()
    const isAuthenticated = userStore.isAuthenticated // 这是一个 computed 属性，不是函数
    const requiresAuth = to.meta.requiresAuth !== false // 默认需要认证
    
    // 如果路由需要认证但用户未登录，重定向到登录页
    if (requiresAuth && !isAuthenticated) {
      next({
        path: '/login',
        query: { redirect: to.fullPath } // 保存目标路由，登录后可以跳转回来
      })
      return
    } 
    
    // 如果用户已登录但访问登录页或注册页，重定向到首页
    if (isAuthenticated && (to.path === '/login' || to.path === '/register')) {
      next('/dashboard')
      return
    }
    
    // 角色权限检查（如果路由定义了角色要求）
    if (to.meta.roles && to.meta.roles.length > 0) {
      const userRole = userStore.user?.role
      if (!userRole || !to.meta.roles.includes(userRole)) {
        // 用户角色不匹配，重定向到首页或显示无权限页面
        console.warn('用户权限不足，无法访问该页面')
        next('/dashboard')
        return
      }
    }
    
    // 其他情况正常放行
    next()
  })

  // 全局后置钩子 - 页面标题设置
  router.afterEach((to) => {
    const defaultTitle = '智能案管系统'
    const routeTitles: Record<string, string> = {
      'Dashboard': '首页',
      'CaseList': '案件列表',
      'CaseDetail': '案件详情',
      'CaseCreate': '创建案件',
      'CaseEdit': '编辑案件',
      'ProcessManagement': '流程管理',
      'ProcessTemplates': '流程模板',
      'EvidenceManagement': '证据管理',
      'DocumentManagement': '文书管理',
      'DocumentTemplates': '文书模板',
      'DocumentOCR': '文书识别',
      'CostManagement': '成本管理',
      'CostCalculator': '费用计算器',
      'CostAnalytics': '成本分析',
      'NotificationCenter': '提醒中心',
      'NotificationRules': '提醒规则',
      'NotificationAlerts': '超期预警',
      'CollaborationMembers': '协作成员',
      'CollaborationTasks': '协作任务',
      'Analytics': '数据分析',
      'LawyerEvaluation': '律师评价',
      'SimilarCases': '类案检索',
      'ClosureReport': '结案报告',
      'ArchiveSearch': '归档检索',
      'KnowledgeBase': '案例知识库',
      'Login': '登录',
      'Register': '注册',
      'NotFound': '页面未找到'
    }
    
    // 优先使用路由元信息中的标题，否则使用预定义的标题映射
    const title = to.meta.title || (to.name ? routeTitles[to.name as string] : null)
    document.title = title ? `${title} - ${defaultTitle}` : defaultTitle
  })

  // 全局错误处理
  router.onError((error) => {
    console.error('路由错误:', error)
    // 可以在这里添加错误上报逻辑
  })
}
