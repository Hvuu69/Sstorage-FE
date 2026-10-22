import test from 'node:test'
import assert from 'node:assert/strict'
import { categoryApi } from '../src/api/categories.js'
import { unitApi } from '../src/api/units.js'
import { productApi } from '../src/api/products.js'
import { dealerApi } from '../src/api/dealers.js'
import { dealerRequestApi } from '../src/api/dealerRequests.js'
import { authApi, toCurrentUser } from '../src/features/auth/api/authApi.js'
import { ApiError, configureAccessTokenProvider } from '../src/api/http.js'

test.afterEach(() => {
  configureAccessTokenProvider(() => null)
  delete global.fetch
})

test('category list sends real pagination and search query', async () => {
  let request
  global.fetch = async (url, options) => {
    request = { url, options }
    return new Response(JSON.stringify({ content: [], page: 1, totalPages: 1 }), {
      status: 200, headers: { 'Content-Type': 'application/json' },
    })
  }
  await categoryApi.list({ search: 'food', page: 1, size: 10, sort: 'name,asc' })
  assert.match(request.url, /search=food/)
  assert.match(request.url, /page=1/)
  assert.match(request.url, /size=10/)
  assert.equal(request.options.credentials, 'omit')
})

test('login sends email and password and maps backend identity to the auth contract', async () => {
  let request
  global.fetch = async (url, options) => {
    request = { url, options }
    return new Response(JSON.stringify({
      accessToken: 'signed-token',
      tokenType: 'Bearer',
      expiresIn: 900,
      username: 'manager@example.com',
      roles: ['WAREHOUSE_MANAGER'],
    }), { status: 200, headers: { 'Content-Type': 'application/json' } })
  }

  const user = await authApi.login({ email: ' manager@example.com ', password: 'secret' })
  assert.match(request.url, /\/api\/auth\/login$/)
  assert.equal(request.options.method, 'POST')
  assert.deepEqual(JSON.parse(request.options.body), { email: 'manager@example.com', password: 'secret' })
  assert.deepEqual(user, {
    userId: 'manager@example.com',
    email: 'manager@example.com',
    fullName: 'manager@example.com',
    role: 'WAREHOUSE_MANAGER',
    dealerId: null,
    accessToken: 'signed-token',
  })
})

test('login response rejects unknown roles and missing tokens', () => {
  assert.throws(() => toCurrentUser({ accessToken: 'token', username: 'user@example.com', roles: ['UNKNOWN'] }), /không hợp lệ/)
  assert.throws(() => toCurrentUser({ username: 'user@example.com', roles: ['DEALER'] }), /không hợp lệ/)
})

test('configured Auth provider supplies bearer token', async () => {
  let authorization
  configureAccessTokenProvider(() => 'signed-token')
  global.fetch = async (_url, options) => {
    authorization = options.headers.Authorization
    return new Response(JSON.stringify({ id: 'u1' }), {
      status: 200, headers: { 'Content-Type': 'application/json' },
    })
  }
  await unitApi.update('u1', { name: 'Thùng', symbol: 'th' })
  assert.equal(authorization, 'Bearer signed-token')
})

test('problem detail exposes field errors without false success', async () => {
  global.fetch = async () => new Response(JSON.stringify({
    detail: 'Dữ liệu gửi lên không hợp lệ.',
    errorCode: 'VALIDATION_FAILED',
    fieldErrors: { code: 'Mã không hợp lệ.' },
  }), { status: 400, headers: { 'Content-Type': 'application/problem+json' } })

  await assert.rejects(
    () => categoryApi.create({ code: '', name: 'Tên' }),
    (error) => error instanceof ApiError
      && error.status === 400
      && error.fieldErrors.code === 'Mã không hợp lệ.',
  )
})

test('product list sends search, filters and pagination to backend', async () => {
  let requestedUrl
  global.fetch = async (url) => {
    requestedUrl = url
    return new Response(JSON.stringify({ content: [], page: 2, totalPages: 3 }), {
      status: 200, headers: { 'Content-Type': 'application/json' },
    })
  }
  await productApi.list({ search: 'sp-01', categoryId: 'category-1', status: 'ACTIVE', page: 2, size: 10, sort: 'name,asc' })
  assert.match(requestedUrl, /search=sp-01/)
  assert.match(requestedUrl, /categoryId=category-1/)
  assert.match(requestedUrl, /status=ACTIVE/)
  assert.match(requestedUrl, /page=2/)
})

