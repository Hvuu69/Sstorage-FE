import { normalizePage, request } from '../../../shared/api/http.js'

export const dealerApi = {
  list: async (query, options = {}) => normalizePage(await request('/api/v1/dealers', { query, signal: options.signal })),
  get: (id, options = {}) => request(`/api/v1/dealers/${id}`, { signal: options.signal }),
  create: (payload) => request('/api/v1/dealers', { method: 'POST', body: JSON.stringify(payload) }),
  update: (id, payload) => request(`/api/v1/dealers/${id}`, { method: 'PUT', body: JSON.stringify(payload) }),
  changeStatus: (id, active) => request(`/api/v1/dealers/${id}/status`, { method: 'PATCH', body: JSON.stringify({ active }) }),
}
