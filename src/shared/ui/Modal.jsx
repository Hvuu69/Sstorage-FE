import { useEffect } from 'react'
import Button from './Button.jsx'

export default function Modal({ title, children, onClose, compact = false }) {
  useEffect(() => {
    const close = (event) => { if (event.key === 'Escape') onClose() }
    document.addEventListener('keydown', close)
    return () => document.removeEventListener('keydown', close)
  }, [onClose])

  return <div className="modal-backdrop" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
    <section className={`modal ${compact ? 'compact' : ''}`} role="dialog" aria-modal="true" aria-label={title}>
      <div className="modal-header"><h2>{title}</h2><Button variant="secondary" onClick={onClose}>Đóng</Button></div>
      {children}
    </section>
  </div>
}
