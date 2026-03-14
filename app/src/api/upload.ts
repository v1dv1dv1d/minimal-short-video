import { apiClient, isBackendConfigured } from './client'
import type { VideoItem } from './types'

/**
 * 上传录制视频：POST /api/upload/video (multipart/form-data)
 * 字段：file (视频文件), description (可选)。需登录。
 * 成功返回新视频信息；失败抛出错误（含后端 message）。
 */
export async function uploadVideo(file: Blob, options?: { description?: string }): Promise<VideoItem> {
  if (!isBackendConfigured()) {
    throw new Error('请先配置后端 API 地址（VITE_API_BASE_URL）')
  }
  const form = new FormData()
  form.append('file', file, `recorded-${Date.now()}.webm`)
  if (options?.description) form.append('description', options.description)
  const res = await apiClient.upload<VideoItem>('/api/upload/video', form)
  return res
}
