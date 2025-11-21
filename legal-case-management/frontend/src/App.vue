<template>
  <div id="app">
    <router-view v-slot="{ Component, route }">
      <component :is="Component" :key="route.path" />
    </router-view>
  </div>
</template>

<script setup lang="ts">
import { onMounted } from "vue";
import { useRouter } from "vue-router";

const router = useRouter();

onMounted(() => {
  console.log("App mounted, current route:", router.currentRoute.value.path);
});
</script>

<style scoped>
#app {
  width: 100%;
  height: 100vh;
}
</style>
