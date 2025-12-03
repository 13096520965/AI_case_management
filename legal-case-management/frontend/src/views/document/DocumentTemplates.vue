<template>
  <div class="document-templates-container">
    <PageHeader title="文书模板" />

    <!-- Filter and Actions -->
    <el-card class="action-card">
      <el-form :inline="true">
        <el-form-item label="文书类型">
          <el-select
            v-model="filterType"
            placeholder="全部类型"
            clearable
            style="width: 180px"
            @change="loadTemplates"
          >
            <el-option label="全部类型" value="" />
            <el-option
              v-for="type in documentTypes"
              :key="type"
              :label="type"
              :value="type"
            />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="showCreateDialog = true">
            <el-icon><Plus /></el-icon>
            新建模板
          </el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <!-- Template List -->
    <el-card v-loading="loading">
      <el-row :gutter="20">
        <el-col
          v-for="template in templates"
          :key="template.id"
          :xs="24"
          :sm="12"
          :md="8"
          :lg="6"
        >
          <el-card class="template-card" shadow="hover">
            <div class="template-header">
              <el-tag>{{ template.documentType }}</el-tag>
            </div>
            <h3 class="template-name">{{ template.name }}</h3>
            <p class="template-desc">{{
              template.description || "暂无描述"
            }}</p>
            <div class="template-actions">
              <el-button link type="primary" @click="handlePreview(template)"
                >预览</el-button
              >
              <el-button link type="primary" @click="handleGenerate(template)"
                >生成文书</el-button
              >
              <el-button link type="warning" @click="handleEdit(template)"
                >编辑</el-button
              >
              <el-button link type="danger" @click="handleDelete(template)"
                >删除</el-button
              >
            </div>
          </el-card>
        </el-col>
      </el-row>
      <TableEmpty v-if="templates.length === 0" description="暂无模板" />
    </el-card>

    <!-- Create/Edit Template Dialog -->
    <el-dialog
      v-model="showCreateDialog"
      :title="editingTemplate ? '编辑模板' : '新建模板'"
      width="800px"
      @close="resetForm"
    >
      <el-form
        :model="templateForm"
        :rules="templateRules"
        ref="templateFormRef"
        label-width="100px"
      >
        <el-form-item label="模板名称" prop="name">
          <el-input
            v-model="templateForm.name"
            placeholder="例如：民事起诉状模板"
          />
        </el-form-item>
        <el-form-item label="文书类型" prop="documentType">
          <el-select
            v-model="templateForm.documentType"
            placeholder="请选择文书类型"
            style="width: 100%"
          >
            <el-option
              v-for="type in documentTypes"
              :key="type"
              :label="type"
              :value="type"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="选择变量">
          <div class="variable-selector">
            <el-checkbox-group v-model="selectedVariableKeys">
              <el-row :gutter="20">
                <el-col
                  v-for="varItem in fixedVariables"
                  :key="varItem.key"
                  :span="8"
                  style="margin-bottom: 10px"
                >
                  <el-checkbox :label="varItem.key" :value="varItem.key">
                    {{ varItem.label }}
                  </el-checkbox>
                </el-col>
              </el-row>
            </el-checkbox-group>
            <el-button
              type="primary"
              size="small"
              style="margin-top: 10px"
              @click="insertSelectedVariables"
              :disabled="selectedVariableKeys.length === 0"
            >
              <el-icon><Plus /></el-icon>
              插入选中变量到模板内容
            </el-button>
            <div style="margin-top: 8px; font-size: 12px; color: #909399">
              提示：选择变量后点击按钮插入，或手动输入
              &#123;&#123;变量key&#125;&#125; 格式
            </div>
          </div>
        </el-form-item>
        <el-form-item label="模板内容" prop="content">
          <el-input
            ref="contentInputRef"
            v-model="templateForm.content"
            type="textarea"
            :rows="12"
            placeholder="输入模板内容，点击上方按钮插入变量，或手动输入 {{变量key}} 格式"
          />
        </el-form-item>
        <el-form-item label="已使用变量">
          <el-tag
            v-for="variable in extractedVariables"
            :key="variable"
            style="margin-right: 8px; margin-bottom: 4px"
          >
            {{ getVariableLabel(variable) }}
          </el-tag>
          <span v-if="extractedVariables.length === 0" class="text-muted"
            >暂无变量</span
          >
        </el-form-item>
        <el-form-item label="模板描述">
          <el-input
            v-model="templateForm.description"
            type="textarea"
            :rows="2"
            placeholder="可选"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showCreateDialog = false">取消</el-button>
        <el-button type="primary" @click="handleSaveTemplate" :loading="saving"
          >保存</el-button
        >
      </template>
    </el-dialog>

    <!-- Preview Dialog -->
    <el-dialog v-model="showPreviewDialog" title="模板预览" width="800px">
      <div class="preview-content">
        <h3>{{ previewTemplate?.name }}</h3>
        <el-divider />
        <div class="content-preview">{{ previewTemplate?.content }}</div>
      </div>
      <template #footer>
        <el-button @click="showPreviewDialog = false">关闭</el-button>
        <el-button type="primary" @click="handleGenerate(previewTemplate)"
          >使用此模板</el-button
        >
      </template>
    </el-dialog>

    <!-- Generate Document Dialog -->
    <el-dialog v-model="showGenerateDialog" title="生成文书" width="900px">
      <el-form :model="generateForm" label-width="120px">
        <el-form-item label="选择案件">
          <el-select
            v-model="generateForm.caseId"
            placeholder="请选择案件（可搜索案号、案由、法院）"
            style="width: 100%"
            filterable
            :filter-method="filterCases"
            @change="handleCaseChange"
            :loading="loadingCases"
            clearable
            class="case-select"
          >
            <el-option
              v-for="caseItem in filteredCases"
              :key="caseItem.id"
              :label="getCaseLabel(caseItem)"
              :value="caseItem.id"
              style="height: 84px"
            >
              <div
                style="
                  display: flex;
                  justify-content: space-between;
                  align-items: center;
                "
              >
                <div>
                  <div style="font-weight: 500">{{
                    caseItem.caseNumber ||
                    caseItem.internalNumber ||
                    "未命名案件"
                  }}</div>
                  <div style="font-size: 12px; color: #909399; margin-top: 4px">
                    {{ caseItem.caseCause }} | {{ caseItem.court }}
                  </div>
                </div>
                <el-tag
                  v-if="caseItem.status"
                  :type="getStatusType(caseItem.status)"
                  size="small"
                >
                  {{ getStatusText(caseItem.status) }}
                </el-tag>
              </div>
            </el-option>
          </el-select>
          <div
            v-if="cases.length === 0"
            style="color: #909399; font-size: 12px; margin-top: 4px"
          >
            暂无案件数据，请先在案件管理中创建案件
          </div>
        </el-form-item>

        <el-divider>变量预览</el-divider>

        <div
          v-if="currentTemplateVariables.length > 0"
          class="variable-preview"
        >
          <el-alert type="info" :closable="false" style="margin-bottom: 12px">
            <template #title>
              <span
                >已检测到
                {{ currentTemplateVariables.length }}
                个变量，选择案件后将自动填充</span
              >
            </template>
          </el-alert>
          <el-tag
            v-for="variable in currentTemplateVariables"
            :key="variable"
            style="margin-right: 8px; margin-bottom: 4px"
          >
            {{ getVariableLabel(variable) }}
          </el-tag>
        </div>
        <div v-else class="text-muted" style="margin-bottom: 12px">
          模板中未使用变量
        </div>

        <el-divider>文书预览</el-divider>

        <div class="generated-preview">
          <el-input
            v-model="generatedContent"
            type="textarea"
            :rows="15"
            placeholder="文书内容预览"
          />
        </div>

        <el-divider>诉讼主体信息</el-divider>
        <el-skeleton v-if="loadingParties" animated :rows="3" />
        <el-empty
          v-else-if="selectedCaseParties.length === 0"
          description="暂无诉讼主体"
        />
        <div v-else class="party-list">
          <div
            v-for="party in selectedCaseParties"
            :key="party.id"
            class="party-item"
          >
            <div class="party-name">名称：{{ party.name }}</div>
            <div class="party-meta">
              <span>主体身份：{{ party.partyType }}</span>
              <span>实体类型：{{ party.entityType }}</span>
            </div>
            <div v-if="party.legalRepresentative" class="party-field">
              法定代表人：{{ party.legalRepresentative }}
            </div>
            <div v-if="party.identifier" class="party-field">
              {{
                party.entityType === "企业" ? "统一社会信用代码:" : "身份证号:"
              }}{{ party.identifier }}
            </div>
            <div
              v-if="party.contactPhone || party.contactEmail"
              class="party-field"
            >
              联系方式：
              <template v-if="party.contactPhone">
                电话 {{ party.contactPhone }}
              </template>
              <template v-if="party.contactPhone && party.contactEmail"
                >，</template
              >
              <template v-if="party.contactEmail">
                邮箱 {{ party.contactEmail }}
              </template>
            </div>
            <div v-if="party.address" class="party-field">
              地址：{{ party.address }}
            </div>
          </div>
        </div>
      </el-form>
      <template #footer>
        <el-button @click="showGenerateDialog = false">取消</el-button>
        <el-button type="primary" @click="handleExport('word')"
          >导出为 Word</el-button
        >
        <el-button type="primary" @click="handleExport('pdf')"
          >导出为 PDF</el-button
        >
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted, nextTick } from "vue";
import {
  ElMessage,
  ElMessageBox,
  type FormInstance,
  type FormRules,
} from "element-plus";
import { Plus } from "@element-plus/icons-vue";
import { documentTemplateApi } from "@/api/documentTemplate";
import { caseApi } from "@/api/case";
import PageHeader from "@/components/common/PageHeader.vue";
import TableEmpty from "@/components/common/TableEmpty.vue";

