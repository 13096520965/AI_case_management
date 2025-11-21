<template>
  <el-container class="app-layout">
    <AppHeader :collapsed="collapsed" @toggle-sidebar="toggleSidebar" />
    <el-container class="main-container">
      <AppSidebar :collapsed="collapsed" />
      <el-main class="app-main">
        <router-view />
      </el-main>
    </el-container>
    <AppFooter />

    <!-- 法盾助手 -->
    <LegalAssistant />
  </el-container>
</template>

<script setup lang="ts">
import { ref } from "vue";
import AppHeader from "./AppHeader.vue";
import AppSidebar from "./AppSidebar.vue";
import AppFooter from "./AppFooter.vue";
import LegalAssistant from "../assistant/LegalAssistant.vue";

const collapsed = ref(false);

const toggleSidebar = () => {
  collapsed.value = !collapsed.value;
};
</script>

<style scoped>
.app-layout {
  height: 100vh;
  display: flex;
  flex-direction: column;
}

.main-container {
  flex: 1;
  overflow: hidden;
}

.app-main {
  background: #f0f2f5;
  overflow-y: auto;
  padding: 0;
}
</style>
