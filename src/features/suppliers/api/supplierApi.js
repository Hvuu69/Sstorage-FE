import { normalizePage, request } from '../../../shared/api/http.js'

export const supplierApi = {
  list: async (query, options = {}) => normalizePage(await request('/api/v1/suppliers', { query, signal: options.signal })),
  get: (id, options = {}) => request(`/api/v1/suppliers/${id}`, { signal: options.signal }),
  create: (payload) => request('/api/v1/suppliers', { method: 'POST', body: JSON.stringify(payload) }),
  update: (id, payload) => request(`/api/v1/suppliers/${id}`, { method: 'PUT', body: JSON.stringify(payload) }),
  changeStatus: (id, active) => request(`/api/v1/suppliers/${id}/status`, { method: 'PATCH', body: JSON.stringify({ active }) }),
}
