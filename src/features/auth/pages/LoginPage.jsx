import { useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { firstRouteForRole } from '../../../app/routeConfig.js'
import { Field, Input } from '../../../shared/ui/FormControls.jsx'
import { authApi } from '../api/authApi.js'
import { useAuth } from '../authContext.js'
import { BsBoxSeam } from "react-icons/bs";

const REMEMBERED_EMAIL_KEY = 'sstorage.rememberedEmail'

function readRememberedEmail() {
  try { return localStorage.getItem(REMEMBERED_EMAIL_KEY) ?? '' }
  catch { return '' }
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

  useEffect(() => {
    try {
      if (rememberAccount && email.trim()) localStorage.setItem(REMEMBERED_EMAIL_KEY, email.trim())
      else localStorage.removeItem(REMEMBERED_EMAIL_KEY)
    } catch { /* Remembering the account is optional when browser storage is unavailable. */ }
  }, [email, rememberAccount])

  async function handleSubmit(event) {
    event.preventDefault()
    setError('')
    setSubmitting(true)
    try {
      const user = await authApi.login({ email, password })
      establishSession(user)
      navigate(location.state?.from ?? firstRouteForRole(user.role), { replace: true })
    } catch (loginError) {
      setError(loginError.message || 'Không thể đăng nhập. Vui lòng thử lại.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div style={{ 
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 9999,
      display: 'flex', 
      height: '100vh', 
      width: '100vw', 
      overflow: 'hidden', 
      fontFamily: 'system-ui, -apple-system, sans-serif', 
      margin: 0, 
      padding: 0, 
      boxSizing: 'border-box',
      backgroundColor: '#ffffff'
    }}>
      
      {/* CSS ANIMATIONS */}
      <style>
        {`
          @keyframes moveBackground {
            0% { background-position: 0% 50%; }
            50% { background-position: 100% 50%; }
            100% { background-position: 0% 50%; }
          }
          @keyframes floatBlob1 {
            0% { transform: translate(0px, 0px) scale(1); opacity: 0.6; }
            33% { transform: translate(50px, -50px) scale(1.1); opacity: 0.8; }
            66% { transform: translate(-30px, 30px) scale(0.9); opacity: 0.5; }
            100% { transform: translate(0px, 0px) scale(1); opacity: 0.6; }
          }
          @keyframes floatBlob2 {
            0% { transform: translate(0px, 0px) scale(1); opacity: 0.4; }
            50% { transform: translate(-60px, 40px) scale(1.2); opacity: 0.7; }
            100% { transform: translate(0px, 0px) scale(1); opacity: 0.4; }
          }
          @keyframes floatParticle {
            0% { transform: translateY(0px) translateX(0px); opacity: 0; }
            25% { opacity: 0.6; }
            50% { transform: translateY(-100px) translateX(20px); opacity: 0.8; }
            75% { opacity: 0.4; }
            100% { transform: translateY(-200px) translateX(-20px); opacity: 0; }
          }
          @keyframes textGlow {
            0% { text-shadow: 0 0 10px rgba(96, 165, 250, 0.2); }
            50% { text-shadow: 0 0 20px rgba(96, 165, 250, 0.6); }
            100% { text-shadow: 0 0 10px rgba(96, 165, 250, 0.2); }
          }
        `}
      </style>

      {/* Cột trái: Giới thiệu */}
      <div style={{ 
        flex: 1, 
        background: 'linear-gradient(-45deg, #050b14, #0f172a, #172554, #050b14)', 
        backgroundSize: '400% 400%',
        animation: 'moveBackground 20s ease infinite',
        color: '#fff', 
        padding: '48px', 
        display: 'flex', 
        flexDirection: 'column', 
        justifyContent: 'space-between', 
        position: 'relative', 
        overflow: 'hidden' 
      }}>
        
        {/* Hiệu ứng nền */}
        <div style={{ position: 'absolute', top: '10%', left: '10%', width: '500px', height: '500px', background: 'radial-gradient(circle, rgba(59,130,246,0.4) 0%, rgba(15,23,42,0) 60%)', borderRadius: '50%', filter: 'blur(40px)', animation: 'floatBlob1 15s ease-in-out infinite' }}></div>
        <div style={{ position: 'absolute', bottom: '10%', right: '10%', width: '600px', height: '600px', background: 'radial-gradient(circle, rgba(139,92,246,0.3) 0%, rgba(15,23,42,0) 60%)', borderRadius: '50%', filter: 'blur(50px)', animation: 'floatBlob2 18s ease-in-out infinite' }}></div>
        
        {/* Hạt sáng */}
        <div style={{ position: 'absolute', top: '70%', left: '20%', width: '4px', height: '4px', backgroundColor: '#93c5fd', borderRadius: '50%', boxShadow: '0 0 10px #93c5fd', animation: 'floatParticle 8s linear infinite' }}></div>
        <div style={{ position: 'absolute', top: '80%', left: '60%', width: '3px', height: '3px', backgroundColor: '#bfdbfe', borderRadius: '50%', boxShadow: '0 0 8px #bfdbfe', animation: 'floatParticle 10s linear infinite 2s' }}></div>
        <div style={{ position: 'absolute', top: '60%', left: '80%', width: '5px', height: '5px', backgroundColor: '#93c5fd', borderRadius: '50%', boxShadow: '0 0 12px #93c5fd', animation: 'floatParticle 12s linear infinite 4s' }}></div>

        <div style={{ position: 'relative', zIndex: 1, display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ width: '40px', height: '40px', backgroundColor: 'rgba(37, 99, 235, 0.8)', backdropFilter: 'blur(10px)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', display: 'flex', alignItems: 'center', color: '#fff', fontSize: '20px', justifyContent: 'center' }}><BsBoxSeam /></div>
          <div>
            <h1 style={{ fontWeight: 'bold', fontSize: '18px', margin: 0, color: '#fff', lineHeight: 1 }}>SMART<span style={{ color: '#60a5fa' }}>WH</span></h1>
            <p style={{ fontSize: '11px', fontWeight: '600', color: '#94a3b8', margin: '4px 0 0 0', letterSpacing: '0.05em' }}>QUẢN LÝ KHO AI</p>
          </div>
        </div>

        <div style={{ position: 'relative', zIndex: 1, maxWidth: '500px' }}>
          <h2 style={{ fontSize: '40px', fontWeight: '800', lineHeight: '1.2', marginBottom: '24px' }}>
            Vận hành kho trung tâm<br />
            <span style={{ color: '#60a5fa', animation: 'textGlow 3s ease-in-out infinite' }}>minh bạch và nhất quán.</span>
          </h2>
          <p style={{ fontSize: '16px', color: '#cbd5e1', lineHeight: '1.6' }}>
            Quản lý số lượng nhập, xuất, yêu cầu đại lý, kiểm kê và cảnh báo trên một mô hình dữ liệu dùng chung.
          </p>
        </div>

        <div style={{ position: 'relative', zIndex: 1, fontSize: '12px', color: '#64748b' }}>
          
        </div>
      </div>

      {/* Cột phải: Form Đăng nhập - Đã thêm khung (Card) */}
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#f8fafc', padding: '48px', position: 'relative', zIndex: 2 }}>
        
        {/* THÊM KHUNG (CARD) CHO FORM */}
        <div 
          className="auth-card" 
          style={{ 
            width: '100%', 
            maxWidth: '420px', 
            backgroundColor: '#ffffff', // Nền trắng cho khung
            padding: '40px', // Khoảng cách bên trong khung
            borderRadius: '16px', // Bo góc
            boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.05), 0 8px 10px -6px rgba(0, 0, 0, 0.01)', // Đổ bóng nhẹ
            border: '1px solid #e2e8f0' // Viền mỏng
          }}
        >
          <div className="eyebrow" style={{ fontSize: '12px', fontWeight: 'bold', color: '#2563eb', marginBottom: '12px' }}>SMARTWH · AUTH</div>
          <h2 style={{ fontSize: '28px', fontWeight: 'bold', color: '#0f172a', marginBottom: '8px', marginTop: 0 }}>Đăng nhập hệ thống</h2>
          <p style={{ fontSize: '14px', color: '#64748b', marginBottom: '24px', marginTop: 0 }}>Nhập email và mật khẩu tài khoản của bạn để tiếp tục.</p>
          
          <form className="login-form" onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <Field label="Email">
              <Input
                type="email"
                name="email"
                autoComplete="username"
                placeholder="ban@example.com"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                required
                autoFocus
                disabled={submitting}
                style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', outline: 'none', fontSize: '14px', boxSizing: 'border-box' }}
              />
            </Field>
            <Field label="Mật khẩu">
              <span className="password-input-wrap" style={{ position: 'relative', display: 'block' }}>
                <Input
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  autoComplete="current-password"
                  placeholder="Nhập mật khẩu"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  required
                  disabled={submitting}
                  style={{ width: '100%', padding: '10px 12px', paddingRight: '50px', borderRadius: '8px', border: '1px solid #cbd5e1', outline: 'none', fontSize: '14px', boxSizing: 'border-box' }}
                />
                <button
                  className="password-visibility"
                  type="button"
                  aria-label={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                  aria-pressed={showPassword}
                  onClick={() => setShowPassword((visible) => !visible)}
                  disabled={submitting}
                  style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: '#2563eb', fontSize: '13px', fontWeight: '600', cursor: 'pointer' }}
                >
                  {showPassword ? 'Ẩn' : 'Hiện'}
                </button>
              </span>
            </Field>
            
            <label className="remember-account" style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: '#64748b', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={rememberAccount}
                onChange={(event) => setRememberAccount(event.target.checked)}
                disabled={submitting}
                style={{ cursor: 'pointer' }}
              />
              <span>Ghi nhớ tài khoản</span>
            </label>
            
            {error && <p className="login-error" role="alert" style={{ color: '#ef4444', fontSize: '13px', margin: 0 }}>{error}</p>}
            
            <button className="btn primary login-submit" type="submit" disabled={submitting} style={{ width: '100%', padding: '12px', backgroundColor: '#2563eb', color: '#fff', border: 'none', borderRadius: '8px', fontSize: '14px', fontWeight: '600', cursor: submitting ? 'not-allowed' : 'pointer', boxShadow: '0 4px 12px rgba(37,99,235,0.2)', transition: 'background 0.2s', marginTop: '8px' }}>
              {submitting ? 'Đang đăng nhập…' : 'Đăng nhập'}
            </button>
          </form>
          
          <small style={{ display: 'block', marginTop: '32px', paddingTop: '24px', borderTop: '1px solid #e2e8f0', fontSize: '12px', color: '#64748b' }}>
            
          </small>
        </div>
      </div>
    </div>
  )
}