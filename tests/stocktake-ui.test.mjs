import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { stocktakeApi } from '../src/features/stocktaking/api/stocktakeApi.js'
import { configureAccessTokenProvider } from '../src/shared/api/http.js'

test.afterEach(() => {
  configureAccessTokenProvider(() => null)
  delete global.fetch
})

test('stocktake create sends only selected products and note', async () => {
  let request
  global.fetch = async (url, options) => {
    request = { url, options }
    return new Response(JSON.stringify({ id: 'stocktake-1' }), {
      status: 201,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  await stocktakeApi.create(['product-1', 'product-2'], 'Cuối tháng')

  assert.match(request.url, /\/api\/v1\/stocktakes$/)
  assert.equal(request.options.method, 'POST')
  assert.deepEqual(JSON.parse(request.options.body), {
    productIds: ['product-1', 'product-2'],
    note: 'Cuối tháng',
  })
})

test('QR and SKU use the read-only identify endpoint', async () => {
  let request
  global.fetch = async (url, options) => {
    request = { url, options }
    return new Response(JSON.stringify({ itemId: 'item-1', sku: 'SP-01' }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  await stocktakeApi.identify('stocktake-1', 'QR-SP-01')

  assert.match(request.url, /\/stocktakes\/stocktake-1\/identify$/)
  assert.deepEqual(JSON.parse(request.options.body), { code: 'QR-SP-01' })
})

test('stocktake screen keeps identification separate from actual quantity', async () => {
  const source = await readFile(
    new URL('../src/features/stocktaking/pages/StocktakingPage.jsx', import.meta.url),
    'utf8',
  )

  assert.match(source, /Mã quét chỉ xác định sản phẩm/)
  assert.match(source, /Nhập chính xác SKU/)
  assert.match(source, /Yêu cầu kiểm kê lại/)
  assert.doesNotMatch(source, /tăng số đếm thêm 1/)
})
