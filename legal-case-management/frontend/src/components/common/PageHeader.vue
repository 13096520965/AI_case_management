<template>
  <div class="page-header">
    <div class="header-left">
      <el-icon v-if="showBack" class="back-icon" @click="handleBack">
        <ArrowLeft />
      </el-icon>
      <h2 class="page-title">{{ title }}</h2>
      <span v-if="subtitle" class="page-subtitle">{{ subtitle }}</span>
    </div>
    <div class="header-right">
      <slot name="extra" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router'
import { ArrowLeft } from '@element-plus/icons-vue'

interface Props {
  title: string
  subtitle?: string
  showBack?: boolean
}

interface Emits {
  (e: 'back'): void
}

const props = withDefaults(defineProps<Props>(), {
  showBack: false
})

const emit = defineEmits<Emits>()
const router = useRouter()

const handleBack = () => {
  emit('back')
  if (!emit('back')) {
    router.back()
  }
}
</script>

<style scoped>
.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: #fff;
  padding: 16px 20px;
  border-radius: 4px;
  margin-bottom: 16px;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 12px;
}

.back-icon {
  font-size: 20px;
  cursor: pointer;
  transition: color 0.3s;
}

.back-icon:hover {
  color: #409eff;
}

.page-title {
  margin: 0;
  font-size: 20px;
  font-weight: 600;
  color: #303133;
}

.page-subtitle {
  font-size: 14px;
  color: #909399;
}

.header-right {
  display: flex;
  gap: 12px;
}
</style>
