<template>
  <el-header class="app-header">
    <div class="header-left">
      <el-icon class="menu-icon" @click="toggleSidebar">
        <Expand v-if="!collapsed" />
        <Fold v-else />
      </el-icon>
      <h1 class="app-title">智能案管系统</h1>
    </div>
    <div class="header-right">
      <el-badge :value="notificationCount" :hidden="notificationCount === 0" class="notification-badge">
        <el-icon class="header-icon" @click="goToNotifications">
          <Bell />
        </el-icon>
      </el-badge>
      <el-dropdown @command="handleCommand">
        <span class="user-info">
          <el-avatar :size="32" :src="userAvatar">{{ userName }}</el-avatar>
          <span class="user-name">{{ userName }}</span>
        </span>
        <template #dropdown>
          <el-dropdown-menu>
            <el-dropdown-item command="profile">个人信息</el-dropdown-item>
            <el-dropdown-item command="settings">系统设置</el-dropdown-item>
            <el-dropdown-item divided command="logout">退出登录</el-dropdown-item>
          </el-dropdown-menu>
        </template>
      </el-dropdown>
    </div>
  </el-header>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '@/stores/user'
import { useNotificationStore } from '@/stores/notification'
import { Expand, Fold, Bell } from '@element-plus/icons-vue'

interface Props {
  collapsed?: boolean
}

interface Emits {
  (e: 'toggle-sidebar'): void
}

const props = withDefaults(defineProps<Props>(), {
  collapsed: false
})

const emit = defineEmits<Emits>()
const router = useRouter()
const userStore = useUserStore()
const notificationStore = useNotificationStore()

const userName = computed(() => userStore.user?.real_name || userStore.user?.username || '用户')
const userAvatar = computed(() => userStore.user?.avatar || '')
const notificationCount = computed(() => notificationStore.unreadCount)

const toggleSidebar = () => {
  emit('toggle-sidebar')
}

const goToNotifications = () => {
  router.push('/notifications')
}

const handleCommand = (command: string) => {
  switch (command) {
    case 'profile':
      router.push('/profile')
      break
    case 'settings':
      router.push('/settings')
      break
    case 'logout':
      userStore.logout()
      router.push('/login')
      break
  }
}
</script>

<style scoped>
.app-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: #fff;
  border-bottom: 1px solid #e8e8e8;
  padding: 0 20px;
  box-shadow: 0 1px 4px rgba(0, 21, 41, 0.08);
}

.header-left {
  display: flex;
  align-items: center;
  gap: 16px;
}

.menu-icon {
  font-size: 20px;
  cursor: pointer;
  transition: color 0.3s;
}

.menu-icon:hover {
  color: #409eff;
}

.app-title {
  margin: 0;
  font-size: 20px;
  font-weight: 600;
  color: #303133;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 20px;
}

.notification-badge {
  cursor: pointer;
}

.header-icon {
  font-size: 20px;
  cursor: pointer;
  transition: color 0.3s;
}

.header-icon:hover {
  color: #409eff;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
}

.user-name {
  font-size: 14px;
  color: #606266;
}
</style>
