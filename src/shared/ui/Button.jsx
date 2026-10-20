export default function Button({ variant = 'primary', className = '', type = 'button', children, ...props }) {
  return <button type={type} className={`btn ${variant} ${className}`.trim()} {...props}>{children}</button>
}
