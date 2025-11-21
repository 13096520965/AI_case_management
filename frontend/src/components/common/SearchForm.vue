<template>
  <div class="search-form">
    <el-form
      :model="searchData"
      :inline="inline"
      :label-width="labelWidth"
      class="search-form-content"
    >
      <slot :search-data="searchData" />
      <el-form-item>
        <el-button type="primary" :icon="Search" @click="handleSearch">
          搜索
        </el-button>
        <el-button :icon="Refresh" @click="handleReset">
          重置
        </el-button>
        <slot name="extra-buttons" />
      </el-form-item>
    </el-form>
  </div>
</template>

<script setup lang="ts">
import { Search, Refresh } from '@element-plus/icons-vue'

interface Props {
  searchData: Record<string, any>
  inline?: boolean
  labelWidth?: string | number
}

interface Emits {
  (e: 'search', data: Record<string, any>): void
  (e: 'reset'): void
}

const props = withDefaults(defineProps<Props>(), {
  inline: true,
  labelWidth: '80px'
})

const emit = defineEmits<Emits>()

const handleSearch = () => {
  emit('search', props.searchData)
}

const handleReset = () => {
  // Reset all fields to empty or default values
  Object.keys(props.searchData).forEach(key => {
    if (Array.isArray(props.searchData[key])) {
      props.searchData[key] = []
    } else if (typeof props.searchData[key] === 'number') {
      props.searchData[key] = 0
    } else {
      props.searchData[key] = ''
    }
  })
  emit('reset')
}
</script>

<style scoped>
.search-form {
  background: #fff;
  padding: 16px;
  border-radius: 4px;
  margin-bottom: 16px;
}

.search-form-content {
  margin-bottom: 0;
}
</style>
