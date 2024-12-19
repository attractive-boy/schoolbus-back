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
  try {
    const data = await response.clone().json();
    return response;
  } catch (error) {
    console.error("响应解析错误:", error);
    throw error;
  }
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