// Document types
const documentTypes = [
  "起诉状",
  "答辩状",
  "上诉状",
  "申请书",
  "判决书",
  "裁定书",
  "调解书",
  "通知书",
  "其他",
];

// 固定变量定义
const fixedVariables = [
  { key: "原告主体信息", label: "原告主体信息" },
  { key: "被告主体信息", label: "被告主体信息" },
  { key: "受理法院名称", label: "受理法院名称" },
  { key: "日期", label: "日期" },
  { key: "申请人", label: "申请人" },
  { key: "案号", label: "案号" },
  { key: "案由", label: "案由" },
  { key: "第三人", label: "第三人" },
  { key: "实体类型", label: "实体类型" },
];

// 选中的变量key
const selectedVariableKeys = ref<string[]>([]);

// State
const loading = ref(false);
const saving = ref(false);
const loadingCases = ref(false);
const loadingParties = ref(false);
const templates = ref<any[]>([]);
const cases = ref<any[]>([]);
const filteredCases = ref<any[]>([]);
const filterType = ref("");
const showCreateDialog = ref(false);
const showPreviewDialog = ref(false);
const showGenerateDialog = ref(false);
const editingTemplate = ref<any>(null);
const previewTemplate = ref<any>(null);
const currentTemplate = ref<any>(null);
const selectedCaseParties = ref<any[]>([]);

