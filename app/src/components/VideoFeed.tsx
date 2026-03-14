import { useCallback, useRef, useState } from 'react'
import { VideoCard } from './VideoCard'
import type { VideoItem } from '../data/videos'
import styles from './VideoFeed.module.css'

interface VideoFeedProps {
  videos: VideoItem[]
  currentIndex: number
  onIndexChange: (index: number) => void
}

const TOUCH_THRESHOLD = 50

const WHEEL_COOLDOWN = 400

export function VideoFeed({ videos, currentIndex, onIndexChange }: VideoFeedProps) {
  const wheelLock = useRef(false)
  const [touchStartY, setTouchStartY] = useState(0)
  const [touchEndY, setTouchEndY] = useState(0)

  const goNext = useCallback(() => {
    onIndexChange(Math.min(currentIndex + 1, videos.length - 1))
  }, [currentIndex, videos.length, onIndexChange])

  const goPrev = useCallback(() => {
    onIndexChange(Math.max(currentIndex - 1, 0))
  }, [currentIndex, onIndexChange])

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

  return (
    <div
      className={styles.feed}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onWheel={handleWheel}
    >
      {videos.map((video, index) => (
        <div
          key={video.id}
          className={styles.slide}
          style={{ transform: `translateY(${(index - currentIndex) * 100}%)` }}
        >
          <VideoCard
            video={video}
            isActive={index === currentIndex}
            isPrev={index === currentIndex - 1}
            isNext={index === currentIndex + 1}
          />
        </div>
      ))}
    </div>
  )
}
