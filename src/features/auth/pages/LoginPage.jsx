import { useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { firstRouteForRole } from '../../../app/routeConfig.js'
import { authApi } from '../api/authApi.js'
import { useAuth } from '../authContext.js'

const REMEMBERED_EMAIL_KEY = 'sstorage.rememberedEmail'

function readRememberedEmail() {
  try { return localStorage.getItem(REMEMBERED_EMAIL_KEY) ?? '' }
  catch { return '' }
}

// ==========================================
// CSS GỘP TRONG CODE
// ==========================================
const s = {
  page: { display: 'flex', minHeight: '100vh', fontFamily: 'sans-serif', backgroundColor: '#f9fafb', overflow: 'hidden' },
  
  // Cột Trái: Branding & Hiệu ứng động
  leftCol: { 
    flex: 1, 
    backgroundColor: '#0a0f1c', 
    color: '#fff', 
    padding: '48px', 
    display: 'flex', 
    flexDirection: 'column', 
    justifyContent: 'center', 
    position: 'relative',
    overflow: 'hidden'
  },
  
  // Quầng sáng động
  glow1: { position: 'absolute', top: '10%', left: '10%', width: '500px', height: '500px', backgroundColor: '#2563eb', borderRadius: '50%', filter: 'blur(120px)', opacity: 0.4, animation: 'moveGlow1 12s infinite alternate ease-in-out' },
  glow2: { position: 'absolute', bottom: '10%', right: '10%', width: '400px', height: '400px', backgroundColor: '#8b5cf6', borderRadius: '50%', filter: 'blur(100px)', opacity: 0.3, animation: 'moveGlow2 15s infinite alternate ease-in-out' },
  glow3: { position: 'absolute', top: '40%', left: '50%', width: '300px', height: '300px', backgroundColor: '#06b6d4', borderRadius: '50%', filter: 'blur(80px)', opacity: 0.2, animation: 'pulseGlow 8s infinite ease-in-out' },

  // Lưới chuyển động
  gridOverlay: {
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
    backgroundImage: 'linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)',
    backgroundSize: '40px 40px',
    animation: 'moveGrid 20s linear infinite',
    zIndex: 1
  },

  // Hiệu ứng tuyết rơi
  snowContainer: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, pointerEvents: 'none', zIndex: 2 },

  logoWrapper: { display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '40px', position: 'relative', zIndex: 10 },
  logoIcon: { width: '40px', height: '40px', backgroundColor: '#2563eb', borderRadius: '10px', display: 'flex', justifyContent: 'center', alignItems: 'center', boxShadow: '0 0 20px rgba(37, 99, 235, 0.5)' },
  logoText: { display: 'flex', flexDirection: 'column' },
  logoTitle: { fontSize: '20px', fontWeight: '800', letterSpacing: '0.5px', lineHeight: 1 },
  logoSub: { fontSize: '10px', color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '1px', marginTop: '4px' },
  heroHeading: { fontSize: '38px', fontWeight: 'bold', lineHeight: 1.2, marginBottom: '16px', position: 'relative', zIndex: 10 },
  heroText: { color: '#9ca3af', fontSize: '16px', maxWidth: '400px', position: 'relative', zIndex: 10, lineHeight: 1.6 },

  // Cột Phải: Form
  rightCol: { flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '24px', backgroundColor: '#f3f4f6', position: 'relative', zIndex: 20 },
  formCard: { backgroundColor: '#fff', padding: '40px', borderRadius: '16px', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1), 0 10px 10px -5px rgba(0,0,0,0.04)', width: '100%', maxWidth: '420px', border: '1px solid #e5e7eb', animation: 'slideIn 0.5s ease-out', transition: 'transform 0.2s' },
  formCardError: { animation: 'shake 0.4s ease-in-out' },
  title: { fontSize: '28px', fontWeight: 'bold', color: '#111827', margin: '0 0 8px 0' },
  subtitle: { fontSize: '14px', color: '#6b7280', margin: '0 0 32px 0' },
  formGroup: { display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: '20px' },
  label: { fontSize: '14px', fontWeight: '500', color: '#374151' },
  input: { padding: '12px', borderRadius: '8px', border: '1px solid #d1d5db', width: '100%', fontSize: '14px', boxSizing: 'border-box', outline: 'none', transition: 'border-color 0.2s, box-shadow 0.2s' },
  passwordWrapper: { position: 'relative', display: 'flex', alignItems: 'center' },
  toggleBtn: { position: 'absolute', right: '12px', background: 'none', border: 'none', cursor: 'pointer', color: '#6b7280', fontSize: '13px', fontWeight: '500' },
  optionsRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' },
  checkboxWrapper: { display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' },
  checkbox: { width: '16px', height: '16px', cursor: 'pointer' },
  rememberText: { fontSize: '14px', color: '#374151' },
  forgotLink: { fontSize: '14px', fontWeight: '500', color: '#2563eb', textDecoration: 'none', cursor: 'pointer', background: 'none', border: 'none', padding: 0 },
  errorBox: { padding: '12px', backgroundColor: '#fee2e2', color: '#991b1b', borderRadius: '8px', fontSize: '14px', marginBottom: '20px', border: '1px solid #fecaca' },
  btnPrimary: { width: '100%', backgroundColor: '#2563eb', color: '#fff', padding: '12px', borderRadius: '8px', border: 'none', cursor: 'pointer', fontWeight: '500', fontSize: '15px', transition: 'background-color 0.2s, transform 0.1s' },
  footerText: { fontSize: '12px', color: '#9ca3af', textAlign: 'center', marginTop: '24px' }
};

// Tạo mảng các hạt tuyết với kích thước, vị trí, tốc độ ngẫu nhiên
const snowflakes = Array.from({ length: 30 }).map((_, i) => ({
  id: i,
  left: `${Math.random() * 100}%`,
  animationDuration: `${Math.random() * 5 + 5}s`, // Từ 5s đến 10s
  animationDelay: `${Math.random() * 5}s`,
  size: `${Math.random() * 4 + 2}px`, // Từ 2px đến 6px
  opacity: Math.random() * 0.6 + 0.2 // Độ mờ 0.2 đến 0.8
}));

if (typeof document !== 'undefined') {
  const styleTag = document.createElement('style');
  styleTag.innerHTML = `
    @keyframes moveGlow1 { 0% { transform: translate(0, 0) scale(1); } 50% { transform: translate(100px, 50px) scale(1.1); } 100% { transform: translate(-50px, 100px) scale(0.9); } }
    @keyframes moveGlow2 { 0% { transform: translate(0, 0) scale(1); } 50% { transform: translate(-100px, -50px) scale(1.2); } 100% { transform: translate(50px, -100px) scale(0.9); } }
    @keyframes pulseGlow { 0%, 100% { opacity: 0.2; transform: scale(1); } 50% { opacity: 0.4; transform: scale(1.2); } }
    @keyframes moveGrid { 0% { background-position: 0 0; } 100% { background-position: 40px 40px; } }
    @keyframes slideIn { from { transform: translateY(30px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
    @keyframes shake { 0%, 100% { transform: translateX(0); } 25% { transform: translateX(-10px); } 50% { transform: translateX(10px); } 75% { transform: translateX(-10px); } }
    
    /* Hiệu ứng tuyết rơi */
    @keyframes fall {
      0% { transform: translateY(-10vh) translateX(0); opacity: 1; }
      100% { transform: translateY(100vh) translateX(20px); opacity: 0; }
    }
    
    input:focus { border-color: #2563eb !important; box-shadow: 0 0 0 4px rgba(37, 99, 235, 0.15) !important; }
    button[type="submit"]:hover { background-color: #1d4ed8 !important; transform: translateY(-1px); }
    button[type="submit"]:active { transform: translateY(1px); }
  `;
  document.head.appendChild(styleTag);
}

export default function LoginPage() {
  const { establishSession } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()
  const [email, setEmail] = useState(readRememberedEmail)
  const [rememberAccount, setRememberAccount] = useState(() => Boolean(readRememberedEmail()))
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [shakeForm, setShakeForm] = useState(false)

  useEffect(() => {
    try {
      if (rememberAccount && email.trim()) localStorage.setItem(REMEMBERED_EMAIL_KEY, email.trim())
      else localStorage.removeItem(REMEMBERED_EMAIL_KEY)
    } catch { /* Ignored */ }
  }, [email, rememberAccount])

  async function handleSubmit(event) {
    event.preventDefault()
    setError('')
    setSubmitting(true)
    setShakeForm(false)
    
    try {
      const user = await authApi.login({ email, password })
      establishSession(user)
      navigate(location.state?.from ?? firstRouteForRole(user.role), { replace: true })
    } catch (loginError) {
      setError(loginError.message || 'Không thể đăng nhập. Vui lòng thử lại.')
      setShakeForm(true)
      setTimeout(() => setShakeForm(false), 500) 
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div style={s.page}>
      {/* CỘT TRÁI */}
      <div style={s.leftCol}>
        {/* Hiệu ứng nền */}
        <div style={s.glow1}></div>
        <div style={s.glow2}></div>
        <div style={s.glow3}></div>
        <div style={s.gridOverlay}></div>

        {/* HIỆU ỨNG TUYẾT RƠI */}
        <div style={s.snowContainer}>
          {snowflakes.map((flake) => (
            <div
              key={flake.id}
              style={{
                position: 'absolute',
                top: '-10px',
                left: flake.left,
                width: flake.size,
                height: flake.size,
                backgroundColor: '#fff',
                borderRadius: '50%',
                opacity: flake.opacity,
                animation: `fall ${flake.animationDuration} linear infinite`,
                animationDelay: flake.animationDelay,
                boxShadow: '0 0 4px rgba(255, 255, 255, 0.8)'
              }}
            />
          ))}
        </div>

        <div style={s.logoWrapper}>
          <div style={s.logoIcon}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path>
              <polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline>
              <line x1="12" y1="22.08" x2="12" y2="12"></line>
            </svg>
          </div>
          <div style={s.logoText}>
            <div style={s.logoTitle}>SMART<span style={{ color: '#3b82f6' }}>WH</span></div>
            <div style={s.logoSub}>QUẢN LÝ KHO AI</div>
          </div>
        </div>

        <h1 style={s.heroHeading}>
          Vận hành kho rõ ràng.<br />
          <span style={{ color: '#3b82f6' }}>Kiểm soát theo vai trò.</span>
        </h1>
        <p style={s.heroText}>
          Một kho tổng · Đối tác đại lý · Nhập xuất · Kiểm kê · Phân tích nhu cầu.
        </p>
      </div>

      {/* CỘT PHẢI */}
      <div style={s.rightCol}>
        <div style={shakeForm ? { ...s.formCard, ...s.formCardError } : s.formCard}>
          <h2 style={s.title}>Đăng nhập hệ thống</h2>
          <p style={s.subtitle}>Nhập email và mật khẩu tài khoản của bạn để tiếp tục.</p>
          
          <form onSubmit={handleSubmit}>
            {error && <div style={s.errorBox} role="alert">{error}</div>}

            <div style={s.formGroup}>
              <label style={s.label}>Email</label>
              <input type="email" style={s.input} placeholder="ban@example.com" value={email} onChange={(e) => setEmail(e.target.value)} required autoFocus disabled={submitting} />
            </div>

            <div style={s.formGroup}>
              <label style={s.label}>Mật khẩu</label>
              <div style={s.passwordWrapper}>
                <input type={showPassword ? 'text' : 'password'} style={s.input} placeholder="Nhập mật khẩu" value={password} onChange={(e) => setPassword(e.target.value)} required disabled={submitting} />
                <button type="button" style={s.toggleBtn} onClick={() => setShowPassword(!showPassword)} disabled={submitting}>{showPassword ? 'Ẩn' : 'Hiện'}</button>
              </div>
            </div>

            <div style={s.optionsRow}>
              <label style={s.checkboxWrapper}>
                <input type="checkbox" style={s.checkbox} checked={rememberAccount} onChange={(e) => setRememberAccount(e.target.checked)} disabled={submitting} />
                <span style={s.rememberText}>Ghi nhớ tài khoản</span>
              </label>
              <button type="button" style={s.forgotLink}>Quên mật khẩu?</button>
            </div>

            <button type="submit" style={{ ...s.btnPrimary, opacity: submitting ? 0.7 : 1 }} disabled={submitting}>
              {submitting ? 'Đang xác thực...' : 'Đăng nhập'}
            </button>
          </form>
          
          <div style={s.footerText}></div>
        </div>
      </div>
    </div>
  )
}