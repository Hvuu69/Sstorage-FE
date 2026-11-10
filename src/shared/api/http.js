
const env = import.meta.env ?? {}

const API_BASE_URL = (
  env.VITE_API_BASE_URL ?? 'http://localhost:8081'
).replace(/\/$/, '')

let accessTokenProvider = () => null

let authHandlers = {
  onUnauthorized: null,
  onForbidden: null,
}

// Chống các request GET giống nhau chạy đồng thời.
const pendingGetRequests = new Map()

export class ApiError extends Error {
  constructor(problem, status, fallbackMessage) {
    super(
      problem?.detail ??
      problem?.message ??
      fallbackMessage ??
      'Không thể xử lý yêu cầu.',
    )

    this.name = 'ApiError'
    this.status = status

    this.errorCode =
      problem?.errorCode ??
      (status === 0 ? 'NETWORK_ERROR' : undefined)

    this.fieldErrors = problem?.fieldErrors ?? {}
    this.problem = problem ?? null
  }
}

export function configureAccessTokenProvider(provider) {
  accessTokenProvider =
    typeof provider === 'function'
      ? provider
      : () => null
}

export function configureHttpAuthHandlers(handlers = {}) {
  authHandlers = {
    onUnauthorized:
      handlers.onUnauthorized ?? null,

    onForbidden:
      handlers.onForbidden ?? null,
  }
}

export function buildQuery(params = {}) {
  const query = new URLSearchParams()

  Object.entries(params).forEach(([key, value]) => {
    if (
      value !== undefined &&
      value !== null &&
      value !== ''
    ) {
      query.set(key, String(value))
    }
  })

  const result = query.toString()

  return result ? `?${result}` : ''
}

export function normalizePage(page = {}) {
  return {
    content: Array.isArray(page.content)
      ? page.content
      : [],

    page: Number(page.page ?? 0),
    size: Number(page.size ?? 0),

    totalElements: Number(
      page.totalElements ?? 0,
    ),

    totalPages: Number(
      page.totalPages ?? 0,
    ),

    sort: Array.isArray(page.sort)
      ? page.sort
      : [],
  }
}

async function executeRequest(
  url,
  fetchOptions,
  headers,
  token,
) {
  let response

  try {
    response = await fetch(url, {
      ...fetchOptions,

      credentials: 'omit',

      headers: {
        Accept: 'application/json',

        ...(fetchOptions.body
          ? { 'Content-Type': 'application/json' }
          : {}),

        ...(token
          ? { Authorization: `Bearer ${token}` }
          : {}),

        ...headers,
      },
    })
  } catch (error) {
    if (error?.name === 'AbortError') {
      throw new ApiError(
        {
          detail: 'Yêu cầu đã bị hủy.',
          errorCode: 'REQUEST_ABORTED',
        },
        0,
      )
    }

    throw new ApiError(
      {
        detail: 'Không thể kết nối tới máy chủ.',
        errorCode: 'NETWORK_ERROR',
      },
      0,
    )
  }

  if (!response.ok) {
    let problem = null

    try {
      problem = await response.json()
    } catch {
      // Response may not be JSON.
    }

    const error = new ApiError(
      problem,
      response.status,

      response.status === 401
        ? 'Phiên đăng nhập không hợp lệ hoặc đã hết hạn.'
        : response.status === 403
          ? 'Bạn không có quyền thực hiện thao tác này.'
          : undefined,
    )

    /*
     * Chỉ xóa phiên khi request thực sự có JWT.
     * 401 từ request không có token không được phép
     * tự động xóa phiên người dùng.
     */
    if (
      response.status === 401 &&
      token
    ) {
      authHandlers.onUnauthorized?.(error)
    }

    if (response.status === 403) {
      authHandlers.onForbidden?.(error)
    }

    throw error
  }

  if (response.status === 204) {
    return null
  }

  const contentType =
    response.headers.get('content-type') ?? ''

  return contentType.includes('json')
    ? response.json()
    : response.text()
}

export async function request(path, options = {}) {
  const {
    query,
    headers,
    ...fetchOptions
  } = options

  const token = await accessTokenProvider()

  const url =
    `${API_BASE_URL}${path}${buildQuery(query)}`

  const method = (
    fetchOptions.method ?? 'GET'
  ).toUpperCase()

  /*
   * Chỉ gộp GET không có AbortSignal.
   * Không gộp request có signal vì một request bị hủy
   * có thể ảnh hưởng đến request còn lại.
   */
  const canDeduplicate =
    method === 'GET' &&
    !fetchOptions.signal

  const requestKey = canDeduplicate
    ? `${url}::${token ?? 'anonymous'}`
    : null

  if (
    requestKey &&
    pendingGetRequests.has(requestKey)
  ) {
    return pendingGetRequests.get(requestKey)
  }

  const operation = executeRequest(
    url,
    fetchOptions,
    headers,
    token,
  )

  if (requestKey) {
    pendingGetRequests.set(
      requestKey,
      operation,
    )
  }

  try {
    return await operation
  } finally {
    if (
      requestKey &&
      pendingGetRequests.get(requestKey) === operation
    ) {
      pendingGetRequests.delete(requestKey)
    }
  }
}
