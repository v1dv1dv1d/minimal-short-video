import { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { BottomNav } from '../components/BottomNav'
import { LoginModal } from '../components/LoginModal'
import * as userApi from '../api/user'
import type { UserVideoItem } from '../api/types'
import styles from './ProfilePage.module.css'
import guestStyles from './ProfilePageGuest.module.css'

export function ProfilePage() {
  const { user, logout, refreshUser } = useAuth()
  const [loginModalOpen, setLoginModalOpen] = useState(false)
  const [gridVideos, setGridVideos] = useState<UserVideoItem[]>([])

  // 仅在有用户时拉取最新资料和作品；用 user?.id 避免 refreshUser 更新 user 后触发死循环
  useEffect(() => {
    if (!user) return
    refreshUser()
    userApi.getMyVideos().then(setGridVideos)
  }, [user?.id, refreshUser])

  if (!user) {
    return (
      <>
        <div className={guestStyles.page}>
          <header className={guestStyles.topBar}>
            <span className="material-symbols-outlined">settings</span>
            <h1 className={guestStyles.headerTitle}>个人中心</h1>
            <span className="material-symbols-outlined">share</span>
          </header>
          <main className={guestStyles.main}>
            <div className={guestStyles.card}>
              <div className={guestStyles.avatarPlaceholder}>
                <span className="material-symbols-outlined material-symbols-fill">person</span>
              </div>
              <div className={guestStyles.userInfo}>
                <h2 className={guestStyles.guestTitle}>未登录（退出状态）</h2>
                <p className={guestStyles.guestSubtitle}>
                  请使用数据库中的用户名和密码登录，登录后可查看我的视频与作品
                </p>
              </div>
              <button
                type="button"
                className={guestStyles.loginBtn}
                onClick={() => setLoginModalOpen(true)}
              >
                使用账号密码登录
              </button>
              <div className={guestStyles.quickFeatures}>
                <div className={guestStyles.quickItem}>
                  <span className="material-symbols-outlined">favorite</span>
                  <span>点赞</span>
                </div>
                <div className={guestStyles.quickItem}>
                  <span className="material-symbols-outlined">bookmark</span>
                  <span>收藏</span>
                </div>
                <div className={guestStyles.quickItem}>
                  <span className="material-symbols-outlined">history</span>
                  <span>足迹</span>
                </div>
              </div>
            </div>
          </main>
          <nav className={guestStyles.bottomNav}>
            <BottomNav />
          </nav>
        </div>
        <LoginModal
          open={loginModalOpen}
          onClose={() => setLoginModalOpen(false)}
        />
      </>
    )
  }

  return (
    <div className={styles.page}>
      <header className={styles.topBar}>
        <span className="material-symbols-outlined">arrow_back</span>
        <h1 className={styles.headerTitle}>Profile</h1>
        <span className="material-symbols-outlined">more_horiz</span>
      </header>

      <div className={styles.header}>
        <div className={styles.avatarWrap}>
          <div
            className={styles.avatar}
            style={{ backgroundImage: `url('${user.avatar}')` }}
          />
          <span className={styles.addBadge}>
            <span className="material-symbols-outlined">add</span>
          </span>
        </div>
        <h2 className={styles.username}>@{user.username}</h2>
        <p className={styles.bio}>{user.bio}</p>

        <div className={styles.stats}>
          <div className={styles.stat}>
            <span className={styles.statValue}>{user.following}</span>
            <span className={styles.statLabel}>Following</span>
          </div>
          <div className={styles.stat}>
            <span className={styles.statValue}>{user.followers}</span>
            <span className={styles.statLabel}>Followers</span>
          </div>
          <div className={styles.stat}>
            <span className={styles.statValue}>{user.likes}</span>
            <span className={styles.statLabel}>Likes</span>
          </div>
        </div>

        <div className={styles.actions}>
          <button type="button" className={styles.followBtn}>
            Follow
          </button>
          <button type="button" className={styles.messageBtn}>
            <span className="material-symbols-outlined">mail</span>
          </button>
        </div>
      </div>

      <div className={styles.tabs}>
        <button type="button" className={styles.tabActive}>
          <span className="material-symbols-outlined">grid_on</span>
        </button>
        <button type="button" className={styles.tab}>
          <span className="material-symbols-outlined">favorite</span>
        </button>
        <button type="button" className={styles.tab}>
          <span className="material-symbols-outlined">bookmark</span>
        </button>
      </div>

      <div className={styles.grid}>
        {gridVideos.map((item) => (
          <div key={item.id} className={styles.gridItem}>
            <div
              className={styles.gridCover}
              style={{ backgroundImage: `url(${item.coverUrl})` }}
            />
            <div className={styles.gridMeta}>
              <span className="material-symbols-outlined">play_arrow</span>
              <span>{item.plays}</span>
            </div>
          </div>
        ))}
      </div>

      <div className={styles.exitWrap}>
        <button type="button" className={styles.exitBtn} onClick={() => logout()}>
          <span className="material-symbols-outlined">logout</span>
          Exit
        </button>
      </div>

      <div className={styles.bottomNavWrap}>
        <BottomNav />
      </div>
    </div>
  )
}
