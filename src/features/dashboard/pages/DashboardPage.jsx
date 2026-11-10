import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { alertApi } from '../../alerts/api/alertApi.js'
import { dealerRequestApi } from '../../dealer-requests/api/dealerRequestApi.js'
import { productApi } from '../../products/api/productApi.js'
import {
  Button,
  PageHeader,
  StatusBadge,
} from '../../../shared/ui/index.js'

const STATUS_LABELS = {
  NEW: 'Mới',
  ACKNOWLEDGED: 'Đã ghi nhận',
  RESOLVED: 'Đã xử lý',
}

const TYPE_LABELS = {
  LOW_STOCK: 'Thiếu hàng',
  OVERSTOCK: 'Tồn vượt mức',
}

const numberFormat = new Intl.NumberFormat('vi-VN')

const formatNumber = (value) =>
  value == null ? '—' : numberFormat.format(value)

function formatDate(value) {
  if (!value) return '—'

  const date = new Date(value)

  if (Number.isNaN(date.getTime())) return '—'

  return new Intl.DateTimeFormat('vi-VN', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(date)
}

function MetricCard({
  label,
  value,
  description,
  href,
  tone = 'blue',
  loading,
}) {
  const content = (
    <>
      <span className="dashboard-metric-label">
        {label}
      </span>

      <strong className="dashboard-metric-value">
        {loading ? (
          <span className="dashboard-value-skeleton" />
        ) : (
          formatNumber(value)
        )}
      </strong>

      <span className="dashboard-metric-description">
        {description}
      </span>

      {href && (
        <span className="dashboard-metric-link">
          Mở danh sách <span aria-hidden="true">→</span>
        </span>
      )}
    </>
  )

  return href ? (
    <Link
      className={`dashboard-metric-card ${tone}`}
      to={href}
    >
      {content}
    </Link>
  ) : (
    <section className={`dashboard-metric-card ${tone}`}>
      {content}
    </section>
  )
}

export default function DashboardPage() {
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  const [data, setData] = useState({
    activeProducts: null,
    pendingRequests: null,
    alertsToHandle: null,
    configuredPolicies: null,
    recentAlerts: [],
  })

  const [errors, setErrors] = useState([])
  const [updatedAt, setUpdatedAt] = useState(null)

  const loadDashboard = useCallback(
    async (signal, isRefresh = false) => {
      if (isRefresh) {
        setRefreshing(true)
      } else {
        setLoading(true)
      }

      const results = await Promise.allSettled([
        // Số sản phẩm đang hoạt động.
        productApi.list(
          {
            page: 0,
            size: 1,
            status: 'ACTIVE',
          },
          { signal },
        ),

        // Số yêu cầu đại lý chờ duyệt.
        dealerRequestApi.listAll(
          {
            page: 0,
            size: 1,
            status: 'PENDING',
          },
          { signal },
        ),

        // Số cảnh báo mới.
        alertApi.list(
          {
            page: 0,
            size: 1,
            status: 'NEW',
          },
          { signal },
        ),

        // Số cảnh báo đã ghi nhận.
        alertApi.list(
          {
            page: 0,
            size: 1,
            status: 'ACKNOWLEDGED',
          },
          { signal },
        ),

        // Số chính sách tồn kho.
        alertApi.listPolicies(
          {
            page: 0,
            size: 1,
            sort: 'updatedAt,desc',
          },
          { signal },
        ),

        // Năm cảnh báo mới nhất.
        alertApi.list(
          {
            page: 0,
            size: 5,
            sort: 'createdAt,desc',
          },
          { signal },
        ),
      ])

      if (signal?.aborted) return

      const valueAt = (index) =>
        results[index].status === 'fulfilled'
          ? results[index].value
          : null

      const newAlertPage = valueAt(2)
      const acknowledgedPage = valueAt(3)

      setData({
        activeProducts:
          valueAt(0)?.totalElements ?? null,

        pendingRequests:
          valueAt(1)?.totalElements ?? null,

        alertsToHandle:
          newAlertPage && acknowledgedPage
            ? newAlertPage.totalElements +
              acknowledgedPage.totalElements
            : null,

        configuredPolicies:
          valueAt(4)?.totalElements ?? null,

        recentAlerts:
          valueAt(5)?.content ?? [],
      })

      const labels = [
        'Danh mục sản phẩm',
        'Yêu cầu đại lý',
        'Cảnh báo mới',
        'Cảnh báo đã ghi nhận',
        'Chính sách tồn kho',
        'Cảnh báo gần đây',
      ]

      setErrors(
        results.flatMap((result, index) =>
          result.status === 'rejected'
            ? [
                `${labels[index]}: ${
                  result.reason?.message ??
                  'Không tải được dữ liệu.'
                }`,
              ]
            : [],
        ),
      )

      setUpdatedAt(new Date().toISOString())

      setLoading(false)
      setRefreshing(false)
    },
    [],
  )

  useEffect(() => {
    const controller = new AbortController()

    // Đồng bộ Dashboard với dữ liệu từ API.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadDashboard(controller.signal)

    return () => controller.abort()
  }, [loadDashboard])

  async function refresh() {
    const controller = new AbortController()

    await loadDashboard(
      controller.signal,
      true,
    )
  }

  const metricCards = [
    {
      label: 'Sản phẩm đang hoạt động',
      value: data.activeProducts,
      description: 'Tổng số mã hàng còn hiệu lực',
      href: '/products',
      tone: 'blue',
    },
    {
      label: 'Yêu cầu chờ duyệt',
      value: data.pendingRequests,
      description: 'Yêu cầu đại lý cần quản lý xem xét',
      href: '/dealer-requests',
      tone: 'amber',
    },
    {
      label: 'Cảnh báo cần xử lý',
      value: data.alertsToHandle,
      description: 'Bao gồm mới và đã ghi nhận',
      href: '/alerts',
      tone: 'red',
    },
    {
      label: 'Chính sách tồn kho',
      value: data.configuredPolicies,
      description: 'Sản phẩm đã được thiết lập ngưỡng',
      href: '/alerts',
      tone: 'green',
    },
  ]

  return (
    <div className="page dashboard-page">
      <PageHeader
        title="Tổng quan kho"
        description="Tình hình vận hành được tổng hợp trực tiếp từ dữ liệu hệ thống."
        actions={
          <Button
            variant="secondary"
            onClick={refresh}
            disabled={refreshing}
          >
            {refreshing
              ? 'Đang cập nhật…'
              : '↻ Làm mới dữ liệu'}
          </Button>
        }
      />

      <div className="dashboard-meta">
        <span className="dashboard-live-dot" />

        <span>Dữ liệu từ API hệ thống</span>

        <span className="dashboard-meta-separator">
          ·
        </span>

        <span>
          Đồng bộ lúc: {formatDate(updatedAt)}
        </span>
      </div>

      {errors.length > 0 && (
        <section
          className="dashboard-warning"
          role="status"
        >
          <strong>
            Một số dữ liệu chưa tải được
          </strong>

          <ul>
            {errors.map((message) => (
              <li key={message}>{message}</li>
            ))}
          </ul>

          <span>
            Các chỉ số lỗi được hiển thị bằng dấu
            gạch ngang, không thay bằng số liệu giả.
          </span>
        </section>
      )}

      <section
        className="dashboard-metrics"
        aria-label="Chỉ số vận hành"
      >
        {metricCards.map((metric) => (
          <MetricCard
            key={metric.label}
            {...metric}
            loading={loading}
          />
        ))}
      </section>

      <section className="dashboard-content-grid">
        <div className="card dashboard-panel">
          <div className="dashboard-panel-heading">
            <div>
              <h2>Cảnh báo gần đây</h2>
              <p>
                Những vấn đề tồn kho phát sinh mới nhất.
              </p>
            </div>

            <Link to="/alerts">
              Xem tất cả
            </Link>
          </div>

          {loading ? (
            <div className="dashboard-loading">
              Đang tải cảnh báo…
            </div>
          ) : data.recentAlerts.length === 0 ? (
            <div className="dashboard-empty">
              <strong>
                Chưa có cảnh báo để hiển thị
              </strong>

              <span>
                Khi có cảnh báo tồn kho, thông tin sẽ
                xuất hiện tại đây.
              </span>
            </div>
          ) : (
            <div className="dashboard-alert-list">
              {data.recentAlerts.map((alert) => (
                <article
                  className="dashboard-alert-item"
                  key={alert.id}
                >
                  <div className="dashboard-alert-main">
                    <strong>
                      {alert.sku} · {alert.productName}
                    </strong>

                    <span>{alert.message}</span>

                    <small>
                      {formatDate(alert.createdAt)}
                    </small>
                  </div>

                  <div className="dashboard-alert-tags">
                    <StatusBadge
                      status={alert.alertType}
                      labels={TYPE_LABELS}
                    />

                    <StatusBadge
                      status={alert.status}
                      labels={STATUS_LABELS}
                    />
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>

        <div className="card dashboard-panel dashboard-quick-panel">
          <div className="dashboard-panel-heading">
            <div>
              <h2>Truy cập nhanh</h2>
              <p>
                Các khu vực thường dùng trong vận hành kho.
              </p>
            </div>
          </div>

          <nav
            className="dashboard-shortcuts"
            aria-label="Truy cập nhanh"
          >
            <Link to="/products">
              <span className="shortcut-icon">▦</span>

              <span>
                <strong>Danh mục sản phẩm</strong>
                <small>
                  Tra cứu SKU và thông tin hàng hóa
                </small>
              </span>

              <b>→</b>
            </Link>

            <Link to="/dealer-requests">
              <span className="shortcut-icon">◩</span>

              <span>
                <strong>Yêu cầu đại lý</strong>
                <small>
                  Xem xét các yêu cầu đang chờ
                </small>
              </span>

              <b>→</b>
            </Link>

            <Link to="/alerts">
              <span className="shortcut-icon">!</span>

              <span>
                <strong>Cảnh báo tồn kho</strong>
                <small>
                  Theo dõi thiếu hàng và tồn vượt mức
                </small>
              </span>

              <b>→</b>
            </Link>

            <Link to="/identification">
              <span className="shortcut-icon">⌗</span>

              <span>
                <strong>QR & Barcode</strong>
                <small>
                  Tra cứu mã nhận diện sản phẩm
                </small>
              </span>

              <b>→</b>
            </Link>
          </nav>
        </div>
      </section>
    </div>
  )
}