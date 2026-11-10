import { normalizePage, request } from '../../../shared/api/http.js'

export const userApi = {
  list: async (query, options = {}) => normalizePage(await request('/api/v1/admin/users', { query, signal: options.signal })),
  get: (id, options = {}) => request(`/api/v1/admin/users/${id}`, { signal: options.signal }),
  create: (payload) => request('/api/v1/admin/users', { method: 'POST', body: JSON.stringify(payload) }),
  update: (id, payload) => request(`/api/v1/admin/users/${id}`, { method: 'PUT', body: JSON.stringify(payload) }),
  changeStatus: (id, status) => request(`/api/v1/admin/users/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status }) }),
}
