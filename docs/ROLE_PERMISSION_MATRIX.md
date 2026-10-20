# Role Permission Matrix

Backend là nguồn thực thi quyền chính thức. Bảng này điều khiển navigation và action visibility ở frontend.

| Route / chức năng | ADMIN | MANAGER | STAFF | DEALER |
|---|:---:|:---:|:---:|:---:|
| `/dashboard` | — | ✓ | — | — |
| `/products` | — | quản lý | chỉ đọc + tồn | ACTIVE, không tồn |
| `/categories` | — | quản lý | — | — |
| `/units` | — | quản lý | — | — |
| `/suppliers` | — | quản lý | — | — |
| `/dealers` | — | quản lý | — | — |
| `/dealer-requests` | — | xét duyệt | — | tạo/xem của mình |
| `/inbound` | — | giám sát | thao tác nghiệp vụ | — |
| `/outbound` | — | giám sát | thao tác nghiệp vụ | — |
| `/inventory` | — | xem | xem | — |
| `/stocktaking` | — | quản lý/phê duyệt | kiểm đếm | — |
| `/identification` | — | — | tra cứu/quét | — |
| `/ai-forecast` | — | xem | — | — |
| `/alerts` | — | quản lý | — | — |
| `/reports` | — | xem | — | — |
| `/admin/users` | ✓ | — | — | — |
| `/admin/roles` | ✓ | — | — | — |
| `/admin/audit` | ✓ | — | — | — |

Quy ước: MANAGER = `WAREHOUSE_MANAGER`, STAFF = `WAREHOUSE_STAFF`. ADMIN không mặc định có quyền chỉnh master data hoặc nghiệp vụ kho.
