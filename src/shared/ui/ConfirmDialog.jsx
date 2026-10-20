import Button from './Button.jsx'
import Modal from './Modal.jsx'

export default function ConfirmDialog({ title = 'Xác nhận thao tác', message, confirmLabel = 'Xác nhận', dangerous = false, busy = false, onConfirm, onClose }) {
  return <Modal title={title} onClose={onClose} compact>
    <div className="modal-body"><p className="confirm-message">{message}</p></div>
    <div className="modal-actions"><Button variant="secondary" onClick={onClose} disabled={busy}>Hủy</Button><Button variant={dangerous ? 'danger' : 'primary'} onClick={onConfirm} disabled={busy}>{busy ? 'Đang xử lý…' : confirmLabel}</Button></div>
  </Modal>
}
