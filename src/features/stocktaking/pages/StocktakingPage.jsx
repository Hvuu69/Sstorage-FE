
import { useCallback, useEffect, useState } from 'react'
import { stocktakeApi } from '../api/stocktakeApi.js'
import { productApi } from '../../products/api/productApi.js'
import { UnifiedScanner } from '../../identification/index.js'
import { useAuth } from '../../auth/authContext.js'
import {
  Button,
  DataTable,
  Field,
  Input,
  Modal,
  PageHeader,
  Select,
  StatusBadge,
  Textarea,
  useToast,
} from '../../../shared/ui/index.js'

const STATUS_LABELS = {
  DRAFT: 'Bản nháp',
  IN_PROGRESS: 'Đang kiểm đếm',
  PENDING_CONFIRMATION: 'Chờ duyệt',
  RECOUNT_REQUIRED: 'Cần kiểm kê lại',
  COMPLETED: 'Hoàn thành',
  CANCELLED: 'Đã hủy',
}

const dateTime = (value) =>
  value ? new Date(value).toLocaleString('vi-VN') : '—'

const number = (value) =>
  Number(value ?? 0).toLocaleString('vi-VN')

const QrIcon = () => (
  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" /><rect x="3" y="14" width="7" height="7" rx="1" />
    <path d="M14 14h3v3h-3zM18 18h3v3h-3zM18 14h3M14 18v3" />
  </svg>
)

