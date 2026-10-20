import { normalizePage, request } from '../../../shared/api/http.js'

export const unitApi = {
  list: async (query, options = {}) => normalizePage(await request('/api/v1/units', { query, signal: options.signal })),
  get: (id, options = {}) => request(`/api/v1/units/${id}`, { signal: options.signal }),
  create: (payload) => request('/api/v1/units', { method: 'POST', body: JSON.stringify(payload) }),
  update: (id, payload) => request(`/api/v1/units/${id}`, { method: 'PUT', body: JSON.stringify(payload) }),
}
