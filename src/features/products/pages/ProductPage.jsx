import { useEffect, useMemo, useState } from 'react'
import { useAuth } from '../../auth/authContext.js'
import { categoryApi } from '../../categories/api/categoryApi.js'
import { unitApi } from '../../units/api/unitApi.js'
import usePagedResource from '../../../shared/hooks/usePagedResource.js'
import { ConfirmDialog, Modal, StatusBadge, useToast } from '../../../shared/ui/index.js'
import { productApi } from '../api/productApi.js'
import { canManageProducts, canViewInternalStock } from '../productPermissions.js'

// ==========================================
// CSS GỘP TRONG CODE
// ==========================================
const s = {
  page: { padding: '24px', backgroundColor: '#f9fafb', minHeight: '100vh', fontFamily: 'sans-serif', display: 'flex', flexDirection: 'column', gap: '24px' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' },
  title: { fontSize: '24px', fontWeight: 'bold', color: '#111827', margin: 0 },
  subtitle: { fontSize: '14px', color: '#6b7280', margin: '4px 0 0 0' },
  btnPrimary: { backgroundColor: '#2563eb', color: '#fff', padding: '10px 16px', borderRadius: '8px', border: 'none', cursor: 'pointer', fontWeight: '500', fontSize: '14px', boxShadow: '0 1px 2px 0 rgba(0,0,0,0.05)' },
  card: { backgroundColor: '#fff', borderRadius: '12px', border: '1px solid #e5e7eb', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', position: 'relative' },
  filterRow: { padding: '16px', borderBottom: '1px solid #e5e7eb', display: 'flex', alignItems: 'center', gap: '16px' },
  searchWrapper: { position: 'relative', display: 'flex', alignItems: 'center' },
  searchIcon: { position: 'absolute', left: '12px', color: '#9ca3af' },
  searchInput: { padding: '10px 12px 10px 36px', borderRadius: '8px', border: '1px solid #d1d5db', width: '300px', fontSize: '14px', outline: 'none' },
  resultText: { fontSize: '14px', color: '#6b7280' },
  table: { width: '100%', borderCollapse: 'collapse', textAlign: 'left' },
  th: { padding: '16px', backgroundColor: '#f9fafb', borderBottom: '1px solid #e5e7eb', fontSize: '12px', fontWeight: '600', color: '#6b7280', textTransform: 'uppercase' },
  td: { padding: '16px', borderBottom: '1px solid #e5e7eb', fontSize: '14px', color: '#374151' },
  emptyTd: { padding: '60px 16px', textAlign: 'center', color: '#6b7280', fontSize: '14px' },
  codeText: { color: '#2563eb', fontWeight: 'bold' },
  badgeSuccess: { backgroundColor: '#ecfdf5', color: '#065f46', padding: '4px 8px', borderRadius: '4px', fontSize: '12px', fontWeight: '500' },
  badgePending: { backgroundColor: '#fef3c7', color: '#92400e', padding: '4px 8px', borderRadius: '4px', fontSize: '12px', fontWeight: '500' },
  btnDetail: { backgroundColor: '#fff', border: '1px solid #d1d5db', padding: '6px 12px', borderRadius: '6px', cursor: 'pointer', fontSize: '13px', fontWeight: '500' },
  statusNormal: { color: '#059669', fontSize: '13px', fontWeight: '500' },
  statusLow: { color: '#dc2626', fontSize: '13px', fontWeight: '500' },
  qtyPositive: { color: '#059669', fontWeight: 'bold' },
  pagination: { padding: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid #e5e7eb' },
  btnPage: { backgroundColor: '#fff', border: '1px solid #d1d5db', padding: '6px 12px', borderRadius: '6px', cursor: 'not-allowed', color: '#9ca3af', fontSize: '13px' },

  grid2Col: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' },
  scannerBox: { backgroundColor: '#0f172a', borderRadius: '12px', height: '240px', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', color: '#fff', marginBottom: '16px' },
  scanIconBox: { width: '48px', height: '48px', border: '2px dashed #fff', borderRadius: '8px', display: 'flex', justifyContent: 'center', alignItems: 'center', marginBottom: '16px' },
  inputGroup: { display: 'flex', gap: '12px' },
  input: { flex: 1, padding: '12px', borderRadius: '8px', border: '1px solid #d1d5db', fontSize: '14px', outline: 'none' },

  prodCard: { backgroundColor: '#fff', borderRadius: '12px', border: '1px solid #e5e7eb', boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)', padding: '20px' },
  prodInputGroup: { display: 'flex', flexDirection: 'column', gap: '6px', flex: 1, minWidth: '200px' },
  prodLabel: { fontSize: '14px', fontWeight: '500', color: '#374151' },
  prodInput: { padding: '10px 12px', borderRadius: '8px', border: '1px solid #d1d5db', width: '100%', fontSize: '14px', boxSizing: 'border-box', outline: 'none' },
  
  modalOverlay: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 50, padding: '16px' },
  modalContent: { backgroundColor: '#fff', borderRadius: '12px', width: '100%', maxWidth: '600px', maxHeight: '90vh', display: 'flex', flexDirection: 'column', overflow: 'hidden', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)' },
  modalHeader: { padding: '20px', borderBottom: '1px solid #e5e7eb', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0 },
  modalBody: { padding: '24px', overflowY: 'auto', flex: 1 },
  modalFooter: { padding: '16px 20px', backgroundColor: '#f9fafb', borderTop: '1px solid #e5e7eb', display: 'flex', justifyContent: 'flex-end', gap: '12px', flexShrink: 0 },
  
  toastSuccess: { position: 'fixed', top: '24px', right: '24px', zIndex: 9999, backgroundColor: '#ecfdf5', border: '1px solid #10b981', color: '#065f46', padding: '12px 20px', borderRadius: '8px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)', display: 'flex', alignItems: 'center', gap: '12px', fontWeight: '500', fontSize: '14px' }
};

const SearchIcon = () => (
  <svg style={s.searchIcon} width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line>
  </svg>
);

const SAMPLE_PRODUCTS = [
  { id: 1, name: 'Sữa tươi tiệt trùng 1L', sku: 'SP-001' },
  { id: 2, name: 'Nước khoáng 500ml', sku: 'SP-014' },
  { id: 3, name: 'Mì ăn liền vị bò', sku: 'SP-023' },
  { id: 4, name: 'Nước rửa chén 750ml', sku: 'SP-031' },
  { id: 5, name: 'Giấy vệ sinh 10 cuộn', sku: 'SP-045' },
];

const getStorage = (key, defaultValue) => {
  try {
    const saved = localStorage.getItem(key);
    return saved ? JSON.parse(saved) : defaultValue;
  } catch { return defaultValue; }
};
const setStorage = (key, data) => {
  try { localStorage.setItem(key, JSON.stringify(data)); } catch {}
};

// ==========================================
// CÁC COMPONENT MODAL
// ==========================================

function CreateImportModal({ onClose, onSave, editData }) {
  const [isSaving, setIsSaving] = useState(false);
  const [quantities, setQuantities] = useState(editData ? editData.quantities : {});

  const handleQtyChange = (id, val) => {
    setQuantities(prev => ({ ...prev, [id]: val }));
  };

  const handleSave = () => {
    setIsSaving(true);
    setTimeout(() => {
      setIsSaving(false);
      const totalQty = Object.values(quantities).reduce((sum, val) => sum + (Number(val) || 0), 0);
      onSave('Nháp', totalQty, quantities); 
    }, 500);
  };

  return (
    <div style={s.modalOverlay}>
      <div style={{ ...s.modalContent, maxWidth: '650px' }}>
        <div style={s.modalHeader}>
          <h2 style={{ margin: 0, fontSize: '18px', fontWeight: 'bold' }}>{editData ? 'Sửa phiếu nhập nháp' : 'Tạo phiếu nhập nháp'}</h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: '24px', cursor: 'pointer' }}>×</button>
        </div>
        <div style={s.modalBody}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div style={s.prodInputGroup}>
              <label style={s.prodLabel}>Nhà cung cấp *</label>
              <select style={s.prodInput}>
                <option>Nước giải khát Việt Xanh</option>
                <option>Công ty Thực phẩm An Khang</option>
              </select>
            </div>
            <div style={{ border: '1px solid #111827', borderRadius: '8px', overflow: 'hidden' }}>
              <table style={s.table}>
                <thead><tr><th style={{ ...s.th, color: '#111827' }}>Sản phẩm</th><th style={{ ...s.th, color: '#111827', textAlign: 'right' }}>Số lượng nguyên dương</th></tr></thead>
                <tbody>
                  {SAMPLE_PRODUCTS.map(p => (
                    <tr key={p.id}>
                      <td style={s.td}><strong>{p.name}</strong><br/><span style={{ fontSize: '12px', color: '#6b7280' }}>{p.sku}</span></td>
                      <td style={{ ...s.td, textAlign: 'right' }}>
                        <input 
                          type="number" min="0" placeholder="0" 
                          value={quantities[p.id] || ''}
                          onChange={(e) => handleQtyChange(p.id, e.target.value)}
                          style={{ ...s.prodInput, width: '80px', textAlign: 'right', backgroundColor: '#f9fafb' }} 
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
        <div style={s.modalFooter}>
          <button onClick={onClose} style={{ padding: '10px 16px', borderRadius: '8px', border: '1px solid #d1d5db', background: '#fff', cursor: 'pointer' }}>Hủy</button>
          <button onClick={handleSave} disabled={isSaving} style={{ ...s.btnPrimary, backgroundColor: '#8b5cf6', opacity: isSaving ? 0.7 : 1 }}>
            {isSaving ? 'Đang lưu...' : (editData ? 'Cập nhật nháp' : 'Lưu nháp')}
          </button>
        </div>
      </div>
    </div>
  );
}

function CreateExportModal({ onClose, onSave, editData }) {
  const [isSaving, setIsSaving] = useState(false);
  const [quantities, setQuantities] = useState(editData ? editData.quantities : {});

  const handleQtyChange = (id, val) => {
    setQuantities(prev => ({ ...prev, [id]: val }));
  };

  const handleSave = () => {
    setIsSaving(true);
    setTimeout(() => {
      setIsSaving(false);
      const totalQty = Object.values(quantities).reduce((sum, val) => sum + (Number(val) || 0), 0);
      onSave('Nháp', totalQty, quantities);
    }, 500);
  };

  return (
    <div style={s.modalOverlay}>
      <div style={{ ...s.modalContent, maxWidth: '650px' }}>
        <div style={s.modalHeader}>
          <h2 style={{ margin: 0, fontSize: '18px', fontWeight: 'bold' }}>{editData ? 'Sửa phiếu xuất nháp' : 'Tạo phiếu xuất từ yêu cầu đã duyệt'}</h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: '24px', cursor: 'pointer' }}>×</button>
        </div>
        <div style={s.modalBody}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div style={s.prodInputGroup}>
              <label style={s.prodLabel}>Yêu cầu đã duyệt *</label>
              <select style={s.prodInput}>
                <option value="" disabled>Chọn yêu cầu đã duyệt...</option>
                <option>YC-DEMO-001 - Công ty An Khang</option>
              </select>
            </div>
            <div style={{ border: '1px solid #111827', borderRadius: '8px', overflow: 'hidden' }}>
              <table style={s.table}>
                <thead><tr><th style={{ ...s.th, color: '#111827' }}>Sản phẩm</th><th style={{ ...s.th, color: '#111827', textAlign: 'right' }}>Số lượng nguyên dương</th></tr></thead>
                <tbody>
                  {SAMPLE_PRODUCTS.map(p => (
                    <tr key={p.id}>
                      <td style={s.td}><strong>{p.name}</strong><br/><span style={{ fontSize: '12px', color: '#6b7280' }}>{p.sku}</span></td>
                      <td style={{ ...s.td, textAlign: 'right' }}>
                        <input 
                          type="number" min="0" placeholder="0" 
                          value={quantities[p.id] || ''}
                          onChange={(e) => handleQtyChange(p.id, e.target.value)}
                          style={{ ...s.prodInput, width: '80px', textAlign: 'right', backgroundColor: '#f9fafb' }} 
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
        <div style={s.modalFooter}>
          <button onClick={onClose} style={{ padding: '10px 16px', borderRadius: '8px', border: '1px solid #d1d5db', background: '#fff', cursor: 'pointer' }}>Hủy</button>
          <button onClick={handleSave} disabled={isSaving} style={{ ...s.btnPrimary, backgroundColor: '#8b5cf6', opacity: isSaving ? 0.7 : 1 }}>
            {isSaving ? 'Đang lưu...' : (editData ? 'Cập nhật nháp' : 'Lưu nháp')}
          </button>
        </div>
      </div>
    </div>
  );
}

function VoucherDetailModal({ voucher, onClose, onAction }) {
  const isDraft = voucher.status === 'Nháp';
  return (
    <div style={s.modalOverlay}>
      <div style={{ ...s.modalContent, maxWidth: '600px' }}>
        <div style={s.modalHeader}>
          <h2 style={{ margin: 0, fontSize: '18px', fontWeight: 'bold' }}>Chi tiết {voucher.id}</h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: '24px', cursor: 'pointer' }}>×</button>
        </div>
        <div style={s.modalBody}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={isDraft ? s.badgePending : s.badgeSuccess}>{voucher.status}</span>
              <span style={{ fontSize: '16px', fontWeight: 'bold' }}>Tổng: {voucher.qty}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #e5e7eb', paddingBottom: '12px' }}>
              <span style={{ fontSize: '14px', color: '#374151' }}>{voucher.productName}</span>
              <strong style={{ fontSize: '14px' }}>{voucher.qty}</strong>
            </div>
          </div>
        </div>
        <div style={s.modalFooter}>
          {isDraft && (
            <>
              <button onClick={() => onAction('Hủy phiếu')} style={{ ...s.btnPrimary, backgroundColor: '#e11d48' }}>Hủy phiếu</button>
              <button onClick={() => onAction('Sửa nháp')} style={{ padding: '10px 16px', borderRadius: '8px', border: '1px solid #d1d5db', background: '#fff', cursor: 'pointer' }}>Sửa nháp</button>
              <button onClick={() => onAction('Xác nhận xuất')} style={{ ...s.btnPrimary, backgroundColor: '#2563eb' }}>Xác nhận xuất</button>
            </>
          )}
          {!isDraft && (
            <button onClick={onClose} style={{ padding: '10px 16px', borderRadius: '8px', border: '1px solid #d1d5db', background: '#fff', cursor: 'pointer' }}>Đóng</button>
          )}
        </div>
      </div>
    </div>
  );
}

function SuccessToast({ message, onClose }) {
  useEffect(() => {
    const timer = setTimeout(onClose, 3000);
    return () => clearTimeout(timer);
  }, [onClose]);
  return (
    <div style={s.toastSuccess}>
      <span style={{ fontSize: '20px' }}>✅</span>
      <span>{message}</span>
    </div>
  );
}

// ==========================================
// PHẦN 1: IMPORT & EXPORT PAGE
// ==========================================

export function ImportPage() {
  const { notify } = useToast();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedVoucher, setSelectedVoucher] = useState(null);
  const [editingVoucher, setEditingVoucher] = useState(null);
  const [successMessage, setSuccessMessage] = useState('');
  
  // Thêm state tìm kiếm
  const [searchQuery, setSearchQuery] = useState('');

  const [vouchers, setVouchers] = useState(() => getStorage('import_vouchers', []));

  useEffect(() => {
    setStorage('import_vouchers', vouchers);
  }, [vouchers]);

  // Lọc dữ liệu theo mã phiếu hoặc đối tác
  const filteredVouchers = vouchers.filter(v => 
    v.id.toLowerCase().includes(searchQuery.toLowerCase()) || 
    v.partner.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSaveNew = (status, qty, quantities) => {
    if (editingVoucher) {
      setVouchers(vouchers.map(v => v.id === editingVoucher.id ? { ...v, qty, quantities } : v));
      setSuccessMessage('Đã cập nhật phiếu nháp thành công!');
    } else {
      const newVoucher = {
        id: `PN-${Date.now().toString().slice(-6)}`,
        partner: 'Nước giải khát Việt Xanh',
        date: new Date().toLocaleString('vi-VN'),
        qty: qty > 0 ? qty : 0,
        status: status,
        productName: 'Sản phẩm mới nhập',
        quantities: quantities 
      };
      setVouchers([newVoucher, ...vouchers]);
      setSuccessMessage('Đã tạo phiếu nhập thành công!');
    }
    setShowCreateModal(false);
    setEditingVoucher(null);
    setTimeout(() => setSuccessMessage(''), 3000);
  };

  const handleVoucherAction = (action) => {
    if (action === 'Hủy phiếu') {
      setVouchers(vouchers.filter(v => v.id !== selectedVoucher.id));
      notify('Đã hủy phiếu.', 'success');
    } else if (action === 'Xác nhận xuất') {
      setVouchers(vouchers.map(v => v.id === selectedVoucher.id ? { ...v, status: 'Hoàn tất' } : v));
      notify('Đã xác nhận xuất kho.', 'success');
    } else if (action === 'Sửa nháp') {
      setEditingVoucher(selectedVoucher);
      setShowCreateModal(true);
    }
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
          <div style={s.searchWrapper}>
            <SearchIcon />
            <input 
              type="text" 
              placeholder="Tìm theo mã phiếu hoặc đối tác..." 
              style={s.searchInput} 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <span style={s.resultText}>{filteredVouchers.length} kết quả</span>
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
                  <td style={s.td}><button style={s.btnDetail} onClick={() => setSelectedVoucher(row)}>Chi tiết</button></td>
                </tr>
              ))
            )}
          </tbody>
        </table>
        <div style={s.pagination}><span style={{ fontSize: '14px', color: '#6b7280' }}>Trang 1/1</span><div style={{ display: 'flex', gap: '8px' }}><button style={s.btnPage}>Trước</button><button style={s.btnPage}>Sau</button></div></div>
      </div>
      
      {showCreateModal && <CreateImportModal onClose={() => { setShowCreateModal(false); setEditingVoucher(null); }} onSave={handleSaveNew} editData={editingVoucher} />}
      {selectedVoucher && <VoucherDetailModal voucher={selectedVoucher} onClose={() => setSelectedVoucher(null)} onAction={handleVoucherAction} />}
      {successMessage && <SuccessToast message={successMessage} onClose={() => setSuccessMessage('')} />}
    </div>
  );
}

