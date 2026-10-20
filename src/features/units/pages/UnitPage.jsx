import { useMemo, useState } from 'react'
import { ROLES } from '../../../app/routeConfig.js'
import { useAuth } from '../../auth/authContext.js'
import usePagedResource from '../../../shared/hooks/usePagedResource.js'
import { Button, DataTable, Field, Input, Modal, PageHeader, Pagination, SearchBar, useToast } from '../../../shared/ui/index.js'
import { unitApi } from '../api/unitApi.js'

function UnitForm({ entity, onClose, onSaved }) {
  const { notify } = useToast()
  const [form, setForm] = useState({ code: entity?.code ?? '', name: entity?.name ?? '', symbol: entity?.symbol ?? '' })
  const [errors, setErrors] = useState({})
  const [saving, setSaving] = useState(false)
  const update = (field) => (event) => setForm((value) => ({ ...value, [field]: event.target.value }))
  async function submit(event) {
    event.preventDefault(); setSaving(true); setErrors({})
    try {
      if (entity) await unitApi.update(entity.id, { name: form.name, symbol: form.symbol })
      else await unitApi.create(form)
      notify(entity ? 'Đã cập nhật đơn vị tính.' : 'Đã tạo đơn vị tính.')
      await onSaved(); onClose()
    } catch (error) { setErrors(error.fieldErrors ?? {}); notify(error.message, 'error') }
    finally { setSaving(false) }
  }
  return <form onSubmit={submit}><div className="modal-body"><Field label="Mã đơn vị *" error={errors.code}><Input required maxLength="30" disabled={Boolean(entity)} value={form.code} onChange={update('code')} /></Field>{entity && <div className="notice">Mã đơn vị là bất biến sau khi tạo.</div>}<Field label="Tên đơn vị *" error={errors.name}><Input required maxLength="100" value={form.name} onChange={update('name')} /></Field><Field label="Ký hiệu *" error={errors.symbol}><Input required maxLength="20" value={form.symbol} onChange={update('symbol')} /></Field></div><div className="modal-actions"><Button variant="secondary" onClick={onClose}>Hủy</Button><Button type="submit" disabled={saving}>{saving ? 'Đang lưu…' : 'Lưu đơn vị'}</Button></div></form>
}

export default function UnitPage() {
  const { currentUser } = useAuth()
  const canManage = currentUser?.role === ROLES.WAREHOUSE_MANAGER
  const [query, setQuery] = useState('')
  const [search, setSearch] = useState('')
  const [dialog, setDialog] = useState(null)
  const filters = useMemo(() => ({ search }), [search])
  const list = usePagedResource(unitApi.list, { filters })
  const columns = [
    { key: 'code', label: 'Mã', render: (item) => <strong>{item.code}</strong> }, { key: 'name', label: 'Tên đơn vị' }, { key: 'symbol', label: 'Ký hiệu' },
    ...(canManage ? [{ key: 'actions', label: 'Thao tác', render: (item) => <Button variant="text" onClick={() => setDialog({ type: 'form', entity: item })}>Sửa</Button> }] : []),
  ]
  function submitSearch(event) { event.preventDefault(); list.beginChange(); list.setPage(0); setSearch(query.trim()) }
  return <div className="page"><PageHeader title="Đơn vị tính" description="Đơn vị tồn kho chuẩn dùng cho sản phẩm và chứng từ." actions={canManage && <Button onClick={() => setDialog({ type: 'form' })}>+ Thêm đơn vị</Button>} /><section className="card"><form className="toolbar" onSubmit={submitSearch}><SearchBar value={query} onChange={setQuery} label="Tìm đơn vị" placeholder="Tìm mã, tên hoặc ký hiệu…" /></form><DataTable columns={columns} rows={list.result.content} loading={list.loading} error={list.error} onRetry={list.load} /><Pagination page={list.page} totalPages={list.result.totalPages} totalElements={list.result.totalElements} onPageChange={(page) => { list.beginChange(); list.setPage(page) }} /></section>{dialog?.type === 'form' && <Modal title={dialog.entity ? 'Cập nhật đơn vị' : 'Thêm đơn vị'} onClose={() => setDialog(null)}><UnitForm entity={dialog.entity} onClose={() => setDialog(null)} onSaved={list.load} /></Modal>}</div>
}
