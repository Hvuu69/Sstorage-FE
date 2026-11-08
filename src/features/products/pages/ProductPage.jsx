import { useEffect, useMemo, useState, useRef } from 'react'
import { useAuth } from '../../auth/authContext.js'
import { categoryApi } from '../../categories/api/categoryApi.js'
import { unitApi } from '../../units/api/unitApi.js'
import usePagedResource from '../../../shared/hooks/usePagedResource.js'
import { ConfirmDialog, Modal, StatusBadge, useToast } from '../../../shared/ui/index.js'
import { productApi } from '../api/productApi.js'
import { canManageProducts, canViewInternalStock } from '../productPermissions.js'

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
  filterRow: { padding: '16px', borderBottom: '1px solid #e5e7eb', display: 'flex', alignItems: 'center', gap: '16px' },
  searchWrapper: { position: 'relative', display: 'flex', alignItems: 'center' },
  searchIcon: { position: 'absolute', left: '12px', color: '#9ca3af' },
  searchInput: { padding: '10px 12px 10px 36px', borderRadius: '8px', border: '1px solid #d1d5db', width: '300px', fontSize: '14px', outline: 'none', transition: 'border-color 0.2s' },
  table: { width: '100%', borderCollapse: 'collapse', textAlign: 'left' },
  th: { padding: '16px', backgroundColor: '#f9fafb', borderBottom: '1px solid #e5e7eb', fontSize: '12px', fontWeight: '600', color: '#6b7280', textTransform: 'uppercase' },
  td: { padding: '16px', borderBottom: '1px solid #e5e7eb', fontSize: '14px', color: '#374151' },
  emptyTd: { padding: '60px 16px', textAlign: 'center', color: '#6b7280', fontSize: '14px' },
  codeText: { color: '#2563eb', fontWeight: 'bold' },
  badgeSuccess: { backgroundColor: '#ecfdf5', color: '#065f46', padding: '4px 8px', borderRadius: '4px', fontSize: '12px', fontWeight: '500' },
  badgePending: { backgroundColor: '#fef3c7', color: '#92400e', padding: '4px 8px', borderRadius: '4px', fontSize: '12px', fontWeight: '500' },
  btnAction: { background: 'none', border: 'none', color: '#2563eb', cursor: 'pointer', fontWeight: '500', padding: 0, transition: 'opacity 0.2s' },
  pagination: { padding: '16px 20px', borderTop: '1px solid #e5e7eb', display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  btnPage: { backgroundColor: '#fff', border: '1px solid #d1d5db', padding: '8px 16px', borderRadius: '6px', cursor: 'pointer', color: '#374151', fontSize: '14px', fontWeight: '500', transition: 'all 0.2s' },
  btnPageDisabled: { backgroundColor: '#f9fafb', border: '1px solid #e5e7eb', padding: '8px 16px', borderRadius: '6px', cursor: 'not-allowed', color: '#9ca3af', fontSize: '14px', fontWeight: '500' },
  loadingBar: { position: 'absolute', top: 0, left: 0, right: 0, height: '3px', backgroundColor: '#3b82f6', animation: 'pulse 1.5s infinite ease-in-out', borderTopLeftRadius: '12px', borderTopRightRadius: '12px' },
  prodInputGroup: { display: 'flex', flexDirection: 'column', gap: '6px', flex: 1, minWidth: '200px' },
  prodLabel: { fontSize: '14px', fontWeight: '500', color: '#374151' },
  prodInput: { padding: '10px 12px', borderRadius: '8px', border: '1px solid #d1d5db', width: '100%', fontSize: '14px', boxSizing: 'border-box', outline: 'none', transition: 'border-color 0.2s' },
  
  modalOverlay: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 50, padding: '16px', backdropFilter: 'blur(4px)' },
  modalContent: { backgroundColor: '#fff', borderRadius: '16px', width: '100%', maxWidth: '650px', maxHeight: '90vh', display: 'flex', flexDirection: 'column', overflow: 'hidden', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)' },
  modalHeader: { padding: '20px 24px', borderBottom: '1px solid #e5e7eb', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0 },
  modalBody: { padding: '24px', overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: '20px' },
  modalFooter: { padding: '16px 24px', backgroundColor: '#f9fafb', borderTop: '1px solid #e5e7eb', display: 'flex', justifyContent: 'flex-end', gap: '12px', flexShrink: 0 },
  
  detailItem: { display: 'flex', flexDirection: 'column', gap: '4px' },
  detailLabel: { fontSize: '12px', color: '#6b7280', fontWeight: '500' },
  detailValue: { fontSize: '15px', color: '#111827', fontWeight: '500' },
  
  grid2Col: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' },
  scannerBox: { backgroundColor: '#0f172a', borderRadius: '12px', height: '280px', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', color: '#fff', marginBottom: '16px', position: 'relative', overflow: 'hidden' },
  scanIconBox: { width: '48px', height: '48px', border: '2px dashed #fff', borderRadius: '8px', display: 'flex', justifyContent: 'center', alignItems: 'center', marginBottom: '16px' },
  inputGroup: { display: 'flex', gap: '12px' },
  input: { flex: 1, padding: '12px', borderRadius: '8px', border: '1px solid #d1d5db', fontSize: '14px', outline: 'none' },
  
  confirmBox: { backgroundColor: '#fff', borderRadius: '16px', width: '100%', maxWidth: '400px', padding: '24px', textAlign: 'center', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)' },
  confirmTitle: { fontSize: '18px', fontWeight: 'bold', color: '#111827', margin: '0 0 8px 0' },
  confirmText: { fontSize: '14px', color: '#4b5563', margin: '0 0 24px 0', lineHeight: '1.5' },
  confirmActions: { display: 'flex', justifyContent: 'center', gap: '12px' },
  
  toastWrapper: { position: 'fixed', top: '24px', right: '24px', zIndex: 9999, display: 'flex', alignItems: 'center', gap: '12px', padding: '14px 20px', borderRadius: '12px', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1), 0 4px 6px -2px rgba(0,0,0,0.05)', fontWeight: '500', fontSize: '14px', minWidth: '280px', border: '1px solid', backdropFilter: 'blur(10px)', animation: 'slideInRight 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards' },
  toastSuccess: { backgroundColor: 'rgba(236, 253, 245, 0.95)', borderColor: '#10b981', color: '#065f46' },
  toastIcon: { width: '24px', height: '24px', flexShrink: 0 },
  toastClose: { background: 'none', border: 'none', cursor: 'pointer', fontSize: '18px', color: 'inherit', opacity: 0.6, marginLeft: 'auto', transition: 'opacity 0.2s' }
};