function StocktakeDetail({
  detail,
  role,
  busy,
  onClose,
  onAction,
  onReload,
  onNotify,
}) {
  const [counts, setCounts] = useState(() => Object.fromEntries(
    detail.items.map((item) => [item.id, item.actualQuantity ?? '']),
  ))
  const [notes, setNotes] = useState(() => Object.fromEntries(
    detail.items.map((item) => [item.id, item.note ?? '']),
  ))
  const [scannerOpen, setScannerOpen] = useState(false)
  const [skuQuery, setSkuQuery] = useState('')
  const [identifiedItemId, setIdentifiedItemId] = useState(null)

  const manager = role === 'WAREHOUSE_MANAGER'
  const status = detail.stocktake.status
  const countable = ['IN_PROGRESS', 'RECOUNT_REQUIRED'].includes(status)

  async function saveCount(item) {
    const raw = counts[item.id]

    if (
      raw === '' ||
      !Number.isSafeInteger(Number(raw)) ||
      Number(raw) < 0
    ) {
      onNotify(
        'Số lượng kiểm đếm phải là số nguyên không âm.',
        'error',
      )
      return
    }

    await onAction(
      () =>
        stocktakeApi.recordCount(
          detail.stocktake.id,
          item.id,
          {
            actualQuantity: Number(raw),
            note: notes[item.id] || null,
          },
        ),
      'Đã lưu số lượng kiểm đếm.',
    )

    await onReload()
  }

  async function identify(code) {
    const result = await stocktakeApi.identify(detail.stocktake.id, code)
    setIdentifiedItemId(result.itemId)
    document.getElementById(`stocktake-item-${result.itemId}`)?.scrollIntoView({
      behavior: 'smooth',
      block: 'center',
    })
    return {
      ...result,
      message: `Đã tìm thấy ${result.sku} — ${result.productName}. Hãy nhập số lượng thực tế.`,
    }
  }

  async function handleScan(product) {
    return identify(product.identifierValue || product.sku)
  }

  async function handleSkuSearch(event) {
    event.preventDefault()
    if (!skuQuery.trim()) return
    try {
      const result = await identify(skuQuery.trim())
      onNotify(result.message)
    } catch (requestError) {
      onNotify(requestError.message, 'error')
    }
  }

  const counted = detail.items.filter(
    (item) => item.actualQuantity !== null,
  ).length

  const differences = detail.items.filter(
    (item) =>
      item.difference !== null &&
      item.difference !== 0,
  ).length

  return (
    <Modal
      title={`Kiểm kê ${detail.stocktake.stocktakeCode}`}
      onClose={onClose}
    >
      <div className="modal-body">
        <div className="stocktake-summary">
          <div>
            <span>Trạng thái</span>
            <StatusBadge
              status={status}
              labels={STATUS_LABELS}
            />
          </div>

          <div>
            <span>Thời điểm chốt tồn</span>
            <strong>
              {dateTime(detail.stocktake.snapshotAt)}
            </strong>
          </div>

          <div>
            <span>Đã kiểm đếm</span>
            <strong>
              {number(counted)} / {number(detail.items.length)}
            </strong>
          </div>

          <div>
            <span>Sản phẩm lệch</span>
            <strong>{number(differences)}</strong>
          </div>
        </div>

        {detail.stocktake.note && (
          <p className="notice">
            {detail.stocktake.note}
          </p>
        )}

        {countable && (
          <section className="scan-panel">
            <form className="toolbar-row" onSubmit={handleSkuSearch}>
              <Input
                value={skuQuery}
                onChange={(event) => setSkuQuery(event.target.value)}
                placeholder="Nhập chính xác SKU…"
                aria-label="Tìm sản phẩm bằng SKU"
              />
              <Button type="submit" variant="secondary">Tìm SKU</Button>
            </form>
            <Button
              onClick={() => setScannerOpen((value) => !value)}
              aria-label="Quét QR kiểm kê"
            >
              <QrIcon /> {scannerOpen ? 'Đóng máy quét' : 'Quét QR kiểm kê'}
            </Button>

            {scannerOpen && (
              <>
                <h3>Quét QR / RFID</h3>
                <p>Mã quét chỉ xác định sản phẩm; số thực tế được nhập và lưu riêng bên dưới.</p>
                <UnifiedScanner compact singleShot onProductDetected={handleScan} />
              </>
            )}
          </section>
        )}

        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>SKU / Sản phẩm</th>
                <th>Tồn hệ thống</th>
                <th>Thực tế</th>
                <th>Chênh lệch</th>
                <th>Ghi chú</th>
                <th>Thao tác</th>
              </tr>
            </thead>

            <tbody>
              {detail.items.map((item) => (
                <tr
                  key={item.id}
                  id={`stocktake-item-${item.id}`}
                  className={identifiedItemId === item.id ? 'stocktake-item-selected' : ''}
                >
                  <td>
                    <strong>{item.sku}</strong>
                    <small className="table-subtext">
                      {item.productName}
                    </small>
                  </td>

                  <td>{number(item.systemQuantity)}</td>

                  <td>
                    {countable ? (
                      <Input
                        className="count-input"
                        type="number"
                        min="0"
                        step="1"
                        value={counts[item.id] ?? ''}
                        onChange={(event) =>
                          setCounts((old) => ({
                            ...old,
                            [item.id]: event.target.value,
                          }))
                        }
                        aria-label={`Số thực tế ${item.sku}`}
                      />
                    ) : (
                      number(item.actualQuantity)
                    )}
                  </td>

                  <td>
                    <strong
                      className={
                        item.difference > 0
                          ? 'difference-positive'
                          : item.difference < 0
                            ? 'difference-negative'
                            : ''
                      }
                    >
                      {item.difference === null
                        ? 'Chưa đếm'
                        : item.difference > 0
                          ? `+${number(item.difference)}`
                          : number(item.difference)}
                    </strong>
                  </td>

                  <td>
                    {countable ? (
                      <Input
                        value={notes[item.id] ?? ''}
                        onChange={(event) =>
                          setNotes((old) => ({
                            ...old,
                            [item.id]: event.target.value,
                          }))
                        }
                        aria-label={`Ghi chú ${item.sku}`}
                      />
                    ) : (
                      item.note || '—'
                    )}
                  </td>

                  <td>
                    {countable && (
                      <Button
                        onClick={() => saveCount(item)}
                        disabled={busy}
                      >
                        Lưu
                      </Button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="modal-actions">
        {status === 'DRAFT' && manager && (
          <Button
            onClick={() =>
              onAction(
                () => stocktakeApi.start(detail.stocktake.id),
                'Đã bắt đầu kiểm kê.',
              )
            }
          >
            Bắt đầu kiểm kê
          </Button>
        )}

        {countable && (
          <Button
            onClick={() =>
              onAction(
                () => stocktakeApi.submit(detail.stocktake.id),
                status === 'RECOUNT_REQUIRED'
                  ? 'Đã gửi lại kết quả kiểm kê.'
                  : 'Đã gửi kết quả kiểm kê.',
              )
            }
          >
            {status === 'RECOUNT_REQUIRED' ? 'Gửi lại kết quả' : 'Gửi kết quả'}
          </Button>
        )}

        {status === 'PENDING_CONFIRMATION' && manager && (
          <>
            <Button
              onClick={() =>
                onAction(
                  () => stocktakeApi.approve(detail.stocktake.id),
                  'Đã xử lý phê duyệt; trạng thái phiên đã được cập nhật.',
                )
              }
            >
              Phê duyệt kết quả
            </Button>
            <Button
              variant="secondary"
              onClick={() =>
                onAction(
                  () => stocktakeApi.recount(detail.stocktake.id),
                  'Đã yêu cầu nhân viên kiểm kê lại.',
                )
              }
            >
              Yêu cầu kiểm kê lại
            </Button>
          </>
        )}

        {[
          'DRAFT',
          'IN_PROGRESS',
          'PENDING_CONFIRMATION',
          'RECOUNT_REQUIRED',
        ].includes(status) &&
          manager && (
            <Button
              variant="danger"
              onClick={() =>
                onAction(
                  () => stocktakeApi.cancel(detail.stocktake.id),
                  'Đã hủy phiên kiểm kê.',
                )
              }
            >
              Hủy phiên
            </Button>
          )}

        <Button variant="secondary" onClick={onClose}>
          Đóng
        </Button>
      </div>
    </Modal>
  )
}

export default function StocktakingPage() {
  const { currentUser } = useAuth()
  const { notify } = useToast()

  const manager = currentUser?.role === 'WAREHOUSE_MANAGER'

  const [sessions, setSessions] = useState([])
  const [status, setStatus] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [selected, setSelected] = useState(null)
  const [note, setNote] = useState('')
  const [createOpen, setCreateOpen] = useState(false)
  const [creating, setCreating] = useState(false)
  const [busy, setBusy] = useState(false)
  const [products, setProducts] = useState([])
  const [selectedProductIds, setSelectedProductIds] = useState([])
  const [productSearch, setProductSearch] = useState('')
  const [productsLoading, setProductsLoading] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    setError('')

    try {
      setSessions(
        await stocktakeApi.list(status || undefined),
      )
    } catch (requestError) {
      setError(requestError.message)
    } finally {
      setLoading(false)
    }
  }, [status])

  useEffect(() => {
    const timer = window.setTimeout(load, 0)
    return () => window.clearTimeout(timer)
  }, [load])

  async function openCreateDialog() {
    setCreateOpen(true)
    setProductsLoading(true)
    try {
      const firstPage = await productApi.list({
        page: 0,
        size: 100,
        sort: 'name,asc',
        status: 'ACTIVE',
      })
      const remainingPages = await Promise.all(
        Array.from({ length: Math.max(0, firstPage.totalPages - 1) }, (_, index) =>
          productApi.list({
            page: index + 1,
            size: 100,
            sort: 'name,asc',
            status: 'ACTIVE',
          })),
      )
      setProducts([
        ...(firstPage.content || []),
        ...remainingPages.flatMap((page) => page.content || []),
      ])
    } catch (requestError) {
      notify(requestError.message, 'error')
    } finally {
      setProductsLoading(false)
    }
  }

  async function open(id) {
    try {
      setSelected(await stocktakeApi.get(id))
    } catch (requestError) {
      notify(requestError.message, 'error')
    }
  }

  async function runAction(action, success) {
    setBusy(true)

    try {
      await action()
      notify(success)
      await load()

      if (selected) {
        await open(selected.stocktake.id)
      }
    } catch (requestError) {
      notify(requestError.message, 'error')
    } finally {
      setBusy(false)
    }
  }

  async function create() {
    if (selectedProductIds.length === 0) {
      notify('Hãy chọn ít nhất một sản phẩm cần kiểm kê.', 'error')
      return
    }
    setCreating(true)

    try {
      const created = await stocktakeApi.create(
        selectedProductIds,
        note.trim() || null,
      )

      notify('Đã tạo phiên kiểm kê.')
      setNote('')
      setSelectedProductIds([])
      setProductSearch('')
      setCreateOpen(false)

      await load()
      await open(created.id)
    } catch (requestError) {
      notify(requestError.message, 'error')
    } finally {
      setCreating(false)
    }
  }

  const columns = [
    {
      key: 'stocktakeCode',
      label: 'Mã phiên',
      render: (item) => (
        <strong>{item.stocktakeCode}</strong>
      ),
    },
    {
      key: 'status',
      label: 'Trạng thái',
      render: (item) => (
        <StatusBadge
          status={item.status}
          labels={STATUS_LABELS}
        />
      ),
    },
    {
      key: 'snapshotAt',
      label: 'Snapshot',
      render: (item) => dateTime(item.snapshotAt),
    },
    {
      key: 'createdAt',
      label: 'Ngày tạo',
      render: (item) => dateTime(item.createdAt),
    },
    {
      key: 'actions',
      label: 'Thao tác',
      render: (item) => (
        <Button
          variant="text"
          onClick={() => open(item.id)}
        >
          {item.status === 'IN_PROGRESS' && <QrIcon />} Chi tiết / xử lý
        </Button>
      ),
    },
  ]

  return (
    <div className="page">
      <PageHeader
        title="Kiểm kê kho"
        description="Đối chiếu số lượng thực tế với snapshot tồn kho; chỉ cập nhật tồn sau khi quản lý phê duyệt."
        actions={
          manager && (
            <Button onClick={openCreateDialog}>
              + Tạo phiên kiểm kê
            </Button>
          )
        }
      />

      <section className="card">
        <div className="toolbar-row">
          <Select
            aria-label="Lọc trạng thái phiên kiểm kê"
            value={status}
            onChange={(event) =>
              setStatus(event.target.value)
            }
          >
            <option value="">Tất cả trạng thái</option>

            {Object.entries(STATUS_LABELS).map(
              ([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ),
            )}
          </Select>

          <Button
            variant="secondary"
            onClick={load}
            disabled={loading}
          >
            Làm mới
          </Button>
        </div>

        <DataTable
          columns={columns}
          rows={sessions}
          loading={loading}
          error={error}
          onRetry={load}
          emptyMessage="Chưa có phiên kiểm kê."
        />
      </section>

      {createOpen && (
        <Modal
          title="Tạo phiên kiểm kê"
          onClose={() => setCreateOpen(false)}
        >
          <form
            onSubmit={(event) => {
              event.preventDefault()
              create()
            }}
          >
            <div className="modal-body">
              <Field label="Ghi chú">
                <Textarea
                  value={note}
                  onChange={(event) =>
                    setNote(event.target.value)
                  }
                  maxLength={2000}
                  placeholder="Ví dụ: Kiểm kê định kỳ cuối tháng…"
                />
              </Field>

              <Field label={`Sản phẩm kiểm kê (${selectedProductIds.length} đã chọn)`}>
                <Input
                  value={productSearch}
                  onChange={(event) => setProductSearch(event.target.value)}
                  placeholder="Tìm theo SKU hoặc tên sản phẩm…"
                />
                <div className="stocktake-product-picker">
                  {productsLoading ? (
                    <p>Đang tải sản phẩm…</p>
                  ) : products
                    .filter((product) => {
                      const query = productSearch.trim().toLowerCase()
                      return !query || product.sku?.toLowerCase().includes(query)
                        || product.name?.toLowerCase().includes(query)
                    })
                    .map((product) => (
                      <label key={product.id} className="stocktake-product-option">
                        <input
                          type="checkbox"
                          checked={selectedProductIds.includes(product.id)}
                          onChange={(event) => setSelectedProductIds((current) =>
                            event.target.checked
                              ? [...current, product.id]
                              : current.filter((id) => id !== product.id))}
                        />
                        <span><strong>{product.sku}</strong> — {product.name}</span>
                      </label>
                    ))}
                </div>
              </Field>

              <p className="notice">
                Hệ thống chỉ chụp số tồn hiện tại của các sản phẩm đã chọn.
                Tạo phiên không làm thay đổi tồn kho.
              </p>
            </div>

            <div className="modal-actions">
              <Button
                variant="secondary"
                onClick={() => setCreateOpen(false)}
              >
                Hủy
              </Button>

              <Button type="submit" disabled={creating}>
                {creating ? 'Đang tạo…' : 'Tạo phiên'}
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {selected && (
        <StocktakeDetail
          key={`${selected.stocktake.id}-${selected.stocktake.status}-${selected.items
            .map((item) => `${item.id}:${item.actualQuantity}:${item.countedAt}`)
            .join('|')}`}
          detail={selected}
          role={currentUser?.role}
          busy={busy}
          onClose={() => setSelected(null)}
          onAction={runAction}
          onReload={() => open(selected.stocktake.id)}
          onNotify={notify}
        />
      )}
    </div>
  )
}
