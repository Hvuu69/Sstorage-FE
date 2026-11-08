import { useMemo, useState, useEffect } from 'react'
import { ROLES } from '../../../app/routeConfig.js'
import { useAuth } from '../../auth/authContext.js'
import usePagedResource from '../../../shared/hooks/usePagedResource.js'
import { unitApi } from '../api/unitApi.js'

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
  filterRow: { padding: '16px', borderBottom: '1px solid #e5e7eb', display: 'flex', alignItems: 'center', gap: '16px' },
  searchWrapper: { position: 'relative', display: 'flex', alignItems: 'center' },
  searchIcon: { position: 'absolute', left: '12px', color: '#9ca3af' },
  searchInput: { padding: '10px 12px 10px 36px', borderRadius: '8px', border: '1px solid #d1d5db', width: '300px', fontSize: '14px', outline: 'none' },
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
  modalContent: { backgroundColor: '#fff', borderRadius: '16px', width: '100%', maxWidth: '600px', maxHeight: '90vh', display: 'flex', flexDirection: 'column', overflow: 'hidden', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)' },
  modalHeader: { padding: '20px', borderBottom: '1px solid #e5e7eb', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0 },
  modalBody: { padding: '24px', overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: '16px' },
  modalFooter: { padding: '16px 20px', backgroundColor: '#f9fafb', borderTop: '1px solid #e5e7eb', display: 'flex', justifyContent: 'flex-end', gap: '12px', flexShrink: 0 },
  inputGroup: { display: 'flex', flexDirection: 'column', gap: '6px', flex: 1, minWidth: '200px' },
  label: { fontSize: '14px', fontWeight: '500', color: '#374151' },
  input: { padding: '10px 12px', borderRadius: '8px', border: '1px solid #d1d5db', width: '100%', fontSize: '14px', boxSizing: 'border-box', outline: 'none' },
  
  // UI XÁC NHẬN
  confirmBox: { backgroundColor: '#fff', borderRadius: '16px', width: '100%', maxWidth: '400px', padding: '24px', textAlign: 'center', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)' },
  confirmTitle: { fontSize: '18px', fontWeight: 'bold', color: '#111827', margin: '0 0 8px 0' },
  confirmText: { fontSize: '14px', color: '#4b5563', margin: '0 0 24px 0', lineHeight: '1.5' },
  confirmActions: { display: 'flex', justifyContent: 'center', gap: '12px' },
  
  // UI THÔNG BÁO (TOAST)
  toastWrapper: { position: 'fixed', top: '24px', right: '24px', zIndex: 9999, display: 'flex', alignItems: 'center', gap: '12px', padding: '14px 20px', borderRadius: '12px', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1), 0 4px 6px -2px rgba(0,0,0,0.05)', fontWeight: '500', fontSize: '14px', minWidth: '280px', border: '1px solid', backdropFilter: 'blur(10px)', animation: 'slideInRight 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards' },
  toastSuccess: { backgroundColor: 'rgba(236, 253, 245, 0.95)', borderColor: '#10b981', color: '#065f46' },
  toastError: { backgroundColor: 'rgba(254, 242, 242, 0.95)', borderColor: '#ef4444', color: '#991b1b' },
  toastIcon: { width: '24px', height: '24px', flexShrink: 0 },
  toastClose: { background: 'none', border: 'none', cursor: 'pointer', fontSize: '18px', color: 'inherit', opacity: 0.6, marginLeft: 'auto', transition: 'opacity 0.2s' }
};

