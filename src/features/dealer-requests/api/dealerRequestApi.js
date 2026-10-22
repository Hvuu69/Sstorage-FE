import { normalizePage, request } from '../../../shared/api/http.js'

export const dealerRequestApi = {
  create: (payload) => request('/api/v1/dealer-requests', { method: 'POST', body: JSON.stringify(payload) }),
  listMine: async (query, options = {}) => normalizePage(await request('/api/v1/dealer-requests/my', { query, signal: options.signal })),
  getMine: (id, options = {}) => request(`/api/v1/dealer-requests/my/${id}`, { signal: options.signal }),
  listAll: async (query, options = {}) => normalizePage(await request('/api/v1/dealer-requests', { query, signal: options.signal })),
  get: (id, options = {}) => request(`/api/v1/dealer-requests/${id}`, { signal: options.signal }),
  approve: (id) => request(`/api/v1/dealer-requests/${id}/approve`, { method: 'POST' }),
  reject: (id, reason) => request(`/api/v1/dealer-requests/${id}/reject`, { method: 'POST', body: JSON.stringify({ reason }) }),
  listApproved: async (query, options = {}) => normalizePage(await request('/api/v1/dealer-requests/approved', { query, signal: options.signal })),
}
