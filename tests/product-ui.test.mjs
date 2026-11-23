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
  assert.match(html, /Nhà cung cấp/)
  assert.match(html, /Đang tải dữ liệu/)
})

test('dealer catalog hides manager action, status filter and stock column', () => {
  const html = renderWithProviders(createElement(components.default), 'DEALER')
  assert.doesNotMatch(html, /Thêm sản phẩm/)
  assert.doesNotMatch(html, /Lọc trạng thái/)
  assert.doesNotMatch(html, /Tồn kho/)
  assert.doesNotMatch(html, /Nhà cung cấp/)
  assert.match(html, /Danh mục sản phẩm đang hoạt động/)
})

test('create and edit forms render required fields without inventory input', () => {
  const props = {
    categories: [{ id: 'c1', code: 'FOOD', name: 'Thực phẩm', active: true }],
    units: [{ id: 'u1', code: 'BOX', name: 'Thùng', symbol: 'thùng' }],
    suppliers: [{ id: 's1', code: 'NCC-01', name: 'Nhà cung cấp Một', status: 'ACTIVE' }],
    onClose() {}, async onSaved() {}, notify() {},
  }
  const createHtml = renderWithProviders(createElement(components.ProductForm, props))
  const editHtml = renderWithProviders(createElement(components.ProductForm, { ...props, entity: { id: 'p1', sku: 'SP-01', name: 'Một', categoryId: 'c1', unitId: 'u1' } }))
  assert.match(createHtml, /SKU/)
  assert.match(createHtml, /Danh mục/)
  assert.match(createHtml, /Nhà cung cấp Một/)
  assert.match(createHtml, />Hủy</)
  assert.match(createHtml, />Thêm sản phẩm</)
  assert.doesNotMatch(createHtml, /name="quantityOnHand"/)
  assert.match(editHtml, /SKU chỉ đổi được/)
  assert.match(editHtml, />Lưu thay đổi</)
})

test('product detail and edit entry share one modal and show supplier link status', () => {
  const product = {
    id: 'p1', sku: 'SP-01', name: 'Sản phẩm Một', description: 'Mô tả', status: 'ACTIVE',
    categoryName: 'Thực phẩm', unitName: 'Thùng', unitSymbol: 'thùng', quantityOnHand: 5,
    suppliers: [
      { id: 's1', supplierCode: 'NCC-01', name: 'Nhà cung cấp Một', supplierStatus: 'ACTIVE', linkStatus: 'ACTIVE' },
      { id: 's2', supplierCode: 'NCC-02', name: 'Nhà cung cấp Cũ', supplierStatus: 'INACTIVE', linkStatus: 'INACTIVE' },
    ],
  }
  const html = renderWithProviders(createElement(components.ProductDetailModal, {
    product, showStock: true, canManage: true, categories: [], units: [], suppliers: [], onClose() {}, onUpdated() {},
  }))
  assert.match(html, /Chi tiết sản phẩm/)
  assert.match(html, /Chỉnh sửa/)
  assert.match(html, /Nhà cung cấp Một/)
  assert.match(html, /Nhà cung cấp Cũ.*Ngừng liên kết/)
  assert.match(html, /Tồn kho/)
})

test('detail includes stock only for internal roles', () => {
  const product = { sku: 'SP-01', name: 'Một', status: 'ACTIVE', categoryCode: 'FOOD', categoryName: 'Thực phẩm', unitName: 'Thùng', unitSymbol: 'th', quantityOnHand: 12 }
  const internal = renderWithProviders(createElement(components.ProductDetailModal, { product, showStock: true, onClose() {} }))
  const dealer = renderWithProviders(createElement(components.ProductDetailModal, { product, showStock: false, onClose() {} }))
  assert.match(internal, /Tồn kho/)
  assert.doesNotMatch(dealer, /Tồn kho/)
})

test('manager product detail exposes supplier metadata without stock mutation fields', () => {
  const product = { id: 'p1', sku: 'SP-01', name: 'Một', status: 'ACTIVE', categoryCode: 'FOOD', categoryName: 'Thực phẩm', unitName: 'Thùng', unitSymbol: 'th', quantityOnHand: 12, suppliers: [{ id: 's1', supplierCode: 'NCC-01', name: 'Nhà cung cấp Một', supplierStatus: 'ACTIVE', linkStatus: 'ACTIVE' }] }
  const html = renderWithProviders(createElement(components.ProductDetailModal, { product, showStock: true, canManage: true, onClose() {} }))
  assert.match(html, /Nhà cung cấp Một/)
  assert.match(html, /Chỉnh sửa/)
  assert.doesNotMatch(html, /name="quantityOnHand"/)
})

test('inbound draft requires a supplier before showing selectable products', () => {
  const html = renderWithProviders(createElement(components.CreateImportModal, {
    onClose() {}, async onSave() {},
  }))
  assert.match(html, /Nhà cung cấp \*/)
  assert.match(html, /Vui lòng chọn nhà cung cấp trước/)
  assert.match(html, /Đang tải nhà cung cấp/)
  assert.doesNotMatch(html, /Thêm nhà cung cấp mới/)
})

test('inbound detail shows receipt, supplier, audit, note and complete line information', () => {
  const html = renderWithProviders(createElement(components.VoucherDetailModal, {
    voucher: {
      id: 'receipt-1', code: 'PN-001', status: 'CONFIRMED', supplierCode: 'NCC-01', partner: 'Nhà cung cấp Một',
      createdByName: 'Nhân viên Kho', confirmedByName: 'Quản lý Kho', createdAt: '2026-11-24T00:00:00+07:00',
      updatedAt: '2026-11-24T01:00:00+07:00', confirmedAt: '2026-11-24T01:00:00+07:00', note: 'Đủ chứng từ',
      items: [{ id: 'line-1', productId: 'product-1', sku: 'SP-01', name: 'Sản phẩm Một', unit: 'thùng', quantity: 3 }],
    },
    onClose() {}, onRequestConfirm() {},
  }))
  assert.match(html, /PN-001/)
  assert.match(html, /NCC-01.*Nhà cung cấp Một/)
  assert.match(html, /Nhân viên Kho/)
  assert.match(html, /Quản lý Kho/)
  assert.match(html, /Đủ chứng từ/)
  assert.match(html, /SP-01/)
  assert.match(html, /thùng/)
})
