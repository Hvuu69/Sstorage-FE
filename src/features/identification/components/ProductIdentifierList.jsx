import { useCallback, useEffect, useState } from 'react'
import { Button, Field, Input, Modal, StatusBadge, useToast } from '../../../shared/ui/index.js'
import { identificationApi } from '../api/identificationApi.js'
import QRCodePreview from './QRCodePreview.jsx'

export default function ProductIdentifierList({ product }) {
  const [items, setItems] = useState([])
  const [value, setValue] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [preview, setPreview] = useState(null)
  const { notify } = useToast()

  const load = useCallback(async () => {
    setLoading(true); setError('')
    try { setItems(await identificationApi.listForProduct(product.id)) }
    catch (requestError) { setError(requestError.message) }
    finally { setLoading(false) }
  }, [product.id])
  useEffect(() => {
    let active = true
    identificationApi.listForProduct(product.id)
      .then((result) => { if (active) setItems(result) })
      .catch((requestError) => { if (active) setError(requestError.message) })
      .finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [product.id])

  async function create(event) {
    event.preventDefault(); setSaving(true); setError('')
    try {
      await identificationApi.create(product.id, { type: 'QR', value: value.trim() || null })
      setValue(''); notify('Đã đăng ký mã QR.'); await load()
    } catch (requestError) { setError(requestError.message) }
    finally { setSaving(false) }
  }

  async function toggle(item) {
    setSaving(true); setError('')
    try { await identificationApi.changeStatus(item.id, !item.active); notify(item.active ? 'Đã vô hiệu hóa mã.' : 'Đã kích hoạt mã.'); await load() }
    catch (requestError) { setError(requestError.message) }
    finally { setSaving(false) }
  }

  async function showQr(item) {
    setError('')
    try { setPreview(await identificationApi.qrCode(product.id, item.id)) }
    catch (requestError) { setError(requestError.message) }
  }

  return <section className="identifier-panel">
    <h3>Mã nhận diện</h3>
    <p className="muted">Một sản phẩm có thể có nhiều mã. Barcode chờ migration schema và không được lưu giả dưới loại QR.</p>
    <form className="identifier-create" onSubmit={create}>
      <Field label="Nội dung QR" hint="Để trống để hệ thống sinh giá trị duy nhất."><Input maxLength="255" value={value} onChange={(event) => setValue(event.target.value)} placeholder="Ví dụ: QR-SP-001" /></Field>
      <Button type="submit" disabled={saving}>{saving ? 'Đang lưu…' : 'Đăng ký QR'}</Button>
    </form>
    {error && <p role="alert" className="field-error">{error}</p>}
    {loading ? <p className="muted">Đang tải mã nhận diện…</p> : items.length === 0 ? <p className="muted">Sản phẩm chưa có mã nhận diện.</p> : <div className="identifier-list">{items.map((item) => <div key={item.id} className="identifier-row"><div><strong>{item.identifierType}</strong><code>{item.identifierValue}</code></div><StatusBadge status={item.active ? 'ACTIVE' : 'INACTIVE'} labels={{ ACTIVE: 'Hiệu lực', INACTIVE: 'Vô hiệu' }} /><div className="table-actions">{item.identifierType === 'QR' && item.active && <Button variant="text" onClick={() => showQr(item)}>Xem QR</Button>}<Button variant={item.active ? 'danger' : 'secondary'} disabled={saving} onClick={() => toggle(item)}>{item.active ? 'Vô hiệu hóa' : 'Kích hoạt'}</Button></div></div>)}</div>}
    {preview && <Modal title={`Mã QR · ${product.sku}`} onClose={() => setPreview(null)}><div className="modal-body"><QRCodePreview value={preview.identifierValue} fileName={preview.suggestedFileName} /></div></Modal>}
  </section>
}
