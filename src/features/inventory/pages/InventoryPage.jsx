import { useEffect, useMemo, useState } from 'react'

import usePagedResource from '../../../shared/hooks/usePagedResource.js'

import {
  Button,
  DataTable,
  FilterBar,
  PageHeader,
  Pagination,
  SearchBar,
  Select,
  StatusBadge,
  useToast,
} from '../../../shared/ui/index.js'

import { categoryApi } from '../../categories/api/categoryApi.js'
import { productApi } from '../../products/api/productApi.js'
import { inventoryApi } from '../api/inventoryApi.js'

const PAGE_SIZE = 20

const STOCK_LABELS = {
  IN_STOCK: 'Còn hàng',
  OUT_OF_STOCK: 'Hết hàng',
  MISSING_BALANCE: 'Chưa khởi tạo',
}

const SOURCE_LABELS = {
  STOCKTAKE: 'Điều chỉnh kiểm kê',
  INBOUND: 'Nhập kho',
  OUTBOUND: 'Xuất kho',
}

const numberFormat = new Intl.NumberFormat('vi-VN')

function formatNumber(value) {
  return value == null
    ? '—'
    : numberFormat.format(value)
}

function formatDate(value) {
  if (!value) return '—'

  const date = new Date(value)

  if (Number.isNaN(date.getTime())) return '—'

  return new Intl.DateTimeFormat('vi-VN', {
    dateStyle: 'short',
    timeStyle: 'short',
  }).format(date)
}

function toIsoDateTime(value) {
  if (!value) return ''

  const date = new Date(value)

  return Number.isNaN(date.getTime())
    ? ''
    : date.toISOString()
}

function stockStatus(quantity) {
  if (quantity == null) return 'MISSING_BALANCE'

  return quantity <= 0
    ? 'OUT_OF_STOCK'
    : 'IN_STOCK'
}

