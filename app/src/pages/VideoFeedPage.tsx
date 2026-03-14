import { useState, useCallback, useRef, useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { BottomNav } from '../components/BottomNav'
import * as videosApi from '../api/videos'
import type { VideoItem } from '../api/types'
import { useAuth } from '../contexts/AuthContext'
import { isBackendConfigured } from '../api/client'
import styles from './VideoFeedPage.module.css'

const TOUCH_THRESHOLD = 50
const WHEEL_COOLDOWN = 400

export function VideoFeedPage() {
  const location = useLocation()
  const [videos, setVideos] = useState<VideoItem[]>([])
  const [loading, setLoading] = useState(true)
  const [currentIndex, setCurrentIndex] = useState(0)
  const [touchStartY, setTouchStartY] = useState(0)
  const [touchEndY, setTouchEndY] = useState(0)
  const [playing, setPlaying] = useState(true)
  const wheelLock = useRef(false)
  const videoRef = useRef<HTMLVideoElement>(null)
  const { user: currentUser } = useAuth()

  // 进入首页或从发布页返回时拉取最新视频流（含刚发布的）
  useEffect(() => {
    setLoading(true)
    videosApi.getFeed().then((list) => {
      setVideos(list)
      setCurrentIndex(0)
      setLoading(false)
    })
  }, [location.pathname])

  const video = videos[currentIndex]

  // 当前视频变化时：加载新 src，并根据 playing 状态播放/暂停
  useEffect(() => {
    const el = videoRef.current
    if (!el || !video) return
    el.src = video.videoUrl
    el.load()
    if (playing) el.play().catch(() => {})
    else el.pause()
  }, [currentIndex, video?.id, video?.videoUrl])

  // 播放/暂停与按钮同步
  useEffect(() => {
    const el = videoRef.current
    if (!el) return
    if (playing) el.play().catch(() => {})
    else el.pause()
  }, [playing])

  const goNext = useCallback(() => {
    setCurrentIndex((i) => Math.min(i + 1, videos.length - 1))
  }, [videos.length])

  const goPrev = useCallback(() => {
    setCurrentIndex((i) => Math.max(i - 1, 0))
  }, [])

  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStartY(e.targetTouches[0].clientY)
  }
  const handleTouchMove = (e: React.TouchEvent) => {
    setTouchEndY(e.targetTouches[0].clientY)
  }
  const handleTouchEnd = () => {
    const diff = touchStartY - touchEndY
    if (Math.abs(diff) > TOUCH_THRESHOLD) {
      if (diff > 0) goNext()
      else goPrev()
    }
    setTouchStartY(0)
    setTouchEndY(0)
  }

  const handleWheel = (e: React.WheelEvent) => {
    if (wheelLock.current) return
    if (e.deltaY > 30) {
      wheelLock.current = true
      goNext()
      setTimeout(() => { wheelLock.current = false }, WHEEL_COOLDOWN)
    } else if (e.deltaY < -30) {
      wheelLock.current = true
      goPrev()
      setTimeout(() => { wheelLock.current = false }, WHEEL_COOLDOWN)
    }
  }

  const handleLike = useCallback(async () => {
    if (!video) return
    if (!isBackendConfigured()) return
    if (!currentUser) return
    const nextLiked = !video.liked
    const delta = nextLiked ? 1 : -1
    setVideos((prev) =>
      prev.map((v, i) =>
        i === currentIndex ? { ...v, liked: nextLiked, likes: v.likes + delta } : v
      )
    )
    try {
      await videosApi.toggleLike(video.id, nextLiked ? 'like' : 'unlike')
    } catch {
      setVideos((prev) =>
        prev.map((v, i) =>
          i === currentIndex ? { ...v, liked: !nextLiked, likes: v.likes - delta } : v
        )
      )
    }
  }, [video, currentIndex, currentUser])

  if (loading) {
    return (
      <div className={styles.page}>
        <div className={styles.loadingWrap}>
          <p>加载中…</p>
        </div>
      </div>
    )
  }

  if (videos.length === 0) {
    return (
      <div className={styles.page}>
        <div className={styles.loadingWrap}>
          <p>暂无视频</p>
        </div>
        <div className={styles.footer}>
          <BottomNav />
        </div>
      </div>
    )
  }

  return (
    <div className={styles.page}>
      <header className={styles.topBar}>
        <div className={styles.topLeft}>
          <span className="material-symbols-outlined">chevron_left</span>
          <span className={styles.title}>极简短视频</span>
        </div>
        <div className={styles.topRight}>
          <span className="material-symbols-outlined">search</span>
          <div className={styles.addBtn}>
            <span className="material-symbols-outlined">add</span>
          </div>
        </div>
      </header>

      <div
        className={styles.videoArea}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onWheel={handleWheel}
      >
        {/* 封面：未播放时或加载中显示 */}
        <div className={styles.videoBg} style={{ backgroundImage: `url(${video.coverUrl})` }}>
          <div className={styles.videoOverlay} />
        </div>
        {/* 真实视频：使用接口返回的 videoUrl，播放时覆盖在封面上 */}
        <video
          ref={videoRef}
          className={styles.videoPlayer}
          src={video.videoUrl}
          poster={video.coverUrl}
          loop
          muted
          playsInline
          onEnded={() => setPlaying(false)}
          onPlay={() => setPlaying(true)}
          onPause={() => setPlaying(false)}
        />
        <button
          type="button"
          className={styles.playBtn}
          onClick={() => setPlaying((p) => !p)}
          aria-label={playing ? '暂停' : '播放'}
        >
          <span className="material-symbols-outlined material-symbols-fill">
            {playing ? 'pause' : 'play_arrow'}
          </span>
        </button>

        <div className={styles.caption}>
          <div className={styles.captionPill}>
            <p className={styles.captionText}>
              @{video.author.name} · {video.description}
            </p>
          </div>
        </div>

        <div className={styles.actions}>
          <div className={styles.profileWrap}>
            <img
              className={styles.profileImg}
              src={video.author.avatar}
              alt={video.author.name}
            />
            <span className={styles.followBadge}>
              <span className="material-symbols-outlined">add</span>
            </span>
          </div>
          <LikeButton
            liked={!!video.liked}
            count={video.likes}
            onClick={handleLike}
            disabled={!currentUser || !isBackendConfigured()}
          />
          <ActionItem icon="chat_bubble" fill count={formatCount(video.comments)} />
          <ActionItem icon="star" fill count="4.2k" />
          <ActionItem icon="share" fill count="分享" />
        </div>
      </div>

      <div className={styles.footer}>
        <div className={styles.swipeHint}>
          <span className="material-symbols-outlined">keyboard_double_arrow_up</span>
          <p>上滑刷下一个视频</p>
        </div>
        <BottomNav />
      </div>
    </div>
  )
}

