import { normalizePage, request } from '../../../shared/api/http.js'

export const productApi = {
  list: async (query, options = {}) => normalizePage(await request('/api/v1/products', { query, signal: options.signal })),
  get: (id, options = {}) => request(`/api/v1/products/${id}`, { signal: options.signal }),
  create: (payload) => request('/api/v1/products', { method: 'POST', body: JSON.stringify(payload) }),
  update: (id, payload) => request(`/api/v1/products/${id}`, { method: 'PUT', body: JSON.stringify(payload) }),
  changeStatus: (id, status) => request(`/api/v1/products/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status }) }),
}

export const importApi = {
  list: async (query, options = {}) => normalizePage(await request('/api/v1/imports', { query, signal: options.signal, skipAuthRedirect: true })),
  get: (id, options = {}) => request(`/api/v1/imports/${id}`, { signal: options.signal, skipAuthRedirect: true }),
  create: (payload) => request('/api/v1/imports', { method: 'POST', body: JSON.stringify(payload) }),
  complete: (id) => request(`/api/v1/imports/${id}/complete`, { method: 'PATCH' }),
  cancel: (id) => request(`/api/v1/imports/${id}/cancel`, { method: 'PATCH' }),
}

export const exportApi = {
  list: async (query, options = {}) => normalizePage(await request('/api/v1/exports', { query, signal: options.signal, skipAuthRedirect: true })),
  get: (id, options = {}) => request(`/api/v1/exports/${id}`, { signal: options.signal, skipAuthRedirect: true }),
  create: (payload) => request('/api/v1/exports', { method: 'POST', body: JSON.stringify(payload) }),
  complete: (id) => request(`/api/v1/exports/${id}/complete`, { method: 'PATCH' }),
  cancel: (id) => request(`/api/v1/exports/${id}/cancel`, { method: 'PATCH' }),
}

export const supplierApi = {
  list: () => request('/api/v1/suppliers', { skipAuthRedirect: true }),
  create: (name) => request('/api/v1/suppliers', { method: 'POST', body: JSON.stringify({ name }) }),
}