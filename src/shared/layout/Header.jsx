import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../features/auth/authContext.js'
import Breadcrumb from '../ui/Breadcrumb.jsx'
import Button from '../ui/Button.jsx'

export default function Header({ onMenu }) {
  const { currentUser } = useAuth() // Chỉ lấy currentUser, không cần logout nữa
  
 
}