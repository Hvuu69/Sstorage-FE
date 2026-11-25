import { useEffect, useMemo, useState, useRef } from 'react'
import { useAuth } from '../../auth/authContext.js'
import { categoryApi } from '../../categories/api/categoryApi.js'
import { unitApi } from '../../units/api/unitApi.js'
import usePagedResource from '../../../shared/hooks/usePagedResource.js'
import { ConfirmDialog, Modal, StatusBadge, useToast } from '../../../shared/ui/index.js'
import { productApi, importApi, exportApi, supplierApi } from '../api/productApi.js'
import { canManageProducts, canViewInternalStock } from '../productPermissions.js'
import { UnifiedScanner } from '../../identification/index.js'
import { dealerApi } from '../../dealers/api/dealerApi.js'

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
  badgeDanger: { backgroundColor: '#fee2e2', color: '#991b1b', padding: '4px 8px', borderRadius: '4px', fontSize: '12px', fontWeight: '500' },
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
};

// Nhúng Keyframes
if (typeof document !== 'undefined') {
  const styleTag = document.createElement('style');
  styleTag.innerHTML = `
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

const QrIcon = ({ size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" /><rect x="3" y="14" width="7" height="7" rx="1" />
    <path d="M14 14h3v3h-3zM18 18h3v3h-3zM18 14h3M14 18v3" />
  </svg>
);

// ==========================================
// HELPERS XỬ LÝ STATUS PHIẾU
// ==========================================
const getVoucherStatusLabel = (status) => {
  if (status === 'COMPLETED' || status === 'CONFIRMED' || status === 'Hoàn tất') return 'Hoàn tất';
  if (status === 'CANCELLED' || status === 'Đã hủy') return 'Đã hủy';
  return 'Nháp';
};
const getVoucherStatusStyle = (status) => {
  const label = getVoucherStatusLabel(status);
  if (label === 'Hoàn tất') return s.badgeSuccess;
  if (label === 'Đã hủy') return s.badgeDanger;
  return s.badgePending;
};
const isDraftVoucher = (status) => {
  return status !== 'COMPLETED' && status !== 'CONFIRMED' && status !== 'CANCELLED' && status !== 'Hoàn tất' && status !== 'Đã hủy';
};

// ==========================================
// LOẠI XUẤT KHO (Đã rút gọn)
// ==========================================
const EXPORT_TYPES = [
  { value: 'SALE', label: 'Xuất bán hàng', description: 'Xuất sản phẩm để bán cho đại lý/khách hàng.' },
  { value: 'DISPOSE', label: 'Xuất hủy', description: 'Hủy hàng hỏng, lỗi hoặc hết hạn sử dụng.' },
];

const getExportTypeLabel = (type) => {
  const found = EXPORT_TYPES.find(t => t.value === type);
  return found ? found.label : '—';
};

// ==========================================
// ĐỐI TÁC THEO LOẠI XUẤT KHO
// ==========================================
const EXPORT_PARTNER_SOURCE = {
  SALE:            { kind: 'customer',  label: 'Đại lý' },
  DISPOSE:         { kind: 'none',      label: 'Người lập phiếu' },
};

// Tải danh sách đối tác theo loại xuất.
async function fetchPartnersByExportType(exportType) {
  const source = EXPORT_PARTNER_SOURCE[exportType];
  if (!source || source.kind === 'none') return [];
  
  try {
    let rawData = [];

    if (source.kind === 'customer') {
      // Lấy danh sách đại lý
      const res = await dealerApi.list(); 
      if (Array.isArray(res)) rawData = res;
      else if (res?.content) rawData = res.content;
      else if (res?.data) rawData = Array.isArray(res.data) ? res.data : (res.data.content || []);
    }

    return rawData.map((x) => ({
      id: x.id || x.dealerId,
      name: x.name || x.dealerName || x.fullName || x.code || `#${x.id}`
    })).filter(item => item.name);

  } catch (err) {
    console.error("Lỗi tải danh sách đối tác:", err);
    return [];
  }
}

// ==========================================
// MODAL CHI TIẾT SẢN PHẨM
// ==========================================
function SupplierBadges({ suppliers = [] }) {
  if (!suppliers.length) return <span style={{ color: '#6b7280' }}>Chưa gán nhà cung cấp</span>;
  return <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
    {suppliers.map((supplier) => {
      const active = supplier.supplierStatus === 'ACTIVE' && supplier.linkStatus === 'ACTIVE';
      return <span key={supplier.id} title={`${supplier.supplierCode} · NCC: ${supplier.supplierStatus} · Liên kết: ${supplier.linkStatus}`}
        style={{ padding: '4px 8px', borderRadius: '999px', fontSize: '12px', fontWeight: 500,
          backgroundColor: active ? '#ecfdf5' : '#f3f4f6', color: active ? '#047857' : '#6b7280',
          border: `1px solid ${active ? '#a7f3d0' : '#d1d5db'}` }}>
        {supplier.name}{active ? '' : ' · Ngừng liên kết'}
      </span>;
    })}
  </div>;
}

export function ProductDetailModal({ product, onClose, showStock, canManage = false, categories = [], units = [], suppliers = [], supplierLoading = false, supplierError = '', onUpdated }) {
  const [editing, setEditing] = useState(false);
  const [currentProduct, setCurrentProduct] = useState(product);
  useEffect(() => { setCurrentProduct(product); setEditing(false); }, [product]);
  if (!product) return null;
  if (editing) return (
    <div style={s.modalOverlay}>
      <div style={{ ...s.modalContent, maxWidth: '700px' }}>
        <div style={s.modalHeader}><h3 style={{ margin: 0, fontSize: '18px', fontWeight: 'bold' }}>Chỉnh sửa sản phẩm</h3><button onClick={() => setEditing(false)} style={{ background: 'none', border: 'none', fontSize: '24px', cursor: 'pointer', color: '#6b7280' }}>×</button></div>
        <ProductForm entity={currentProduct} categories={categories} units={units} suppliers={suppliers} supplierLoading={supplierLoading} supplierError={supplierError}
          onClose={() => setEditing(false)} onSaved={async (updated) => { setCurrentProduct(updated); onUpdated?.(updated); }} />
      </div>
    </div>
  );
  return (
    <div style={s.modalOverlay}>
      <div style={{ ...s.modalContent, maxWidth: '600px' }}>
        <div style={s.modalHeader}><h3 style={{ margin: 0, fontSize: '18px', fontWeight: 'bold' }}>Chi tiết sản phẩm</h3><button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: '24px', cursor: 'pointer', color: '#6b7280' }}>×</button></div>
        <div style={{ ...s.modalBody, display: 'grid', gridTemplateColumns: '1fr 1fr' }}>
          <div style={s.detailItem}><span style={s.detailLabel}>SKU</span><span style={{ ...s.detailValue, color: '#2563eb' }}>{currentProduct.sku}</span></div>
          <div style={s.detailItem}><span style={s.detailLabel}>Trạng thái</span><StatusBadge status={currentProduct.status} labels={{ ACTIVE: 'Hoạt động', INACTIVE: 'Ngừng' }} /></div>
          <div style={{ ...s.detailItem, gridColumn: 'span 2' }}><span style={s.detailLabel}>Tên sản phẩm</span><span style={s.detailValue}>{currentProduct.name}</span></div>
          <div style={s.detailItem}><span style={s.detailLabel}>Danh mục</span><span style={s.detailValue}>{currentProduct.categoryName}</span></div>
          <div style={s.detailItem}><span style={s.detailLabel}>Đơn vị</span><span style={s.detailValue}>{currentProduct.unitName} ({currentProduct.unitSymbol})</span></div>
          <div style={{ ...s.detailItem, gridColumn: 'span 2' }}><span style={s.detailLabel}>Mô tả</span><span style={s.detailValue}>{currentProduct.description || 'Không có mô tả'}</span></div>
          <div style={{ ...s.detailItem, gridColumn: 'span 2' }}><span style={s.detailLabel}>Nhà cung cấp</span><SupplierBadges suppliers={currentProduct.suppliers} /></div>
          {showStock && (<div style={s.detailItem}><span style={s.detailLabel}>Tồn kho</span><span style={{ ...s.detailValue, fontSize: '18px', color: '#059669' }}>{currentProduct.quantityOnHand ?? '—'}</span></div>)}
        </div>
        <div style={s.modalFooter}>{canManage && <button onClick={() => setEditing(true)} style={s.btnPrimary}>Chỉnh sửa</button>}<button onClick={onClose} style={{ padding: '10px 16px', borderRadius: '8px', border: '1px solid #d1d5db', background: '#fff', cursor: 'pointer', fontWeight: '500' }}>Đóng</button></div>
      </div>
    </div>
  );
}

