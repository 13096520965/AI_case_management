<template>
  <div class="page-header">
    <el-button 
      v-if="showBack" 
      :icon="ArrowLeft" 
      @click="handleBack"
      class="back-button"
    >
      返回
    </el-button>
    <div class="header-content">
      <h2 class="page-title">{{ title }}</h2>
      <div v-if="$slots.extra" class="header-extra">
        <slot name="extra"></slot>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ArrowLeft } from '@element-plus/icons-vue'
import { useRouter } from 'vue-router'

interface Props {
  title: string
  showBack?: boolean
  backTo?: string
}

const props = withDefaults(defineProps<Props>(), {
  showBack: true,
  backTo: ''
})

const router = useRouter()

const handleBack = () => {
  if (props.backTo) {
    router.push(props.backTo)
  } else {
    router.back()
  }
}
</script>

<style scoped>
.page-header {
  margin-bottom: 20px;
}

.back-button {
  margin-bottom: 12px;
}

.header-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.page-title {
  margin: 0;
  font-size: 20px;
  font-weight: 600;
  color: #303133;
}

.header-extra {
  display: flex;
  gap: 12px;
}
</style>
