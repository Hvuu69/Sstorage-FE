import { useEffect, useMemo, useState } from 'react'
import { ROLES } from '../../../app/routeConfig.js'
import usePagedResource from '../../../shared/hooks/usePagedResource.js'
import { Button, ConfirmDialog, DataTable, Field, FilterBar, Input, Modal, PageHeader, Pagination, SearchBar, Select, StatusBadge, Textarea, useToast } from '../../../shared/ui/index.js'
import { dealerApi } from '../../dealers/api/dealerApi.js'
import { productApi } from '../../products/api/productApi.js'
import { useAuth } from '../../auth/authContext.js'
import { dealerRequestApi } from '../api/dealerRequestApi.js'

const STATUS_LABELS = {
  PENDING: 'Chờ duyệt', APPROVED: 'Đã duyệt', REJECTED: 'Từ chối', FULFILLED: 'Đã xuất', CANCELLED: 'Đã hủy',
}

function formatDate(value) {
  return value ? new Intl.DateTimeFormat('vi-VN', { dateStyle: 'short', timeStyle: 'short' }).format(new Date(value)) : '—'
}

function RequestStatus({ value }) {
  return <StatusBadge status={value} labels={STATUS_LABELS} />
}

export function DealerRequestDetailPage({ request, onClose, actions }) {
  const total = request.items.reduce((sum, item) => sum + item.quantity, 0)
  const columns = [
    { key: 'sku', label: 'SKU', render: (item) => <strong>{item.sku}</strong> },
    { key: 'productName', label: 'Sản phẩm' },
    { key: 'unitSymbol', label: 'Đơn vị' },
    { key: 'quantity', label: 'Số lượng' },
  ]
  return <Modal title={`Yêu cầu ${request.requestCode}`} onClose={onClose}>
    <div className="modal-body">
      <div className="detail-grid">
        <div><span>Đại lý</span><strong>{request.dealerCode} · {request.dealerName}</strong></div>
        <div><span>Trạng thái</span><RequestStatus value={request.status} /></div>
        <div><span>Ngày gửi</span><strong>{formatDate(request.createdAt)}</strong></div>
        <div><span>Người xét duyệt</span><strong>{request.reviewedByName || '—'}</strong></div>
        <div className="full"><span>Ghi chú</span><strong>{request.note || '—'}</strong></div>
        {request.reviewNote && <div className="full"><span>Lý do/Ghi chú xét duyệt</span><strong>{request.reviewNote}</strong></div>}
      </div>
      <DataTable columns={columns} rows={request.items} emptyMessage="Yêu cầu không có sản phẩm." />
      <div className="notice">Tổng số lượng yêu cầu: <strong>{total}</strong>. Phê duyệt không giữ chỗ hoặc trừ tồn kho.</div>
    </div>{actions && <div className="modal-actions">{actions}</div>}
  </Modal>
}

