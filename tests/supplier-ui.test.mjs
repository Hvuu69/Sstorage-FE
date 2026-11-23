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
  components = await server.ssrLoadModule('/src/features/suppliers/pages/SupplierPage.jsx')
  providers = {
    AuthProvider: (await server.ssrLoadModule('/src/features/auth/AuthProvider.jsx')).default,
  }
})

test.after(async () => server.close())

function render(element) {
  const user = { userId: 'u1', email: 'manager@example.com', fullName: 'Quản lý', role: 'WAREHOUSE_MANAGER', accessToken: null }
  return renderToStaticMarkup(createElement(providers.AuthProvider, { initialUser: user }, element))
}

test('supplier form requires email and keeps create/update actions visible', () => {
  const props = { onClose() {}, async onSaved() {}, showToast() {} }
  const createHtml = render(createElement(components.SupplierForm, props))
  const editHtml = render(createElement(components.SupplierForm, { ...props, entity: {
    id: 's1', code: 'NCC-01', name: 'Nhà cung cấp Một', email: 'contact@example.com',
  } }))
  assert.match(createHtml, /Email \*/)
  assert.match(createHtml, /type="email" required=""/)
  assert.match(createHtml, /Mã nhà cung cấp \*/)
  assert.match(createHtml, />Hủy</)
  assert.match(createHtml, />Lưu nhà cung cấp</)
  assert.match(editHtml, /value="contact@example.com"/)
})

test('supplier page renders backend loading state without mock records', () => {
  const html = render(createElement(components.default))
  assert.match(html, /Nhà cung cấp/)
  assert.match(html, /Đang tải/)
  assert.doesNotMatch(html, /Công ty Thực phẩm An Khang/)
})
