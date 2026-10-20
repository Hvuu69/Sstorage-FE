import { useAuth } from './authContext.js'

export default function PermissionGate({ roles, fallback = null, children }) {
  const { currentUser } = useAuth()
  return currentUser && roles.includes(currentUser.role) ? children : fallback
}
