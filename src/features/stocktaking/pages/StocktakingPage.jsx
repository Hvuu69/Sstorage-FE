
import { useCallback, useEffect, useState } from 'react'
import { stocktakeApi } from '../api/stocktakeApi.js'
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

function StocktakeDetail({
  detail,
  role,
  busy,
  onClose,
  onAction,
  onReload,
  onNotify,
}) {
  const [counts, setCounts] = useState({})
  const [notes, setNotes] = useState({})
  const [scanItem, setScanItem] = useState('')

  const manager = ['ADMIN', 'WAREHOUSE_MANAGER'].includes(role)
  const status = detail.stocktake.status

  useEffect(() => {
    setCounts(
      Object.fromEntries(
        detail.items.map((item) => [
          item.id,
          item.actualQuantity ?? '',
        ]),
      ),
    )

    setNotes(
      Object.fromEntries(
        detail.items.map((item) => [
          item.id,
          item.note ?? '',
        ]),
      ),
    )
  }, [detail])

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

  async function handleScan(code) {
    if (!scanItem) {
      throw new Error(
        'Hãy chọn sản phẩm trước khi quét QR/RFID.',
      )
    }

    const result = await stocktakeApi.scan(
      detail.stocktake.id,
      scanItem,
      code,
    )

    await onReload()

    return {
      ...result,
      message: `Đã ghi nhận ${result.sku}. Số đếm hiện tại: ${number(result.actualQuantity)}.`,
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

        {status === 'IN_PROGRESS' && (
          <section className="scan-panel">
            <h3>Quét QR / RFID</h3>

            <p>
              Mỗi mã hợp lệ sẽ tăng số đếm thêm 1.
              Mã phải thuộc đúng sản phẩm đang chọn.
            </p>

            <Field label="Sản phẩm cần kiểm đếm">
              <Select
                aria-label="Sản phẩm cần quét"
                value={scanItem}
                onChange={(event) =>
                  setScanItem(event.target.value)
                }
              >
                <option value="">
                  Chọn sản phẩm trước khi quét
                </option>

                {detail.items.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.sku} · {item.productName}
                  </option>
                ))}
              </Select>
            </Field>

            <UnifiedScanner onCodeScanned={handleScan} />
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
                <tr key={item.id}>
                  <td>
                    <strong>{item.sku}</strong>
                    <small className="table-subtext">
                      {item.productName}
                    </small>
                  </td>

                  <td>{number(item.systemQuantity)}</td>

                  <td>
                    {status === 'IN_PROGRESS' ? (
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
                    {status === 'IN_PROGRESS' ? (
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
                    {status === 'IN_PROGRESS' && (
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

        {status === 'IN_PROGRESS' && (
          <Button
            onClick={() =>
              onAction(
                () => stocktakeApi.submit(detail.stocktake.id),
                'Đã gửi kết quả kiểm kê.',
              )
            }
          >
            Gửi kết quả
          </Button>
        )}

        {status === 'PENDING_CONFIRMATION' && manager && (
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
        )}

        {status === 'RECOUNT_REQUIRED' && manager && (
          <Button
            onClick={() =>
              onAction(
                () => stocktakeApi.recount(detail.stocktake.id),
                'Đã tạo lại snapshot kiểm kê.',
              )
            }
          >
            Tạo lại snapshot
          </Button>
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

  const manager = [
    'ADMIN',
    'WAREHOUSE_MANAGER',
  ].includes(currentUser?.role)

  const [sessions, setSessions] = useState([])
  const [status, setStatus] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [selected, setSelected] = useState(null)
  const [note, setNote] = useState('')
  const [createOpen, setCreateOpen] = useState(false)
  const [creating, setCreating] = useState(false)
  const [busy, setBusy] = useState(false)

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
    load()
  }, [load])

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
    setCreating(true)

    try {
      const created = await stocktakeApi.create(
        note.trim() || null,
      )

      notify('Đã tạo phiên kiểm kê.')
      setNote('')
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
          Chi tiết / xử lý
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
            <Button onClick={() => setCreateOpen(true)}>
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

              <p className="notice">
                Hệ thống chụp số tồn hiện tại của tất cả
                sản phẩm đang hoạt động. Không thay đổi
                tồn kho khi tạo phiên.
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
          key={selected.stocktake.id}
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
