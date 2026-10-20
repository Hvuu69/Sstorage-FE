import { normalizePage, request } from '../../../shared/api/http.js'

export const categoryApi = {
  list: async (query, options = {}) => normalizePage(await request('/api/v1/categories', { query, signal: options.signal })),
  get: (id, options = {}) => request(`/api/v1/categories/${id}`, { signal: options.signal }),
  create: (payload) => request('/api/v1/categories', { method: 'POST', body: JSON.stringify(payload) }),
  update: (id, payload) => request(`/api/v1/categories/${id}`, { method: 'PUT', body: JSON.stringify(payload) }),
  changeStatus: (id, active) => request(`/api/v1/categories/${id}/status`, { method: 'PATCH', body: JSON.stringify({ active }) }),
}
