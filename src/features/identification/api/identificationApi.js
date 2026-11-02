import { request } from '../../../shared/api/http.js'

export const identificationApi = {
  lookup: (code, options = {}) => request('/api/v1/identifiers/lookup', { query: { code }, signal: options.signal }),
  listForProduct: (productId, options = {}) => request(`/api/v1/products/${productId}/identifiers`, { signal: options.signal }),
  create: (productId, payload) => request(`/api/v1/products/${productId}/identifiers`, { method: 'POST', body: JSON.stringify(payload) }),
  changeStatus: (id, active) => request(`/api/v1/identifiers/${id}/status`, { method: 'PATCH', body: JSON.stringify({ active }) }),
  qrCode: (productId, identifierId, options = {}) => request(`/api/v1/products/${productId}/qr-code`, { query: { identifierId }, signal: options.signal }),
}
