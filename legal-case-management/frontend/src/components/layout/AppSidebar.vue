<template>
  <el-aside :width="collapsed ? '64px' : '200px'" class="app-sidebar">
    <el-menu
      :default-active="activeMenu"
      :default-openeds="defaultOpeneds"
      :collapse="collapsed"
      :collapse-transition="false"
      router
      class="sidebar-menu"
    >
      <el-menu-item index="/dashboard">
        <el-icon><DataAnalysis /></el-icon>
        <template #title>首页</template>
      </el-menu-item>
      
      <el-menu-item index="/cases">
        <el-icon><Document /></el-icon>
        <template #title>案件管理</template>
      </el-menu-item>
      
      <el-sub-menu index="/process">
        <template #title>
          <el-icon><Operation /></el-icon>
          <span>流程管理</span>
        </template>
        <el-menu-item index="/process/templates">流程模板</el-menu-item>
      </el-sub-menu>
      
      <el-sub-menu index="/documents">
        <template #title>
          <el-icon><Tickets /></el-icon>
          <span>文书模板</span>
        </template>
        <el-menu-item index="/documents/templates">模板管理</el-menu-item>
        <el-menu-item index="/documents/ocr">文书识别</el-menu-item>
      </el-sub-menu>
      
      <el-sub-menu index="/notifications">
        <template #title>
          <el-icon><Bell /></el-icon>
          <span>提醒中心</span>
        </template>
        <el-menu-item index="/notifications">提醒列表</el-menu-item>
        <el-menu-item index="/notifications/rules">提醒规则</el-menu-item>
        <el-menu-item index="/notifications/alerts">超期预警</el-menu-item>
      </el-sub-menu>
      
      <el-sub-menu index="/analytics">
        <template #title>
          <el-icon><TrendCharts /></el-icon>
          <span>数据分析</span>
        </template>
        <el-menu-item index="/analytics">数据概览</el-menu-item>
        <el-menu-item index="/analytics/cost">成本分析</el-menu-item>
        <el-menu-item index="/analytics/lawyers">律师评估</el-menu-item>
        <el-menu-item index="/analytics/similar-cases">类案检索</el-menu-item>
      </el-sub-menu>
      
      <el-sub-menu index="/archive">
        <template #title>
          <el-icon><FolderOpened /></el-icon>
          <span>归档管理</span>
        </template>
        <el-menu-item index="/archive/search">归档检索</el-menu-item>
        <el-menu-item index="/archive/knowledge">案例知识库</el-menu-item>
      </el-sub-menu>
      
      <el-menu-item index="/costs/calculator">
        <el-icon><Money /></el-icon>
        <template #title>费用计算器</template>
      </el-menu-item>
    </el-menu>
  </el-aside>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import {
  DataAnalysis,
  Document,
  Operation,
  Tickets,
  Money,
  Bell,
  TrendCharts,
  FolderOpened
} from '@element-plus/icons-vue'

interface Props {
  collapsed?: boolean
}

defineProps<Props>()

const route = useRoute()

// 计算当前激活的菜单项
const activeMenu = computed(() => {
  return route.path
})

// 默认展开的子菜单
const defaultOpeneds = computed(() => {
  const path = route.path
  const openeds: string[] = []
  
  if (path.startsWith('/process')) {
    openeds.push('/process')
  }
  if (path.startsWith('/documents')) {
    openeds.push('/documents')
  }
  if (path.startsWith('/costs')) {
    openeds.push('/costs')
  }
  if (path.startsWith('/notifications')) {
    openeds.push('/notifications')
  }
  if (path.startsWith('/analytics')) {
    openeds.push('/analytics')
  }
  if (path.startsWith('/archive')) {
    openeds.push('/archive')
  }
  
  return openeds
})
</script>

<style scoped>
.app-sidebar {
  background: #fff;
  border-right: 1px solid #e8e8e8;
  transition: width 0.3s;
  overflow-x: hidden;
}

.sidebar-menu {
  border-right: none;
  height: 100%;
}

.sidebar-menu:not(.el-menu--collapse) {
  width: 200px;
}
</style>
