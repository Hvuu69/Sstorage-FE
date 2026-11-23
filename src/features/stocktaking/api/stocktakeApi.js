
import { request } from '../../../shared/api/http.js'

export const stocktakeApi = {
  // Lấy danh sách phiên kiểm kê
  list: (status, options = {}) =>
    request('/api/v1/stocktakes', {
      query: { status },
      signal: options.signal,
    }),

  // Lấy chi tiết phiên kiểm kê
  get: (id, options = {}) =>
    request(`/api/v1/stocktakes/${id}`, {
      signal: options.signal,
    }),

  // Tạo phiên kiểm kê
  create: (productIds, note) =>
    request('/api/v1/stocktakes', {
      method: 'POST',
      body: JSON.stringify({ productIds, note }),
    }),

  // Bắt đầu kiểm kê
  start: (id) =>
    request(`/api/v1/stocktakes/${id}/start`, {
      method: 'POST',
    }),

  // Ghi nhận số lượng thực tế
  recordCount: (id, itemId, payload) =>
    request(`/api/v1/stocktakes/${id}/items/${itemId}/count`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    }),

  // Nhận diện sản phẩm bằng QR/RFID/SKU, không thay đổi số đếm
  identify: (id, code) =>
    request(`/api/v1/stocktakes/${id}/identify`, {
      method: 'POST',
      body: JSON.stringify({ code }),
    }),

  // Gửi kết quả kiểm kê
  submit: (id) =>
    request(`/api/v1/stocktakes/${id}/submit`, {
      method: 'POST',
    }),

  // Phê duyệt kiểm kê
  approve: (id) =>
    request(`/api/v1/stocktakes/${id}/approve`, {
      method: 'POST',
    }),

  // Yêu cầu kiểm kê lại
  recount: (id) =>
    request(`/api/v1/stocktakes/${id}/recount`, {
      method: 'POST',
    }),

  // Hủy phiên kiểm kê
  cancel: (id) =>
    request(`/api/v1/stocktakes/${id}/cancel`, {
      method: 'POST',
    }),
}
