import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'
import { VideoFeedPage } from './pages/VideoFeedPage'
import { ProfilePage } from './pages/ProfilePage'
import { RecordPage } from './pages/RecordPage'
import { BottomNav } from './components/BottomNav'

function Placeholder({ title }: { title: string }) {
  return (
    <div className="placeholder-page">
      <div style={{ padding: 24, textAlign: 'center', color: '#94a3b8', flex: 1 }}>
        <p style={{ fontSize: 18 }}>{title}</p>
        <p style={{ marginTop: 8, fontSize: 14 }}>敬请期待</p>
      </div>
      <BottomNav />
    </div>
  )
}

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<VideoFeedPage />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/discover" element={<Placeholder title="发现" />} />
          <Route path="/add" element={<RecordPage />} />
          <Route path="/inbox" element={<Placeholder title="消息" />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}

export default App
