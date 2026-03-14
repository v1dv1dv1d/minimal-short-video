import { useState, FormEvent } from 'react'
import { useAuth } from '../contexts/AuthContext'
import styles from './LoginModal.module.css'

interface LoginModalProps {
  open: boolean
  onClose: () => void
}

export function LoginModal({ open, onClose }: LoginModalProps) {
  const { login } = useAuth()
  const [account, setAccount] = useState('')
  const [password, setPassword] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError('')
    setSubmitting(true)
    try {
      await login({ account, password })
      setAccount('')
      setPassword('')
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : '登录失败，请重试')
    } finally {
      setSubmitting(false)
    }
  }

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) onClose()
  }

  if (!open) return null

  return (
    <div
      className={styles.overlay}
      onClick={handleBackdropClick}
      role="dialog"
      aria-modal="true"
      aria-labelledby="login-title"
    >
      <div className={styles.card}>
        <button
          type="button"
          className={styles.closeBtn}
          onClick={onClose}
          aria-label="关闭"
        >
          <span className="material-symbols-outlined">close</span>
        </button>
        <div className={styles.inner}>
          <h3 id="login-title" className={styles.title}>
            登录
          </h3>
          <p className={styles.hint}>使用数据库中的用户名和密码</p>
          <form className={styles.form} onSubmit={handleSubmit}>
            <input
              type="text"
              className={styles.input}
              placeholder="用户名"
              value={account}
              onChange={(e) => setAccount(e.target.value)}
              autoComplete="username"
              required
            />
            <input
              type="password"
              className={styles.input}
              placeholder="密码"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              required
            />
            {error && <p className={styles.errorText}>{error}</p>}
            <button
              type="submit"
              className={styles.submitBtn}
              disabled={submitting}
            >
              {submitting ? '登录中…' : '登录'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