// Nhúng Keyframes
if (typeof document !== 'undefined') {
  const styleTag = document.createElement('style');
  styleTag.innerHTML = `
    @keyframes slideInRight { from { transform: translateX(100%); opacity: 0; } to { transform: translateX(0); opacity: 1; } }
    @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.5; } }
    input:focus, select:focus { border-color: #2563eb !important; box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1) !important; }
    button:not(:disabled):hover { filter: brightness(0.95); }
  `;
  document.head.appendChild(styleTag);
}

const SearchIcon = () => (
  <svg style={s.searchIcon} width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line>
  </svg>
);

const SAMPLE_PRODUCTS = [
  { id: 1, name: 'Sữa tươi tiệt trùng 1L', sku: 'SP-001', unit: 'hộp' },
  { id: 2, name: 'Nước khoáng 500ml', sku: 'SP-014', unit: 'chai' },
  { id: 3, name: 'Mì ăn liền vị bò', sku: 'SP-023', unit: 'gói' },
  { id: 4, name: 'Nước rửa chén 750ml', sku: 'SP-031', unit: 'chai' },
  { id: 5, name: 'Giấy vệ sinh 10 cuộn', sku: 'SP-045', unit: 'lốc' },
];

// ==========================================
// TOAST COMPONENT
// ==========================================
function CustomToast({ message, onClose }) {
  useEffect(() => {
    const timer = setTimeout(onClose, 3000);
    return () => clearTimeout(timer);
  }, [onClose]);
  
  return (
    <div style={{ ...s.toastWrapper, ...s.toastSuccess }}>
      <svg style={s.toastIcon} viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline>
      </svg>
      <span style={{ fontWeight: '600' }}>{message}</span>
      <button onClick={onClose} style={s.toastClose}>×</button>
    </div>
  );
}

// ==========================================
// MODAL CHI TIẾT SẢN PHẨM
// ==========================================
function ProductDetailModal({ product, onClose, showStock }) {
  if (!product) return null;
  return (
    <div style={s.modalOverlay}>
      <div style={{ ...s.modalContent, maxWidth: '600px' }}>
        <div style={s.modalHeader}><h3 style={{ margin: 0, fontSize: '18px', fontWeight: 'bold' }}>Chi tiết sản phẩm</h3><button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: '24px', cursor: 'pointer', color: '#6b7280' }}>×</button></div>
        <div style={{ ...s.modalBody, display: 'grid', gridTemplateColumns: '1fr 1fr' }}>
          <div style={s.detailItem}><span style={s.detailLabel}>SKU</span><span style={{ ...s.detailValue, color: '#2563eb' }}>{product.sku}</span></div>
          <div style={s.detailItem}><span style={s.detailLabel}>Trạng thái</span><StatusBadge status={product.status} labels={{ ACTIVE: 'Hoạt động', INACTIVE: 'Ngừng' }} /></div>
          <div style={{ ...s.detailItem, gridColumn: 'span 2' }}><span style={s.detailLabel}>Tên sản phẩm</span><span style={s.detailValue}>{product.name}</span></div>
          <div style={s.detailItem}><span style={s.detailLabel}>Danh mục</span><span style={s.detailValue}>{product.categoryName}</span></div>
          <div style={s.detailItem}><span style={s.detailLabel}>Đơn vị</span><span style={s.detailValue}>{product.unitSymbol}</span></div>
          {showStock && (<div style={s.detailItem}><span style={s.detailLabel}>Tồn kho</span><span style={{ ...s.detailValue, fontSize: '18px', color: '#059669' }}>{product.quantityOnHand ?? '—'}</span></div>)}
        </div>
        <div style={s.modalFooter}><button onClick={onClose} style={{ padding: '10px 16px', borderRadius: '8px', border: '1px solid #d1d5db', background: '#fff', cursor: 'pointer', fontWeight: '500' }}>Đóng</button></div>
      </div>
    </div>
  );
}

// ==========================================
// MODAL XEM CHI TIẾT PHIẾU NHẬP/XUẤT
// ==========================================
function VoucherDetailModal({ voucher, onClose, onRequestConfirm }) {
  const isDraft = voucher.status === 'Nháp';

  return (
    <div style={s.modalOverlay}>
      <div style={{ ...s.modalContent, maxWidth: '600px' }}>
        <div style={s.modalHeader}>
          <h2 style={{ margin: 0, fontSize: '18px', fontWeight: 'bold' }}>Chi tiết {voucher.id}</h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: '24px', cursor: 'pointer' }}>×</button>
        </div>
        
        <div style={s.modalBody}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={isDraft ? s.badgePending : s.badgeSuccess}>{voucher.status}</span>
            <span style={{ fontSize: '16px', fontWeight: 'bold' }}>Tổng: {voucher.qty}</span>
          </div>
          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div style={s.detailItem}><span style={s.detailLabel}>Đối tác</span><span style={s.detailValue}>{voucher.partner}</span></div>
            <div style={s.detailItem}><span style={s.detailLabel}>Ngày tạo</span><span style={s.detailValue}>{voucher.date}</span></div>
          </div>

          <div style={{ border: '1px solid #e5e7eb', borderRadius: '8px', overflow: 'hidden' }}>
            <table style={s.table}>
              <thead style={{ backgroundColor: '#f9fafb' }}><tr><th style={{ ...s.th, textTransform: 'none' }}>Sản phẩm</th><th style={{ ...s.th, textTransform: 'none', textAlign: 'right' }}>Số lượng</th></tr></thead>
              <tbody>
                {voucher.items && voucher.items.length > 0 ? voucher.items.map((item, idx) => (
                  <tr key={idx}>
                    <td style={s.td}><strong>{item.name}</strong><br/><span style={{ fontSize: '12px', color: '#6b7280' }}>{item.sku}</span></td>
                    <td style={{ ...s.td, textAlign: 'right' }}><strong>{item.quantity}</strong> {item.unit}</td>
                  </tr>
                )) : (
                  <tr><td colSpan="2" style={s.td}>Không có sản phẩm.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div style={s.modalFooter}>
          {isDraft ? (
            <>
              <button onClick={() => onRequestConfirm('cancel')} style={{ padding: '10px 16px', borderRadius: '8px', border: 'none', backgroundColor: '#e11d48', color: '#fff', cursor: 'pointer', fontWeight: '500' }}>Hủy phiếu</button>
              <button onClick={() => onRequestConfirm('confirm')} style={{ ...s.btnPrimary }}>Xác nhận</button>
            </>
          ) : (
            <button onClick={onClose} style={{ padding: '10px 16px', borderRadius: '8px', border: '1px solid #d1d5db', background: '#fff', cursor: 'pointer', fontWeight: '500' }}>Đóng</button>
          )}
        </div>
      </div>
    </div>
  );
}

