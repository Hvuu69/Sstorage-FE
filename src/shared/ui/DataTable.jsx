import { EmptyState, ErrorState, LoadingState } from './AsyncState.jsx'

export default function DataTable({ columns, rows, rowKey = 'id', loading = false, error = '', emptyMessage = 'Chưa có dữ liệu phù hợp.', onRetry }) {
  return <div className="table-wrap"><table><thead><tr>{columns.map((column) => <th key={column.key}>{column.label}</th>)}</tr></thead><tbody>
    {loading && <tr><td colSpan={columns.length}><LoadingState compact /></td></tr>}
    {!loading && error && <tr><td colSpan={columns.length}><ErrorState message={error} onRetry={onRetry} compact /></td></tr>}
    {!loading && !error && rows.length === 0 && <tr><td colSpan={columns.length}><EmptyState message={emptyMessage} compact /></td></tr>}
    {!loading && !error && rows.map((row, index) => <tr key={typeof rowKey === 'function' ? rowKey(row) : row[rowKey] ?? index}>{columns.map((column) => <td key={column.key}>{column.render ? column.render(row) : row[column.key]}</td>)}</tr>)}
  </tbody></table></div>
}
