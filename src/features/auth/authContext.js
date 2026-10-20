import { createContext, useContext } from 'react'
import { ROLES } from '../../app/routeConfig.js'

export const AuthContext = createContext(null)
const validRoles = new Set(Object.values(ROLES))

export function validateCurrentUser(user) {
  if (!user || !user.userId || !user.email || !user.fullName || !validRoles.has(user.role)) return null
  return { userId: user.userId, email: user.email, fullName: user.fullName, role: user.role, dealerId: user.dealerId ?? null, accessToken: user.accessToken ?? null, previewOnly: Boolean(user.previewOnly) }
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth must be used inside AuthProvider.')
  return context
}
