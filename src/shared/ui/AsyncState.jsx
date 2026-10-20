import Button from './Button.jsx'

export function LoadingState({ label = 'Đang tải dữ liệu…', compact = false, fullPage = false }) {
  return <div className={`async-state ${compact ? 'compact' : ''} ${fullPage ? 'full-page' : ''}`} role="status"><span className="spinner" aria-hidden="true" />{label}</div>
}

export function EmptyState({ message = 'Chưa có dữ liệu.', compact = false }) {
  return <div className={`async-state ${compact ? 'compact' : ''}`}><span className="state-icon" aria-hidden="true">◇</span>{message}</div>
}

export function ErrorState({ message = 'Không thể tải dữ liệu.', onRetry, compact = false }) {
  return <div className={`async-state error ${compact ? 'compact' : ''}`} role="alert"><span>{message}</span>{onRetry && <Button variant="text" onClick={onRetry}>Thử lại</Button>}</div>
}
