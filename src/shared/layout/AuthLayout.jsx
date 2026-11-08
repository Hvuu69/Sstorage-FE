import { Outlet } from 'react-router-dom'

export default function AuthLayout() {
  // Trang LoginPage đã tự lo giao diện 2 cột và hiệu ứng động,
  // nên AuthLayout chỉ cần hiển thị nội dung của trang con (Outlet).
  return <Outlet />
}