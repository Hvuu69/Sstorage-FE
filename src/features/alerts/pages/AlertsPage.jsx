import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react'

import { alertApi } from '../api/alertApi.js'
import { productApi } from '../../products/api/productApi.js'

import {
  Button,
  ConfirmDialog,
  DataTable,
  Field,
  Input,
  Modal,
  PageHeader,
  Pagination,
  Select,
  StatusBadge,
  useToast,
} from '../../../shared/ui/index.js'

const PAGE_SIZE = 20
const POLICY_PAGE_SIZE = 10
const PRODUCT_PAGE_SIZE = 100

const STATUS_LABELS = {
  NEW: 'Mới',
  ACKNOWLEDGED: 'Đã ghi nhận',
  RESOLVED: 'Đã xử lý',
}

const TYPE_LABELS = {
  LOW_STOCK: 'Thiếu hàng',
  OVERSTOCK: 'Tồn vượt mức',
}

const EMPTY_PAGE = {
  content: [],
  page: 0,
  size: PAGE_SIZE,
  totalElements: 0,
  totalPages: 0,
}

const EMPTY_POLICY_PAGE = {
  ...EMPTY_PAGE,
  size: POLICY_PAGE_SIZE,
}

const EMPTY_FORM = {
  minimumQuantity: '',
  maximumQuantity: '',
  safetyStock: '',
  leadTimeDays: '',
}

const numberFormat = new Intl.NumberFormat('vi-VN')

function formatNumber(value) {
  return value == null ? '—' : numberFormat.format(value)
}

