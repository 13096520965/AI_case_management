<template>
  <div class="party-management-page">
    <PageHeader title="诉讼主体管理" />
    
    <el-card shadow="never">
      <PartyManagement :case-id="caseId" />
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import PageHeader from '@/components/common/PageHeader.vue'
import PartyManagement from '@/components/case/PartyManagement.vue'

const route = useRoute()
const caseId = computed(() => Number(route.params.id))
</script>

<style scoped>
.party-management-page {
  padding: 20px;
}
</style>
