<template>
  <div class="table-empty">
    <el-empty :description="description" :image-size="imageSize">
      <template v-if="$slots.default" #default>
        <slot />
      </template>
    </el-empty>
  </div>
</template>

<script setup lang="ts">
interface Props {
  description?: string
  imageSize?: number
}

withDefaults(defineProps<Props>(), {
  description: '暂无数据',
  imageSize: 60
})
</script>

<style scoped>
.table-empty {
  padding: 20px 0;
  min-height: 120px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.table-empty :deep(.el-empty) {
  padding: 0;
}

.table-empty :deep(.el-empty__image) {
  width: 60px;
  height: 60px;
}

.table-empty :deep(.el-empty__description) {
  margin-top: 12px;
  font-size: 14px;
  color: #909399;
}

.table-empty :deep(.el-empty__bottom) {
  margin-top: 12px;
}
</style>