export function ExportPage() {
  const { notify } = useToast();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedVoucher, setSelectedVoucher] = useState(null);
  const [editingVoucher, setEditingVoucher] = useState(null);
  const [successMessage, setSuccessMessage] = useState('');
  
  // Thêm state tìm kiếm
  const [searchQuery, setSearchQuery] = useState('');

  const [vouchers, setVouchers] = useState(() => getStorage('export_vouchers', []));

  useEffect(() => {
    setStorage('export_vouchers', vouchers);
  }, [vouchers]);

  // Lọc dữ liệu theo mã phiếu hoặc đối tác
  const filteredVouchers = vouchers.filter(v => 
    v.id.toLowerCase().includes(searchQuery.toLowerCase()) || 
    v.partner.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSaveNew = (status, qty, quantities) => {
    if (editingVoucher) {
      setVouchers(vouchers.map(v => v.id === editingVoucher.id ? { ...v, qty, quantities } : v));
      setSuccessMessage('Đã cập nhật phiếu nháp thành công!');
    } else {
      const newVoucher = {
        id: `PX-${Date.now().toString().slice(-6)}`,
        partner: 'Đại lý Hùng Thịnh',
        date: new Date().toLocaleString('vi-VN'),
        qty: qty > 0 ? qty : 0,
        status: status,
        productName: 'Sản phẩm xuất kho',
        quantities: quantities
      };
      setVouchers([newVoucher, ...vouchers]);
      setSuccessMessage('Đã tạo phiếu xuất thành công!');
    }
    setShowCreateModal(false);
    setEditingVoucher(null);
    setTimeout(() => setSuccessMessage(''), 3000);
  };

  const handleVoucherAction = (action) => {
    if (action === 'Hủy phiếu') {
      setVouchers(vouchers.filter(v => v.id !== selectedVoucher.id));
      notify('Đã hủy phiếu xuất.', 'success');
    } else if (action === 'Xác nhận xuất') {
      setVouchers(vouchers.map(v => v.id === selectedVoucher.id ? { ...v, status: 'Hoàn tất' } : v));
      notify('Đã xác nhận xuất kho.', 'success');
    } else if (action === 'Sửa nháp') {
      setEditingVoucher(selectedVoucher);
      setShowCreateModal(true);
    }
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
          <div style={s.searchWrapper}>
            <SearchIcon />
            <input 
              type="text" 
              placeholder="Tìm theo mã phiếu hoặc đối tác..." 
              style={s.searchInput} 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <span style={s.resultText}>{filteredVouchers.length} kết quả</span>
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
                  <td style={s.td}><button style={s.btnDetail} onClick={() => setSelectedVoucher(row)}>Chi tiết</button></td>
                </tr>
              ))
            )}
          </tbody>
        </table>
        <div style={s.pagination}><span style={{ fontSize: '14px', color: '#6b7280' }}>Trang 1/1</span><div style={{ display: 'flex', gap: '8px' }}><button style={s.btnPage}>Trước</button><button style={s.btnPage}>Sau</button></div></div>
      </div>

      {showCreateModal && <CreateExportModal onClose={() => { setShowCreateModal(false); setEditingVoucher(null); }} onSave={handleSaveNew} editData={editingVoucher} />}
      {selectedVoucher && <VoucherDetailModal voucher={selectedVoucher} onClose={() => setSelectedVoucher(null)} onAction={handleVoucherAction} />}
      {successMessage && <SuccessToast message={successMessage} onClose={() => setSuccessMessage('')} />}
    </div>
  );
}

