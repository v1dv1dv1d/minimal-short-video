/**
 * 后端 API 请求客户端
 * 通过环境变量 VITE_API_BASE_URL 配置后端地址，未配置时各 service 使用 mock 数据
 */

const BASE_URL = import.meta.env.VITE_API_BASE_URL ?? ''

const AUTH_TOKEN_KEY = 'stitch_token'

export function getBaseUrl(): string {
  return BASE_URL
}

/** 是否已配置后端（未配置时使用 mock） */
export function isBackendConfigured(): boolean {
  return BASE_URL.length > 0
}

export function getAuthToken(): string | null {
  return localStorage.getItem(AUTH_TOKEN_KEY)
}

export function setAuthToken(token: string | null): void {
  if (token) localStorage.setItem(AUTH_TOKEN_KEY, token)
  else localStorage.removeItem(AUTH_TOKEN_KEY)
}

export interface RequestConfig extends RequestInit {
  params?: Record<string, string>
}

export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public body?: unknown
  ) {
    super(message)
    this.name = 'ApiError'
  }
}

async function request<T>(
  path: string,
  config: RequestConfig = {}
): Promise<T> {
  const { params, ...init } = config
  let url = `${BASE_URL}${path}`
  if (params && Object.keys(params).length > 0) {
    const search = new URLSearchParams(params).toString()
    url += (path.includes('?') ? '&' : '?') + search
  }
  const token = getAuthToken()
  const headers: HeadersInit = {
    ...(init.headers as Record<string, string>),
  }
  if (token) {
    (headers as Record<string, string>)['Authorization'] = `Bearer ${token}`
  }
  if (init.body !== undefined && !(init.body instanceof FormData)) {
    (headers as Record<string, string>)['Content-Type'] = 'application/json'
  }
  const res = await fetch(url, { ...init, headers })
  let body: unknown
  const ct = res.headers.get('content-type')
  if (ct?.includes('application/json')) {
    try {
      body = await res.json()
    } catch {
      body = await res.text()
    }
  } else {
    body = await res.text()
  }
  if (!res.ok) {
    const msg = typeof body === 'object' && body !== null && 'message' in body
      ? String((body as { message: unknown }).message)
      : res.statusText || `Request failed: ${res.status}`
    throw new ApiError(msg, res.status, body)
  }
  return body as T
}

export const apiClient = {
  get<T>(path: string, config?: RequestConfig): Promise<T> {
    return request<T>(path, { ...config, method: 'GET' })
  },
  post<T>(path: string, body?: unknown, config?: RequestConfig): Promise<T> {
    return request<T>(path, { ...config, method: 'POST', body: body !== undefined ? JSON.stringify(body) : undefined })
  },
  put<T>(path: string, body?: unknown, config?: RequestConfig): Promise<T> {
    return request<T>(path, { ...config, method: 'PUT', body: body !== undefined ? JSON.stringify(body) : undefined })
  },
  delete<T>(path: string, config?: RequestConfig): Promise<T> {
    return request<T>(path, { ...config, method: 'DELETE' })
  },
  /** 上传文件（如录制视频），body 为 FormData */
  upload<T>(path: string, formData: FormData, config?: RequestConfig): Promise<T> {
    return request<T>(path, { ...config, method: 'POST', body: formData })
  },
}
