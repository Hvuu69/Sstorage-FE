import { useMemo, useState } from 'react'
import { ROLES } from '../../../app/routeConfig.js'
import { useAuth } from '../../auth/authContext.js'
import usePagedResource from '../../../shared/hooks/usePagedResource.js'
import { Button, ConfirmDialog, DataTable, Field, Input, Modal, PageHeader, Pagination, SearchBar, Select, StatusBadge, useToast } from '../../../shared/ui/index.js'
import { userApi } from '../api/userApi.js'

const ROLE_OPTIONS = [
  [ROLES.ADMIN, 'Quản trị viên'],
  [ROLES.WAREHOUSE_MANAGER, 'Quản lý kho'],
  [ROLES.WAREHOUSE_STAFF, 'Nhân viên kho'],
  [ROLES.DEALER, 'Đại lý'],
]
const ROLE_LABELS = Object.fromEntries(ROLE_OPTIONS)
const STATUS_LABELS = { ACTIVE: 'Hoạt động', LOCKED: 'Đã khóa', DISABLED: 'Vô hiệu hóa' }

function UserForm({ user, currentUser, onClose, onSaved }) {
  const { notify } = useToast()
  const isSelf = user?.id === currentUser?.userId
  const [form, setForm] = useState({
    fullName: user?.fullName ?? '',
    email: user?.email ?? '',
    role: user?.role ?? ROLES.WAREHOUSE_STAFF,
    dealerId: user?.dealerId ?? '',
    password: '',
  })
  const [errors, setErrors] = useState({})
  const [saving, setSaving] = useState(false)
  const update = (field) => (event) => setForm((value) => ({ ...value, [field]: event.target.value }))

  async function submit(event) {
    event.preventDefault()
    setSaving(true)
    setErrors({})
    const payload = {
      fullName: form.fullName.trim(),
      email: form.email.trim(),
      role: form.role,
      dealerId: form.role === ROLES.DEALER ? form.dealerId.trim() : null,
    }
    if (user) payload.newPassword = form.password
    else payload.password = form.password

    try {
      if (user) await userApi.update(user.id, payload)
      else await userApi.create(payload)
      notify(user ? 'Đã cập nhật tài khoản.' : 'Đã tạo tài khoản.')
      await onSaved()
      onClose()
    } catch (error) {
      setErrors(error.fieldErrors ?? {})
      notify(error.message, 'error')
    } finally {
      setSaving(false)
    }
  }

  return <form onSubmit={submit}>
    <div className="modal-body">
      <Field label="Họ và tên *" error={errors.fullName}><Input required maxLength="150" value={form.fullName} onChange={update('fullName')} /></Field>
      <Field label="Email đăng nhập *" error={errors.email} hint={isSelf ? 'Không thể tự đổi email đăng nhập khi đang dùng tài khoản này.' : undefined}><Input required type="email" autoComplete="off" maxLength="254" value={form.email} onChange={update('email')} disabled={isSelf} /></Field>
      <Field label="Vai trò *" error={errors.role}>
        <Select required value={form.role} disabled={isSelf} onChange={update('role')}>
          {ROLE_OPTIONS.map(([role, label]) => <option key={role} value={role}>{label}</option>)}
        </Select>
        {isSelf && <small className="field-hint">Không thể tự thay đổi vai trò quản trị của tài khoản đang dùng.</small>}
      </Field>
      {form.role === ROLES.DEALER && <Field label="Mã đại lý (UUID) *" error={errors.dealerId} hint="Nhập mã đại lý đã tồn tại trong hệ thống."><Input required value={form.dealerId} onChange={update('dealerId')} /></Field>}
      <Field label={user ? 'Mật khẩu mới' : 'Mật khẩu khởi tạo *'} error={errors[user ? 'newPassword' : 'password']} hint={user ? 'Để trống nếu không đổi mật khẩu.' : 'Tối thiểu 8 ký tự.'}>
        <Input required={!user} type="password" autoComplete="new-password" minLength={user ? undefined : 8} maxLength="72" value={form.password} onChange={update('password')} />
      </Field>
    </div>
    <div className="modal-actions"><Button variant="secondary" onClick={onClose} disabled={saving}>Hủy</Button><Button type="submit" disabled={saving}>{saving ? 'Đang lưu…' : 'Lưu tài khoản'}</Button></div>
  </form>
}

