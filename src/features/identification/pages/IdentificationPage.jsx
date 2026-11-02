import { useState } from 'react'
import PageHeader from '../../../shared/ui/PageHeader.jsx'
import ProductScanResult from '../components/ProductScanResult.jsx'
import UnifiedScanner from '../components/UnifiedScanner.jsx'

export default function IdentificationPage() {
  const [product, setProduct] = useState(null)
  return <div className="page">
    <PageHeader title="Nhận diện QR & Barcode" description="Quét bằng camera, máy quét USB hoặc nhập mã thủ công. Việc quét chỉ tra cứu sản phẩm và không thay đổi tồn kho." />
    <div className="identification-grid">
      <section className="card scanner-card"><UnifiedScanner onLookupStarted={() => setProduct(null)} onProductDetected={setProduct} /></section>
      <section className="card result-card"><h2>Kết quả nhận diện</h2><ProductScanResult product={product} /></section>
    </div>
    <div className="notice scan-security-note">Camera cần HTTPS hoặc localhost. Nếu thiết bị không hỗ trợ hoặc từ chối quyền camera, hãy dùng ô nhập mã thủ công.</div>
  </div>
}
