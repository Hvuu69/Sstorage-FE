import { Link, useLocation } from 'react-router-dom'
import { routeByPath } from '../../app/routeConfig.js'

export default function Breadcrumb() {
  const location = useLocation()
  const route = routeByPath(location.pathname)
  return <nav className="breadcrumb" aria-label="Breadcrumb"><Link to="/">Smart Warehouse</Link><span>/</span><span aria-current="page">{route?.label ?? 'Trang'}</span></nav>
}