// Forms
const templateForm = reactive({
  name: "",
  documentType: "",
  content: "",
  description: "",
});

const generateForm = reactive({
  caseId: null as number | null,
  variables: {} as Record<string, string>,
});

const contentInputRef = ref<any>(null);

const templateFormRef = ref<FormInstance>();

const validateTemplateName = (
  _rule: any,
  value: string,
  callback: (error?: Error) => void
) => {
  if (!value || !value.trim()) {
    callback(new Error("请输入模板名称"));
    return;
  }

  const trimmedValue = value.trim();
  const exists = templates.value.some(
    (item) =>
      item.name === trimmedValue &&
      (!editingTemplate.value || item.id !== editingTemplate.value.id)
  );

  if (exists) {
    callback(new Error("模板名称已存在，请使用其他名称"));
  } else {
    callback();
  }
};

const templateRules: FormRules = {
  name: [
    { required: true, message: "请输入模板名称", trigger: "blur" },
    { validator: validateTemplateName, trigger: ["blur", "change"] },
  ],
  documentType: [
    { required: true, message: "请选择文书类型", trigger: "change" },
  ],
  content: [{ required: true, message: "请输入模板内容", trigger: "blur" }],
};

// Computed & state for生成内容
const extractedVariables = computed(() => {
  const regex = /\{\{([^}]+)\}\}/g;
  const matches = templateForm.content.matchAll(regex);
  const variables = new Set<string>();
  for (const match of matches) {
    variables.add(match[1].trim());
  }
  return Array.from(variables);
});

