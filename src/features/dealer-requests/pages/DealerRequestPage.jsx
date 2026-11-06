import { useEffect, useMemo, useState } from 'react'
import { ROLES } from '../../../app/routeConfig.js'
import usePagedResource from '../../../shared/hooks/usePagedResource.js'
import { StatusBadge, useToast } from '../../../shared/ui/index.js'
import { dealerApi } from '../../dealers/api/dealerApi.js'
import { productApi } from '../../products/api/productApi.js'
import { useAuth } from '../../auth/authContext.js'
import { dealerRequestApi } from '../api/dealerRequestApi.js'

// ==========================================
// CSS GỘP TRONG CODE
// ==========================================
const s = {
  page: { display: 'flex', flexDirection: 'column', gap: '24px', padding: '24px', fontFamily: 'sans-serif', backgroundColor: '#f9fafb', minHeight: '100vh' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' },
  title: { fontSize: '24px', fontWeight: 'bold', color: '#111827', margin: 0 },
  subtitle: { fontSize: '14px', color: '#6b7280', margin: '4px 0 0 0' },
  btnPrimary: { backgroundColor: '#2563eb', color: '#fff', padding: '10px 16px', borderRadius: '8px', border: 'none', cursor: 'pointer', fontWeight: '500', fontSize: '14px', boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)' },
  card: { backgroundColor: '#fff', borderRadius: '12px', border: '1px solid #e5e7eb', boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)', padding: '20px', position: 'relative' },
  filterRow: { display: 'flex', flexWrap: 'wrap', gap: '16px', alignItems: 'center', marginBottom: '16px' },
  input: { padding: '10px 12px', borderRadius: '8px', border: '1px solid #d1d5db', width: '100%', fontSize: '14px', boxSizing: 'border-box', outline: 'none' },
  
  // Thanh Loading mảnh trên cùng
  loadingBar: { position: 'absolute', top: 0, left: 0, right: 0, height: '3px', backgroundColor: '#3b82f6', animation: 'pulse 1.5s infinite ease-in-out', borderTopLeftRadius: '12px', borderTopRightRadius: '12px' },
  
  tableWrapper: { overflowX: 'auto' },
  table: { width: '100%', borderCollapse: 'collapse', textAlign: 'left' },
  th: { padding: '16px', backgroundColor: '#f9fafb', borderBottom: '1px solid #e5e7eb', fontSize: '12px', fontWeight: '600', color: '#6b7280', textTransform: 'uppercase' },
  td: { padding: '16px', borderBottom: '1px solid #e5e7eb', fontSize: '14px', color: '#374151' },

  // Skeleton Loading
  skeletonRow: { padding: '16px', borderBottom: '1px solid #e5e7eb', display: 'flex', gap: '16px' },
  skeletonBlock: { height: '16px', backgroundColor: '#e5e7eb', borderRadius: '4px', animation: 'pulse 1.5s infinite ease-in-out' },

  modalOverlay: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 50 },
  modalContent: { backgroundColor: '#fff', borderRadius: '12px', width: '100%', maxWidth: '700px', overflow: 'hidden', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)', maxHeight: '90vh', display: 'flex', flexDirection: 'column' },
  modalHeader: { padding: '20px', borderBottom: '1px solid #e5e7eb', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0 },
  modalBody: { padding: '20px', overflowY: 'auto' },
  modalFooter: { padding: '16px 20px', backgroundColor: '#f9fafb', borderTop: '1px solid #e5e7eb', display: 'flex', justifyContent: 'flex-end', gap: '12px', flexShrink: 0 },
  detailGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '20px' },
  detailItem: { display: 'flex', flexDirection: 'column', gap: '4px' },
  detailLabel: { fontSize: '12px', color: '#6b7280', fontWeight: '500' },
  notice: { padding: '12px', backgroundColor: '#f3f4f6', color: '#4b5563', fontSize: '14px', borderRadius: '8px', marginTop: '16px' },
  noticeError: { padding: '12px', backgroundColor: '#fee2e2', color: '#991b1b', fontSize: '14px', borderRadius: '8px', marginBottom: '16px' },
  requestLine: { display: 'flex', gap: '12px', alignItems: 'flex-end', marginBottom: '12px', paddingBottom: '12px', borderBottom: '1px dashed #e5e7eb' },
  confirmBox: { backgroundColor: '#fff', borderRadius: '12px', width: '100%', maxWidth: '400px', padding: '24px', textAlign: 'center', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)' },
  confirmTitle: { fontSize: '18px', fontWeight: 'bold', color: '#111827', margin: '0 0 8px 0' },
  confirmText: { fontSize: '14px', color: '#4b5563', margin: '0 0 24px 0', lineHeight: '1.5' },
  confirmActions: { display: 'flex', justifyContent: 'center', gap: '12px' },
  toast: { position: 'fixed', top: '24px', right: '24px', zIndex: 9999, backgroundColor: '#ecfdf5', border: '1px solid #10b981', color: '#065f46', padding: '12px 20px', borderRadius: '8px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)', display: 'flex', alignItems: 'center', gap: '12px', fontWeight: '500', fontSize: '14px', animation: 'slideIn 0.3s ease-out' },
  toastClose: { background: 'none', border: 'none', cursor: 'pointer', fontSize: '18px', color: '#065f46', marginLeft: '12px', display: 'flex', alignItems: 'center' }
};