// Nhúng Keyframes
if (typeof document !== 'undefined') {
  const styleTag = document.createElement('style');
  styleTag.innerHTML = `
    @keyframes slideInRight { from { transform: translateX(100%); opacity: 0; } to { transform: translateX(0); opacity: 1; } }
    input:focus, textarea:focus { border-color: #2563eb !important; box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1) !important; }
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

// ==========================================
// FORM THÊM/SỬA ĐƠN VỊ
// ==========================================
function UnitForm({ entity, onClose, onSaved, showToast }) {
  const [form, setForm] = useState({ code: entity?.code ?? '', name: entity?.name ?? '', symbol: entity?.symbol ?? '' })
  const [errors, setErrors] = useState({})
  const [saving, setSaving] = useState(false)
  const update = (field) => (event) => setForm((value) => ({ ...value, [field]: event.target.value }))
  
  async function submit(event) {
    event.preventDefault(); setSaving(true); setErrors({})
    try {
      if (entity) await unitApi.update(entity.id, { name: form.name, symbol: form.symbol })
      else await unitApi.create(form)
      showToast(entity ? 'Đã cập nhật đơn vị tính.' : 'Đã tạo đơn vị tính.', 'success')
      await onSaved(); onClose()
    } catch (error) { 
      setErrors(error.fieldErrors ?? {}); 
      showToast(error.message, 'error') 
    }
    finally { setSaving(false) }
  }

  return (
    <form onSubmit={submit}>
      <div style={s.modalBody}>
        <div style={s.inputGroup}>
          <label style={s.label}>Mã đơn vị *</label>
          <input required maxLength="30" disabled={Boolean(entity)} value={form.code} onChange={update('code')} style={s.input} />
          {entity && <div style={{ fontSize: '13px', color: '#92400e', backgroundColor: '#fef3c7', padding: '8px 12px', borderRadius: '6px', marginTop: '4px' }}>Mã đơn vị là bất biến sau khi tạo.</div>}
          {errors.code && <span style={{ color: '#dc2626', fontSize: '12px' }}>{errors.code}</span>}
        </div>
        <div style={s.inputGroup}>
          <label style={s.label}>Tên đơn vị *</label>
          <input required maxLength="100" value={form.name} onChange={update('name')} style={s.input} />
          {errors.name && <span style={{ color: '#dc2626', fontSize: '12px' }}>{errors.name}</span>}
        </div>
        <div style={s.inputGroup}>
          <label style={s.label}>Ký hiệu *</label>
          <input required maxLength="20" value={form.symbol} onChange={update('symbol')} style={s.input} />
          {errors.symbol && <span style={{ color: '#dc2626', fontSize: '12px' }}>{errors.symbol}</span>}
        </div>
      </div>
      <div style={s.modalFooter}>
        <button type="button" onClick={onClose} style={{ padding: '10px 16px', borderRadius: '8px', border: '1px solid #d1d5db', background: '#fff', cursor: 'pointer' }}>Hủy</button>
        <button type="submit" disabled={saving} style={s.btnPrimary}>{saving ? 'Đang lưu…' : 'Lưu đơn vị'}</button>
      </div>
    </form>
  )
}

// ==========================================
// TRANG CHÍNH
// ==========================================
export default function UnitPage() {
  const { currentUser } = useAuth()
  const canManage = currentUser?.role === ROLES.WAREHOUSE_MANAGER
  const [query, setQuery] = useState('')
  const [search, setSearch] = useState('')
  const [dialog, setDialog] = useState(null)
  const [toast, setToast] = useState(null)
  
  const filters = useMemo(() => ({ search }), [search])
  const list = usePagedResource(unitApi.list, { filters })

  // Hàm hiển thị Toast
  const showToast = (message, type = 'success') => {
    setToast({ message, type });
  };

  function submitSearch(event) { 
    event.preventDefault(); 
    list.beginChange(); 
    list.setPage(0); 
    setSearch(query.trim()) 
  }

  const currentPage = (list.page !== undefined && list.page !== null) ? list.page + 1 : 1;
  const totalPages = (list.result?.totalPages && list.result.totalPages > 0) ? list.result.totalPages : 1;
  const totalElements = list.result?.totalElements || 0;

  return (
    <div style={s.page}>
      <div style={s.header}>
        <div>
          <h1 style={s.title}>Đơn vị tính</h1>
          <p style={s.subtitle}>Đơn vị tồn kho chuẩn dùng cho sản phẩm và chứng từ.</p>
        </div>
        {canManage && <button style={s.btnPrimary} onClick={() => setDialog({ type: 'form' })}>+ Thêm đơn vị</button>}
      </div>

      <div style={s.card}>
        <div style={s.filterRow}>
          <div style={s.searchWrapper}>
            <SearchIcon />
            <input 
              placeholder="Tìm mã, tên hoặc ký hiệu..." 
              value={query} 
              onChange={(e) => setQuery(e.target.value)} 
              style={s.searchInput}
              onKeyDown={(e) => e.key === 'Enter' && submitSearch(e)}
            />
          </div>
          <button onClick={submitSearch} style={s.btnPrimary}>Tìm</button>
        </div>

        <div style={{ overflowX: 'auto', opacity: list.loading ? 0.6 : 1 }}>
          <table style={s.table}>
            <thead>
              <tr>
                <th style={s.th}>Mã</th>
                <th style={s.th}>Tên đơn vị</th>
                <th style={s.th}>Ký hiệu</th>
                {canManage && <th style={s.th}>Thao tác</th>}
              </tr>
            </thead>
            <tbody>
              {list.result.content.length === 0 ? (
                <tr><td colSpan={canManage ? 4 : 3} style={s.emptyTd}>Không có đơn vị tính phù hợp.</td></tr>
              ) : (
                list.result.content.map((item) => (
                  <tr key={item.id}>
                    <td style={s.td}><strong style={s.codeText}>{item.code}</strong></td>
                    <td style={s.td}>{item.name}</td>
                    <td style={s.td}>{item.symbol}</td>
                    {canManage && (
                      <td style={s.td}>
                        <button style={s.btnAction} onClick={() => setDialog({ type: 'form', entity: item })}>Sửa</button>
                      </td>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div style={s.pagination}>
          <span style={{ fontSize: '14px', color: '#6b7280' }}>
            {list.loading ? 'Đang tải...' : `Tổng cộng ${totalElements} đơn vị - Trang ${currentPage}/${totalPages}`}
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
              <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 'bold' }}>{dialog.entity ? 'Cập nhật đơn vị' : 'Thêm đơn vị'}</h3>
              <button onClick={() => setDialog(null)} style={{ background: 'none', border: 'none', fontSize: '24px', cursor: 'pointer', color: '#6b7280' }}>×</button>
            </div>
            <UnitForm entity={dialog.entity} onClose={() => setDialog(null)} onSaved={list.load} showToast={showToast} />
          </div>
        </div>
      )}

      {toast && <CustomToast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  )
}