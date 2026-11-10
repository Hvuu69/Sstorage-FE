import { useEffect, useMemo, useState } from 'react'
import { ROLES } from '../../../app/routeConfig.js'
import usePagedResource from '../../../shared/hooks/usePagedResource.js'
import { StatusBadge, useToast } from '../../../shared/ui/index.js'
import { dealerApi } from '../../dealers/api/dealerApi.js'
import { productApi } from '../../products/api/productApi.js'
import { useAuth } from '../../auth/authContext.js'
import { dealerRequestApi } from '../api/dealerRequestApi.js'

// ==========================================
// HÀM HỖ TRỢ CACHE
// ==========================================
const getCache = (key) => {
  try { const s = localStorage.getItem(key); return s ? JSON.parse(s) : null; } catch { return null; }
};
const setCache = (key, data) => {
  try { localStorage.setItem(key, JSON.stringify(data)); } catch {}
};

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
  searchInput: { padding: '10px 12px 10px 36px', borderRadius: '8px', border: '1px solid #d1d5db', width: '250px', fontSize: '14px', outline: 'none' },
  select: { padding: '10px 12px', borderRadius: '8px', border: '1px solid #d1d5db', fontSize: '14px', outline: 'none', backgroundColor: '#fff', minWidth: '150px' },
  table: { width: '100%', borderCollapse: 'collapse', textAlign: 'left' },
  th: { padding: '16px', backgroundColor: '#f9fafb', borderBottom: '1px solid #e5e7eb', fontSize: '12px', fontWeight: '600', color: '#6b7280', textTransform: 'uppercase' },
  td: { padding: '16px', borderBottom: '1px solid #e5e7eb', fontSize: '14px', color: '#374151' },
  emptyTd: { padding: '60px 16px', textAlign: 'center', color: '#6b7280', fontSize: '14px' },
  codeText: { color: '#2563eb', fontWeight: 'bold' },
  badgeSuccess: { backgroundColor: '#ecfdf5', color: '#065f46', padding: '4px 8px', borderRadius: '4px', fontSize: '12px', fontWeight: '500' },
  badgePending: { backgroundColor: '#fef3c7', color: '#92400e', padding: '4px 8px', borderRadius: '4px', fontSize: '12px', fontWeight: '500' },
  badgeRejected: { backgroundColor: '#fee2e2', color: '#991b1b', padding: '4px 8px', borderRadius: '4px', fontSize: '12px', fontWeight: '500' },
  btnAction: { background: 'none', border: 'none', color: '#2563eb', cursor: 'pointer', fontWeight: '500', padding: 0 },
  pagination: { padding: '16px 20px', borderTop: '1px solid #e5e7eb', display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  btnPage: { backgroundColor: '#fff', border: '1px solid #d1d5db', padding: '8px 16px', borderRadius: '6px', cursor: 'pointer', color: '#374151', fontSize: '14px', fontWeight: '500' },
  btnPageDisabled: { backgroundColor: '#f9fafb', border: '1px solid #e5e7eb', padding: '8px 16px', borderRadius: '6px', cursor: 'not-allowed', color: '#9ca3af', fontSize: '14px', fontWeight: '500' },
  
  // Skeleton Loading CSS
  skeletonRow: { padding: '16px', borderBottom: '1px solid #e5e7eb', display: 'flex', gap: '16px' },
  skeletonBlock: { height: '16px', backgroundColor: '#e5e7eb', borderRadius: '4px', animation: 'pulse 1.5s infinite ease-in-out' },

  modalOverlay: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 50, padding: '16px' },
  modalContent: { backgroundColor: '#fff', borderRadius: '12px', width: '100%', maxWidth: '700px', maxHeight: '90vh', display: 'flex', flexDirection: 'column', overflow: 'hidden', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)' },
  modalHeader: { padding: '20px', borderBottom: '1px solid #e5e7eb', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0 },
  modalBody: { padding: '24px', overflowY: 'auto', flex: 1 },
  modalFooter: { padding: '16px 20px', backgroundColor: '#f9fafb', borderTop: '1px solid #e5e7eb', display: 'flex', justifyContent: 'flex-end', gap: '12px', flexShrink: 0 },
  detailGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '20px' },
  detailItem: { display: 'flex', flexDirection: 'column', gap: '4px' },
  detailLabel: { fontSize: '12px', color: '#6b7280', fontWeight: '500' },
  detailValue: { fontSize: '15px', color: '#111827', fontWeight: '500' },
  notice: { padding: '12px', backgroundColor: '#f3f4f6', color: '#4b5563', fontSize: '14px', borderRadius: '8px', marginTop: '16px' },
  noticeError: { padding: '12px', backgroundColor: '#fee2e2', color: '#991b1b', fontSize: '14px', borderRadius: '8px', marginBottom: '16px' },
  requestLine: { display: 'flex', gap: '12px', alignItems: 'flex-end', marginBottom: '12px', paddingBottom: '12px', borderBottom: '1px dashed #e5e7eb' },
  confirmBox: { backgroundColor: '#fff', borderRadius: '12px', width: '100%', maxWidth: '400px', padding: '24px', textAlign: 'center', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)' },
  confirmTitle: { fontSize: '18px', fontWeight: 'bold', color: '#111827', margin: '0 0 8px 0' },
  confirmText: { fontSize: '14px', color: '#4b5563', margin: '0 0 24px 0', lineHeight: '1.5' },
  confirmActions: { display: 'flex', justifyContent: 'center', gap: '12px' },
  input: { padding: '10px 12px', borderRadius: '8px', border: '1px solid #d1d5db', width: '100%', fontSize: '14px', boxSizing: 'border-box', outline: 'none' }
};