// ==========================================
// FORM THÊM/SỬA SẢN PHẨM
// ==========================================
export function ProductForm({ entity, categories, units, onClose, onSaved }) {
  const { notify } = useToast()
  const safeCategories = Array.isArray(categories) ? categories : [];
  const safeUnits = Array.isArray(units) ? units : [];
  
  const selectableCategories = safeCategories.filter((item) => item.active || item.id === entity?.categoryId)
  const [form, setForm] = useState({ sku: entity?.sku ?? '', name: entity?.name ?? '', description: entity?.description ?? '', categoryId: entity?.categoryId ?? selectableCategories[0]?.id ?? '', unitId: entity?.unitId ?? safeUnits[0]?.id ?? '' })
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

  return (
    <form onSubmit={submit}>
      <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <div style={s.prodInputGroup}><label style={s.prodLabel}>SKU *</label><input required maxLength="60" value={form.sku} onChange={update('sku')} style={s.prodInput} /></div>
        <div style={s.prodInputGroup}><label style={s.prodLabel}>Tên sản phẩm *</label><input required maxLength="200" value={form.name} onChange={update('name')} style={s.prodInput} /></div>
        <div style={s.prodInputGroup}><label style={s.prodLabel}>Danh mục *</label><select required value={form.categoryId} onChange={update('categoryId')} style={s.prodInput}><option value="">Chọn danh mục</option>{selectableCategories.map((item) => <option key={item.id} value={item.id}>{item.code} · {item.name}</option>)}</select></div>
        <div style={s.prodInputGroup}><label style={s.prodLabel}>Đơn vị chuẩn *</label><select required value={form.unitId} onChange={update('unitId')} style={s.prodInput}><option value="">Chọn đơn vị</option>{safeUnits.map((item) => <option key={item.id} value={item.id}>{item.code} · {item.name} ({item.symbol})</option>)}</select></div>
      </div>
      <div style={s.modalFooter}><button type="button" onClick={onClose} style={{ padding: '10px 16px', borderRadius: '8px', border: '1px solid #d1d5db', background: '#fff', cursor: 'pointer' }}>Hủy</button><button type="submit" disabled={saving} style={s.btnPrimary}>{saving ? 'Đang lưu…' : 'Lưu sản phẩm'}</button></div>
    </form>
  )
}