export function InventoryPage() {
  const stockData = [
    { sku: 'SP-001', name: 'Sữa tươi tiệt trùng 1L', current: 1248, min: 200, max: 1800, status: 'Bình thường', date: '22:24 21/10/26' },
    { sku: 'SP-014', name: 'Nước khoáng 500ml', current: 824, min: 150, max: 1400, status: 'Bình thường', date: '22:24 21/10/26' },
    { sku: 'SP-023', name: 'Mì ăn liền vị bò', current: 86, min: 120, max: 900, status: 'Dưới mức', date: '22:24 21/10/26' },
    { sku: 'SP-031', name: 'Nước rửa chén 750ml', current: 452, min: 100, max: 800, status: 'Bình thường', date: '22:24 21/10/26' },
    { sku: 'SP-045', name: 'Giấy vệ sinh 10 cuộn', current: 32, min: 80, max: 600, status: 'Dưới mức', date: '22:24 21/10/26' },
  ];
  const historyData = [
    { time: '22:24 17/10/26', product: 'Mì ăn liền vị bò', type: 'Nhập kho', qty: '+120', ref: 'PN-DEMO-001' },
    { time: '22:24 17/10/26', product: 'Sữa tươi tiệt trùng 1L', type: 'Nhập kho', qty: '+240', ref: 'PN-DEMO-001' },
  ];

  return (
    <div style={s.page}>
      <div style={s.header}><div><h1 style={s.title}>Tồn kho</h1><p style={s.subtitle}>Số lượng chỉ thay đổi qua phiếu xác nhận hoặc điều chỉnh kiểm kê được duyệt</p></div></div>
      <div style={s.card}>
        <div style={s.filterRow}><div style={s.searchWrapper}><SearchIcon /><input type="text" placeholder="Tìm kiếm..." style={s.searchInput} /></div><span style={s.resultText}>5 kết quả</span></div>
        <table style={s.table}>
          <thead><tr><th style={s.th}>SKU</th><th style={s.th}>SẢN PHẨM</th><th style={s.th}>HIỆN CÓ</th><th style={s.th}>TỐI THIỂU</th><th style={s.th}>TỐI ĐA</th><th style={s.th}>TÌNH TRẠNG</th><th style={s.th}>CẬP NHẬT</th></tr></thead>
          <tbody>
            {stockData.map((row, idx) => (
              <tr key={idx}><td style={s.td}>{row.sku}</td><td style={s.td}>{row.name}</td><td style={s.td}>{row.current}</td><td style={s.td}>{row.min}</td><td style={s.td}>{row.max}</td><td style={s.td}><span style={row.status === 'Bình thường' ? s.statusNormal : s.statusLow}>{row.status}</span></td><td style={s.td}>{row.date}</td></tr>
            ))}
          </tbody>
        </table>
        <div style={s.pagination}><span style={{ fontSize: '14px', color: '#6b7280' }}>Trang 1/1</span><div style={{ display: 'flex', gap: '8px' }}><button style={s.btnPage}>Trước</button><button style={s.btnPage}>Sau</button></div></div>
      </div>
      <div style={{ ...s.card, paddingTop: '20px' }}>
        <div style={{ padding: '0 16px', fontSize: '16px', fontWeight: 'bold', color: '#111827' }}>Lịch sử biến động tồn</div>
        <div style={s.filterRow}><div style={s.searchWrapper}><SearchIcon /><input type="text" placeholder="Tìm kiếm..." style={s.searchInput} /></div><span style={s.resultText}>2 kết quả</span></div>
        <table style={s.table}>
          <thead><tr><th style={s.th}>THỜI GIAN</th><th style={s.th}>SẢN PHẨM</th><th style={s.th}>LOẠI</th><th style={s.th}>SỐ LƯỢNG</th><th style={s.th}>THAM CHIẾU</th></tr></thead>
          <tbody>
            {historyData.map((row, idx) => (
              <tr key={idx}><td style={s.td}>{row.time}</td><td style={s.td}>{row.product}</td><td style={s.td}>{row.type}</td><td style={s.td}><span style={s.qtyPositive}>{row.qty}</span></td><td style={s.td}>{row.ref}</td></tr>
            ))}
          </tbody>
        </table>
        <div style={s.pagination}><span style={{ fontSize: '14px', color: '#6b7280' }}>Trang 1/1</span><div style={{ display: 'flex', gap: '8px' }}><button style={s.btnPage}>Trước</button><button style={s.btnPage}>Sau</button></div></div>
      </div>
    </div>
  );
}

