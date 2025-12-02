<template>
  <div class="case-detail-container">
    <PageHeader title="案件详情" :show-back="true" @back="goBack" />

    <div v-loading="loading">
      <!-- Case Notifications -->
      <el-card
        v-if="caseNotifications.length > 0"
        shadow="never"
        class="info-card notification-card"
      >
        <template #header>
          <div class="card-header">
            <span class="card-title">
              <el-icon style="margin-right: 8px; color: #f56c6c">
                <Warning />
              </el-icon>
              提醒消息
            </span>
          </div>
        </template>

        <div class="notifications-list">
          <div
            v-for="notification in caseNotifications"
            :key="notification.id"
            class="notification-item"
          >
            <div
              class="notification-badge"
              :class="`badge-${notification.taskType}`"
            ></div>
            <div class="notification-content">
              <div class="notification-title">
                <span class="node-name">{{ notification.nodeName }}</span>
                <el-tag
                  :type="getNotificationTagType(notification.taskType)"
                  size="small"
                >
                  {{ getNotificationTypeLabel(notification.taskType) }}
                </el-tag>
              </div>
              <div class="notification-text">
                {{ notification.content }}
              </div>
              <div class="notification-meta">
                <span v-if="notification.nodeDeadline" class="meta-item">
                  <strong>截止日期:</strong>
                  {{ formatDate(notification.nodeDeadline) }}
                </span>
                <span class="meta-item">
                  <strong>提醒时间:</strong>
                  {{ formatDateTime(notification.scheduledTime) }}
                </span>
              </div>
            </div>
          </div>
        </div>
      </el-card>

      <!-- Basic Information -->
      <el-card shadow="never" class="info-card">
        <template #header>
          <div class="card-header">
            <span class="card-title">基本信息</span>
            <div class="header-actions">
              <el-button
                v-if="caseData.status === '已结案'"
                type="success"
                @click="handleArchive"
              >
                <el-icon><FolderChecked /></el-icon>
                一键归档
              </el-button>
              <el-button type="primary" link @click="handleEdit">
                <el-icon><Edit /></el-icon>
                编辑
              </el-button>
            </div>
          </div>
        </template>

        <el-descriptions :column="2" border>
          <el-descriptions-item label="内部编号">
            {{ caseData.internalNumber || '-' }}
          </el-descriptions-item>
          <el-descriptions-item label="案号">
            {{ caseData.caseNumber || '-' }}
          </el-descriptions-item>
          <el-descriptions-item label="案件类型">
            <el-tag :type="getCaseTypeTag(caseData.caseType)">
              {{ caseData.caseType || '-' }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="案件状态">
            <el-tag :type="getStatusTag(caseData.status)">
              {{ caseData.status || '-' }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="案由">
            {{ caseData.caseCause || '-' }}
          </el-descriptions-item>
          <el-descriptions-item label="受理法院">
            {{ caseData.court || '-' }}
          </el-descriptions-item>
          <el-descriptions-item label="标的额">
            {{ formatAmount(caseData.targetAmount) }}
          </el-descriptions-item>
          <el-descriptions-item label="立案日期">
            {{ formatDate(caseData.filingDate) }}
          </el-descriptions-item>
          <el-descriptions-item label="产业板块">
            {{ caseData.industrySegment || '-' }}
          </el-descriptions-item>
          <el-descriptions-item label="案件承接人">
            {{ caseData.handler || '-' }}
          </el-descriptions-item>
        
          <el-descriptions-item label="外部代理">
            <el-tag
              :type="caseData.isExternalAgent ? 'success' : 'info'"
              size="small"
            >
              {{ caseData.isExternalAgent ? '是' : '否' }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item
            v-if="caseData.isExternalAgent"
            label="律所名称"
          >
            {{ caseData.lawFirmName || '-' }}
          </el-descriptions-item>
          <el-descriptions-item
            v-if="caseData.isExternalAgent"
            label="代理律师"
          >
            {{ caseData.agentLawyer || '-' }}
          </el-descriptions-item>
          <el-descriptions-item
            v-if="caseData.isExternalAgent"
            label="联系方式"
          >
            {{ caseData.agentContact || '-' }}
          </el-descriptions-item>
          <el-descriptions-item label="创建时间">
            {{ formatDateTime(caseData.createdAt) }}
          </el-descriptions-item>
          <el-descriptions-item label="更新时间">
            {{ formatDateTime(caseData.updatedAt) }}
          </el-descriptions-item>
          <el-descriptions-item label="案件背景" :span="2">
            <div class="case-background">
              {{ caseData.caseBackground || '-' }}
            </div>
          </el-descriptions-item>
          <el-descriptions-item label="案件结果" :span="2">
            <div class="case-result">
              {{ caseData.caseResult || '-' }}
            </div>
          </el-descriptions-item>
        </el-descriptions>
      </el-card>

      <!-- Target Amount Detail -->
      <TargetAmountDetail :case-id="caseId" :show-detail-button="false" />

      <!-- Litigation Parties -->
      <el-card shadow="never" class="info-card">
        <template #header>
          <div class="card-header">
            <span class="card-title">诉讼主体</span>
          </div>
        </template>

        <PartyManagement
          :case-id="caseId"
          :readonly="true"
          @refresh="fetchCaseData"
        />
      </el-card>

      <!-- Process Nodes Timeline -->
      <el-card shadow="never" class="info-card">
        <template #header>
          <div class="card-header">
            <span class="card-title">流程节点</span>
          </div>
        </template>

        <el-timeline v-if="processNodes.length > 0">
          <el-timeline-item
            v-for="node in processNodes"
            :key="node.id"
            :timestamp="formatDate(node.startTime)"
            :color="getNodeColor(node.status)"
          >
            <div class="timeline-content">
              <div class="node-header">
                <span class="node-name">{{ node.nodeName }}</span>
                <el-tag :type="getNodeStatusTag(node.status)" size="small">
                  {{ node.status }}
                </el-tag>
              </div>
              <div class="node-info">
                <span>经办人: {{ node.handler || '-' }}</span>
                <span v-if="node.deadline"
                  >截止日期: {{ formatDate(node.deadline) }}</span
                >
              </div>
            </div>
          </el-timeline-item>
        </el-timeline>

        <TableEmpty v-else description="暂无流程节点" />
      </el-card>

      <!-- Evidence List -->
      <el-card shadow="never" class="info-card">
        <template #header>
          <div class="card-header">
            <span class="card-title">证据材料</span>
          </div>
        </template>
        <el-table :data="evidenceList" stripe max-height="300">
          <el-table-column
            prop="fileName"
            label="文件名"
            min-width="200"
            show-overflow-tooltip
          />
          <el-table-column prop="description" label="描述" min-width="200" show-overflow-tooltip />
          <el-table-column prop="category" label="分类" width="120" />
          <el-table-column prop="tags" label="标签" width="180">
            <template #default="{ row }">
              <el-tag
                v-for="tag in parseTags(row.tags)"
                :key="tag"
                size="small"
                style="margin-right: 5px"
              >
                {{ tag }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="uploadedAt" label="上传时间" width="180">
            <template #default="{ row }">
              {{ formatDateTime(row.uploadedAt) }}
            </template>
          </el-table-column>
          <template #empty>
            <TableEmpty description="暂无证据材料" />
          </template>
        </el-table>
      </el-card>

      <!-- Documents List -->
      <el-card shadow="never" class="info-card">
        <template #header>
          <div class="card-header">
            <span class="card-title">文书材料</span>
          </div>
        </template>

        <el-table :data="documentList" stripe max-height="300">
          <el-table-column prop="documentType" label="文书类型" width="120" />
          <el-table-column
            prop="fileName"
            label="文件名"
            min-width="200"
            show-overflow-tooltip
          />
          <el-table-column prop="description" label="备注" width="120" show-overflow-tooltip />
          <el-table-column prop="uploadedAt" label="上传时间" width="180">
            <template #default="{ row }">
              {{ formatDateTime(row.uploadedAt) }}
            </template>
          </el-table-column>
          <template #empty>
            <TableEmpty description="暂无文书材料" />
          </template>
        </el-table>
      </el-card>

      <!-- Cost Records -->
      <el-card shadow="never" class="info-card">
        <template #header>
          <div class="card-header">
            <span class="card-title">成本记录</span>
          </div>
        </template>

        <el-table
          :data="costRecords"
          stripe
          max-height="300"
          show-summary
          :summary-method="getCostSummary"
        >
          <el-table-column prop="costType" label="费用类型" width="120" />
          <el-table-column
            prop="amount"
            label="金额（元）"
            width="150"
            align="right"
          >
            <template #default="{ row }">
              {{ formatAmount(row.amount) }}
            </template>
          </el-table-column>
          <el-table-column prop="paymentDate" label="支付日期" width="120">
            <template #default="{ row }">
              {{ formatDate(row.paymentDate) }}
            </template>
          </el-table-column>
          <el-table-column prop="status" label="状态" width="100">
            <template #default="{ row }">
              <el-tag
                :type="row.status === '已支付' ? 'success' : 'warning'"
                size="small"
              >
                {{ row.status }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="payer" label="支付方" min-width="120" />
          <template #empty>
            <TableEmpty description="暂无成本记录" />
          </template>
        </el-table>
      </el-card>

      <!-- Operation Logs -->
      <CaseLogViewer :case-id="caseId" />
    </div>

    <!-- 归档对话框 -->
    <el-dialog
      v-model="archiveDialogVisible"
      title="案件归档"
      width="500px"
      :close-on-click-modal="false"
    >
      <el-form ref="archiveFormRef" :model="archiveForm" label-width="100px">
        <el-form-item label="案件名称">
          <el-input
            :value="
              caseData.caseCause ||
              caseData.caseNumber ||
              caseData.internalNumber ||
              '未命名案件'
            "
            disabled
          />
        </el-form-item>

        <el-form-item
          label="归档人"
          prop="archiver"
          :rules="[
            { required: true, message: '请输入归档人', trigger: 'blur' },
          ]"
        >
          <el-input
            v-model="archiveForm.archiver"
            placeholder="请输入归档人姓名"
          />
        </el-form-item>

        <el-form-item label="备注" prop="notes">
          <el-input
            v-model="archiveForm.notes"
            type="textarea"
            :rows="4"
            placeholder="请输入归档备注（选填）"
          />
        </el-form-item>
      </el-form>

      <template #footer>
        <el-button @click="archiveDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="submitArchive">确定归档</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { ElMessage, type FormInstance } from 'element-plus';
import { Edit, FolderChecked, Warning } from '@element-plus/icons-vue';
import { caseApi } from '@/api/case';
import { archiveApi } from '@/api/archive';
import { processNodeApi } from '@/api/processNode';
import { evidenceApi } from '@/api/evidence';
import { documentApi } from '@/api/document';
import { costApi } from '@/api/cost';
import { notificationApi, notificationRuleApi } from '@/api/notification';
import { useCaseStore } from '@/stores/case';
import PageHeader from '@/components/common/PageHeader.vue';
import PartyManagement from '@/components/case/PartyManagement.vue';
import TableEmpty from '@/components/common/TableEmpty.vue';
import CaseLogViewer from '@/components/case/CaseLogViewer.vue';
import TargetAmountDetail from '@/components/case/TargetAmountDetail.vue';
import request from '@/api/request';

const route = useRoute();
const router = useRouter();
const caseStore = useCaseStore();

// State
const loading = ref(false);
const caseId = Number(route.params.id);
const caseData = reactive<any>({});
const archiveDialogVisible = ref(false);
const archiveFormRef = ref<FormInstance>();
const archiveForm = reactive({
  archiver: '',
  notes: '',
});
const processNodes = ref<any[]>([]);
const evidenceList = ref<any[]>([]);
const documentList = ref<any[]>([]);
const costRecords = ref<any[]>([]);
const caseNotifications = ref<any[]>([]);

// Fetch case data
const fetchCaseData = async () => {
  loading.value = true;
  try {
    const response = await caseApi.getCaseById(caseId);
    if (response && response.data) {
      // 后端返回 { data: { case: {...} } }
      const data = response.data.case;

      if (!data || !data.id) {
        console.error('案件数据格式错误:', response);
        ElMessage.error('案件数据格式错误');
        return;
      }

      // 转换字段名从下划线到驼峰
      Object.assign(caseData, {
        id: data.id,
        internalNumber: data.internal_number,
        caseNumber: data.case_number,
        caseType: data.case_type,
        caseCause: data.case_cause,
        court: data.court,
        handler: data.handler,
        targetAmount: data.target_amount,
        filingDate: data.filing_date,
        status: data.status,
  // teamId removed per requirements
  caseResult: data.case_result,
        industrySegment: data.industry_segment,
        isExternalAgent: data.is_external_agent,
        lawFirmName: data.law_firm_name,
        agentLawyer: data.agent_lawyer,
        agentContact: data.agent_contact,
        caseBackground: data.case_background,
        createdAt: data.created_at,
        updatedAt: data.updated_at,
      });
      caseStore.setCurrentCase(data);
    }
  } catch (error: any) {
    console.error('获取案件信息失败:', error);
    ElMessage.error(error.message || '获取案件信息失败');
  } finally {
    loading.value = false;
  }
};

// Fetch process nodes
const fetchProcessNodes = async () => {
  try {
    const response = await processNodeApi.getNodesByCaseId(caseId);
    if (response && response.data) {
      const data = response.data.nodes || [];
      // 转换字段名从下划线到驼峰，并转换状态为中文
      const nodes = Array.isArray(data)
        ? data.map((node: any) => ({
            id: node.id,
            caseId: node.case_id,
            nodeName: node.node_name,
            handler: node.handler,
            startTime: node.start_time,
            deadline: node.deadline,
            completionTime: node.completion_time,
            status: convertStatusToChinese(node.status),
            progress: node.progress,
            nodeOrder: node.node_order,
            createdAt: node.created_at,
            updatedAt: node.updated_at,
          }))
        : [];
      processNodes.value = nodes.slice(0, 5);
    }
  } catch (error: any) {
    console.error('获取流程节点失败:', error);
  }
};

// Fetch evidence
const fetchEvidence = async () => {
  try {
  const response: any = await evidenceApi.getEvidenceByCaseId(caseId);
    if (response) {
      // 兼容后端不同返回格式：
      // 1) 旧格式: { count: ..., evidence: [...] }
      // 2) 新格式: { success, code, message, data: { items: [...] } }
      // 3) 直接返回数组: [ {...}, {...} ]
      let data: any[] = [];
      if (Array.isArray(response)) {
        data = response;
      } else if (Array.isArray(response.evidence)) {
        data = response.evidence;
      } else if (Array.isArray(response.items)) {
        data = response.items;
      } else if (Array.isArray(response.data?.items)) {
        data = response.data.items;
      } else if (Array.isArray(response.data?.evidence)) {
        data = response.data.evidence;
      }

      // 转换字段名从下划线到驼峰，并在 file_type 缺失时根据 storage_path 推断
      const evidence = Array.isArray(data)
        ? data.map((item: any) => ({
            id: item.id,
            caseId: item.case_id,
            fileName: item.file_name,
            fileType: item.file_type || inferFileTypeFromPath(item.storage_path),
            filePath: item.storage_path,
            description: item.description ?? item.remark ?? item.notes ?? '',
            fileSize: item.file_size,
            category: item.category,
            tags: item.tags,
            uploadedBy: item.uploaded_by,
            uploadedAt: item.uploaded_at,
          }))
        : [];
      evidenceList.value = evidence.slice(0, 5);
    }
  } catch (error: any) {
    console.error('获取证据材料失败:', error);
  }
};

// 根据 storage_path 推断文件的 MIME 类型（尽量返回标准的 type/subtype，例如 image/png）
const inferFileTypeFromPath = (storagePath?: string): string | null => {
  if (!storagePath) return null;
  const lower = storagePath.toLowerCase();
  const extMatch = lower.match(/\.([a-z0-9]+)(?:[?#]|$)/);
  const ext = extMatch ? extMatch[1] : null;
  if (!ext) return null;
  const imageExt = ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp'];
  const audioExt = ['mp3', 'wav', 'ogg', 'm4a', 'aac'];
  const videoExt = ['mp4', 'avi', 'mov', 'wmv', 'flv', 'webm', 'mkv'];
  if (imageExt.includes(ext)) return `image/${ext === 'jpg' ? 'jpeg' : ext}`;
  if (ext === 'pdf') return 'application/pdf';
  if (audioExt.includes(ext)) return `audio/${ext}`;
  if (videoExt.includes(ext)) return `video/${ext}`;
  return null;
};

// Fetch documents
const fetchDocuments = async () => {
  try {
    const response = await documentApi.getDocumentsByCaseId(caseId);
    if (response) {
      // 后端返回 { count: ..., documents: [...] }
      const data = response.documents || [];
      // 转换字段名从下划线到驼峰
      const documents = Array.isArray(data)
        ? data.map((item: any) => ({
            id: item.id,
            caseId: item.case_id,
            documentType: item.document_type,
            fileName: item.file_name,
            filePath: item.storage_path,
            description: item.description ?? item.remark ?? item.notes ?? '',
            extractedContent: item.extracted_content,
            uploadedAt: item.uploaded_at,
          }))
        : [];
      documentList.value = documents.slice(0, 5);
    }
  } catch (error: any) {
    console.error('获取文书材料失败:', error);
  }
};

// Fetch costs
const fetchCosts = async () => {
  try {
    const response = await costApi.getCostsByCaseId(caseId);
    if (response && response.data) {
      const data = response.data.costs || [];
      // 转换字段名从下划线到驼峰
      const costs = Array.isArray(data)
        ? data.map((item: any) => ({
            id: item.id,
            caseId: item.case_id,
            costType: item.cost_type,
            amount: item.amount,
            paymentDate: item.payment_date,
            status: item.status,
            payer: item.payer,
            description: item.description,
            createdAt: item.created_at,
          }))
        : [];
      costRecords.value = costs.slice(0, 5);
    }
  } catch (error: any) {
    console.error('获取成本记录失败:', error);
  }
};

// Fetch case notifications
const fetchCaseNotifications = async () => {
  try {
    // 获取所有通知
    const notificationsResponse = await notificationApi.getNotifications();
    const allNotifications = Array.isArray(notificationsResponse)
      ? notificationsResponse
      : notificationsResponse?.data || [];

    // 获取该案件的所有节点
    const nodesResponse = await processNodeApi.getNodesByCaseId(caseId);
    const nodes = nodesResponse?.data?.nodes || [];

    // 过滤出与该案件相关的通知（后端已返回 caseId）
    const nodeNotificationMap = new Map<number, any>(); // 用于去重，每个节点只保留一条

    for (const notification of allNotifications) {
      // 检查通知是否属于当前案件
      if (notification.caseId === caseId) {
        // 获取对应的节点信息
        const node = nodes.find((n: any) => n.id === notification.relatedId);

        const notificationWithNode = {
          ...notification,
          nodeName: node?.node_name || node?.nodeName || '未知节点',
          nodeDeadline: node?.deadline,
        };

        // 每个节点只保留一条提醒（保留最新的）
        const relatedId = notification.relatedId;
        if (!nodeNotificationMap.has(relatedId)) {
          nodeNotificationMap.set(relatedId, notificationWithNode);
        } else {
          // 比较时间，保留更新的提醒
          const existing = nodeNotificationMap.get(relatedId);
          const existingTime = new Date(existing.createdAt).getTime();
          const newTime = new Date(notification.createdAt).getTime();
          if (newTime > existingTime) {
            nodeNotificationMap.set(relatedId, notificationWithNode);
          }
        }
      }
    }

    // 将 Map 转换为数组
    caseNotifications.value = Array.from(nodeNotificationMap.values());
  } catch (error: any) {
    console.error('获取案件通知失败:', error);
  }
};

// Action handlers
const handleEdit = () => {
  router.push(`/cases/${caseId}/edit`);
};

// Handle archive - 打开归档对话框
const handleArchive = () => {
  // 重置表单
  archiveForm.archiver = '';
  archiveForm.notes = '';
  archiveFormRef.value?.clearValidate();
  // 打开对话框
  archiveDialogVisible.value = true;
};

// 提交归档
const submitArchive = async () => {
  if (!archiveFormRef.value) return;

  await archiveFormRef.value.validate(async (valid) => {
    if (!valid) return;

    try {
      // 更新案件状态为已归档
      await caseApi.updateCase(caseId, { status: '已归档' });

      // 创建归档记录（使用下划线命名以匹配后端）
      await archiveApi.createArchivePackage({
        case_id: caseId,
        archived_by: archiveForm.archiver,
        notes: archiveForm.notes || '',
      } as any);

      ElMessage.success('案件已成功归档，已加入归档列表');

      // 关闭对话框
      archiveDialogVisible.value = false;

      // 刷新案件数据
      await fetchCaseData();
    } catch (error: any) {
      ElMessage.error(error.message || '归档失败');
    }
  });
};

const goBack = () => {
  router.push('/cases');
};

// Utility functions
const getCaseTypeTag = (type: string) => {
  const tagMap: Record<string, string> = {
    民事: '',
    刑事: 'danger',
    行政: 'warning',
    劳动仲裁: 'success',
  };
  return tagMap[type] || '';
};

const getStatusTag = (status: string) => {
  const tagMap: Record<string, string> = {
    立案: 'info',
    审理中: '',
    已结案: 'success',
    已归档: 'info',
  };
  return tagMap[status] || '';
};

// Convert English status to Chinese
const convertStatusToChinese = (status: string): string => {
  const statusMap: Record<string, string> = {
    pending: '待处理',
    in_progress: '进行中',
    completed: '已完成',
    overdue: '超期',
  };
  return statusMap[status] || status;
};

const getNodeStatusTag = (status: string) => {
  const tagMap: Record<string, string> = {
    待处理: 'info',
    进行中: 'warning',
    已完成: 'success',
    超期: 'danger',
  };
  return tagMap[status] || 'info';
};

const getNodeColor = (status: string) => {
  const colorMap: Record<string, string> = {
    待处理: '#909399',
    进行中: '#E6A23C',
    已完成: '#67C23A',
    超期: '#F56C6C',
  };
  return colorMap[status] || '#909399';
};

const formatAmount = (amount: number) => {
  if (!amount) return '-';
  return amount.toLocaleString('zh-CN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
};

const formatDate = (date: string) => {
  if (!date) return '-';
  return date.split('T')[0];
};

const formatDateTime = (datetime: string) => {
  if (!datetime) return '-';
  return datetime.replace('T', ' ').split('.')[0];
};

const parseTags = (tags?: string): string[] => {
  if (!tags) return [];
  return tags
    .split(',')
    .map((t) => t.trim())
    .filter((t) => t);
};

const getCostSummary = (param: any) => {
  const { columns, data } = param;
  const sums: string[] = [];
  columns.forEach((column: any, index: number) => {
    if (index === 0) {
      sums[index] = '合计';
      return;
    }
    if (column.property === 'amount') {
      const values = data.map((item: any) => Number(item.amount));
      const total = values.reduce(
        (prev: number, curr: number) => prev + curr,
        0
      );
      sums[index] = formatAmount(total);
    } else {
      sums[index] = '';
    }
  });
  return sums;
};

const getNotificationTagType = (taskType: string): any => {
  const typeMap: Record<string, any> = {
    deadline: 'warning',
    overdue: 'danger',
    payment: 'primary',
    task: 'success',
    system: 'info',
  };
  return typeMap[taskType] || 'info';
};

const getNotificationTypeLabel = (taskType: string): string => {
  const labelMap: Record<string, string> = {
    deadline: '节点到期',
    overdue: '节点超期',
    payment: '费用支付',
    task: '协作任务',
    system: '系统通知',
  };
  return labelMap[taskType] || taskType;
};

// Lifecycle
onMounted(async () => {
  await fetchCaseData();
  await Promise.all([
    fetchProcessNodes(),
    fetchEvidence(),
    fetchDocuments(),
    fetchCosts(),
    fetchCaseNotifications(),
  ]);
});
</script>

<style scoped>
.case-detail-container {
  padding: 20px;
}

.info-card {
  margin-bottom: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.header-actions {
  display: flex;
  gap: 8px;
  align-items: center;
}

.card-title {
  font-size: 16px;
  font-weight: 600;
}

.timeline-content {
  padding-left: 10px;
}

.node-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.node-name {
  font-weight: 600;
  font-size: 14px;
}

.node-info {
  display: flex;
  gap: 20px;
  font-size: 13px;
  color: #606266;
}

.log-content {
  font-size: 14px;
  line-height: 1.6;
}

.log-text {
  color: #606266;
}

.notifications-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.notification-item {
  display: flex;
  gap: 12px;
  padding: 12px;
  background-color: #fef0f0;
  border-radius: 4px;
  border-left: 3px solid #f56c6c;
}

.notification-badge {
  width: 4px;
  height: 100%;
  border-radius: 2px;
  flex-shrink: 0;
}

.badge-deadline {
  background-color: #e6a23c;
}

.badge-overdue {
  background-color: #f56c6c;
}

.badge-payment {
  background-color: #409eff;
}

.badge-task {
  background-color: #67c23a;
}

.badge-system {
  background-color: #909399;
}

.notification-content {
  flex: 1;
  min-width: 0;
}

.notification-title {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
}

.node-name {
  font-weight: 600;
  color: #303133;
}

.notification-text {
  color: #606266;
  font-size: 14px;
  margin-bottom: 8px;
  line-height: 1.5;
}

.notification-meta {
  display: flex;
  gap: 16px;
  font-size: 12px;
  color: #909399;
}

.meta-item {
  display: flex;
  align-items: center;
  gap: 4px;
}

.case-background {
  max-height: 120px;
  overflow-y: auto;
  line-height: 1.6;
  word-break: break-word;
  white-space: pre-wrap;
}
</style>
