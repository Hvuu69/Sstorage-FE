import { normalizePage, request } from '../../../shared/api/http.js'

export const inventoryApi = {
  listTransactions: async (query = {}, options = {}) =>
    normalizePage(
      await request('/api/v1/inventory/transactions', {
        query,
        signal: options.signal,
      }),
    ),
}