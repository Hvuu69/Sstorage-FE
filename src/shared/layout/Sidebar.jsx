import { NavLink } from 'react-router-dom'
import { routesForRole } from '../../app/routeConfig.js'

export default function Sidebar({ user, open, onNavigate }) {
  const routes = routesForRole(user?.role)
  const groups = routes.reduce((result, route) => {
    result[route.group] ??= []
    result[route.group].push(route)
    return result
  }, {})

  return <aside className={`sidebar ${open ? 'open' : ''}`}>
    <div className="brand"><div>▣ SMART<span>WH</span></div><small>Warehouse Management</small></div>
    <nav aria-label="Điều hướng chính">{Object.entries(groups).map(([group, items]) => <section className="nav-group" key={group}><p>{group}</p>{items.map((route) => <NavLink key={route.path} to={route.path} onClick={onNavigate} className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}><span className="nav-icon" aria-hidden="true">{route.icon}</span><span>{route.label}</span>{route.status !== 'active' && <small>Chờ API</small>}</NavLink>)}</section>)}</nav>
    <div className="sidebar-user"><strong>{user?.fullName}</strong><span>{user?.role}</span>{user?.previewOnly && <em>DEV PREVIEW</em>}</div>
  </aside>
}
