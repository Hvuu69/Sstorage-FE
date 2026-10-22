import { useMemo, useState } from 'react'
import usePagedResource from '../../../shared/hooks/usePagedResource.js'
import { Button, ConfirmDialog, DataTable, Field, FilterBar, Input, Modal, PageHeader, Pagination, SearchBar, Select, StatusBadge, Textarea, useToast } from '../../../shared/ui/index.js'
import { dealerApi } from '../api/dealerApi.js'

function normalizePayload(form, editing) {
  const contact = {
    name: form.name.trim(),
    phone: form.phone.trim(),
    email: form.email.trim(),
    address: form.address.trim(),
  }
  return editing ? contact : { dealerCode: form.dealerCode.trim(), ...contact }
}

export function DealerForm({ entity, onClose, onSaved }) {
  const { notify } = useToast()
  const [form, setForm] = useState({
    dealerCode: entity?.dealerCode ?? '', name: entity?.name ?? '', phone: entity?.phone ?? '',
    email: entity?.email ?? '', address: entity?.address ?? '',
  })
  const [errors, setErrors] = useState({})
  const [saving, setSaving] = useState(false)
  const update = (field) => (event) => setForm((value) => ({ ...value, [field]: event.target.value }))

  async function submit(event) {
    event.preventDefault(); setSaving(true); setErrors({})
    try {
      const payload = normalizePayload(form, Boolean(entity))
      if (entity) await dealerApi.update(entity.id, payload)
      else await dealerApi.create(payload)
      notify(entity ? 'Đã cập nhật đại lý.' : 'Đã tạo đại lý.')
      await onSaved(); onClose()
    } catch (error) {
      setErrors(error.fieldErrors ?? {}); notify(error.message, 'error')
    } finally { setSaving(false) }
  }

  return <form onSubmit={submit}>
    <div className="modal-body">
      <Field label="Mã đại lý *" error={errors.dealerCode}><Input required maxLength="30" disabled={Boolean(entity)} value={form.dealerCode} onChange={update('dealerCode')} /></Field>
      {entity && <div className="notice">Mã đại lý là định danh nghiệp vụ và không thể thay đổi.</div>}
      <Field label="Tên đại lý *" error={errors.name}><Input required maxLength="200" value={form.name} onChange={update('name')} /></Field>
      <Field label="Số điện thoại *" error={errors.phone}><Input type="tel" required maxLength="30" pattern="(?:\\+84|0)(?:[ .-]?[0-9]){9}" title="Dùng số Việt Nam bắt đầu bằng 0 hoặc +84." value={form.phone} onChange={update('phone')} /></Field>
      <Field label="Email liên hệ" error={errors.email}><Input type="email" maxLength="254" value={form.email} onChange={update('email')} /></Field>
      <Field label="Địa chỉ *" error={errors.address}><Textarea required value={form.address} onChange={update('address')} /></Field>
      <div className="notice">Hồ sơ đại lý không tự động tạo tài khoản đăng nhập.</div>
    </div>
    <div className="modal-actions"><Button variant="secondary" onClick={onClose}>Hủy</Button><Button type="submit" disabled={saving}>{saving ? 'Đang lưu…' : 'Lưu đại lý'}</Button></div>
  </form>
}

export function DealerDetail({ dealer, onClose }) {
  return <Modal title="Chi tiết đại lý" onClose={onClose}><div className="modal-body detail-grid">
    <div><span>Mã đại lý</span><strong>{dealer.dealerCode}</strong></div>
    <div><span>Trạng thái</span><StatusBadge status={dealer.active ? 'ACTIVE' : 'INACTIVE'} labels={{ ACTIVE: 'Hoạt động', INACTIVE: 'Ngừng hoạt động' }} /></div>
    <div className="full"><span>Tên đại lý</span><strong>{dealer.name}</strong></div>
    <div><span>Số điện thoại</span><strong>{dealer.phone || '—'}</strong></div>
    <div><span>Email</span><strong>{dealer.email || '—'}</strong></div>
    <div className="full"><span>Địa chỉ</span><strong>{dealer.address || '—'}</strong></div>
  </div></Modal>
}