function formatCount(n: number): string {
  if (n >= 10000) return `${(n / 10000).toFixed(1)}w`
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k`
  return String(n)
}

function LikeButton({
  liked,
  count,
  onClick,
  disabled,
}: {
  liked: boolean
  count: number
  onClick: () => void
  disabled?: boolean
}) {
  return (
    <button
      type="button"
      className={`${styles.actionItem} ${styles.likeBtn}`}
      onClick={(e) => {
        e.stopPropagation()
        if (!disabled) onClick()
      }}
      disabled={disabled}
      aria-label={liked ? '取消点赞' : '点赞'}
    >
      <div className={`${styles.actionCircle} ${liked ? styles.likeBtnActive : ''}`}>
        <span className={`material-symbols-outlined ${liked ? 'material-symbols-fill' : ''} ${styles.likeIcon}`}>
          favorite
        </span>
      </div>
      <span className={styles.actionCount}>{formatCount(count)}</span>
    </button>
  )
}

function ActionItem({
  icon,
  fill,
  count,
}: {
  icon: string
  fill?: boolean
  count: string
}) {
  return (
    <div className={styles.actionItem}>
      <div className={styles.actionCircle}>
        <span
          className={`material-symbols-outlined ${fill ? 'material-symbols-fill' : ''}`}
        >
          {icon}
        </span>
      </div>
      <span className={styles.actionCount}>{count}</span>
    </div>
  )
}