export function AuditPage() {
  return (
    <div style={s.page}>
      <div style={s.header}><div><h1 style={s.title}>Quản lý kiểm kê</h1><p style={s.subtitle}>Điều chỉnh tồn chỉ thực hiện sau phê duyệt của Quản lý kho</p></div></div>
      <div style={s.card}>
        <div style={s.filterRow}><div style={s.searchWrapper}><SearchIcon /><input type="text" placeholder="Tìm kiếm..." style={s.searchInput} /></div><span style={s.resultText}>0 kết quả</span></div>
        <table style={s.table}>
          <thead><tr><th style={s.th}>MÃ PHIÊN</th><th style={s.th}>NGÀY TẠO</th><th style={s.th}>SẢN PHẨM</th><th style={s.th}>TRẠNG THÁI</th></tr></thead>
          <tbody><tr><td colSpan="4" style={s.emptyTd}>Không tìm thấy dữ liệu phù hợp.</td></tr></tbody>
        </table>
        <div style={s.pagination}><span style={{ fontSize: '14px', color: '#6b7280' }}>Trang 1/1</span><div style={{ display: 'flex', gap: '8px' }}><button style={s.btnPage}>Trước</button><button style={s.btnPage}>Sau</button></div></div>
      </div>
    </div>
  );
}

