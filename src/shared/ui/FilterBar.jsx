export default function FilterBar({ children, onSubmit, className = '' }) {
  return <form className={`filter-bar ${className}`.trim()} onSubmit={onSubmit}>{children}</form>
}
