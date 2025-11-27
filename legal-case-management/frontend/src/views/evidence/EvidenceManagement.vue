<template>
  <div class="evidence-management">
    <!-- Header -->
    <el-card class="header-card">
      <div class="header-content">
        <div class="title-section">
          <i @click="goBack" class="el-icon-upload">&lt;</i>
          <h2>证据管理</h2>
          <el-tag>案件ID: {{ caseId }}</el-tag>
        </div>
        <div class="action-section">
          <el-button
            type="primary"
            :icon="Upload"
            @click="showUploadDialog = true"
          >
            上传证据
          </el-button>
          <!-- <el-button
            :icon="Download"
            @click="handleBatchDownload"
            :disabled="selectedEvidence.length === 0"
          >
            批量下载 ({{ selectedEvidence.length }})
          </el-button>
          <el-button-group class="view-toggle">
            <el-button
              :type="viewMode === 'list' ? 'primary' : ''"
              :icon="List"
              @click="viewMode = 'list'"
            />
            <el-button
              :type="viewMode === 'grid' ? 'primary' : ''"
              :icon="Grid"
              @click="viewMode = 'grid'"
            />
          </el-button-group> -->
        </div>
      </div>
    </el-card>

    <!-- Filters -->
    <el-card class="filter-card">
      <el-form :inline="true" :model="filters">
        <el-form-item label="分类">
          <el-select
            v-model="filters.category"
            placeholder="全部分类"
            clearable
            @change="loadEvidence"
          >
            <el-option label="全部" value="" />
            <el-option
              v-for="cat in categories"
              :key="cat"
              :label="cat"
              :value="cat"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="标签">
          <el-input
            v-model="filters.tags"
            placeholder="输入标签搜索"
            clearable
            @change="loadEvidence"
          />
        </el-form-item>
        <el-form-item label="文件类型">
          <el-select
            v-model="filters.fileType"
            placeholder="全部类型"
            clearable
            @change="loadEvidence"
          >
            <el-option label="全部" value="" />
            <el-option label="图片" value="image" />
            <el-option label="PDF" value="pdf" />
            <el-option label="音频" value="audio" />
            <el-option label="视频" value="video" />
            <el-option label="其他" value="other" />
          </el-select>
        </el-form-item>
      </el-form>
    </el-card>

    <!-- Evidence List/Grid -->
    <el-card class="content-card" v-loading="loading">
      <!-- List View -->
      <el-table
        v-if="viewMode === 'list'"
        :data="filteredEvidence"
        @selection-change="handleSelectionChange"
        style="width: 100%"
      >
        <el-table-column type="selection" width="55" />
        <el-table-column label="缩略图" width="100">
          <template #default="{ row }">
            <div class="thumbnail" @click="handlePreview(row)">
              <el-image
                v-if="isImage(row.fileType)"
                :src="row.storagePath"
                fit="cover"
                style="width: 60px; height: 60px; cursor: pointer"
              >
                <template #error>
                  <div class="image-error">
                    <el-icon :size="30"><Picture /></el-icon>
                    <span style="font-size: 10px">加载失败</span>
                  </div>
                </template>
              </el-image>
              <el-icon v-else :size="40" class="file-icon">
                <Document v-if="isPdf(row.fileType)" />
                <Headset v-else-if="isAudio(row.fileType)" />
                <VideoCamera v-else-if="isVideo(row.fileType)" />
                <Files v-else />
              </el-icon>
            </div>
          </template>
        </el-table-column>
        <el-table-column
          prop="fileName"
          label="文件名"
          min-width="200"
          show-overflow-tooltip
        />
        <el-table-column prop="description" label="描述" min-width="200" show-overflow-tooltip />
       
        <el-table-column prop="category" label="分类" width="120">
          <template #default="{ row }">
            <el-tag v-if="row.category" size="small">{{ row.category }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="tags" label="标签" width="150">
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
        <el-table-column prop="uploadedBy" label="上传人" width="100" />
        <el-table-column label="上传时间" width="180">
          <template #default="{ row }">
            {{ formatDate(row.uploadedAt) }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="200" fixed="right">
          <template #default="{ row }">
            <el-button
              link
              type="primary"
              :icon="View"
              @click="handlePreview(row)"
              >预览</el-button
            >
            <el-button
              link
              type="primary"
              :icon="Download"
              @click="handleDownload(row)"
              >下载</el-button
            >
            <el-button link type="primary" :icon="Edit" @click="handleEdit(row)"
              >编辑</el-button
            >
            <el-button
              link
              type="danger"
              :icon="Delete"
              @click="handleDelete(row)"
              >删除</el-button
            >
          </template>
        </el-table-column>
      </el-table>

      <!-- Grid View -->
      <div v-else class="grid-view">
        <div
          v-for="item in filteredEvidence"
          :key="item.id"
          class="grid-item"
          :class="{ selected: isSelected(item) }"
        >
          <el-checkbox
            v-model="item.checked"
            class="grid-checkbox"
            @change="handleGridSelection(item)"
          />
          <div class="grid-thumbnail" @click="handlePreview(item)">
            <el-image
              v-if="isImage(item.fileType)"
              :src="item.storagePath"
              fit="cover"
              style="width: 100%; height: 100%"
            >
              <template #error>
                <div class="image-error-large">
                  <el-icon :size="50"><Picture /></el-icon>
                  <span>加载失败</span>
                </div>
              </template>
            </el-image>
            <div v-else class="file-icon-large">
              <el-icon :size="60">
                <Document v-if="isPdf(item.fileType)" />
                <Headset v-else-if="isAudio(item.fileType)" />
                <VideoCamera v-else-if="isVideo(item.fileType)" />
                <Files v-else />
              </el-icon>
            </div>
          </div>
          <div class="grid-info">
            <div class="file-name" :title="item.fileName">
              {{ item.fileName }}
            </div>
            <div class="file-meta">
              <span>{{ formatFileSize(item.fileSize) }}</span>
              <el-tag v-if="item.category" size="small">{{
                item.category
              }}</el-tag>
            </div>
            <div class="file-description" v-if="item.description" :title="item.description" style="margin-top:8px; color:#606266; font-size:13px;">
              {{ item.description }}
            </div>
            <div class="file-tags">
              <el-tag
                v-for="tag in parseTags(item.tags)"
                :key="tag"
                size="small"
                style="margin-right: 5px"
              >
                {{ tag }}
              </el-tag>
            </div>
            <div class="grid-actions">
              <el-button
                link
                type="primary"
                :icon="View"
                @click.stop="handlePreview(item)"
                >预览</el-button
              >
              <el-button
                link
                type="primary"
                :icon="Download"
                @click.stop="handleDownload(item)"
                >下载</el-button
              >
              <el-button
                link
                type="primary"
                :icon="Edit"
                @click.stop="handleEdit(item)"
                >编辑</el-button
              >
              <el-button
                link
                type="danger"
                :icon="Delete"
                @click.stop="handleDelete(item)"
                >删除</el-button
              >
            </div>
          </div>
        </div>
      </div>

      <template #empty>
        <TableEmpty description="暂无证据" />
      </template>
    </el-card>

    <!-- Upload Dialog -->
    <el-dialog
      v-model="showUploadDialog"
      title="上传证据"
      width="600px"
      @close="resetUploadForm"
    >
      <el-form :model="uploadForm" label-width="80px">
        <el-form-item label="文件">
          <el-upload
            ref="uploadRef"
            :auto-upload="false"
            :on-change="handleFileChange"
            :on-remove="handleFileRemove"
            :file-list="fileList"
            drag
            multiple
            :accept="acceptedFileTypes"
          >
            <el-icon class="el-icon--upload"><upload-filled /></el-icon>
            <div class="el-upload__text">
              拖拽文件到此处或 <em>点击上传</em>
            </div>
            <template #tip>
              <div class="el-upload__tip">
                支持 PDF、图片、音频、视频格式，单个文件不超过 100MB
              </div>
            </template>
          </el-upload>
        </el-form-item>
        <el-form-item label="分类">
          <el-select v-model="uploadForm.category" placeholder="请选择分类">
            <el-option
              v-for="cat in categories"
              :key="cat"
              :label="cat"
              :value="cat"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="标签">
          <el-input
            v-model="uploadForm.tags"
            placeholder="多个标签用逗号分隔"
          />
        </el-form-item>
        <el-form-item label="描述">
          <el-input
            v-model="uploadForm.description"
            type="textarea"
            :rows="3"
            placeholder="请输入证据描述"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showUploadDialog = false">取消</el-button>
        <el-button type="primary" @click="handleUpload" :loading="uploading">
          {{ uploading ? `上传中 ${uploadProgress}%` : "确定上传" }}
        </el-button>
      </template>
    </el-dialog>

    <!-- Edit Dialog -->
    <el-dialog v-model="showEditDialog" title="编辑证据信息" width="500px">
      <el-form :model="editForm" label-width="80px">
        <el-form-item label="分类">
          <el-select v-model="editForm.category" placeholder="请选择分类">
            <el-option
              v-for="cat in categories"
              :key="cat"
              :label="cat"
              :value="cat"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="标签">
          <el-input v-model="editForm.tags" placeholder="多个标签用逗号分隔" />
        </el-form-item>
        <el-form-item label="描述">
          <el-input
            v-model="editForm.description"
            type="textarea"
            :rows="3"
            placeholder="请输入证据描述"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showEditDialog = false">取消</el-button>
        <el-button type="primary" @click="handleSaveEdit">保存</el-button>
      </template>
    </el-dialog>

    <!-- Preview Dialog -->
    <el-dialog
      v-model="showPreviewDialog"
      :title="previewFile?.fileName"
      width="80%"
      :fullscreen="previewFullscreen"
    >
      <div class="preview-container" v-loading="previewLoading">
        <!-- Error State -->
        <el-alert
          v-if="previewError"
          :title="previewError"
          type="error"
          :closable="false"
          show-icon
          style="margin-bottom: 20px"
        >
          <template #default>
            <p>{{ previewError }}</p>
            <el-button
              type="primary"
              size="small"
              @click="previewFile && handleDownload(previewFile)"
            >
              尝试下载文件
            </el-button>
          </template>
        </el-alert>

        <!-- Image Preview -->
          <el-image
            v-if="previewFile && isImage(previewFile.fileType) && !previewError"
            :src="previewFile.storagePath"
          fit="contain"
          style="width: 100%; max-height: 70vh"
          @load="handlePreviewLoad"
          @error="handlePreviewError"
        >
          <template #error>
            <div class="preview-error">
              <el-icon :size="80"><Picture /></el-icon>
              <p>图片加载失败</p>
              <el-button type="primary" @click="previewFile && handleDownload(previewFile)">
                下载查看
              </el-button>
            </div>
          </template>
        </el-image>

        <!-- PDF Preview -->
          <div
          v-else-if="
            previewFile && isPdf(previewFile.fileType) && !previewError
          "
          class="pdf-preview-wrapper"
        >
          <iframe
            :src="previewFile.storagePath"
            style="width: 100%; height: 70vh; border: none"
            @load="handlePreviewLoad"
            @error="handlePreviewError"
          />
          <div class="pdf-fallback">
            <p>如果PDF未正确显示，请</p>
            <el-button type="primary" @click="previewFile && handleDownload(previewFile)">
              下载后查看
            </el-button>
          </div>
        </div>

        <!-- Audio Preview -->
        <div
          v-else-if="
            previewFile && isAudio(previewFile.fileType) && !previewError
          "
          class="audio-preview"
        >
          <audio
            controls
            style="width: 100%"
            @loadeddata="handlePreviewLoad"
            @error="handleAudioVideoError"
          >
            <source :src="previewFile.storagePath" />
            您的浏览器不支持音频播放
          </audio>
          <div class="media-fallback">
            <p>如果音频无法播放，请</p>
            <el-button type="primary" @click="previewFile && handleDownload(previewFile)">
              下载后播放
            </el-button>
          </div>
        </div>

        <!-- Video Preview -->
        <div
          v-else-if="
            previewFile && isVideo(previewFile.fileType) && !previewError
          "
          class="video-preview"
        >
          <video
            controls
            style="width: 100%; max-height: 70vh"
            @loadeddata="handlePreviewLoad"
            @error="handleAudioVideoError"
          >
            <source :src="previewFile.storagePath" />
            您的浏览器不支持视频播放
          </video>
          <div class="media-fallback">
            <p>如果视频无法播放，请</p>
            <el-button type="primary" @click="previewFile && handleDownload(previewFile)">
              下载后播放
            </el-button>
          </div>
        </div>

        <!-- Unsupported Format -->
        <TableEmpty
          v-else-if="previewFile && !previewError"
          description="该文件格式不支持预览，请下载后查看"
        >
          <el-button type="primary" @click="previewFile && handleDownload(previewFile)">
            立即下载
          </el-button>
        </TableEmpty>
      </div>
      <template #footer>
        <el-button @click="previewFullscreen = !previewFullscreen">
          {{ previewFullscreen ? "退出全屏" : "全屏" }}
        </el-button>
        <el-button
          type="primary"
          :icon="Download"
          @click="previewFile && handleDownload(previewFile)"
        >
          下载
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from "vue";
import { useRoute } from "vue-router";
import { ElMessage, ElMessageBox } from "element-plus";
import {
  Upload,
  Download,
  List,
  Grid,
  View,
  Edit,
  Delete,
  Document,
  Headset,
  VideoCamera,
  Files,
  UploadFilled,
  Picture,
} from "@element-plus/icons-vue";
import { evidenceApi } from "@/api/evidence";
import TableEmpty from "@/components/common/TableEmpty.vue";
import type { Evidence, EvidenceCategory, ViewMode } from "@/types";
import request from "@/api/request";
import axios from "axios";
import { goBack } from "@/router/utils";

const route = useRoute();
const caseId = ref(Number(route.params.id));

// State
const loading = ref(false);
const evidenceList = ref<Evidence[]>([]);
const selectedEvidence = ref<Evidence[]>([]);
const viewMode = ref<ViewMode>("list");

// Filters
const filters = ref({
  category: "",
  tags: "",
  fileType: "",
});

const categories: EvidenceCategory[] = [
  "书证",
  "物证",
  "视听资料",
  "电子数据",
  "证人证言",
  "鉴定意见",
  "勘验笔录",
  "其他",
];

// Upload
const showUploadDialog = ref(false);
const uploading = ref(false);
const uploadProgress = ref(0);
const uploadRef = ref();
const fileList = ref<any[]>([]);
const uploadForm = ref({
  category: "",
  tags: "",
  description: "",
});

const acceptedFileTypes =
  ".pdf,.jpg,.jpeg,.png,.gif,.mp3,.wav,.mp4,.avi,.mov,.doc,.docx";

// Edit
const showEditDialog = ref(false);
const editForm = ref({
  id: 0,
  category: "",
  tags: "",
  description: "",
});

// Preview
const showPreviewDialog = ref(false);
const previewFile = ref<Evidence | null>(null);
const previewFullscreen = ref(false);
const previewError = ref<string | null>(null);
const previewLoading = ref(false);

// Computed
const filteredEvidence = computed(() => {
  console.log(
    "Computing filteredEvidence, evidenceList.value:",
    evidenceList.value
  );
  let result = evidenceList.value;

  if (filters.value.category) {
    result = result.filter((e) => e.category === filters.value.category);
  }

  if (filters.value.tags) {
    result = result.filter((e) =>
      e.tags?.toLowerCase().includes(filters.value.tags.toLowerCase())
    );
  }

  if (filters.value.fileType) {
    const type = filters.value.fileType;
    result = result.filter((e) => {
      if (type === "image") return isImage(e.fileType);
      if (type === "pdf") return isPdf(e.fileType);
      if (type === "audio") return isAudio(e.fileType);
      if (type === "video") return isVideo(e.fileType);
      return true;
    });
  }

  console.log("Filtered evidence result:", result);
  return result;
});

// Methods
const loadEvidence = async () => {
  loading.value = true;
  try {
    const params: any = {};
    if (filters.value.category) params.category = filters.value.category;
    if (filters.value.tags) params.tags = filters.value.tags;

    const response = await evidenceApi.getEvidenceByCaseId(
      caseId.value,
      params
    );

    // 兼容两种后端返回格式：
    // 旧格式：{ count, evidence: [...] }
    // 新格式：{ success, code, message, data: { items, meta } }
    let list: any[] = [];
    if (response) {
      if (Array.isArray(response.evidence)) {
        list = response.evidence;
      } else if (Array.isArray(response.items)) {
        list = response.items;
      } else if (Array.isArray(response.data?.items)) {
        list = response.data.items;
      } else if (Array.isArray(response.data?.evidence)) {
        list = response.data.evidence;
      }
    }

    if (list.length === 0) {
      evidenceList.value = [];
    } else {
      // 转换字段名从下划线到驼峰
      evidenceList.value = list.map((item: any) => ({
        id: item.id,
        caseId: item.case_id,
        fileName: item.file_name,
        // 如果后端没有返回 file_type，则根据 storage_path 推断
        fileType: item.file_type || inferFileTypeFromPath(item.storage_path),
        fileSize: item.file_size,
        storagePath: item.storage_path,
        category: item.category,
        tags: item.tags,
        description: item.description,
        uploadedBy: item.uploaded_by,
        uploadedAt: item.uploaded_at,
        version: item.version,
        checked: false,
      }));
    }
  } catch (error: any) {
    console.error("加载证据列表失败:", error);
    ElMessage.error(error.message || "加载证据列表失败");
    evidenceList.value = [];
  } finally {
    loading.value = false;
  }
};

const handleFileChange = async (file: any, files: any[]) => {
  console.log("file:", file, files);
  const response = await request.post(
    "https://x-fat.zhixinzg.com/code-app/file/getUploadSign",
    {
      fileName: file.name,
      contentType: file.raw.type,
      openFlag: "1",
    }
  );
  const { serviceUrl, uploadHeaders, fileUrl, requestMethod } =
    response.data ?? {};
  try {
    // 在浏览器环境中，直接使用文件对象
    const reader = new FileReader();
    reader.readAsArrayBuffer(file.raw as Blob);
    let fileData;
    reader.onload = (e) => {
      // 在文件读取结束后执行的操作
      fileData = e.target?.result;
      axios({
        url: serviceUrl,
        method: "put",
        data: fileData,
        headers: {
          ...(uploadHeaders || {}),
          "Content-Type": file.raw.type,
        },
      });
    };

    // 更新文件列表，设置上传成功文件的URL
    fileList.value = files.map((item) => {
      return {
        ...item,
        url: fileUrl,
      };
    });
  } catch (error) {
    console.error("上传失败", error);
    // 上传失败时移除对应文件
    fileList.value = files.filter(
      (item) => item.name !== file.name
    );
  }
};

const handleFileRemove = (file: any, files: any[]) => {
  console.log("file:", file, files);
  fileList.value = files;
};

const handleUpload = async () => {
  if (fileList.value.length === 0) {
    ElMessage.warning("请选择要上传的文件");
    return;
  }

  uploading.value = true;
  uploadProgress.value = 0;

  try {
    for (let i = 0; i < fileList.value.length; i++) {
      const file = fileList.value[i];
      const formData = new FormData();
      formData.append("storage_path", file.url);
      formData.append("file_name", file.name);
      formData.append("case_id", caseId.value.toString()); // 后端期望 case_id
      formData.append("category", uploadForm.value.category);
      formData.append("tags", uploadForm.value.tags);
      formData.append("description", uploadForm.value.description);

      await evidenceApi.uploadEvidence(formData);
      uploadProgress.value = Math.round(
        ((i + 1) / fileList.value.length) * 100
      );
    }

    ElMessage.success("上传成功");
    showUploadDialog.value = false;
    resetUploadForm();
    loadEvidence();
  } catch (error: any) {
    ElMessage.error(error.message || "上传失败");
  } finally {
    uploading.value = false;
    uploadProgress.value = 0;
  }
};

const resetUploadForm = () => {
  fileList.value = [];
  uploadForm.value = {
    category: "",
    tags: "",
    description: "",
  };
};

const handleSelectionChange = (selection: Evidence[]) => {
  selectedEvidence.value = selection;
};

const handleGridSelection = (item: Evidence) => {
  const index = selectedEvidence.value.findIndex((e) => e.id === item.id);
  if (item.checked && index === -1) {
    selectedEvidence.value.push(item);
  } else if (!item.checked && index !== -1) {
    selectedEvidence.value.splice(index, 1);
  }
};

const isSelected = (item: Evidence) => {
  return selectedEvidence.value.some((e) => e.id === item.id);
};

const handlePreview = (evidence: Evidence) => {
  previewFile.value = evidence;
  showPreviewDialog.value = true;
  previewFullscreen.value = false;
  previewError.value = null;
  previewLoading.value = true;
};

const handlePreviewLoad = () => {
  previewLoading.value = false;
  previewError.value = null;
};

const handlePreviewError = () => {
  previewLoading.value = false;
  previewError.value = "文件加载失败，可能文件不存在或已被删除";
};

const handleAudioVideoError = () => {
  previewLoading.value = false;
  previewError.value = "媒体文件加载失败，可能格式不支持或文件损坏";
};

const handleDownload = async (evidence: Evidence) => {
  try {
    const response = await evidenceApi.downloadEvidence(evidence.id);
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", evidence.fileName);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
    ElMessage.success("下载成功");
  } catch (error: any) {
    console.error("下载失败:", error);

    // 根据错误状态码显示具体错误信息
    if (error.response) {
      const status = error.response.status;
      if (status === 404) {
        ElMessage.error("文件不存在，可能已被删除");
      } else if (status === 403) {
        ElMessage.error("没有权限访问该文件");
      } else if (status === 500) {
        ElMessage.error("服务器错误，请稍后重试");
      } else {
        ElMessage.error(
          error.response.data?.error || error.message || "下载失败"
        );
      }
    } else if (error.request) {
      ElMessage.error("网络连接失败，请检查网络设置");
    } else {
      ElMessage.error(error.message || "下载失败，请重试");
    }
  }
};

const handleBatchDownload = async () => {
  if (selectedEvidence.value.length === 0) {
    ElMessage.warning("请选择要下载的证据");
    return;
  }

  try {
    for (const evidence of selectedEvidence.value) {
      await handleDownload(evidence);
    }
  } catch (error: any) {
    ElMessage.error(error.message || "批量下载失败");
  }
};

const handleEdit = (evidence: Evidence) => {
  editForm.value = {
    id: evidence.id,
    category: evidence.category || "",
    tags: evidence.tags || "",
    description: evidence.description || "",
  };
  showEditDialog.value = true;
};

const handleSaveEdit = async () => {
  try {
    await evidenceApi.updateEvidence(editForm.value.id, {
      category: editForm.value.category,
      tags: editForm.value.tags,
      description: editForm.value.description,
    });
    ElMessage.success("更新成功");
    showEditDialog.value = false;
    loadEvidence();
  } catch (error: any) {
    ElMessage.error(error.message || "更新失败");
  }
};

const handleDelete = async (evidence: Evidence) => {
  try {
    await ElMessageBox.confirm(
      `确定要删除证据 "${evidence.fileName}" 吗？此操作不可恢复。`,
      "删除确认",
      {
        confirmButtonText: "确定",
        cancelButtonText: "取消",
        type: "warning",
      }
    );

    await evidenceApi.deleteEvidence(evidence.id);
    ElMessage.success("删除成功");
    loadEvidence();
  } catch (error: any) {
    if (error !== "cancel") {
      ElMessage.error(error.message || "删除失败");
    }
  }
};

// Utility functions
const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + " " + sizes[i];
};

const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleString("zh-CN");
};