const STATUS_LABELS = { PENDING: 'Chờ duyệt', APPROVED: 'Đã duyệt', REJECTED: 'Từ chối', FULFILLED: 'Đã xuất', CANCELLED: 'Đã hủy' }
function formatDate(value) { return value ? new Intl.DateTimeFormat('vi-VN', { dateStyle: 'short', timeStyle: 'short' }).format(new Date(value)) : '—' }
function RequestStatus({ value }) { return <StatusBadge status={value} labels={STATUS_LABELS} /> }

// ==========================================
// HÀM HỖ TRỢ CACHE LOCALSTORAGE
// ==========================================
const getCache = (key) => {
  try {
    const cached = localStorage.getItem(key);
    return cached ? JSON.parse(cached) : null;
  } catch { return null; }
};
const setCache = (key, data) => {
  try { localStorage.setItem(key, JSON.stringify(data)); } catch {}
};

// ==========================================
// 1. TRANG XEM CHI TIẾT YÊU CẦU
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
            <div style={s.detailItem}><span style={s.detailLabel}>Đại lý</span><strong>{request.dealerCode} · {request.dealerName}</strong></div>
            <div style={s.detailItem}><span style={s.detailLabel}>Trạng thái</span><RequestStatus value={request.status} /></div>
            <div style={s.detailItem}><span style={s.detailLabel}>Ngày gửi</span><strong>{formatDate(request.createdAt)}</strong></div>
            <div style={s.detailItem}><span style={s.detailLabel}>Người xét duyệt</span><strong>{request.reviewedByName || '—'}</strong></div>
            <div style={{ ...s.detailItem, gridColumn: 'span 2' }}><span style={s.detailLabel}>Ghi chú</span><strong>{request.note || '—'}</strong></div>
          </div>
          <table style={s.table}>
            <thead><tr><th style={s.th}>SKU</th><th style={s.th}>Sản phẩm</th><th style={s.th}>Đơn vị</th><th style={s.th}>Số lượng</th></tr></thead>
            <tbody>
              {request.items.map((item, idx) => (
                <tr key={idx}><td style={s.td}><strong>{item.sku}</strong></td><td style={s.td}>{item.productName}</td><td style={s.td}>{item.unitSymbol}</td><td style={s.td}>{item.quantity}</td></tr>
              ))}
            </tbody>
          </table>
          <div style={s.notice}>Tổng số lượng yêu cầu: <strong>{total}</strong>.</div>
        </div>
        {actions && <div style={s.modalFooter}>{actions}</div>}
      </div>
    </div>
  )
}

