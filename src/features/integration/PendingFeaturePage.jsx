import { routeByPath } from '../../app/routeConfig.js'
import { PageHeader } from '../../shared/ui/index.js'

const descriptions = {
  suppliers: 'Quản lý hồ sơ nhà cung cấp phục vụ nhập kho.', dealers: 'Quản lý hồ sơ đối tác đại lý, tách biệt với tài khoản đăng nhập.',
  'dealer-requests': 'Tạo, theo dõi và xét duyệt yêu cầu hàng theo đúng phạm vi đại lý.', inbound: 'Lập và xác nhận phiếu nhập kho.', outbound: 'Lập và xác nhận phiếu xuất cho đại lý.',
  inventory: 'Tra cứu số lượng tồn nội bộ theo sản phẩm.', stocktaking: 'Tạo phiên, kiểm đếm và phê duyệt kiểm kê.', identification: 'Tra cứu mã QR/RFID đã được gán cho sản phẩm.',
  'ai-forecast': 'Hiển thị kết quả dự báo từ mô hình đã được đánh giá.', alerts: 'Theo dõi cảnh báo tồn kho theo chính sách.', reports: 'Tổng hợp báo cáo vận hành kho.',
  users: 'Quản lý tài khoản hệ thống.', roles: 'Quản lý vai trò và ma trận quyền.', audit: 'Tra cứu nhật ký thao tác hệ thống.',
}

export default function PendingFeaturePage({ path }) {
  const route = routeByPath(path)
  return <div className="page"><PageHeader title={route?.label ?? 'Chức năng'} description={descriptions[route?.module] ?? ''} /><section className="card pending-page"><div className="pending-icon">⌁</div><h2>Giao diện nền đã sẵn sàng</h2><p>Module <strong>{route?.label}</strong> đang chờ thành viên phụ trách tích hợp nghiệp vụ và API chính thức.</p><ul><li>Đã có route, layout, RBAC navigation và responsive shell.</li><li>Chưa gọi API hoặc hiển thị dữ liệu sản xuất giả.</li><li>Không có thao tác xác nhận giả thành công.</li></ul></section></div>
}