// ==========================================
// MODAL XEM CHI TIẾT PHIẾU NHẬP/XUẤT
// ==========================================
export function VoucherDetailModal({ voucher, onClose, onRequestConfirm, allowScan = false, onVoucherUpdated }) {
  const { notify } = useToast();
  const [scannerOpen, setScannerOpen] = useState(false);
  const [scanning, setScanning] = useState(false);
  const scanningRef = useRef(false);
  const [savingDraft, setSavingDraft] = useState(false);
  const [draftItems, setDraftItems] = useState(voucher.items || voucher.lines || []);
  const isDraft = isDraftVoucher(voucher.status);
  const statusLabel = getVoucherStatusLabel(voucher.status);
  const items = allowScan && isDraft ? draftItems : (voucher.items || voucher.lines || []);
  const totalQty = items.length
    ? items.reduce((sum, item) => sum + (Number(item.quantity) || 0), 0)
    : (voucher.totalQuantity ?? voucher.qty ?? 0);
  const exportTypeLabel = voucher.exportType ? getExportTypeLabel(voucher.exportType) : null;
  const formatDateTime = (value) => value ? new Date(value).toLocaleString('vi-VN') : '—';

  useEffect(() => {
    setDraftItems(voucher.items || voucher.lines || []);
  }, [voucher]);

  const handleProductDetected = async (product) => {
    if (scanningRef.current) return;
    scanningRef.current = true;
    setScanning(true);
    try {
      const updated = await importApi.scan(voucher.id, product.identifierValue);
      onVoucherUpdated?.(updated);
      notify(`Đã thêm ${product.sku}; số lượng trong phiếu đã được cập nhật.`);
    } catch (error) {
      notify(error?.message || 'Không thể thêm sản phẩm từ mã vừa quét.', 'error');
      throw error;
    } finally {
      scanningRef.current = false;
      setScanning(false);
    }
  };

  const updateDraftQuantity = (productId, value) => {
    setDraftItems(current => current.map(item => item.productId === productId ? { ...item, quantity: value } : item));
  };

  const saveDraftLines = async () => {
    const lines = draftItems.map(item => ({ productId: item.productId, quantity: Number(item.quantity) }));
    if (lines.length === 0 || lines.some(line => !Number.isSafeInteger(line.quantity) || line.quantity <= 0)) {
      notify('Phiếu nhập phải có ít nhất một sản phẩm và số lượng phải là số nguyên dương.', 'error');
      return;
    }
    setSavingDraft(true);
    try {
      const updated = await importApi.update(voucher.id, { supplierId: voucher.supplierId, note: voucher.note || '', lines });
      onVoucherUpdated?.(updated);
      notify('Đã cập nhật phiếu nhập nháp.');
    } catch (error) {
      notify(error?.message || 'Không thể cập nhật phiếu nhập.', 'error');
    } finally {
      setSavingDraft(false);
    }
  };

  return (
    <div style={s.modalOverlay}>
      <div style={{ ...s.modalContent, maxWidth: '760px' }}>
        <div style={s.modalHeader}>
          <h2 style={{ margin: 0, fontSize: '18px', fontWeight: 'bold' }}>Chi tiết {voucher.code || voucher.id}</h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: '24px', cursor: 'pointer' }}>×</button>
        </div>
        
        <div style={s.modalBody}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={getVoucherStatusStyle(voucher.status)}>{statusLabel}</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              {allowScan && isDraft && (
                <button
                  type="button"
                  onClick={() => setScannerOpen(value => !value)}
                  style={{ ...s.btnPrimary, display: 'inline-flex', alignItems: 'center', gap: '8px' }}
                  aria-label="Quét QR thêm sản phẩm"
                >
                  <QrIcon /> {scannerOpen ? 'Đóng máy quét' : 'Quét QR'}
                </button>
              )}
              <span style={{ fontSize: '16px', fontWeight: 'bold' }}>Tổng: {totalQty}</span>
            </div>
            {exportTypeLabel && (
              <div style={s.detailItem}>
                <span style={s.detailLabel}>Loại xuất kho</span>
                <span style={s.detailValue}>{exportTypeLabel}</span>
              </div>
            )}
          </div>

          {allowScan && isDraft && scannerOpen && (
            <section className="scan-panel">
              <h3>Quét sản phẩm nhập kho</h3>
              <p>Mỗi lần quét hợp lệ sẽ thêm 1 sản phẩm. Nếu sản phẩm đã có trong phiếu, số lượng sẽ tự tăng thêm 1.</p>
              <UnifiedScanner compact singleShot onProductDetected={handleProductDetected} />
              {scanning && <p className="muted">Đang cập nhật phiếu nhập…</p>}
            </section>
          )}
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: '12px' }}>
            <div style={s.detailItem}><span style={s.detailLabel}>Mã phiếu</span><span style={s.detailValue}>{voucher.code || voucher.id}</span></div>
            <div style={s.detailItem}><span style={s.detailLabel}>Nhà cung cấp</span><span style={s.detailValue}>{voucher.supplierCode ? `${voucher.supplierCode} · ` : ''}{voucher.partner || '—'}</span></div>
            <div style={s.detailItem}><span style={s.detailLabel}>Người tạo</span><span style={s.detailValue}>{voucher.createdByName || '—'}</span></div>
            <div style={s.detailItem}><span style={s.detailLabel}>Ngày tạo</span><span style={s.detailValue}>{formatDateTime(voucher.createdAt || voucher.date)}</span></div>
            <div style={s.detailItem}><span style={s.detailLabel}>Cập nhật gần nhất</span><span style={s.detailValue}>{formatDateTime(voucher.updatedAt)}</span></div>
            <div style={s.detailItem}><span style={s.detailLabel}>Người xác nhận</span><span style={s.detailValue}>{voucher.confirmedByName || '—'}</span></div>
            <div style={s.detailItem}><span style={s.detailLabel}>Thời điểm xác nhận</span><span style={s.detailValue}>{formatDateTime(voucher.confirmedAt)}</span></div>
            <div style={s.detailItem}><span style={s.detailLabel}>Số mặt hàng / Tổng số lượng</span><span style={s.detailValue}>{items.length} / {totalQty}</span></div>
          </div>

          <div style={s.detailItem}>
            <span style={s.detailLabel}>Ghi chú</span>
            <span style={{ ...s.detailValue, whiteSpace: 'pre-wrap' }}>{voucher.note || 'Không có ghi chú'}</span>
          </div>

          <div style={{ border: '1px solid #e5e7eb', borderRadius: '8px', overflowX: 'auto' }}>
            <table style={s.table}>
              <thead style={{ backgroundColor: '#f9fafb' }}><tr><th style={{ ...s.th, width: '54px', textTransform: 'none' }}>STT</th><th style={{ ...s.th, textTransform: 'none' }}>Sản phẩm</th><th style={{ ...s.th, textTransform: 'none' }}>Đơn vị</th><th style={{ ...s.th, textTransform: 'none', textAlign: 'right' }}>Số lượng</th></tr></thead>
              <tbody>
                {items.length > 0 ? items.map((item, idx) => (
                  <tr key={item.id ?? idx}>
                    <td style={s.td}>{idx + 1}</td>
                    <td style={s.td}>
                      <strong>{item.name || item.productName || '—'}</strong>
                      <br/>
                      <span style={{ fontSize: '12px', color: '#6b7280' }}>{item.sku || item.productSku || ''}</span>
                    </td>
                    <td style={s.td}>{item.unit || item.unitSymbol || '—'}</td>
                    <td style={{ ...s.td, textAlign: 'right' }}>
                      {allowScan && isDraft ? <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: '8px' }}>
                        <input type="number" min="1" step="1" value={item.quantity}
                          onChange={(event) => updateDraftQuantity(item.productId, event.target.value)}
                          aria-label={`Số lượng ${item.sku}`} style={{ ...s.prodInput, width: '90px', padding: '8px' }} />
                        <button type="button" onClick={() => setDraftItems(current => current.filter(line => line.productId !== item.productId))}
                          style={{ background: 'none', border: 'none', color: '#dc2626', cursor: 'pointer' }}>Xóa</button>
                      </div> : <strong>{item.quantity}</strong>}
                    </td>
                  </tr>
                )) : (
                  <tr><td colSpan="4" style={s.td}>Không có sản phẩm.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div style={s.modalFooter}>
          {isDraft ? (
            <>
              {allowScan && <button onClick={saveDraftLines} disabled={savingDraft} style={{ ...s.btnPrimary, backgroundColor: '#0f766e' }}>{savingDraft ? 'Đang lưu…' : 'Lưu thay đổi'}</button>}
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
export function ProductForm({ entity, categories, units, suppliers = [], supplierLoading = false, supplierError = '', onClose, onSaved }) {
  const { notify } = useToast()
  const safeCategories = Array.isArray(categories) ? categories : [];
  const safeUnits = Array.isArray(units) ? units : [];
  
  const selectableCategories = safeCategories.filter((item) => item.active || item.id === entity?.categoryId)
  const activeSupplierIds = entity?.suppliers?.filter(item => item.linkStatus === 'ACTIVE').map(item => item.id) ?? [];
  const [form, setForm] = useState({ sku: entity?.sku ?? '', name: entity?.name ?? '', description: entity?.description ?? '', categoryId: entity?.categoryId ?? selectableCategories[0]?.id ?? '', unitId: entity?.unitId ?? safeUnits[0]?.id ?? '', supplierIds: activeSupplierIds })
  const [errors, setErrors] = useState({})
  const [saving, setSaving] = useState(false)
  const update = (field) => (event) => setForm((value) => ({ ...value, [field]: event.target.value }))
  const toggleSupplier = (supplierId) => setForm(value => ({ ...value, supplierIds: value.supplierIds.includes(supplierId)
    ? value.supplierIds.filter(id => id !== supplierId) : [...value.supplierIds, supplierId] }))
  
  async function submit(event) {
    event.preventDefault(); setErrors({})
    if (!form.categoryId || !form.unitId) { setErrors({ categoryId: !form.categoryId ? 'Hãy chọn danh mục.' : '', unitId: !form.unitId ? 'Hãy chọn đơn vị.' : '' }); return }
    setSaving(true)
    try {
      const saved = entity ? await productApi.update(entity.id, form) : await productApi.create(form)
      notify(entity ? 'Đã cập nhật sản phẩm.' : 'Đã tạo sản phẩm.')
      await onSaved(saved); onClose()
    } catch (error) { setErrors(error.fieldErrors ?? {}); notify(error.message, 'error') }
    finally { setSaving(false) }
  }

  return (
    <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', minHeight: 0, flex: 1, overflow: 'hidden' }}>
      <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px', overflowY: 'auto', minHeight: 0 }}>
        <div style={s.prodInputGroup}><label style={s.prodLabel}>SKU *</label><input required maxLength="60" value={form.sku} onChange={update('sku')} style={s.prodInput} />{entity && <span style={{ fontSize: '12px', color: '#6b7280' }}>SKU chỉ đổi được khi sản phẩm chưa có dữ liệu nghiệp vụ liên quan.</span>}</div>
        <div style={s.prodInputGroup}><label style={s.prodLabel}>Tên sản phẩm *</label><input required maxLength="200" value={form.name} onChange={update('name')} style={s.prodInput} /></div>
        <div style={s.prodInputGroup}><label style={s.prodLabel}>Danh mục *</label><select required value={form.categoryId} onChange={update('categoryId')} style={s.prodInput}><option value="">Chọn danh mục</option>{selectableCategories.map((item) => <option key={item.id} value={item.id}>{item.code} · {item.name}</option>)}</select></div>
        <div style={s.prodInputGroup}><label style={s.prodLabel}>Đơn vị chuẩn *</label><select required value={form.unitId} onChange={update('unitId')} style={s.prodInput}><option value="">Chọn đơn vị</option>{safeUnits.map((item) => <option key={item.id} value={item.id}>{item.code} · {item.name} ({item.symbol})</option>)}</select></div>
        <div style={s.prodInputGroup}>
          <label style={s.prodLabel}>Nhà cung cấp</label>
          <span style={{ fontSize: '12px', color: '#6b7280' }}>Có thể chọn nhiều nhà cung cấp; bỏ chọn sẽ ngừng liên kết, không xóa lịch sử.</span>
          <div style={{ border: '1px solid #d1d5db', borderRadius: '8px', maxHeight: '190px', overflowY: 'auto' }}>
            {supplierLoading ? <div style={{ padding: '12px', color: '#6b7280' }}>Đang tải nhà cung cấp...</div> : supplierError ? <div style={{ padding: '12px', color: '#dc2626' }}>{supplierError}</div> : suppliers.filter(item => item.status === 'ACTIVE').length === 0 ? <div style={{ padding: '12px', color: '#6b7280' }}>Không có nhà cung cấp đang hoạt động.</div> : suppliers.filter(item => item.status === 'ACTIVE').map(supplier => (
              <label key={supplier.id} style={{ padding: '10px 12px', display: 'flex', alignItems: 'center', gap: '10px', borderBottom: '1px solid #f3f4f6', cursor: 'pointer' }}>
                <input type="checkbox" checked={form.supplierIds.includes(supplier.id)} onChange={() => toggleSupplier(supplier.id)} />
                <span><strong>{supplier.code}</strong> · {supplier.name}</span>
              </label>
            ))}
            {entity?.suppliers?.filter(item => item.supplierStatus === 'INACTIVE' && item.linkStatus === 'ACTIVE').map(supplier => (
              <label key={supplier.id} style={{ padding: '10px 12px', display: 'flex', alignItems: 'center', gap: '10px', color: '#6b7280' }}>
                <input type="checkbox" checked={form.supplierIds.includes(supplier.id)} onChange={() => toggleSupplier(supplier.id)} />
                <span><strong>{supplier.supplierCode}</strong> · {supplier.name} (NCC đã ngừng hoạt động; chỉ có thể bỏ liên kết)</span>
              </label>
            ))}
          </div>
        </div>
      </div>
      <div style={s.modalFooter}><button type="button" onClick={onClose} disabled={saving} style={{ padding: '10px 16px', borderRadius: '8px', border: '1px solid #d1d5db', background: '#fff', cursor: saving ? 'not-allowed' : 'pointer' }}>Hủy</button><button type="submit" disabled={saving || supplierLoading} style={{ ...s.btnPrimary, opacity: saving || supplierLoading ? 0.65 : 1 }}>{saving ? 'Đang lưu…' : entity ? 'Lưu thay đổi' : 'Thêm sản phẩm'}</button></div>
    </form>
  )
}

// ==========================================
// MODAL TẠO PHIẾU NHẬP KHO (CÓ TÌM KIẾM NCC)
// ==========================================
export function CreateImportModal({ onClose, onSave }) {
  const { notify } = useToast();
  const [isSaving, setIsSaving] = useState(false);
  const [quantities, setQuantities] = useState({});
  
  const [suppliers, setSuppliers] = useState([]);
  const [selectedSupplier, setSelectedSupplier] = useState('');
  const [loadingSuppliers, setLoadingSuppliers] = useState(true);
  
  const [isSupplierDropdownOpen, setIsSupplierDropdownOpen] = useState(false);
  const [searchSupplier, setSearchSupplier] = useState('');
  const dropdownRef = useRef(null);

  const [products, setProducts] = useState([]);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [productError, setProductError] = useState('');
  const [productSearch, setProductSearch] = useState('');
  const [productPage, setProductPage] = useState(0);
  const [productTotalPages, setProductTotalPages] = useState(0);

  useEffect(() => {
    supplierApi.listActive({ page: 0, size: 100, sort: 'name,asc' })
      .then((response) => setSuppliers(response.content || []))
      .catch(err => notify(err.message || 'Không tải được nhà cung cấp đang hoạt động.', 'error'))
      .finally(() => setLoadingSuppliers(false));
  }, []);

  useEffect(() => {
    if (!selectedSupplier) {
      setProducts([]);
      setProductTotalPages(0);
      return;
    }
    const controller = new AbortController();
    setLoadingProducts(true);
    setProductError('');
    supplierApi.products(selectedSupplier, { search: productSearch.trim() || undefined, page: productPage, size: 10, sort: 'product.name,asc' }, { signal: controller.signal })
      .then((response) => {
        setProducts(response.content || []);
        setProductTotalPages(response.totalPages || 0);
      })
      .catch((error) => { if (error?.errorCode !== 'REQUEST_ABORTED') setProductError(error.message); })
      .finally(() => setLoadingProducts(false));
    return () => controller.abort();
  }, [selectedSupplier, productSearch, productPage]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsSupplierDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleQtyChange = (id, val) => setQuantities(prev => ({ ...prev, [id]: val }));

  const chooseSupplier = (supplier) => {
    const hasLines = Object.values(quantities).some(value => Number(value) > 0);
    if (selectedSupplier && selectedSupplier !== supplier.id && hasLines &&
        !globalThis.confirm('Đổi nhà cung cấp sẽ xóa toàn bộ sản phẩm đã chọn. Bạn có muốn tiếp tục?')) return;
    if (selectedSupplier !== supplier.id) setQuantities({});
    setSelectedSupplier(supplier.id);
    setProductSearch('');
    setProductPage(0);
    setIsSupplierDropdownOpen(false);
  };

  const handleSave = async () => {
    if (!selectedSupplier) {
      notify('Vui lòng chọn nhà cung cấp.', 'error');
      return;
    }

    const selectedItems = Object.entries(quantities)
      .filter(([, quantity]) => Number.isSafeInteger(Number(quantity)) && Number(quantity) > 0)
      .map(([productId, quantity]) => ({ productId, quantity: Number(quantity) }));

    if (selectedItems.length === 0) {
      notify('Vui lòng nhập số lượng cho ít nhất 1 sản phẩm.', 'error');
      return;
    }

    setIsSaving(true);
    try {
      await onSave({
        supplierId: selectedSupplier,
        note: '',
        lines: selectedItems,
      });
    } catch (e) {
      notify(e?.message || 'Không tạo được phiếu nhập.', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const filteredSuppliers = suppliers.filter(sup =>
    (sup.name || '').toLowerCase().includes(searchSupplier.toLowerCase()) ||
    (sup.code || '').toLowerCase().includes(searchSupplier.toLowerCase())
  );
  const selectedSupplierInfo = suppliers.find(supplier => supplier.id === selectedSupplier);

  return (
    <div style={s.modalOverlay} onClick={onClose}>
      <div style={{ ...s.modalContent, maxWidth: '650px' }} onClick={(e) => e.stopPropagation()}>
        <div style={s.modalHeader}>
          <h2 style={{ margin: 0, fontSize: '18px', fontWeight: 'bold' }}>Tạo phiếu nhập nháp</h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: '24px', cursor: 'pointer' }}>×</button>
        </div>
        
        <div style={s.modalBody}>
          <div style={s.prodInputGroup} ref={dropdownRef}>
            <label style={s.prodLabel}>Nhà cung cấp *</label>
            <div style={{ position: 'relative' }}>
                <div 
                  onClick={() => { setIsSupplierDropdownOpen(!isSupplierDropdownOpen); setSearchSupplier(''); }}
                  style={{ ...s.prodInput, cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
                >
                  <span style={{ color: selectedSupplier ? '#111827' : '#9ca3af' }}>
                    {loadingSuppliers ? 'Đang tải nhà cung cấp...' : selectedSupplierInfo ? `${selectedSupplierInfo.code} · ${selectedSupplierInfo.name}` : 'Chọn nhà cung cấp...'}
                  </span>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#6b7280" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"></polyline></svg>
                </div>

                {isSupplierDropdownOpen && (
                  <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, marginTop: '4px', backgroundColor: '#fff', border: '1px solid #d1d5db', borderRadius: '8px', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)', zIndex: 10, maxHeight: '250px', display: 'flex', flexDirection: 'column' }}>
                    <div style={{ padding: '8px', borderBottom: '1px solid #e5e7eb' }}>
                      <input 
                        type="text" 
                        placeholder="Tìm nhà cung cấp..." 
                        value={searchSupplier}
                        onChange={(e) => setSearchSupplier(e.target.value)}
                        style={{ ...s.prodInput, padding: '8px 12px' }}
                        onClick={(e) => e.stopPropagation()}
                        autoFocus
                      />
                    </div>
                    <div style={{ overflowY: 'auto' }}>
                      {filteredSuppliers.length === 0 ? (
                        <div style={{ padding: '12px', textAlign: 'center', color: '#6b7280', fontSize: '14px' }}>Không tìm thấy nhà cung cấp.</div>
                      ) : (
                        filteredSuppliers.map((sup) => (
                          <div 
                            key={sup.id || sup.name}
                            onClick={() => chooseSupplier(sup)}
                            style={{ padding: '10px 12px', cursor: 'pointer', fontSize: '14px', backgroundColor: selectedSupplier === sup.id ? '#eff6ff' : '#fff', color: selectedSupplier === sup.id ? '#2563eb' : '#374151', borderBottom: '1px solid #f3f4f6' }}
                          >
                            <strong>{sup.code}</strong> · {sup.name}
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>
          </div>

          <div style={{ border: '1px solid #e5e7eb', borderRadius: '8px', overflow: 'hidden' }}>
            {selectedSupplier && <div style={{ padding: '12px', borderBottom: '1px solid #e5e7eb' }}>
              <input
                value={productSearch}
                onChange={(event) => { setProductSearch(event.target.value); setProductPage(0); }}
                placeholder="Tìm theo SKU hoặc tên sản phẩm..."
                style={s.prodInput}
                aria-label="Tìm sản phẩm của nhà cung cấp"
              />
            </div>}
            <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 100px', gap: '12px', padding: '12px 16px', backgroundColor: '#f9fafb', borderBottom: '1px solid #e5e7eb', position: 'sticky', top: 0, zIndex: 1 }}>
                <div style={{ ...s.th, padding: 0, backgroundColor: 'transparent', borderBottom: 'none', textTransform: 'none' }}>Sản phẩm</div>
                <div style={{ ...s.th, padding: 0, backgroundColor: 'transparent', borderBottom: 'none', textTransform: 'none', textAlign: 'right' }}>Số lượng</div>
              </div>
              
              {/* Danh sách sản phẩm */}
              {!selectedSupplier ? (
                <div style={{ padding: '24px', textAlign: 'center', color: '#6b7280' }}>Vui lòng chọn nhà cung cấp trước</div>
              ) : loadingProducts ? (
                <div style={{ padding: '24px', textAlign: 'center', color: '#6b7280' }}>Đang tải danh sách sản phẩm...</div>
              ) : productError ? (
                <div style={{ padding: '24px', textAlign: 'center', color: '#dc2626' }}>{productError}</div>
              ) : products.length === 0 ? (
                <div style={{ padding: '24px', textAlign: 'center', color: '#6b7280' }}>Nhà cung cấp chưa có sản phẩm phù hợp.</div>
              ) : (
                products.map(p => (
                  <div key={p.productId} style={{ display: 'grid', gridTemplateColumns: '1fr 100px', gap: '12px', padding: '16px', borderBottom: '1px solid #e5e7eb', alignItems: 'center' }}>
                    <div style={{ wordBreak: 'break-word' }}>
                      <strong style={{ fontSize: '14px' }}>{p.productName}</strong>
                      <div style={{ fontSize: '12px', color: '#6b7280', marginTop: '4px' }}>{p.sku} · {p.unit || '—'}</div>
                      {p.identifierValue && <div style={{ fontSize: '12px', color: '#6b7280', marginTop: '2px' }}>{p.identifierType}: {p.identifierValue}</div>}
                    </div>
                    <div>
                      <input 
                        type="number" 
                        min="1"
                        step="1"
                        placeholder="SL"
                        value={quantities[p.productId] || ''}
                        onChange={(e) => handleQtyChange(p.productId, e.target.value)}
                        style={{ ...s.prodInput, textAlign: 'center', padding: '8px', backgroundColor: '#f9fafb' }} 
                      />
                    </div>
                  </div>
                ))
              )}
            </div>
            {selectedSupplier && productTotalPages > 1 && <div style={{ padding: '10px 12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid #e5e7eb' }}>
              <button type="button" disabled={productPage === 0 || loadingProducts} onClick={() => setProductPage(page => page - 1)} style={s.btnPage}>Trước</button>
              <span style={{ fontSize: '13px', color: '#6b7280' }}>Trang {productPage + 1}/{productTotalPages}</span>
              <button type="button" disabled={productPage + 1 >= productTotalPages || loadingProducts} onClick={() => setProductPage(page => page + 1)} style={s.btnPage}>Sau</button>
            </div>}
          </div>
        </div>

        <div style={s.modalFooter}>
          <button onClick={onClose} style={{ padding: '10px 16px', borderRadius: '8px', border: '1px solid #d1d5db', background: '#fff', cursor: 'pointer' }}>Hủy</button>
          <button onClick={handleSave} disabled={isSaving || loadingProducts || !selectedSupplier} style={{ ...s.btnPrimary, backgroundColor: '#8b5cf6', opacity: isSaving ? 0.7 : 1 }}>
            {isSaving ? 'Đang lưu...' : 'Lưu nháp'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ==========================================
// MODAL TẠO PHIẾU XUẤT KHO
// ==========================================
function CreateExportModal({ onClose, onSave }) {
  const { notify } = useToast();
  const { currentUser } = useAuth(); 
  
  const [isSaving, setIsSaving] = useState(false);
  const [quantities, setQuantities] = useState({});
  const [exportType, setExportType] = useState('SALE');
  const [note, setNote] = useState('');

  // State Đại lý
  const [partners, setPartners] = useState([]);
  const [loadingPartners, setLoadingPartners] = useState(false);
  const [selectedPartner, setSelectedPartner] = useState('');
  
  // State Thêm đại lý mới (Đã thêm address vào state)
  const [isAddingPartner, setIsAddingPartner] = useState(false);
  const [newPartnerData, setNewPartnerData] = useState({ 
    name: '', 
    code: '', 
    phone: '', 
    address: '', 
    status: 'ACTIVE' 
  });
  
  const [isPartnerDropdownOpen, setIsPartnerDropdownOpen] = useState(false);
  const [searchPartner, setSearchPartner] = useState('');
  const partnerDropdownRef = useRef(null);

  const [products, setProducts] = useState([]);
  const [loadingProducts, setLoadingProducts] = useState(true);

  const partnerSource = EXPORT_PARTNER_SOURCE[exportType];

  useEffect(() => {
    productApi.list({ page: 0, size: 100, status: 'ACTIVE' })
      .then(res => setProducts(res?.content || []))
      .catch(err => notify(err.message || 'Lỗi tải sản phẩm', 'error'))
      .finally(() => setLoadingProducts(false));
  }, []);

  useEffect(() => {
    let active = true;
    setSelectedPartner('');
    setSearchPartner('');
    setIsPartnerDropdownOpen(false);
    setIsAddingPartner(false);

    if (partnerSource.kind === 'none') {
      const userName = currentUser?.fullName || currentUser?.username || currentUser?.name || 'Người dùng hệ thống';
      setSelectedPartner(userName);
      setLoadingPartners(false);
    } else {
      setLoadingPartners(true);
      fetchPartnersByExportType(exportType)
        .then(list => {
          if (!active) return;
          setPartners(list);
          if (list.length === 1) setSelectedPartner(list[0].name);
        })
        .finally(() => { if (active) setLoadingPartners(false); });
    }

    return () => { active = false; };
  }, [exportType, currentUser]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (partnerDropdownRef.current && !partnerDropdownRef.current.contains(event.target)) {
        setIsPartnerDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleQtyChange = (id, val) => setQuantities(prev => ({ ...prev, [id]: val }));

  const filteredPartners = partners.filter(p =>
    (p.name || '').toLowerCase().includes(searchPartner.toLowerCase())
  );

  // Xử lý thêm đại lý mới (Đã fix lỗi undefined và bổ sung trường mặc định)
  // Xử lý thêm đại lý mới (Chỉ gửi trường tối thiểu để tránh lỗi 400)
  const handleAddPartner = async () => {
    if (!newPartnerData?.name?.trim()) {
      notify('Vui lòng nhập tên đại lý.', 'error');
      return;
    }
    
    try {
      if (partnerSource.kind === 'customer') {
        // ✅ Chỉ gửi name và dealerCode (bỏ các trường dư thừa để không bị lỗi 400)
        const payload = {
          name: newPartnerData.name.trim(),
          dealerCode: newPartnerData.code?.trim() || `DL-${Date.now().toString().slice(-6)}`,
        };

        const newDealer = await dealerApi.create(payload);
        
        const dealerName = newDealer.name || newDealer.dealerName || payload.name;
        setPartners(prev => [...prev, { id: newDealer.id || Date.now(), name: dealerName }]);
        setSelectedPartner(dealerName);
      }
      
      setIsAddingPartner(false);
      setNewPartnerData({ name: '', code: '', phone: '', address: '', status: 'ACTIVE' });
      notify(`Đã thêm ${partnerSource.label.toLowerCase()} mới.`);
      
    } catch (err) {
      console.error("Chi tiết lỗi thêm đối tác:", err);
      const errorMsg = err.response?.data?.message || err.message || `Lỗi khi thêm ${partnerSource.label.toLowerCase()}.`;
      notify(errorMsg, 'error');
    }
  };

  const handleSave = async () => {
    if (!exportType) {
      notify('Vui lòng chọn loại xuất kho.', 'error');
      return;
    }
    if (!selectedPartner?.trim()) {
      notify(`Vui lòng chọn ${partnerSource.label.toLowerCase()}.`, 'error');
      return;
    }

    const selectedItems = products
      .filter(p => Number(quantities[p.id]) > 0)
      .map(p => ({ productId: p.id, quantity: Number(quantities[p.id]) }));

    if (selectedItems.length === 0) {
      notify('Vui lòng nhập số lượng cho ít nhất 1 sản phẩm.', 'error');
      return;
    }

    setIsSaving(true);
    try {
      await onSave({
        partnerName: selectedPartner.trim(),
        exportType,
        note: note.trim(),
        lines: selectedItems,
      });
    } catch (e) {
      notify(e?.message || 'Không tạo được phiếu xuất.', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const selectedTypeInfo = EXPORT_TYPES.find(t => t.value === exportType);

  return (
    <div style={s.modalOverlay} onClick={onClose}>
      <div style={{ ...s.modalContent, maxWidth: '650px' }} onClick={(e) => e.stopPropagation()}>
        <div style={s.modalHeader}>
          <h2 style={{ margin: 0, fontSize: '18px', fontWeight: 'bold' }}>Tạo phiếu xuất kho</h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: '24px', cursor: 'pointer' }}>×</button>
        </div>

        <div style={s.modalBody}>
          <div style={s.prodInputGroup}>
            <label style={s.prodLabel}>Loại xuất kho *</label>
            <select
              value={exportType}
              onChange={(e) => setExportType(e.target.value)}
              style={s.prodInput}
            >
              {EXPORT_TYPES.map(t => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </select>
            {selectedTypeInfo && (
              <span style={{ fontSize: '12px', color: '#6b7280', marginTop: '2px' }}>
                {selectedTypeInfo.description}
              </span>
            )}
          </div>

          <div style={s.prodInputGroup} ref={partnerDropdownRef}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
              <label style={s.prodLabel}>{partnerSource?.label || 'Đối tác'} *</label>
              {!isAddingPartner && partnerSource?.kind === 'customer' && (
                <button 
                  onClick={() => setIsAddingPartner(true)} 
                  style={{ background: 'none', border: 'none', color: '#2563eb', cursor: 'pointer', fontSize: '13px', fontWeight: '500', padding: 0 }}
                >
                  + Thêm {partnerSource.label.toLowerCase()} mới
                </button>
              )}
            </div>

            {isAddingPartner ? (
              <div style={{ border: '1px solid #d1d5db', borderRadius: '8px', padding: '16px', backgroundColor: '#f9fafb', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div style={{ fontSize: '14px', fontWeight: '600', color: '#111827', marginBottom: '4px' }}>Thêm đại lý mới</div>
                
                <div style={{ display: 'flex', gap: '12px' }}>
                  <input
                    type="text"
                    placeholder="Tên đại lý *"
                    style={{ ...s.prodInput, flex: 2 }}
                    value={newPartnerData.name}
                    onChange={(e) => setNewPartnerData(prev => ({ ...prev, name: e.target.value }))}
                    autoFocus
                  />
                  <input
                    type="text"
                    placeholder="Mã đại lý (Tùy chọn)"
                    style={{ ...s.prodInput, flex: 1 }}
                    value={newPartnerData.code}
                    onChange={(e) => setNewPartnerData(prev => ({ ...prev, code: e.target.value }))}
                  />
                </div>
                
                <div style={{ display: 'flex', gap: '12px' }}>
                  <input
                    type="text"
                    placeholder="Số điện thoại (Tùy chọn)"
                    style={{ ...s.prodInput, flex: 1 }}
                    value={newPartnerData.phone}
                    onChange={(e) => setNewPartnerData(prev => ({ ...prev, phone: e.target.value }))}
                  />
                  <input
                    type="text"
                    placeholder="Địa chỉ (Tùy chọn)"
                    style={{ ...s.prodInput, flex: 1 }}
                    value={newPartnerData.address}
                    onChange={(e) => setNewPartnerData(prev => ({ ...prev, address: e.target.value }))}
                  />
                </div>

                <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', marginTop: '8px' }}>
                  <button onClick={() => setIsAddingPartner(false)} style={{ padding: '8px 16px', borderRadius: '8px', border: '1px solid #d1d5db', background: '#fff', cursor: 'pointer', fontWeight: '500' }}>Hủy</button>
                  <button onClick={handleAddPartner} style={{ padding: '8px 16px', borderRadius: '8px', border: 'none', backgroundColor: '#10b981', color: '#fff', cursor: 'pointer', fontWeight: '500' }}>Lưu đại lý</button>
                </div>
              </div>
            ) : partnerSource?.kind === 'none' ? (
              <input
                type="text"
                style={{ ...s.prodInput, backgroundColor: '#f3f4f6', cursor: 'not-allowed', color: '#6b7280' }}
                value={selectedPartner}
                disabled
              />
            ) : (
              <div style={{ position: 'relative' }}>
                <div
                  onClick={() => { setIsPartnerDropdownOpen(!isPartnerDropdownOpen); setSearchPartner(''); }}
                  style={{ ...s.prodInput, cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
                >
                  <span style={{ color: selectedPartner ? '#111827' : '#9ca3af' }}>
                    {loadingPartners
                      ? `Đang tải ${partnerSource.label.toLowerCase()}...`
                      : (selectedPartner || `Chọn ${partnerSource.label.toLowerCase()}...`)}
                  </span>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#6b7280" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"></polyline></svg>
                </div>

                {isPartnerDropdownOpen && (
                  <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, marginTop: '4px', backgroundColor: '#fff', border: '1px solid #d1d5db', borderRadius: '8px', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)', zIndex: 10, maxHeight: '250px', display: 'flex', flexDirection: 'column' }}>
                    <div style={{ padding: '8px', borderBottom: '1px solid #e5e7eb' }}>
                      <input
                        type="text"
                        placeholder={`Tìm ${partnerSource.label.toLowerCase()}...`}
                        value={searchPartner}
                        onChange={(e) => setSearchPartner(e.target.value)}
                        style={{ ...s.prodInput, padding: '8px 12px' }}
                        onClick={(e) => e.stopPropagation()}
                        autoFocus
                      />
                    </div>
                    <div style={{ overflowY: 'auto' }}>
                      {filteredPartners.length === 0 ? (
                        <div style={{ padding: '12px', textAlign: 'center', color: '#6b7280', fontSize: '14px' }}>
                          Không có {partnerSource.label.toLowerCase()} nào.
                        </div>
                      ) : (
                        filteredPartners.map((p) => (
                          <div
                            key={p.id || p.name}
                            onClick={() => { setSelectedPartner(p.name); setIsPartnerDropdownOpen(false); }}
                            style={{ padding: '10px 12px', cursor: 'pointer', fontSize: '14px', backgroundColor: selectedPartner === p.name ? '#eff6ff' : '#fff', color: selectedPartner === p.name ? '#2563eb' : '#374151', borderBottom: '1px solid #f3f4f6' }}
                            onMouseEnter={(e) => { if (selectedPartner !== p.name) e.currentTarget.style.backgroundColor = '#f9fafb'; }}
                            onMouseLeave={(e) => { if (selectedPartner !== p.name) e.currentTarget.style.backgroundColor = '#fff'; }}
                          >
                            {p.name}
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          <div style={s.prodInputGroup}>
            <label style={s.prodLabel}>Ghi chú</label>
            <input
              type="text"
              placeholder="Ghi chú thêm (không bắt buộc)..."
              style={s.prodInput}
              value={note}
              onChange={(e) => setNote(e.target.value)}
            />
          </div>

          <div style={{ border: '1px solid #e5e7eb', borderRadius: '8px', overflow: 'hidden' }}>
            <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 100px', gap: '12px', padding: '12px 16px', backgroundColor: '#f9fafb', borderBottom: '1px solid #e5e7eb', position: 'sticky', top: 0, zIndex: 1 }}>
                <div style={{ ...s.th, padding: 0, backgroundColor: 'transparent', borderBottom: 'none', textTransform: 'none' }}>Sản phẩm</div>
                <div style={{ ...s.th, padding: 0, backgroundColor: 'transparent', borderBottom: 'none', textTransform: 'none', textAlign: 'right' }}>Số lượng</div>
              </div>

              {loadingProducts ? (
                <div style={{ padding: '24px', textAlign: 'center', color: '#6b7280' }}>Đang tải danh sách sản phẩm...</div>
              ) : products.length === 0 ? (
                <div style={{ padding: '24px', textAlign: 'center', color: '#6b7280' }}>Không có sản phẩm nào.</div>
              ) : (
                products.map(p => (
                  <div key={p.id} style={{ display: 'grid', gridTemplateColumns: '1fr 100px', gap: '12px', padding: '16px', borderBottom: '1px solid #e5e7eb', alignItems: 'center' }}>
                    <div style={{ wordBreak: 'break-word' }}>
                      <strong style={{ fontSize: '14px' }}>{p.name}</strong>
                      <div style={{ fontSize: '12px', color: '#6b7280', marginTop: '4px' }}>{p.sku}</div>
                    </div>
                    <div>
                      <input
                        type="number"
                        min="0"
                        placeholder="0"
                        value={quantities[p.id] || ''}
                        onChange={(e) => handleQtyChange(p.id, e.target.value)}
                        style={{ ...s.prodInput, textAlign: 'center', padding: '8px', backgroundColor: '#f9fafb' }}
                      />
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        <div style={s.modalFooter}>
          <button onClick={onClose} style={{ padding: '10px 16px', borderRadius: '8px', border: '1px solid #d1d5db', background: '#fff', cursor: 'pointer' }}>Hủy</button>
          <button onClick={handleSave} disabled={isSaving || loadingProducts} style={{ ...s.btnPrimary, backgroundColor: '#8b5cf6', opacity: isSaving ? 0.7 : 1 }}>
            {isSaving ? 'Đang lưu...' : 'Lưu nháp'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ==========================================
// TRANG NHẬP KHO
// ==========================================
export function ImportPage() {
  const { notify } = useToast();
  const [searchQuery, setSearchQuery] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedVoucher, setSelectedVoucher] = useState(null);
  const [vouchers, setVouchers] = useState([]);
  const [loadingList, setLoadingList] = useState(false);
  const [confirmAction, setConfirmAction] = useState(null);

  const isMounted = useRef(false);

  const loadVouchers = async () => {
    setLoadingList(true);
    try {
      const page = await importApi.list({ page: 0, size: 100, sort: 'createdAt,desc' });
      setVouchers(page?.content || []);
    } catch (e) {
      notify(e?.message || 'Không tải được danh sách phiếu nhập.', 'error');
    } finally {
      setLoadingList(false);
    }
  };

  useEffect(() => {
    if (isMounted.current) return;
    isMounted.current = true;
    loadVouchers();
  }, []);

  const filteredVouchers = vouchers.filter(v =>
    (v.code || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    String(v.id ?? '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (v.partner || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSaveNew = async (payload) => {
    const created = await importApi.create(payload);
    setShowCreateModal(false);
    await loadVouchers();
    notify('Đã tạo phiếu nhập nháp.');
    return created;
  };

  const handleVoucherAction = (action) => {
    if (action === 'cancel' || action === 'confirm') setConfirmAction(action);
  };

  const executeAction = async () => {
    try {
      if (confirmAction === 'cancel') {
        await importApi.cancel(selectedVoucher.id);
        notify('Đã hủy phiếu nhập.');
      } else if (confirmAction === 'confirm') {
        await importApi.complete(selectedVoucher.id);
        notify('Đã xác nhận nhập kho.');
      }
      setConfirmAction(null);
      setSelectedVoucher(null);
      await loadVouchers();
    } catch (e) {
      notify(e?.message || 'Thao tác thất bại.', 'error');
    }
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
            {loadingList ? (
              <tr><td colSpan="6" style={s.emptyTd}>Đang tải dữ liệu...</td></tr>
            ) : filteredVouchers.length === 0 ? (
              <tr><td colSpan="6" style={s.emptyTd}>Không tìm thấy phiếu nhập nào phù hợp.</td></tr>
            ) : (
              filteredVouchers.map((row) => (
                <tr key={row.id}>
                  <td style={s.td}><span style={s.codeText}>{row.code || row.id}</span></td>
                  <td style={s.td}>{row.partner || '—'}</td>
                  <td style={s.td}>{row.createdAt ? new Date(row.createdAt).toLocaleString('vi-VN') : (row.date || '—')}</td>
                  <td style={s.td}>{row.totalQuantity ?? row.qty ?? 0}</td>
                  <td style={s.td}><span style={getVoucherStatusStyle(row.status)}>{getVoucherStatusLabel(row.status)}</span></td>
                  <td style={s.td}><button style={{ ...s.btnAction, display: 'inline-flex', alignItems: 'center', gap: '6px' }} onClick={() => setSelectedVoucher(row)}><QrIcon size={16} /> Chi tiết</button></td>
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
          allowScan
          onVoucherUpdated={(updated) => {
            setSelectedVoucher(updated);
            setVouchers(current => current.map(item => item.id === updated.id ? updated : item));
          }}
        />
      )}

      {confirmAction && (
        <div style={{ ...s.modalOverlay, zIndex: 100 }}>
          <div style={s.confirmBox}>
            <h3 style={s.confirmTitle}>
              {confirmAction === 'confirm' ? 'Xác nhận nhập kho' : 'Hủy phiếu nhập'}
            </h3>
            <p style={s.confirmText}>
              {confirmAction === 'confirm'
                ? <>Bạn có chắc chắn muốn hoàn tất phiếu nhập <strong>{selectedVoucher?.code || selectedVoucher?.id}</strong>? Thao tác này sẽ làm thay đổi tồn kho.</>
                : <>Bạn có chắc muốn hủy phiếu <strong>{selectedVoucher?.code || selectedVoucher?.id}</strong>?</>}
            </p>
            <div style={s.confirmActions}>
              <button onClick={() => setConfirmAction(null)} style={{ padding: '10px 24px', borderRadius: '8px', border: '1px solid #d1d5db', background: '#fff', cursor: 'pointer', fontWeight: '500' }}>Không</button>
              <button
                onClick={executeAction}
                style={{
                  padding: '10px 24px', borderRadius: '8px', border: 'none',
                  backgroundColor: confirmAction === 'confirm' ? '#2563eb' : '#e11d48',
                  color: '#fff', cursor: 'pointer', fontWeight: '500'
                }}
              >
                Đồng ý
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ==========================================
// TRANG XUẤT KHO
// ==========================================
export function ExportPage() {
  const { notify } = useToast();
  const [searchQuery, setSearchQuery] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedVoucher, setSelectedVoucher] = useState(null);
  const [vouchers, setVouchers] = useState([]);
  const [loadingList, setLoadingList] = useState(false);
  const [confirmAction, setConfirmAction] = useState(null);
  const [typeFilter, setTypeFilter] = useState('');

  const isMounted = useRef(false);

  const loadVouchers = async () => {
    setLoadingList(true);
    try {
      const page = await exportApi.list({ page: 0, size: 100, sort: 'createdAt,desc' });
      setVouchers(page?.content || []);
    } catch (e) {
      notify(e?.message || 'Không tải được danh sách phiếu xuất.', 'error');
    } finally {
      setLoadingList(false);
    }
  };

  useEffect(() => {
    if (isMounted.current) return;
    isMounted.current = true;
    loadVouchers();
  }, []);

  const filteredVouchers = vouchers.filter(v => {
    const matchesSearch =
      (v.code || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      String(v.id ?? '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (v.partner || '').toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = !typeFilter || v.exportType === typeFilter;
    return matchesSearch && matchesType;
  });

  const handleSaveNew = async (payload) => {
    const created = await exportApi.create(payload);
    setShowCreateModal(false);
    await loadVouchers();
    notify('Đã tạo phiếu xuất nháp.');
    return created;
  };

  const handleVoucherAction = (action) => {
    if (action === 'cancel' || action === 'confirm') setConfirmAction(action);
  };

  const executeAction = async () => {
    try {
      if (confirmAction === 'cancel') {
        await exportApi.cancel(selectedVoucher.id);
        notify('Đã hủy phiếu xuất.');
      } else if (confirmAction === 'confirm') {
        await exportApi.complete(selectedVoucher.id);
        notify('Đã xác nhận xuất kho.');
      }
      setConfirmAction(null);
      setSelectedVoucher(null);
      await loadVouchers();
    } catch (e) {
      notify(e?.message || 'Thao tác thất bại.', 'error');
    }
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
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            style={{ ...s.prodInput, width: '220px', flex: 'none' }}
          >
            <option value="">Tất cả loại xuất</option>
            {EXPORT_TYPES.map(t => (
              <option key={t.value} value={t.value}>{t.label}</option>
            ))}
          </select>
          <span style={{ fontSize: '14px', color: '#6b7280' }}>{filteredVouchers.length} kết quả</span>
        </div>
        <table style={s.table}>
          <thead>
            <tr>
              <th style={s.th}>MÃ PHIẾU</th>
              <th style={s.th}>ĐỐI TÁC</th>
              <th style={s.th}>LOẠI XUẤT</th>
              <th style={s.th}>NGÀY TẠO</th>
              <th style={s.th}>TỔNG SL</th>
              <th style={s.th}>TRẠNG THÁI</th>
              <th style={s.th}></th>
            </tr>
          </thead>
          <tbody>
            {loadingList ? (
              <tr><td colSpan="7" style={s.emptyTd}>Đang tải dữ liệu...</td></tr>
            ) : filteredVouchers.length === 0 ? (
              <tr><td colSpan="7" style={s.emptyTd}>Không tìm thấy phiếu xuất nào phù hợp.</td></tr>
            ) : (
              filteredVouchers.map((row) => (
                <tr key={row.id}>
                  <td style={s.td}><span style={s.codeText}>{row.code || row.id}</span></td>
                  <td style={s.td}>{row.partner || '—'}</td>
                  <td style={s.td}>
                    {row.exportType ? (
                      <span style={{
                        backgroundColor: row.exportType === 'SALE' ? '#eef2ff' : '#fee2e2',
                        color: row.exportType === 'SALE' ? '#3730a3' : '#991b1b',
                        padding: '4px 8px', borderRadius: '4px',
                        fontSize: '12px', fontWeight: '500'
                      }}>
                        {getExportTypeLabel(row.exportType)}
                      </span>
                    ) : '—'}
                  </td>
                  <td style={s.td}>{row.createdAt ? new Date(row.createdAt).toLocaleString('vi-VN') : (row.date || '—')}</td>
                  <td style={s.td}>{row.totalQuantity ?? row.qty ?? 0}</td>
                  <td style={s.td}><span style={getVoucherStatusStyle(row.status)}>{getVoucherStatusLabel(row.status)}</span></td>
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

      {confirmAction && (
        <div style={{ ...s.modalOverlay, zIndex: 100 }}>
          <div style={s.confirmBox}>
            <h3 style={s.confirmTitle}>
              {confirmAction === 'confirm' ? 'Xác nhận xuất kho' : 'Hủy phiếu xuất'}
            </h3>
            <p style={s.confirmText}>
              {confirmAction === 'confirm'
                ? <>Bạn có chắc chắn muốn hoàn tất phiếu xuất <strong>{selectedVoucher?.code || selectedVoucher?.id}</strong>? Thao tác này sẽ làm thay đổi tồn kho.</>
                : <>Bạn có chắc muốn hủy phiếu <strong>{selectedVoucher?.code || selectedVoucher?.id}</strong>?</>}
            </p>
            <div style={s.confirmActions}>
              <button onClick={() => setConfirmAction(null)} style={{ padding: '10px 24px', borderRadius: '8px', border: '1px solid #d1d5db', background: '#fff', cursor: 'pointer', fontWeight: '500' }}>Không</button>
              <button
                onClick={executeAction}
                style={{
                  padding: '10px 24px', borderRadius: '8px', border: 'none',
                  backgroundColor: confirmAction === 'confirm' ? '#2563eb' : '#e11d48',
                  color: '#fff', cursor: 'pointer', fontWeight: '500'
                }}
              >
                Đồng ý
              </button>
            </div>
          </div>
        </div>
      )}
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
  const [draft, setDraft] = useState({ categoryId: '', supplierId: '', status: '' })
  const [categories, setCategories] = useState([])
  const [units, setUnits] = useState([])
  const [suppliers, setSuppliers] = useState([])
  const [supplierLoading, setSupplierLoading] = useState(canManage)
  const [supplierError, setSupplierError] = useState('')
  const [dialog, setDialog] = useState(null)
  const [appliedFilters, setAppliedFilters] = useState({ search: '', categoryId: '', supplierId: '', status: '' })
  const [uiPage, setUiPage] = useState(0);
  const [hoveredBtn, setHoveredBtn] = useState(null);

  const list = usePagedResource(productApi.list, { filters: appliedFilters })
  const { notify } = useToast()

  useEffect(() => {
    let active = true
    Promise.all([categoryApi.list({ page: 0, size: 100, sort: 'name,asc' }), unitApi.list({ page: 0, size: 100, sort: 'name,asc' })])
      .then(([categoryPage, unitPage]) => { if (active) { setCategories(categoryPage?.content || []); setUnits(unitPage?.content || []) } })
      .catch((error) => { if (active) notify(error.message, 'error') })
    if (canManage) supplierApi.list({ page: 0, size: 100, sort: 'name,asc' })
      .then((supplierPage) => { if (active) setSuppliers(supplierPage?.content || []) })
      .catch((error) => { if (active) { setSupplierError(error.message || 'Không tải được nhà cung cấp.'); notify(error.message, 'error') } })
      .finally(() => { if (active) setSupplierLoading(false) })
    return () => { active = false }
  }, [])

  useEffect(() => {
    const timer = setTimeout(() => {
      list.beginChange();
      list.setPage(0);
      setUiPage(0);
      setAppliedFilters({ search: query.trim(), categoryId: draft.categoryId, supplierId: draft.supplierId, status: draft.status });
    }, 200); 
    return () => clearTimeout(timer);
  }, [query, draft.categoryId, draft.supplierId, draft.status]);

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

  const displayData = list.result || { content: [], number: 0, totalPages: 1, totalElements: 0 };
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
            canManage && <div style={{ ...s.prodInputGroup, flex: 'none', width: '220px' }}>
              <label style={s.prodLabel}>Nhà cung cấp</label>
              <select value={draft.supplierId} disabled={supplierLoading || Boolean(supplierError)} onChange={(e) => setDraft(v => ({ ...v, supplierId: e.target.value }))} style={s.prodInput}>
                <option value="">Tất cả nhà cung cấp</option>
                {suppliers.map(item => <option key={item.id} value={item.id}>{item.code} · {item.name}{item.status === 'INACTIVE' ? ' (Ngừng)' : ''}</option>)}
              </select>
              {supplierLoading && <span style={{ fontSize: '12px', color: '#6b7280' }}>Đang tải...</span>}
              {supplierError && <span style={{ fontSize: '12px', color: '#dc2626' }}>{supplierError}</span>}
            </div>
          )}
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
        <div style={{ overflowX: 'auto', opacity: list.loading ? 0.6 : 1 }}>
          <table style={s.table}>
            <thead><tr><th style={s.th}>SKU</th><th style={s.th}>Sản phẩm</th><th style={s.th}>Danh mục</th><th style={s.th}>Đơn vị</th>{currentUser?.role !== 'DEALER' && <th style={s.th}>Nhà cung cấp</th>}{showStock && <th style={s.th}>Tồn kho</th>}<th style={s.th}>Trạng thái</th><th style={s.th}>Thao tác</th></tr></thead>
            <tbody>
              {!displayData?.content || displayData.content.length === 0 ? (
                <tr><td colSpan={currentUser?.role === 'DEALER' ? 6 : (showStock ? 8 : 7)} style={s.emptyTd}>{list.loading ? 'Đang tải dữ liệu...' : 'Không tìm thấy sản phẩm nào phù hợp.'}</td></tr>
              ) : (
                displayData.content.map(item => (
                  <tr key={item.id}>
                    <td style={s.td}><strong>{item.sku}</strong></td><td style={s.td}>{item.name}</td><td style={s.td}>{item.categoryName}</td><td style={s.td}>{item.unitSymbol}</td>
                    {currentUser?.role !== 'DEALER' && <td style={{ ...s.td, minWidth: '210px' }}><SupplierBadges suppliers={item.suppliers} /></td>}
                    {showStock && <td style={s.td}><span style={{ color: '#2563eb', fontWeight: 'bold' }}>{item.quantityOnHand ?? '—'}</span></td>}
                    <td style={s.td}><StatusBadge status={item.status} labels={{ ACTIVE: 'Hoạt động', INACTIVE: 'Ngừng' }} /></td>
                    <td style={s.td}><div style={{ display: 'flex', gap: '12px' }}><button style={s.btnAction} onClick={() => openDetail(item)}>Chi tiết</button>{canManage && <button style={{ background: 'none', border: 'none', color: item.status === 'ACTIVE' ? '#dc2626' : '#16a34a', cursor: 'pointer', fontWeight: '500', padding: 0 }} onClick={() => setDialog({ type: 'status', entity: item })}>{item.status === 'ACTIVE' ? 'Ngừng' : 'Kích hoạt'}</button>}</div></td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <div style={s.pagination}>
          <span style={{ fontSize: '14px', color: '#6b7280' }}>{list.loading ? 'Đang tải...' : `Tổng cộng ${totalElements} sản phẩm - Trang ${currentPage}/${totalPages}`}</span>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button disabled={list.loading || currentPage <= 1} onClick={() => handlePageChange(uiPage - 1)} style={(list.loading || currentPage <= 1) ? s.btnPageDisabled : { ...s.btnPage, backgroundColor: hoveredBtn === 'prev' ? '#f3f4f6' : '#fff' }} onMouseEnter={() => setHoveredBtn('prev')} onMouseLeave={() => setHoveredBtn(null)}>Trước</button>
            <button disabled={list.loading || currentPage >= totalPages} onClick={() => handlePageChange(uiPage + 1)} style={(list.loading || currentPage >= totalPages) ? s.btnPageDisabled : { ...s.btnPage, backgroundColor: hoveredBtn === 'next' ? '#f3f4f6' : '#fff' }} onMouseEnter={() => setHoveredBtn('next')} onMouseLeave={() => setHoveredBtn(null)}>Sau</button>
          </div>
        </div>
      </div>

      {dialog?.type === 'form' && (
        <div style={s.modalOverlay}><div style={{ ...s.modalContent, maxWidth: '700px' }}><div style={s.modalHeader}><h3 style={{ margin: 0, fontSize: '18px', fontWeight: 'bold' }}>Thêm sản phẩm</h3><button onClick={() => setDialog(null)} style={{ background: 'none', border: 'none', fontSize: '24px', cursor: 'pointer', color: '#6b7280' }}>×</button></div><ProductForm categories={categories} units={units} suppliers={suppliers} supplierLoading={supplierLoading} supplierError={supplierError} onClose={() => setDialog(null)} onSaved={list.load} /></div></div>
      )}
      {dialog?.type === 'detail' && <ProductDetailModal product={dialog.entity} showStock={showStock} canManage={canManage} categories={categories} units={units} suppliers={suppliers} supplierLoading={supplierLoading} supplierError={supplierError} onClose={() => setDialog(null)} onUpdated={(updated) => { setDialog(value => ({ ...value, entity: updated })); void list.load(); }} />}
      {dialog?.type === 'status' && <ConfirmDialog dangerous={dialog.entity.status === 'ACTIVE'} message={`Bạn có chắc muốn ${dialog.entity.status === 'ACTIVE' ? 'ngừng hoạt động' : 'kích hoạt'} sản phẩm ${dialog.entity.sku}?`} onClose={() => setDialog(null)} onConfirm={() => changeStatus(dialog.entity)} />}
    </div>
  )
}