// Keyframes
if (typeof document !== 'undefined') {
  const styleTag = document.createElement('style');
  styleTag.innerHTML = `
    @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.5; } }
    @keyframes slideInRight { from { transform: translateX(100%); opacity: 0; } to { transform: translateX(0); opacity: 1; } }
    input:focus, select:focus { border-color: #2563eb !important; box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1) !important; }
    button:not(:disabled):hover { filter: brightness(0.95); }
  `;
  document.head.appendChild(styleTag);
}

const STATUS_LABELS = {
  PENDING: 'Chờ duyệt', APPROVED: 'Đã duyệt', REJECTED: 'Từ chối', FULFILLED: 'Đã xuất', CANCELLED: 'Đã hủy',
}

function formatDate(value) {
  return value ? new Intl.DateTimeFormat('vi-VN', { dateStyle: 'short', timeStyle: 'short' }).format(new Date(value)) : '—'
}

function RequestStatus({ value }) {
  const colorStyle = value === 'PENDING' ? s.badgePending : value === 'REJECTED' ? s.badgeRejected : s.badgeSuccess;
  return <span style={colorStyle}>{STATUS_LABELS[value] || value}</span>
}

const SearchIcon = () => (
  <svg style={s.searchIcon} width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line>
  </svg>
);

// ==========================================
// 1. MODAL XEM CHI TIẾT YÊU CẦU
// ==========================================
export function DealerRequestDetailPage({ request, onClose, actions }) {
  const total = request.items.reduce((sum, item) => sum + item.quantity, 0)
  
  return (
    <div style={s.modalOverlay}>
      <div style={s.modalContent}>
        <div style={s.modalHeader}>
          <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 'bold' }}>Yêu cầu {request.requestCode}</h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: '24px', cursor: 'pointer', color: '#6b7280' }}>×</button>
        </div>
        
        <div style={s.modalBody}>
          <div style={s.detailGrid}>
            <div style={s.detailItem}><span style={s.detailLabel}>Đại lý</span><strong style={s.detailValue}>{request.dealerCode} · {request.dealerName}</strong></div>
            <div style={s.detailItem}><span style={s.detailLabel}>Trạng thái</span><RequestStatus value={request.status} /></div>
            <div style={s.detailItem}><span style={s.detailLabel}>Ngày gửi</span><strong style={s.detailValue}>{formatDate(request.createdAt)}</strong></div>
            <div style={s.detailItem}><span style={s.detailLabel}>Người xét duyệt</span><strong style={s.detailValue}>{request.reviewedByName || '—'}</strong></div>
            <div style={{ ...s.detailItem, gridColumn: 'span 2' }}><span style={s.detailLabel}>Ghi chú</span><strong style={s.detailValue}>{request.note || '—'}</strong></div>
            {request.reviewNote && <div style={{ ...s.detailItem, gridColumn: 'span 2' }}><span style={s.detailLabel}>Lý do/Ghi chú xét duyệt</span><strong style={s.detailValue}>{request.reviewNote}</strong></div>}
          </div>

          <table style={s.table}>
            <thead>
              <tr>
                <th style={s.th}>SKU</th>
                <th style={s.th}>Sản phẩm</th>
                <th style={s.th}>Đơn vị</th>
                <th style={s.th}>Số lượng</th>
              </tr>
            </thead>
            <tbody>
              {request.items.map((item, idx) => (
                <tr key={idx}>
                  <td style={s.td}><strong>{item.sku}</strong></td>
                  <td style={s.td}>{item.productName}</td>
                  <td style={s.td}>{item.unitSymbol}</td>
                  <td style={s.td}>{item.quantity}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <div style={s.notice}>Tổng số lượng yêu cầu: <strong>{total}</strong>. Phê duyệt không giữ chỗ hoặc trừ tồn kho.</div>
        </div>

        {actions && <div style={s.modalFooter}>{actions}</div>}
      </div>
    </div>
  )
}

// ==========================================
// 2. MODAL TẠO YÊU CẦU MỚI
// ==========================================
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
  const [customToast, setCustomToast] = useState(null);

  useEffect(() => {
    let active = true
    productApi.list({ page: 0, size: 50, sort: 'name,asc', status: 'ACTIVE' })
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
      setCustomToast('Đã gửi yêu cầu hàng thành công!');
      setTimeout(() => setCustomToast(null), 3000);
      await onSubmitted(); onClose()
    } catch (requestError) {
      setFieldErrors(requestError.fieldErrors ?? {}); setError(requestError.message); setConfirming(false); 
    } finally { setSaving(false); }
  }

  const total = items.reduce((sum, item) => sum + (Number(item.quantity) > 0 ? Number(item.quantity) : 0), 0)

  return (
    <div style={s.modalOverlay}>
      <div style={s.modalContent}>
        <div style={s.modalHeader}>
          <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 'bold' }}>Tạo yêu cầu hàng</h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: '24px', cursor: 'pointer', color: '#6b7280' }}>×</button>
        </div>

        <form onSubmit={requestConfirmation} style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
          <div style={s.modalBody}>
            {loadingProducts && <div style={{ padding: '12px', backgroundColor: '#f3f4f6', borderRadius: '8px', marginBottom: '16px', color: '#6b7280' }}>Đang tải danh sách sản phẩm...</div>}
            {error && <div style={s.noticeError}>{error}</div>}
            
            {items.map((item, index) => (
              <div style={s.requestLine} key={index}>
                <div style={{ flex: 2 }}>
                  <label style={s.detailLabel}>Sản phẩm {index + 1} *</label>
                  <select required disabled={loadingProducts} value={item.productId} onChange={(event) => updateItem(index, 'productId', event.target.value)} style={s.input}>
                    <option value="">{loadingProducts ? 'Đang tải...' : 'Chọn sản phẩm đang hoạt động'}</option>
                    {products.map((product) => <option key={product.id} value={product.id} disabled={items.some((line, lineIndex) => lineIndex !== index && line.productId === product.id)}>{product.sku} · {product.name} ({product.unitSymbol})</option>)}
                  </select>
                </div>
                <div style={{ flex: 1 }}>
                  <label style={s.detailLabel}>Số lượng *</label>
                  <input type="number" required min="1" step="1" value={item.quantity} onChange={(event) => updateItem(index, 'quantity', event.target.value)} style={s.input} />
                </div>
                <button type="button" disabled={items.length === 1} onClick={() => setItems((current) => current.filter((_, itemIndex) => itemIndex !== index))} style={{ padding: '10px', background: 'none', border: 'none', color: items.length === 1 ? '#9ca3af' : '#dc2626', cursor: items.length === 1 ? 'not-allowed' : 'pointer', fontWeight: '500' }}>Xóa</button>
              </div>
            ))}
            
            <button type="button" onClick={() => setItems((current) => [...current, { productId: '', quantity: 1 }])} style={{ padding: '8px 16px', borderRadius: '6px', border: '1px solid #d1d5db', background: '#fff', cursor: 'pointer', fontSize: '14px', fontWeight: '500', marginBottom: '16px' }}>+ Thêm sản phẩm</button>
            
            <div>
              <label style={s.detailLabel}>Ghi chú</label>
              <textarea maxLength="2000" value={note} onChange={(event) => setNote(event.target.value)} style={{ ...s.input, minHeight: '80px', resize: 'vertical' }} />
            </div>
            
            <div style={s.notice}>Tổng số lượng: <strong>{total}</strong>. Yêu cầu chỉ được gửi cho đại lý gắn với tài khoản hiện tại.</div>
          </div>

          <div style={s.modalFooter}>
            <button type="button" onClick={onClose} style={{ padding: '10px 16px', borderRadius: '8px', border: '1px solid #d1d5db', background: '#fff', cursor: 'pointer', fontWeight: '500' }}>Hủy</button>
            <button type="submit" disabled={saving || loadingProducts || products.length === 0} style={{ ...s.btnPrimary, opacity: (saving || loadingProducts) ? 0.7 : 1 }}>Xác nhận gửi yêu cầu</button>
          </div>
        </form>
      </div>
      
      {confirming && (
        <div style={{ ...s.modalOverlay, zIndex: 100 }}>
          <div style={s.confirmBox}>
            <h3 style={s.confirmTitle}>Xác nhận gửi yêu cầu</h3>
            <p style={s.confirmText}>Gửi yêu cầu gồm <strong>{items.length} sản phẩm</strong>, tổng SL <strong>{total}</strong>?</p>
            <div style={s.confirmActions}>
              <button onClick={() => setConfirming(false)} disabled={saving} style={{ padding: '10px 24px', borderRadius: '8px', border: '1px solid #d1d5db', background: '#fff', cursor: saving ? 'not-allowed' : 'pointer', fontWeight: '500' }}>Hủy</button>
              <button onClick={submit} disabled={saving} style={{ padding: '10px 24px', borderRadius: '8px', border: 'none', backgroundColor: '#2563eb', color: '#fff', cursor: saving ? 'not-allowed' : 'pointer', fontWeight: '500', opacity: saving ? 0.7 : 1 }}>{saving ? 'Đang gửi...' : 'Đồng ý gửi'}</button>
            </div>
          </div>
        </div>
      )}
      {customToast && <div style={{ position: 'fixed', top: '24px', right: '24px', zIndex: 9999, backgroundColor: '#ecfdf5', border: '1px solid #10b981', color: '#065f46', padding: '12px 20px', borderRadius: '8px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)', display: 'flex', alignItems: 'center', gap: '12px', fontWeight: '500', fontSize: '14px' }}><span style={{ fontSize: '20px' }}>✅</span><span>{customToast}</span><button onClick={() => setCustomToast(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '18px', color: '#065f46', marginLeft: '12px' }}>×</button></div>}
    </div>
  )
}