const currentTemplateVariables = computed(() => {
  if (!currentTemplate.value) return [];
  const regex = /\{\{([^}]+)\}\}/g;
  const matches = currentTemplate.value.content.matchAll(regex);
  const variables = new Set<string>();
  for (const match of matches) {
    variables.add(match[1].trim());
  }
  return Array.from(variables);
});

// 文书预览内容，支持自动填充和用户手动编辑
const generatedContent = ref("");

const updateGeneratedContent = () => {
  if (!currentTemplate.value) {
    generatedContent.value = "";
    return;
  }

  let content = currentTemplate.value.content as string;
  for (const [key, value] of Object.entries(generateForm.variables)) {
    content = content.replace(
      new RegExp(`\\{\\{${key}\\}\\}`, "g"),
      value || `{{${key}}}`
    );
  }
  generatedContent.value = content;
};

// Methods
const loadTemplates = async () => {
  loading.value = true;
  try {
    const params = filterType.value
      ? { documentType: filterType.value }
      : undefined;
    const response = await documentTemplateApi.getTemplates(params);
    templates.value = response.data || [];
  } catch (error) {
    ElMessage.error("加载模板列表失败");
    console.error(error);
  } finally {
    loading.value = false;
  }
};

const loadCases = async () => {
  loadingCases.value = true;
  try {
    // 加载所有案件（使用较大的 pageSize）
    const response = await caseApi.getCases({ page: 1, pageSize: 1000 });
    // 后端返回格式：{ data: { cases: [...], pagination: {...} } }
    const rawCases = response.data?.cases || response.data?.list || [];

    // 转换字段名（后端使用下划线，前端使用驼峰）
    cases.value = rawCases.map((caseItem: any) => ({
      id: caseItem.id,
      caseNumber: caseItem.case_number || caseItem.caseNumber,
      internalNumber: caseItem.internal_number || caseItem.internalNumber,
      caseType: caseItem.case_type || caseItem.caseType,
      caseCause: caseItem.case_cause || caseItem.caseCause,
      court: caseItem.court,
      targetAmount: caseItem.target_amount || caseItem.targetAmount,
      filingDate: caseItem.filing_date || caseItem.filingDate,
      status: caseItem.status,
    }));

    // 初始化过滤后的案件列表
    filteredCases.value = cases.value;
  } catch (error) {
    console.error("加载案件列表失败", error);
    ElMessage.error("加载案件列表失败");
  } finally {
    loadingCases.value = false;
  }
};

// 案件过滤方法
const filterCases = (query: string) => {
  if (!query) {
    filteredCases.value = cases.value;
    return;
  }

  const lowerQuery = query.toLowerCase();
  filteredCases.value = cases.value.filter((caseItem: any) => {
    const caseNumber = (caseItem.caseNumber || "").toLowerCase();
    const internalNumber = (caseItem.internalNumber || "").toLowerCase();
    const caseCause = (caseItem.caseCause || "").toLowerCase();
    const court = (caseItem.court || "").toLowerCase();

    return (
      caseNumber.includes(lowerQuery) ||
      internalNumber.includes(lowerQuery) ||
      caseCause.includes(lowerQuery) ||
      court.includes(lowerQuery)
    );
  });
};

// 获取案件显示标签
const getCaseLabel = (caseItem: any) => {
  const number = caseItem.caseNumber || caseItem.internalNumber || "未命名案件";
  return `${number} - ${caseItem.caseCause || "无案由"}`;
};

// 获取状态类型
const getStatusType = (status: string) => {
  const statusMap: Record<string, string> = {
    active: "success",
    pending: "warning",
    closed: "info",
    archived: "",
  };
  return statusMap[status] || "";
};

// 获取状态文本
const getStatusText = (status: string) => {
  const statusMap: Record<string, string> = {
    active: "进行中",
    pending: "待处理",
    closed: "已结案",
    archived: "已归档",
  };
  return statusMap[status] || status;
};

const handlePreview = (template: any) => {
  previewTemplate.value = template;
  showPreviewDialog.value = true;
};

const handleGenerate = async (template: any) => {
  currentTemplate.value = template;
  generateForm.caseId = null;
  generateForm.variables = {};
  selectedCaseParties.value = [];
  // 初始化文书预览为当前模板原始内容
  generatedContent.value = template.content || "";
  showGenerateDialog.value = true;
  showPreviewDialog.value = false;

  // 确保案件列表已加载
  if (cases.value.length === 0) {
    await loadCases();
  }
};

