/**
 * 前端 API 层统一导出
 * 所有与后端的数据交互通过本目录下的 client 与各 service 完成。
 * 未配置 VITE_API_BASE_URL 时，各接口自动回退为 mock 数据。
 */

export { apiClient, getBaseUrl, getAuthToken, setAuthToken, isBackendConfigured, ApiError } from './client'
export type { RequestConfig } from './client'
export * from './auth'
export * from './videos'
export * from './user'
export * from './upload'
export type { VideoItem, User, UserVideoItem, LoginRequest, LoginResponse } from './types'
