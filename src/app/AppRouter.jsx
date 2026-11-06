import { Navigate, Route, Routes } from 'react-router-dom'
import { appRoutes, canAccessRoute, firstRouteForRole } from './routeConfig.js'
import { useAuth } from '../features/auth/authContext.js'
import { ProtectedRoute, PublicOnlyRoute } from '../features/auth/ProtectedRoute.jsx'
import LoginPage from '../features/auth/pages/LoginPage.jsx'
import CategoryPage from '../features/categories/pages/CategoryPage.jsx'
import DashboardPage from '../features/dashboard/pages/DashboardPage.jsx'
import DealerPage from '../features/dealers/pages/DealerPage.jsx'
import DealerRequestPage from '../features/dealer-requests/pages/DealerRequestPage.jsx'
import { ForbiddenPage, NotFoundPage } from '../features/integration/ErrorPages.jsx'
import PendingFeaturePage from '../features/integration/PendingFeaturePage.jsx'

// 1. IMPORT CÁC COMPONENT MỚI TỪ FILE PRODUCTPAGE.JSX
import ProductPage, { 
  ImportPage, 
  ExportPage, 
  InventoryPage, 
  AuditPage, 
  QrScanPage 
} from '../features/products/pages/ProductPage.jsx'

import UnitPage from '../features/units/pages/UnitPage.jsx'
import AuthLayout from '../shared/layout/AuthLayout.jsx'
import MainLayout from '../shared/layout/MainLayout.jsx'

// 2. KHAI BÁO CÁC TRANG VÀO activePages (Tên key phải khớp với route.module bên routeConfig.js)
const activePages = { 
  dashboard: <DashboardPage />, 
  products: <ProductPage />, 
  categories: <CategoryPage />, 
  units: <UnitPage />, 
  dealers: <DealerPage />, 
  'dealer-requests': <DealerRequestPage />,
  
  // Thêm các trang mới:
  'inventory': <InventoryPage />, // Tồn kho
  'imports': <ImportPage />,      // Nhập kho
  'exports': <ExportPage />,      // Xuất kho
  'audit': <AuditPage />,         // Kiểm kê
  'qr-scan': <QrScanPage />       // Quét QR
}

function HomeRedirect() {
  const { currentUser } = useAuth()
  return <Navigate to={firstRouteForRole(currentUser?.role)} replace />
}

function AuthorizedPage({ route }) {
  const { currentUser } = useAuth()
  if (!canAccessRoute(currentUser?.role, route.path)) return <Navigate to="/forbidden" replace />
  
  // Nếu route.module có trong activePages thì hiển thị, ngược lại hiển thị trang chờ
  return activePages[route.module] ?? <PendingFeaturePage path={route.path} />
}

export default function AppRouter() {
  return <Routes>
    <Route element={<PublicOnlyRoute />}><Route element={<AuthLayout />}><Route path="/login" element={<LoginPage />} /></Route></Route>
    <Route element={<ProtectedRoute />}>
      <Route path="/forbidden" element={<ForbiddenPage />} />
      <Route element={<MainLayout />}>
        <Route index element={<HomeRedirect />} />
        {appRoutes.map((route) => <Route key={route.path} path={route.path} element={<AuthorizedPage route={route} />} />)}
      </Route>
    </Route>
    <Route path="*" element={<NotFoundPage />} />
  </Routes>
}