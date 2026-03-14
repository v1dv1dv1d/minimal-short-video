import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react'
import * as authApi from '../api/auth'
import type { User } from '../api/types'

interface AuthContextValue {
  isLoggedIn: boolean
  user: User | null
  loading: boolean
  login: (payload?: { account: string; password: string }) => Promise<void>
  logout: () => Promise<void>
  refreshUser: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  const refreshUser = useCallback(async () => {
    const u = await authApi.getCurrentUser()
    setUser(u)
  }, [])

  useEffect(() => {
    authApi.getCurrentUser().then((u) => {
      setUser(u)
      setLoading(false)
    })
  }, [])

  const login = useCallback(async (payload?: { account: string; password: string }) => {
    const { user: next } = await authApi.login(
      payload ?? { account: '', password: '' }
    )
    setUser(next)
  }, [])

  const logout = useCallback(async () => {
    await authApi.logout()
    setUser(null)
  }, [])

  const value = useMemo<AuthContextValue>(
    () => ({
      isLoggedIn: user !== null,
      user,
      loading,
      login,
      logout,
      refreshUser,
    }),
    [user, loading, login, logout, refreshUser]
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}

/** 兼容旧类型名 */
export type { User as MockUser }
