export const ROLES = Object.freeze({
  ADMIN: 'ADMIN',
  WAREHOUSE_MANAGER: 'WAREHOUSE_MANAGER',
  WAREHOUSE_STAFF: 'WAREHOUSE_STAFF',
  DEALER: 'DEALER',
})

const { ADMIN, WAREHOUSE_MANAGER: MANAGER, WAREHOUSE_STAFF: STAFF, DEALER } = ROLES

export const appRoutes = Object.freeze([
  { path: '/dashboard', label: 'Tổng quan', icon: '◈', group: 'Vận hành', roles: [MANAGER], module: 'dashboard', status: 'foundation' },
  { path: '/products', label: 'Sản phẩm', icon: '▦', group: 'Danh mục', roles: [MANAGER, STAFF, DEALER], module: 'products', status: 'active' },
  { path: '/categories', label: 'Danh mục', icon: '◇', group: 'Danh mục', roles: [MANAGER], module: 'categories', status: 'active' },
  { path: '/units', label: 'Đơn vị tính', icon: '◫', group: 'Danh mục', roles: [MANAGER], module: 'units', status: 'active' },
  { path: '/suppliers', label: 'Nhà cung cấp', icon: '▣', group: 'Đối tác', roles: [MANAGER], module: 'suppliers', status: 'pending' },
  { path: '/dealers', label: 'Đại lý', icon: '◎', group: 'Đối tác', roles: [MANAGER], module: 'dealers', status: 'pending' },
  { path: '/dealer-requests', label: 'Yêu cầu đại lý', icon: '◩', group: 'Vận hành', roles: [MANAGER, DEALER], module: 'dealer-requests', status: 'pending' },
  { path: '/inbound', label: 'Nhập kho', icon: '↘', group: 'Vận hành', roles: [MANAGER, STAFF], module: 'inbound', status: 'pending' },
  { path: '/outbound', label: 'Xuất kho', icon: '↗', group: 'Vận hành', roles: [MANAGER, STAFF], module: 'outbound', status: 'pending' },
  { path: '/inventory', label: 'Tồn kho', icon: '▤', group: 'Kiểm soát', roles: [MANAGER, STAFF], module: 'inventory', status: 'pending' },
  { path: '/stocktaking', label: 'Kiểm kê', icon: '☷', group: 'Kiểm soát', roles: [MANAGER, STAFF], module: 'stocktaking', status: 'pending' },
  { path: '/identification', label: 'Nhận diện QR/RFID', icon: '⌗', group: 'Kiểm soát', roles: [STAFF], module: 'identification', status: 'pending' },
  { path: '/ai-forecast', label: 'Dự báo AI', icon: '✦', group: 'Phân tích', roles: [MANAGER], module: 'ai-forecast', status: 'pending' },
  { path: '/alerts', label: 'Cảnh báo', icon: '!', group: 'Phân tích', roles: [MANAGER], module: 'alerts', status: 'pending' },
  { path: '/reports', label: 'Báo cáo', icon: '▥', group: 'Phân tích', roles: [MANAGER], module: 'reports', status: 'pending' },
  { path: '/admin/users', label: 'Người dùng', icon: '♙', group: 'Quản trị', roles: [ADMIN], module: 'users', status: 'pending' },
  { path: '/admin/roles', label: 'Vai trò & quyền', icon: '⚿', group: 'Quản trị', roles: [ADMIN], module: 'roles', status: 'pending' },
  { path: '/admin/audit', label: 'Nhật ký', icon: '≡', group: 'Quản trị', roles: [ADMIN], module: 'audit', status: 'pending' },
])

export const publicRoutes = Object.freeze([{ path: '/login', label: 'Đăng nhập' }])

export function routesForRole(role) {
  if (!role) return []
  return appRoutes.filter((route) => route.roles.includes(role))
}

export function canAccessRoute(role, path) {
  const route = appRoutes.find((item) => item.path === path)
  return Boolean(route && role && route.roles.includes(role))
}

export function firstRouteForRole(role) {
  return routesForRole(role)[0]?.path ?? '/login'
}

export function routeByPath(path) {
  return appRoutes.find((route) => route.path === path)
}
