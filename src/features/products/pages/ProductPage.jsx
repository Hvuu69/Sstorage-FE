import { useEffect, useMemo, useState } from 'react'
import { useAuth } from '../../auth/authContext.js'
import { categoryApi } from '../../categories/api/categoryApi.js'
import { unitApi } from '../../units/api/unitApi.js'
import usePagedResource from '../../../shared/hooks/usePagedResource.js'
import { Button, ConfirmDialog, DataTable, Field, FilterBar, Input, Modal, PageHeader, Pagination, SearchBar, Select, StatusBadge, Textarea, useToast } from '../../../shared/ui/index.js'
import { productApi } from '../api/productApi.js'
import { canManageProducts, canViewInternalStock } from '../productPermissions.js'

export function ProductForm({ entity, categories, units, onClose, onSaved }) {
  const { notify } = useToast()
  const selectableCategories = categories.filter((item) => item.active || item.id === entity?.categoryId)
  const [form, setForm] = useState({ sku: entity?.sku ?? '', name: entity?.name ?? '', description: entity?.description ?? '', categoryId: entity?.categoryId ?? selectableCategories[0]?.id ?? '', unitId: entity?.unitId ?? units[0]?.id ?? '' })
  const [errors, setErrors] = useState({})
  const [saving, setSaving] = useState(false)
  const update = (field) => (event) => setForm((value) => ({ ...value, [field]: event.target.value }))
  async function submit(event) {
    event.preventDefault(); setErrors({})
    if (!form.categoryId || !form.unitId) { setErrors({ categoryId: !form.categoryId ? 'Hãy chọn danh mục.' : '', unitId: !form.unitId ? 'Hãy chọn đơn vị.' : '' }); return }
    setSaving(true)
    try {
      if (entity) await productApi.update(entity.id, form)
      else await productApi.create(form)
      notify(entity ? 'Đã cập nhật sản phẩm.' : 'Đã tạo sản phẩm.')
      await onSaved(); onClose()
    } catch (error) { setErrors(error.fieldErrors ?? {}); notify(error.message, 'error') }
    finally { setSaving(false) }
  }
  return <form onSubmit={submit}><div className="modal-body"><Field label="SKU *" error={errors.sku}><Input required maxLength="60" value={form.sku} onChange={update('sku')} /></Field>{entity && <div className="notice">SKU chỉ đổi được khi sản phẩm chưa có dữ liệu nghiệp vụ liên quan.</div>}<Field label="Tên sản phẩm *" error={errors.name}><Input required maxLength="200" value={form.name} onChange={update('name')} /></Field><Field label="Danh mục *" error={errors.categoryId}><Select required value={form.categoryId} onChange={update('categoryId')}><option value="">Chọn danh mục</option>{selectableCategories.map((item) => <option key={item.id} value={item.id}>{item.code} · {item.name}{item.active ? '' : ' (đã ngừng)'}</option>)}</Select></Field><Field label="Đơn vị chuẩn *" error={errors.unitId}><Select required value={form.unitId} onChange={update('unitId')}><option value="">Chọn đơn vị</option>{units.map((item) => <option key={item.id} value={item.id}>{item.code} · {item.name} ({item.symbol})</option>)}</Select></Field><Field label="Mô tả" error={errors.description}><Textarea value={form.description} onChange={update('description')} /></Field><div className="notice">Không nhập hoặc chỉnh sửa tồn kho tại đây. Sản phẩm mới được khởi tạo tồn kho bằng 0.</div></div><div className="modal-actions"><Button variant="secondary" onClick={onClose}>Hủy</Button><Button type="submit" disabled={saving}>{saving ? 'Đang lưu…' : 'Lưu sản phẩm'}</Button></div></form>
}

export function ProductDetail({ product, showStock, onClose }) {
  return <Modal title="Chi tiết sản phẩm" onClose={onClose}><div className="modal-body detail-grid"><div><span>SKU</span><strong>{product.sku}</strong></div><div><span>Trạng thái</span><StatusBadge status={product.status} labels={{ ACTIVE: 'Hoạt động', INACTIVE: 'Ngừng hoạt động' }} /></div><div><span>Tên sản phẩm</span><strong>{product.name}</strong></div><div><span>Danh mục</span><strong>{product.categoryCode} · {product.categoryName}</strong></div><div><span>Đơn vị</span><strong>{product.unitName} ({product.unitSymbol})</strong></div>{showStock && <div><span>Tồn kho hiện tại</span><strong>{product.quantityOnHand ?? 'Chưa khởi tạo'}</strong></div>}<div className="full"><span>Mô tả</span><strong>{product.description || '—'}</strong></div></div></Modal>
}

