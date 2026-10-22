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
  components = await server.ssrLoadModule('/src/features/dealers/pages/DealerPage.jsx')
  providers = {
    AuthProvider: (await server.ssrLoadModule('/src/features/auth/AuthProvider.jsx')).default,
    ToastProvider: (await server.ssrLoadModule('/src/shared/ui/ToastProvider.jsx')).ToastProvider,
  }
})

test.after(async () => {
  await server.close()
})

function renderWithProviders(element) {
  const user = { userId: 'u1', email: 'manager@example.com', fullName: 'Quản lý', role: 'WAREHOUSE_MANAGER', accessToken: null }
  return renderToStaticMarkup(createElement(providers.AuthProvider, { initialUser: user }, createElement(providers.ToastProvider, null, element)))
}

test('dealer page renders API-backed management controls and states', () => {
  const html = renderWithProviders(createElement(components.default))
  assert.match(html, /Quản lý đại lý/)
  assert.match(html, /Thêm đại lý/)
  assert.match(html, /Lọc trạng thái/)
  assert.match(html, /Đang tải dữ liệu/)
  assert.match(html, /tách biệt với tài khoản đăng nhập/)
})

test('create form contains only fields present in public dealers', () => {
  const html = renderWithProviders(createElement(components.DealerForm, { onClose() {}, async onSaved() {} }))
  assert.match(html, /Mã đại lý/)
  assert.match(html, /Tên đại lý/)
  assert.match(html, /Số điện thoại/)
  assert.match(html, /Email liên hệ/)
  assert.match(html, /Địa chỉ/)
  assert.match(html, /type="tel" required=""/)
  assert.match(html, /textarea[^>]*required=""/)
  assert.doesNotMatch(html, /Người liên hệ/)
  assert.doesNotMatch(html, /Ghi chú/)
  assert.match(html, /không tự động tạo tài khoản/)
})

test('edit form disables immutable dealer code', () => {
  const entity = { id: 'd1', dealerCode: 'DL-01', name: 'Đại lý Một', phone: '', email: '', address: '' }
  const html = renderWithProviders(createElement(components.DealerForm, { entity, onClose() {}, async onSaved() {} }))
  assert.match(html, /disabled="" value="DL-01"/)
  assert.match(html, /không thể thay đổi/)
})

test('detail renders partner data without account or stock fields', () => {
  const dealer = { dealerCode: 'DL-01', name: 'Đại lý Một', phone: '0901', email: 'a@example.com', address: 'Hà Nội', active: true }
  const html = renderToStaticMarkup(createElement(components.DealerDetail, { dealer, onClose() {} }))
  assert.match(html, /Chi tiết đại lý/)
  assert.match(html, /DL-01/)
  assert.doesNotMatch(html, /Mật khẩu/)
  assert.doesNotMatch(html, /Tồn kho/)
})