// 格式化诉讼主体信息
const formatPartyInfo = (party: any) => {
  const parts: string[] = [];

  // 名称
  if (party.name) parts.push(`名称：${party.name}`);

  // // 实体类型
  // if (party.entityType) parts.push(`实体类型：${party.entityType}`);

  // 标识信息
  if (party.identifier)
    parts.push(
      `${party.entityType === "企业" ? "统一社会信用代码：" : "身份证号："}${
        party.identifier
      }`
    );

  // 法定代表人
  if (party.legalRepresentative)
    parts.push(`法定代表人：${party.legalRepresentative}`);

  // 联系方式
  const contacts: string[] = [];
  if (party.contactPhone) contacts.push(`电话：${party.contactPhone}`);
  if (party.contactEmail) contacts.push(`邮箱：${party.contactEmail}`);
  if (contacts.length > 0) parts.push(`联系方式：${contacts.join("，")}`);

  // 地址
  if (party.address) parts.push(`地址：${party.address}`);

  return parts.join("\n");
};

const handleCaseChange = async (caseId: number) => {
  if (!caseId) {
    generateForm.variables = {};
    selectedCaseParties.value = [];
    return;
  }

  try {
    const response = await caseApi.getCaseById(caseId);
    // 后端返回格式：{ data: { case: {...} } }
    const caseData = response.data?.case || response.data;

    // 转换字段名
    const normalizedCase = {
      caseNumber: caseData.case_number || caseData.caseNumber,
      internalNumber: caseData.internal_number || caseData.internalNumber,
      caseCause: caseData.case_cause || caseData.caseCause,
      court: caseData.court,
      targetAmount: caseData.target_amount || caseData.targetAmount,
      filingDate: caseData.filing_date || caseData.filingDate,
      caseType: caseData.case_type || caseData.caseType,
    };

    // 获取诉讼主体列表
    loadingParties.value = true;
    let parties: any[] = [];
    try {
      const partiesResponse = await caseApi.getCaseParties(caseId);
      const rawParties =
        partiesResponse.data?.parties ||
        partiesResponse.data?.data?.parties ||
        partiesResponse.data ||
        [];
      parties = rawParties.map((party: any) => ({
        id: party.id,
        name: party.name || party.organization_name || "未命名主体",
        partyType: party.party_type || party.partyType || "未知",
        entityType: party.entity_type || party.entityType || "未知",
        identifier:
          party.unified_credit_code ||
          party.id_number ||
          party.identifier ||
          "",
        contactPhone: party.contact_phone || party.contactPhone || "",
        contactEmail: party.contact_email || party.contactEmail || "",
        address: party.address || "",
        legalRepresentative:
          party.legal_representative || party.legalRepresentative || "",
      }));
      selectedCaseParties.value = parties;
    } catch (error) {
      console.error("加载诉讼主体失败", error);
      selectedCaseParties.value = [];
    } finally {
      loadingParties.value = false;
    }

    // 根据模板中使用的变量自动填充数据
    const variables: Record<string, string> = {};

    // 获取模板中使用的所有变量
    const templateVars = currentTemplateVariables.value;

    // 填充案号
    if (templateVars.includes("案号")) {
      variables["案号"] =
        normalizedCase.caseNumber || normalizedCase.internalNumber || "";
    }

    // 填充案由
    if (templateVars.includes("案由")) {
      variables["案由"] = normalizedCase.caseCause || "";
    }

    // 填充受理法院名称
    if (templateVars.includes("受理法院名称")) {
      variables["受理法院名称"] = normalizedCase.court || "";
    }

    // 填充日期（当前日期）
    if (templateVars.includes("日期")) {
      const now = new Date();
      variables["日期"] = now.toLocaleDateString("zh-CN", {
        year: "numeric",
        month: "long",
        day: "numeric",
      });
    }

    // 填充原告主体信息
    if (templateVars.includes("原告主体信息")) {
      const plaintiff = parties.find(
        (p) => p.partyType === "原告" || p.partyType === "plaintiff"
      );
      if (plaintiff) {
        variables["原告主体信息"] = formatPartyInfo(plaintiff);
      } else {
        variables["原告主体信息"] = "未找到原告主体信息";
      }
    }

    // 填充被告主体信息
    if (templateVars.includes("被告主体信息")) {
      const defendant = parties.find(
        (p) => p.partyType === "被告" || p.partyType === "defendant"
      );
      if (defendant) {
        variables["被告主体信息"] = formatPartyInfo(defendant);
      } else {
        variables["被告主体信息"] = "未找到被告信息";
      }
    }

    // 填充第三人
    if (templateVars.includes("第三人")) {
      const thirdParty = parties.find(
        (p) => p.partyType === "第三人" || p.partyType === "third_party"
      );
      if (thirdParty) {
        variables["第三人"] = formatPartyInfo(thirdParty);
      } else {
        variables["第三人"] = "未找到第三人信息";
      }
    }

    // 填充申请人（优先使用原告，如果没有则使用第一个主体）
    if (templateVars.includes("申请人")) {
      const applicant =
        parties.find(
          (p) => p.partyType === "申请人" || p.partyType === "applicant"
        ) ||
        parties.find(
          (p) => p.partyType === "原告" || p.partyType === "plaintiff"
        ) ||
        parties[0];
      if (applicant) {
        variables["申请人"] = applicant.name || "未知申请人";
      } else {
        variables["申请人"] = "未找到申请人信息";
      }
    }

    // 填充实体类型（从第一个主体获取，或从原告/被告获取）
    if (templateVars.includes("实体类型")) {
      const firstParty =
        parties.find(
          (p) => p.partyType === "原告" || p.partyType === "plaintiff"
        ) ||
        parties.find(
          (p) => p.partyType === "被告" || p.partyType === "defendant"
        ) ||
        parties[0];
      if (firstParty && firstParty.entityType) {
        variables["实体类型"] = firstParty.entityType;
      } else {
        variables["实体类型"] = "未知";
      }
    }

    // 更新变量（优先使用当前案件自动填充的数据，必要时可保留用户手动添加的其它键）
    generateForm.variables = {
      ...generateForm.variables,
      ...variables,
    };

    // 根据最新变量更新文书预览内容
    updateGeneratedContent();

    ElMessage.success("已自动填充变量数据");
  } catch (error) {
    console.error("加载案件详情失败", error);
    ElMessage.error("加载案件详情失败");
  }
};

