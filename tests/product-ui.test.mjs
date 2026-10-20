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
  components = await server.ssrLoadModule('/src/features/products/pages/ProductPage.jsx')
  providers = {
    AuthProvider: (await server.ssrLoadModule('/src/features/auth/AuthProvider.jsx')).default,
    ToastProvider: (await server.ssrLoadModule('/src/shared/ui/ToastProvider.jsx')).ToastProvider,
  }
})

test.after(async () => {
  await server.close()
})

function renderWithProviders(element, role = 'WAREHOUSE_MANAGER') {
  const user = { userId: 'u1', email: 'user@example.com', fullName: 'Người dùng', role, accessToken: null }
  return renderToStaticMarkup(createElement(providers.AuthProvider, { initialUser: user }, createElement(providers.ToastProvider, null, element)))
}

test('manager list exposes create action and internal stock column', () => {
  const html = renderWithProviders(createElement(components.default))
  assert.match(html, /Thêm sản phẩm/)
  assert.match(html, /Tồn kho/)
  assert.match(html, /Đang tải dữ liệu/)
})

test('dealer catalog hides manager action, status filter and stock column', () => {
  const html = renderWithProviders(createElement(components.default), 'DEALER')
  assert.doesNotMatch(html, /Thêm sản phẩm/)
  assert.doesNotMatch(html, /Lọc trạng thái/)
  assert.doesNotMatch(html, /Tồn kho/)
  assert.match(html, /Danh mục sản phẩm đang hoạt động/)
})

test('create and edit forms render required fields without inventory input', () => {
  const props = {
    categories: [{ id: 'c1', code: 'FOOD', name: 'Thực phẩm', active: true }],
    units: [{ id: 'u1', code: 'BOX', name: 'Thùng', symbol: 'thùng' }],
    onClose() {}, async onSaved() {}, notify() {},
  }
  const createHtml = renderWithProviders(createElement(components.ProductForm, props))
  const editHtml = renderWithProviders(createElement(components.ProductForm, { ...props, entity: { id: 'p1', sku: 'SP-01', name: 'Một', categoryId: 'c1', unitId: 'u1' } }))
  assert.match(createHtml, /SKU/)
  assert.match(createHtml, /Danh mục/)
  assert.doesNotMatch(createHtml, /name="quantityOnHand"/)
  assert.match(editHtml, /SKU chỉ đổi được/)
})

test('detail includes stock only for internal roles', () => {
  const product = { sku: 'SP-01', name: 'Một', status: 'ACTIVE', categoryCode: 'FOOD', categoryName: 'Thực phẩm', unitName: 'Thùng', unitSymbol: 'th', quantityOnHand: 12 }
  const internal = renderToStaticMarkup(createElement(components.ProductDetail, { product, showStock: true, onClose() {} }))
  const dealer = renderToStaticMarkup(createElement(components.ProductDetail, { product, showStock: false, onClose() {} }))
  assert.match(internal, /Tồn kho hiện tại/)
  assert.doesNotMatch(dealer, /Tồn kho hiện tại/)
})
