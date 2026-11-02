import { useEffect, useRef, useState } from 'react'
import Button from '../../../shared/ui/Button.jsx'

export default function QRCodePreview({ value, fileName }) {
  const containerRef = useRef(null)
  const [error, setError] = useState('')

  useEffect(() => {
    let active = true
    const container = containerRef.current
    import('@zxing/browser').then(({ BrowserQRCodeSvgWriter }) => {
      if (!active || !container) return
      const svg = new BrowserQRCodeSvgWriter().write(value, 280, 280)
      svg.setAttribute('role', 'img')
      svg.setAttribute('aria-label', `Mã QR ${value}`)
      container.replaceChildren(svg)
    }).catch(() => active && setError('Không thể tạo ảnh QR trên trình duyệt này.'))
    return () => { active = false; container?.replaceChildren() }
  }, [value])

  function download() {
    const svg = containerRef.current?.querySelector('svg')
    if (!svg) return
    const blob = new Blob([new XMLSerializer().serializeToString(svg)], { type: 'image/svg+xml;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = fileName || 'product-qr.svg'
    link.click()
    globalThis.setTimeout(() => URL.revokeObjectURL(url), 0)
  }

  return <div className="qr-preview">
    <div ref={containerRef} className="qr-canvas" />
    <code>{value}</code>
    {error && <p role="alert" className="field-error">{error}</p>}
    <Button onClick={download} disabled={Boolean(error)}>Tải mã QR (SVG)</Button>
  </div>
}