function formatDate(value) {
  if (!value) return '—'

  const date = new Date(value)

  if (Number.isNaN(date.getTime())) return '—'

  return new Intl.DateTimeFormat('vi-VN', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(date)
}

function normalizeSearch(value) {
  return String(value ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
}

async function loadAllActiveProducts(signal) {
  const firstPage = await productApi.list(
    {
      page: 0,
      size: PRODUCT_PAGE_SIZE,
      sort: 'sku,asc',
      status: 'ACTIVE',
    },
    { signal },
  )

  const products = [...firstPage.content]

  if (firstPage.totalPages <= 1) {
    return products
  }

  const remainingPages = await Promise.all(
    Array.from(
      { length: firstPage.totalPages - 1 },
      (_, index) =>
        productApi.list(
          {
            page: index + 1,
            size: PRODUCT_PAGE_SIZE,
            sort: 'sku,asc',
            status: 'ACTIVE',
          },
          { signal },
        ),
    ),
  )

  remainingPages.forEach((page) => {
    products.push(...page.content)
  })

  return products
}

function SummaryCard({ label, value, description, tone }) {
  return (
    <section className={`alert-summary-card ${tone}`}>
      <span>{label}</span>
      <strong>{formatNumber(value)}</strong>
      <small>{description}</small>
    </section>
  )
}

export default function AlertsPage() {
  const { notify } = useToast()

  const [alerts, setAlerts] = useState(EMPTY_PAGE)
  const [policies, setPolicies] = useState(EMPTY_POLICY_PAGE)

  const [alertSummary, setAlertSummary] = useState({
    newCount: null,
    acknowledgedCount: null,
  })

  const [filters, setFilters] = useState({
    status: '',
    type: '',
  })

  const [alertSearch, setAlertSearch] = useState('')
  const [policySearch, setPolicySearch] = useState('')

  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [alertError, setAlertError] = useState('')
  const [policyError, setPolicyError] = useState('')

  const [saving, setSaving] = useState(false)
  const [evaluating, setEvaluating] = useState(false)

  const [products, setProducts] = useState([])
  const [productsLoading, setProductsLoading] = useState(false)
  const [productError, setProductError] = useState('')

  const [policyOpen, setPolicyOpen] = useState(false)
  const [editing, setEditing] = useState(false)
  const [selectedProductId, setSelectedProductId] = useState('')
  const [form, setForm] = useState(EMPTY_FORM)
  const [formError, setFormError] = useState('')

  const [selectedAlert, setSelectedAlert] = useState(null)
  const [resolveTarget, setResolveTarget] = useState(null)

  const productLoadController = useRef(null)

  // Tải danh sách cảnh báo, chính sách và số liệu tổng quan.
  const loadData = useCallback(
    async (signal, isRefresh = false) => {
      if (isRefresh) {
        setRefreshing(true)
      } else {
        setLoading(true)
      }

      setAlertError('')
      setPolicyError('')

      const results = await Promise.allSettled([
        alertApi.list(
          {
            page: alerts.page,
            size: PAGE_SIZE,
            sort: 'createdAt,desc',
            ...(filters.status
              ? { status: filters.status }
              : {}),
            ...(filters.type
              ? { type: filters.type }
              : {}),
          },
          { signal },
        ),

        alertApi.listPolicies(
          {
            page: policies.page,
            size: POLICY_PAGE_SIZE,
            sort: 'updatedAt,desc',
          },
          { signal },
        ),

        alertApi.list(
          {
            page: 0,
            size: 1,
            status: 'NEW',
          },
          { signal },
        ),

        alertApi.list(
          {
            page: 0,
            size: 1,
            status: 'ACKNOWLEDGED',
          },
          { signal },
        ),
      ])

      if (signal?.aborted) return

      const [alertResult, policyResult, newResult, acknowledgedResult] =
        results

      if (alertResult.status === 'fulfilled') {
        setAlerts(alertResult.value)
      } else {
        setAlertError(
          alertResult.reason?.message ??
            'Không thể tải danh sách cảnh báo.',
        )
      }

      if (policyResult.status === 'fulfilled') {
        setPolicies(policyResult.value)
      } else {
        setPolicyError(
          policyResult.reason?.message ??
            'Không thể tải chính sách tồn kho.',
        )
      }

      setAlertSummary({
        newCount:
          newResult.status === 'fulfilled'
            ? newResult.value.totalElements
            : null,

        acknowledgedCount:
          acknowledgedResult.status === 'fulfilled'
            ? acknowledgedResult.value.totalElements
            : null,
      })

      setLoading(false)
      setRefreshing(false)
    },
    [
      alerts.page,
      filters.status,
      filters.type,
      policies.page,
    ],
  )

  // Tự tải dữ liệu khi mở trang hoặc đổi trang/bộ lọc.
  useEffect(() => {
    const controller = new AbortController()

    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadData(controller.signal)

    return () => controller.abort()
  }, [loadData])

  useEffect(() => {
    return () => productLoadController.current?.abort()
  }, [])

  const refresh = async () => {
    const controller = new AbortController()
    await loadData(controller.signal, true)
  }

  // Chỉ tải toàn bộ sản phẩm khi người dùng mở form chính sách.
  const loadProducts = async () => {
    productLoadController.current?.abort()

    const controller = new AbortController()
    productLoadController.current = controller

    setProductsLoading(true)
    setProductError('')

    try {
      const result = await loadAllActiveProducts(
        controller.signal,
      )

      if (controller.signal.aborted) return

      setProducts(result)
    } catch (error) {
      if (controller.signal.aborted) return

      setProductError(
        error.message ?? 'Không thể tải danh sách sản phẩm.',
      )
    } finally {
      if (!controller.signal.aborted) {
        setProductsLoading(false)
      }
    }
  }

  const openCreatePolicy = () => {
    setEditing(false)
    setSelectedProductId('')
    setForm(EMPTY_FORM)
    setFormError('')
    setPolicyOpen(true)

    loadProducts()
  }

  const openEditPolicy = (policy) => {
    setEditing(true)
    setSelectedProductId(policy.productId)

    setForm({
      minimumQuantity: String(policy.minimumQuantity),
      maximumQuantity:
        policy.maximumQuantity == null
          ? ''
          : String(policy.maximumQuantity),
      safetyStock: String(policy.safetyStock),
      leadTimeDays: String(policy.leadTimeDays),
    })

    setFormError('')
    setPolicyOpen(true)

    loadProducts()
  }

  const closePolicy = () => {
    productLoadController.current?.abort()
    setPolicyOpen(false)
    setFormError('')
  }

  const updateForm = (field, value) => {
    setForm((current) => ({
      ...current,
      [field]: value,
    }))
  }

  // Lưu chính sách và để Backend tự đánh giá cảnh báo sản phẩm.
  const savePolicy = async (event) => {
    event.preventDefault()
    setFormError('')

    if (!selectedProductId) {
      setFormError('Vui lòng chọn sản phẩm.')
      return
    }

    const minimumQuantity = Number(form.minimumQuantity)
    const maximumQuantity =
      form.maximumQuantity.trim() === ''
        ? null
        : Number(form.maximumQuantity)
    const safetyStock = Number(form.safetyStock)
    const leadTimeDays = Number(form.leadTimeDays)

    const values = [
      minimumQuantity,
      safetyStock,
      leadTimeDays,
      ...(maximumQuantity === null ? [] : [maximumQuantity]),
    ]

    if (
      values.some(
        (value) =>
          !Number.isSafeInteger(value) || value < 0,
      )
    ) {
      setFormError(
        'Các giá trị phải là số nguyên không âm.',
      )
      return
    }

    if (
      maximumQuantity !== null &&
      maximumQuantity < minimumQuantity
    ) {
      setFormError(
        'Tồn tối đa phải lớn hơn hoặc bằng tồn tối thiểu.',
      )
      return
    }

    const payload = {
      minimumQuantity,
      maximumQuantity,
      safetyStock,
      leadTimeDays,
    }

    setSaving(true)

    try {
      await alertApi.upsertPolicy(
        selectedProductId,
        payload,
      )

      notify(
        editing
          ? 'Đã cập nhật chính sách tồn kho.'
          : 'Đã tạo chính sách tồn kho.',
      )

      closePolicy()

      const controller = new AbortController()
      await loadData(controller.signal, true)
    } catch (error) {
      setFormError(
        error.message ?? 'Không thể lưu chính sách tồn kho.',
      )
    } finally {
      setSaving(false)
    }
  }

  // Đánh giá lại toàn bộ sản phẩm đang hoạt động.
  const runEvaluation = async () => {
    setEvaluating(true)

    try {
      const result = await alertApi.evaluate()

      notify(
        result?.message ??
          'Đã hoàn tất đánh giá chính sách tồn kho.',
      )

      const controller = new AbortController()
      await loadData(controller.signal, true)
    } catch (error) {
      notify(
        error.message ?? 'Không thể đánh giá tồn kho.',
        'error',
      )
    } finally {
      setEvaluating(false)
    }
  }

  // Tiếp nhận cảnh báo mới.
  const acknowledgeAlert = async (alert) => {
    setSaving(true)

    try {
      await alertApi.acknowledge(alert.id)

      notify('Đã ghi nhận cảnh báo.')

      setSelectedAlert(null)

      const controller = new AbortController()
      await loadData(controller.signal, true)
    } catch (error) {
      notify(
        error.message ?? 'Không thể ghi nhận cảnh báo.',
        'error',
      )
    } finally {
      setSaving(false)
    }
  }

  // Đóng cảnh báo chỉ sau khi người dùng xác nhận.
  const resolveAlert = async () => {
    if (!resolveTarget) return

    setSaving(true)

    try {
      await alertApi.resolve(resolveTarget.id)

      notify('Đã chuyển cảnh báo sang trạng thái đã xử lý.')

      setResolveTarget(null)
      setSelectedAlert(null)

      const controller = new AbortController()
      await loadData(controller.signal, true)
    } catch (error) {
      notify(
        error.message ?? 'Không thể xử lý cảnh báo.',
        'error',
      )
    } finally {
      setSaving(false)
    }
  }

  // Tìm trên những kết quả của trang hiện tại.
  const visibleAlerts = useMemo(() => {
    const query = normalizeSearch(alertSearch)

    if (!query) return alerts.content

    return alerts.content.filter((alert) => {
      const searchableText = normalizeSearch(
        [
          alert.sku,
          alert.productName,
          alert.message,
          TYPE_LABELS[alert.alertType],
          STATUS_LABELS[alert.status],
        ].join(' '),
      )

      return searchableText.includes(query)
    })
  }, [alerts.content, alertSearch])

  const visiblePolicies = useMemo(() => {
    const query = normalizeSearch(policySearch)

    if (!query) return policies.content

    return policies.content.filter((policy) => {
      const searchableText = normalizeSearch(
        `${policy.sku} ${policy.productName}`,
      )

      return searchableText.includes(query)
    })
  }, [policies.content, policySearch])

  const alertColumns = [
      {
        key: 'product',
        label: 'Sản phẩm',
        render: (row) => (
          <div className="alert-product-cell">
            <strong>{row.productName}</strong>
            <small>{row.sku}</small>
          </div>
        ),
      },

      {
        key: 'alertType',
        label: 'Loại cảnh báo',
        render: (row) => (
          <StatusBadge
            status={row.alertType}
            labels={TYPE_LABELS}
          />
        ),
      },

      {
        key: 'currentQuantity',
        label: 'Tồn hiện tại',
        render: (row) => (
          <strong className="alert-quantity">
            {formatNumber(row.currentQuantity)}
          </strong>
        ),
      },

      {
        key: 'suggestedQuantity',
        label: 'Đề xuất bổ sung',
        render: (row) =>
          row.suggestedQuantity == null
            ? '—'
            : formatNumber(row.suggestedQuantity),
      },

      {
        key: 'status',
        label: 'Trạng thái',
        render: (row) => (
          <StatusBadge
            status={row.status}
            labels={STATUS_LABELS}
          />
        ),
      },

      {
        key: 'createdAt',
        label: 'Thời điểm',
        render: (row) => formatDate(row.createdAt),
      },

      {
        key: 'actions',
        label: 'Thao tác',
        render: (row) => (
          <div className="table-actions">
            <Button
              size="small"
              variant="secondary"
              onClick={() => setSelectedAlert(row)}
            >
              Chi tiết
            </Button>

            {row.status === 'NEW' && (
              <Button
                size="small"
                variant="secondary"
                disabled={saving}
                onClick={() => acknowledgeAlert(row)}
              >
                Ghi nhận
              </Button>
            )}

            {row.status !== 'RESOLVED' && (
              <Button
                size="small"
                variant="danger"
                disabled={saving}
                onClick={() => setResolveTarget(row)}
              >
                Đóng cảnh báo
              </Button>
            )}
          </div>
        ),
      },
  ]

  const policyColumns = useMemo(
    () => [
      {
        key: 'sku',
        label: 'SKU',
      },

      {
        key: 'productName',
        label: 'Sản phẩm',
      },

      {
        key: 'quantityOnHand',
        label: 'Tồn hiện tại',
        render: (row) => formatNumber(row.quantityOnHand),
      },

      {
        key: 'minimumQuantity',
        label: 'Tối thiểu',
        render: (row) => formatNumber(row.minimumQuantity),
      },

      {
        key: 'maximumQuantity',
        label: 'Tối đa',
        render: (row) =>
          row.maximumQuantity == null
            ? 'Không giới hạn'
            : formatNumber(row.maximumQuantity),
      },

      {
        key: 'safetyStock',
        label: 'Tồn an toàn',
        render: (row) => formatNumber(row.safetyStock),
      },

      {
        key: 'leadTimeDays',
        label: 'Cung ứng',
        render: (row) => `${row.leadTimeDays} ngày`,
      },

      {
        key: 'actions',
        label: 'Thao tác',
        render: (row) => (
          <Button
            size="small"
            variant="secondary"
            onClick={() => openEditPolicy(row)}
          >
            Chỉnh sửa
          </Button>
        ),
      },
    ],
    [],
  )

  const openAlertCount =
    alertSummary.newCount != null &&
    alertSummary.acknowledgedCount != null
      ? alertSummary.newCount +
        alertSummary.acknowledgedCount
      : null

  return (
    <div className="page alerts-page">
      <PageHeader
        title="Cảnh báo tồn kho"
        description="Theo dõi rủi ro tồn kho, tiếp nhận cảnh báo và quản lý ngưỡng an toàn cho từng sản phẩm."
        actions={
          <>
            <Button
              variant="secondary"
              onClick={openCreatePolicy}
            >
              + Thiết lập chính sách
            </Button>

            <Button
              onClick={runEvaluation}
              disabled={evaluating}
            >
              {evaluating
                ? 'Đang đánh giá…'
                : 'Đánh giá tồn kho'}
            </Button>
          </>
        }
      />

      <section className="alert-summary-grid">
        <SummaryCard
          label="Cảnh báo đang mở"
          value={openAlertCount}
          description="Mới và đã được ghi nhận"
          tone="red"
        />

        <SummaryCard
          label="Chưa ghi nhận"
          value={alertSummary.newCount}
          description="Cần quản lý tiếp nhận"
          tone="amber"
        />

        <SummaryCard
          label="Đã ghi nhận"
          value={alertSummary.acknowledgedCount}
          description="Đang chờ xử lý hoàn tất"
          tone="blue"
        />

        <SummaryCard
          label="Chính sách đã tạo"
          value={policies.totalElements}
          description="Số sản phẩm có ngưỡng tồn"
          tone="green"
        />
      </section>

      <section className="card alert-section">
        <div className="alert-section-heading">
          <div>
            <h2>Danh sách cảnh báo</h2>
            <p>
              Ưu tiên tiếp nhận cảnh báo mới trước khi
              đánh dấu đã xử lý.
            </p>
          </div>

          <Button
            variant="secondary"
            size="small"
            onClick={refresh}
            disabled={refreshing}
          >
            {refreshing ? 'Đang tải…' : '↻ Làm mới'}
          </Button>
        </div>

        <div className="alert-filter-bar">
          <div className="alert-search">
            <Input
              value={alertSearch}
              onChange={(event) =>
                setAlertSearch(event.target.value)
              }
              placeholder="Tìm SKU, tên sản phẩm hoặc nội dung cảnh báo..."
              aria-label="Tìm cảnh báo trong trang hiện tại"
            />
            <small>
              Tìm kiếm trong {alerts.content.length} kết quả
              của trang đang mở.
            </small>
          </div>

          <Select
            aria-label="Lọc trạng thái cảnh báo"
            value={filters.status}
            onChange={(event) => {
              setFilters((current) => ({
                ...current,
                status: event.target.value,
              }))

              setAlerts((current) => ({
                ...current,
                page: 0,
              }))
            }}
          >
            <option value="">Tất cả trạng thái</option>
            <option value="NEW">Mới</option>
            <option value="ACKNOWLEDGED">
              Đã ghi nhận
            </option>
            <option value="RESOLVED">Đã xử lý</option>
          </Select>

          <Select
            aria-label="Lọc loại cảnh báo"
            value={filters.type}
            onChange={(event) => {
              setFilters((current) => ({
                ...current,
                type: event.target.value,
              }))

              setAlerts((current) => ({
                ...current,
                page: 0,
              }))
            }}
          >
            <option value="">Tất cả loại</option>
            <option value="LOW_STOCK">Thiếu hàng</option>
            <option value="OVERSTOCK">Tồn vượt mức</option>
          </Select>
        </div>

        <DataTable
          columns={alertColumns}
          rows={visibleAlerts}
          loading={loading}
          error={alertError}
          onRetry={refresh}
          emptyMessage={
            alertSearch
              ? 'Không tìm thấy cảnh báo phù hợp trên trang hiện tại.'
              : 'Không có cảnh báo theo bộ lọc đã chọn.'
          }
        />

        <Pagination
          page={alerts.page}
          totalPages={alerts.totalPages}
          totalElements={alerts.totalElements}
          noun="cảnh báo"
          onPageChange={(page) => {
            setAlerts((current) => ({
              ...current,
              page,
            }))
          }}
        />
      </section>

      <section className="card alert-section">
        <div className="alert-section-heading">
          <div>
            <h2>Chính sách tồn kho</h2>
            <p>
              Thiết lập mức tối thiểu, tối đa, tồn an toàn
              và thời gian cung ứng cho từng sản phẩm.
            </p>
          </div>
        </div>

        <div className="alert-filter-bar policy-filter-bar">
          <div className="alert-search">
            <Input
              value={policySearch}
              onChange={(event) =>
                setPolicySearch(event.target.value)
              }
              placeholder="Tìm SKU hoặc tên sản phẩm..."
              aria-label="Tìm chính sách trong trang hiện tại"
            />
            <small>
              Tìm kiếm trong {policies.content.length} chính
              sách của trang đang mở.
            </small>
          </div>
        </div>

        <DataTable
          columns={policyColumns}
          rows={visiblePolicies}
          loading={loading}
          error={policyError}
          onRetry={refresh}
          emptyMessage={
            policySearch
              ? 'Không tìm thấy chính sách phù hợp trên trang hiện tại.'
              : 'Chưa có chính sách tồn kho. Hãy thiết lập ngưỡng cho sản phẩm cần theo dõi.'
          }
        />

        <Pagination
          page={policies.page}
          totalPages={policies.totalPages}
          totalElements={policies.totalElements}
          noun="chính sách"
          onPageChange={(page) => {
            setPolicies((current) => ({
              ...current,
              page,
            }))
          }}
        />
      </section>

      {policyOpen && (
        <Modal
          title={
            editing
              ? 'Cập nhật chính sách tồn kho'
              : 'Thiết lập chính sách tồn kho'
          }
          onClose={closePolicy}
        >
          <form
            className="modal-body alert-policy-form"
            onSubmit={savePolicy}
          >
            <Field
              label="Sản phẩm"
              hint={
                editing
                  ? 'Không thể đổi sản phẩm của chính sách hiện tại.'
                  : 'Chọn sản phẩm đang hoạt động cần theo dõi.'
              }
            >
              <Select
                value={selectedProductId}
                disabled={editing || productsLoading}
                onChange={(event) =>
                  setSelectedProductId(event.target.value)
                }
                required
              >
                <option value="">
                  {productsLoading
                    ? 'Đang tải sản phẩm…'
                    : 'Chọn sản phẩm'}
                </option>

                {products.map((product) => (
                  <option
                    key={product.id}
                    value={product.id}
                  >
                    {product.sku} — {product.name}
                  </option>
                ))}
              </Select>
            </Field>

            {productError && (
              <div className="alert-inline-error">
                {productError}
                <Button
                  size="small"
                  variant="secondary"
                  onClick={loadProducts}
                >
                  Tải lại
                </Button>
              </div>
            )}

            <div className="alert-policy-grid">
              <Field label="Tồn tối thiểu">
                <Input
                  type="number"
                  min="0"
                  step="1"
                  value={form.minimumQuantity}
                  onChange={(event) =>
                    updateForm(
                      'minimumQuantity',
                      event.target.value,
                    )
                  }
                  placeholder="Ví dụ: 20"
                  required
                />
              </Field>

              <Field
                label="Tồn tối đa"
                hint="Để trống nếu không cần giới hạn trên."
              >
                <Input
                  type="number"
                  min="0"
                  step="1"
                  value={form.maximumQuantity}
                  onChange={(event) =>
                    updateForm(
                      'maximumQuantity',
                      event.target.value,
                    )
                  }
                  placeholder="Không giới hạn"
                />
              </Field>

              <Field label="Tồn an toàn">
                <Input
                  type="number"
                  min="0"
                  step="1"
                  value={form.safetyStock}
                  onChange={(event) =>
                    updateForm(
                      'safetyStock',
                      event.target.value,
                    )
                  }
                  placeholder="Ví dụ: 35"
                  required
                />
              </Field>

              <Field
                label="Thời gian cung ứng (ngày)"
                hint="Thời gian dự kiến để bổ sung hàng."
              >
                <Input
                  type="number"
                  min="0"
                  step="1"
                  value={form.leadTimeDays}
                  onChange={(event) =>
                    updateForm(
                      'leadTimeDays',
                      event.target.value,
                    )
                  }
                  placeholder="Ví dụ: 7"
                  required
                />
              </Field>
            </div>

            {formError && (
              <div
                className="alert-inline-error"
                role="alert"
              >
                {formError}
              </div>
            )}

            <div className="alert-policy-note">
              Lưu chính sách sẽ khiến Backend đánh giá lại
              tình trạng tồn kho của sản phẩm. Việc này
              không tự tạo phiếu nhập hoặc xuất.
            </div>

            <div className="modal-actions">
              <Button
                variant="secondary"
                type="button"
                onClick={closePolicy}
                disabled={saving}
              >
                Hủy
              </Button>

              <Button
                type="submit"
                disabled={saving || productsLoading}
              >
                {saving
                  ? 'Đang lưu…'
                  : editing
                    ? 'Lưu thay đổi'
                    : 'Tạo chính sách'}
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {selectedAlert && (
        <Modal
          title="Chi tiết cảnh báo"
          onClose={() => setSelectedAlert(null)}
        >
          <div className="modal-body alert-detail">
            <div className="alert-detail-title">
              <div>
                <strong>
                  {selectedAlert.productName}
                </strong>
                <small>{selectedAlert.sku}</small>
              </div>

              <StatusBadge
                status={selectedAlert.status}
                labels={STATUS_LABELS}
              />
            </div>

            <div className="alert-detail-grid">
              <div>
                <span>Loại cảnh báo</span>
                <strong>
                  {TYPE_LABELS[selectedAlert.alertType] ??
                    selectedAlert.alertType}
                </strong>
              </div>

              <div>
                <span>Tồn hiện tại</span>
                <strong>
                  {formatNumber(
                    selectedAlert.currentQuantity,
                  )}
                </strong>
              </div>

              <div>
                <span>Đề xuất bổ sung</span>
                <strong>
                  {formatNumber(
                    selectedAlert.suggestedQuantity,
                  )}
                </strong>
              </div>

              <div>
                <span>Thời điểm phát sinh</span>
                <strong>
                  {formatDate(selectedAlert.createdAt)}
                </strong>
              </div>

              <div>
                <span>Thời điểm ghi nhận</span>
                <strong>
                  {formatDate(
                    selectedAlert.acknowledgedAt,
                  )}
                </strong>
              </div>

              <div>
                <span>Thời điểm xử lý</span>
                <strong>
                  {formatDate(selectedAlert.resolvedAt)}
                </strong>
              </div>
            </div>

            <div className="alert-detail-message">
              <strong>Nguyên nhân / nội dung</strong>
              <p>
                {selectedAlert.message ||
                  'Backend không trả về nội dung chi tiết.'}
              </p>
            </div>

            <div className="modal-actions">
              <Button
                variant="secondary"
                onClick={() => setSelectedAlert(null)}
              >
                Đóng
              </Button>

              {selectedAlert.status === 'NEW' && (
                <Button
                  disabled={saving}
                  onClick={() =>
                    acknowledgeAlert(selectedAlert)
                  }
                >
                  Ghi nhận
                </Button>
              )}

              {selectedAlert.status !== 'RESOLVED' && (
                <Button
                  variant="danger"
                  disabled={saving}
                  onClick={() =>
                    setResolveTarget(selectedAlert)
                  }
                >
                  Đóng cảnh báo
                </Button>
              )}
            </div>
          </div>
        </Modal>
      )}

      {resolveTarget && (
        <ConfirmDialog
          title="Xác nhận xử lý cảnh báo"
          message={
            `Bạn đang đóng cảnh báo "${resolveTarget.productName}" ` +
            `(${resolveTarget.sku}). Chỉ xác nhận khi vấn đề đã ` +
            'được kiểm tra và xử lý theo quy trình kho.'
          }
          confirmLabel="Xác nhận đã xử lý"
          dangerous
          busy={saving}
          onConfirm={resolveAlert}
          onClose={() => {
            if (!saving) setResolveTarget(null)
          }}
        />
      )}
    </div>
  )
}