import { apiClient, getAuthToken, isBackendConfigured, setAuthToken } from './client'
import type { LoginRequest, LoginResponse, User } from './types'

const MOCK_USER: User = {
  username: 'alexa_vibe',
  avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=alexa',
  bio: 'Digital creator & motion designer',
  following: '1.2k',
  followers: '45.8k',
  likes: '120k',
}

const STORAGE_USER_KEY = 'stitch_user'

function getStoredUser(): User | null {
  try {
    const raw = localStorage.getItem(STORAGE_USER_KEY)
    return raw ? (JSON.parse(raw) as User) : null
  } catch {
    return null
  }
}

function setStoredUser(user: User | null) {
  if (user) localStorage.setItem(STORAGE_USER_KEY, JSON.stringify(user))
  else localStorage.removeItem(STORAGE_USER_KEY)
}

/** 登录：已配置后端时必须账号密码正确才成功；未配置时使用 mock */
export async function login(payload: LoginRequest): Promise<{ user: User; token?: string }> {
  if (isBackendConfigured()) {
    const res = await apiClient.post<LoginResponse>('/api/auth/login', payload)
    if (res.token) setAuthToken(res.token)
    setStoredUser(res.user)
    return { user: res.user, token: res.token }
  }
  setStoredUser(MOCK_USER)
  return { user: MOCK_USER }
}

/** 登出：如有后端则调用登出接口并清除本地 token */
export async function logout(): Promise<void> {
  if (isBackendConfigured() && getAuthToken()) {
    try {
      await apiClient.post('/api/auth/logout')
    } catch {
      // 忽略错误，本地仍清除
    }
  }
  setAuthToken(null)
  setStoredUser(null)
}

/** 获取当前用户：有 token 时先问后端，否则用本地缓存或 mock */
export async function getCurrentUser(): Promise<User | null> {
  const stored = getStoredUser()
  if (isBackendConfigured() && getAuthToken()) {
    try {
      const user = await apiClient.get<User>('/api/auth/me')
      setStoredUser(user)
      return user
    } catch {
      setAuthToken(null)
      setStoredUser(null)
      return null
    }
  }
  return stored
}
