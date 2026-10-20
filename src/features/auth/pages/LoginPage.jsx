import { Link } from 'react-router-dom'
import { useAuth } from '../authContext.js'

export default function LoginPage() {
  const { currentUser } = useAuth()
  return <div className="auth-card"><div className="eyebrow">SMARTWH · AUTH FOUNDATION</div><h2>Đăng nhập hệ thống</h2><p>Giao diện đăng nhập đang chờ module Auth kết nối. Không có tài khoản, mật khẩu hoặc token giả trong runtime production.</p>{currentUser?.previewOnly ? <Link className="btn primary button-link" to="/">Tiếp tục với Development Preview</Link> : <div className="notice">Auth Developer cần gọi <code>establishSession(currentUser)</code> sau khi xác thực thành công. Xem tài liệu Frontend Module Contract.</div>}<small>Contract: userId, email, fullName, role, dealerId, accessToken.</small></div>
}
