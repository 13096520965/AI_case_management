<template>
  <div class="collaboration-members-container">
    <PageHeader title="协作成员管理">
      <template #extra>
        <el-button type="primary" @click="showAddDialog">
          <el-icon><Plus /></el-icon>
          添加成员
        </el-button>
      </template>
    </PageHeader>
    
    <el-card>

      <!-- 成员列表 -->
      <el-table
        v-loading="loading"
        :data="members"
        style="width: 100%"
      >
        <el-table-column prop="real_name" label="姓名" width="120" />
        <el-table-column prop="username" label="用户名" width="150" />
        <el-table-column prop="email" label="邮箱" width="200" />
        <el-table-column prop="role" label="角色" width="150">
          <template #default="{ row }">
            <el-tag :type="getRoleType(row.role)">{{ row.role }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="permissions" label="权限" min-width="200">
          <template #default="{ row }">
            <el-tag
              v-for="(perm, index) in parsePermissions(row.permissions)"
              :key="index"
              size="small"
              style="margin-right: 5px"
            >
              {{ perm }}
            </el-tag>
            <span v-if="!row.permissions || parsePermissions(row.permissions).length === 0" class="text-muted">
              无特殊权限
            </span>
          </template>
        </el-table-column>
        <el-table-column prop="joined_at" label="加入时间" width="180">
          <template #default="{ row }">
            {{ formatDate(row.joined_at) }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="150" fixed="right">
          <template #default="{ row }">
            <el-button link type="primary" size="small" @click="editMember(row)">
              编辑
            </el-button>
            <el-popconfirm
              title="确定要移除该成员吗？"
              @confirm="removeMember(row.id)"
            >
              <template #reference>
                <el-button link type="danger" size="small">
                  移除
                </el-button>
              </template>
            </el-popconfirm>
          </template>
        </el-table-column>
      </el-table>

      <!-- 空状态 -->
      <el-empty v-if="!loading && members.length === 0" description="暂无协作成员" />
    </el-card>

    <!-- 添加/编辑成员对话框 -->
    <el-dialog
      v-model="dialogVisible"
      :title="isEdit ? '编辑成员' : '添加成员'"
      width="500px"
    >
      <el-form
        ref="formRef"
        :model="form"
        :rules="rules"
        label-width="100px"
      >
        <el-form-item label="用户" prop="user_id" v-if="!isEdit">
          <el-select
            v-model="form.user_id"
            placeholder="请选择用户"
            filterable
            style="width: 100%"
          >
            <el-option
              v-for="user in availableUsers"
              :key="user.id"
              :label="`${user.real_name} (${user.username})`"
              :value="user.id"
            />
          </el-select>
        </el-form-item>

        <el-form-item label="角色" prop="role">
          <el-select v-model="form.role" placeholder="请选择角色" style="width: 100%">
            <el-option label="主办律师" value="主办律师" />
            <el-option label="协办律师" value="协办律师" />
            <el-option label="助理" value="助理" />
            <el-option label="观察者" value="观察者" />
          </el-select>
        </el-form-item>

        <el-form-item label="权限">
          <el-checkbox-group v-model="form.permissions">
            <el-checkbox label="查看案件">查看案件</el-checkbox>
            <el-checkbox label="编辑案件">编辑案件</el-checkbox>
            <el-checkbox label="管理证据">管理证据</el-checkbox>
            <el-checkbox label="管理文书">管理文书</el-checkbox>
            <el-checkbox label="管理成本">管理成本</el-checkbox>
            <el-checkbox label="分配任务">分配任务</el-checkbox>
          </el-checkbox-group>
        </el-form-item>
      </el-form>

      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="submitForm" :loading="submitting">
          确定
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, reactive } from 'vue'
import { useRoute } from 'vue-router'
import { ElMessage, type FormInstance, type FormRules } from 'element-plus'
import { Plus } from '@element-plus/icons-vue'
import { collaborationApi } from '@/api/collaboration'
import request from '@/api/request'
import PageHeader from '@/components/common/PageHeader.vue'

const route = useRoute()
const caseId = ref(Number(route.params.id))

// 数据
const loading = ref(false)
const members = ref<any[]>([])
const availableUsers = ref<any[]>([])

// 对话框
const dialogVisible = ref(false)
const isEdit = ref(false)
const submitting = ref(false)
const formRef = ref<FormInstance>()

// 表单
const form = reactive({
  id: 0,
  user_id: null as number | null,
  role: '',
  permissions: [] as string[]
})

const rules: FormRules = {
  user_id: [{ required: true, message: '请选择用户', trigger: 'change' }],
  role: [{ required: true, message: '请选择角色', trigger: 'change' }]
}

// 获取成员列表
const fetchMembers = async () => {
  loading.value = true
  try {
    const res = await collaborationApi.getMembersByCaseId(caseId.value)
    members.value = res.data.data || []
  } catch (error: any) {
    ElMessage.error(error.response?.data?.error || '获取成员列表失败')
  } finally {
    loading.value = false
  }
}

// 获取可用用户列表
const fetchAvailableUsers = async () => {
  try {
    const res = await request.get('/auth/users')
    availableUsers.value = res.data.data || []
  } catch (error: any) {
    console.error('获取用户列表失败:', error)
  }
}

// 显示添加对话框
const showAddDialog = () => {
  isEdit.value = false
  resetForm()
  dialogVisible.value = true
  fetchAvailableUsers()
}

// 编辑成员
const editMember = (member: any) => {
  isEdit.value = true
  form.id = member.id
  form.user_id = member.user_id
  form.role = member.role
  form.permissions = parsePermissions(member.permissions)
  dialogVisible.value = true
}

// 提交表单
const submitForm = async () => {
  if (!formRef.value) return

  await formRef.value.validate(async (valid) => {
    if (!valid) return

    submitting.value = true
    try {
      const data = {
        user_id: form.user_id,
        role: form.role,
        permissions: form.permissions.length > 0 ? form.permissions : null
      }

      if (isEdit.value) {
        await collaborationApi.updateMember(form.id, data)
        ElMessage.success('成员更新成功')
      } else {
        await collaborationApi.addMember(caseId.value, data)
        ElMessage.success('成员添加成功')
      }

      dialogVisible.value = false
      fetchMembers()
    } catch (error: any) {
      ElMessage.error(error.response?.data?.error || '操作失败')
    } finally {
      submitting.value = false
    }
  })
}

// 移除成员
const removeMember = async (id: number) => {
  try {
    await collaborationApi.removeMember(id)
    ElMessage.success('成员移除成功')
    fetchMembers()
  } catch (error: any) {
    ElMessage.error(error.response?.data?.error || '移除成员失败')
  }
}

// 重置表单
const resetForm = () => {
  form.id = 0
  form.user_id = null
  form.role = ''
  form.permissions = []
  formRef.value?.clearValidate()
}

// 解析权限
const parsePermissions = (permissions: any): string[] => {
  if (!permissions) return []
  if (typeof permissions === 'string') {
    try {
      return JSON.parse(permissions)
    } catch {
      return []
    }
  }
  return Array.isArray(permissions) ? permissions : []
}

// 获取角色类型
const getRoleType = (role: string) => {
  const typeMap: Record<string, any> = {
    '主办律师': 'danger',
    '协办律师': 'warning',
    '助理': 'success',
    '观察者': 'info'
  }
  return typeMap[role] || ''
}

// 格式化日期
const formatDate = (date: string) => {
  if (!date) return '-'
  return new Date(date).toLocaleString('zh-CN')
}

onMounted(() => {
  fetchMembers()
})
</script>

<style scoped>
.collaboration-members-container {
  padding: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.title {
  font-size: 18px;
  font-weight: 600;
}

.text-muted {
  color: #909399;
  font-size: 12px;
}
</style>
