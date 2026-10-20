# UI Migration Progress

Last updated: 2026-10-20

## Hoạt động với API thật

| Module | Route | Trạng thái |
|---|---|---|
| Product | `/products` | List/detail/create/update/status, search/filter/pagination, role-specific stock visibility |
| Category | `/categories` | List/create/update/status, search/pagination |
| Unit | `/units` | List/create/update, search/pagination; không có status theo DDL |

## Foundation, chưa có API nghiệp vụ

- `/dashboard`: bố cục dashboard, không có metric giả.
- `/suppliers`, `/dealers`, `/dealer-requests`.
- `/inbound`, `/outbound`, `/inventory`, `/stocktaking`, `/identification`.
- `/ai-forecast`, `/alerts`, `/reports`.
- `/admin/users`, `/admin/roles`, `/admin/audit`.

Các route trên có shell, navigation, RBAC và trạng thái chờ tích hợp; không mô phỏng thành công.

## Shared foundation hoàn thành

- MainLayout, AuthLayout, Sidebar, Header, Breadcrumb.
- Central route registry và role-based navigation.
- AuthProvider, ProtectedRoute, PermissionGate và logout contract.
- HTTP client, token bridge, ProblemDetail, query/page normalization, 401/403/network handling.
- Shared design system và async states.
- Development preview được cô lập bằng environment flag, không có fake JWT.

## Chưa triển khai

- Auth/login API thật và refresh-token policy.
- Dealer CRUD và các API thuộc UC khác ngoài UC-05.
- Browser E2E với Backend/Supabase thật.
- Dữ liệu dashboard/AI/report thực.

Prototype TypeScript/localStorage không được đưa vào production data layer.