const handleEdit = (template: any) => {
  editingTemplate.value = template;
  templateForm.name = template.name;
  templateForm.documentType = template.documentType;
  templateForm.content = template.content;
  templateForm.description = template.description || "";

  // 从模板内容中提取已使用的变量，并选中对应的固定变量
  const usedVars = extractedVariables.value;
  selectedVariableKeys.value = usedVars.filter((v) =>
    fixedVariables.some((fv) => fv.key === v)
  );

  showCreateDialog.value = true;
};

const handleDelete = async (template: any) => {
  try {
    await ElMessageBox.confirm("确定要删除该模板吗？", "提示", {
      confirmButtonText: "确定",
      cancelButtonText: "取消",
      type: "warning",
    });

    await documentTemplateApi.deleteTemplate(template.id);
    ElMessage.success("删除成功");
    loadTemplates();
  } catch (error: any) {
    if (error !== "cancel") {
      ElMessage.error("删除失败");
      console.error(error);
    }
  }
};

const handleSaveTemplate = async () => {
  if (!templateFormRef.value) return;

  await templateFormRef.value.validate(async (valid) => {
    if (!valid) return;

    saving.value = true;
    try {
      const data = {
        name: templateForm.name,
        documentType: templateForm.documentType,
        content: templateForm.content,
        description: templateForm.description,
        variables: extractedVariables.value,
      };

      // 调试：打印发送的数据
      console.log("保存模板数据:", data);

      if (editingTemplate.value) {
        await documentTemplateApi.updateTemplate(
          editingTemplate.value.id,
          data
        );
        ElMessage.success("更新成功");
      } else {
        const response = await documentTemplateApi.createTemplate(data);
        console.log("创建模板响应:", response);
        ElMessage.success("创建成功");
      }

      showCreateDialog.value = false;
      loadTemplates();
    } catch (error: any) {
      console.error("保存模板错误:", error);
      // 显示更详细的错误信息
      const errorMessage =
        error?.response?.data?.error?.message ||
        error?.response?.data?.error ||
        error?.response?.data?.message ||
        error?.message ||
        (editingTemplate.value ? "更新失败" : "创建失败");
      ElMessage.error(errorMessage);
    } finally {
      saving.value = false;
    }
  });
};

