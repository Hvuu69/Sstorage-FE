import { normalizePage, request } from '../../../shared/api/http.js'

export const productApi = {
  list: async (query, options = {}) => normalizePage(await request('/api/v1/products', { query, signal: options.signal })),
  get: (id, options = {}) => request(`/api/v1/products/${id}`, { signal: options.signal }),
  create: (payload) => request('/api/v1/products', { method: 'POST', body: JSON.stringify(payload) }),
  update: (id, payload) => request(`/api/v1/products/${id}`, { method: 'PUT', body: JSON.stringify(payload) }),
  changeStatus: (id, status) => request(`/api/v1/products/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status }) }),
}
