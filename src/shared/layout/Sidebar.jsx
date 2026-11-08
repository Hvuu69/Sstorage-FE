import { useState, useEffect } from 'react'
import { NavLink, useNavigate, useLocation } from 'react-router-dom'
import { routesForRole } from '../../app/routeConfig.js'
import { useAuth } from '../../features/auth/authContext.js'

// ==========================================
// CSS GỘP TRONG CODE
// ==========================================
const s = {
  aside: { width: '260px', backgroundColor: '#fff', borderRight: '1px solid #e5e7eb', display: 'flex', flexDirection: 'column', height: '100%', flexShrink: 0, position: 'relative', zIndex: 10 },
  brandContainer: { padding: '20px', borderBottom: '1px solid #e5e7eb', display: 'flex', alignItems: 'center', gap: '12px' },
  logoIconWrapper: { width: '40px', height: '40px', backgroundColor: '#2563eb', borderRadius: '10px', display: 'flex', justifyContent: 'center', alignItems: 'center', boxShadow: '0 4px 12px rgba(37, 99, 235, 0.3)' },
  logoTextWrapper: { display: 'flex', flexDirection: 'column', justifyContent: 'center' },
  logoTitle: { fontSize: '18px', fontWeight: '800', color: '#111827', letterSpacing: '0.5px', lineHeight: 1 },
  logoSub: { fontSize: '10px', color: '#6b7280', textTransform: 'uppercase', letterSpacing: '1px', marginTop: '4px' },
  
  nav: { flex: 1, overflowY: 'auto', padding: '16px 12px' },
  groupTitle: { fontSize: '11px', fontWeight: 'bold', color: '#9ca3af', textTransform: 'uppercase', margin: '16px 0 8px 12px', letterSpacing: '0.5px' },
  item: { display: 'flex', alignItems: 'center', padding: '10px 12px', borderRadius: '8px', color: '#4b5563', textDecoration: 'none', fontSize: '14px', fontWeight: '500', marginBottom: '4px', transition: 'all 0.2s' },
  
  // User Section
  userSection: { padding: '16px', borderTop: '1px solid #e5e7eb', backgroundColor: '#f9fafb', display: 'flex', flexDirection: 'column', gap: '12px' },
  userInfo: { display: 'flex', flexDirection: 'column', gap: '4px' },
  userName: { fontSize: '13px', color: '#111827', fontWeight: 'bold', wordBreak: 'break-all' },
  userRole: { fontSize: '11px', color: '#6b7280', textTransform: 'uppercase', fontWeight: '600' },
  
  btnGroup: { display: 'flex', gap: '8px' },
  
  // NÚT LÀM MỚI (Style chuyên nghiệp hơn)
  btnRefresh: { 
    flex: 1, 
    display: 'flex', 
    alignItems: 'center', 
    justifyContent: 'center', 
    gap: '6px', 
    padding: '8px', 
    backgroundColor: '#fff', 
    color: '#374151', 
    border: '1px solid #d1d5db', 
    borderRadius: '6px', 
    fontSize: '13px', 
    fontWeight: '600', 
    cursor: 'pointer', 
    transition: 'all 0.2s',
    ':hover': { backgroundColor: '#f3f4f6', borderColor: '#9ca3af' }
  },
  
  // NÚT ĐĂNG XUẤT
  btnLogout: { 
    flex: 1, 
    display: 'flex', 
    alignItems: 'center', 
    justifyContent: 'center', 
    gap: '6px', 
    padding: '8px', 
    backgroundColor: '#fee2e2', 
    color: '#b91c1c', 
    border: '1px solid #fca5a5', 
    borderRadius: '6px', 
    fontSize: '13px', 
    fontWeight: '600', 
    cursor: 'pointer', 
    transition: 'all 0.2s',
    ':hover': { backgroundColor: '#fecaca' }
  },

  // MODAL XÁC NHẬN ĐĂNG XUẤT
  modalOverlay: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 100, backdropFilter: 'blur(4px)' },
  modalBox: { backgroundColor: '#fff', padding: '24px', borderRadius: '16px', width: '320px', textAlign: 'center', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)' },
  modalTitle: { fontSize: '18px', fontWeight: 'bold', color: '#111827', marginBottom: '8px' },
  modalText: { fontSize: '14px', color: '#6b7280', marginBottom: '24px', lineHeight: '1.5' },
  modalActions: { display: 'flex', gap: '12px', justifyContent: 'center' },
  
  // ==========================================
  // UI THÔNG BÁO (TOAST) MỚI - PHONG CÁCH KÍNH MỜ
  // ==========================================
  toastWrapper: { 
    position: 'fixed', 
    top: '24px', 
    right: '24px', 
    zIndex: 9999, 
    display: 'flex', 
    alignItems: 'center', 
    gap: '12px', 
    padding: '14px 20px', 
    borderRadius: '12px', 
    boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1), 0 4px 6px -2px rgba(0,0,0,0.05)', 
    fontWeight: '500', 
    fontSize: '14px', 
    minWidth: '280px',
    border: '1px solid',
    backdropFilter: 'blur(10px)',
    animation: 'slideInRight 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards'
  },
  toastSuccess: { backgroundColor: 'rgba(236, 253, 245, 0.95)', borderColor: '#10b981', color: '#065f46' },
  toastLoading: { backgroundColor: 'rgba(239, 246, 255, 0.95)', borderColor: '#3b82f6', color: '#1e3a8a' },
  toastIcon: { width: '24px', height: '24px', flexShrink: 0 },
  toastClose: { background: 'none', border: 'none', cursor: 'pointer', fontSize: '18px', color: 'inherit', opacity: 0.6, marginLeft: 'auto', transition: 'opacity 0.2s' }
};

