import { useEffect, useMemo, useState } from 'react'
import { ROLES } from '../../app/routeConfig.js'
import { configureAccessTokenProvider, configureHttpAuthHandlers } from '../../shared/api/http.js'
import { AuthContext, validateCurrentUser } from './authContext.js'

function developmentUser() {
  const env = import.meta.env ?? {}
  if (!env.DEV || env.VITE_ENABLE_DEV_AUTH !== 'true') return null
  const validRoles = new Set(Object.values(ROLES))
  const role = validRoles.has(env.VITE_DEV_AUTH_ROLE) ? env.VITE_DEV_AUTH_ROLE : ROLES.WAREHOUSE_MANAGER
  return { userId: 'development-preview', email: 'preview@localhost', fullName: 'Development Preview', role, dealerId: role === ROLES.DEALER ? 'development-dealer' : null, accessToken: null, previewOnly: true }
}

export default function AuthProvider({ children, initialUser = null, authAdapter = null }) {
  const [currentUser, setCurrentUser] = useState(() => validateCurrentUser(initialUser) ?? developmentUser())
  const [loading, setLoading] = useState(Boolean(authAdapter?.restoreSession))
  const [authorizationError, setAuthorizationError] = useState(null)

  useEffect(() => {
    let active = true
    if (!authAdapter?.restoreSession) return undefined
    Promise.resolve(authAdapter.restoreSession())
      .then((user) => { if (active) setCurrentUser(validateCurrentUser(user)) })
      .catch(() => { if (active) setCurrentUser(null) })
      .finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [authAdapter])

  useEffect(() => { configureAccessTokenProvider(() => currentUser?.previewOnly ? null : currentUser?.accessToken ?? null) }, [currentUser])
  useEffect(() => {
    configureHttpAuthHandlers({ onUnauthorized: () => setCurrentUser(null), onForbidden: (error) => setAuthorizationError(error) })
    return () => configureHttpAuthHandlers()
  }, [])

  const value = useMemo(() => ({ currentUser, loading, authorizationError, clearAuthorizationError: () => setAuthorizationError(null), establishSession: (user) => setCurrentUser(validateCurrentUser(user)), async logout() { try { await authAdapter?.logout?.() } finally { setCurrentUser(null) } } }), [authAdapter, authorizationError, currentUser, loading])
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