test('product create, detail, edit and status use the agreed API contract', async () => {
  const calls = []
  global.fetch = async (url, options) => {
    calls.push({ url, method: options.method ?? 'GET', body: options.body })
    return new Response(JSON.stringify({ id: 'p1', sku: 'SP-01' }), {
      status: 200, headers: { 'Content-Type': 'application/json' },
    })
  }
  const payload = { sku: 'SP-01', name: 'Sản phẩm', categoryId: 'c1', unitId: 'u1', description: '' }
  await productApi.create(payload)
  await productApi.get('p1')
  await productApi.update('p1', payload)
  await productApi.changeStatus('p1', 'INACTIVE')
  assert.deepEqual(calls.map(({ method }) => method), ['POST', 'GET', 'PUT', 'PATCH'])
  assert.equal(JSON.parse(calls[3].body).status, 'INACTIVE')
})

test('dealer list sends search, status and pagination to backend', async () => {
  let requestedUrl
  global.fetch = async (url) => {
    requestedUrl = url
    return new Response(JSON.stringify({ content: [], page: 1, totalPages: 2 }), {
      status: 200, headers: { 'Content-Type': 'application/json' },
    })
  }
  await dealerApi.list({ search: 'dl-01', active: false, page: 1, size: 10, sort: 'name,asc' })
  assert.match(requestedUrl, /search=dl-01/)
  assert.match(requestedUrl, /active=false/)
  assert.match(requestedUrl, /page=1/)
})

test('dealer create, detail, update and status use manager API without delete', async () => {
  const calls = []
  global.fetch = async (url, options) => {
    calls.push({ url, method: options.method ?? 'GET', body: options.body })
    return new Response(JSON.stringify({ id: 'd1', dealerCode: 'DL-01' }), {
      status: 200, headers: { 'Content-Type': 'application/json' },
    })
  }
  await dealerApi.create({ dealerCode: 'DL-01', name: 'Đại lý Một' })
  await dealerApi.get('d1')
  await dealerApi.update('d1', { name: 'Đại lý mới', phone: '', email: '', address: '' })
  await dealerApi.changeStatus('d1', false)
  assert.deepEqual(calls.map(({ method }) => method), ['POST', 'GET', 'PUT', 'PATCH'])
  assert.equal(JSON.parse(calls[2].body).dealerCode, undefined)
  assert.equal(JSON.parse(calls[3].body).active, false)
})

test('dealer request API separates own, manager review and staff approved contracts', async () => {
  const calls = []
  global.fetch = async (url, options) => {
    calls.push({ url, method: options.method ?? 'GET', body: options.body })
    return new Response(JSON.stringify(url.includes('/my') || url.endsWith('/dealer-requests') || url.includes('/approved')
      ? { content: [], page: 0, totalPages: 0 } : { id: 'r1', status: 'PENDING' }), {
      status: 200, headers: { 'Content-Type': 'application/json' },
    })
  }
  await dealerRequestApi.create({ items: [{ productId: 'p1', quantity: 2 }], note: '' })
  await dealerRequestApi.listMine({ status: 'PENDING', page: 0, size: 10 })
  await dealerRequestApi.getMine('r1')
  await dealerRequestApi.listAll({ dealerId: 'd1', status: 'PENDING', from: '2026-10-01', to: '2026-10-22' })
  await dealerRequestApi.get('r1')
  await dealerRequestApi.approve('r1')
  await dealerRequestApi.reject('r2', 'Không phù hợp')
  await dealerRequestApi.listApproved({ page: 0, size: 20 })

  assert.deepEqual(calls.map(({ method }) => method), ['POST', 'GET', 'GET', 'GET', 'GET', 'POST', 'POST', 'GET'])
  assert.equal(JSON.parse(calls[0].body).dealerId, undefined)
  assert.equal(JSON.parse(calls[0].body).status, undefined)
  assert.equal(JSON.parse(calls[6].body).reason, 'Không phù hợp')
  assert.match(calls[3].url, /dealerId=d1/)
  assert.match(calls[7].url, /dealer-requests\/approved/)
})
