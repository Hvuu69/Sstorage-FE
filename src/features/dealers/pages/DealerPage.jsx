import { useMemo, useState, useEffect } from 'react'
import usePagedResource from '../../../shared/hooks/usePagedResource.js'
import { StatusBadge } from '../../../shared/ui/index.js'
import { dealerApi } from '../api/dealerApi.js'

// ==========================================
// CSS GỘP TRONG CODE
// ==========================================
const s = {
  page: { padding: '24px', backgroundColor: '#f9fafb', minHeight: '100vh', fontFamily: 'sans-serif', display: 'flex', flexDirection: 'column', gap: '24px' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' },
  title: { fontSize: '24px', fontWeight: 'bold', color: '#111827', margin: 0 },
  subtitle: { fontSize: '14px', color: '#6b7280', margin: '4px 0 0 0' },
  btnPrimary: { backgroundColor: '#2563eb', color: '#fff', padding: '10px 16px', borderRadius: '8px', border: 'none', cursor: 'pointer', fontWeight: '500', fontSize: '14px', boxShadow: '0 1px 2px 0 rgba(0,0,0,0.05)', transition: 'background-color 0.2s' },
  card: { backgroundColor: '#fff', borderRadius: '12px', border: '1px solid #e5e7eb', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', position: 'relative' },
  filterRow: { padding: '16px', borderBottom: '1px solid #e5e7eb', display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' },
  searchWrapper: { position: 'relative', display: 'flex', alignItems: 'center' },
  searchIcon: { position: 'absolute', left: '12px', color: '#9ca3af' },
  searchInput: { padding: '10px 12px 10px 36px', borderRadius: '8px', border: '1px solid #d1d5db', width: '300px', fontSize: '14px', outline: 'none' },
  select: { padding: '10px 12px', borderRadius: '8px', border: '1px solid #d1d5db', fontSize: '14px', outline: 'none', backgroundColor: '#fff', minWidth: '180px' },
  table: { width: '100%', borderCollapse: 'collapse', textAlign: 'left' },
  th: { padding: '16px', backgroundColor: '#f9fafb', borderBottom: '1px solid #e5e7eb', fontSize: '12px', fontWeight: '600', color: '#6b7280', textTransform: 'uppercase' },
  td: { padding: '16px', borderBottom: '1px solid #e5e7eb', fontSize: '14px', color: '#374151' },
  emptyTd: { padding: '60px 16px', textAlign: 'center', color: '#6b7280', fontSize: '14px' },
  codeText: { color: '#2563eb', fontWeight: 'bold' },
  btnAction: { background: 'none', border: 'none', color: '#2563eb', cursor: 'pointer', fontWeight: '500', padding: 0, transition: 'opacity 0.2s' },
  pagination: { padding: '16px 20px', borderTop: '1px solid #e5e7eb', display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  btnPage: { backgroundColor: '#fff', border: '1px solid #d1d5db', padding: '8px 16px', borderRadius: '6px', cursor: 'pointer', color: '#374151', fontSize: '14px', fontWeight: '500' },
  btnPageDisabled: { backgroundColor: '#f9fafb', border: '1px solid #e5e7eb', padding: '8px 16px', borderRadius: '6px', cursor: 'not-allowed', color: '#9ca3af', fontSize: '14px', fontWeight: '500' },
  
  modalOverlay: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 50, padding: '16px', backdropFilter: 'blur(4px)' },
  modalContent: { backgroundColor: '#fff', borderRadius: '16px', width: '100%', maxWidth: '650px', maxHeight: '90vh', display: 'flex', flexDirection: 'column', overflow: 'hidden', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)' },
  modalHeader: { padding: '20px', borderBottom: '1px solid #e5e7eb', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0 },
  modalBody: { padding: '24px', overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: '16px' },
  modalFooter: { padding: '16px 20px', backgroundColor: '#f9fafb', borderTop: '1px solid #e5e7eb', display: 'flex', justifyContent: 'flex-end', gap: '12px', flexShrink: 0 },
  inputGroup: { display: 'flex', flexDirection: 'column', gap: '6px', flex: 1, minWidth: '200px' },
  label: { fontSize: '14px', fontWeight: '500', color: '#374151' },
  input: { padding: '10px 12px', borderRadius: '8px', border: '1px solid #d1d5db', width: '100%', fontSize: '14px', boxSizing: 'border-box', outline: 'none' },
  
  confirmBox: { backgroundColor: '#fff', borderRadius: '16px', width: '100%', maxWidth: '400px', padding: '24px', textAlign: 'center', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)' },
  confirmTitle: { fontSize: '18px', fontWeight: 'bold', color: '#111827', margin: '0 0 8px 0' },
  confirmText: { fontSize: '14px', color: '#4b5563', margin: '0 0 24px 0', lineHeight: '1.5' },
  confirmActions: { display: 'flex', justifyContent: 'center', gap: '12px' },
  
  toastWrapper: { position: 'fixed', top: '24px', right: '24px', zIndex: 9999, display: 'flex', alignItems: 'center', gap: '12px', padding: '14px 20px', borderRadius: '12px', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1), 0 4px 6px -2px rgba(0,0,0,0.05)', fontWeight: '500', fontSize: '14px', minWidth: '280px', border: '1px solid', backdropFilter: 'blur(10px)', animation: 'slideInRight 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards' },
  toastSuccess: { backgroundColor: 'rgba(236, 253, 245, 0.95)', borderColor: '#10b981', color: '#065f46' },
  toastError: { backgroundColor: 'rgba(254, 242, 242, 0.95)', borderColor: '#ef4444', color: '#991b1b' },
  toastIcon: { width: '24px', height: '24px', flexShrink: 0 },
  toastClose: { background: 'none', border: 'none', cursor: 'pointer', fontSize: '18px', color: 'inherit', opacity: 0.6, marginLeft: 'auto', transition: 'opacity 0.2s' }
};

// Keyframes
if (typeof document !== 'undefined') {
  const styleTag = document.createElement('style');
  styleTag.innerHTML = `
    @keyframes slideInRight { from { transform: translateX(100%); opacity: 0; } to { transform: translateX(0); opacity: 1; } }
    input:focus, select:focus, textarea:focus { border-color: #2563eb !important; box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1) !important; }
    button:not(:disabled):hover { filter: brightness(0.95); }
  `;
  document.head.appendChild(styleTag);
}

const SearchIcon = () => (
  <svg style={s.searchIcon} width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line>
  </svg>
);

// ==========================================
// COMPONENT TOAST
// ==========================================
function CustomToast({ message, type = 'success', onClose }) {
  useEffect(() => {
    const timer = setTimeout(onClose, 3000);
    return () => clearTimeout(timer);
  }, [onClose]);
  
  const isError = type === 'error';
  return (
    <div style={{ ...s.toastWrapper, ...(isError ? s.toastError : s.toastSuccess) }}>
      {isError ? (
        <svg style={s.toastIcon} viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line>
        </svg>
      ) : (
        <svg style={s.toastIcon} viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline>
        </svg>
      )}
      <span style={{ fontWeight: '600' }}>{message}</span>
      <button onClick={onClose} style={s.toastClose}>×</button>
    </div>
  );
}

// ==========================================
// COMPONENT CONFIRM DIALOG
// ==========================================
function CustomConfirmDialog({ title, message, isDangerous, onConfirm, onClose, busy }) {
  return (
    <div style={s.modalOverlay}>
      <div style={s.confirmBox}>
        <h3 style={s.confirmTitle}>{title || 'Xác nhận'}</h3>
        <p style={s.confirmText}>{message}</p>
        <div style={s.confirmActions}>
          <button onClick={onClose} disabled={busy} style={{ padding: '10px 24px', borderRadius: '8px', border: '1px solid #d1d5db', background: '#fff', cursor: busy ? 'not-allowed' : 'pointer', fontWeight: '500' }}>Hủy</button>
          <button onClick={onConfirm} disabled={busy} style={{ padding: '10px 24px', borderRadius: '8px', border: 'none', backgroundColor: isDangerous ? '#dc2626' : '#2563eb', color: '#fff', cursor: busy ? 'not-allowed' : 'pointer', fontWeight: '500', opacity: busy ? 0.7 : 1 }}>
            {busy ? 'Đang xử lý...' : 'Đồng ý'}
          </button>
        </div>
      </div>
    </div>
  )
}

function normalizePayload(form, editing) {
  const contact = {
    name: form.name.trim(),
    phone: form.phone.trim(),
    email: form.email.trim(),
    address: form.address.trim(),
  }
  return editing ? contact : { dealerCode: form.dealerCode.trim(), ...contact }
}

// ==========================================
// FORM THÊM/SỬA ĐẠI LÝ
// ==========================================
export function DealerForm({ entity, onClose, onSaved, showToast }) {
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
      showToast(entity ? 'Đã cập nhật đại lý.' : 'Đã tạo đại lý.', 'success')
      await onSaved(); onClose()
    } catch (error) {
      setErrors(error.fieldErrors ?? {}); showToast(error.message, 'error')
    } finally { setSaving(false) }
  }

  return (
    <form onSubmit={submit}>
      <div style={s.modalBody}>
        <div style={s.inputGroup}>
          <label style={s.label}>Mã đại lý *</label>
          <input required maxLength="30" disabled={Boolean(entity)} value={form.dealerCode} onChange={update('dealerCode')} style={s.input} />
          {entity && <div style={{ fontSize: '13px', color: '#92400e', backgroundColor: '#fef3c7', padding: '8px 12px', borderRadius: '6px', marginTop: '4px' }}>Mã đại lý là định danh nghiệp vụ và không thể thay đổi.</div>}
          {errors.dealerCode && <span style={{ color: '#dc2626', fontSize: '12px' }}>{errors.dealerCode}</span>}
        </div>
        <div style={s.inputGroup}>
          <label style={s.label}>Tên đại lý *</label>
          <input required maxLength="200" value={form.name} onChange={update('name')} style={s.input} />
          {errors.name && <span style={{ color: '#dc2626', fontSize: '12px' }}>{errors.name}</span>}
        </div>
        <div style={s.inputGroup}>
          <label style={s.label}>Số điện thoại *</label>
          <input type="tel" required maxLength="30" value={form.phone} onChange={update('phone')} style={s.input} />
          {errors.phone && <span style={{ color: '#dc2626', fontSize: '12px' }}>{errors.phone}</span>}
        </div>
        <div style={s.inputGroup}>
          <label style={s.label}>Email liên hệ</label>
          <input type="email" maxLength="254" value={form.email} onChange={update('email')} style={s.input} />
          {errors.email && <span style={{ color: '#dc2626', fontSize: '12px' }}>{errors.email}</span>}
        </div>
        <div style={s.inputGroup}>
          <label style={s.label}>Địa chỉ *</label>
          <textarea required value={form.address} onChange={update('address')} style={{ ...s.input, minHeight: '80px', resize: 'vertical' }} />
          {errors.address && <span style={{ color: '#dc2626', fontSize: '12px' }}>{errors.address}</span>}
        </div>
      </div>
      <div style={s.modalFooter}>
        <button type="button" onClick={onClose} style={{ padding: '10px 16px', borderRadius: '8px', border: '1px solid #d1d5db', background: '#fff', cursor: 'pointer' }}>Hủy</button>
        <button type="submit" disabled={saving} style={s.btnPrimary}>{saving ? 'Đang lưu…' : 'Lưu đại lý'}</button>
      </div>
    </form>
  )
}

// ==========================================
// MODAL CHI TIẾT ĐẠI LÝ
// ==========================================
export function DealerDetail({ dealer, onClose }) {
  return (
    <div style={s.modalOverlay}>
      <div style={s.modalContent}>
        <div style={s.modalHeader}>
          <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 'bold' }}>Chi tiết đại lý</h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: '24px', cursor: 'pointer', color: '#6b7280' }}>×</button>
        </div>
        <div style={{ ...s.modalBody, display: 'grid', gridTemplateColumns: '1fr 1fr' }}>
          <div style={s.inputGroup}><span style={s.label}>Mã đại lý</span><strong style={{ fontSize: '15px', color: '#2563eb' }}>{dealer.dealerCode}</strong></div>
          <div style={s.inputGroup}><span style={s.label}>Trạng thái</span><StatusBadge status={dealer.active ? 'ACTIVE' : 'INACTIVE'} labels={{ ACTIVE: 'Hoạt động', INACTIVE: 'Ngừng hoạt động' }} /></div>
          <div style={{ ...s.inputGroup, gridColumn: 'span 2' }}><span style={s.label}>Tên đại lý</span><strong style={{ fontSize: '15px' }}>{dealer.name}</strong></div>
          <div style={s.inputGroup}><span style={s.label}>Số điện thoại</span><strong style={{ fontSize: '15px' }}>{dealer.phone || '—'}</strong></div>
          <div style={s.inputGroup}><span style={s.label}>Email</span><strong style={{ fontSize: '15px' }}>{dealer.email || '—'}</strong></div>
          <div style={{ ...s.inputGroup, gridColumn: 'span 2' }}><span style={s.label}>Địa chỉ</span><strong style={{ fontSize: '15px' }}>{dealer.address || '—'}</strong></div>
        </div>
        <div style={s.modalFooter}>
          <button onClick={onClose} style={{ padding: '10px 16px', borderRadius: '8px', border: '1px solid #d1d5db', background: '#fff', cursor: 'pointer', fontWeight: '500' }}>Đóng</button>
        </div>
      </div>
    </div>
  )
}