const parseTags = (tags?: string): string[] => {
  if (!tags) return [];
  return tags
    .split(",")
    .map((t) => t.trim())
    .filter((t) => t);
};

// 根据 storage_path 推断文件的 MIME 类型（尽量返回标准的 type/subtype，例如 image/png）
const inferFileTypeFromPath = (storagePath?: string): string | null => {
  if (!storagePath) return null;
  const lower = storagePath.toLowerCase();

  // 如果是完整 URL，尝试从 extension 推断
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

const isImage = (fileType: string): boolean => {
  return /^image\/(jpeg|jpg|png|gif|bmp|webp)$/i.test(fileType);
};

const isPdf = (fileType: string): boolean => {
  return fileType === "application/pdf";
};

const isAudio = (fileType: string): boolean => {
  return /^audio\/(mpeg|mp3|wav|ogg)$/i.test(fileType);
};

const isVideo = (fileType: string): boolean => {
  return /^video\/(mp4|avi|mov|wmv|flv|webm)$/i.test(fileType);
};

// 使用 storagePath 字段作为文件 URL：
// - 如果是绝对 URL（以 http/https 开头），模板会直接使用它作为 src；
// - 如果是相对路径（例如 /uploads/...），由后端和代理处理访问。

// Lifecycle
onMounted(() => {
  loadEvidence();
});
</script>

<style scoped>
.evidence-management {
  padding: 20px;
}
.el-icon-upload{
  cursor: pointer;
}

.header-card {
  margin-bottom: 20px;
}

.header-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.title-section {
  display: flex;
  align-items: center;
  gap: 15px;
}

.title-section h2 {
  margin: 0;
}

.action-section {
  display: flex;
  gap: 10px;
  align-items: center;
}

.view-toggle {
  margin-left: 10px;
}

.filter-card {
  margin-bottom: 20px;
}

.content-card {
  min-height: 400px;
}

.thumbnail {
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
}

.file-icon {
  color: #909399;
}

/* Grid View Styles */
.grid-view {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  gap: 20px;
  padding: 10px;
}

.grid-item {
  border: 1px solid #dcdfe6;
  border-radius: 4px;
  overflow: hidden;
  transition: all 0.3s;
  position: relative;
  cursor: pointer;
}

.grid-item:hover {
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
  transform: translateY(-2px);
}

.grid-item.selected {
  border-color: #409eff;
  box-shadow: 0 0 0 2px rgba(64, 158, 255, 0.2);
}

.grid-checkbox {
  position: absolute;
  top: 10px;
  left: 10px;
  z-index: 10;
}

.grid-thumbnail {
  width: 100%;
  height: 180px;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: #f5f7fa;
  overflow: hidden;
}

.file-icon-large {
  color: #909399;
}

.grid-info {
  padding: 12px;
}

.file-name {
  font-weight: 500;
  margin-bottom: 8px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.file-meta {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
  font-size: 12px;
  color: #909399;
}

.file-tags {
  margin-bottom: 8px;
  min-height: 24px;
}

.grid-actions {
  display: flex;
  justify-content: space-around;
  padding-top: 8px;
  border-top: 1px solid #ebeef5;
}

/* Preview Styles */
.preview-container {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  min-height: 400px;
}

.audio-preview,
.video-preview {
  width: 100%;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  padding: 40px;
}

.pdf-preview-wrapper {
  width: 100%;
  position: relative;
}

.pdf-fallback,
.media-fallback {
  text-align: center;
  margin-top: 20px;
  color: #909399;
  font-size: 14px;
}

.preview-error {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px;
  color: #909399;
}

.preview-error p {
  margin: 20px 0;
  font-size: 16px;
}

.image-error {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  width: 60px;
  height: 60px;
  background-color: #f5f7fa;
  color: #909399;
  border-radius: 4px;
}

.image-error-large {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
  background-color: #f5f7fa;
  color: #909399;
}

.image-error-large span {
  margin-top: 10px;
  font-size: 14px;
}
</style>
