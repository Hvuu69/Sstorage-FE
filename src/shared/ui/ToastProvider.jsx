import { useCallback, useMemo, useState } from 'react'
import { ToastContext } from './toastContext.js'

export function ToastProvider({ children }) {
  const [toast, setToast] = useState(null)
  const notify = useCallback((message, type = 'success') => setToast({ message, type }), [])
  const value = useMemo(() => ({ notify, clear: () => setToast(null) }), [notify])
  return <ToastContext.Provider value={value}>{children}{toast && <div className={`toast ${toast.type === 'error' ? 'error' : ''}`} role="alert"><span>{toast.message}</span><button aria-label="Đóng thông báo" onClick={() => setToast(null)}>×</button></div>}</ToastContext.Provider>
}
