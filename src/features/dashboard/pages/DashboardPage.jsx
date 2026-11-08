import { useEffect, useState } from 'react'
import { useAuth } from '../../auth/authContext.js'

// ==========================================
// CSS GỘP TRONG CODE
// ==========================================
const s = {
  page: { padding: '24px', backgroundColor: '#f9fafb', minHeight: '100vh', fontFamily: 'sans-serif', display: 'flex', flexDirection: 'column', gap: '24px' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' },
  title: { fontSize: '24px', fontWeight: 'bold', color: '#111827', margin: 0 },
  subtitle: { fontSize: '14px', color: '#6b7280', margin: '4px 0 0 0' },
  
  // Grid thống kê
  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '20px' },
  metricCard: { 
    backgroundColor: '#fff', borderRadius: '12px', padding: '24px', 
    border: '1px solid #e5e7eb', boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
    display: 'flex', flexDirection: 'column', gap: '8px'
  },
  metricLabel: { fontSize: '14px', fontWeight: '500', color: '#6b7280' },
  metricValue: { fontSize: '32px', fontWeight: 'bold', color: '#111827', margin: 0 },
  metricNote: { fontSize: '12px', color: '#9ca3af', margin: 0 },
  
  // Banner cảnh báo chờ API
  banner: { 
    backgroundColor: '#fef3c7', border: '1px solid #fcd34d', color: '#92400e', 
    padding: '16px', borderRadius: '12px', display: 'flex', flexDirection: 'column', gap: '4px' 
  },
  bannerTitle: { fontWeight: 'bold', fontSize: '15px', margin: 0 },
  bannerText: { fontSize: '14px', margin: 0 },

  // Card Hoạt động gần đây
  card: { backgroundColor: '#fff', borderRadius: '12px', border: '1px solid #e5e7eb', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', padding: '24px' },
  cardTitle: { fontSize: '18px', fontWeight: 'bold', color: '#111827', margin: '0 0 16px 0' },
  emptyText: { fontSize: '14px', color: '#6b7280', textAlign: 'center', padding: '40px 0' }
};

export default function DashboardPage() {
  const { currentUser } = useAuth()

  // State giả lập cho các chỉ số (Sẽ được thay bằng API sau này)
  const [stats, setStats] = useState({
    inventory: '—',
    imports: '—',
    exports: '—',
    requests: '—',
    alerts: '—',
  })

  return (
    <div style={s.page}>
      <div style={s.header}>
        <div>
          <h1 style={s.title}>Tổng quan kho</h1>
          <p style={s.subtitle}>Không gian tổng hợp vận hành dành cho {currentUser?.role === 'WAREHOUSE_MANAGER' ? 'Quản lý kho' : 'Nhân viên'}.</p>
        </div>
      </div>

      {/* Thông báo chờ API */}
      <div style={s.banner}>
        <h3 style={s.bannerTitle}>Đang chờ Dashboard API</h3>
        <p style={s.bannerText}>Khung này sẽ hiển thị số liệu thực tế khi Backend cung cấp API. Hiện tại đang hiển thị dữ liệu mẫu (Placeholder).</p>
      </div>

      {/* Lưới thống kê */}
      <div style={s.grid}>
        <div style={s.metricCard}>
          <span style={s.metricLabel}>Tồn kho hiện tại</span>
          <p style={s.metricValue}>{stats.inventory}</p>
          <p style={s.metricNote}>Tổng số lượng sản phẩm trong kho</p>
        </div>
        <div style={s.metricCard}>
          <span style={s.metricLabel}>Phiếu nhập / xuất</span>
          <p style={s.metricValue}>{stats.imports} / {stats.exports}</p>
          <p style={s.metricNote}>Số phiếu trong tháng này</p>
        </div>
        <div style={s.metricCard}>
          <span style={s.metricLabel}>Yêu cầu đại lý</span>
          <p style={s.metricValue}>{stats.requests}</p>
          <p style={s.metricNote}>Yêu cầu đang chờ duyệt</p>
        </div>
        <div style={s.metricCard}>
          <span style={s.metricLabel}>Cảnh báo cần xử lý</span>
          <p style={{ ...s.metricValue, color: '#dc2626' }}>{stats.alerts}</p>
          <p style={s.metricNote}>Sản phẩm dưới mức tồn kho tối thiểu</p>
        </div>
      </div>

      {/* Hoạt động gần đây */}
      <div style={s.card}>
        <h2 style={s.cardTitle}>Hoạt động gần đây</h2>
        <div style={s.emptyText}>
          Dữ liệu audit và giao dịch sẽ xuất hiện tại đây sau khi backend cung cấp contract chính thức.
        </div>
      </div>
    </div>
  )
}