const handleExport = (format: "word" | "pdf") => {
  // Create a blob with the content
  const content = generatedContent.value;
  const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.setAttribute(
    "download",
    `${currentTemplate.value.name}.${format === "word" ? "doc" : "txt"}`
  );
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);

  ElMessage.success(`已导出为 ${format.toUpperCase()} 格式（简化版）`);
};

const insertTextAtCursor = (text: string) => {
  const textarea = contentInputRef.value?.textarea as
    | HTMLTextAreaElement
    | undefined;

  if (!textarea) {
    templateForm.content += (templateForm.content ? "\n" : "") + text;
    return;
  }

  const start = textarea.selectionStart ?? templateForm.content.length;
  const end = textarea.selectionEnd ?? start;

  const before = templateForm.content.substring(0, start);
  const after = templateForm.content.substring(end);

  const needsNewlineBefore = before && !before.endsWith("\n");
  const needsNewlineAfter = after && !after.startsWith("\n");

  const insertText =
    (needsNewlineBefore ? "\n" : "") + text + (needsNewlineAfter ? "\n" : "");

  templateForm.content = `${before}${insertText}${after}`;

  nextTick(() => {
    textarea.focus();
    const cursorPos = start + insertText.length;
    textarea.selectionStart = textarea.selectionEnd = cursorPos;
  });
};

// 插入选中的变量到模板内容
const insertSelectedVariables = () => {
  if (selectedVariableKeys.value.length === 0) {
    ElMessage.warning("请先选择要插入的变量");
    return;
  }

  const variablesToInsert = selectedVariableKeys.value
    .map((key) => `{{${key}}}`)
    .join("\n");

  insertTextAtCursor(variablesToInsert);

  // 插入后清空选中状态
  selectedVariableKeys.value = [];

  ElMessage.success("变量已插入到模板内容");
};

// 获取变量标签（用于显示）
const getVariableLabel = (variableKey: string) => {
  const variable = fixedVariables.find((v) => v.key === variableKey);
  return variable ? variable.label : variableKey;
};

const resetForm = () => {
  editingTemplate.value = null;
  templateForm.name = "";
  templateForm.documentType = "";
  templateForm.content = "";
  templateForm.description = "";
  selectedVariableKeys.value = [];
  templateFormRef.value?.resetFields();
};

onMounted(() => {
  loadTemplates();
  loadCases();
});
</script>

<style scoped>
.document-templates-container {
  padding: 20px;
}

.action-card {
  margin-bottom: 20px;
}

.template-card {
  margin-bottom: 20px;
  height: 220px;
  display: flex;
  flex-direction: column;
}

.template-header {
  margin-bottom: 10px;
}

.template-name {
  font-size: 16px;
  font-weight: bold;
  margin: 10px 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.template-desc {
  color: #666;
  font-size: 14px;
  margin-bottom: 15px;
  overflow: hidden;
  text-overflow: ellipsis;
  line-clamp: 2;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  flex: 1;
}

.case-select :deep(.el-select-dropdown__item) {
  height: 84px;
}

.template-actions {
  display: flex;
  justify-content: space-between;
  border-top: 1px solid #eee;
  padding-top: 10px;
}

.preview-content {
  padding: 20px;
}

.content-preview {
  white-space: pre-wrap;
  background: #f5f5f5;
  padding: 15px;
  border-radius: 4px;
  max-height: 400px;
  overflow-y: auto;
}

.generated-preview {
  margin-top: 10px;
}

.text-muted {
  color: #999;
}

.variable-selector {
  width: 100%;
}

.variable-preview {
  margin-bottom: 12px;
}

.party-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.party-item {
  border: 1px solid #e5e5e5;
  border-radius: 6px;
  padding: 10px 12px;
  background: #fafafa;
}

.party-name {
  font-weight: 600;
  margin-bottom: 4px;
}

.party-meta {
  font-size: 13px;
  color: #666;
  display: flex;
  gap: 16px;
  flex-wrap: wrap;
}

.party-field {
  font-size: 13px;
  color: #555;
  line-height: 20px;
}
</style>
