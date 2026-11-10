import {
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react'

import { normalizePage } from '../api/http.js'

const EMPTY_PAGE = normalizePage()

export default function usePagedResource(
  loader,
  {
    size = 10,
    sort = 'name,asc',
    filters = {},
    enabled = true,
  } = {},
) {
  const [page, setPage] = useState(0)

  const [result, setResult] = useState(
    EMPTY_PAGE
  )

  const [loading, setLoading] = useState(
    Boolean(enabled)
  )

  const [error, setError] = useState('')

  const controllerRef = useRef(null)

  const load = useCallback(async () => {
    // Hủy request trước đó nếu có.
    controllerRef.current?.abort()

    const controller = new AbortController()

    controllerRef.current = controller

    setLoading(true)
    setError('')

    try {
      const data = await loader(
        {
          ...filters,
          page,
          size,
          sort,
        },
        {
          signal: controller.signal,
        }
      )

      if (!controller.signal.aborted) {
        setResult(normalizePage(data))
        setError('')
      }
    } catch (requestError) {
      if (
        !controller.signal.aborted &&
        requestError?.errorCode !== 'REQUEST_ABORTED'
      ) {
        setError(
          requestError?.message ??
          'Không thể tải dữ liệu.'
        )
      }
    } finally {
      if (!controller.signal.aborted) {
        setLoading(false)
      }

      if (controllerRef.current === controller) {
        controllerRef.current = null
      }
    }
  }, [
    filters,
    loader,
    page,
    size,
    sort,
  ])

  useEffect(() => {
    if (!enabled) {
      controllerRef.current?.abort()
      controllerRef.current = null
      return undefined
    }

    // Fetching is the synchronization side effect for this resource.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void load()

    return () => {
      controllerRef.current?.abort()
      controllerRef.current = null
    }
  }, [
    enabled,
    load,
  ])

  const beginChange = useCallback(() => {
    setLoading(true)
    setError('')
  }, [])

  return {
    page,
    setPage,
    result,
    loading,
    error,
    load,
    beginChange,
  }
}