import Button from './Button.jsx'
import { Input } from './FormControls.jsx'

export default function SearchBar({ value, onChange, placeholder = 'Tìm kiếm…', label = 'Tìm kiếm', buttonLabel = 'Tìm' }) {
  return <div className="search-bar"><Input aria-label={label} value={value} placeholder={placeholder} onChange={(event) => onChange(event.target.value)} /><Button variant="secondary" type="submit">{buttonLabel}</Button></div>
}
