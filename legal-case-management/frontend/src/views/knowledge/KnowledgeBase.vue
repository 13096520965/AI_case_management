<template>
  <div class="knowledge-base-container">
    <el-card class="header-card">
      <div class="header-content">
        <h2>案例知识库</h2>
        <el-button type="primary" @click="handleCreate">
          <el-icon><Plus /></el-icon>
          添加案例
        </el-button>
      </div>
    </el-card>

    <!-- 搜索和分类 -->
    <el-card class="search-card">
      <el-form :model="searchForm" :inline="true">
        <el-form-item label="关键词">
          <el-input
            v-model="searchForm.keywords"
            placeholder="请输入关键词"
            clearable
            style="width: 200px"
          />
        </el-form-item>

        <el-form-item label="案由">
          <el-select
            v-model="searchForm.case_cause"
            placeholder="请选择案由"
            clearable
            style="width: 200px"
          >
            <el-option
              v-for="cause in caseCauseOptions"
              :key="cause"
              :label="cause"
              :value="cause"
            />
          </el-select>
        </el-form-item>

        <el-form-item label="争议焦点">
          <el-input
            v-model="searchForm.dispute_focus"
            placeholder="请输入争议焦点"
            clearable
            style="width: 200px"
          />
        </el-form-item>

        <el-form-item label="案件结果">
          <el-select
            v-model="searchForm.case_result"
            placeholder="请选择案件结果"
            clearable
            style="width: 150px"
          >
            <el-option label="胜诉" value="胜诉" />
            <el-option label="部分胜诉" value="部分胜诉" />
            <el-option label="败诉" value="败诉" />
            <el-option label="调解" value="调解" />
            <el-option label="撤诉" value="撤诉" />
          </el-select>
        </el-form-item>

        <el-form-item>
          <el-button type="primary" @click="handleSearch">
            <el-icon><Search /></el-icon>
            搜索
          </el-button>
          <el-button @click="handleReset">
            <el-icon><Refresh /></el-icon>
            重置
          </el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <!-- 案由分类统计 -->
    <el-card v-loading="statsLoading" class="stats-card">
      <h3>案由分类统计</h3>
      <div class="stats-list">
        <el-tag
          v-for="stat in statistics"
          :key="stat.case_cause"
          class="stat-tag"
          :type="searchForm.case_cause === stat.case_cause ? 'primary' : 'info'"
          @click="handleFilterByCause(stat.case_cause)"
        >
          {{ stat.case_cause }} ({{ stat.count }})
        </el-tag>
      </div>
    </el-card>

    <!-- 知识列表 -->
    <el-card v-loading="loading" class="list-card">
      <div class="knowledge-list">
        <div
          v-for="item in knowledgeList"
          :key="item.id"
          class="knowledge-item"
          @click="handleViewDetail(item)"
        >
          <div class="item-header">
            <h3>{{ item.case_cause }}</h3>
            <div class="item-actions">
              <el-tag v-if="item.case_result" type="success" size="small">
                {{ item.case_result }}
              </el-tag>
              <el-button type="primary" link @click.stop="handleEdit(item)">
                编辑
              </el-button>
              <el-button type="danger" link @click.stop="handleDelete(item)">
                删除
              </el-button>
            </div>
          </div>

          <div class="item-content">
            <div class="content-row">
              <span class="label">争议焦点：</span>
              <span class="value">{{ item.dispute_focus || '无' }}</span>
            </div>
            <div class="content-row">
              <span class="label">法律问题：</span>
              <span class="value">{{ item.legal_issues || '无' }}</span>
            </div>
            <div v-if="item.keywords" class="content-row">
              <span class="label">关键词：</span>
              <div class="tags">
                <el-tag
                  v-for="keyword in parseKeywords(item.keywords)"
                  :key="keyword"
                  size="small"
                  class="keyword-tag"
                >
                  {{ keyword }}
                </el-tag>
              </div>
            </div>
          </div>

          <div class="item-footer">
            <span class="footer-info"
              >创建时间：{{ formatDate(item.created_at) }}</span
            >
            <span v-if="item.win_rate_reference" class="footer-info">
              胜诉率参考：{{ item.win_rate_reference }}
            </span>
          </div>
        </div>

        <TableEmpty
          v-if="!loading && knowledgeList.length === 0"
          description="暂无案例知识"
        />
      </div>

      <!-- 分页 -->
      <div v-if="knowledgeList.length > 0" class="pagination">
        <el-pagination
          v-model:current-page="pagination.page"
          v-model:page-size="pagination.limit"
          :page-sizes="[10, 20, 50]"
          :total="pagination.total"
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="handleSearch"
          @current-change="handleSearch"
        />
      </div>
    </el-card>

    <!-- 详情对话框 -->
    <el-dialog
      v-model="detailDialogVisible"
      title="案例详情"
      width="900px"
      destroy-on-close
    >
      <div v-if="currentKnowledge" class="detail-content">
        <el-descriptions :column="2" border>
          <el-descriptions-item label="案由">
            {{ currentKnowledge.case_cause }}
          </el-descriptions-item>
          <el-descriptions-item label="案件结果">
            <el-tag v-if="currentKnowledge.case_result" type="success">
              {{ currentKnowledge.case_result }}
            </el-tag>
            <span v-else>-</span>
          </el-descriptions-item>
          <el-descriptions-item label="胜诉率参考" :span="2">
            {{ currentKnowledge.win_rate_reference || '-' }}
          </el-descriptions-item>
        </el-descriptions>

        <el-divider content-position="left">争议焦点</el-divider>
        <div class="detail-section">
          {{ currentKnowledge.dispute_focus || '无' }}
        </div>

        <el-divider content-position="left">法律问题</el-divider>
        <div class="detail-section">
          {{ currentKnowledge.legal_issues || '无' }}
        </div>

        <el-divider content-position="left">法律依据</el-divider>
        <div class="detail-section">
          {{ currentKnowledge.legal_basis || '无' }}
        </div>

        <el-divider content-position="left">关键证据</el-divider>
        <div class="detail-section">
          {{ currentKnowledge.key_evidence || '无' }}
        </div>

        <el-divider content-position="left">案例分析</el-divider>
        <div class="detail-section">
          {{ currentKnowledge.case_analysis || '无' }}
        </div>

        <el-divider content-position="left">实践意义</el-divider>
        <div class="detail-section">
          {{ currentKnowledge.practical_significance || '无' }}
        </div>

        <el-divider content-position="left">关键词</el-divider>
        <div class="detail-section">
          <el-tag
            v-for="keyword in parseKeywords(currentKnowledge.keywords)"
            :key="keyword"
            class="keyword-tag"
          >
            {{ keyword }}
          </el-tag>
          <span v-if="!currentKnowledge.keywords">无</span>
        </div>

        <el-divider content-position="left">标签</el-divider>
        <div class="detail-section">
          <el-tag
            v-for="tag in parseTags(currentKnowledge.tags)"
            :key="tag"
            type="success"
            class="keyword-tag"
          >
            {{ tag }}
          </el-tag>
          <span v-if="!currentKnowledge.tags">无</span>
        </div>

        <!-- 上传案例的识别内容 -->
        <template v-if="currentKnowledge.ocr_content">
          <el-divider content-position="left">上传案例识别内容</el-divider>
          <div class="detail-section ocr-content">
            {{ currentKnowledge.ocr_content }}
          </div>
        </template>
      </div>

      <template #footer>
        <el-button @click="detailDialogVisible = false">关闭</el-button>
        <el-button type="primary" @click="handleEditFromDetail">编辑</el-button>
      </template>
    </el-dialog>

    <!-- 创建/编辑对话框 -->
    <el-dialog
      v-model="formDialogVisible"
      :title="isEdit ? '编辑案例' : '添加案例'"
      width="800px"
      destroy-on-close
    >
      <el-form
        ref="formRef"
        :model="formData"
        :rules="formRules"
        label-width="120px"
      >
        <!-- 上传案例按钮 -->
        <el-form-item v-if="!isEdit" label="上传案例">
          <div class="upload-section">
            <el-upload
              ref="uploadRef"
              :auto-upload="false"
              :limit="1"
              :on-change="handleCaseFileChange"
              :on-remove="handleCaseFileRemove"
              :file-list="uploadFileList"
              accept=".pdf,.doc,.docx"
              :disabled="uploadingCase"
            >
              <el-button
                type="primary"
                :loading="uploadingCase"
                :disabled="hasUploadedFile || uploadingCase"
              >
                <el-icon v-if="!uploadingCase"><Upload /></el-icon>
                {{
                  uploadingCase
                    ? '识别中...'
                    : hasUploadedFile
                    ? '已上传'
                    : '选择文件'
                }}
              </el-button>
              <template #tip>
                <div class="el-upload__tip">
                  支持 PDF、Word 格式，上传后自动识别并填充表单（最多1个文件）
                </div>
              </template>
            </el-upload>
            <el-button
              v-if="ocrFullContent"
              link
              @click="ocrContentDialogVisible = true"
              class="view-ocr-btn"
            >
              <el-icon><View /></el-icon>
              查看全部识别内容
            </el-button>
          </div>
        </el-form-item>

        <el-form-item label="关联案件">
          <el-select
            v-model="formData.case_id"
            placeholder="请选择关联案件（可选）"
            clearable
            filterable
            style="width: 100%"
            :loading="caseListLoading"
            @focus="loadClosedCases"
            @change="handleCaseSelect"
            @clear="handleCaseClear"
          >
            <el-option
              v-for="caseItem in closedCaseList"
              :key="caseItem.id"
              :label="`${caseItem.case_number || caseItem.internal_number} - ${
                caseItem.case_cause || '无案由'
              }`"
              :value="caseItem.id"
            />
          </el-select>
        </el-form-item>

        <el-form-item label="案由" prop="case_cause">
          <el-input v-model="formData.case_cause" placeholder="请输入案由" />
        </el-form-item>

        <el-form-item label="争议焦点" prop="dispute_focus">
          <el-input
            v-model="formData.dispute_focus"
            type="textarea"
            :rows="3"
            placeholder="请输入争议焦点"
          />
        </el-form-item>

        <el-form-item label="法律问题">
          <el-input
            v-model="formData.legal_issues"
            type="textarea"
            :rows="3"
            placeholder="请输入法律问题"
          />
        </el-form-item>

        <el-form-item label="案件结果">
          <el-select
            v-model="formData.case_result"
            placeholder="请选择案件结果"
            style="width: 100%"
          >
            <el-option label="胜诉" value="胜诉" />
            <el-option label="部分胜诉" value="部分胜诉" />
            <el-option label="败诉" value="败诉" />
            <el-option label="调解" value="调解" />
            <el-option label="撤诉" value="撤诉" />
          </el-select>
        </el-form-item>

        <el-form-item label="关键证据">
          <el-input
            v-model="formData.key_evidence"
            type="textarea"
            :rows="3"
            placeholder="请输入关键证据"
          />
        </el-form-item>

        <el-form-item label="法律依据">
          <el-input
            v-model="formData.legal_basis"
            type="textarea"
            :rows="3"
            placeholder="请输入法律依据"
          />
        </el-form-item>

        <el-form-item label="案例分析">
          <el-input
            v-model="formData.case_analysis"
            type="textarea"
            :rows="4"
            placeholder="请输入案例分析"
          />
        </el-form-item>

        <el-form-item label="实践意义">
          <el-input
            v-model="formData.practical_significance"
            type="textarea"
            :rows="3"
            placeholder="请输入实践意义"
          />
        </el-form-item>

        <el-form-item label="关键词">
          <el-input
            v-model="formData.keywords"
            placeholder="多个关键词用逗号分隔"
          />
        </el-form-item>

        <el-form-item label="标签">
          <el-input v-model="formData.tags" placeholder="多个标签用逗号分隔" />
        </el-form-item>

        <el-form-item label="胜诉率参考">
          <el-input
            v-model="formData.win_rate_reference"
            placeholder="例如：70%"
          />
        </el-form-item>

        <!-- 编辑时显示识别内容（只读） -->
        <el-form-item v-if="isEdit && formData.ocr_content" label="识别内容">
          <div class="ocr-content-readonly">
            {{ formData.ocr_content }}
          </div>
        </el-form-item>
      </el-form>

      <template #footer>
        <el-button @click="formDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleSubmit" :loading="submitting">
          确定
        </el-button>
      </template>
    </el-dialog>

    <!-- OCR识别内容查看弹窗 -->
    <el-dialog
      v-model="ocrContentDialogVisible"
      title="全部识别内容"
      width="800px"
      destroy-on-close
    >
      <div class="ocr-content-dialog">
        {{ ocrFullContent }}
      </div>
      <template #footer>
        <el-button @click="ocrContentDialogVisible = false">关闭</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue';
import {
  ElMessage,
  ElMessageBox,
  type FormInstance,
  type FormRules,
} from 'element-plus';
import { Plus, Search, Refresh, Upload, View } from '@element-plus/icons-vue';
import { caseApi } from '@/api/case';
import { knowledgeApi } from '@/api/knowledge';
import { ocrApi } from '@/api/ocr';
import TableEmpty from '@/components/common/TableEmpty.vue';
import request from '@/api/request';
import axios from 'axios';

const loading = ref(false);
const uploadingCase = ref(false);
const uploadFileList = ref<any[]>([]);
const uploadRef = ref<any>(null);
const statsLoading = ref(false);
const submitting = ref(false);
const detailDialogVisible = ref(false);
const formDialogVisible = ref(false);
const isEdit = ref(false);
const knowledgeList = ref<any[]>([]);
const statistics = ref<any[]>([]);
const currentKnowledge = ref<any>(null);
const formRef = ref<FormInstance>();
const ocrFullContent = ref('');
const ocrContentDialogVisible = ref(false);
const closedCaseList = ref<any[]>([]);
const caseListLoading = ref(false);
const hasUploadedFile = ref(false);

const caseCauseOptions = [
  '买卖合同纠纷',
  '借款合同纠纷',
  '劳动争议',
  '房屋买卖合同纠纷',
  '租赁合同纠纷',
  '建设工程施工合同纠纷',
  '股权转让纠纷',
  '侵权责任纠纷',
  '婚姻家庭纠纷',
  '继承纠纷',
];

const searchForm = reactive({
  keywords: '',
  case_cause: '',
  dispute_focus: '',
  case_result: '',
});

const pagination = reactive({
  page: 1,
  limit: 10,
  total: 0,
});

const formData = reactive({
  id: undefined as number | undefined,
  case_id: undefined as number | string | undefined,
  case_cause: '',
  dispute_focus: '',
  legal_issues: '',
  case_result: '',
  key_evidence: '',
  legal_basis: '',
  case_analysis: '',
  practical_significance: '',
  keywords: '',
  tags: '',
  win_rate_reference: '',
  ocr_content: '',
});

const formRules: FormRules = {
  case_cause: [{ required: true, message: '请输入案由', trigger: 'blur' }],
  dispute_focus: [
    { required: true, message: '请输入争议焦点', trigger: 'blur' },
  ],
};

const parseKeywords = (keywords: string) => {
  if (!keywords) return [];
  return keywords
    .split(',')
    .map((k) => k.trim())
    .filter((k) => k);
};

const parseTags = (tags: string) => {
  if (!tags) return [];
  return tags
    .split(',')
    .map((t) => t.trim())
    .filter((t) => t);
};

const formatDate = (dateStr: string) => {
  if (!dateStr) return '-';
  return new Date(dateStr).toLocaleDateString('zh-CN');
};

const loadKnowledgeList = async () => {
  try {
    loading.value = true;

    // 对搜索项进行 trim() 处理
    const params = {
      page: pagination.page,
      limit: pagination.limit,
      keywords: searchForm.keywords?.trim() || '',
      case_cause: searchForm.case_cause,
      dispute_focus: searchForm.dispute_focus?.trim() || '',
      case_result: searchForm.case_result,
    };

    const response = await knowledgeApi.getList(params);
    knowledgeList.value = response.data.knowledge || [];
    pagination.total = response.data.pagination?.total || 0;
  } catch (error: any) {
    ElMessage.error(error.response?.data?.error?.message || '加载知识库失败');
  } finally {
    loading.value = false;
  }
};

const loadStatistics = async () => {
  try {
    statsLoading.value = true;
    const response = await knowledgeApi.getList({ limit: 1000 });

    // 手动统计案由分类
    const causeMap = new Map<string, number>();
    const knowledge = response.data.knowledge || [];

    knowledge.forEach((item: any) => {
      const cause = item.case_cause;
      causeMap.set(cause, (causeMap.get(cause) || 0) + 1);
    });

    statistics.value = Array.from(causeMap.entries())
      .map(([case_cause, count]) => ({ case_cause, count }))
      .sort((a, b) => b.count - a.count);
  } catch (error: any) {
    console.error('加载统计数据失败:', error);
  } finally {
    statsLoading.value = false;
  }
};

const handleSearch = () => {
  pagination.page = 1;
  loadKnowledgeList();
};

const handleReset = () => {
  Object.assign(searchForm, {
    keywords: '',
    case_cause: '',
    dispute_focus: '',
    case_result: '',
  });
  handleSearch();
};

const handleFilterByCause = (cause: string) => {
  searchForm.case_cause = searchForm.case_cause === cause ? '' : cause;
  handleSearch();
};

const handleViewDetail = (item: any) => {
  currentKnowledge.value = item;
  detailDialogVisible.value = true;
};

const handleCreate = () => {
  isEdit.value = false;
  resetForm();
  formDialogVisible.value = true;
};

const handleEdit = (item: any) => {
  isEdit.value = true;
  Object.assign(formData, item);
  formDialogVisible.value = true;
};

const handleEditFromDetail = () => {
  detailDialogVisible.value = false;
  handleEdit(currentKnowledge.value);
};

const handleDelete = async (item: any) => {
  try {
    await ElMessageBox.confirm('确定要删除这条案例知识吗？', '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning',
    });

    await knowledgeApi.delete(item.id);
    ElMessage.success('删除成功');
    await loadKnowledgeList();
    await loadStatistics();
  } catch (error: any) {
    if (error !== 'cancel') {
      ElMessage.error(error.response?.data?.error?.message || '删除失败');
    }
  }
};

const handleSubmit = async () => {
  if (!formRef.value) return;

  await formRef.value.validate(async (valid) => {
    if (!valid) return;

    try {
      submitting.value = true;

      // 处理案件ID：如果选择"暂不关联已有案件"，则设为undefined
      const submitData = { ...formData };
      if (submitData.case_id === 'none' || submitData.case_id === '') {
        submitData.case_id = undefined;
      }

      if (isEdit.value && formData.id) {
        await knowledgeApi.update(formData.id, submitData);
        ElMessage.success('更新成功');
      } else {
        await knowledgeApi.create(submitData);
        ElMessage.success('创建成功');
      }

      formDialogVisible.value = false;
      await loadKnowledgeList();
      await loadStatistics();
    } catch (error: any) {
      ElMessage.error(error.response?.data?.error?.message || '操作失败');
    } finally {
      submitting.value = false;
    }
  });
};

const resetForm = () => {
  Object.assign(formData, {
    id: undefined,
    case_id: undefined,
    case_cause: '',
    dispute_focus: '',
    legal_issues: '',
    case_result: '',
    key_evidence: '',
    legal_basis: '',
    case_analysis: '',
    practical_significance: '',
    keywords: '',
    tags: '',
    win_rate_reference: '',
    ocr_content: '',
  });
  uploadFileList.value = [];
  ocrFullContent.value = '';
  hasUploadedFile.value = false;
};

// 加载已结案/已归档的案件列表
const loadClosedCases = async () => {
  if (closedCaseList.value.length > 0) return; // 已加载过则不重复加载

  try {
    caseListLoading.value = true;
    // 获取已结案的案件
    const closedResponse = await caseApi.getCases({
      status: '已结案',
      pageSize: 500,
    });
    const closedCases =
      closedResponse.data?.cases || closedResponse.data?.list || [];

    // 获取已归档的案件
    const archivedResponse = await caseApi.getCases({
      status: '已归档',
      pageSize: 500,
    });
    const archivedCases =
      archivedResponse.data?.cases || archivedResponse.data?.list || [];

    // 合并并去重
    const allCases = [...closedCases, ...archivedCases];
    const uniqueCases = allCases.filter(
      (item, index, self) => index === self.findIndex((t) => t.id === item.id)
    );

    closedCaseList.value = uniqueCases;
  } catch (error) {
    console.error('加载案件列表失败:', error);
  } finally {
    caseListLoading.value = false;
  }
};

// 选择关联案件时自动填充表单
const handleCaseSelect = (caseId: number | string | undefined) => {
  if (!caseId) return;
  
  const selectedCase = closedCaseList.value.find((c) => c.id === caseId);
  if (selectedCase) {
    // 用案件信息填充表单
    if (selectedCase.case_cause) formData.case_cause = selectedCase.case_cause;
    if (selectedCase.case_result) formData.case_result = selectedCase.case_result;
    // 可以根据需要填充更多字段
  }
};

// 清除关联案件时清空表单
const handleCaseClear = () => {
  // 清空表单内容（保留case_id为undefined）
  formData.case_cause = '';
  formData.dispute_focus = '';
  formData.legal_issues = '';
  formData.case_result = '';
  formData.key_evidence = '';
  formData.legal_basis = '';
  formData.case_analysis = '';
  formData.practical_significance = '';
  formData.keywords = '';
  formData.tags = '';
  formData.win_rate_reference = '';
};

/**
 * 轮询查询 OCR 结果
 */
const pollOCRResult = async (
  fileId: string,
  maxAttempts = 30,
  interval = 2000
): Promise<string> => {
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    try {
      const response = await ocrApi.query([fileId]);

      if (response.success && response.data && response.data.length > 0) {
        const fileData = response.data[0];
        // 如果已经有 fileContent，说明解析完成
        if (fileData.fileContent) {
          return fileData.fileContent;
        }
      }

      // 如果还没完成，等待后继续轮询
      if (attempt < maxAttempts - 1) {
        await new Promise((resolve) => setTimeout(resolve, interval));
      }
    } catch (error) {
      console.error('查询 OCR 结果失败:', error);
      // 继续重试
      if (attempt < maxAttempts - 1) {
        await new Promise((resolve) => setTimeout(resolve, interval));
      }
    }
  }

  throw new Error('OCR 解析超时，请稍后重试');
};

/**
 * 从 OCR 文本中提取案例知识字段
 */
const extractKnowledgeFromText = (text: string) => {
  const fields: any = {
    case_cause: '',
    dispute_focus: '',
    legal_issues: '',
    case_result: '',
    key_evidence: '',
    legal_basis: '',
    case_analysis: '',
    practical_significance: '',
    keywords: '',
    tags: '',
    win_rate_reference: '',
  };

  // 提取案由
  const caseCauseMatch = text.match(/案由[：:]\s*([^\n]+)/);
  if (caseCauseMatch) {
    fields.case_cause = caseCauseMatch[1].trim();
  } else {
    // 尝试从文本中识别常见案由
    if (text.includes('买卖合同')) fields.case_cause = '买卖合同纠纷';
    else if (text.includes('借款') || text.includes('借贷'))
      fields.case_cause = '借款合同纠纷';
    else if (text.includes('劳动') || text.includes('工资'))
      fields.case_cause = '劳动争议';
    else if (text.includes('房屋') && text.includes('买卖'))
      fields.case_cause = '房屋买卖合同纠纷';
    else if (text.includes('租赁')) fields.case_cause = '租赁合同纠纷';
    else if (text.includes('建设工程'))
      fields.case_cause = '建设工程施工合同纠纷';
    else if (text.includes('股权')) fields.case_cause = '股权转让纠纷';
    else if (text.includes('侵权')) fields.case_cause = '侵权责任纠纷';
    else if (text.includes('离婚') || text.includes('婚姻'))
      fields.case_cause = '婚姻家庭纠纷';
    else if (text.includes('继承') || text.includes('遗产'))
      fields.case_cause = '继承纠纷';
  }

  // 提取争议焦点
  const disputeMatch = text.match(
    /争议焦点[：:]\s*([\s\S]*?)(?=法律问题|法律依据|判决|裁定|$)/
  );
  if (disputeMatch) {
    fields.dispute_focus = disputeMatch[1].trim().substring(0, 500);
  }

  // 提取法律问题
  const legalIssuesMatch = text.match(
    /法律问题[：:]\s*([\s\S]*?)(?=法律依据|判决|裁定|$)/
  );
  if (legalIssuesMatch) {
    fields.legal_issues = legalIssuesMatch[1].trim().substring(0, 500);
  }

  // 提取案件结果
  if (text.includes('胜诉') || text.includes('支持原告')) {
    fields.case_result = '胜诉';
  } else if (text.includes('部分支持') || text.includes('部分胜诉')) {
    fields.case_result = '部分胜诉';
  } else if (text.includes('败诉') || text.includes('驳回')) {
    fields.case_result = '败诉';
  } else if (text.includes('调解')) {
    fields.case_result = '调解';
  } else if (text.includes('撤诉')) {
    fields.case_result = '撤诉';
  }

  // 提取关键证据
  const evidenceMatch = text.match(
    /(?:关键证据|主要证据|证据)[：:]\s*([\s\S]*?)(?=法律依据|判决|裁定|$)/
  );
  if (evidenceMatch) {
    fields.key_evidence = evidenceMatch[1].trim().substring(0, 500);
  }

  // 提取法律依据
  const legalBasisMatch = text.match(
    /(?:法律依据|依据|适用法律)[：:]\s*([\s\S]*?)(?=判决|裁定|$)/
  );
  if (legalBasisMatch) {
    fields.legal_basis = legalBasisMatch[1].trim().substring(0, 500);
  }

  // 提取关键词（从案由中提取）
  if (fields.case_cause) {
    fields.keywords = fields.case_cause.replace('纠纷', '');
  }

  return fields;
};

// 处理案例文件上传
const handleCaseFileChange = async (file: any) => {
  uploadingCase.value = true;

  try {
    // 1. 获取上传签名
    ElMessage.info('正在上传文件...');
    const signResponse = await request.post(
      'https://x-fat.zhixinzg.com/code-app/file/getUploadSign',
      {
        fileName: file.name,
        contentType: file.raw.type,
        openFlag: '1',
      }
    );

    const { serviceUrl, uploadHeaders, fileUrl } = signResponse.data ?? {};

    if (!serviceUrl || !fileUrl) {
      throw new Error('获取上传签名失败');
    }

    // 2. 上传文件到OSS
    const reader = new FileReader();
    reader.readAsArrayBuffer(file.raw as Blob);

    reader.onload = async (e) => {
      try {
        const fileData = e.target?.result;

        await axios({
          url: serviceUrl,
          method: 'put',
          data: fileData,
          headers: {
            ...(uploadHeaders || {}),
            'Content-Type': file.raw.type,
          },
        });

        ElMessage.success('文件上传成功，开始识别...');

        // 3. 调用 OCR parse 接口
        const parseResponse = await ocrApi.batchParse([fileUrl]);

        if (
          !parseResponse.success ||
          !parseResponse.data ||
          parseResponse.data.length === 0
        ) {
          throw new Error('提交 OCR 解析失败');
        }

        const fileId = parseResponse.data[0];
        ElMessage.info('正在识别中，请稍候...');

        // 4. 轮询查询 OCR 结果
        const fileContent = await pollOCRResult(fileId);

        // 5. 保存完整的OCR内容
        ocrFullContent.value = fileContent;
        formData.ocr_content = fileContent;

        // 6. 从 OCR 文本中提取字段
        const extractedFields = extractKnowledgeFromText(fileContent);

        // 7. 用解析结果填充表单
        if (extractedFields.case_cause)
          formData.case_cause = extractedFields.case_cause;
        if (extractedFields.dispute_focus)
          formData.dispute_focus = extractedFields.dispute_focus;
        if (extractedFields.legal_issues)
          formData.legal_issues = extractedFields.legal_issues;
        if (extractedFields.case_result)
          formData.case_result = extractedFields.case_result;
        if (extractedFields.key_evidence)
          formData.key_evidence = extractedFields.key_evidence;
        if (extractedFields.legal_basis)
          formData.legal_basis = extractedFields.legal_basis;
        if (extractedFields.case_analysis)
          formData.case_analysis = extractedFields.case_analysis;
        if (extractedFields.practical_significance)
          formData.practical_significance =
            extractedFields.practical_significance;
        if (extractedFields.keywords)
          formData.keywords = extractedFields.keywords;
        if (extractedFields.tags) formData.tags = extractedFields.tags;
        if (extractedFields.win_rate_reference)
          formData.win_rate_reference = extractedFields.win_rate_reference;

        ElMessage.success('案例文件识别成功，已自动填充表单');
        uploadingCase.value = false;
        hasUploadedFile.value = true;
      } catch (parseError: any) {
        console.error('解析案例文件失败:', parseError);
        ElMessage.warning(
          parseError.message || '文件上传成功，但自动识别失败，请手动填写表单'
        );
        uploadingCase.value = false;
        hasUploadedFile.value = true;
      }
    };

    reader.onerror = () => {
      ElMessage.error('文件读取失败');
      uploadingCase.value = false;
    };
  } catch (error: any) {
    console.error('上传失败:', error);
    ElMessage.error(error.message || '文件上传失败');
    uploadingCase.value = false;
    uploadFileList.value = [];
    hasUploadedFile.value = false;
  }
};

// 处理文件移除 - 清空表单内容和识别内容
const handleCaseFileRemove = () => {
  uploadFileList.value = [];
  hasUploadedFile.value = false;
  ocrFullContent.value = '';
  // 清空表单内容
  Object.assign(formData, {
    case_id: undefined,
    case_cause: '',
    dispute_focus: '',
    legal_issues: '',
    case_result: '',
    key_evidence: '',
    legal_basis: '',
    case_analysis: '',
    practical_significance: '',
    keywords: '',
    tags: '',
    win_rate_reference: '',
    ocr_content: '',
  });
};

onMounted(async () => {
  await loadKnowledgeList();
  await loadStatistics();
});
</script>

<style scoped>
.knowledge-base-container {
  padding: 20px;
}

.header-card {
  margin-bottom: 20px;
}

.header-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.header-content h2 {
  margin: 0;
  font-size: 20px;
  font-weight: 600;
}

.search-card {
  margin-bottom: 20px;
}

.stats-card {
  margin-bottom: 20px;
}

.stats-card h3 {
  margin: 0 0 15px 0;
  font-size: 16px;
  font-weight: 600;
}

.stats-list {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.stat-tag {
  cursor: pointer;
  transition: all 0.3s;
}

.stat-tag:hover {
  transform: translateY(-2px);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.list-card {
  margin-bottom: 20px;
}

.knowledge-list {
  min-height: 400px;
}

.knowledge-item {
  padding: 20px;
  margin-bottom: 15px;
  border: 1px solid #e4e7ed;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.3s;
}

.knowledge-item:hover {
  border-color: #409eff;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
}

.item-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
}

.item-header h3 {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
  color: #303133;
}

.item-actions {
  display: flex;
  align-items: center;
  gap: 10px;
}

.item-content {
  margin-bottom: 15px;
}

.content-row {
  display: flex;
  margin-bottom: 10px;
  line-height: 1.6;
}

.content-row .label {
  flex-shrink: 0;
  width: 100px;
  color: #909399;
  font-size: 14px;
}

.content-row .value {
  flex: 1;
  color: #606266;
  font-size: 14px;
}

.tags {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.keyword-tag {
  margin-right: 8px;
  margin-bottom: 8px;
}

.item-footer {
  display: flex;
  justify-content: space-between;
  padding-top: 10px;
  border-top: 1px solid #f0f0f0;
}

.footer-info {
  font-size: 12px;
  color: #909399;
}

.pagination {
  margin-top: 20px;
  display: flex;
  justify-content: flex-end;
}

.detail-content {
  max-height: 600px;
  overflow-y: auto;
}

.detail-section {
  padding: 15px;
  background-color: #f5f7fa;
  border-radius: 4px;
  line-height: 1.8;
  white-space: pre-wrap;
  min-height: 60px;
}

.detail-section.ocr-content {
  max-height: 300px;
  overflow-y: auto;
  font-size: 13px;
  color: #606266;
}

.upload-section {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  /* gap: 15px; */
  flex-wrap: wrap;
}

.view-ocr-btn {
  margin-top: 8px;
  color: #409eff;
}

.ocr-content-dialog {
  max-height: 500px;
  overflow-y: auto;
  padding: 15px;
  background-color: #f5f7fa;
  border-radius: 4px;
  line-height: 1.8;
  white-space: pre-wrap;
  font-size: 14px;
}

.ocr-content-readonly {
  padding: 15px;
  background-color: #f5f7fa;
  border-radius: 4px;
  line-height: 1.8;
  white-space: pre-wrap;
  max-height: 200px;
  overflow-y: auto;
  font-size: 13px;
  color: #606266;
}
</style>
