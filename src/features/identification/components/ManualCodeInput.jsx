import { useState } from 'react'
import { Button, Field, Input } from '../../../shared/ui/index.js'

export default function ManualCodeInput({ onSubmit, disabled = false }) {
  const [code, setCode] = useState('')
  function submit(event) {
    event.preventDefault()
    const normalized = code.trim()
    if (!normalized) return
    onSubmit(normalized)
  }
  return <form className="manual-code-form" onSubmit={submit}>
    <Field label="Nhập hoặc quét mã" hint="Máy quét USB có thể nhập mã như bàn phím rồi gửi bằng phím Enter.">
      <Input autoFocus autoComplete="off" maxLength="255" value={code} disabled={disabled} onChange={(event) => setCode(event.target.value)} placeholder="QR, EAN-13, UPC-A hoặc CODE-128" />
    </Field>
    <Button type="submit" disabled={disabled || !code.trim()}>Tra cứu</Button>
  </form>
}
