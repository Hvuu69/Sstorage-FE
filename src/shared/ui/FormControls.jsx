export function Field({ label, error, hint, children }) {
  return <label className="field"><span>{label}</span>{children}{hint && <small className="field-hint">{hint}</small>}{error && <span className="field-error">{error}</span>}</label>
}

export function Input({ className = '', ...props }) {
  return <input className={`input ${className}`.trim()} {...props} />
}

export function Select({ className = '', children, ...props }) {
  return <select className={`input ${className}`.trim()} {...props}>{children}</select>
}

export function Textarea({ className = '', ...props }) {
  return <textarea className={`textarea ${className}`.trim()} {...props} />
}
