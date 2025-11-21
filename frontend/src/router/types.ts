/**
 * 路由元信息类型定义
 */
export interface RouteMeta {
  /** 是否需要认证，默认为 true */
  requiresAuth?: boolean
  /** 页面标题 */
  title?: string
  /** 页面图标 */
  icon?: string
  /** 是否在菜单中隐藏 */
  hidden?: boolean
  /** 权限角色列表 */
  roles?: string[]
}

/**
 * 扩展 vue-router 的 RouteMeta 类型
 */
declare module 'vue-router' {
  interface RouteMeta {
    requiresAuth?: boolean
    title?: string
    icon?: string
    hidden?: boolean
    roles?: string[]
  }
}
