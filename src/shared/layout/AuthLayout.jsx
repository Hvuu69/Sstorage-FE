import { Outlet } from 'react-router-dom'

export default function AuthLayout() {
  return <main className="auth-layout"><section className="auth-hero"><div className="brand light">▣ SMART<span>WH</span></div><h1>Vận hành kho rõ ràng.<br /><span>Kiểm soát theo vai trò.</span></h1><p>Một kho tổng · Đối tác đại lý · Nhập xuất · Kiểm kê · Phân tích nhu cầu.</p></section><section className="auth-panel"><Outlet /></section></main>
}