export default function DealerPage() {
  const [query, setQuery] = useState('')
  const [draftStatus, setDraftStatus] = useState('')
  const [applied, setApplied] = useState({ search: '', active: '' })
  const [dialog, setDialog] = useState(null)
  const filters = useMemo(() => applied, [applied])
  const list = usePagedResource(dealerApi.list, { filters, sort: 'name,asc' })
  const { notify } = useToast()

  async function openDetail(item) {
    try { setDialog({ type: 'detail', entity: await dealerApi.get(item.id) }) }
    catch (error) { notify(error.message, 'error') }
  }

  async function changeStatus(item) {
    try {
      await dealerApi.changeStatus(item.id, !item.active)
      notify(item.active ? 'Đã ngừng hoạt động đại lý.' : 'Đã kích hoạt đại lý.')
      setDialog(null); await list.load()
    } catch (error) { notify(error.message, 'error') }
  }

  function submitFilters(event) {
    event.preventDefault(); list.beginChange(); list.setPage(0)
    setApplied({ search: query.trim(), active: draftStatus })
  }

  const columns = [
    { key: 'dealerCode', label: 'Mã đại lý', render: (item) => <strong>{item.dealerCode}</strong> },
    { key: 'name', label: 'Tên đại lý' },
    { key: 'phone', label: 'Điện thoại', render: (item) => item.phone || '—' },
    { key: 'email', label: 'Email', render: (item) => item.email || '—' },
    { key: 'active', label: 'Trạng thái', render: (item) => <StatusBadge status={item.active ? 'ACTIVE' : 'INACTIVE'} labels={{ ACTIVE: 'Hoạt động', INACTIVE: 'Ngừng' }} /> },
    { key: 'actions', label: 'Thao tác', render: (item) => <div className="table-actions"><Button variant="text" onClick={() => openDetail(item)}>Chi tiết</Button><Button variant="text" onClick={() => setDialog({ type: 'form', entity: item })}>Sửa</Button><Button variant={item.active ? 'danger' : 'secondary'} onClick={() => setDialog({ type: 'status', entity: item })}>{item.active ? 'Ngừng' : 'Kích hoạt'}</Button></div> },
  ]

  return <div className="page">
    <PageHeader title="Quản lý đại lý" description="Quản lý hồ sơ đối tác đại lý, tách biệt với tài khoản đăng nhập." actions={<Button onClick={() => setDialog({ type: 'form' })}>+ Thêm đại lý</Button>} />
    <section className="card">
      <FilterBar onSubmit={submitFilters}><SearchBar value={query} onChange={setQuery} label="Tìm đại lý" placeholder="Tìm mã hoặc tên…" buttonLabel="Áp dụng" /><Select aria-label="Lọc trạng thái" value={draftStatus} onChange={(event) => setDraftStatus(event.target.value)}><option value="">Tất cả trạng thái</option><option value="true">Hoạt động</option><option value="false">Ngừng hoạt động</option></Select></FilterBar>
      <DataTable columns={columns} rows={list.result.content} loading={list.loading} error={list.error} onRetry={list.load} emptyMessage="Chưa có đại lý phù hợp." />
      <Pagination page={list.page} totalPages={list.result.totalPages} totalElements={list.result.totalElements} noun="đại lý" onPageChange={(page) => { list.beginChange(); list.setPage(page) }} />
    </section>
    {dialog?.type === 'form' && <Modal title={dialog.entity ? 'Cập nhật đại lý' : 'Thêm đại lý'} onClose={() => setDialog(null)}><DealerForm entity={dialog.entity} onClose={() => setDialog(null)} onSaved={list.load} /></Modal>}
    {dialog?.type === 'detail' && <DealerDetail dealer={dialog.entity} onClose={() => setDialog(null)} />}
    {dialog?.type === 'status' && <ConfirmDialog dangerous={dialog.entity.active} message={`Bạn có chắc muốn ${dialog.entity.active ? 'ngừng hoạt động' : 'kích hoạt'} đại lý ${dialog.entity.dealerCode}? Việc này không xóa tài khoản hoặc lịch sử nghiệp vụ liên quan.`} onClose={() => setDialog(null)} onConfirm={() => changeStatus(dialog.entity)} />}
  </div>
}
