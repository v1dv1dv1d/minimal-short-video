import { useRef, useEffect, useState } from 'react'
import type { VideoItem } from '../data/videos'
import styles from './VideoCard.module.css'

interface VideoCardProps {
  video: VideoItem
  isActive: boolean
  isPrev: boolean
  isNext: boolean
}

export function VideoCard({ video, isActive }: VideoCardProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const [liked, setLiked] = useState(false)
  const [likeCount, setLikeCount] = useState(video.likes)

  useEffect(() => {
    const el = videoRef.current
    if (!el) return
    if (isActive) {
      el.play().catch(() => {})
    } else {
      el.pause()
    }
  }, [isActive])

  const toggleLike = () => {
    setLiked((prev) => !prev)
    setLikeCount((c) => (liked ? c - 1 : c + 1))
  }

  return (
    <div className={styles.card}>
      <div className={styles.videoWrap}>
        <video
          ref={videoRef}
          className={styles.video}
          src={video.videoUrl}
          poster={video.coverUrl}
          loop
          muted
          playsInline
          preload="metadata"
        />
        <div className={styles.gradient} />
      </div>

      <div className={styles.content}>
        <div className={styles.bottom}>
          <div className={styles.author}>
            <img
              className={styles.avatar}
              src={video.author.avatar}
              alt={video.author.name}
            />
            <span className={styles.authorName}>{video.author.name}</span>
          </div>
          <p className={styles.description}>{video.description}</p>
        </div>

        <div className={styles.actions}>
          <button
            type="button"
            className={styles.actionBtn}
            onClick={toggleLike}
            aria-label="点赞"
          >
            <span className={styles.actionIcon}>
              {liked ? (
                <svg viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
                </svg>
              ) : (
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                </svg>
              )}
            </span>
            <span className={styles.actionCount}>{likeCount}</span>
          </button>
          <button type="button" className={styles.actionBtn} aria-label="评论">
            <span className={styles.actionIcon}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
              </svg>
            </span>
            <span className={styles.actionCount}>{video.comments}</span>
          </button>
          <button type="button" className={styles.actionBtn} aria-label="分享">
            <span className={styles.actionIcon}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="18" cy="5" r="3" />
                <circle cx="6" cy="12" r="3" />
                <circle cx="18" cy="19" r="3" />
                <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
                <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
              </svg>
            </span>
            <span className={styles.actionCount}>分享</span>
          </button>
        </div>
      </div>
    </div>
  )
}
