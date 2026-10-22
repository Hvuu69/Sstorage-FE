import { useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { firstRouteForRole } from '../../../app/routeConfig.js'
import { Field, Input } from '../../../shared/ui/FormControls.jsx'
import { authApi } from '../api/authApi.js'
import { useAuth } from '../authContext.js'

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
    <div className="auth-card">
      <div className="eyebrow">SMARTWH · AUTH</div>
      <h2>Đăng nhập hệ thống</h2>
      <p>Nhập email và mật khẩu tài khoản của bạn để tiếp tục.</p>
      <form className="login-form" onSubmit={handleSubmit}>
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
          />
        </Field>
        <Field label="Mật khẩu">
          <span className="password-input-wrap">
            <Input
              type={showPassword ? 'text' : 'password'}
              name="password"
              autoComplete="current-password"
              placeholder="Nhập mật khẩu"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
              disabled={submitting}
            />
            <button
              className="password-visibility"
              type="button"
              aria-label={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
              aria-pressed={showPassword}
              onClick={() => setShowPassword((visible) => !visible)}
              disabled={submitting}
            >
              {showPassword ? 'Ẩn' : 'Hiện'}
            </button>
          </span>
        </Field>
        <label className="remember-account">
          <input
            type="checkbox"
            checked={rememberAccount}
            onChange={(event) => setRememberAccount(event.target.checked)}
            disabled={submitting}
          />
          <span>Ghi nhớ tài khoản</span>
        </label>
        {error && <p className="login-error" role="alert">{error}</p>}
        <button className="btn primary login-submit" type="submit" disabled={submitting}>
          {submitting ? 'Đang đăng nhập…' : 'Đăng nhập'}
        </button>
      </form>
      <small>Phiên đăng nhập được bảo vệ bằng token do máy chủ cấp.</small>
    </div>
  )
}