export default function UserAdminPage() {
  const { currentUser } = useAuth()
  const { notify } = useToast()
  const [query, setQuery] = useState('')
  const [search, setSearch] = useState('')
  const [role, setRole] = useState('')
  const [status, setStatus] = useState('')
  const [dialog, setDialog] = useState(null)
  const [changingStatus, setChangingStatus] = useState(false)
  const filters = useMemo(() => ({ search, role: role || undefined, status: status || undefined }), [role, search, status])
  const list = usePagedResource(userApi.list, { filters, sort: 'fullName,asc' })

  function searchUsers(event) {
    event.preventDefault()
    list.beginChange()
    list.setPage(0)
    setSearch(query.trim())
  }

  function changeFilter(setter, value) {
    list.beginChange()
    list.setPage(0)
    setter(value)
  }

  async function changeStatus(user) {
    const nextStatus = user.status === 'ACTIVE' ? 'LOCKED' : 'ACTIVE'
    setChangingStatus(true)
    try {
      await userApi.changeStatus(user.id, nextStatus)
      notify(nextStatus === 'LOCKED' ? 'Đã khóa tài khoản.' : 'Đã kích hoạt tài khoản.')
      setDialog(null)
      await list.load()
    } catch (error) {
      notify(error.message, 'error')
    } finally {
      setChangingStatus(false)
    }
  }

  const columns = [
    { key: 'fullName', label: 'Họ và tên', render: (user) => <strong>{user.fullName}</strong> },
    { key: 'email', label: 'Email' },
    { key: 'role', label: 'Vai trò', render: (user) => ROLE_LABELS[user.role] ?? user.role },
    { key: 'status', label: 'Trạng thái', render: (user) => <StatusBadge status={user.status} labels={STATUS_LABELS} /> },
    { key: 'dealerId', label: 'Mã đại lý', render: (user) => user.dealerId ?? '—' },
    { key: 'actions', label: 'Thao tác', render: (user) => <div className="table-actions">
      <Button variant="text" onClick={() => setDialog({ type: 'form', user })}>Sửa</Button>
      {user.id !== currentUser?.userId && <Button variant={user.status === 'ACTIVE' ? 'danger' : 'secondary'} onClick={() => setDialog({ type: 'status', user })}>
        {user.status === 'ACTIVE' ? 'Khóa' : user.status === 'LOCKED' ? 'Mở khóa' : 'Kích hoạt'}
      </Button>}
    </div> },
  ]

  return <div className="page">
    <PageHeader title="Quản lý tài khoản" description="Tạo tài khoản, gán vai trò và kiểm soát trạng thái truy cập." actions={<Button onClick={() => setDialog({ type: 'form' })}>+ Tạo tài khoản</Button>} />
    <section className="card">
      <form className="toolbar user-filters" onSubmit={searchUsers}>
        <SearchBar value={query} onChange={setQuery} label="Tìm tài khoản" placeholder="Tên hoặc email…" />
        <Select aria-label="Lọc vai trò" value={role} onChange={(event) => changeFilter(setRole, event.target.value)}>
          <option value="">Tất cả vai trò</option>{ROLE_OPTIONS.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
        </Select>
        <Select aria-label="Lọc trạng thái" value={status} onChange={(event) => changeFilter(setStatus, event.target.value)}>
          <option value="">Tất cả trạng thái</option><option value="ACTIVE">Hoạt động</option><option value="LOCKED">Đã khóa</option><option value="DISABLED">Vô hiệu hóa</option>
        </Select>
      </form>
      <DataTable columns={columns} rows={list.result.content} loading={list.loading} error={list.error} onRetry={list.load} emptyMessage="Chưa có tài khoản phù hợp." />
      <Pagination page={list.page} totalPages={list.result.totalPages} totalElements={list.result.totalElements} noun="tài khoản" onPageChange={(page) => { list.beginChange(); list.setPage(page) }} />
    </section>
    {dialog?.type === 'form' && <Modal title={dialog.user ? 'Cập nhật tài khoản' : 'Tạo tài khoản'} onClose={() => setDialog(null)}><UserForm user={dialog.user} currentUser={currentUser} onClose={() => setDialog(null)} onSaved={list.load} /></Modal>}
    {dialog?.type === 'status' && <ConfirmDialog
      title="Thay đổi trạng thái tài khoản"
      message={`Bạn có chắc muốn ${dialog.user.status === 'ACTIVE' ? 'khóa' : dialog.user.status === 'LOCKED' ? 'mở khóa' : 'kích hoạt lại'} tài khoản ${dialog.user.email}?`}
      confirmLabel={dialog.user.status === 'ACTIVE' ? 'Khóa tài khoản' : 'Kích hoạt'}
      dangerous={dialog.user.status === 'ACTIVE'}
      busy={changingStatus}
      onClose={() => setDialog(null)}
      onConfirm={() => changeStatus(dialog.user)}
    />}
  </div>
}