// ==========================================
// 3. TRANG LỊCH SỬ ĐẶT HÀNG (DÀNH CHO ĐẠI LÝ)
// ==========================================
export function DealerRequestListPage() {
  const { notify } = useToast()
  const [status, setStatus] = useState('')
  const [dialog, setDialog] = useState(null)
  
  // Lấy cache ra hiển thị ngay lập tức
  const [cachedData, setCachedData] = useState(() => getCache('cached_dealer_history'));

  const filters = useMemo(() => ({ status }), [status])
  const list = usePagedResource(dealerRequestApi.listMine, { filters, sort: 'createdAt,desc' })

  // Lưu dữ liệu mới vào Cache mỗi khi load xong
  useEffect(() => {
    if (!list.loading && list.result?.content) {
      setCache('cached_dealer_history', list.result);
      setCachedData(list.result);
    }
  }, [list.loading, list.result]);

  async function openDetail(item) {
    try { setDialog({ type: 'detail', entity: await dealerRequestApi.getMine(item.id) }) }
    catch (error) { notify(error.message, 'error') }
  }

  // Hiển thị cache ngay lập tức nếu đang loading
  const displayData = (list.loading && cachedData) ? cachedData : list.result;
  
  const currentPage = (displayData?.number !== undefined && displayData?.number !== null) ? displayData.number + 1 : 1;
  const totalPages = (displayData?.totalPages && displayData.totalPages > 0) ? displayData.totalPages : 1;
  const totalElements = displayData?.totalElements || 0;

  return (
    <div style={s.page}>
      <div style={s.header}>
        <div>
          <h1 style={s.title}>Lịch sử đặt hàng</h1>
          <p style={s.subtitle}>Danh sách các yêu cầu cấp hàng bạn đã gửi</p>
        </div>
        <button style={s.btnPrimary} onClick={() => setDialog({ type: 'create' })}>+ Tạo yêu cầu</button>
      </div>

      <div style={s.card}>
        <div style={s.filterRow}>
          <select value={status} onChange={(event) => { list.beginChange(); list.setPage(0); setStatus(event.target.value) }} style={s.select}>
            <option value="">Tất cả trạng thái</option>
            {Object.entries(STATUS_LABELS).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
          </select>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table style={s.table}>
            <thead>
              <tr>
                <th style={s.th}>Mã yêu cầu</th>
                <th style={s.th}>Đại lý</th>
                <th style={s.th}>Ngày gửi</th>
                <th style={s.th}>Tổng SL</th>
                <th style={s.th}>Trạng thái</th>
                <th style={s.th}>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {list.loading && !cachedData ? (
                // Skeleton Loading lần đầu
                Array.from({ length: 3 }).map((_, idx) => (
                  <tr key={idx}><td colSpan="6" style={{ padding: 0 }}>
                    <div style={s.skeletonRow}>
                      <div style={{ ...s.skeletonBlock, width: '15%' }}></div>
                      <div style={{ ...s.skeletonBlock, width: '20%' }}></div>
                      <div style={{ ...s.skeletonBlock, width: '20%' }}></div>
                      <div style={{ ...s.skeletonBlock, width: '10%' }}></div>
                      <div style={{ ...s.skeletonBlock, width: '15%' }}></div>
                    </div>
                  </td></tr>
                ))
              ) : !displayData?.content || displayData.content.length === 0 ? (
                <tr><td colSpan="6" style={s.emptyTd}>Chưa có yêu cầu hàng.</td></tr>
              ) : (
                displayData.content.map((item) => (
                  <tr key={item.id}>
                    <td style={s.td}><strong style={s.codeText}>{item.requestCode}</strong></td>
                    <td style={s.td}>Đại lý của tôi</td>
                    <td style={s.td}>{formatDate(item.createdAt)}</td>
                    <td style={s.td}>{item.totalQuantity}</td>
                    <td style={s.td}><RequestStatus value={item.status} /></td>
                    <td style={s.td}>
                      <button onClick={() => openDetail(item)} style={s.btnAction}>Chi tiết</button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div style={s.pagination}>
          <span style={{ fontSize: '14px', color: '#6b7280' }}>
            {list.loading ? 'Đang tải...' : `Tổng cộng ${totalElements} yêu cầu - Trang ${currentPage}/${totalPages}`}
          </span>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button disabled={list.loading || currentPage <= 1} onClick={() => { list.beginChange(); list.setPage(list.page - 1) }} style={(list.loading || currentPage <= 1) ? s.btnPageDisabled : s.btnPage}>Trước</button>
            <button disabled={list.loading || currentPage >= totalPages} onClick={() => { list.beginChange(); list.setPage(list.page + 1) }} style={(list.loading || currentPage >= totalPages) ? s.btnPageDisabled : s.btnPage}>Sau</button>
          </div>
        </div>
      </div>

      {dialog?.type === 'create' && <DealerRequestCreatePage onClose={() => setDialog(null)} onSubmitted={list.load} />}
      {dialog?.type === 'detail' && <DealerRequestDetailPage request={dialog.entity} onClose={() => setDialog(null)} />}
    </div>
  )
}

// ==========================================
// 4. TRANG QUẢN LÝ YÊU CẦU (DÀNH CHO NHÂN VIÊN/ADMIN)
// ==========================================
export function RequestManagementPage() {
  const { notify } = useToast()
  const [query, setQuery] = useState('')
  const [draft, setDraft] = useState({ dealerId: '', status: '', from: '', to: '' })
  const [applied, setApplied] = useState({ search: '', dealerId: '', status: '', from: '', to: '' })
  const [dealers, setDealers] = useState([])
  const [dialog, setDialog] = useState(null)
  
  // Lấy cache ra
  const [cachedData, setCachedData] = useState(() => getCache('cached_request_manage'));

  const filters = useMemo(() => applied, [applied])
  const list = usePagedResource(dealerRequestApi.listAll, { filters, sort: 'createdAt,desc' })

  useEffect(() => {
    let active = true
    dealerApi.list({ page: 0, size: 100, sort: 'name,asc' })
      .then((page) => { if (active) setDealers(page.content) })
      .catch((error) => { if (active) notify(error.message, 'error') })
    return () => { active = false }
  }, [notify])

  // Lưu cache mỗi khi list thay đổi
  useEffect(() => {
    if (!list.loading && list.result?.content) {
      setCache('cached_request_manage', list.result);
      setCachedData(list.result);
    }
  }, [list.loading, list.result]);

  // Debounce tìm kiếm
  useEffect(() => {
    const timer = setTimeout(() => {
      list.beginChange();
      list.setPage(0);
      setApplied({ search: query.trim(), dealerId: draft.dealerId, status: draft.status, from: draft.from, to: draft.to });
    }, 500);
    return () => clearTimeout(timer);
  }, [query, draft.dealerId, draft.status, draft.from, draft.to]);

  async function openReview(item) {
    try { setDialog({ type: 'review', entity: await dealerRequestApi.get(item.id) }) }
    catch (error) { notify(error.message, 'error') }
  }

  const displayData = (list.loading && cachedData) ? cachedData : list.result;
  
  const currentPage = (displayData?.number !== undefined && displayData?.number !== null) ? displayData.number + 1 : 1;
  const totalPages = (displayData?.totalPages && displayData.totalPages > 0) ? displayData.totalPages : 1;
  const totalElements = displayData?.totalElements || 0;

  return (
    <div style={s.page}>
      <div style={s.header}>
        <div>
          <h1 style={s.title}>Quản lý yêu cầu đại lý</h1>
          <p style={s.subtitle}>Xem xét yêu cầu; phê duyệt không giữ chỗ hoặc trừ tồn kho.</p>
        </div>
      </div>

      <div style={s.card}>
        <div style={s.filterRow}>
          <div style={s.searchWrapper}>
            <SearchIcon />
            <input placeholder="Mã yêu cầu hoặc đại lý…" value={query} onChange={e => setQuery(e.target.value)} style={s.searchInput} />
          </div>
          <select value={draft.dealerId} onChange={(event) => setDraft((value) => ({ ...value, dealerId: event.target.value }))} style={s.select}>
            <option value="">Tất cả đại lý</option>
            {dealers.map((dealer) => <option key={dealer.id} value={dealer.id}>{dealer.dealerCode} · {dealer.name}</option>)}
          </select>
          <select value={draft.status} onChange={(event) => setDraft((value) => ({ ...value, status: event.target.value }))} style={s.select}>
            <option value="">Tất cả trạng thái</option>
            {Object.entries(STATUS_LABELS).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
          </select>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table style={s.table}>
            <thead>
              <tr>
                <th style={s.th}>Mã yêu cầu</th>
                <th style={s.th}>Đại lý</th>
                <th style={s.th}>Ngày gửi</th>
                <th style={s.th}>Số lượng</th>
                <th style={s.th}>Trạng thái</th>
                <th style={s.th}>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {list.loading && !cachedData ? (
                Array.from({ length: 3 }).map((_, idx) => (
                  <tr key={idx}><td colSpan="6" style={{ padding: 0 }}>
                    <div style={s.skeletonRow}>
                      <div style={{ ...s.skeletonBlock, width: '15%' }}></div>
                      <div style={{ ...s.skeletonBlock, width: '25%' }}></div>
                      <div style={{ ...s.skeletonBlock, width: '15%' }}></div>
                      <div style={{ ...s.skeletonBlock, width: '10%' }}></div>
                      <div style={{ ...s.skeletonBlock, width: '15%' }}></div>
                    </div>
                  </td></tr>
                ))
              ) : !displayData?.content || displayData.content.length === 0 ? (
                <tr><td colSpan="6" style={s.emptyTd}>Không có yêu cầu phù hợp.</td></tr>
              ) : (
                displayData.content.map((item) => (
                  <tr key={item.id}>
                    <td style={s.td}><strong style={s.codeText}>{item.requestCode}</strong></td>
                    <td style={s.td}>{item.dealerCode} · {item.dealerName}</td>
                    <td style={s.td}>{formatDate(item.createdAt)}</td>
                    <td style={s.td}>{item.totalQuantity}</td>
                    <td style={s.td}><RequestStatus value={item.status} /></td>
                    <td style={s.td}>
                      <button onClick={() => openReview(item)} style={s.btnAction}>
                        {item.status === 'PENDING' ? 'Xét duyệt' : 'Chi tiết'}
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div style={s.pagination}>
          <span style={{ fontSize: '14px', color: '#6b7280' }}>
            {list.loading ? 'Đang tải...' : `Tổng cộng ${totalElements} yêu cầu - Trang ${currentPage}/${totalPages}`}
          </span>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button disabled={list.loading || currentPage <= 1} onClick={() => { list.beginChange(); list.setPage(list.page - 1) }} style={(list.loading || currentPage <= 1) ? s.btnPageDisabled : s.btnPage}>Trước</button>
            <button disabled={list.loading || currentPage >= totalPages} onClick={() => { list.beginChange(); list.setPage(list.page + 1) }} style={(list.loading || currentPage >= totalPages) ? s.btnPageDisabled : s.btnPage}>Sau</button>
          </div>
        </div>
      </div>

      {dialog?.type === 'review' && <RequestReviewPage request={dialog.entity} onClose={() => setDialog(null)} onChanged={list.load} />}
    </div>
  )
}

// ==========================================
// 5. MODAL XÉT DUYỆT
// ==========================================
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

  const reviewActions = request.status === 'PENDING' && (
    <>
      <button disabled={saving} onClick={() => setAction('approve')} style={{ ...s.btnPrimary, marginRight: '8px' }}>Phê duyệt</button>
      <button disabled={saving} onClick={() => setAction('reject')} style={{ backgroundColor: '#fee2e2', color: '#b91c1c', border: '1px solid #fca5a5', padding: '10px 16px', borderRadius: '8px', cursor: 'pointer', fontWeight: '500' }}>Từ chối</button>
    </>
  )

  return (
    <>
      {action !== 'reject' && <DealerRequestDetailPage request={request} onClose={onClose} actions={reviewActions} />}
      
      {action === 'approve' && (
        <div style={{ ...s.modalOverlay, zIndex: 100 }}>
          <div style={s.confirmBox}>
            <h3 style={s.confirmTitle}>Phê duyệt yêu cầu</h3>
            <p style={s.confirmText}>Phê duyệt yêu cầu <strong>{request.requestCode}</strong>?</p>
            <div style={s.confirmActions}>
              <button onClick={() => setAction(null)} disabled={saving} style={{ padding: '10px 24px', borderRadius: '8px', border: '1px solid #d1d5db', background: '#fff', cursor: 'pointer', fontWeight: '500' }}>Hủy</button>
              <button onClick={approve} disabled={saving} style={{ padding: '10px 24px', borderRadius: '8px', border: 'none', backgroundColor: '#2563eb', color: '#fff', cursor: 'pointer', fontWeight: '500' }}>{saving ? 'Đang duyệt...' : 'Đồng ý'}</button>
            </div>
          </div>
        </div>
      )}
      
      {action === 'reject' && (
        <div style={{ ...s.modalOverlay, zIndex: 100 }}>
          <div style={{ ...s.modalContent, maxWidth: '400px' }}>
            <div style={s.modalHeader}>
              <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 'bold' }}>Từ chối yêu cầu</h3>
              <button onClick={() => setAction(null)} style={{ background: 'none', border: 'none', fontSize: '24px', cursor: 'pointer', color: '#6b7280' }}>×</button>
            </div>
            <div style={s.modalBody}>
              {error && <div style={s.noticeError}>{error}</div>}
              <label style={s.detailLabel}>Lý do từ chối *</label>
              <textarea required maxLength="2000" value={reason} onChange={(event) => setReason(event.target.value)} style={{ ...s.input, minHeight: '100px', resize: 'vertical', marginTop: '8px' }} />
            </div>
            <div style={s.modalFooter}>
              <button onClick={() => setAction(null)} style={{ padding: '10px 16px', borderRadius: '8px', border: '1px solid #d1d5db', background: '#fff', cursor: 'pointer' }}>Hủy</button>
              <button disabled={saving} onClick={reject} style={{ padding: '10px 16px', borderRadius: '8px', border: 'none', backgroundColor: '#dc2626', color: '#fff', cursor: 'pointer', fontWeight: '500' }}>{saving ? 'Đang xử lý...' : 'Xác nhận từ chối'}</button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

// ==========================================
// 6. COMPONENT GỐC
// ==========================================
export default function DealerRequestPage() {
  const { currentUser } = useAuth()
  return currentUser?.role === ROLES.DEALER ? <DealerRequestListPage /> : <RequestManagementPage />
}