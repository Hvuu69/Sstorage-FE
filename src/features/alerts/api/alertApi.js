import { normalizePage, request } from '../../../shared/api/http.js'

const base = '/api/v1/alerts'

export const alertApi = {
  list: async (query, options = {}) =>
    normalizePage(
      await request(base, {
        query,
        signal: options.signal,
      }),
    ),

  listPolicies: async (query = {}, options = {}) =>
    normalizePage(
      await request(`${base}/policies`, {
        query,
        signal: options.signal,
      }),
    ),

  upsertPolicy: (productId, payload) =>
    request(`${base}/policies/${productId}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    }),

  evaluate: (productId) =>
    request(`${base}/evaluate`, {
      method: 'POST',
      ...(productId ? { query: { productId } } : {}),
    }),

  acknowledge: (id) =>
    request(`${base}/${id}/acknowledge`, {
      method: 'PATCH',
    }),

  resolve: (id) =>
    request(`${base}/${id}/resolve`, {
      method: 'PATCH',
    }),
}