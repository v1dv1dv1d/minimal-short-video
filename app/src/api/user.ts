import { apiClient, isBackendConfigured } from './client'
import type { User, UserVideoItem } from './types'

const MOCK_GRID_VIDEOS: UserVideoItem[] = [
  { id: '1', coverUrl: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=400', plays: '12.4k' },
  { id: '2', coverUrl: 'https://images.unsplash.com/photo-1478720568477-152d9b164e26?w=400', plays: '8.2k' },
  { id: '3', coverUrl: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400', plays: '25k' },
  { id: '4', coverUrl: 'https://images.unsplash.com/photo-1501281668745-f7f57925c3b4?w=400', plays: '4.1k' },
]

/** 获取当前用户个人资料。后端：GET /api/user/profile */
export async function getProfile(): Promise<User | null> {
  if (isBackendConfigured()) {
    try {
      return await apiClient.get<User>('/api/user/profile')
    } catch {
      return null
    }
  }
  return null
}

/** 获取当前用户作品列表（个人页网格）。后端：GET /api/user/videos */
export async function getMyVideos(): Promise<UserVideoItem[]> {
  if (isBackendConfigured()) {
    try {
      const list = await apiClient.get<UserVideoItem[]>('/api/user/videos')
      return list ?? []
    } catch {
      return []
    }
  }
  return MOCK_GRID_VIDEOS
}
