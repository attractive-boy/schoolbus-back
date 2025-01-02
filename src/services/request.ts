import { extend, RequestOptionsInit, ResponseError } from 'umi-request';
import { message } from 'antd';

// 请求配置接口
interface RequestOptions {
  showError?: boolean; 
  showSuccess?: boolean;
  successMsg?: string;
}

// 响应数据接口
interface ResponseData<T = any> {
  code: number;
  data: T;
  message: string;
}

// 创建请求实例
const instance = extend({
  prefix: '/api',
  timeout: 10000,
  headers: {
    'Accept': 'application/json',
    'Content-Type': 'application/json',
  },
  credentials: 'same-origin'
});

// 请求拦截器
instance.interceptors.request.use((url: string, options: RequestOptionsInit) => {
  const token = localStorage.getItem('token');
  if (token) {
    options.headers = {
      ...options.headers,
      Authorization: `Bearer ${token}`,
    };
  }
  return { url, options };
});

// 响应拦截器
instance.interceptors.response.use(async (response: Response) => {
  const contentType = response.headers.get('Content-Type');
  if (contentType && contentType.includes('application/json')) {
    try {
      const data = await response.clone().json();
      return response;
    } catch (error) {
      console.error("响应解析错误:", error);
      throw error;
    }
  }
  return response;
});

// 通用请求方法
export async function http<T = any>(
  method: 'get' | 'post' | 'put' | 'delete',
  url: string,
  data?: any,
  options: RequestOptions = {}
): Promise<T> {
  const { showError = true, showSuccess = false, successMsg } = options;
  
  try {
    const requestConfig = {
      ...(method === 'get' ? { params: data } : { data }),
    };
    
    const response = await instance[method](url, requestConfig);
    
    if (showSuccess) {
      message.success(successMsg || '操作成功');
    }
    
    return response;
  } catch (error: unknown) {
    console.error("请求错误:", error);
    if (showError) {
      if (error instanceof Error) {
        message.error(error.message || '请求失败');
      } else {
        message.error('请求失败');
      }
    }
    throw error;
  }
}

// 导出便捷方法
export const get = <T = any>(url: string, params?: any, options?: RequestOptions) =>
  http<T>('get', url, params, options);

export const post = <T = any>(url: string, data?: any, options?: RequestOptions) =>
  http<T>('post', url, data, options);

export const put = <T = any>(url: string, data?: any, options?: RequestOptions) =>
  http<T>('put', url, data, options);

export const del = <T = any>(url: string, data?: any, options?: RequestOptions) =>
  http<T>('delete', url, data, options);

// 专门用于文件下载的请求方法
export const downloadExcelFile = async (url: string, params?: any, options: RequestOptions = {}) => {
  const { showError = true } = options;

  try {
    const requestConfig = {
      ...(params ? { params } : {}),
      responseType: 'blob' as const, // 设置响应类型为 blob
    };

    const response = await instance.get(url, requestConfig);

    // 创建一个链接并触发下载
    const blob = new Blob([response], { type: response.type });
    const link = document.createElement('a');
    link.href = window.URL.createObjectURL(blob);
    
    // 改进文件名生成逻辑
    const currentDate = new Date().toISOString().split('T')[0]; // 获取当前日期
    const safeFileName = `订单统计_${currentDate}.xlsx`; // 设置更具可读性的文件名
    link.download = safeFileName; // 设置下载文件名

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  } catch (error: unknown) {
    console.error("下载文件错误:", error);
    if (showError) {
      if (error instanceof Error) {
        message.error(error.message || '下载失败');
      } else {
        message.error('下载失败');
      }
    }
    throw error;
  }
}