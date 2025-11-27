import axios from 'axios'

// OCR API 基础地址
const OCR_BASE_URL = 'https://xapi-fat.ygyg.cn/cbp/file'

export interface OCRParseRequest {
  fileUrls: string[]
}

export interface OCRParseResponse {
  code: string
  data: string[] // fileIds
  success: boolean
}

export interface OCRQueryRequest {
  fileIds: string[]
}

export interface OCRFileData {
  fileId: string
  fileUrl: string
  fileName: string
  businessId: string
  deleteFlag: number
  createByUserId: string
  createTime: string
  updateByUserId: string
  updateTime: string
  fileContent: string // OCR 识别的文本内容
}

export interface OCRQueryResponse {
  code: string
  data: OCRFileData[]
  success: boolean
}

export const ocrApi = {
  /**
   * 提交文件进行 OCR 解析
   * @param fileUrls 文件 URL 数组
   */
  batchParse: async (fileUrls: string[]): Promise<OCRParseResponse> => {
    const response = await axios.post<OCRParseResponse>(
      `${OCR_BASE_URL}/batch/parse`,
      { fileUrls },
      {
        headers: {
          'Content-Type': 'application/json'
        }
      }
    )
    return response.data
  },

  /**
   * 查询 OCR 解析结果
   * @param fileIds 文件 ID 数组
   */
  query: async (fileIds: string[]): Promise<OCRQueryResponse> => {
    const response = await axios.post<OCRQueryResponse>(
      `${OCR_BASE_URL}/query`,
      { fileIds },
      {
        headers: {
          'Content-Type': 'application/json'
        }
      }
    )
    return response.data
  }
}

