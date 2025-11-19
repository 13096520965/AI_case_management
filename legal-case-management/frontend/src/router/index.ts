import { createRouter, createWebHistory } from 'vue-router'
import type { RouteRecordRaw } from 'vue-router'
import { setupRouterGuards } from './guards'
import './types' // 导入类型定义以扩展 RouteMeta

const routes: RouteRecordRaw[] = [
  {
    path: '/',
    redirect: '/dashboard'
  },
  // 认证路由（不需要布局）
  {
    path: '/login',
    name: 'Login',
    component: () => import('@/views/auth/Login.vue'),
    meta: { requiresAuth: false }
  },
  {
    path: '/register',
    name: 'Register',
    component: () => import('@/views/auth/Register.vue'),
    meta: { requiresAuth: false }
  },
  // 主应用路由（使用布局）
  {
    path: '/',
    component: () => import('@/components/layout/AppLayout.vue'),
    meta: { requiresAuth: true },
    children: [
      // 首页/驾驶舱
      {
        path: 'dashboard',
        name: 'Dashboard',
        component: () => import('@/views/dashboard/Dashboard.vue'),
        meta: { requiresAuth: true }
      },
      // 案件管理路由
      {
        path: 'cases',
        name: 'CaseList',
        component: () => import('@/views/case/CaseList.vue'),
        meta: { requiresAuth: true }
      },
      {
        path: 'cases/create',
        name: 'CaseCreate',
        component: () => import('@/views/case/CaseForm.vue'),
        meta: { requiresAuth: true }
      },
      // 案件子页面路由（必须在 cases/:id 之前定义）
      {
        path: 'cases/:id/edit',
        name: 'CaseEdit',
        component: () => import('@/views/case/CaseForm.vue'),
        meta: { requiresAuth: true }
      },
      {
        path: 'cases/:id/evidence',
        name: 'EvidenceManagement',
        component: () => import('@/views/evidence/EvidenceManagement.vue'),
        meta: { requiresAuth: true }
      },
      {
        path: 'cases/:id/documents',
        name: 'DocumentManagement',
        component: () => import('@/views/document/DocumentManagement.vue'),
        meta: { requiresAuth: true }
      },
      {
        path: 'cases/:id/costs',
        name: 'CostManagement',
        component: () => import('@/views/cost/CostManagement.vue'),
        meta: { requiresAuth: true }
      },
      {
        path: 'cases/:id/process',
        name: 'ProcessManagement',
        component: () => import('@/views/process/ProcessManagement.vue'),
        meta: { requiresAuth: true }
      },
      {
        path: 'cases/:id/logs',
        name: 'CaseLog',
        component: () => import('@/views/case/CaseLog.vue'),
        meta: { requiresAuth: true }
      },
      // 案件详情（放在最后，因为它会匹配 cases/:id）
      {
        path: 'cases/:id',
        name: 'CaseDetail',
        component: () => import('@/views/case/CaseDetail.vue'),
        meta: { requiresAuth: true }
      },
      {
        path: 'process/templates',
        name: 'ProcessTemplates',
        component: () => import('@/views/process/ProcessTemplates.vue'),
        meta: { requiresAuth: true }
      },
      {
        path: 'documents/templates',
        name: 'DocumentTemplates',
        component: () => import('@/views/document/DocumentTemplates.vue'),
        meta: { requiresAuth: true }
      },
      {
        path: 'documents/ocr',
        name: 'DocumentOCR',
        component: () => import('@/views/document/DocumentOCR.vue'),
        meta: { requiresAuth: true }
      },
      {
        path: 'costs/calculator',
        name: 'CostCalculator',
        component: () => import('@/views/cost/CostCalculator.vue'),
        meta: { requiresAuth: true }
      },
      // 提醒中心路由
      {
        path: 'notifications',
        name: 'NotificationCenter',
        component: () => import('@/views/notification/NotificationCenter.vue'),
        meta: { requiresAuth: true }
      },
      {
        path: 'notifications/rules',
        name: 'NotificationRules',
        component: () => import('@/views/notification/NotificationRules.vue'),
        meta: { requiresAuth: true }
      },
      {
        path: 'notifications/alerts',
        name: 'NotificationAlerts',
        component: () => import('@/views/notification/NotificationAlerts.vue'),
        meta: { requiresAuth: true }
      },
      // 协同管理路由
      {
        path: 'collaboration/cases/:id/members',
        name: 'CollaborationMembers',
        component: () => import('@/views/collaboration/CollaborationMembers.vue'),
        meta: { requiresAuth: true }
      },
      {
        path: 'collaboration/cases/:id/tasks',
        name: 'CollaborationTasks',
        component: () => import('@/views/collaboration/CollaborationTasks.vue'),
        meta: { requiresAuth: true }
      },
      // 数据分析路由（合并成本分析和数据分析）
      {
        path: 'analytics',
        name: 'Analytics',
        component: () => import('@/views/analytics/Analytics.vue'),
        meta: { requiresAuth: true }
      },
      {
        path: 'analytics/cost',
        name: 'CostAnalytics',
        component: () => import('@/views/cost/CostAnalytics.vue'),
        meta: { requiresAuth: true }
      },
      {
        path: 'analytics/lawyers',
        name: 'LawyerEvaluation',
        component: () => import('@/views/analytics/LawyerEvaluation.vue'),
        meta: { requiresAuth: true }
      },
      {
        path: 'analytics/similar-cases',
        name: 'SimilarCases',
        component: () => import('@/views/analytics/SimilarCases.vue'),
        meta: { requiresAuth: true }
      },
      // 归档管理路由
      {
        path: 'archive/closure-report/:caseId',
        name: 'ClosureReport',
        component: () => import('@/views/archive/ClosureReport.vue'),
        meta: { requiresAuth: true }
      },
      {
        path: 'archive/search',
        name: 'ArchiveSearch',
        component: () => import('@/views/archive/ArchiveSearch.vue'),
        meta: { requiresAuth: true }
      },
      {
        path: 'archive/knowledge',
        name: 'KnowledgeBase',
        component: () => import('@/views/archive/KnowledgeBase.vue'),
        meta: { requiresAuth: true }
      }
    ]
  },
  // 404 页面
  {
    path: '/:pathMatch(.*)*',
    name: 'NotFound',
    component: () => import('@/views/error/NotFound.vue'),
    meta: { requiresAuth: false }
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes,
  // 滚动行为：切换路由时滚动到页面顶部
  scrollBehavior(to, from, savedPosition) {
    if (savedPosition) {
      return savedPosition
    } else {
      return { top: 0 }
    }
  }
})

// 设置路由守卫
setupRouterGuards(router)

export default router