// ==========================================
// MODAL TẠO PHIẾU NHẬP KHO
// ==========================================
function CreateImportModal({ onClose, onSave }) {
  const [isSaving, setIsSaving] = useState(false);
  const [quantities, setQuantities] = useState({});
  const [supplier, setSupplier] = useState('Nước giải khát Việt Xanh');

  const handleQtyChange = (id, val) => setQuantities(prev => ({ ...prev, [id]: val }));

  const handleSave = () => {
    setIsSaving(true);
    setTimeout(() => {
      setIsSaving(false);
      const selectedItems = SAMPLE_PRODUCTS
        .filter(p => Number(quantities[p.id]) > 0)
        .map(p => ({ ...p, quantity: Number(quantities[p.id]) }));
      
      if (selectedItems.length === 0) {
        alert("Vui lòng nhập số lượng cho ít nhất 1 sản phẩm.");
        return;
      }
      const totalQty = selectedItems.reduce((sum, item) => sum + item.quantity, 0);
      onSave('Nháp', totalQty, supplier, selectedItems); 
    }, 500);
  };

  return (
    <div style={s.modalOverlay}>
      <div style={{ ...s.modalContent, maxWidth: '650px' }}>
        <div style={s.modalHeader}>
          <h2 style={{ margin: 0, fontSize: '18px', fontWeight: 'bold' }}>Tạo phiếu nhập nháp</h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: '24px', cursor: 'pointer' }}>×</button>
        </div>
        <div style={s.modalBody}>
          <div style={s.prodInputGroup}>
            <label style={s.prodLabel}>Nhà cung cấp *</label>
            <select style={s.prodInput} value={supplier} onChange={(e) => setSupplier(e.target.value)}>
              <option>Nước giải khát Việt Xanh</option>
              <option>Công ty Thực phẩm An Khang</option>
            </select>
          </div>
          <div style={{ border: '1px solid #e5e7eb', borderRadius: '8px', overflow: 'hidden' }}>
            <table style={s.table}>
              <thead style={{ backgroundColor: '#f9fafb' }}><tr><th style={{ ...s.th, textTransform: 'none' }}>Sản phẩm</th><th style={{ ...s.th, textTransform: 'none', textAlign: 'right' }}>Số lượng</th></tr></thead>
              <tbody>
                {SAMPLE_PRODUCTS.map(p => (
                  <tr key={p.id}>
                    <td style={s.td}><strong>{p.name}</strong><br/><span style={{ fontSize: '12px', color: '#6b7280' }}>{p.sku}</span></td>
                    <td style={{ ...s.td, textAlign: 'right' }}>
                      <input type="number" min="0" placeholder="0" value={quantities[p.id] || ''} onChange={(e) => handleQtyChange(p.id, e.target.value)} style={{ ...s.prodInput, width: '100px', textAlign: 'right', backgroundColor: '#f9fafb' }} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        <div style={s.modalFooter}>
          <button onClick={onClose} style={{ padding: '10px 16px', borderRadius: '8px', border: '1px solid #d1d5db', background: '#fff', cursor: 'pointer' }}>Hủy</button>
          <button onClick={handleSave} disabled={isSaving} style={{ ...s.btnPrimary, backgroundColor: '#8b5cf6', opacity: isSaving ? 0.7 : 1 }}>{isSaving ? 'Đang lưu...' : 'Lưu nháp'}</button>
        </div>
      </div>
    </div>
  );
}

// ==========================================
// MODAL TẠO PHIẾU XUẤT KHO
// ==========================================
function CreateExportModal({ onClose, onSave }) {
  const [isSaving, setIsSaving] = useState(false);
  const [quantities, setQuantities] = useState({});
  const [request, setRequest] = useState('');

  const handleQtyChange = (id, val) => setQuantities(prev => ({ ...prev, [id]: val }));

  const handleSave = () => {
    setIsSaving(true);
    setTimeout(() => {
      setIsSaving(false);
      const selectedItems = SAMPLE_PRODUCTS
        .filter(p => Number(quantities[p.id]) > 0)
        .map(p => ({ ...p, quantity: Number(quantities[p.id]) }));
      
      if (selectedItems.length === 0) {
        alert("Vui lòng nhập số lượng cho ít nhất 1 sản phẩm.");
        return;
      }
      const totalQty = selectedItems.reduce((sum, item) => sum + item.quantity, 0);
      onSave('Nháp', totalQty, request || 'Khách lẻ', selectedItems);
    }, 500);
  };

  return (
    <div style={s.modalOverlay}>
      <div style={{ ...s.modalContent, maxWidth: '650px' }}>
        <div style={s.modalHeader}>
          <h2 style={{ margin: 0, fontSize: '18px', fontWeight: 'bold' }}>Tạo phiếu xuất từ yêu cầu đã duyệt</h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: '24px', cursor: 'pointer' }}>×</button>
        </div>
        <div style={s.modalBody}>
          <div style={s.prodInputGroup}>
            <label style={s.prodLabel}>Yêu cầu đã duyệt *</label>
            <select style={s.prodInput} value={request} onChange={(e) => setRequest(e.target.value)}>
              <option value="">Chọn yêu cầu đã duyệt...</option>
              <option value="YC-DEMO-001">YC-DEMO-001 - Công ty An Khang</option>
              <option value="YC-DEMO-002">YC-DEMO-002 - Đại lý Hùng Thịnh</option>
            </select>
          </div>
          <div style={{ border: '1px solid #e5e7eb', borderRadius: '8px', overflow: 'hidden' }}>
            <table style={s.table}>
              <thead style={{ backgroundColor: '#f9fafb' }}><tr><th style={{ ...s.th, textTransform: 'none' }}>Sản phẩm</th><th style={{ ...s.th, textTransform: 'none', textAlign: 'right' }}>Số lượng</th></tr></thead>
              <tbody>
                {SAMPLE_PRODUCTS.map(p => (
                  <tr key={p.id}>
                    <td style={s.td}><strong>{p.name}</strong><br/><span style={{ fontSize: '12px', color: '#6b7280' }}>{p.sku}</span></td>
                    <td style={{ ...s.td, textAlign: 'right' }}>
                      <input type="number" min="0" placeholder="0" value={quantities[p.id] || ''} onChange={(e) => handleQtyChange(p.id, e.target.value)} style={{ ...s.prodInput, width: '100px', textAlign: 'right', backgroundColor: '#f9fafb' }} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        <div style={s.modalFooter}>
          <button onClick={onClose} style={{ padding: '10px 16px', borderRadius: '8px', border: '1px solid #d1d5db', background: '#fff', cursor: 'pointer' }}>Hủy</button>
          <button onClick={handleSave} disabled={isSaving} style={{ ...s.btnPrimary, backgroundColor: '#8b5cf6', opacity: isSaving ? 0.7 : 1 }}>{isSaving ? 'Đang lưu...' : 'Lưu nháp'}</button>
        </div>
      </div>
    </div>
  );
}

// ==========================================
// TRANG NHẬP KHO
// ==========================================
export function ImportPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedVoucher, setSelectedVoucher] = useState(null);
  const [vouchers, setVouchers] = useState(() => getCache('import_vouchers') || []);
  const [confirmAction, setConfirmAction] = useState(null);
  const [toastMsg, setToastMsg] = useState('');

  useEffect(() => { setCache('import_vouchers', vouchers); }, [vouchers]);

  const filteredVouchers = vouchers.filter(v => 
    v.id?.toLowerCase().includes(searchQuery.toLowerCase()) || 
    v.partner?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSaveNew = (status, qty, partner, items) => {
    const newVoucher = {
      id: `PN-${Date.now().toString().slice(-6)}`,
      partner: partner,
      date: new Date().toLocaleString('vi-VN'),
      qty: qty,
      status: status,
      items: items
    };
    setVouchers([newVoucher, ...vouchers]);
    setShowCreateModal(false);
  };

  const handleVoucherAction = (action) => {
    if (action === 'cancel') {
      setVouchers(vouchers.filter(v => v.id !== selectedVoucher.id));
      setToastMsg('Đã hủy phiếu.');
      setSelectedVoucher(null);
    } else if (action === 'confirm') {
      setConfirmAction('confirm');
    }
  };

  const executeConfirm = () => {
    setVouchers(vouchers.map(v => v.id === selectedVoucher.id ? { ...v, status: 'Hoàn tất' } : v));
    setToastMsg('Đã xác nhận nhập kho.');
    setConfirmAction(null);
    setSelectedVoucher(null);
  };

  return (
    <div style={s.page}>
      <div style={s.header}>
        <div><h1 style={s.title}>Quản lý nhập kho</h1><p style={s.subtitle}>Phiếu hoàn tất mới làm thay đổi tồn kho</p></div>
        <button style={s.btnPrimary} onClick={() => setShowCreateModal(true)}>+ Tạo phiếu nhập</button>
      </div>
      <div style={s.card}>
        <div style={s.filterRow}>
          <div style={s.searchWrapper}><SearchIcon /><input type="text" placeholder="Tìm theo mã phiếu hoặc đối tác..." style={s.searchInput} value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} /></div>
          <span style={{ fontSize: '14px', color: '#6b7280' }}>{filteredVouchers.length} kết quả</span>
        </div>
        <table style={s.table}>
          <thead><tr><th style={s.th}>MÃ PHIẾU</th><th style={s.th}>ĐỐI TÁC</th><th style={s.th}>NGÀY TẠO</th><th style={s.th}>TỔNG SL</th><th style={s.th}>TRẠNG THÁI</th><th style={s.th}></th></tr></thead>
          <tbody>
            {filteredVouchers.length === 0 ? (
              <tr><td colSpan="6" style={s.emptyTd}>Không tìm thấy phiếu nhập nào phù hợp.</td></tr>
            ) : (
              filteredVouchers.map((row) => (
                <tr key={row.id}>
                  <td style={s.td}><span style={s.codeText}>{row.id}</span></td>
                  <td style={s.td}>{row.partner}</td>
                  <td style={s.td}>{row.date}</td>
                  <td style={s.td}>{row.qty}</td>
                  <td style={s.td}><span style={row.status === 'Hoàn tất' ? s.badgeSuccess : s.badgePending}>{row.status}</span></td>
                  <td style={s.td}><button style={s.btnAction} onClick={() => setSelectedVoucher(row)}>Chi tiết</button></td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      {showCreateModal && <CreateImportModal onClose={() => setShowCreateModal(false)} onSave={handleSaveNew} />}
      
      {selectedVoucher && (
        <VoucherDetailModal 
          voucher={selectedVoucher} 
          onClose={() => setSelectedVoucher(null)} 
          onRequestConfirm={handleVoucherAction} 
        />
      )}

      {confirmAction === 'confirm' && (
        <div style={{ ...s.modalOverlay, zIndex: 100 }}>
          <div style={s.confirmBox}>
            <h3 style={s.confirmTitle}>Xác nhận nhập kho</h3>
            <p style={s.confirmText}>Bạn có chắc chắn muốn hoàn tất phiếu nhập <strong>{selectedVoucher?.id}</strong>? Thao tác này sẽ làm thay đổi tồn kho.</p>
            <div style={s.confirmActions}>
              <button onClick={() => setConfirmAction(null)} style={{ padding: '10px 24px', borderRadius: '8px', border: '1px solid #d1d5db', background: '#fff', cursor: 'pointer', fontWeight: '500' }}>Hủy</button>
              <button onClick={executeConfirm} style={{ padding: '10px 24px', borderRadius: '8px', border: 'none', backgroundColor: '#2563eb', color: '#fff', cursor: 'pointer', fontWeight: '500' }}>Đồng ý</button>
            </div>
          </div>
        </div>
      )}

      {toastMsg && <CustomToast message={toastMsg} onClose={() => setToastMsg('')} />}
    </div>
  );
}

// ==========================================
// TRANG XUẤT KHO
// ==========================================
export function ExportPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedVoucher, setSelectedVoucher] = useState(null);
  const [vouchers, setVouchers] = useState(() => getCache('export_vouchers') || []);
  const [confirmAction, setConfirmAction] = useState(null);
  const [toastMsg, setToastMsg] = useState('');

  useEffect(() => { setCache('export_vouchers', vouchers); }, [vouchers]);

  const filteredVouchers = vouchers.filter(v => 
    v.id?.toLowerCase().includes(searchQuery.toLowerCase()) || 
    v.partner?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSaveNew = (status, qty, partner, items) => {
    const newVoucher = {
      id: `PX-${Date.now().toString().slice(-6)}`,
      partner: partner,
      date: new Date().toLocaleString('vi-VN'),
      qty: qty,
      status: status,
      items: items
    };
    setVouchers([newVoucher, ...vouchers]);
    setShowCreateModal(false);
  };

  const handleVoucherAction = (action) => {
    if (action === 'cancel') {
      setVouchers(vouchers.filter(v => v.id !== selectedVoucher.id));
      setToastMsg('Đã hủy phiếu.');
      setSelectedVoucher(null);
    } else if (action === 'confirm') {
      setConfirmAction('confirm');
    }
  };

  const executeConfirm = () => {
    setVouchers(vouchers.map(v => v.id === selectedVoucher.id ? { ...v, status: 'Hoàn tất' } : v));
    setToastMsg('Đã xác nhận xuất kho.');
    setConfirmAction(null);
    setSelectedVoucher(null);
  };

  return (
    <div style={s.page}>
      <div style={s.header}>
        <div><h1 style={s.title}>Quản lý xuất kho</h1><p style={s.subtitle}>Phiếu hoàn tất mới làm thay đổi tồn kho</p></div>
        <button style={s.btnPrimary} onClick={() => setShowCreateModal(true)}>+ Tạo phiếu xuất</button>
      </div>
      <div style={s.card}>
        <div style={s.filterRow}>
          <div style={s.searchWrapper}><SearchIcon /><input type="text" placeholder="Tìm theo mã phiếu hoặc đối tác..." style={s.searchInput} value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} /></div>
          <span style={{ fontSize: '14px', color: '#6b7280' }}>{filteredVouchers.length} kết quả</span>
        </div>
        <table style={s.table}>
          <thead><tr><th style={s.th}>MÃ PHIẾU</th><th style={s.th}>ĐỐI TÁC</th><th style={s.th}>NGÀY TẠO</th><th style={s.th}>TỔNG SL</th><th style={s.th}>TRẠNG THÁI</th><th style={s.th}></th></tr></thead>
          <tbody>
            {filteredVouchers.length === 0 ? (
              <tr><td colSpan="6" style={s.emptyTd}>Không tìm thấy phiếu xuất nào phù hợp.</td></tr>
            ) : (
              filteredVouchers.map((row) => (
                <tr key={row.id}>
                  <td style={s.td}><span style={s.codeText}>{row.id}</span></td>
                  <td style={s.td}>{row.partner}</td>
                  <td style={s.td}>{row.date}</td>
                  <td style={s.td}>{row.qty}</td>
                  <td style={s.td}><span style={row.status === 'Hoàn tất' ? s.badgeSuccess : s.badgePending}>{row.status}</span></td>
                  <td style={s.td}><button style={s.btnAction} onClick={() => setSelectedVoucher(row)}>Chi tiết</button></td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      {showCreateModal && <CreateExportModal onClose={() => setShowCreateModal(false)} onSave={handleSaveNew} />}
      
      {selectedVoucher && (
        <VoucherDetailModal 
          voucher={selectedVoucher} 
          onClose={() => setSelectedVoucher(null)} 
          onRequestConfirm={handleVoucherAction} 
        />
      )}

      {confirmAction === 'confirm' && (
        <div style={{ ...s.modalOverlay, zIndex: 100 }}>
          <div style={s.confirmBox}>
            <h3 style={s.confirmTitle}>Xác nhận xuất kho</h3>
            <p style={s.confirmText}>Bạn có chắc chắn muốn hoàn tất phiếu xuất <strong>{selectedVoucher?.id}</strong>? Thao tác này sẽ làm thay đổi tồn kho.</p>
            <div style={s.confirmActions}>
              <button onClick={() => setConfirmAction(null)} style={{ padding: '10px 24px', borderRadius: '8px', border: '1px solid #d1d5db', background: '#fff', cursor: 'pointer', fontWeight: '500' }}>Hủy</button>
              <button onClick={executeConfirm} style={{ padding: '10px 24px', borderRadius: '8px', border: 'none', backgroundColor: '#2563eb', color: '#fff', cursor: 'pointer', fontWeight: '500' }}>Đồng ý</button>
            </div>
          </div>
        </div>
      )}

      {toastMsg && <CustomToast message={toastMsg} onClose={() => setToastMsg('')} />}
    </div>
  );
}

// ==========================================
// TRANG TỒN KHO
// ==========================================
export function InventoryPage() {
  return (
    <div style={s.page}>
      <div style={s.header}><div><h1 style={s.title}>Tồn kho</h1><p style={s.subtitle}>Số lượng chỉ thay đổi qua phiếu xác nhận hoặc điều chỉnh kiểm kê được duyệt</p></div></div>
      <div style={s.card}>
        <div style={s.filterRow}><div style={s.searchWrapper}><SearchIcon /><input type="text" placeholder="Tìm kiếm..." style={s.searchInput} /></div><span style={{ fontSize: '14px', color: '#6b7280' }}>0 kết quả</span></div>
        <table style={s.table}><thead><tr><th style={s.th}>SKU</th><th style={s.th}>SẢN PHẨM</th><th style={s.th}>HIỆN CÓ</th><th style={s.th}>TỐI THIỂU</th><th style={s.th}>TỐI ĐA</th><th style={s.th}>TÌNH TRẠNG</th></tr></thead><tbody><tr><td colSpan="6" style={s.emptyTd}>Không có dữ liệu.</td></tr></tbody></table>
      </div>
    </div>
  );
}

// ==========================================
// TRANG KIỂM KÊ
// ==========================================
export function AuditPage() {
  return (
    <div style={s.page}>
      <div style={s.header}><div><h1 style={s.title}>Quản lý kiểm kê</h1><p style={s.subtitle}>Điều chỉnh tồn chỉ thực hiện sau phê duyệt của Quản lý kho</p></div></div>
      <div style={s.card}>
        <div style={s.filterRow}><div style={s.searchWrapper}><SearchIcon /><input type="text" placeholder="Tìm kiếm..." style={s.searchInput} /></div><span style={{ fontSize: '14px', color: '#6b7280' }}>0 kết quả</span></div>
        <table style={s.table}><thead><tr><th style={s.th}>MÃ PHIÊN</th><th style={s.th}>NGÀY TẠO</th><th style={s.th}>SẢN PHẨM</th><th style={s.th}>TRẠNG THÁI</th></tr></thead><tbody><tr><td colSpan="4" style={s.emptyTd}>Không có dữ liệu.</td></tr></tbody></table>
      </div>
    </div>
  );
}

// ==========================================
// TRANG QUÉT QR / RFID
// ==========================================
export function QrScanPage() {
  const { notify } = useToast();
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [notFound, setNotFound] = useState(false);
  
  const [isCameraActive, setIsCameraActive] = useState(false);
  const videoRef = useRef(null);
  
  const controlsRef = useRef(null);
  const streamRef = useRef(null); 
  
  const isProcessingScanRef = useRef(false);

  // Hàm làm sạch mã (loại bỏ tiền tố "QR-")
  const sanitizeCode = (code) => {
    if (!code) return '';
    let clean = code.trim();
    if (clean.toUpperCase().startsWith('QR-')) {
      clean = clean.substring(3);
    }
    return clean;
  };

  const executeSearch = async (code) => {
    if (!code || !code.trim()) return;
    
    // LÀM SẠCH MÃ TRƯỚC KHI TÌM KIẾM
    const cleanCode = sanitizeCode(code);
    
    setLoading(true);
    setResult(null);
    setNotFound(false);

    try {
      const response = await productApi.list({ search: cleanCode, page: 0, size: 10 });
      
      if (response.content && response.content.length > 0) {
        const foundProduct = response.content.find(p => 
          p.sku.toLowerCase() === cleanCode.toLowerCase()
        ) || response.content[0]; 

        const detail = await productApi.get(foundProduct.id);
        setResult(detail);
      } else {
        setNotFound(true);
      }
    } catch (error) {
      notify(error.message || 'Lỗi khi tra cứu', 'error');
    } finally {
      setLoading(false);
      isProcessingScanRef.current = false;
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    executeSearch(searchQuery);
  };

  const stopCamera = () => {
    if (controlsRef.current) {
      try { controlsRef.current.stop(); } catch (e) { console.error(e); }
      controlsRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    isProcessingScanRef.current = false;
    setIsCameraActive(false);
  };

  const startCamera = async () => {
    setIsCameraActive(true);
    setResult(null);
    setNotFound(false);
    setSearchQuery('');
    isProcessingScanRef.current = false;

    try {
      const { BrowserQRCodeReader } = await import('@zxing/browser');
      const codeReader = new BrowserQRCodeReader();

      const videoInputDevices = await BrowserQRCodeReader.listVideoInputDevices();
      if (videoInputDevices.length === 0) {
        notify('Không tìm thấy thiết bị camera nào!', 'error');
        stopCamera();
        return;
      }

      const selectedDeviceId = videoInputDevices[videoInputDevices.length - 1].deviceId;

      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { deviceId: selectedDeviceId } 
      });
      streamRef.current = stream;
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }

      const controls = await codeReader.decodeFromVideoDevice(
        selectedDeviceId,
        videoRef.current,
        (res, err) => {
          if (isProcessingScanRef.current) return;
          
          if (res) {
            isProcessingScanRef.current = true;
            const scannedCode = res.getText();
            setSearchQuery(scannedCode);
            
            if (streamRef.current) {
              streamRef.current.getTracks().forEach(track => track.stop());
            }
            if (videoRef.current) {
              videoRef.current.srcObject = null;
            }
            if (controlsRef.current) {
              try { controlsRef.current.stop(); } catch (e) {}
              controlsRef.current = null;
            }
            setIsCameraActive(false);

            executeSearch(scannedCode);
          }
        }
      );
      
      controlsRef.current = controls;

    } catch (error) {
      console.error(error);
      notify('Không thể mở camera. Vui lòng kiểm tra quyền truy cập.', 'error');
      stopCamera();
    }
  };

  useEffect(() => {
    return () => {
      if (controlsRef.current) {
        try { controlsRef.current.stop(); } catch (e) {}
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  return (
    <div style={s.page}>
      <div style={s.header}>
        <div>
          <h1 style={s.title}>Tra cứu QR / RFID</h1>
          <p style={s.subtitle}>Quét mã bằng camera hoặc nhập mã thủ công</p>
        </div>
      </div>
      
      <div style={s.grid2Col}>
        <div style={{ ...s.card, padding: '24px', display: 'flex', flexDirection: 'column' }}>
          
          <div style={s.scannerBox}>
            {isCameraActive ? (
              <div style={{ width: '100%', height: '100%', position: 'relative', borderRadius: '12px', overflow: 'hidden' }}>
                <video 
                  ref={videoRef} 
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                  autoPlay 
                  playsInline 
                  muted 
                />
                <button 
                  onClick={stopCamera}
                  style={{ position: 'absolute', top: '10px', right: '10px', backgroundColor: 'rgba(225,29,72,0.9)', color: '#fff', border: 'none', borderRadius: '6px', padding: '6px 12px', cursor: 'pointer', fontWeight: 'bold' }}
                >
                  Đóng Camera
                </button>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <div style={s.scanIconBox}>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M4 7V4h3"></path><path d="M20 7V4h-3"></path><path d="M4 17v3h3"></path><path d="M20 17v3h-3"></path><path d="M4 12h16"></path>
                  </svg>
                </div>
                <div style={{ fontSize: '16px', fontWeight: 'bold', marginBottom: '8px' }}>Chế độ quét mã</div>
                <div style={{ fontSize: '13px', color: '#94a3b8', textAlign: 'center', marginBottom: '16px' }}>Sử dụng camera để quét QR hoặc nhập mã thủ công</div>
                <button onClick={startCamera} style={{ ...s.btnPrimary, backgroundColor: '#8b5cf6' }}>
                  Mở Camera quét mã
                </button>
              </div>
            )}
          </div>
          
          <div style={{ display: 'flex', alignItems: 'center', margin: '16px 0' }}>
            <div style={{ flex: 1, height: '1px', backgroundColor: '#e5e7eb' }}></div>
            <span style={{ padding: '0 10px', color: '#9ca3af', fontSize: '12px' }}>HOẶC NHẬP MÃ</span>
            <div style={{ flex: 1, height: '1px', backgroundColor: '#e5e7eb' }}></div>
          </div>

          <form onSubmit={handleSearch} style={s.inputGroup}>
            <input 
              type="text" 
              placeholder="Ví dụ: SP-001..." 
              style={s.input} 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              disabled={loading || isCameraActive}
            />
            <button type="submit" style={{ ...s.btnPrimary, opacity: (loading || isCameraActive) ? 0.7 : 1 }} disabled={loading || isCameraActive}>
              {loading ? 'Đang tìm...' : 'Tra cứu'}
            </button>
          </form>
        </div>

        <div style={{ ...s.card, padding: '24px', display: 'flex', flexDirection: 'column' }}>
          <div style={{ fontSize: '16px', fontWeight: 'bold', color: '#111827', marginBottom: '24px' }}>Kết quả nhận diện</div>
          
          <div style={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center', color: '#6b7280', fontSize: '14px' }}>
            {loading ? (
              <span>Đang tra cứu dữ liệu...</span>
            ) : result ? (
              <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '16px', borderBottom: '1px solid #e5e7eb' }}>
                  <div>
                    <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#111827' }}>{result.name}</div>
                    <div style={{ fontSize: '14px', color: '#2563eb', fontWeight: '500' }}>{result.sku}</div>
                  </div>
                  <StatusBadge status={result.status} labels={{ ACTIVE: 'Hoạt động', INACTIVE: 'Ngừng' }} />
                </div>
                
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <div style={s.detailItem}>
                    <span style={s.detailLabel}>Danh mục</span>
                    <span style={s.detailValue}>{result.categoryName}</span>
                  </div>
                  <div style={s.detailItem}>
                    <span style={s.detailLabel}>Đơn vị tính</span>
                    <span style={s.detailValue}>{result.unitSymbol}</span>
                  </div>
                  <div style={s.detailItem}>
                    <span style={s.detailLabel}>Tồn kho hiện tại</span>
                    <span style={{ ...s.detailValue, fontSize: '20px', color: '#059669' }}>{result.quantityOnHand ?? '—'}</span>
                  </div>
                </div>
              </div>
            ) : notFound ? (
              <div style={{ textAlign: 'center', color: '#dc2626' }}>
                <p>Không tìm thấy sản phẩm với mã <strong>{searchQuery}</strong></p>
                <button onClick={startCamera} style={{ marginTop: '12px', padding: '8px 16px', backgroundColor: '#2563eb', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer' }}>
                  Quét lại
                </button>
              </div>
            ) : (
              <span>Chưa có kết quả tra cứu.</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ==========================================
// TRANG CHÍNH QUẢN LÝ SẢN PHẨM
// ==========================================
export default function ProductPage() {
  const { currentUser } = useAuth()
  const canManage = canManageProducts(currentUser)
  const showStock = canViewInternalStock(currentUser)
  
  const [query, setQuery] = useState('')
  const [draft, setDraft] = useState({ categoryId: '', status: '' })
  const [categories, setCategories] = useState([])
  const [units, setUnits] = useState([])
  const [dialog, setDialog] = useState(null)
  const [appliedFilters, setAppliedFilters] = useState({ search: '', categoryId: '', status: '' })
  const [uiPage, setUiPage] = useState(0);
  const [hoveredBtn, setHoveredBtn] = useState(null);
  const [cachedData, setCachedData] = useState(() => getCache('cached_products_data'));

  const list = usePagedResource(productApi.list, { filters: appliedFilters })
  const { notify } = useToast()

  useEffect(() => {
    let active = true
    Promise.all([categoryApi.list({ page: 0, size: 100, sort: 'name,asc' }), unitApi.list({ page: 0, size: 100, sort: 'name,asc' })])
      .then(([categoryPage, unitPage]) => { if (active) { setCategories(categoryPage?.content || []); setUnits(unitPage?.content || []) } })
      .catch((error) => { if (active) notify(error.message, 'error') })
    return () => { active = false }
  }, [])

  useEffect(() => {
    const timer = setTimeout(() => {
      list.beginChange();
      list.setPage(0);
      setUiPage(0);
      setAppliedFilters({ search: query.trim(), categoryId: draft.categoryId, status: draft.status });
    }, 200); 
    return () => clearTimeout(timer);
  }, [query, draft.categoryId, draft.status]);

  useEffect(() => {
    if (!list.loading && list.result?.content) {
      setCache('cached_products_data', list.result);
      setCachedData(list.result);
    }
  }, [list.loading, list.result]);

  useEffect(() => {
    if (list.result && typeof list.result.number === 'number') {
      setUiPage(list.result.number);
    }
  }, [list.result]);

  async function openDetail(item) {
    try { setDialog({ type: 'detail', entity: await productApi.get(item.id) }) }
    catch (error) { notify(error.message, 'error') }
  }
  
  async function changeStatus(item) {
    try { await productApi.changeStatus(item.id, item.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE'); notify(item.status === 'ACTIVE' ? 'Đã ngừng hoạt động sản phẩm.' : 'Đã kích hoạt sản phẩm.'); setDialog(null); await list.load() }
    catch (error) { notify(error.message, 'error') }
  }

  const handlePageChange = (newPage) => {
    setUiPage(newPage);
    list.beginChange();
    list.setPage(newPage);
  };

  const displayData = (list.loading && cachedData) ? cachedData : (list.result || cachedData || { content: [], number: 0, totalPages: 1, totalElements: 0 });
  const currentPage = uiPage + 1; 
  const totalPages = (list.result?.totalPages && list.result.totalPages > 0) ? list.result.totalPages : 1;
  const totalElements = list.result?.totalElements || 0;

  if (!currentUser) return <div style={{ padding: '40px', textAlign: 'center', color: '#dc2626' }}>Vui lòng đăng nhập lại.</div>;

  return (
    <div style={s.page}>
      <div style={s.header}>
        <div>
          <h1 style={s.title}>{currentUser?.role === 'DEALER' ? 'Danh mục sản phẩm' : 'Quản lý sản phẩm'}</h1>
          <p style={s.subtitle}>{currentUser?.role === 'DEALER' ? 'Danh mục sản phẩm đang hoạt động.' : 'Quản lý thông tin chuẩn; tồn kho chỉ hiển thị để tra cứu.'}</p>
        </div>
        {canManage && <button style={s.btnPrimary} onClick={() => setDialog({ type: 'form' })}>+ Thêm sản phẩm</button>}
      </div>

      <div style={s.card}>
        <div style={s.filterRow}>
          <div style={s.prodInputGroup}>
            <label style={s.prodLabel}>Tìm sản phẩm</label>
            <div style={s.searchWrapper}><SearchIcon /><input placeholder="Tìm SKU hoặc tên…" value={query} onChange={e => setQuery(e.target.value)} style={s.searchInput} /></div>
          </div>
          <div style={{ ...s.prodInputGroup, flex: 'none', width: '200px' }}>
            <label style={s.prodLabel}>Danh mục</label>
            <select value={draft.categoryId} onChange={(e) => setDraft(v => ({ ...v, categoryId: e.target.value }))} style={s.prodInput}><option value="">Tất cả danh mục</option>{categories?.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select>
          </div>
          {currentUser?.role !== 'DEALER' && (
            <div style={{ ...s.prodInputGroup, flex: 'none', width: '200px' }}>
              <label style={s.prodLabel}>Trạng thái</label>
              <select value={draft.status} onChange={(e) => setDraft(v => ({ ...v, status: e.target.value }))} style={s.prodInput}><option value="">Tất cả</option><option value="ACTIVE">Hoạt động</option><option value="INACTIVE">Ngừng</option></select>
            </div>
          )}
        </div>
      </div>

      <div style={{ ...s.card, padding: 0 }}>
        {list.loading && <div style={s.loadingBar}></div>}
        <div style={{ overflowX: 'auto', opacity: list.loading && !cachedData ? 0.6 : 1 }}>
          <table style={s.table}>
            <thead><tr><th style={s.th}>SKU</th><th style={s.th}>Sản phẩm</th><th style={s.th}>Danh mục</th><th style={s.th}>Đơn vị</th>{showStock && <th style={s.th}>Tồn kho</th>}<th style={s.th}>Trạng thái</th><th style={s.th}>Thao tác</th></tr></thead>
            <tbody>
              {!displayData?.content || displayData.content.length === 0 ? (
                <tr><td colSpan="7" style={s.emptyTd}>{list.loading ? 'Đang tải dữ liệu...' : 'Không tìm thấy sản phẩm nào phù hợp.'}</td></tr>
              ) : (
                displayData.content.map(item => (
                  <tr key={item.id}>
                    <td style={s.td}><strong>{item.sku}</strong></td><td style={s.td}>{item.name}</td><td style={s.td}>{item.categoryName}</td><td style={s.td}>{item.unitSymbol}</td>
                    {showStock && <td style={s.td}><span style={{ color: '#2563eb', fontWeight: 'bold' }}>{item.quantityOnHand ?? '—'}</span></td>}
                    <td style={s.td}><StatusBadge status={item.status} labels={{ ACTIVE: 'Hoạt động', INACTIVE: 'Ngừng' }} /></td>
                    <td style={s.td}><div style={{ display: 'flex', gap: '12px' }}><button style={s.btnAction} onClick={() => openDetail(item)}>Chi tiết</button>{canManage && (<><button style={{ background: 'none', border: 'none', color: '#4b5563', cursor: 'pointer', fontWeight: '500', padding: 0 }} onClick={() => setDialog({ type: 'form', entity: item })}>Sửa</button><button style={{ background: 'none', border: 'none', color: item.status === 'ACTIVE' ? '#dc2626' : '#16a34a', cursor: 'pointer', fontWeight: '500', padding: 0 }} onClick={() => setDialog({ type: 'status', entity: item })}>{item.status === 'ACTIVE' ? 'Ngừng' : 'Kích hoạt'}</button></>)}</div></td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <div style={s.pagination}>
          <span style={{ fontSize: '14px', color: '#6b7280' }}>{list.loading && !cachedData ? 'Đang tải...' : `Tổng cộng ${totalElements} sản phẩm - Trang ${currentPage}/${totalPages}`}</span>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button disabled={list.loading || currentPage <= 1} onClick={() => handlePageChange(uiPage - 1)} style={(list.loading || currentPage <= 1) ? s.btnPageDisabled : { ...s.btnPage, backgroundColor: hoveredBtn === 'prev' ? '#f3f4f6' : '#fff' }} onMouseEnter={() => setHoveredBtn('prev')} onMouseLeave={() => setHoveredBtn(null)}>Trước</button>
            <button disabled={list.loading || currentPage >= totalPages} onClick={() => handlePageChange(uiPage + 1)} style={(list.loading || currentPage >= totalPages) ? s.btnPageDisabled : { ...s.btnPage, backgroundColor: hoveredBtn === 'next' ? '#f3f4f6' : '#fff' }} onMouseEnter={() => setHoveredBtn('next')} onMouseLeave={() => setHoveredBtn(null)}>Sau</button>
          </div>
        </div>
      </div>

      {dialog?.type === 'form' && (
        <div style={s.modalOverlay}><div style={{ ...s.modalContent, maxWidth: '600px' }}><div style={s.modalHeader}><h3 style={{ margin: 0, fontSize: '18px', fontWeight: 'bold' }}>{dialog.entity ? 'Cập nhật' : 'Thêm sản phẩm'}</h3><button onClick={() => setDialog(null)} style={{ background: 'none', border: 'none', fontSize: '24px', cursor: 'pointer', color: '#6b7280' }}>×</button></div><ProductForm entity={dialog.entity} categories={categories} units={units} onClose={() => setDialog(null)} onSaved={list.load} /></div></div>
      )}
      {dialog?.type === 'detail' && <ProductDetailModal product={dialog.entity} showStock={showStock} onClose={() => setDialog(null)} />}
      {dialog?.type === 'status' && <ConfirmDialog dangerous={dialog.entity.status === 'ACTIVE'} message={`Bạn có chắc muốn ${dialog.entity.status === 'ACTIVE' ? 'ngừng hoạt động' : 'kích hoạt'} sản phẩm ${dialog.entity.sku}?`} onClose={() => setDialog(null)} onConfirm={() => changeStatus(dialog.entity)} />}
    </div>
  )
}