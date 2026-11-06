import { useEffect, useState } from 'react'
import { useToast } from '../../../shared/ui/index.js'

export default function DashboardPage() {
  const { currentUser } = useAuth()
  const { notify } = useToast()
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)

  // Gọi API lấy số liệu thật
  useEffect(() => {
    let active = true
    dashboardApi.getStats()
      .then(data => { if (active) { setStats(data); setLoading(false) } })
      .catch(err => { if (active) { notify(err.message, 'error'); setLoading(false) } })
    return () => { active = false }
  }, [notify])

  if (loading) return <div className="p-6">Đang tải dữ liệu...</div>

  return (
    <div className="flex h-screen bg-gray-50 font-sans">
      {/* Sidebar - Giống ảnh */}
      <aside className="w-64 bg-white border-r border-gray-200 flex flex-col">
        <div className="p-6 flex items-center gap-3 border-b border-gray-100">
          <div className="bg-blue-600 p-2 rounded-lg text-white"><Box size={20} /></div>
          <div>
            <h1 className="font-bold text-gray-900 tracking-wider">SMARTWH</h1>
            <p className="text-[10px] text-gray-400">QUẢN LÝ KHO AI</p>
          </div>
        </div>
        
        <nav className="flex-1 p-4 space-y-1">
          <div className="text-xs font-semibold text-gray-400 mb-2 px-2 uppercase tracking-wider">Nhân viên kho</div>
          <a href="#" className="flex items-center gap-3 px-3 py-2 bg-blue-50 text-blue-700 rounded-lg font-medium">
            <LayoutDashboard size={18} /> Tổng quan
          </a>
          <a href="#" className="flex items-center gap-3 px-3 py-2 text-gray-600 hover:bg-gray-50 rounded-lg">
            <ArrowDownToLine size={18} /> Nhập kho
          </a>
          <a href="#" className="flex items-center gap-3 px-3 py-2 text-gray-600 hover:bg-gray-50 rounded-lg">
            <ArrowUpFromLine size={18} /> Xuất kho
          </a>
          <a href="#" className="flex items-center gap-3 px-3 py-2 text-gray-600 hover:bg-gray-50 rounded-lg">
            <Package size={18} /> Tồn kho
          </a>
          <a href="#" className="flex items-center gap-3 px-3 py-2 text-gray-600 hover:bg-gray-50 rounded-lg">
            <ClipboardList size={18} /> Kiểm kê
          </a>
          <a href="#" className="flex items-center gap-3 px-3 py-2 text-gray-600 hover:bg-gray-50 rounded-lg">
            <ScanLine size={18} /> Quét QR / RFID
          </a>
        </nav>

        <div className="p-4 border-t border-gray-100">
          <div className="bg-gray-50 p-3 rounded-lg mb-3">
            <p className="font-medium text-sm text-gray-900">{currentUser?.name || 'Lê Ngọc Mai'}</p>
            <p className="text-xs text-gray-500">{currentUser?.role || 'Nhân viên kho'} · DEMO</p>
          </div>
          <div className="flex gap-2">
            <button className="flex-1 py-1.5 text-sm border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50">Đặt lại</button>
            <button className="flex-1 py-1.5 text-sm border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50">Thoát</button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-y-auto">
        {/* Topbar */}
        <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6">
          <p className="text-sm text-gray-500">Kho trung tâm duy nhất · Dữ liệu lưu cục bộ</p>
          <span className="bg-yellow-100 text-yellow-800 text-xs font-semibold px-2.5 py-1 rounded">DEMO</span>
        </header>

        {/* Dashboard Content */}
        <div className="p-6 space-y-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Tổng quan kho hàng</h2>
            <p className="text-sm text-gray-500 mt-1">Dữ liệu trực tiếp từ mô hình dùng chung của bản demo</p>
          </div>

          {/* Thẻ thống kê (Lấy dữ liệu thật từ API) */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <StatCard title="Sản phẩm" value={stats?.totalProducts} />
            <StatCard title="Tổng số lượng tồn" value={stats?.totalStock} />
            <StatCard title="Phiếu nhập hoàn tất" value={stats?.completedImports} />
            <StatCard title="Phiếu xuất hoàn tất" value={stats?.completedExports} />
            <StatCard title="Yêu cầu chờ duyệt" value={stats?.pendingRequests} />
            <StatCard title="Cảnh báo dưới mức" value={stats?.lowStockAlerts} />
          </div>

          {/* Hoạt động gần đây & Cần xử lý */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
              <h3 className="font-semibold text-gray-900 mb-4">Hoạt động gần đây</h3>
              <div className="space-y-3">
                {stats?.recentActivities?.map((act, idx) => (
                  <div key={idx} className="flex justify-between items-start bg-gray-50 p-3 rounded-lg">
                    <div>
                      <p className="text-sm font-medium text-gray-800">{act.title}</p>
                      <p className="text-xs text-gray-500">{act.description}</p>
                    </div>
                    <span className="text-xs text-gray-400">{act.time}</span>
                  </div>
                ))}
                {(!stats?.recentActivities || stats.recentActivities.length === 0) && (
                  <p className="text-sm text-gray-500">Chưa có hoạt động nào.</p>
                )}
              </div>
            </div>

            <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
              <h3 className="font-semibold text-gray-900 mb-4">Cần xử lý</h3>
              <div className="space-y-3">
                {stats?.pendingApprovals?.map((req, idx) => (
                  <div key={idx} className="flex justify-between items-center border border-gray-200 p-3 rounded-lg">
                    <div>
                      <p className="text-sm font-bold text-gray-900">{req.code}</p>
                      <p className="text-xs text-gray-500">{req.quantity} sản phẩm</p>
                    </div>
                    <span className={`text-xs font-semibold px-2 py-1 rounded ${req.status === 'PENDING' ? 'bg-yellow-100 text-yellow-800' : 'bg-blue-100 text-blue-800'}`}>
                      {req.status === 'PENDING' ? 'Chờ duyệt' : 'Đã duyệt'}
                    </span>
                  </div>
                ))}
              </div>
              <button className="mt-4 px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50">
                Xem chi tiết
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}

// Component phụ cho thẻ thống kê
function StatCard({ title, value }) {
  return (
    <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm flex flex-col justify-between">
      <p className="text-sm text-gray-500 font-medium">{title}</p>
      <p className="text-3xl font-bold text-gray-900 mt-2">{value || 0}</p>
    </div>
  )
}