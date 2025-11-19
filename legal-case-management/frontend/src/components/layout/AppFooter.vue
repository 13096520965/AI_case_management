<template>
  <el-footer class="app-footer">
    <div class="footer-content">
      <span>© 2024 智能案管系统. All rights reserved.</span>
      <div class="footer-links">
        <a href="#" @click.prevent>帮助文档</a>
        <span class="divider">|</span>
        <a href="#" @click.prevent>关于我们</a>
        <span class="divider">|</span>
        <a href="#" @click.prevent>联系我们</a>
      </div>
    </div>
  </el-footer>
</template>

<script setup lang="ts">
</script>

<style scoped>
.app-footer {
  background: #fff;
  border-top: 1px solid #e8e8e8;
  padding: 16px 20px;
  height: auto !important;
}

.footer-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
  color: #909399;
  font-size: 14px;
}

.footer-links {
  display: flex;
  gap: 8px;
  align-items: center;
}

.footer-links a {
  color: #909399;
  text-decoration: none;
  transition: color 0.3s;
}

.footer-links a:hover {
  color: #409eff;
}

.divider {
  color: #dcdfe6;
}
</style>
