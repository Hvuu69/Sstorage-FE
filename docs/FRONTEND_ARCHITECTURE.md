# Frontend Architecture

## Mục tiêu

`Sstorage-FE` là React JavaScript + Vite application dùng chung. Frontend chỉ gọi Spring Boot REST API; không gọi trực tiếp Supabase và không lưu dữ liệu nghiệp vụ trong `localStorage`.

## Cấu trúc

```text
src/
├── app/                  # composition root, router và route metadata
├── features/             # code thuộc từng domain/UC
│   └── <feature>/
│       ├── api/          # REST adapter của feature
│       ├── pages/        # route-level components
│       ├── components/   # component chỉ dùng trong feature (khi cần)
│       ├── hooks/        # hook chỉ dùng trong feature (khi cần)
│       └── utils/        # helper thuần của feature (khi cần)
└── shared/
    ├── api/              # HTTP transport, ProblemDetail, token bridge
    ├── hooks/            # hook dùng bởi nhiều feature
    ├── layout/           # MainLayout/AuthLayout/Sidebar/Header
    └── ui/               # design-system components
```

Không tạo thư mục rỗng. Chỉ thêm tầng con khi feature thực sự cần.

## Luồng runtime

```text
main.jsx
  → App
    → BrowserRouter
      → AuthProvider
        → ToastProvider
          → AppRouter
            → ProtectedRoute
              → MainLayout
                → Feature Page
                  → Feature API
                    → shared request()
                      → Spring Boot
```

## Routing

`src/app/routeConfig.js` là nguồn duy nhất cho path, nhãn sidebar, role và trạng thái module. `AppRouter.jsx` ánh xạ metadata sang page component. Feature developer không sửa `App.jsx`.

## Authentication

`AuthProvider` không phát hành JWT. Auth module cung cấp `authAdapter.restoreSession()`, `authAdapter.logout()` và gọi `establishSession()` với:

```js
{ userId, email, fullName, role, dealerId, accessToken }
```

401 xóa session frontend; 403 giữ session và hiển thị lỗi quyền. Backend vẫn là nơi thực thi RBAC chính thức.

Development preview chỉ bật khi Vite chạy development và `VITE_ENABLE_DEV_AUTH=true`. Preview user không có token nên không thể giả mạo Bearer token tới Backend.

## API

`shared/api/http.js` chịu trách nhiệm base URL, Bearer token, cookie credentials, query string, JSON/text, request cancellation, network error và RFC 7807 ProblemDetail. Mỗi feature sở hữu endpoint adapter của mình; component không chứa URL Backend.

## State

- Server state nhỏ hiện dùng feature hooks và request async.
- Không có global business-data store hoặc localStorage database.
- Auth và toast là application-wide context.
- Chỉ bổ sung state library khi có use case chứng minh nhu cầu.

## Styling

Design tokens và shared component styles nằm trong `index.css` và `App.css`. Prototype `Smart_Warehouse_UI_Fixed` là tham chiếu UX, không phải data/auth implementation.
