import { Link } from 'react-router-dom'

export function ForbiddenPage() {
  return <main className="standalone-state"><h1>403</h1><h2>Không có quyền truy cập</h2><p>Vai trò hiện tại không được phép mở chức năng này.</p><Link className="btn primary button-link" to="/">Về trang phù hợp</Link></main>
}

export function NotFoundPage() {
  return <main className="standalone-state"><h1>404</h1><h2>Không tìm thấy trang</h2><p>Đường dẫn không tồn tại trong cấu hình ứng dụng.</p><Link className="btn primary button-link" to="/">Về trang phù hợp</Link></main>
}
