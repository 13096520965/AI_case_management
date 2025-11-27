<template>
  <div class="document-ocr-container">
    <PageHeader
      title="文书识别"
      subtitle="上传文书文件，自动识别并提取关键信息"
    />

    <!-- Upload Section -->
    <el-card class="upload-card">
      <h3>上传文书</h3>
      <el-upload
        ref="uploadRef"
        class="upload-area"
        drag
        :auto-upload="false"
        :limit="1"
        :on-change="handleFileChange"
        :on-remove="handleFileRemove"
        accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
      >
        <el-icon class="el-icon--upload"><UploadFilled /></el-icon>
        <div class="el-upload__text"> 将文件拖到此处，或<em>点击上传</em> </div>
        <template #tip>
          <div class="el-upload__tip">
            支持 PDF、图片、Word 格式，文件大小不超过 50MB
          </div>
        </template>
      </el-upload>
      <div class="upload-actions" v-if="uploadedFile">
        <el-button
          type="primary"
          @click="handleRecognize"
          :loading="recognizing"
        >
          <el-icon><View /></el-icon>
          开始识别
        </el-button>
        <el-button @click="handleClear">清除</el-button>
      </div>
    </el-card>

    <!-- Recognition Result -->
    <el-card
      v-if="recognitionResult"
      class="result-card"
      v-loading="recognizing"
    >
      <div class="result-header">
        <h3>识别结果</h3>
        <el-tag
          :type="recognitionResult.confidence > 0.8 ? 'success' : 'warning'"
        >
          置信度: {{ (recognitionResult.confidence * 100).toFixed(1) }}%
        </el-tag>
      </div>

      <el-tabs v-model="activeTab">
        <!-- Extracted Fields -->
        <el-tab-pane label="提取字段" name="fields">
          <el-form
            :model="extractedData"
            label-width="120px"
            class="extracted-form"
          >
            <el-row :gutter="20">
              <el-col :span="12">
                <el-form-item label="文书类型">
                  <el-input v-model="extractedData.documentType" />
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item label="案号">
                  <el-input v-model="extractedData.caseNumber" />
                </el-form-item>
              </el-col>
            </el-row>

            <el-row :gutter="20">
              <el-col :span="12">
                <el-form-item label="案由">
                  <el-input v-model="extractedData.caseCause" />
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item label="法院">
                  <el-input v-model="extractedData.court" />
                </el-form-item>
              </el-col>
            </el-row>

            <el-row :gutter="20">
              <el-col :span="12">
                <el-form-item label="原告">
                  <el-input v-model="extractedData.plaintiff" />
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item label="被告">
                  <el-input v-model="extractedData.defendant" />
                </el-form-item>
              </el-col>
            </el-row>

            <el-row :gutter="20">
              <el-col :span="12">
                <el-form-item label="标的额">
                  <el-input v-model="extractedData.targetAmount" />
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item label="立案日期">
                  <el-input v-model="extractedData.filingDate" />
                </el-form-item>
              </el-col>
            </el-row>

            <el-form-item label="案情摘要">
              <el-input
                v-model="extractedData.summary"
                type="textarea"
                :rows="4"
              />
            </el-form-item>

            <el-form-item label="诉讼请求">
              <el-input
                v-model="extractedData.claims"
                type="textarea"
                :rows="3"
              />
            </el-form-item>
          </el-form>

          <el-alert
            title="提示"
            type="info"
            :closable="false"
            style="margin-top: 20px"
          >
            识别结果可能存在误差，请仔细核对并手动修正
          </el-alert>
        </el-tab-pane>

        <!-- Full Text -->
        <el-tab-pane label="全文内容" name="fulltext">
          <el-input
            v-model="recognitionResult.fullText"
            type="textarea"
            :rows="20"
            placeholder="识别的完整文本内容"
          />
        </el-tab-pane>
      </el-tabs>

      <!-- Actions -->
      <div class="result-actions">
        <el-button type="primary" @click="handleFillToCase">
          <el-icon><DocumentAdd /></el-icon>
          一键填充到案件表单
        </el-button>
        <el-button @click="handleSaveAsDocument">
          <el-icon><Document /></el-icon>
          保存为文书
        </el-button>
        <el-button @click="handleExportText">
          <el-icon><Download /></el-icon>
          导出文本
        </el-button>
      </div>
    </el-card>

    <!-- Fill to Case Dialog -->
    <el-dialog v-model="showFillDialog" title="填充到案件" width="600px">
      <el-form label-width="100px">
        <el-form-item label="选择操作">
          <el-radio-group v-model="fillAction">
            <el-radio value="new">创建新案件</el-radio>
            <el-radio value="existing">填充到现有案件</el-radio>
          </el-radio-group>
        </el-form-item>

        <el-form-item v-if="fillAction === 'existing'" label="选择案件">
          <el-select
            v-model="selectedCaseId"
            placeholder="请选择案件"
            style="width: 100%"
            filterable
          >
            <el-option
              v-for="caseItem in cases"
              :key="caseItem.id"
              :label="`${
                caseItem.caseNumber ||
                caseItem.case_number ||
                caseItem.internal_number ||
                '未命名案件'
              } - ${caseItem.caseCause || caseItem.case_cause || '无案由'}`"
              :value="caseItem.id"
            />
          </el-select>
        </el-form-item>
      </el-form>

      <template #footer>
        <el-button @click="showFillDialog = false">取消</el-button>
        <el-button type="primary" @click="handleConfirmFill">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive } from "vue";
import { useRouter } from "vue-router";
import { ElMessage } from "element-plus";
import {
  UploadFilled,
  View,
  DocumentAdd,
  Document,
  Download,
} from "@element-plus/icons-vue";
import { caseApi } from "@/api/case";
import { documentApi } from "@/api/document";
import { ocrApi } from "@/api/ocr";
import request from "@/api/request";
import axios from "axios";
import PageHeader from "@/components/common/PageHeader.vue";

const router = useRouter();

// State
const recognizing = ref(false);
const uploadedFile = ref<File | null>(null);
const recognitionResult = ref<any>(null);
const activeTab = ref("fields");
const showFillDialog = ref(false);
const fillAction = ref("new");
const selectedCaseId = ref<number | null>(null);
const cases = ref<any[]>([]);
const uploadRef = ref<any>(null);

// Extracted data
const extractedData = reactive({
  documentType: "",
  caseNumber: "",
  caseCause: "",
  court: "",
  plaintiff: "",
  defendant: "",
  targetAmount: "",
  filingDate: "",
  summary: "",
  claims: "",
});

// Methods
const handleFileChange = (file: any) => {
  uploadedFile.value = file.raw;
};

const handleFileRemove = () => {
  uploadedFile.value = null;
  recognitionResult.value = null;
  // 清除 el-upload 组件的文件列表
  if (uploadRef.value) {
    uploadRef.value.clearFiles();
  }
};

const handleClear = () => {
  uploadedFile.value = null;
  recognitionResult.value = null;
  // 清除 el-upload 组件的文件列表
  if (uploadRef.value) {
    uploadRef.value.clearFiles();
  }
  // 重置提取的数据
  Object.assign(extractedData, {
    documentType: "",
    caseNumber: "",
    caseCause: "",
    court: "",
    plaintiff: "",
    defendant: "",
    targetAmount: "",
    filingDate: "",
    summary: "",
    claims: "",
  });
};

/**
 * 上传文件到 OSS 并获取 URL
 */
const uploadFileToOSS = async (file: File): Promise<string> => {
  try {
    // 1. 获取上传签名
    const signResponse = await request.post(
      "https://x-fat.zhixinzg.com/code-app/file/getUploadSign",
      {
        fileName: file.name,
        contentType: file.type,
        openFlag: "1",
      }
    );

    const { serviceUrl, uploadHeaders, fileUrl } = signResponse.data ?? {};

    if (!serviceUrl || !fileUrl) {
      throw new Error("获取上传签名失败");
    }

    // 2. 读取文件并上传到 OSS
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsArrayBuffer(file);
      reader.onload = async (e) => {
        try {
          const fileData = e.target?.result;
          await axios({
            url: serviceUrl,
            method: "put",
            data: fileData,
            headers: {
              ...(uploadHeaders || {}),
              "Content-Type": file.type,
            },
          });
          resolve(fileUrl);
        } catch (error) {
          reject(error);
        }
      };
      reader.onerror = reject;
    });
  } catch (error) {
    console.error("文件上传失败:", error);
    throw error;
  }
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
      console.error("查询 OCR 结果失败:", error);
      // 继续重试
      if (attempt < maxAttempts - 1) {
        await new Promise((resolve) => setTimeout(resolve, interval));
      }
    }
  }

  throw new Error("OCR 解析超时，请稍后重试");
};

/**
 * 从 OCR 文本中提取字段信息
 */
const extractFieldsFromText = (text: string) => {
  const fields: any = {
    documentType: "",
    caseNumber: "",
    caseCause: "",
    court: "",
    plaintiff: "",
    defendant: "",
    targetAmount: "",
    filingDate: "",
    summary: "",
    claims: "",
  };

  // 提取文书类型
  if (text.includes("起诉状")) fields.documentType = "起诉状";
  else if (text.includes("答辩状")) fields.documentType = "答辩状";
  else if (text.includes("判决书")) fields.documentType = "判决书";
  else if (text.includes("调解书")) fields.documentType = "调解书";

  // 提取案由
  const caseCauseMatch = text.match(/案由[：:]\s*([^\n]+)/);
  if (caseCauseMatch) fields.caseCause = caseCauseMatch[1].trim();

  // 提取法院
  const courtMatch = text.match(/([^，,。.\n]+人民法院)/);
  if (courtMatch) fields.court = courtMatch[1];

  // 提取原告
  const plaintiffMatch = text.match(/原告[：:]\s*([^\n，,。]+)/);
  if (plaintiffMatch) fields.plaintiff = plaintiffMatch[1].trim();

  // 提取被告
  const defendantMatch = text.match(/被告[：:]\s*([^\n，,。]+)/);
  if (defendantMatch) fields.defendant = defendantMatch[1].trim();

  // 提取标的额（金额）
  const amountMatch = text.match(/(\d+(?:\.\d+)?)\s*元/);
  if (amountMatch) fields.targetAmount = amountMatch[1];

  // 提取日期
  const dateMatch = text.match(/(\d{4}[-年]\d{1,2}[-月]\d{1,2}[日]?)/);
  if (dateMatch) {
    let dateStr = dateMatch[1];
    dateStr = dateStr
      .replace(/年/g, "-")
      .replace(/月/g, "-")
      .replace(/日/g, "");
    fields.filingDate = dateStr;
  }

  // 提取诉讼请求
  const claimsMatch = text.match(
    /诉讼请求[：:]\s*([\s\S]*?)(?=事实与理由|此致|$)/
  );
  if (claimsMatch) fields.claims = claimsMatch[1].trim();

  // 提取摘要（事实与理由的前一部分）
  const summaryMatch = text.match(/事实与理由[：:]\s*([\s\S]{0,200})/);
  if (summaryMatch) {
    fields.summary = summaryMatch[1].trim().substring(0, 200);
  }

  return fields;
};

const handleRecognize = async () => {
  if (!uploadedFile.value) {
    ElMessage.warning("请先上传文件");
    return;
  }

  recognizing.value = true;

  try {
    // 1. 上传文件到 OSS 获取 URL
    ElMessage.info("正在上传文件...");
    const fileUrl = await uploadFileToOSS(uploadedFile.value);
    ElMessage.success("文件上传成功，开始识别...");

    // 2. 调用 OCR parse 接口
    const parseResponse = await ocrApi.batchParse([fileUrl]);

    if (
      !parseResponse.success ||
      !parseResponse.data ||
      parseResponse.data.length === 0
    ) {
      throw new Error("提交 OCR 解析失败");
    }

    const fileId = parseResponse.data[0];
    ElMessage.info("正在识别中，请稍候...");

    // 3. 轮询查询 OCR 结果
    const fileContent = await pollOCRResult(fileId);

    // 4. 解析结果并填充数据
    const extractedFields = extractFieldsFromText(fileContent);

    const result = {
      confidence: 0.9, // OCR 接口没有返回置信度，设置默认值
      fullText: fileContent,
      extractedFields,
    };

    recognitionResult.value = result;
    Object.assign(extractedData, extractedFields);

    ElMessage.success("识别完成");
  } catch (error: any) {
    console.error("OCR 识别失败:", error);
    ElMessage.error(error.message || "识别失败，请稍后重试");
  } finally {
    recognizing.value = false;
  }
};

const handleFillToCase = async () => {
  // Load cases for selection
  try {
    const response = await caseApi.getCases({ page: 1, pageSize: 100 });
    // 处理不同的返回结构
    cases.value = response.data?.cases || response.data?.list || [];
    if (cases.value.length === 0) {
      ElMessage.warning("暂无案件，请先创建案件");
      return;
    }
    showFillDialog.value = true;
  } catch (error) {
    ElMessage.error("加载案件列表失败");
    console.error(error);
  }
};

const handleConfirmFill = async () => {
  if (fillAction.value === "new") {
    // Navigate to case creation form with pre-filled data
    router.push({
      path: "/cases/create",
      query: {
        caseNumber: extractedData.caseNumber,
        caseCause: extractedData.caseCause,
        court: extractedData.court,
        targetAmount: extractedData.targetAmount,
        filingDate: extractedData.filingDate,
        plaintiff: extractedData.plaintiff,
        defendant: extractedData.defendant,
      },
    });
    ElMessage.success("已跳转到案件创建页面");
  } else if (fillAction.value === "existing" && selectedCaseId.value) {
    // 将案件数据填充到提取字段
    try {
      // 1. 获取案件详细信息
      const caseResponse = await caseApi.getCaseById(selectedCaseId.value);
      const caseData = caseResponse.data?.case || caseResponse.data || {};

      // 2. 获取案件的诉讼参与人
      let plaintiffName = "";
      let defendantName = "";
      try {
        const partiesResponse = await caseApi.getCaseParties(
          selectedCaseId.value
        );
        // 处理不同的返回结构
        const parties =
          partiesResponse.data?.parties ||
          partiesResponse.data?.data?.parties ||
          partiesResponse.data ||
          [];

        // 查找原告（兼容不同的字段名）
        const plaintiff = parties.find(
          (p: any) =>
            (p.party_type === "原告" || p.partyType === "原告") && p.name
        );
        if (plaintiff) {
          plaintiffName = plaintiff.name || "";
        }

        // 查找被告（兼容不同的字段名）
        const defendant = parties.find(
          (p: any) =>
            (p.party_type === "被告" || p.partyType === "被告") && p.name
        );
        if (defendant) {
          defendantName = defendant.name || "";
        }
      } catch (partyError) {
        console.error("获取诉讼参与人失败:", partyError);
        // 不阻止整个流程，只记录错误
      }

      // 3. 获取案件的文书类型（从最新文档中获取）
      let documentType = "";
      try {
        const documentsResponse: any = await documentApi.getDocumentsByCaseId(
          selectedCaseId.value
        );
        // 处理不同的返回结构
        const documents =
          documentsResponse?.documents ||
          documentsResponse?.data?.documents ||
          (Array.isArray(documentsResponse?.data)
            ? documentsResponse.data
            : Array.isArray(documentsResponse)
            ? documentsResponse
            : []);
        // 取最新的文档类型
        if (documents.length > 0) {
          const latestDoc = documents[0];
          documentType =
            latestDoc.document_type || latestDoc.documentType || "";
        }
      } catch (docError) {
        console.error("获取文书类型失败:", docError);
        // 不阻止整个流程，只记录错误
      }

      // 4. 将案件数据填充到提取字段
      // 如果提取字段已有值，则保留；如果为空，则用案件数据填充
      if (!extractedData.documentType && documentType) {
        extractedData.documentType = documentType;
      }
      if (
        !extractedData.caseNumber &&
        (caseData.case_number || caseData.caseNumber)
      ) {
        extractedData.caseNumber =
          caseData.case_number || caseData.caseNumber || "";
      }
      if (
        !extractedData.caseCause &&
        (caseData.case_cause || caseData.caseCause)
      ) {
        extractedData.caseCause =
          caseData.case_cause || caseData.caseCause || "";
      }
      if (!extractedData.court && caseData.court) {
        extractedData.court = caseData.court || "";
      }
      if (
        !extractedData.targetAmount &&
        (caseData.target_amount || caseData.targetAmount)
      ) {
        extractedData.targetAmount = String(
          caseData.target_amount || caseData.targetAmount || ""
        );
      }
      if (
        !extractedData.filingDate &&
        (caseData.filing_date || caseData.filingDate)
      ) {
        extractedData.filingDate =
          caseData.filing_date || caseData.filingDate || "";
      }
      if (!extractedData.plaintiff && plaintiffName) {
        extractedData.plaintiff = plaintiffName;
      }
      if (!extractedData.defendant && defendantName) {
        extractedData.defendant = defendantName;
      }

      // 4. 如果识别结果存在，更新识别结果中的提取字段
      if (recognitionResult.value) {
        recognitionResult.value.extractedFields = { ...extractedData };
      }

      ElMessage.success("案件数据已填充到提取字段");
      showFillDialog.value = false;
    } catch (error: any) {
      console.error("获取案件数据失败:", error);
      ElMessage.error(error.message || "获取案件数据失败，请稍后重试");
    }
  } else {
    ElMessage.warning("请选择案件");
  }
};

const handleSaveAsDocument = () => {
  ElMessage.info("保存为文书功能（需要先选择案件）");
};

const handleExportText = () => {
  if (!recognitionResult.value) return;

  const blob = new Blob([recognitionResult.value.fullText], {
    type: "text/plain;charset=utf-8",
  });
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.setAttribute("download", `识别结果_${Date.now()}.txt`);
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);

  ElMessage.success("导出成功");
};
</script>

<style scoped>
.document-ocr-container {
  padding: 20px;
}

.upload-card {
  margin-bottom: 20px;
}

.upload-area {
  margin: 20px 0;
}

.upload-actions {
  display: flex;
  justify-content: center;
  gap: 10px;
  margin-top: 20px;
}

.result-card {
  margin-top: 20px;
}

.result-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.extracted-form {
  margin-top: 20px;
}

.result-actions {
  display: flex;
  justify-content: center;
  gap: 10px;
  margin-top: 30px;
  padding-top: 20px;
  border-top: 1px solid #eee;
}
</style>
