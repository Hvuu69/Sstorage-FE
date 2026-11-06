import { useState } from 'react'
import { NavLink, useNavigate, useLocation } from 'react-router-dom'
import { routesForRole } from '../../app/routeConfig.js'
import { useAuth } from '../../features/auth/authContext.js'

const s = {
  aside: { width: '260px', backgroundColor: '#fff', borderRight: '1px solid #e5e7eb', display: 'flex', flexDirection: 'column', height: '100%', flexShrink: 0 },
  brandContainer: { padding: '20px', borderBottom: '1px solid #e5e7eb', display: 'flex', alignItems: 'center', gap: '12px' },
  logoIconWrapper: { width: '40px', height: '40px', backgroundColor: '#2563eb', borderRadius: '10px', display: 'flex', justifyContent: 'center', alignItems: 'center' },
  logoTextWrapper: { display: 'flex', flexDirection: 'column', justifyContent: 'center' },
  logoTitle: { fontSize: '18px', fontWeight: '800', color: '#111827', letterSpacing: '0.5px', lineHeight: 1 },
  logoSub: { fontSize: '10px', color: '#6b7280', textTransform: 'uppercase', letterSpacing: '1px', marginTop: '4px' },
  nav: { flex: 1, overflowY: 'auto', padding: '16px 12px' },
  groupTitle: { fontSize: '11px', fontWeight: 'bold', color: '#9ca3af', textTransform: 'uppercase', margin: '16px 0 8px 12px' },
  item: { display: 'flex', alignItems: 'center', padding: '10px 12px', borderRadius: '8px', color: '#4b5563', textDecoration: 'none', fontSize: '14px', fontWeight: '500', marginBottom: '4px' },
  
  userSection: { padding: '16px', borderTop: '1px solid #e5e7eb', backgroundColor: '#f9fafb', display: 'flex', flexDirection: 'column', gap: '12px' },
  userInfo: { display: 'flex', flexDirection: 'column', gap: '4px' },
  userName: { fontSize: '13px', color: '#111827', fontWeight: 'bold', wordBreak: 'break-all' },
  userRole: { fontSize: '11px', color: '#6b7280', textTransform: 'uppercase' },
  
  btnGroup: { display: 'flex', gap: '8px' },
  btnRefresh: { flex: 1, padding: '8px', backgroundColor: '#fff', color: '#374151', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '13px', fontWeight: '600', cursor: 'pointer' },
  btnLogout: { flex: 1, padding: '8px', backgroundColor: '#fee2e2', color: '#b91c1c', border: '1px solid #fca5a5', borderRadius: '6px', fontSize: '13px', fontWeight: '600', cursor: 'pointer' },

  // CSS cho Toast thông báo
  toast: { position: 'fixed', bottom: '24px', right: '24px', backgroundColor: '#10b981', color: '#fff', padding: '12px 24px', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '8px', zIndex: 200, boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)', animation: 'slideIn 0.3s ease-out' },
  toastLoading: { position: 'fixed', bottom: '24px', right: '24px', backgroundColor: '#3b82f6', color: '#fff', padding: '12px 24px', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '8px', zIndex: 200, boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' },

  modalOverlay: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 100 },
  modalBox: { backgroundColor: '#fff', padding: '24px', borderRadius: '12px', width: '320px', textAlign: 'center', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' },
  modalTitle: { fontSize: '18px', fontWeight: 'bold', color: '#111827', marginBottom: '8px' },
  modalText: { fontSize: '14px', color: '#6b7280', marginBottom: '24px' },
  modalActions: { display: 'flex', gap: '12px', justifyContent: 'center' }
};

export default function Sidebar({ user, open, onNavigate }) {
  const routes = routesForRole(user?.role)
  const { logout } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  const [isRefreshing, setIsRefreshing] = useState(false)
  const [showLogoutModal, setShowLogoutModal] = useState(false)
  
  // State quản lý thông báo Toast
  const [toast, setToast] = useState(null) // { type: 'loading' | 'success', message: '' }

  const groups = routes.reduce((result, route) => {
    result[route.group] ??= []
    result[route.group].push(route)
    return result
  }, {})

  // Hàm Làm mới có kèm thông báo
  const handleRefresh = () => {
    setIsRefreshing(true)
    setToast({ type: 'loading', message: 'Đang làm mới dữ liệu...' })

    setTimeout(() => {
      const currentPath = location.pathname;
      // Kích hoạt load lại dữ liệu
      navigate(currentPath, { replace: true, state: { refreshKey: Date.now() } });
      
      setIsRefreshing(false)
      
      // Hiển thị thông báo thành công
      setToast({ type: 'success', message: 'Làm mới thành công!' })
      
      // Tự động ẩn thông báo sau 3 giây
      setTimeout(() => setToast(null), 3000)
    }, 1000) // Giả lập load 1 giây
  }

  const confirmLogout = async () => {
    setShowLogoutModal(false)
    if(logout) await logout()
    navigate('/login', { replace: true })
  }

  return (
    <>
      <aside className={`sidebar ${open ? 'open' : ''}`} style={s.aside}>
        {/* ... (Phần Logo và Menu giữ nguyên) ... */}
        <div className="brand" style={s.brandContainer}>
          <div style={s.logoIconWrapper}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path>
              <polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline>
              <line x1="12" y1="22.08" x2="12" y2="12"></line>
            </svg>
          </div>
          <div style={s.logoTextWrapper}>
            <div style={s.logoTitle}>SMART<span style={{ color: '#3b82f6' }}>WH</span></div>
            <div style={s.logoSub}>QUẢN LÝ KHO AI</div>
          </div>
        </div>

        <nav aria-label="Điều hướng chính" style={s.nav}>
          {Object.entries(groups).map(([group, items]) => (
            <section className="nav-group" key={group}>
              <p style={s.groupTitle}>{group}</p>
              {items.map((route) => (
                <NavLink 
                  key={route.path} 
                  to={route.path} 
                  onClick={onNavigate} 
                  className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`} 
                  style={({ isActive }) => isActive ? { ...s.item, backgroundColor: '#eff6ff', color: '#2563eb' } : s.item}
                >
                  <span className="nav-icon" aria-hidden="true" style={{ marginRight: '12px' }}>{route.icon}</span>
                  <span>{route.label}</span>
                  {route.status !== 'active' && <small style={{ marginLeft: 'auto', fontSize: '10px', color: '#9ca3af' }}>Chờ API</small>}
                </NavLink>
              ))}
            </section>
          ))}
        </nav>
        
        <div className="sidebar-user" style={s.userSection}>
          <div style={s.userInfo}>
            <strong style={s.userName}>{user?.fullName || user?.email}</strong>
            <span style={s.userRole}>{user?.role}</span>
          </div>
          
          <div style={s.btnGroup}>
            <button onClick={handleRefresh} style={s.btnRefresh} disabled={isRefreshing}>
              {isRefreshing ? 'Đang tải...' : 'Làm mới'}
            </button>
            <button onClick={() => setShowLogoutModal(true)} style={s.btnLogout}>
              Đăng xuất
            </button>
          </div>
        </div>
      </aside>

      {/* HIỂN THỊ TOAST THÔNG BÁO */}
      {toast && (
        <div style={toast.type === 'loading' ? s.toastLoading : s.toast}>
          {toast.type === 'loading' ? (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ animation: 'spin 1s linear infinite' }}>
              <line x1="12" y1="2" x2="12" y2="6"></line><line x1="12" y1="18" x2="12" y2="22"></line><line x1="4.93" y1="4.93" x2="7.76" y2="7.76"></line><line x1="16.24" y1="16.24" x2="19.07" y2="19.07"></line><line x1="2" y1="12" x2="6" y2="12"></line><line x1="18" y1="12" x2="22" y2="12"></line><line x1="4.93" y1="19.07" x2="7.76" y2="16.24"></line><line x1="16.24" y1="7.76" x2="19.07" y2="4.93"></line>
            </svg>
          ) : (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline>
            </svg>
          )}
          <span>{toast.message}</span>
        </div>
      )}

      {/* MODAL XÁC NHẬN ĐĂNG XUẤT */}
      {showLogoutModal && (
        <div style={s.modalOverlay}>
          <div style={s.modalBox}>
            <h3 style={s.modalTitle}>Xác nhận đăng xuất</h3>
            <p style={s.modalText}>Bạn có chắc chắn muốn đăng xuất khỏi hệ thống không?</p>
            <div style={s.modalActions}>
              <button 
                onClick={() => setShowLogoutModal(false)}
                style={{ padding: '8px 16px', borderRadius: '6px', border: '1px solid #d1d5db', backgroundColor: '#fff', cursor: 'pointer' }}
              >
                Hủy
              </button>
              <button 
                onClick={confirmLogout}
                style={{ padding: '8px 16px', borderRadius: '6px', border: 'none', backgroundColor: '#2563eb', color: '#fff', cursor: 'pointer' }}
              >
                Đồng ý
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}