export function DealerRequestCreatePage({ onClose, onSubmitted }) {
  const { notify } = useToast()
  const [products, setProducts] = useState([])
  const [loadingProducts, setLoadingProducts] = useState(true)
  const [items, setItems] = useState([{ productId: '', quantity: 1 }])
  const [note, setNote] = useState('')
  const [error, setError] = useState('')
  const [fieldErrors, setFieldErrors] = useState({})
  const [confirming, setConfirming] = useState(false)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    let active = true
    productApi.list({ page: 0, size: 100, sort: 'name,asc', status: 'ACTIVE' })
      .then((page) => { if (active) setProducts(page.content.filter((product) => product.status === 'ACTIVE')) })
      .catch((requestError) => { if (active) setError(requestError.message) })
      .finally(() => { if (active) setLoadingProducts(false) })
    return () => { active = false }
  }, [])

  function updateItem(index, field, value) {
    setItems((current) => current.map((item, itemIndex) => itemIndex === index ? { ...item, [field]: value } : item))
  }

  function validate() {
    const selected = items.map((item) => item.productId).filter(Boolean)
    if (items.length === 0 || selected.length !== items.length) return 'Hãy chọn sản phẩm cho mọi dòng.'
    if (new Set(selected).size !== selected.length) return 'Mỗi sản phẩm chỉ được chọn một lần.'
    if (items.some((item) => !Number.isInteger(Number(item.quantity)) || Number(item.quantity) <= 0)) return 'Số lượng phải là số nguyên dương.'
    return ''
  }

  function requestConfirmation(event) {
    event.preventDefault(); setFieldErrors({})
    const validationError = validate(); setError(validationError)
    if (!validationError) setConfirming(true)
  }

  async function submit() {
    setSaving(true); setError(''); setFieldErrors({})
    try {
      await dealerRequestApi.create({
        items: items.map((item) => ({ productId: item.productId, quantity: Number(item.quantity) })),
        note: note.trim(),
      })
      notify('Đã gửi yêu cầu hàng.')
      await onSubmitted(); onClose()
    } catch (requestError) {
      setFieldErrors(requestError.fieldErrors ?? {}); setError(requestError.message); notify(requestError.message, 'error')
    } finally { setSaving(false); setConfirming(false) }
  }

  const total = items.reduce((sum, item) => sum + (Number(item.quantity) > 0 ? Number(item.quantity) : 0), 0)
  return <Modal title="Tạo yêu cầu hàng" onClose={onClose}>
    <form onSubmit={requestConfirmation}>
      <div className="modal-body">
        {loadingProducts && <div className="notice">Đang tải danh mục sản phẩm…</div>}
        {error && <div className="notice error">{error}</div>}
        {items.map((item, index) => <div className="request-line" key={index}>
          <Field label={`Sản phẩm ${index + 1} *`} error={fieldErrors[`items[${index}].productId`]}>
            <Select required value={item.productId} onChange={(event) => updateItem(index, 'productId', event.target.value)}>
              <option value="">Chọn sản phẩm đang hoạt động</option>
              {products.map((product) => <option key={product.id} value={product.id} disabled={items.some((line, lineIndex) => lineIndex !== index && line.productId === product.id)}>{product.sku} · {product.name} ({product.unitSymbol})</option>)}
            </Select>
          </Field>
          <Field label="Số lượng *" error={fieldErrors[`items[${index}].quantity`]}><Input type="number" required min="1" step="1" value={item.quantity} onChange={(event) => updateItem(index, 'quantity', event.target.value)} /></Field>
          <Button variant="text" disabled={items.length === 1} onClick={() => setItems((current) => current.filter((_, itemIndex) => itemIndex !== index))}>Xóa dòng</Button>
        </div>)}
        <Button variant="secondary" onClick={() => setItems((current) => [...current, { productId: '', quantity: 1 }])}>+ Thêm sản phẩm</Button>
        <Field label="Ghi chú" error={fieldErrors.note}><Textarea maxLength="2000" value={note} onChange={(event) => setNote(event.target.value)} /></Field>
        <div className="notice">Tổng số lượng: <strong>{total}</strong>. Yêu cầu chỉ được gửi cho đại lý gắn với tài khoản hiện tại.</div>
      </div>
      <div className="modal-actions"><Button variant="secondary" onClick={onClose}>Hủy</Button><Button type="submit" disabled={saving || loadingProducts || products.length === 0}>Xác nhận gửi yêu cầu</Button></div>
    </form>
    {confirming && <ConfirmDialog busy={saving} message={`Gửi yêu cầu gồm ${items.length} sản phẩm, tổng số lượng ${total}?`} onClose={() => setConfirming(false)} onConfirm={submit} />}
  </Modal>
}

