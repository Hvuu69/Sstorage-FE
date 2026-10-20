import Button from './Button.jsx'

export default function Pagination({ page, totalPages, totalElements, noun = 'bản ghi', onPageChange }) {
  return <div className="pager"><span>{totalElements} {noun} · Trang {totalPages ? page + 1 : 0}/{totalPages}</span><div><Button variant="secondary" disabled={page <= 0} onClick={() => onPageChange(page - 1)}>Trước</Button><Button variant="secondary" disabled={totalPages === 0 || page + 1 >= totalPages} onClick={() => onPageChange(page + 1)}>Sau</Button></div></div>
}
