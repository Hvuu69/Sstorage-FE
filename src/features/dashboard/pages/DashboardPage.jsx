import { PageHeader } from '../../../shared/ui/index.js'

export default function DashboardPage() {
  return <div className="page"><PageHeader title="Tổng quan kho" description="Không gian tổng hợp vận hành dành cho Quản lý kho." /><div className="integration-banner"><strong>Đang chờ Dashboard API</strong><p>Khung này sẽ hiển thị tồn kho, nhập/xuất, yêu cầu đại lý và cảnh báo khi các API tương ứng được thống nhất. Không có số liệu giả.</p></div><div className="dashboard-grid">{['Tồn kho hiện tại', 'Phiếu nhập / xuất', 'Yêu cầu đại lý', 'Cảnh báo cần xử lý'].map((title) => <section className="metric-card skeleton-card" key={title}><span>{title}</span><strong>—</strong><small>Chờ tích hợp API</small></section>)}</div><section className="card placeholder-panel"><h2>Hoạt động gần đây</h2><p>Dữ liệu audit và giao dịch sẽ xuất hiện tại đây sau khi backend cung cấp contract chính thức.</p></section></div>
}
