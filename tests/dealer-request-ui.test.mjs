import test from 'node:test'
import assert from 'node:assert/strict'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { createServer } from 'vite'

let server
let components
let providers

test.before(async () => {
  server = await createServer({ server: { middlewareMode: true }, appType: 'custom' })
  components = await server.ssrLoadModule('/src/features/dealer-requests/pages/DealerRequestPage.jsx')
  providers = {
    AuthProvider: (await server.ssrLoadModule('/src/features/auth/AuthProvider.jsx')).default,
    ToastProvider: (await server.ssrLoadModule('/src/shared/ui/ToastProvider.jsx')).ToastProvider,
  }
})

test.after(async () => {
  await server.close()
})

function renderWithProviders(element, role = 'DEALER') {
  const user = { userId: 'u1', email: 'user@example.com', fullName: 'Người dùng', role, accessToken: null }
  return renderToStaticMarkup(createElement(providers.AuthProvider, { initialUser: user }, createElement(providers.ToastProvider, null, element)))
}

const request = {
  id: 'r1', requestCode: 'REQ-001', dealerCode: 'DL-01', dealerName: 'Đại lý Một', status: 'PENDING',
  createdAt: '2026-10-22T08:00:00Z', note: 'Bổ sung hàng', reviewNote: null, reviewedByName: null,
  items: [{ productId: 'p1', sku: 'SP-01', productName: 'Sản phẩm Một', unitSymbol: 'thùng', quantity: 4 }],
}

test('dealer portal renders own history and create action without manager controls', () => {
  const html = renderWithProviders(createElement(components.default), 'DEALER')
  assert.match(html, /Yêu cầu hàng của đại lý/)
  assert.match(html, /Tạo yêu cầu/)
  assert.doesNotMatch(html, /Phê duyệt/)
  assert.doesNotMatch(html, /Tồn kho/)
  assert.match(html, /Đang tải dữ liệu/)
})

test('manager portal renders review filters and no create-own action', () => {
  const html = renderWithProviders(createElement(components.default), 'WAREHOUSE_MANAGER')
  assert.match(html, /Quản lý yêu cầu đại lý/)
  assert.match(html, /Lọc đại lý/)
  assert.match(html, /Lọc trạng thái/)
  assert.match(html, /Từ ngày/)
  assert.doesNotMatch(html, /\+ Tạo yêu cầu/)
})

test('create request form supports multiple lines, positive quantities and no internal stock', () => {
  const html = renderWithProviders(createElement(components.DealerRequestCreatePage, { onClose() {}, async onSubmitted() {} }))
  assert.match(html, /Chọn sản phẩm đang hoạt động/)
  assert.match(html, /min="1"/)
  assert.match(html, /Thêm sản phẩm/)
  assert.match(html, /Xác nhận gửi yêu cầu/)
  assert.doesNotMatch(html, /Tồn kho/)
  assert.doesNotMatch(html, /Giá/)
})

test('dealer detail shows requested quantities and rejection note without stock', () => {
  const rejected = { ...request, status: 'REJECTED', reviewNote: 'Vượt nhu cầu hiện tại' }
  const html = renderToStaticMarkup(createElement(components.DealerRequestDetailPage, { request: rejected, onClose() {} }))
  assert.match(html, /REQ-001/)
  assert.match(html, /Từ chối/)
  assert.match(html, /Vượt nhu cầu hiện tại/)
  assert.match(html, /Tổng số lượng yêu cầu/)
  assert.doesNotMatch(html, /Tồn kho hiện tại/)
})

test('manager pending review exposes approve and reject actions with review warning', () => {
  const html = renderWithProviders(createElement(components.RequestReviewPage, { request, onClose() {}, async onChanged() {} }), 'WAREHOUSE_MANAGER')
  assert.match(html, /Phê duyệt/)
  assert.match(html, /Từ chối/)
  assert.match(html, /không giữ chỗ hoặc trừ tồn kho/)
})
