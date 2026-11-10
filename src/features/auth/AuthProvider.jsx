import { useEffect, useMemo, useRef, useState } from 'react'
import { ROLES } from '../../app/routeConfig.js'
import {
  configureAccessTokenProvider,
  configureHttpAuthHandlers,
} from '../../shared/api/http.js'
import {
  AuthContext,
  validateCurrentUser,
} from './authContext.js'

const STORAGE_KEY = 'sstorage.auth'

let memoryAccessToken = null

function developmentUser() {
  const env = import.meta.env ?? {}

  if (!env.DEV || env.VITE_ENABLE_DEV_AUTH !== 'true') {
    return null
  }

  const validRoles = new Set(Object.values(ROLES))

  const role = validRoles.has(env.VITE_DEV_AUTH_ROLE)
    ? env.VITE_DEV_AUTH_ROLE
    : ROLES.WAREHOUSE_MANAGER

  return {
    userId: 'development-preview',
    email: 'preview@localhost',
    fullName: 'Development Preview',
    role,
    dealerId: role === ROLES.DEALER
      ? 'development-dealer'
      : null,
    accessToken: null,
    previewOnly: true,
  }
}

function readStoredUser() {
  if (typeof localStorage === 'undefined') {
    return null
  }

  try {
    const raw = localStorage.getItem(STORAGE_KEY)

    if (!raw) return null

    const user = validateCurrentUser(JSON.parse(raw))

    return user?.accessToken ? user : null
  } catch {
    try {
      localStorage.removeItem(STORAGE_KEY)
    } catch {
      // Storage may be unavailable.
    }

    return null
  }
}

function storeUser(user) {
  memoryAccessToken = user?.accessToken ?? null

  if (typeof localStorage === 'undefined') {
    return
  }

  try {
    if (user?.accessToken) {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify(user)
      )
    } else {
      localStorage.removeItem(STORAGE_KEY)
    }
  } catch {
    // In-memory token remains available for this tab.
  }
}

/*
 * Đăng ký token provider ngay khi module được nạp.
 * Không phụ thuộc vào thời điểm useEffect của AuthProvider chạy.
 */
configureAccessTokenProvider(() => {
  const storedUser = readStoredUser()

  return storedUser?.accessToken ?? memoryAccessToken
})

export default function AuthProvider({
  children,
  initialUser = null,
  authAdapter = null,
}) {
  const [currentUser, setCurrentUser] = useState(
    () =>
      validateCurrentUser(initialUser) ??
      readStoredUser() ??
      developmentUser()
  )
  const initialUserRef = useRef(currentUser)

  const [loading, setLoading] = useState(
    Boolean(authAdapter?.restoreSession)
  )

  const [authorizationError, setAuthorizationError] =
    useState(null)

  // Sử dụng ref để giữ token/user mới nhất mà không cần cấu hình lại provider
  const userRef = useRef(currentUser)
  
  useEffect(() => {
    userRef.current = currentUser
  }, [currentUser])

  useEffect(() => {
    let active = true

    if (!authAdapter?.restoreSession) {
      return undefined
    }

    Promise.resolve(authAdapter.restoreSession(initialUserRef.current))
      .then((user) => {
        if (!active) return

        const validUser = validateCurrentUser(user)

        setCurrentUser(validUser)
        storeUser(validUser)
      })
      .catch(() => {
        if (!active) return

        setCurrentUser(null)
        storeUser(null)
      })
      .finally(() => {
        if (active) {
          setLoading(false)
        }
      })

    return () => {
      active = false
    }
  }, [authAdapter])

  // ✅ SỬA TẠI ĐÂY: Chạy 1 lần duy nhất, đọc từ userRef để luôn lấy token mới nhất
  useEffect(() => { 
    configureAccessTokenProvider(() => {
      if (userRef.current?.previewOnly) return null;
      return userRef.current?.accessToken ?? null;
    }) 
  }, [])
  
  useEffect(() => {
    configureHttpAuthHandlers({ 
      onUnauthorized: () => { 
        setCurrentUser(null); 
        storeUser(null) 
      }, 
      onForbidden: (error) => {
        // BỎ QUA KHÔNG LƯU LỖI 403 VÀO STATE ĐỂ KHÔNG HIỂN THỊ RA UI
        console.warn("Forbidden access:", error?.message);
      } 
    })
    return () => configureHttpAuthHandlers()
  }, [])

  const value = useMemo(() => ({
    currentUser,
    loading,
    authorizationError,

    clearAuthorizationError() {
      setAuthorizationError(null)
    },

    establishSession(user) {
      const validUser = validateCurrentUser(user)

      if (!validUser?.accessToken) {
        throw new Error(
          'Thông tin phiên đăng nhập không hợp lệ.'
        )
      }

      // Lưu token ngay trước khi chuyển trang.
      storeUser(validUser)
      setCurrentUser(validUser)
    },

    async logout() {
      try {
        await authAdapter?.logout?.()
      } finally {
        storeUser(null)
        setCurrentUser(null)
      }
    },
  }), [
    authAdapter,
    authorizationError,
    currentUser,
    loading,
  ])

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}