// ==========================================
// 2. TRANG TẠO YÊU CẦU MỚI
// ==========================================
export function DealerRequestCreatePage({ onClose, onSubmitted }) {
  const [products, setProducts] = useState(() => getCache('cached_products') || [])
  const [loadingProducts, setLoadingProducts] = useState(products.length === 0)
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
      .then((page) => { 
        if (active) {
          const newProducts = page.content.filter((product) => product.status === 'ACTIVE');
          setProducts(newProducts);
          setCache('cached_products', newProducts);
        } 
      })
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
            <div><label style={s.detailLabel}>Ghi chú</label><textarea maxLength="2000" value={note} onChange={(event) => setNote(event.target.value)} style={{ ...s.input, minHeight: '80px', resize: 'vertical' }} /></div>
            <div style={s.notice}>Tổng số lượng: <strong>{total}</strong>.</div>
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
      {customToast && <div style={s.toast}><span style={{ fontSize: '20px' }}>✅</span><span>{customToast}</span><button onClick={() => setCustomToast(null)} style={s.toastClose}>×</button></div>}
    </div>
  )
}

// ==========================================
// 3. TRANG LỊCH SỬ ĐẶT HÀNG (ĐÃ CHỈNH UI)
// ==========================================
export function DealerRequestListPage() {
  const { notify } = useToast()
  const [status, setStatus] = useState('')
  const [dialog, setDialog] = useState(null)
  
  const [cachedList, setCachedList] = useState(() => getCache('cached_dealer_history'));

  const filters = useMemo(() => ({ status }), [status])
  const list = usePagedResource(dealerRequestApi.listMine, { filters, sort: 'createdAt,desc' })

  useEffect(() => {
    if (!list.loading && list.result?.content) {
      setCache('cached_dealer_history', list.result);
      setCachedList(list.result);
    }
  }, [list.loading, list.result]);

  async function openDetail(item) {
    try { setDialog({ type: 'detail', entity: await dealerRequestApi.getMine(item.id) }) }
    catch (error) { notify(error.message, 'error') }
  }

  // Xử lý an toàn cho phân trang
  const displayData = (list.loading && cachedList) ? cachedList : list.result;
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
        {list.loading && <div style={s.loadingBar}></div>}

        <div style={s.filterRow}>
          <div style={{ width: '300px' }}>
            <select value={status} onChange={(event) => { list.beginChange(); list.setPage(0); setStatus(event.target.value) }} style={s.input}>
              <option value="">Tất cả trạng thái</option>
              {Object.entries(STATUS_LABELS).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
            </select>
          </div>
        </div>

        <div style={s.tableWrapper}>
          <table style={s.table}>
            <thead>
              <tr>
                <th style={s.th}>Mã yêu cầu</th><th style={s.th}>Đại lý</th><th style={s.th}>Ngày gửi</th><th style={s.th}>Tổng SL</th><th style={s.th}>Trạng thái</th><th style={s.th}>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {/* HIỂN THỊ SKELETON KHI ĐANG LOAD LẦN ĐẦU */}
              {list.loading && !displayData?.content?.length ? (
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
              ) : !displayData?.content?.length ? (
                <tr><td colSpan="6" style={{ ...s.td, textAlign: 'center', padding: '40px', color: '#6b7280' }}>Chưa có yêu cầu hàng.</td></tr>
              ) : (
                displayData.content.map((item) => (
                  <tr key={item.id}>
                    <td style={s.td}><strong style={{ color: '#2563eb' }}>{item.requestCode}</strong></td>
                    <td style={s.td}>Đại lý của tôi</td>
                    <td style={s.td}>{formatDate(item.createdAt)}</td>
                    <td style={s.td}>{item.totalQuantity}</td>
                    <td style={s.td}><RequestStatus value={item.status} /></td>
                    <td style={s.td}><button onClick={() => openDetail(item)} style={{ background: '#fff', border: '1px solid #d1d5db', padding: '6px 12px', borderRadius: '6px', cursor: 'pointer', fontWeight: '500', fontSize: '13px' }}>Chi tiết</button></td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div style={{ padding: '16px 0 0 0', borderTop: '1px solid #e5e7eb', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '16px' }}>
          <span style={{ fontSize: '14px', color: '#6b7280' }}>
            {list.loading ? 'Đang tải dữ liệu...' : `Tổng cộng ${totalElements} yêu cầu - Trang ${currentPage}/${totalPages}`}
          </span>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button disabled={list.loading || currentPage <= 1} onClick={() => { list.beginChange(); list.setPage(list.page - 1) }} style={{ padding: '8px 16px', border: '1px solid #d1d5db', borderRadius: '6px', background: (list.loading || currentPage <= 1) ? '#f3f4f6' : '#fff', cursor: (list.loading || currentPage <= 1) ? 'not-allowed' : 'pointer', color: (list.loading || currentPage <= 1) ? '#9ca3af' : '#374151' }}>Trước</button>
            <button disabled={list.loading || currentPage >= totalPages} onClick={() => { list.beginChange(); list.setPage(list.page + 1) }} style={{ padding: '8px 16px', border: '1px solid #d1d5db', borderRadius: '6px', background: (list.loading || currentPage >= totalPages) ? '#f3f4f6' : '#fff', cursor: (list.loading || currentPage >= totalPages) ? 'not-allowed' : 'pointer', color: (list.loading || currentPage >= totalPages) ? '#9ca3af' : '#374151' }}>Sau</button>
          </div>
        </div>
      </div>

      {dialog?.type === 'create' && <DealerRequestCreatePage onClose={() => setDialog(null)} onSubmitted={list.load} />}
      {dialog?.type === 'detail' && <DealerRequestDetailPage request={dialog.entity} onClose={() => setDialog(null)} />}
    </div>
  )
}

// ==========================================
// 4. TRANG QUẢN LÝ YÊU CẦU (ĐÃ CHỈNH UI)
// ==========================================
export function RequestManagementPage() {
  const { notify } = useToast()
  const [query, setQuery] = useState('')
  const [draft, setDraft] = useState({ dealerId: '', status: '', from: '', to: '' })
  const [applied, setApplied] = useState({ search: '', dealerId: '', status: '', from: '', to: '' })
  const [dialog, setDialog] = useState(null)
  
  const [cachedList, setCachedList] = useState(() => getCache('cached_request_manage'));
  const [dealers, setDealers] = useState(() => getCache('cached_dealers_list') || []);

  const filters = useMemo(() => applied, [applied])
  const list = usePagedResource(dealerRequestApi.listAll, { filters, sort: 'createdAt,desc' })

  useEffect(() => {
    let active = true
    dealerApi.list({ page: 0, size: 100, sort: 'name,asc' })
      .then((page) => { 
        if (active) {
          setDealers(page.content);
          setCache('cached_dealers_list', page.content);
        } 
      })
      .catch((error) => { if (active) notify(error.message, 'error') })
    return () => { active = false }
  }, [notify])

  useEffect(() => {
    if (!list.loading && list.result?.content) {
      setCache('cached_request_manage', list.result);
      setCachedList(list.result);
    }
  }, [list.loading, list.result]);

  useEffect(() => {
    const timer = setTimeout(() => {
      list.beginChange();
      list.setPage(0);
      setApplied({ search: query.trim(), dealerId: draft.dealerId, status: draft.status, from: draft.from, to: draft.to });
    }, 300);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query, draft.dealerId, draft.status, draft.from, draft.to]);

  async function openReview(item) {
    try { setDialog({ type: 'review', entity: await dealerRequestApi.get(item.id) }) }
    catch (error) { notify(error.message, 'error') }
  }

  // Xử lý an toàn cho phân trang
  const displayData = (list.loading && cachedList) ? cachedList : list.result;
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
        {list.loading && <div style={s.loadingBar}></div>}

        <div style={s.filterRow}>
          <input placeholder="Mã yêu cầu hoặc đại lý…" value={query} onChange={e => setQuery(e.target.value)} style={{ ...s.input, width: '250px' }} />
          <select value={draft.dealerId} onChange={(event) => setDraft((value) => ({ ...value, dealerId: event.target.value }))} style={{ ...s.input, width: '200px' }}>
            <option value="">Tất cả đại lý</option>
            {dealers.map((dealer) => <option key={dealer.id} value={dealer.id}>{dealer.dealerCode} · {dealer.name}</option>)}
          </select>
          <select value={draft.status} onChange={(event) => setDraft((value) => ({ ...value, status: event.target.value }))} style={{ ...s.input, width: '180px' }}>
            <option value="">Tất cả trạng thái</option>
            {Object.entries(STATUS_LABELS).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
          </select>
          <input type="date" value={draft.from} onChange={(event) => setDraft((value) => ({ ...value, from: event.target.value }))} style={{ ...s.input, width: '150px' }} />
          <input type="date" min={draft.from || undefined} value={draft.to} onChange={(event) => setDraft((value) => ({ ...value, to: event.target.value }))} style={{ ...s.input, width: '150px' }} />
        </div>

        <div style={s.tableWrapper}>
          <table style={s.table}>
            <thead>
              <tr>
                <th style={s.th}>Mã yêu cầu</th><th style={s.th}>Đại lý</th><th style={s.th}>Ngày gửi</th><th style={s.th}>Số lượng</th><th style={s.th}>Trạng thái</th><th style={s.th}>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {/* HIỂN THỊ SKELETON KHI ĐANG LOAD LẦN ĐẦU */}
              {list.loading && !displayData?.content?.length ? (
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
              ) : !displayData?.content?.length ? (
                <tr><td colSpan="6" style={{ ...s.td, textAlign: 'center', padding: '40px', color: '#6b7280' }}>Không có yêu cầu phù hợp.</td></tr>
              ) : (
                displayData.content.map((item) => (
                  <tr key={item.id}>
                    <td style={s.td}><strong style={{ color: '#2563eb' }}>{item.requestCode}</strong></td>
                    <td style={s.td}>{item.dealerCode} · {item.dealerName}</td>
                    <td style={s.td}>{formatDate(item.createdAt)}</td>
                    <td style={s.td}>{item.totalQuantity}</td>
                    <td style={s.td}><RequestStatus value={item.status} /></td>
                    <td style={s.td}>
                      <button onClick={() => openReview(item)} style={{ background: 'none', border: 'none', color: '#2563eb', cursor: 'pointer', fontWeight: '500' }}>
                        {item.status === 'PENDING' ? 'Xét duyệt' : 'Chi tiết'}
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div style={{ padding: '16px 0 0 0', borderTop: '1px solid #e5e7eb', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '16px' }}>
          <span style={{ fontSize: '14px', color: '#6b7280' }}>
            {list.loading ? 'Đang tải dữ liệu...' : `Tổng cộng ${totalElements} yêu cầu - Trang ${currentPage}/${totalPages}`}
          </span>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button disabled={list.loading || currentPage <= 1} onClick={() => { list.beginChange(); list.setPage(list.page - 1) }} style={{ padding: '8px 16px', border: '1px solid #d1d5db', borderRadius: '6px', background: (list.loading || currentPage <= 1) ? '#f3f4f6' : '#fff', cursor: (list.loading || currentPage <= 1) ? 'not-allowed' : 'pointer', color: (list.loading || currentPage <= 1) ? '#9ca3af' : '#374151' }}>Trước</button>
            <button disabled={list.loading || currentPage >= totalPages} onClick={() => { list.beginChange(); list.setPage(list.page + 1) }} style={{ padding: '8px 16px', border: '1px solid #d1d5db', borderRadius: '6px', background: (list.loading || currentPage >= totalPages) ? '#f3f4f6' : '#fff', cursor: (list.loading || currentPage >= totalPages) ? 'not-allowed' : 'pointer', color: (list.loading || currentPage >= totalPages) ? '#9ca3af' : '#374151' }}>Sau</button>
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