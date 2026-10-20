export default function StatusBadge({ status, labels = {} }) {
  const normalized = String(status ?? '').toUpperCase()
  const positive = ['ACTIVE', 'APPROVED', 'CONFIRMED', 'COMPLETED', 'FULFILLED'].includes(normalized)
  const negative = ['INACTIVE', 'REJECTED', 'CANCELLED', 'DISABLED', 'LOCKED'].includes(normalized)
  return <span className={`status ${positive ? 'active' : negative ? 'inactive' : 'neutral'}`}>{labels[normalized] ?? status ?? '—'}</span>
}
