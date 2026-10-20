# Frontend Module Contract

## Feature contract

Một feature đã tích hợp tối thiểu có:

```text
features/<feature>/
├── api/<feature>Api.js
└── pages/<Feature>Page.jsx
```

Page phải dùng shared layout gián tiếp qua router, shared UI cho pattern chung và feature API cho dữ liệu. Không import implementation nội bộ của feature khác; nếu cần master data, import public API adapter của feature sở hữu dữ liệu.

## Route contract

Khai báo một entry trong `appRoutes`:

```js
{
  path: '/example',
  label: 'Ví dụ',
  icon: '◇',
  group: 'Vận hành',
  roles: [ROLES.WAREHOUSE_MANAGER],
  module: 'example',
  status: 'active', // active | foundation | pending
}
```

Sau đó ánh xạ `module` sang page trong `AppRouter.jsx`. Không hardcode lại path trong Sidebar.

## Auth contract

`CurrentUser`:

| Field | Kiểu | Ghi chú |
|---|---|---|
| userId | string | Bắt buộc |
| email | string | Bắt buộc |
| fullName | string | Bắt buộc |
| role | enum | ADMIN, WAREHOUSE_MANAGER, WAREHOUSE_STAFF, DEALER |
| dealerId | string/null | Bắt buộc với tài khoản Dealer khi Auth thật tích hợp |
| accessToken | string/null | JWT do Auth module/backend cấp |

UI action có thể dùng `PermissionGate` hoặc kiểm tra role để ẩn thao tác. API Backend vẫn phải kiểm tra role và ownership.

## API contract

- Dùng `request(path, { method, query, body, signal })`.
- List phân trang trả qua `normalizePage()`.
- Ném `ApiError` với `status`, `errorCode`, `fieldErrors`, `problem`.
- 401/403 được xử lý tập trung.
- Không gọi Supabase SDK cho nghiệp vụ.
- Không tự đoán endpoint chưa thống nhất.

## UI contract

Ưu tiên import từ `shared/ui/index.js`: Button, Input, Select, Modal, ConfirmDialog, DataTable, Pagination, SearchBar, FilterBar, StatusBadge, async states, PageHeader và toast.

Feature không tạo bản sao Button/Modal/Table. Component đặc thù domain được giữ trong `features/<feature>/components`.

## Module chưa có API

Dùng `PendingFeaturePage`: mô tả đúng phạm vi, ghi rõ chờ API, không có dữ liệu giả và không có hành động báo thành công giả.
