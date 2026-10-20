const env = import.meta.env ?? {}
const API_BASE_URL = (env.VITE_API_BASE_URL ?? 'http://localhost:8081').replace(/\/$/, '')

let accessTokenProvider = () => null
let authHandlers = { onUnauthorized: null, onForbidden: null }

export class ApiError extends Error {
  constructor(problem, status, fallbackMessage) {
    super(problem?.detail ?? fallbackMessage ?? 'Không thể xử lý yêu cầu.')
    this.name = 'ApiError'
    this.status = status
    this.errorCode = problem?.errorCode ?? (status === 0 ? 'NETWORK_ERROR' : undefined)
    this.fieldErrors = problem?.fieldErrors ?? {}
    this.problem = problem ?? null
  }
}

export function configureAccessTokenProvider(provider) {
  accessTokenProvider = typeof provider === 'function' ? provider : () => null
}

export function configureHttpAuthHandlers(handlers = {}) {
  authHandlers = { onUnauthorized: handlers.onUnauthorized ?? null, onForbidden: handlers.onForbidden ?? null }
}

export function buildQuery(params = {}) {
  const query = new URLSearchParams()
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') query.set(key, String(value))
  })
  const result = query.toString()
  return result ? `?${result}` : ''
}

export function normalizePage(page = {}) {
  return {
    content: Array.isArray(page.content) ? page.content : [],
    page: Number(page.page ?? 0),
    size: Number(page.size ?? 0),
    totalElements: Number(page.totalElements ?? 0),
    totalPages: Number(page.totalPages ?? 0),
    sort: Array.isArray(page.sort) ? page.sort : [],
  }
}

export async function request(path, options = {}) {
  const { query, headers, ...fetchOptions } = options
  const token = await accessTokenProvider()
  let response
  try {
    response = await fetch(`${API_BASE_URL}${path}${buildQuery(query)}`, {
      ...fetchOptions,
      credentials: 'include',
      headers: {
        Accept: 'application/json',
        ...(fetchOptions.body ? { 'Content-Type': 'application/json' } : {}),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...headers,
      },
    })
  } catch (error) {
    if (error?.name === 'AbortError') throw new ApiError({ detail: 'Yêu cầu đã bị hủy.', errorCode: 'REQUEST_ABORTED' }, 0)
    throw new ApiError({ detail: 'Không thể kết nối tới máy chủ.', errorCode: 'NETWORK_ERROR' }, 0)
  }

  if (!response.ok) {
    let problem = null
    try { problem = await response.json() } catch { /* response is not JSON */ }
    const error = new ApiError(problem, response.status,
      response.status === 401 ? 'Phiên đăng nhập không hợp lệ hoặc đã hết hạn.'
        : response.status === 403 ? 'Bạn không có quyền thực hiện thao tác này.' : undefined)
    if (response.status === 401) authHandlers.onUnauthorized?.(error)
    if (response.status === 403) authHandlers.onForbidden?.(error)
    throw error
  }

  if (response.status === 204) return null
  const contentType = response.headers.get('content-type') ?? ''
  return contentType.includes('json') ? response.json() : response.text()
}
