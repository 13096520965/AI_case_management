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

/**
 * 带重试的请求函数
 */
const requestWithRetry = async <T>(
  requestFn: () => Promise<T>,
  maxRetries = 5, // 增加重试次数到5次
  retryDelay = 2000 // 增加初始延迟到2秒
): Promise<T> => {
  let lastError: any;
  
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await requestFn();
    } catch (error: any) {
      lastError = error;
      
      // 如果是 503 错误且还有重试次数，则重试
      if (error.response?.status === 503 && attempt < maxRetries - 1) {
        const delay = retryDelay * Math.pow(2, attempt); // 指数退避：2s, 4s, 8s, 16s
        console.warn(`OCR 接口返回 503（服务暂时不可用），${delay}ms 后重试 (${attempt + 1}/${maxRetries})`);
        await new Promise(resolve => setTimeout(resolve, delay));
        continue;
      }
      
      // 如果是 503 错误且重试次数用完，提供更详细的错误信息
      if (error.response?.status === 503 && attempt === maxRetries - 1) {
        const enhancedError = new Error('OCR 服务暂时不可用，已重试 5 次仍失败。可能原因：1) 服务器过载或维护中；2) 网络连接问题。请稍后再试或联系管理员。');
        (enhancedError as any).response = error.response;
        throw enhancedError;
      }
      
      // 其他错误或重试次数用完，直接抛出
      throw error;
    }
  }
  
  throw lastError;
}

export const ocrApi = {
  /**
   * 提交文件进行 OCR 解析
   * @param fileUrls 文件 URL 数组
   */
  batchParse: async (fileUrls: string[]): Promise<OCRParseResponse> => {
    return requestWithRetry(async () => {
      const response = await axios.post<OCRParseResponse>(
        `${OCR_BASE_URL}/batch/parse`,
        { fileUrls },
        {
          headers: {
            'Content-Type': 'application/json'
          },
          timeout: 30000 // 30秒超时
        }
      )
      return response.data
    })
  },

  /**
   * 查询 OCR 解析结果
   * @param fileIds 文件 ID 数组
   */
  query: async (fileIds: string[]): Promise<OCRQueryResponse> => {
    return requestWithRetry(async () => {
      const response = await axios.post<OCRQueryResponse>(
        `${OCR_BASE_URL}/query`,
        { fileIds },
        {
          headers: {
            'Content-Type': 'application/json'
          },
          timeout: 30000 // 30秒超时
        }
      )
      return response.data
    })
  }
}