// ==========================================
// TRANG CHÍNH
// ==========================================
export default function DealerPage() {
  const [query, setQuery] = useState('')
  const [draftStatus, setDraftStatus] = useState('')
  const [applied, setApplied] = useState({ search: '', active: '' })
  const [dialog, setDialog] = useState(null)
  const [toast, setToast] = useState(null)
  
  const filters = useMemo(() => applied, [applied])
  const list = usePagedResource(dealerApi.list, { filters, sort: 'name,asc' })

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
  };

  // TỰ ĐỘNG LỌC KHI GÕ PHÍM HOẶC THAY ĐỔI BỘ LỌC (Debounce 300ms)
  useEffect(() => {
    const timer = setTimeout(() => {
      list.beginChange();
      list.setPage(0);
      setApplied({ search: query.trim(), active: draftStatus });
    }, 300); 
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query, draftStatus]);

  async function openDetail(item) {
    try { setDialog({ type: 'detail', entity: await dealerApi.get(item.id) }) }
    catch (error) { showToast(error.message, 'error') }
  }

  async function changeStatus(item) {
    try {
      await dealerApi.changeStatus(item.id, !item.active)
      showToast(item.active ? 'Đã ngừng hoạt động đại lý.' : 'Đã kích hoạt đại lý.', 'success')
      setDialog(null); await list.load()
    } catch (error) { showToast(error.message, 'error') }
  }

  const currentPage = (list.page !== undefined && list.page !== null) ? list.page + 1 : 1;
  const totalPages = (list.result?.totalPages && list.result.totalPages > 0) ? list.result.totalPages : 1;
  const totalElements = list.result?.totalElements || 0;

  return (
    <div style={s.page}>
      <div style={s.header}>
        <div>
          <h1 style={s.title}>Quản lý đại lý</h1>
          <p style={s.subtitle}>Quản lý hồ sơ đối tác đại lý, tách biệt với tài khoản đăng nhập.</p>
        </div>
        <button style={s.btnPrimary} onClick={() => setDialog({ type: 'form' })}>+ Thêm đại lý</button>
      </div>

      <div style={s.card}>
        <div style={s.filterRow}>
          <div style={s.searchWrapper}>
            <SearchIcon />
            <input 
              placeholder="Tìm mã hoặc tên…" 
              value={query} 
              onChange={(e) => setQuery(e.target.value)} 
              style={s.searchInput}
            />
          </div>
          <select value={draftStatus} onChange={(e) => setDraftStatus(e.target.value)} style={s.select}>
            <option value="">Tất cả trạng thái</option>
            <option value="true">Hoạt động</option>
            <option value="false">Ngừng hoạt động</option>
          </select>
        </div>

        <div style={{ overflowX: 'auto', opacity: list.loading ? 0.6 : 1 }}>
          <table style={s.table}>
            <thead>
              <tr>
                <th style={s.th}>Mã đại lý</th>
                <th style={s.th}>Tên đại lý</th>
                <th style={s.th}>Điện thoại</th>
                <th style={s.th}>Email</th>
                <th style={s.th}>Trạng thái</th>
                <th style={s.th}>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {list.result.content.length === 0 ? (
                <tr><td colSpan="6" style={s.emptyTd}>Chưa có đại lý phù hợp.</td></tr>
              ) : (
                list.result.content.map((item) => (
                  <tr key={item.id}>
                    <td style={s.td}><strong style={s.codeText}>{item.dealerCode}</strong></td>
                    <td style={s.td}>{item.name}</td>
                    <td style={s.td}>{item.phone || '—'}</td>
                    <td style={s.td}>{item.email || '—'}</td>
                    <td style={s.td}><StatusBadge status={item.active ? 'ACTIVE' : 'INACTIVE'} labels={{ ACTIVE: 'Hoạt động', INACTIVE: 'Ngừng' }} /></td>
                    <td style={s.td}>
                      <div style={{ display: 'flex', gap: '12px' }}>
                        <button style={s.btnAction} onClick={() => openDetail(item)}>Chi tiết</button>
                        <button style={s.btnAction} onClick={() => setDialog({ type: 'form', entity: item })}>Sửa</button>
                        <button 
                          style={{ ...s.btnAction, color: item.active ? '#dc2626' : '#16a34a' }} 
                          onClick={() => setDialog({ type: 'status', entity: item })}
                        >
                          {item.active ? 'Ngừng' : 'Kích hoạt'}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div style={s.pagination}>
          <span style={{ fontSize: '14px', color: '#6b7280' }}>
            {list.loading ? 'Đang tải...' : `Tổng cộng ${totalElements} đại lý - Trang ${currentPage}/${totalPages}`}
          </span>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button disabled={list.loading || currentPage <= 1} onClick={() => { list.beginChange(); list.setPage(list.page - 1) }} style={(list.loading || currentPage <= 1) ? s.btnPageDisabled : s.btnPage}>Trước</button>
            <button disabled={list.loading || currentPage >= totalPages} onClick={() => { list.beginChange(); list.setPage(list.page + 1) }} style={(list.loading || currentPage >= totalPages) ? s.btnPageDisabled : s.btnPage}>Sau</button>
          </div>
        </div>
      </div>

      {dialog?.type === 'form' && (
        <div style={s.modalOverlay}>
          <div style={s.modalContent}>
            <div style={s.modalHeader}>
              <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 'bold' }}>{dialog.entity ? 'Cập nhật đại lý' : 'Thêm đại lý'}</h3>
              <button onClick={() => setDialog(null)} style={{ background: 'none', border: 'none', fontSize: '24px', cursor: 'pointer', color: '#6b7280' }}>×</button>
            </div>
            <DealerForm entity={dialog.entity} onClose={() => setDialog(null)} onSaved={list.load} showToast={showToast} />
          </div>
        </div>
      )}
      
      {dialog?.type === 'detail' && <DealerDetail dealer={dialog.entity} onClose={() => setDialog(null)} />}
      
      {dialog?.type === 'status' && (
        <CustomConfirmDialog 
          title="Xác nhận thay đổi trạng thái"
          isDangerous={dialog.entity.active} 
          message={`Bạn có chắc muốn ${dialog.entity.active ? 'ngừng hoạt động' : 'kích hoạt'} đại lý ${dialog.entity.dealerCode}? Việc này không xóa tài khoản hoặc lịch sử nghiệp vụ liên quan.`} 
          onClose={() => setDialog(null)} 
          onConfirm={() => changeStatus(dialog.entity)} 
        />
      )}

      {toast && <CustomToast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  )
}