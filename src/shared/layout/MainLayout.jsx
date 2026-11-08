import { useState } from 'react'
import { Outlet } from 'react-router-dom'
import { useAuth } from '../../features/auth/authContext.js'
import Header from './Header.jsx'
import Sidebar from './Sidebar.jsx'

const layoutStyles = {
  shell: { 
    display: 'flex', 
    height: '100vh', 
    width: '100vw', 
    backgroundColor: '#f9fafb', 
    fontFamily: 'sans-serif',
    overflow: 'hidden' 
  },
  workspace: { 
    display: 'flex', 
    flexDirection: 'column', 
    flex: 1, 
    minWidth: 0, // Quan trọng để tránh bị tràn layout
    height: '100vh'
  },
  mainContent: { 
    flex: 1, 
    overflowY: 'auto', 
    padding: '0' 
  }
};

export default function MainLayout() {
  const { currentUser, authorizationError, clearAuthorizationError } = useAuth()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <div className="app-shell" style={layoutStyles.shell}>
      <Sidebar 
        user={currentUser} 
        open={sidebarOpen} 
        onNavigate={() => setSidebarOpen(false)} 
      />
      
      {sidebarOpen && (
        <button 
          className="sidebar-overlay" 
          aria-label="Đóng menu" 
          onClick={() => setSidebarOpen(false)} 
          style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 40, border: 'none' }}
        />
      )}
      
      <div className="workspace" style={layoutStyles.workspace}>
        <Header onMenu={() => setSidebarOpen((value) => !value)} />
        <main className="main-content" style={layoutStyles.mainContent}>
          <Outlet />
        </main>
      </div>

      {authorizationError && (
        <div className="toast error" role="alert" style={{ position: 'fixed', bottom: '24px', right: '24px', backgroundColor: '#fee2e2', color: '#991b1b', padding: '16px', borderRadius: '8px', display: 'flex', gap: '16px', zIndex: 50 }}>
          <span>{authorizationError.message}</span>
          <button aria-label="Đóng thông báo" onClick={clearAuthorizationError}>×</button>
        </div>
      )}
    </div>
  )
}