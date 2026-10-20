import test from 'node:test'
import assert from 'node:assert/strict'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { MemoryRouter } from 'react-router-dom'
import { createServer } from 'vite'
import { appRoutes, canAccessRoute, firstRouteForRole, ROLES, routesForRole } from '../src/app/routeConfig.js'
import { ApiError, configureHttpAuthHandlers, request } from '../src/shared/api/http.js'

test.afterEach(() => {
  configureHttpAuthHandlers()
  delete global.fetch
})

test('central route registry contains every required path exactly once', () => {
  const required = ['/dashboard', '/products', '/categories', '/units', '/suppliers', '/dealers', '/dealer-requests', '/inbound', '/outbound', '/inventory', '/stocktaking', '/identification', '/ai-forecast', '/alerts', '/reports', '/admin/users', '/admin/roles', '/admin/audit']
  assert.deepEqual([...new Set(appRoutes.map((route) => route.path))].sort(), required.sort())
})

test('role navigation follows the approved matrix and gives no anonymous defaults', () => {
  assert.equal(routesForRole(null).length, 0)
  assert.equal(canAccessRoute(ROLES.ADMIN, '/products'), false)
  assert.equal(canAccessRoute(ROLES.WAREHOUSE_MANAGER, '/products'), true)
  assert.equal(canAccessRoute(ROLES.WAREHOUSE_STAFF, '/categories'), false)
  assert.equal(canAccessRoute(ROLES.WAREHOUSE_STAFF, '/identification'), true)
  assert.equal(canAccessRoute(ROLES.DEALER, '/inventory'), false)
  assert.equal(canAccessRoute(ROLES.DEALER, '/dealer-requests'), true)
  assert.equal(firstRouteForRole(ROLES.ADMIN), '/admin/users')
})

test('401 and 403 responses invoke shared auth handlers', async () => {
  let unauthorized = 0
  let forbidden = 0
  configureHttpAuthHandlers({ onUnauthorized: () => { unauthorized += 1 }, onForbidden: () => { forbidden += 1 } })
  global.fetch = async () => new Response(JSON.stringify({ detail: 'Denied' }), { status: 401, headers: { 'Content-Type': 'application/problem+json' } })
  await assert.rejects(() => request('/protected'), (error) => error instanceof ApiError && error.status === 401)
  global.fetch = async () => new Response(JSON.stringify({ detail: 'Forbidden' }), { status: 403, headers: { 'Content-Type': 'application/problem+json' } })
  await assert.rejects(() => request('/protected'), (error) => error instanceof ApiError && error.status === 403)
  assert.equal(unauthorized, 1)
  assert.equal(forbidden, 1)
})

test('network failures are normalized', async () => {
  global.fetch = async () => { throw new TypeError('offline') }
  await assert.rejects(() => request('/health'), (error) => error instanceof ApiError && error.errorCode === 'NETWORK_ERROR')
})

test('shared data table renders loading, error and empty states', async () => {
  const server = await createServer({ server: { middlewareMode: true }, appType: 'custom' })
  try {
    const DataTable = (await server.ssrLoadModule('/src/shared/ui/DataTable.jsx')).default
    const columns = [{ key: 'name', label: 'Tên' }]
    const render = (props) => renderToStaticMarkup(createElement(DataTable, { columns, rows: [], ...props }))
    assert.match(render({ loading: true }), /Đang tải dữ liệu/)
    assert.match(render({ error: 'Mất kết nối' }), /Mất kết nối/)
    assert.match(render({}), /Chưa có dữ liệu phù hợp/)
  } finally { await server.close() }
})

test('sidebar only renders routes allowed for the current role', async () => {
  const server = await createServer({ server: { middlewareMode: true }, appType: 'custom' })
  try {
    const Sidebar = (await server.ssrLoadModule('/src/shared/layout/Sidebar.jsx')).default
    const renderFor = (role) => renderToStaticMarkup(
      createElement(MemoryRouter, { initialEntries: ['/products'] },
        createElement(Sidebar, {
          user: { userId: 'test-user', email: 'test@example.com', fullName: 'Test User', role },
          open: true,
        }),
      ),
    )

    const manager = renderFor(ROLES.WAREHOUSE_MANAGER)
    assert.match(manager, /Sản phẩm/)
    assert.match(manager, /Danh mục/)
    assert.doesNotMatch(manager, /Quản lý người dùng/)

    const dealer = renderFor(ROLES.DEALER)
    assert.match(dealer, /Sản phẩm/)
    assert.match(dealer, /Yêu cầu đại lý/)
    assert.doesNotMatch(dealer, /Tồn kho/)
  } finally { await server.close() }
})