export default function ProductPage() {
  const { currentUser } = useAuth()
  const canManage = canManageProducts(currentUser)
  const showStock = canViewInternalStock(currentUser)
  const [query, setQuery] = useState('')
  const [draft, setDraft] = useState({ categoryId: '', status: '' })
  const [applied, setApplied] = useState({ search: '', categoryId: '', status: '' })
  const [categories, setCategories] = useState([])
  const [units, setUnits] = useState([])
  const [dialog, setDialog] = useState(null)
  const filters = useMemo(() => applied, [applied])
  const list = usePagedResource(productApi.list, { filters })
  const { notify } = useToast()

  useEffect(() => {
    let active = true
    Promise.all([categoryApi.list({ page: 0, size: 100, sort: 'name,asc' }), unitApi.list({ page: 0, size: 100, sort: 'name,asc' })])
      .then(([categoryPage, unitPage]) => { if (active) { setCategories(categoryPage.content); setUnits(unitPage.content) } })
      .catch((error) => { if (active) notify(error.message, 'error') })
    return () => { active = false }
  }, [notify])

  async function openDetail(item) {
    try { setDialog({ type: 'detail', entity: await productApi.get(item.id) }) }
    catch (error) { notify(error.message, 'error') }
  }
  async function changeStatus(item) {
    try { await productApi.changeStatus(item.id, item.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE'); notify(item.status === 'ACTIVE' ? 'Đã ngừng hoạt động sản phẩm.' : 'Đã kích hoạt sản phẩm.'); setDialog(null); await list.load() }
    catch (error) { notify(error.message, 'error') }
  }
  function submitFilters(event) { event.preventDefault(); list.beginChange(); list.setPage(0); setApplied({ search: query.trim(), ...draft }) }
  const columns = [
    { key: 'sku', label: 'SKU', render: (item) => <strong>{item.sku}</strong> }, { key: 'name', label: 'Sản phẩm' }, { key: 'categoryName', label: 'Danh mục' }, { key: 'unitSymbol', label: 'Đơn vị' },
    ...(showStock ? [{ key: 'quantityOnHand', label: 'Tồn kho', render: (item) => item.quantityOnHand ?? '—' }] : []),
    { key: 'status', label: 'Trạng thái', render: (item) => <StatusBadge status={item.status} labels={{ ACTIVE: 'Hoạt động', INACTIVE: 'Ngừng' }} /> },
    { key: 'actions', label: 'Thao tác', render: (item) => <div className="table-actions"><Button variant="text" onClick={() => openDetail(item)}>Chi tiết</Button>{canManage && <><Button variant="text" onClick={() => setDialog({ type: 'form', entity: item })}>Sửa</Button><Button variant={item.status === 'ACTIVE' ? 'danger' : 'secondary'} onClick={() => setDialog({ type: 'status', entity: item })}>{item.status === 'ACTIVE' ? 'Ngừng' : 'Kích hoạt'}</Button></>}</div> },
  ]
  return <div className="page"><PageHeader title={currentUser?.role === 'DEALER' ? 'Danh mục sản phẩm' : 'Quản lý sản phẩm'} description={currentUser?.role === 'DEALER' ? 'Danh mục sản phẩm đang hoạt động.' : 'Quản lý thông tin chuẩn; tồn kho chỉ hiển thị để tra cứu.'} actions={canManage && <Button onClick={() => setDialog({ type: 'form' })}>+ Thêm sản phẩm</Button>} /><section className="card"><FilterBar className="product-filters" onSubmit={submitFilters}><SearchBar value={query} onChange={setQuery} label="Tìm sản phẩm" placeholder="Tìm SKU hoặc tên…" buttonLabel="Áp dụng" /><Select aria-label="Lọc danh mục" value={draft.categoryId} onChange={(event) => setDraft((value) => ({ ...value, categoryId: event.target.value }))}><option value="">Tất cả danh mục</option>{categories.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</Select>{currentUser?.role !== 'DEALER' && <Select aria-label="Lọc trạng thái" value={draft.status} onChange={(event) => setDraft((value) => ({ ...value, status: event.target.value }))}><option value="">Tất cả trạng thái</option><option value="ACTIVE">Hoạt động</option><option value="INACTIVE">Ngừng hoạt động</option></Select>}</FilterBar><DataTable columns={columns} rows={list.result.content} loading={list.loading} error={list.error} onRetry={list.load} emptyMessage="Chưa có sản phẩm phù hợp." /><Pagination page={list.page} totalPages={list.result.totalPages} totalElements={list.result.totalElements} noun="sản phẩm" onPageChange={(page) => { list.beginChange(); list.setPage(page) }} /></section>{dialog?.type === 'form' && <Modal title={dialog.entity ? 'Cập nhật sản phẩm' : 'Thêm sản phẩm'} onClose={() => setDialog(null)}><ProductForm entity={dialog.entity} categories={categories} units={units} onClose={() => setDialog(null)} onSaved={list.load} /></Modal>}{dialog?.type === 'detail' && <ProductDetail product={dialog.entity} showStock={showStock} onClose={() => setDialog(null)} />}{dialog?.type === 'status' && <ConfirmDialog dangerous={dialog.entity.status === 'ACTIVE'} message={`Bạn có chắc muốn ${dialog.entity.status === 'ACTIVE' ? 'ngừng hoạt động' : 'kích hoạt'} sản phẩm ${dialog.entity.sku}?`} onClose={() => setDialog(null)} onConfirm={() => changeStatus(dialog.entity)} />}</div>
}