export function QrScanPage() {
  return (
    <div style={s.page}>
      <div style={s.header}><div><h1 style={s.title}>Tra cứu QR / RFID</h1><p style={s.subtitle}>Chế độ demo nhập mã thủ công; chưa kết nối camera hoặc đầu đọc RFID</p></div></div>
      <div style={s.grid2Col}>
        <div style={{ ...s.card, padding: '24px', display: 'flex', flexDirection: 'column' }}>
          <div style={s.scannerBox}>
            <div style={s.scanIconBox}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 7V4h3"></path><path d="M20 7V4h-3"></path><path d="M4 17v3h3"></path><path d="M20 17v3h-3"></path><path d="M4 12h16"></path></svg>
            </div>
            <div style={{ fontSize: '16px', fontWeight: 'bold', marginBottom: '8px' }}>Chế độ nhập mã thủ công</div>
            <div style={{ fontSize: '13px', color: '#94a3b8', textAlign: 'center', lineHeight: '1.5', maxWidth: '80%' }}>Không giả lập camera. Hãy nhập SKU hoặc mã QR/RFID đã ánh xạ trong dữ liệu sản phẩm.</div>
          </div>
          <div style={s.inputGroup}>
            <input type="text" placeholder="Ví dụ: SP-001 hoặc 8938505974192" style={s.input} />
            <button style={s.btnPrimary}>Tra cứu</button>
          </div>
        </div>
        <div style={{ ...s.card, padding: '24px', display: 'flex', flexDirection: 'column' }}>
          <div style={{ fontSize: '16px', fontWeight: 'bold', color: '#111827', marginBottom: '24px' }}>Kết quả nhận diện</div>
          <div style={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center', color: '#6b7280', fontSize: '14px' }}>Chưa có kết quả tra cứu.</div>
        </div>
      </div>
    </div>
  );
}

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

  return (
    <form onSubmit={submit}>
      <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <div style={s.prodInputGroup}><label style={s.prodLabel}>SKU *</label><input required maxLength="60" value={form.sku} onChange={update('sku')} style={s.prodInput} /></div>
        <div style={s.prodInputGroup}><label style={s.prodLabel}>Tên sản phẩm *</label><input required maxLength="200" value={form.name} onChange={update('name')} style={s.prodInput} /></div>
        <div style={s.prodInputGroup}>
          <label style={s.prodLabel}>Danh mục *</label>
          <select required value={form.categoryId} onChange={update('categoryId')} style={s.prodInput}>
            <option value="">Chọn danh mục</option>
            {selectableCategories.map((item) => <option key={item.id} value={item.id}>{item.code} · {item.name}</option>)}
          </select>
        </div>
        <div style={s.prodInputGroup}>
          <label style={s.prodLabel}>Đơn vị chuẩn *</label>
          <select required value={form.unitId} onChange={update('unitId')} style={s.prodInput}>
            <option value="">Chọn đơn vị</option>
            {units.map((item) => <option key={item.id} value={item.id}>{item.code} · {item.name} ({item.symbol})</option>)}
          </select>
        </div>
      </div>
      <div style={s.modalFooter}>
        <button type="button" onClick={onClose} style={{ padding: '10px 16px', borderRadius: '8px', border: '1px solid #d1d5db', background: '#fff', cursor: 'pointer' }}>Hủy</button>
        <button type="submit" disabled={saving} style={s.btnPrimary}>{saving ? 'Đang lưu…' : 'Lưu sản phẩm'}</button>
      </div>
    </form>
  )
}

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

  const list = usePagedResource(productApi.list, { filters: appliedFilters })
  const { notify } = useToast()

  useEffect(() => {
    let active = true
    Promise.all([categoryApi.list({ page: 0, size: 100, sort: 'name,asc' }), unitApi.list({ page: 0, size: 100, sort: 'name,asc' })])
      .then(([categoryPage, unitPage]) => { if (active) { setCategories(categoryPage.content); setUnits(unitPage.content) } })
      .catch((error) => { if (active) notify(error.message, 'error') })
    return () => { active = false }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    const timer = setTimeout(() => {
      list.beginChange();
      list.setPage(0); 
      setAppliedFilters({ search: query.trim(), categoryId: draft.categoryId, status: draft.status });
    }, 300); 
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query, draft.categoryId, draft.status]);

  async function openDetail(item) {
    try { setDialog({ type: 'detail', entity: await productApi.get(item.id) }) }
    catch (error) { notify(error.message, 'error') }
  }
  
  async function changeStatus(item) {
    try { await productApi.changeStatus(item.id, item.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE'); notify(item.status === 'ACTIVE' ? 'Đã ngừng hoạt động sản phẩm.' : 'Đã kích hoạt sản phẩm.'); setDialog(null); await list.load() }
    catch (error) { notify(error.message, 'error') }
  }

  return (
    <div style={s.page}>
      <div style={s.header}>
        <div>
          <h1 style={s.title}>{currentUser?.role === 'DEALER' ? 'Danh mục sản phẩm' : 'Quản lý sản phẩm'}</h1>
          <p style={s.subtitle}>{currentUser?.role === 'DEALER' ? 'Danh mục sản phẩm đang hoạt động.' : 'Quản lý thông tin chuẩn; tồn kho chỉ hiển thị để tra cứu.'}</p>
        </div>
        {canManage && <button style={s.btnPrimary} onClick={() => setDialog({ type: 'form' })}>+ Thêm sản phẩm</button>}
      </div>

      <div style={s.prodCard}>
        <div style={s.filterRow}>
          <div style={s.prodInputGroup}>
            <label style={s.prodLabel}>Tìm sản phẩm</label>
            <div style={s.searchWrapper}>
              <SearchIcon />
              <input placeholder="Tìm SKU hoặc tên…" value={query} onChange={e => setQuery(e.target.value)} style={s.searchInput} />
            </div>
          </div>
          <div style={{ ...s.prodInputGroup, flex: 'none', width: '200px' }}>
            <label style={s.prodLabel}>Danh mục</label>
            <select value={draft.categoryId} onChange={(e) => setDraft(v => ({ ...v, categoryId: e.target.value }))} style={s.prodInput}>
              <option value="">Tất cả danh mục</option>
              {categories.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
            </select>
          </div>
          {currentUser?.role !== 'DEALER' && (
            <div style={{ ...s.prodInputGroup, flex: 'none', width: '200px' }}>
              <label style={s.prodLabel}>Trạng thái</label>
              <select value={draft.status} onChange={(e) => setDraft(v => ({ ...v, status: e.target.value }))} style={s.prodInput}>
                <option value="">Tất cả trạng thái</option>
                <option value="ACTIVE">Hoạt động</option>
                <option value="INACTIVE">Ngừng hoạt động</option>
              </select>
            </div>
          )}
        </div>
      </div>

      <div style={{ ...s.prodCard, padding: 0 }}>
        <div style={{ overflowX: 'auto', opacity: list.loading ? 0.6 : 1 }}>
          <table style={s.table}>
            <thead><tr><th style={s.th}>SKU</th><th style={s.th}>Sản phẩm</th><th style={s.th}>Danh mục</th><th style={s.th}>Đơn vị</th>{showStock && <th style={s.th}>Tồn kho</th>}<th style={s.th}>Trạng thái</th><th style={s.th}>Thao tác</th></tr></thead>
            <tbody>
              {list.result.content.length === 0 ? (
                <tr><td colSpan="7" style={s.emptyTd}>Không tìm thấy sản phẩm nào phù hợp.</td></tr>
              ) : (
                list.result.content.map(item => (
                  <tr key={item.id}>
                    <td style={s.td}><strong>{item.sku}</strong></td><td style={s.td}>{item.name}</td><td style={s.td}>{item.categoryName}</td><td style={s.td}>{item.unitSymbol}</td>
                    {showStock && <td style={s.td}><span style={{ color: '#2563eb', fontWeight: 'bold' }}>{item.quantityOnHand ?? '—'}</span></td>}
                    <td style={s.td}><StatusBadge status={item.status} labels={{ ACTIVE: 'Hoạt động', INACTIVE: 'Ngừng' }} /></td>
                    <td style={s.td}>
                      <div style={{ display: 'flex', gap: '12px' }}>
                        <button style={{ background: 'none', border: 'none', color: '#2563eb', cursor: 'pointer', fontWeight: '500', padding: 0 }} onClick={() => openDetail(item)}>Chi tiết</button>
                        {canManage && (
                          <>
                            <button style={{ background: 'none', border: 'none', color: '#4b5563', cursor: 'pointer', fontWeight: '500', padding: 0 }} onClick={() => setDialog({ type: 'form', entity: item })}>Sửa</button>
                            <button style={{ background: 'none', border: 'none', color: item.status === 'ACTIVE' ? '#dc2626' : '#16a34a', cursor: 'pointer', fontWeight: '500', padding: 0 }} onClick={() => setDialog({ type: 'status', entity: item })}>{item.status === 'ACTIVE' ? 'Ngừng' : 'Kích hoạt'}</button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <div style={s.pagination}>
          <span style={{ fontSize: '14px', color: '#6b7280' }}>Tổng cộng {list.result.totalElements} sản phẩm</span>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button disabled={list.page === 0} onClick={() => { list.beginChange(); list.setPage(list.page - 1) }} style={s.btnPage}>Trước</button>
            <button disabled={list.page >= list.result.totalPages - 1} onClick={() => { list.beginChange(); list.setPage(list.page + 1) }} style={s.btnPage}>Sau</button>
          </div>
        </div>
      </div>

      {dialog?.type === 'form' && (
        <div style={s.modalOverlay}>
          <div style={s.modalContent}>
            <div style={s.modalHeader}>
              <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 'bold' }}>{dialog.entity ? 'Cập nhật' : 'Thêm sản phẩm'}</h3>
              <button onClick={() => setDialog(null)} style={{ background: 'none', border: 'none', fontSize: '24px', cursor: 'pointer', color: '#6b7280' }}>×</button>
            </div>
            <ProductForm entity={dialog.entity} categories={categories} units={units} onClose={() => setDialog(null)} onSaved={list.load} />
          </div>
        </div>
      )}
      {dialog?.type === 'status' && <ConfirmDialog dangerous={dialog.entity.status === 'ACTIVE'} message={`Bạn có chắc muốn ${dialog.entity.status === 'ACTIVE' ? 'ngừng hoạt động' : 'kích hoạt'} sản phẩm ${dialog.entity.sku}?`} onClose={() => setDialog(null)} onConfirm={() => changeStatus(dialog.entity)} />}
    </div>
  )
}