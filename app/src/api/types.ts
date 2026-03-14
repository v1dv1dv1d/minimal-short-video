/**
 * 与后端约定一致的请求/响应类型，便于后续联调
 */

/** 视频流单项 */
export interface VideoItem {
  id: string
  videoUrl: string
  coverUrl: string
  author: {
    id?: string
    name: string
    avatar: string
  }
  description: string
  likes: number
  comments: number
  /** 当前用户是否已点赞（feed 带 token 时由后端返回） */
  liked?: boolean
}

/** 当前用户信息（登录后） */
export interface User {
  id?: string
  username: string
  avatar: string
  bio: string
  following: string
  followers: string
  likes: string
}

/** 登录请求 */
export interface LoginRequest {
  account: string
  password: string
}

/** 登录响应 */
export interface LoginResponse {
  token: string
  user: User
}

/** 个人页作品网格单项 */
export interface UserVideoItem {
  id: string
  coverUrl: string
  plays: string
  videoUrl?: string
}