export function DealerRequestListPage() {
  const { notify } = useToast()
  const [status, setStatus] = useState('')
  const [dialog, setDialog] = useState(null)
  const filters = useMemo(() => ({ status }), [status])
  const list = usePagedResource(dealerRequestApi.listMine, { filters, sort: 'createdAt,desc' })

  async function openDetail(item) {
    try { setDialog({ type: 'detail', entity: await dealerRequestApi.getMine(item.id) }) }
    catch (error) { notify(error.message, 'error') }
  }

  const columns = [
    { key: 'requestCode', label: 'Mã yêu cầu', render: (item) => <strong>{item.requestCode}</strong> },
    { key: 'createdAt', label: 'Ngày gửi', render: (item) => formatDate(item.createdAt) },
    { key: 'totalLines', label: 'Mặt hàng' }, { key: 'totalQuantity', label: 'Tổng số lượng' },
    { key: 'status', label: 'Trạng thái', render: (item) => <RequestStatus value={item.status} /> },
    { key: 'actions', label: 'Thao tác', render: (item) => <Button variant="text" onClick={() => openDetail(item)}>Chi tiết</Button> },
  ]

  return <div className="page">
    <PageHeader title="Yêu cầu hàng của đại lý" description="Tạo và theo dõi yêu cầu thuộc đại lý của tài khoản hiện tại." actions={<Button onClick={() => setDialog({ type: 'create' })}>+ Tạo yêu cầu</Button>} />
    <section className="card"><FilterBar onSubmit={(event) => event.preventDefault()}><Select aria-label="Lọc trạng thái" value={status} onChange={(event) => { list.beginChange(); list.setPage(0); setStatus(event.target.value) }}><option value="">Tất cả trạng thái</option>{Object.entries(STATUS_LABELS).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</Select></FilterBar><DataTable columns={columns} rows={list.result.content} loading={list.loading} error={list.error} onRetry={list.load} emptyMessage="Chưa có yêu cầu hàng." /><Pagination page={list.page} totalPages={list.result.totalPages} totalElements={list.result.totalElements} noun="yêu cầu" onPageChange={(page) => { list.beginChange(); list.setPage(page) }} /></section>
    {dialog?.type === 'create' && <DealerRequestCreatePage onClose={() => setDialog(null)} onSubmitted={list.load} />}
    {dialog?.type === 'detail' && <DealerRequestDetailPage request={dialog.entity} onClose={() => setDialog(null)} />}
  </div>
}

export function RequestReviewPage({ request, onClose, onChanged }) {
  const { notify } = useToast()
  const [action, setAction] = useState(null)
  const [reason, setReason] = useState('')
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  async function approve() {
    setSaving(true)
    try { await dealerRequestApi.approve(request.id); notify('Đã phê duyệt yêu cầu.'); await onChanged(); onClose() }
    catch (requestError) { notify(requestError.message, 'error') }
    finally { setSaving(false); setAction(null) }
  }

  async function reject() {
    if (!reason.trim()) { setError('Lý do từ chối không được để trống.'); return }
    setSaving(true); setError('')
    try { await dealerRequestApi.reject(request.id, reason.trim()); notify('Đã từ chối yêu cầu.'); await onChanged(); onClose() }
    catch (requestError) { setError(requestError.fieldErrors?.reason ?? requestError.message); notify(requestError.message, 'error') }
    finally { setSaving(false) }
  }

  const reviewActions = request.status === 'PENDING' && <><Button disabled={saving} onClick={() => setAction('approve')}>Phê duyệt</Button><Button variant="danger" disabled={saving} onClick={() => setAction('reject')}>Từ chối</Button></>
  return <>
    {action !== 'reject' && <DealerRequestDetailPage request={request} onClose={onClose} actions={reviewActions} />}
    {action === 'approve' && <ConfirmDialog busy={saving} message={`Phê duyệt yêu cầu ${request.requestCode}? Thao tác này không trừ tồn kho.`} onClose={() => setAction(null)} onConfirm={approve} />}
    {action === 'reject' && <Modal title="Từ chối yêu cầu" onClose={() => setAction(null)}><div className="modal-body"><Field label="Lý do từ chối *" error={error}><Textarea required maxLength="2000" value={reason} onChange={(event) => setReason(event.target.value)} /></Field></div><div className="modal-actions"><Button variant="secondary" onClick={() => setAction(null)}>Hủy</Button><Button variant="danger" disabled={saving} onClick={reject}>Xác nhận từ chối</Button></div></Modal>}
  </>
}

export function RequestManagementPage() {
  const { notify } = useToast()
  const [query, setQuery] = useState('')
  const [draft, setDraft] = useState({ dealerId: '', status: '', from: '', to: '' })
  const [applied, setApplied] = useState({ search: '', dealerId: '', status: '', from: '', to: '' })
  const [dealers, setDealers] = useState([])
  const [dialog, setDialog] = useState(null)
  const filters = useMemo(() => applied, [applied])
  const list = usePagedResource(dealerRequestApi.listAll, { filters, sort: 'createdAt,desc' })

  useEffect(() => {
    let active = true
    dealerApi.list({ page: 0, size: 100, sort: 'name,asc' })
      .then((page) => { if (active) setDealers(page.content) })
      .catch((error) => { if (active) notify(error.message, 'error') })
    return () => { active = false }
  }, [notify])

  async function openReview(item) {
    try { setDialog({ type: 'review', entity: await dealerRequestApi.get(item.id) }) }
    catch (error) { notify(error.message, 'error') }
  }

  function applyFilters(event) {
    event.preventDefault(); list.beginChange(); list.setPage(0); setApplied({ search: query.trim(), ...draft })
  }

  const columns = [
    { key: 'requestCode', label: 'Mã yêu cầu', render: (item) => <strong>{item.requestCode}</strong> },
    { key: 'dealerName', label: 'Đại lý', render: (item) => `${item.dealerCode} · ${item.dealerName}` },
    { key: 'createdAt', label: 'Ngày gửi', render: (item) => formatDate(item.createdAt) },
    { key: 'totalQuantity', label: 'Số lượng' },
    { key: 'status', label: 'Trạng thái', render: (item) => <RequestStatus value={item.status} /> },
    { key: 'actions', label: 'Thao tác', render: (item) => <Button variant="text" onClick={() => openReview(item)}>{item.status === 'PENDING' ? 'Xét duyệt' : 'Chi tiết'}</Button> },
  ]

  return <div className="page"><PageHeader title="Quản lý yêu cầu đại lý" description="Xem xét yêu cầu; phê duyệt không giữ chỗ hoặc trừ tồn kho." /><section className="card"><FilterBar className="request-filters" onSubmit={applyFilters}><SearchBar value={query} onChange={setQuery} label="Tìm yêu cầu" placeholder="Mã yêu cầu hoặc đại lý…" buttonLabel="Áp dụng" /><Select aria-label="Lọc đại lý" value={draft.dealerId} onChange={(event) => setDraft((value) => ({ ...value, dealerId: event.target.value }))}><option value="">Tất cả đại lý</option>{dealers.map((dealer) => <option key={dealer.id} value={dealer.id}>{dealer.dealerCode} · {dealer.name}</option>)}</Select><Select aria-label="Lọc trạng thái" value={draft.status} onChange={(event) => setDraft((value) => ({ ...value, status: event.target.value }))}><option value="">Tất cả trạng thái</option>{Object.entries(STATUS_LABELS).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</Select><Input aria-label="Từ ngày" type="date" value={draft.from} onChange={(event) => setDraft((value) => ({ ...value, from: event.target.value }))} /><Input aria-label="Đến ngày" type="date" min={draft.from || undefined} value={draft.to} onChange={(event) => setDraft((value) => ({ ...value, to: event.target.value }))} /></FilterBar><DataTable columns={columns} rows={list.result.content} loading={list.loading} error={list.error} onRetry={list.load} emptyMessage="Không có yêu cầu phù hợp." /><Pagination page={list.page} totalPages={list.result.totalPages} totalElements={list.result.totalElements} noun="yêu cầu" onPageChange={(page) => { list.beginChange(); list.setPage(page) }} /></section>{dialog?.type === 'review' && <RequestReviewPage request={dialog.entity} onClose={() => setDialog(null)} onChanged={list.load} />}</div>
}

export default function DealerRequestPage() {
  const { currentUser } = useAuth()
  return currentUser?.role === ROLES.DEALER ? <DealerRequestListPage /> : <RequestManagementPage />
}
