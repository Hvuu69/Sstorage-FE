import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Field, Input } from '../../../shared/ui/FormControls.jsx'
import { authApi } from '../api/authApi.js'

export default function ForgotPasswordPage() {
  const navigate = useNavigate()
  const [step, setStep] = useState(1)
  const [email, setEmail] = useState('')
  const [otp, setOtp] = useState('')
  const [resetToken, setResetToken] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  async function submit(event) {
    event.preventDefault()
    setError('')
    setMessage('')
    if (step === 3 && password !== confirmPassword) {
      setError('Mật khẩu xác nhận không khớp.')
      return
    }
    setBusy(true)
    try {
      if (step === 1) {
        await authApi.requestPasswordReset({ email })
        setMessage('Nếu email đã đăng ký, mã xác thực sẽ được gửi đến hộp thư của bạn.')
        setStep(2)
      } else if (step === 2) {
        const result = await authApi.verifyPasswordResetOtp({ email, otp })
        setResetToken(result.resetToken)
        setStep(3)
      } else {
        await authApi.completePasswordReset({ email, resetToken, password, confirmPassword })
        navigate('/login', { replace: true, state: { passwordReset: true } })
      }
    } catch (requestError) {
      setError(requestError.message || 'Không thể xử lý yêu cầu. Vui lòng thử lại.')
    } finally {
      setBusy(false)
    }
  }

  return <div className="auth-card">
    <div className="eyebrow">SMARTWH · KHÔI PHỤC TÀI KHOẢN</div>
    <h2>{step === 1 ? 'Quên mật khẩu' : step === 2 ? 'Xác thực email' : 'Tạo mật khẩu mới'}</h2>
    <p>{step === 1 ? 'Nhập email đăng nhập để nhận mã OTP đặt lại mật khẩu.' : step === 2 ? `Nhập mã OTP gồm 6 chữ số đã gửi đến ${email}.` : 'Tạo mật khẩu mới và nhập lại để xác nhận.'}</p>
    <form className="login-form" onSubmit={submit}>
      {step === 1 && <Field label="Email đăng nhập"><Input type="email" autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} required autoFocus disabled={busy} /></Field>}
      {step === 2 && <Field label="Mã OTP"><Input inputMode="numeric" autoComplete="one-time-code" pattern="[0-9]{6}" maxLength={6} placeholder="6 chữ số" value={otp} onChange={(event) => setOtp(event.target.value.replace(/\D/g, '').slice(0, 6))} required autoFocus disabled={busy} /></Field>}
      {step === 3 && <>
        <Field label="Mật khẩu mới" hint="Tối thiểu 8 ký tự."><Input type="password" autoComplete="new-password" minLength={8} maxLength={72} value={password} onChange={(event) => setPassword(event.target.value)} required autoFocus disabled={busy} /></Field>
        <Field label="Xác nhận mật khẩu"><Input type="password" autoComplete="new-password" minLength={8} maxLength={72} value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} required disabled={busy} /></Field>
      </>}
      {message && <p className="password-reset-message" role="status">{message}</p>}
      {error && <p className="login-error" role="alert">{error}</p>}
      <button className="btn primary login-submit" type="submit" disabled={busy}>
        {busy ? 'Đang xử lý…' : step === 1 ? 'Gửi mã OTP' : step === 2 ? 'Xác nhận mã' : 'Đổi mật khẩu'}
      </button>
      {step === 2 && <button className="btn text" type="button" disabled={busy} onClick={() => { setStep(1); setError(''); setMessage('') }}>Đổi email</button>}
    </form>
    <Link className="forgot-password-link" to="/login">Quay lại đăng nhập</Link>
  </div>
}
