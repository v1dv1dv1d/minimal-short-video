import { useCallback, useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { isBackendConfigured } from '../api/client'
import * as uploadApi from '../api/upload'
import styles from './RecordPage.module.css'
import previewStyles from './RecordPreview.module.css'

type Step = 'record' | 'preview'

function formatTime(seconds: number) {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

export function RecordPage() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const videoRef = useRef<HTMLVideoElement>(null)
  const previewVideoRef = useRef<HTMLVideoElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const recorderRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const recordingRef = useRef(false)

  const [step, setStep] = useState<Step>('record')
  const [error, setError] = useState<string | null>(null)
  const [streamReady, setStreamReady] = useState(false)
  const [recording, setRecording] = useState(false)
  const [recordSeconds, setRecordSeconds] = useState(0)
  const [recordedBlob, setRecordedBlob] = useState<Blob | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const stopStream = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop())
      streamRef.current = null
    }
  }, [])

  useEffect(() => {
    if (step !== 'record') return
    setError(null)
    setStreamReady(false)
    let stream: MediaStream | null = null
    navigator.mediaDevices
      .getUserMedia({ video: true, audio: true })
      .then((s) => {
        stream = s
        streamRef.current = s
        const videoEl = videoRef.current
        if (videoEl) {
          videoEl.srcObject = s
          videoEl.play().catch(() => {})
        }
        setStreamReady(true)
      })
      .catch((err) => {
        setError(err?.message || '无法访问摄像头或麦克风，请允许权限后重试')
      })
    return () => {
      setStreamReady(false)
      if (stream) stream.getTracks().forEach((t) => t.stop())
    }
  }, [step])

  const startRecording = useCallback(() => {
    const stream = streamRef.current
    if (!stream) {
      setError('摄像头未就绪，请允许权限后重试')
      return
    }
    if (recordingRef.current) return
    recordingRef.current = true
    setRecording(true)
    chunksRef.current = []
    let recorder: MediaRecorder
    try {
      const options: MediaRecorderOptions = {}
      if (MediaRecorder.isTypeSupported('video/webm;codecs=vp9')) {
        options.mimeType = 'video/webm;codecs=vp9'
      } else if (MediaRecorder.isTypeSupported('video/webm')) {
        options.mimeType = 'video/webm'
      }
      options.videoBitsPerSecond = 2500000
      options.audioBitsPerSecond = 128000
      recorder = new MediaRecorder(stream, options)
    } catch {
      recorder = new MediaRecorder(stream)
    }
    recorder.ondataavailable = (e) => {
      if (e.data.size) chunksRef.current.push(e.data)
    }
    recorder.onstop = () => {
      recordingRef.current = false
      setRecording(false)
      const blob = new Blob(chunksRef.current, { type: recorder.mimeType })
      setRecordedBlob(blob)
      setPreviewUrl(URL.createObjectURL(blob))
      setStep('preview')
    }
    recorder.onerror = () => {
      recordingRef.current = false
      setError('录制失败，请重试')
      setRecording(false)
      if (timerRef.current) clearInterval(timerRef.current)
    }
    recorder.start(200)
    recorderRef.current = recorder
    setRecordSeconds(0)
    timerRef.current = setInterval(() => {
      setRecordSeconds((s) => s + 1)
    }, 1000)
  }, [])

  const stopRecording = useCallback(() => {
    if (!recordingRef.current || !recorderRef.current) return
    recorderRef.current.stop()
    recorderRef.current = null
    if (timerRef.current) {
      clearInterval(timerRef.current)
      timerRef.current = null
    }
  }, [])

  const handleRecordClick = (e: React.MouseEvent | React.PointerEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (recordingRef.current) stopRecording()
    else startRecording()
  }

  const handleClose = () => {
    stopStream()
    if (timerRef.current) clearInterval(timerRef.current)
    navigate(-1)
  }

  const handleRetake = () => {
    if (previewUrl) URL.revokeObjectURL(previewUrl)
    setPreviewUrl(null)
    setRecordedBlob(null)
    setStep('record')
  }

  const handleConfirm = async () => {
    if (!recordedBlob) return
    setUploadError(null)
    if (!isBackendConfigured()) {
      setUploadError('请先配置后端 API 地址（VITE_API_BASE_URL）')
      return
    }
    if (!user) {
      setUploadError('请先登录后再发布视频')
      return
    }
    setUploading(true)
    try {
      await uploadApi.uploadVideo(recordedBlob)
      if (previewUrl) URL.revokeObjectURL(previewUrl)
      setPreviewUrl(null)
      setRecordedBlob(null)
      navigate('/', { replace: true })
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : '发布失败，请重试')
    } finally {
      setUploading(false)
    }
  }

  if (step === 'preview' && recordedBlob) {
    return (
      <div className={previewStyles.page}>
        <header className={previewStyles.topBar}>
          <button type="button" className={previewStyles.closeBtn} onClick={handleClose} aria-label="关闭">
            <span className="material-symbols-outlined">close</span>
          </button>
          <h2 className={previewStyles.title}>Preview</h2>
        </header>
        <main className={previewStyles.main}>
          <div className={previewStyles.videoWrap}>
            <video
              ref={previewVideoRef}
              src={previewUrl ?? undefined}
              controls
              playsInline
              className={previewStyles.video}
            />
          </div>
        </main>
        <footer className={previewStyles.footer}>
          {uploadError && (
            <p className={previewStyles.uploadError}>{uploadError}</p>
          )}
          <div className={previewStyles.actions}>
            <button
              type="button"
              className={previewStyles.retakeBtn}
              onClick={handleRetake}
              disabled={uploading}
            >
              <span className="material-symbols-outlined">refresh</span>
              Retake
            </button>
            <button
              type="button"
              className={previewStyles.confirmBtn}
              onClick={handleConfirm}
              disabled={uploading}
            >
              <span className="material-symbols-outlined">check_circle</span>
              {uploading ? '发布中…' : '发布'}
            </button>
          </div>
        </footer>
      </div>
    )
  }

  return (
    <div className={styles.page}>
      <div className={styles.cameraWrap}>
        {error ? (
          <div className={styles.error}>
            <p>{error}</p>
            <button type="button" className={styles.errorBtn} onClick={() => navigate(-1)}>
              返回
            </button>
          </div>
        ) : (
          <video ref={videoRef} autoPlay muted playsInline className={styles.video} />
        )}
      </div>

      {!error && (
        <>
          <div className={styles.topBar}>
            <button type="button" className={styles.iconBtn} onClick={handleClose} aria-label="关闭">
              <span className="material-symbols-outlined">close</span>
            </button>
            {recording && (
              <div className={styles.timer}>
                <span className={styles.timerDot} />
                <span>{formatTime(recordSeconds)}</span>
              </div>
            )}
            <div className={styles.topRight}>
              <button type="button" className={styles.iconBtn} aria-label="翻转">
                <span className="material-symbols-outlined">flip_camera_ios</span>
              </button>
              <button type="button" className={styles.iconBtn} aria-label="闪光灯">
                <span className="material-symbols-outlined">flash_on</span>
              </button>
            </div>
          </div>

          <div className={styles.sidebar}>
            <button type="button" className={styles.sideBtn}>
              <span className="material-symbols-outlined">music_note</span>
              <span>Music</span>
            </button>
            <button type="button" className={styles.sideBtn}>
              <span className="material-symbols-outlined">auto_fix_high</span>
              <span>Filters</span>
            </button>
            <button type="button" className={styles.sideBtn}>
              <span className="material-symbols-outlined">timer</span>
              <span>Timer</span>
            </button>
          </div>

          <div className={styles.bottom}>
            <button type="button" className={styles.galleryBtn} aria-label="相册">
              <div className={styles.galleryPlaceholder} />
            </button>
            <div className={styles.recordWrap}>
              <div className={styles.recordRing} aria-hidden />
              <button
                type="button"
                className={styles.recordBtn}
                onClick={handleRecordClick}
                disabled={!streamReady}
                aria-label={recording ? '停止录制' : '开始录制'}
              >
                <span className={styles.recordInner} aria-hidden />
              </button>
              {!streamReady && !error && (
                <span className={styles.recordHint}>正在准备摄像头…</span>
              )}
            </div>
            <button type="button" className={styles.effectsBtn} aria-label="特效">
              <span className="material-symbols-outlined">flare</span>
            </button>
          </div>
          <div className={styles.modeBar}>
            <button type="button" className={styles.modeItem}>Photo</button>
            <button type="button" className={`${styles.modeItem} ${styles.modeActive}`}>Video</button>
            <button type="button" className={styles.modeItem}>Live</button>
          </div>
        </>
      )}
    </div>
  )
}
