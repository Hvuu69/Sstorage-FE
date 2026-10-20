import { useCallback, useEffect, useState } from 'react'
import { normalizePage } from '../api/http.js'

const EMPTY_PAGE = normalizePage()

export default function usePagedResource(loader, { size = 10, sort = 'name,asc', filters = {} } = {}) {
  const [page, setPage] = useState(0)
  const [result, setResult] = useState(EMPTY_PAGE)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const load = useCallback(async () => {
    setLoading(true); setError('')
    try { setResult(normalizePage(await loader({ ...filters, page, size, sort }))) }
    catch (requestError) { setError(requestError.message) }
    finally { setLoading(false) }
  }, [filters, loader, page, size, sort])

  useEffect(() => {
    let cancelled = false
    loader({ ...filters, page, size, sort })
      .then((data) => { if (!cancelled) { setResult(normalizePage(data)); setError('') } })
      .catch((requestError) => { if (!cancelled) setError(requestError.message) })
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [filters, loader, page, size, sort])

  return { page, setPage, result, loading, error, load, beginChange() { setLoading(true); setError('') } }
}
