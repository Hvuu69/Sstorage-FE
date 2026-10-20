import { useMemo, useState } from 'react'
import { ROLES } from '../../../app/routeConfig.js'
import { useAuth } from '../../auth/authContext.js'
import usePagedResource from '../../../shared/hooks/usePagedResource.js'
import { Button, ConfirmDialog, DataTable, Field, Input, Modal, PageHeader, Pagination, SearchBar, StatusBadge, Textarea, useToast } from '../../../shared/ui/index.js'
import { categoryApi } from '../api/categoryApi.js'

function CategoryForm({ entity, onClose, onSaved }) {
  const { notify } = useToast()
  const [form, setForm] = useState({ code: entity?.code ?? '', name: entity?.name ?? '', description: entity?.description ?? '' })
  const [errors, setErrors] = useState({})
  const [saving, setSaving] = useState(false)
  const update = (field) => (event) => setForm((value) => ({ ...value, [field]: event.target.value }))
  async function submit(event) {
    event.preventDefault(); setSaving(true); setErrors({})
    try {
      if (entity) await categoryApi.update(entity.id, form)
      else await categoryApi.create(form)
      notify(entity ? 'Đã cập nhật danh mục.' : 'Đã tạo danh mục.')
      await onSaved(); onClose()
    } catch (error) { setErrors(error.fieldErrors ?? {}); notify(error.message, 'error') }
    finally { setSaving(false) }
  }
  return <form onSubmit={submit}><div className="modal-body"><Field label="Mã danh mục *" error={errors.code}><Input required maxLength="30" value={form.code} onChange={update('code')} /></Field><Field label="Tên danh mục *" error={errors.name}><Input required maxLength="150" value={form.name} onChange={update('name')} /></Field><Field label="Mô tả" error={errors.description}><Textarea value={form.description} onChange={update('description')} /></Field></div><div className="modal-actions"><Button variant="secondary" onClick={onClose}>Hủy</Button><Button type="submit" disabled={saving}>{saving ? 'Đang lưu…' : 'Lưu danh mục'}</Button></div></form>
}

export default function CategoryPage() {
  const { currentUser } = useAuth()
  const canManage = currentUser?.role === ROLES.WAREHOUSE_MANAGER
  const [query, setQuery] = useState('')
  const [search, setSearch] = useState('')
  const [dialog, setDialog] = useState(null)
  const filters = useMemo(() => ({ search }), [search])
  const list = usePagedResource(categoryApi.list, { filters })
  const { notify } = useToast()
  async function changeStatus(category) {
    try { await categoryApi.changeStatus(category.id, !category.active); notify(category.active ? 'Đã vô hiệu hóa danh mục.' : 'Đã kích hoạt danh mục.'); setDialog(null); await list.load() }
    catch (error) { notify(error.message, 'error') }
  }
  const columns = [
    { key: 'code', label: 'Mã', render: (item) => <strong>{item.code}</strong> },
    { key: 'name', label: 'Tên danh mục' },
    { key: 'active', label: 'Trạng thái', render: (item) => <StatusBadge status={item.active ? 'ACTIVE' : 'INACTIVE'} labels={{ ACTIVE: 'Hoạt động', INACTIVE: 'Ngừng sử dụng' }} /> },
    ...(canManage ? [{ key: 'actions', label: 'Thao tác', render: (item) => <div className="table-actions"><Button variant="text" onClick={() => setDialog({ type: 'form', entity: item })}>Sửa</Button><Button variant={item.active ? 'danger' : 'secondary'} onClick={() => setDialog({ type: 'status', entity: item })}>{item.active ? 'Vô hiệu hóa' : 'Kích hoạt'}</Button></div> }] : []),
  ]
  function submitSearch(event) { event.preventDefault(); list.beginChange(); list.setPage(0); setSearch(query.trim()) }
  return <div className="page"><PageHeader title="Danh mục sản phẩm" description="Chuẩn hóa nhóm sản phẩm dùng chung trong toàn hệ thống." actions={canManage && <Button onClick={() => setDialog({ type: 'form' })}>+ Thêm danh mục</Button>} /><section className="card"><form className="toolbar" onSubmit={submitSearch}><SearchBar value={query} onChange={setQuery} label="Tìm danh mục" placeholder="Tìm mã hoặc tên…" /></form><DataTable columns={columns} rows={list.result.content} loading={list.loading} error={list.error} onRetry={list.load} /><Pagination page={list.page} totalPages={list.result.totalPages} totalElements={list.result.totalElements} onPageChange={(page) => { list.beginChange(); list.setPage(page) }} /></section>{dialog?.type === 'form' && <Modal title={dialog.entity ? 'Cập nhật danh mục' : 'Thêm danh mục'} onClose={() => setDialog(null)}><CategoryForm entity={dialog.entity} onClose={() => setDialog(null)} onSaved={list.load} /></Modal>}{dialog?.type === 'status' && <ConfirmDialog dangerous={dialog.entity.active} message={`Bạn có chắc muốn ${dialog.entity.active ? 'vô hiệu hóa' : 'kích hoạt'} danh mục ${dialog.entity.code}?`} onClose={() => setDialog(null)} onConfirm={() => changeStatus(dialog.entity)} />}</div>
}