export default function InventoryPage() {
  const { notify } = useToast()

  const [categories, setCategories] = useState([])
  const [categoryError, setCategoryError] = useState('')
  const [categoryLoading, setCategoryLoading] = useState(true)

  const [productSearch, setProductSearch] = useState('')

  const [productDraft, setProductDraft] = useState({
    categoryId: '',
    status: 'ACTIVE',
  })

  const [productFilters, setProductFilters] = useState({
    status: 'ACTIVE',
  })

  const stableProductFilters = useMemo(
    () => productFilters,
    [productFilters]
  )

  const productList = usePagedResource(
    productApi.list,
    {
      size: PAGE_SIZE,
      sort: 'sku,asc',
      filters: stableProductFilters,
    }
  )

  const [showTransactions, setShowTransactions] = useState(false)

  const [transactionSearch, setTransactionSearch] = useState('')

  const [transactionDraft, setTransactionDraft] = useState({
    source: '',
    from: '',
    to: '',
  })

  const [transactionFilters, setTransactionFilters] = useState({})

  const stableTransactionFilters = useMemo(
    () => transactionFilters,
    [transactionFilters]
  )

  const transactions = usePagedResource(
    inventoryApi.listTransactions,
    {
      size: PAGE_SIZE,
      sort: 'createdAt,desc',
      filters: stableTransactionFilters,
      enabled: showTransactions,
    }
  )

  /*
   * Tải danh mục có thể hủy khi rời trang.
   */
  useEffect(() => {
    const controller = new AbortController()

    categoryApi
      .list(
        {
          page: 0,
          size: 100,
          sort: 'name,asc',
        },
        {
          signal: controller.signal,
        }
      )
      .then((result) => {
        if (!controller.signal.aborted) {
          setCategories(result.content)
        }
      })
      .catch((error) => {
        if (!controller.signal.aborted) {
          setCategoryError(error.message)
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) {
          setCategoryLoading(false)
        }
      })

    return () => controller.abort()
  }, [])

  function applyProductFilters(event) {
    event.preventDefault()

    productList.beginChange()
    productList.setPage(0)

    setProductFilters({
      search: productSearch.trim(),
      categoryId: productDraft.categoryId,
      status: productDraft.status,
    })
  }

  function applyTransactionFilters(event) {
    event.preventDefault()

    const from = toIsoDateTime(transactionDraft.from)
    const to = toIsoDateTime(transactionDraft.to)

    if (from && to && new Date(from) > new Date(to)) {
      notify(
        'Thời điểm bắt đầu phải trước thời điểm kết thúc.',
        'error'
      )
      return
    }

    transactions.beginChange()
    transactions.setPage(0)

    setTransactionFilters({
      search: transactionSearch.trim(),
      source: transactionDraft.source,
      from,
      to,
    })
  }

  async function refreshAll() {
    const tasks = [
      productList.load(),
    ]

    if (showTransactions) {
      tasks.push(transactions.load())
    }

    await Promise.all(tasks)
  }

  const productColumns = [
    {
      key: 'sku',
      label: 'SKU',
      render: (row) => <strong>{row.sku}</strong>,
    },
    {
      key: 'name',
      label: 'Sản phẩm',
    },
    {
      key: 'categoryName',
      label: 'Danh mục',
    },
    {
      key: 'quantityOnHand',
      label: 'Tồn hiện tại',
      render: (row) => (
        <strong className="inventory-quantity">
          {formatNumber(row.quantityOnHand)}
        </strong>
      ),
    },
    {
      key: 'unitSymbol',
      label: 'Đơn vị',
      render: (row) => row.unitSymbol || '—',
    },
    {
      key: 'stockStatus',
      label: 'Tình trạng tồn',
      render: (row) => (
        <StatusBadge
          status={stockStatus(row.quantityOnHand)}
          labels={STOCK_LABELS}
        />
      ),
    },
    {
      key: 'status',
      label: 'Trạng thái sản phẩm',
      render: (row) => (
        <StatusBadge
          status={row.status}
          labels={{
            ACTIVE: 'Đang hoạt động',
            INACTIVE: 'Ngừng hoạt động',
          }}
        />
      ),
    },
  ]

  const transactionColumns = [
    {
      key: 'createdAt',
      label: 'Thời điểm',
      render: (row) => formatDate(row.createdAt),
    },
    {
      key: 'product',
      label: 'Sản phẩm',
      render: (row) => (
        <div className="inventory-product-cell">
          <strong>{row.productName}</strong>
          <small>{row.sku}</small>
        </div>
      ),
    },
    {
      key: 'source',
      label: 'Nghiệp vụ',
      render: (row) => (
        <StatusBadge
          status={row.source}
          labels={SOURCE_LABELS}
        />
      ),
    },
    {
      key: 'sourceReference',
      label: 'Mã tham chiếu',
      render: (row) => (
        <span className="inventory-reference">
          {row.sourceReference || '—'}
        </span>
      ),
    },
    {
      key: 'quantityDelta',
      label: 'Biến động',
      render: (row) => (
        <strong
          className={
            row.quantityDelta > 0
              ? 'inventory-delta positive'
              : 'inventory-delta negative'
          }
        >
          {row.quantityDelta > 0 ? '+' : ''}
          {formatNumber(row.quantityDelta)} {row.unitSymbol}
        </strong>
      ),
    },
  ]

  const pageProducts = productList.result.content

  const zeroStockOnPage = pageProducts.filter(
    (item) => item.quantityOnHand === 0
  ).length

  const missingBalanceOnPage = pageProducts.filter(
    (item) => item.quantityOnHand == null
  ).length

  const availableOnPage = pageProducts.filter(
    (item) => item.quantityOnHand > 0
  ).length

  return (
    <div className="page inventory-page">
      <PageHeader
        title="Quản lý tồn kho"
        description="Tra cứu số dư tồn kho theo SKU, đơn vị tính và theo dõi lịch sử biến động đã được ghi nhận."
        actions={
          <Button
            variant="secondary"
            onClick={refreshAll}
          >
            ↻ Làm mới dữ liệu
          </Button>
        }
      />

      <div className="inventory-operating-note">
        <strong>Nguyên tắc quản lý tồn</strong>
        <span>
          Màn hình này chỉ tra cứu số dư và sổ giao dịch.
          Không chỉnh sửa số tồn trực tiếp; mọi thay đổi
          phải đi qua nghiệp vụ được phê duyệt và ghi nhận
          vào sổ giao dịch.
        </span>
      </div>

      <section className="inventory-summary-grid">
        <article className="inventory-summary-card">
          <span>Sản phẩm trong kết quả</span>
          <strong>
            {formatNumber(productList.result.totalElements)}
          </strong>
          <small>Theo bộ lọc đang áp dụng</small>
        </article>

        <article className="inventory-summary-card">
          <span>Còn hàng trên trang</span>
          <strong>{formatNumber(availableOnPage)}</strong>
          <small>
            Trong {pageProducts.length} sản phẩm đang hiển thị
          </small>
        </article>

        <article className="inventory-summary-card warning">
          <span>Đang hết hàng trên trang</span>
          <strong>{formatNumber(zeroStockOnPage)}</strong>
          <small>Số dư bằng 0</small>
        </article>

        <article className="inventory-summary-card muted">
          <span>Chưa có số dư trên trang</span>
          <strong>{formatNumber(missingBalanceOnPage)}</strong>
          <small>Cần kiểm tra dữ liệu nền</small>
        </article>
      </section>

      <section className="card inventory-section">
        <div className="inventory-section-heading">
          <div>
            <h2>Số dư tồn kho</h2>
            <p>
              Số lượng hiện tại của từng sản phẩm.
              Số liệu được lấy từ API nội bộ của Backend.
            </p>
          </div>
        </div>

        <FilterBar
          className="inventory-filter-bar"
          onSubmit={applyProductFilters}
        >
          <SearchBar
            value={productSearch}
            onChange={setProductSearch}
            label="Tìm sản phẩm trong tồn kho"
            placeholder="Tìm SKU hoặc tên sản phẩm…"
            buttonLabel="Tìm kiếm"
          />

          <Select
            aria-label="Lọc danh mục sản phẩm"
            value={productDraft.categoryId}
            disabled={categoryLoading}
            onChange={(event) =>
              setProductDraft((current) => ({
                ...current,
                categoryId: event.target.value,
              }))
            }
          >
            <option value="">Tất cả danh mục</option>

            {categories.map((category) => (
              <option
                key={category.id}
                value={category.id}
              >
                {category.name}
              </option>
            ))}
          </Select>

          <Select
            aria-label="Lọc trạng thái sản phẩm"
            value={productDraft.status}
            onChange={(event) =>
              setProductDraft((current) => ({
                ...current,
                status: event.target.value,
              }))
            }
          >
            <option value="">Tất cả trạng thái</option>
            <option value="ACTIVE">Đang hoạt động</option>
            <option value="INACTIVE">Ngừng hoạt động</option>
          </Select>
        </FilterBar>

        {categoryError && (
          <div className="notice error inventory-notice">
            Không tải được danh mục lọc: {categoryError}
          </div>
        )}

        <DataTable
          columns={productColumns}
          rows={pageProducts}
          loading={productList.loading}
          error={productList.error}
          onRetry={productList.load}
          emptyMessage="Không tìm thấy sản phẩm phù hợp với bộ lọc."
        />

        <Pagination
          page={productList.page}
          totalPages={productList.result.totalPages}
          totalElements={productList.result.totalElements}
          noun="sản phẩm"
          onPageChange={(page) => {
            productList.beginChange()
            productList.setPage(page)
          }}
        />
      </section>

      <section className="card inventory-section">
        <div className="inventory-section-heading">
          <div>
            <h2>Sổ giao dịch tồn kho</h2>
            <p>
              Nhật ký các biến động tồn kho đã ghi nhận.
              Lịch sử được tải theo yêu cầu để giảm thời gian
              mở trang Tồn kho.
            </p>
          </div>

          <Button
            variant="secondary"
            onClick={() =>
              setShowTransactions((value) => !value)
            }
          >
            {showTransactions
              ? 'Ẩn lịch sử'
              : 'Tải lịch sử giao dịch'}
          </Button>
        </div>

        {showTransactions && (
          <>
            <FilterBar
              className="inventory-transaction-filter"
              onSubmit={applyTransactionFilters}
            >
              <SearchBar
                value={transactionSearch}
                onChange={setTransactionSearch}
                label="Tìm giao dịch theo sản phẩm"
                placeholder="SKU hoặc tên sản phẩm…"
                buttonLabel="Tìm"
              />

              <Select
                aria-label="Lọc nghiệp vụ giao dịch"
                value={transactionDraft.source}
                onChange={(event) =>
                  setTransactionDraft((current) => ({
                    ...current,
                    source: event.target.value,
                  }))
                }
              >
                <option value="">Tất cả nghiệp vụ</option>
                <option value="STOCKTAKE">
                  Điều chỉnh kiểm kê
                </option>
                <option value="INBOUND">Nhập kho</option>
                <option value="OUTBOUND">Xuất kho</option>
              </Select>

              <label className="inventory-date-field">
                <span>Từ thời điểm</span>
                <input
                  className="input"
                  type="datetime-local"
                  value={transactionDraft.from}
                  onChange={(event) =>
                    setTransactionDraft((current) => ({
                      ...current,
                      from: event.target.value,
                    }))
                  }
                />
              </label>

              <label className="inventory-date-field">
                <span>Đến thời điểm</span>
                <input
                  className="input"
                  type="datetime-local"
                  value={transactionDraft.to}
                  onChange={(event) =>
                    setTransactionDraft((current) => ({
                      ...current,
                      to: event.target.value,
                    }))
                  }
                />
              </label>
            </FilterBar>

            <DataTable
              columns={transactionColumns}
              rows={transactions.result.content}
              loading={transactions.loading}
              error={transactions.error}
              onRetry={transactions.load}
              emptyMessage="Chưa có giao dịch phù hợp. Nếu chưa có biến động được ghi nhận, bảng sẽ để trống."
            />

            <Pagination
              page={transactions.page}
              totalPages={transactions.result.totalPages}
              totalElements={transactions.result.totalElements}
              noun="giao dịch"
              onPageChange={(page) => {
                transactions.beginChange()
                transactions.setPage(page)
              }}
            />
          </>
        )}
      </section>
    </div>
  )
}