// CSS Keyframes
if (typeof document !== 'undefined') {
  const styleTag = document.createElement('style');
  styleTag.innerHTML = `
    @keyframes slideInRight {
      from { transform: translateX(100%); opacity: 0; }
      to { transform: translateX(0); opacity: 1; }
    }
    @keyframes spin {
      from { transform: rotate(0deg); }
      to { transform: rotate(360deg); }
    }
  `;
  document.head.appendChild(styleTag);
}

// Icon Components
const RefreshIcon = ({ isSpinning }) => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ animation: isSpinning ? 'spin 1s linear infinite' : 'none' }}>
    <path d="M23 4v6h-6"></path><path d="M1 20v-6h6"></path><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"></path>
  </svg>
);

const LogoutIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><polyline points="16 17 21 12 16 7"></polyline><line x1="21" y1="12" x2="9" y2="12"></line>
  </svg>
);

export default function Sidebar({ user, open, onNavigate }) {
  const routes = routesForRole(user?.role)
  const { logout } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  const [isRefreshing, setIsRefreshing] = useState(false)
  const [showLogoutModal, setShowLogoutModal] = useState(false)
  const [toast, setToast] = useState(null)

  const groups = routes.reduce((result, route) => {
    result[route.group] ??= []
    result[route.group].push(route)
    return result
  }, {})

  // Tự động ẩn toast sau 3 giây
  useEffect(() => {
    if (toast && toast.type === 'success') {
      const timer = setTimeout(() => setToast(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  const handleRefresh = () => {
    setIsRefreshing(true)
    setToast({ type: 'loading', message: 'Đang làm mới dữ liệu...' })
    
    setTimeout(() => {
      const currentPath = location.pathname;
      navigate(currentPath, { replace: true, state: { refreshKey: Date.now() } });
      setIsRefreshing(false)
      setToast({ type: 'success', message: 'Làm mới thành công!' })
    }, 1000)
  }

  const confirmLogout = async () => {
    setShowLogoutModal(false)
    if(logout) await logout()
    navigate('/login', { replace: true })
  }

  return (
    <>
      <aside className={`sidebar ${open ? 'open' : ''}`} style={s.aside}>
        
        {/* LOGO */}
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

        {/* MENU */}
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
        
        {/* USER & BUTTONS */}
        <div className="sidebar-user" style={s.userSection}>
          <div style={s.userInfo}>
            <strong style={s.userName}>{user?.fullName || user?.email}</strong>
            <span style={s.userRole}>{user?.role}</span>
          </div>
          
          <div style={s.btnGroup}>
            <button onClick={handleRefresh} style={s.btnRefresh} disabled={isRefreshing}>
              <RefreshIcon isSpinning={isRefreshing} />
              {isRefreshing ? 'Đang tải...' : 'Làm mới'}
            </button>
            <button onClick={() => setShowLogoutModal(true)} style={s.btnLogout}>
              <LogoutIcon />
              Đăng xuất
            </button>
          </div>
        </div>
      </aside>

      {/* TOAST THÔNG BÁO MỚI */}
      {toast && (
        <div style={{ ...s.toastWrapper, ...(toast.type === 'loading' ? s.toastLoading : s.toastSuccess) }}>
          {toast.type === 'loading' ? (
            <svg style={{ ...s.toastIcon, animation: 'spin 1s linear infinite' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="12" y1="2" x2="12" y2="6"></line><line x1="12" y1="18" x2="12" y2="22"></line><line x1="4.93" y1="4.93" x2="7.76" y2="7.76"></line><line x1="16.24" y1="16.24" x2="19.07" y2="19.07"></line><line x1="2" y1="12" x2="6" y2="12"></line><line x1="18" y1="12" x2="22" y2="12"></line><line x1="4.93" y1="19.07" x2="7.76" y2="16.24"></line><line x1="16.24" y1="7.76" x2="19.07" y2="4.93"></line>
            </svg>
          ) : (
            <svg style={s.toastIcon} viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline>
            </svg>
          )}
          <span style={{ fontWeight: '600' }}>{toast.message}</span>
          <button onClick={() => setToast(null)} style={s.toastClose}>×</button>
        </div>
      )}

      {/* MODAL XÁC NHẬN ĐĂNG XUẤT */}
      {showLogoutModal && (
        <div style={s.modalOverlay}>
          <div style={s.modalBox}>
            <h3 style={s.modalTitle}>Xác nhận đăng xuất</h3>
            <p style={s.modalText}>Bạn có chắc chắn muốn đăng xuất khỏi hệ thống không?</p>
            <div style={s.modalActions}>
              <button onClick={() => setShowLogoutModal(false)} style={{ padding: '10px 20px', borderRadius: '8px', border: '1px solid #d1d5db', backgroundColor: '#fff', cursor: 'pointer', fontWeight: '500', flex: 1 }}>Hủy</button>
              <button onClick={confirmLogout} style={{ padding: '10px 20px', borderRadius: '8px', border: 'none', backgroundColor: '#2563eb', color: '#fff', cursor: 'pointer', fontWeight: '500', flex: 1 }}>Đồng ý</button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}