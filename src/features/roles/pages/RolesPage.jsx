import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { appRoutes, ROLES, routesForRole } from '../../../app/routeConfig.js'
import { PageHeader, SearchBar, StatusBadge } from '../../../shared/ui/index.js'

const ROLE_DETAILS = [
  { code: ROLES.ADMIN, label: 'Quản trị viên', description: 'Quản lý tài khoản và khu vực quản trị hệ thống.' },
  { code: ROLES.WAREHOUSE_MANAGER, label: 'Quản lý kho', description: 'Quản lý master data, vận hành kho và theo dõi phân tích.' },
  { code: ROLES.WAREHOUSE_STAFF, label: 'Nhân viên kho', description: 'Thực hiện và tra cứu các nghiệp vụ kho được phân công.' },
  { code: ROLES.DEALER, label: 'Đại lý', description: 'Tra cứu sản phẩm và quản lý yêu cầu của đại lý.' },
]

const MODULE_STATUS = {
  active: { label: 'Đã kết nối', status: 'ACTIVE' },
  foundation: { label: 'Nền tảng', status: 'PENDING' },
  pending: { label: 'Chờ tích hợp', status: 'PENDING' },
}

export default function RolesPage() {
  const [query, setQuery] = useState('')
  const filteredRoutes = useMemo(() => {
    const normalized = query.trim().toLocaleLowerCase('vi')
    if (!normalized) return appRoutes
    return appRoutes.filter((route) => [route.label, route.path, route.group]
      .some((value) => value.toLocaleLowerCase('vi').includes(normalized)))
  }, [query])

  return <div className="page">
    <PageHeader
      title="Vai trò & quyền truy cập"
      description="Ma trận các trang được phép mở theo từng vai trò hệ thống."
      actions={<Link className="btn secondary button-link" to="/admin/users">Quản lý tài khoản</Link>}
    />

    <section className="role-cards" aria-label="Các vai trò hệ thống">
      {ROLE_DETAILS.map((role) => <article className="role-card" key={role.code}>
        <div className="role-card-heading"><strong>{role.label}</strong><span>{routesForRole(role.code).length} trang</span></div>
        <code>{role.code}</code>
        <p>{role.description}</p>
      </article>)}
    </section>

    <section className="card roles-panel">
      <div className="roles-toolbar">
        <div><h2>Ma trận truy cập trang</h2><p>✓ nghĩa là role có thể mở route theo cấu hình điều hướng.</p></div>
        <SearchBar value={query} onChange={setQuery} label="Tìm chức năng" placeholder="Tìm chức năng hoặc route…" buttonLabel="Tìm" />
      </div>
      <div className="table-wrap">
        <table className="roles-matrix">
          <thead><tr>
            <th scope="col">Chức năng</th>
            {ROLE_DETAILS.map((role) => <th scope="col" key={role.code}>{role.label}</th>)}
            <th scope="col">Trạng thái module</th>
          </tr></thead>
          <tbody>
            {filteredRoutes.map((route) => {
              const moduleStatus = MODULE_STATUS[route.status] ?? MODULE_STATUS.pending
              return <tr key={route.path}>
                <th scope="row"><strong>{route.label}</strong><small>{route.path} · {route.group}</small></th>
                {ROLE_DETAILS.map((role) => {
                  const permitted = route.roles.includes(role.code)
                  return <td className={permitted ? 'permission-cell granted' : 'permission-cell'} key={role.code}>
                    {permitted ? <span aria-label={`Có quyền: ${role.label}`} title={`Có quyền: ${role.label}`}>✓</span> : <span className="permission-empty" aria-label={`Không có quyền: ${role.label}`}>—</span>}
                  </td>
                })}
                <td><StatusBadge status={moduleStatus.status} labels={{ ACTIVE: moduleStatus.label, PENDING: moduleStatus.label }} /></td>
              </tr>
            })}
            {filteredRoutes.length === 0 && <tr><td colSpan={6} className="roles-empty">Không tìm thấy chức năng phù hợp.</td></tr>}
          </tbody>
        </table>
      </div>
      <div className="roles-note" role="note">
        <strong>Chính sách hiện tại:</strong> role được cố định trong backend. Bảng này mô tả quyền mở trang ở frontend; quyền thao tác và API vẫn được backend kiểm tra riêng. Muốn gán role cho người dùng, dùng trang Quản lý tài khoản.
      </div>
    </section>
  </div>
}
