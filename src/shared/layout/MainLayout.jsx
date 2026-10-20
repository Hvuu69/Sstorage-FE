import { useState } from 'react'
import { Outlet } from 'react-router-dom'
import { useAuth } from '../../features/auth/authContext.js'
import Header from './Header.jsx'
import Sidebar from './Sidebar.jsx'

export default function MainLayout() {
  const { currentUser, authorizationError, clearAuthorizationError } = useAuth()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  return <div className="app-shell"><Sidebar user={currentUser} open={sidebarOpen} onNavigate={() => setSidebarOpen(false)} />{sidebarOpen && <button className="sidebar-overlay" aria-label="Đóng menu" onClick={() => setSidebarOpen(false)} />}<div className="workspace"><Header onMenu={() => setSidebarOpen((value) => !value)} /><main className="main-content"><Outlet /></main></div>{authorizationError && <div className="toast error" role="alert"><span>{authorizationError.message}</span><button aria-label="Đóng thông báo" onClick={clearAuthorizationError}>×</button></div>}</div>
}
