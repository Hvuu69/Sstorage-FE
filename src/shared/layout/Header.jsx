import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../features/auth/authContext.js'
import Breadcrumb from '../ui/Breadcrumb.jsx'
import Button from '../ui/Button.jsx'

export default function Header({ onMenu }) {
  const { currentUser, logout } = useAuth()
  const navigate = useNavigate()
  async function signOut() {
    await logout()
    navigate('/login', { replace: true })
  }
  return <header className="topbar"><Button className="menu-button" variant="text" aria-label="Mở menu" onClick={onMenu}>☰</Button><div className="topbar-context"><Breadcrumb />{currentUser?.previewOnly && <span className="preview-badge">DEV PREVIEW · KHÔNG JWT</span>}</div><div className="user-actions"><div><strong>{currentUser?.fullName}</strong><span>{currentUser?.email}</span></div><Button variant="secondary" onClick={signOut}>Đăng xuất</Button></div></header>
}
