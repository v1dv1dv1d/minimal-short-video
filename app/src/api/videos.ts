import { apiClient, isBackendConfigured } from './client'
import type { VideoItem } from './types'

const MOCK_VIDEOS: VideoItem[] = [
  {
    id: '1',
    videoUrl: 'https://v3.cdnpk.net/videvo_files/video/free/video0463/large_watermarked/_import_60d34e4a5c4b97.06982042_preview.mp4',
    coverUrl: 'https://images.unsplash.com/photo-1611162616475-46b635cb6868?w=400',
    author: { name: '创作者昵称', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=1' },
    description: '这是一条极简短视频的示例文案 #极简 #短视频',
    likes: 1234,
    comments: 56,
  },
  {
    id: '2',
    videoUrl: 'https://v3.cdnpk.net/videvo_files/video/free/video0462/large_watermarked/_import_60d34e493d6e96.56290900_preview.mp4',
    coverUrl: 'https://images.unsplash.com/photo-1611162616305-c69b3fa7fbe0?w=400',
    author: { name: '另一个用户', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=2' },
    description: '上下滑动切换视频',
    likes: 892,
    comments: 23,
  },
  {
    id: '3',
    videoUrl: 'https://v3.cdnpk.net/videvo_files/video/free/video0461/large_watermarked/_import_60d34e4861c9e0.90142461_preview.mp4',
    coverUrl: 'https://images.unsplash.com/photo-1549465220-1a8b9238cd48?w=400',
    author: { name: '极简生活', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=3' },
    description: '简约而不简单',
    likes: 2567,
    comments: 102,
  },
]

/** 获取首页视频流。已配置后端时仅从接口获取，失败返回空列表 */
export async function getFeed(): Promise<VideoItem[]> {
  if (isBackendConfigured()) {
    try {
      const list = await apiClient.get<VideoItem[]>('/api/videos/feed')
      return list ?? []
    } catch {
      return []
    }
  }
  return MOCK_VIDEOS
}

/** 点赞/取消点赞。需登录。后端：POST /api/videos/:id/like */
export async function toggleLike(videoId: string, action: 'like' | 'unlike'): Promise<void> {
  if (!isBackendConfigured()) return
  await apiClient.post(`/api/videos/${videoId}/like`, { action })
}

/** 获取单个视频详情。后端：GET /api/videos/:id */
export async function getVideoById(id: string): Promise<VideoItem | null> {
  if (isBackendConfigured()) {
    try {
      return await apiClient.get<VideoItem>(`/api/videos/${id}`)
    } catch {
      return MOCK_VIDEOS.find((v) => v.id === id) ?? null
    }
  }
  return MOCK_VIDEOS.find((v) => v.id === id) ?? null
}
