import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { firstRouteForRole } from '../../app/routeConfig.js'
import { LoadingState } from '../../shared/ui/AsyncState.jsx'
import { useAuth } from './authContext.js'

export function ProtectedRoute({ roles }) {
  const { currentUser, loading } = useAuth()
  const location = useLocation()
  if (loading) return <LoadingState label="Đang kiểm tra phiên đăng nhập…" fullPage />
  if (!currentUser) return <Navigate to="/login" replace state={{ from: location.pathname }} />
  if (roles && !roles.includes(currentUser.role)) return <Navigate to="/forbidden" replace />
  return <Outlet />
}

export function PublicOnlyRoute() {
  const { currentUser, loading } = useAuth()
  if (loading) return <LoadingState label="Đang kiểm tra phiên đăng nhập…" fullPage />
  return currentUser ? <Navigate to={firstRouteForRole(currentUser.role)} replace /> : <Outlet />
}
