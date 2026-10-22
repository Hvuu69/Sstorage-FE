import { ROLES } from '../../../app/routeConfig.js'
import { request } from '../../../shared/api/http.js'

const validRoles = new Set(Object.values(ROLES))

export function toCurrentUser(response) {
  const email = response?.email ?? response?.username
  const role = response?.role ?? response?.roles?.find((candidate) => validRoles.has(candidate))

  if (!response?.accessToken || !email || !validRoles.has(role)) {
    throw new Error('Máy chủ trả về thông tin đăng nhập không hợp lệ.')
  }

  return {
    userId: response.userId ?? response.id ?? email,
    email,
    fullName: response.fullName ?? response.name ?? email,
    role,
    dealerId: response.dealerId ?? null,
    accessToken: response.accessToken,
  }
}

export const authApi = {
  login: async ({ email, password }) => {
    const response = await request('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email: email.trim(), password }),
    })
    return toCurrentUser(response)
  },
}
