import StatusBadge from '../../../shared/ui/StatusBadge.jsx'

export default function ProductScanResult({ product }) {
  if (!product) return <div className="scan-result empty">Chưa có kết quả nhận diện.</div>
  return <div className="scan-result success" aria-live="polite">
    <div className="scan-result-heading"><strong>Nhận diện thành công</strong><StatusBadge status={product.status} labels={{ ACTIVE: 'Hoạt động' }} /></div>
    <dl>
      <div><dt>SKU</dt><dd>{product.sku}</dd></div>
      <div><dt>Sản phẩm</dt><dd>{product.productName}</dd></div>
      <div><dt>Danh mục</dt><dd>{product.categoryName}</dd></div>
      <div><dt>Đơn vị</dt><dd>{product.unitName} ({product.unitSymbol})</dd></div>
      <div><dt>Loại mã</dt><dd>{product.identifierType}</dd></div>
      <div><dt>Giá trị mã</dt><dd className="code-value">{product.identifierValue}</dd></div>
    </dl>
  </div>
}
