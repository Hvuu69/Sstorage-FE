# How to Add a Feature

## 1. Clone và tạo branch

```bash
git clone <repository-url>
git switch develop
git pull
git switch -c feature/<feature-name>
```

Không làm việc trực tiếp trên branch dùng chung.

## 2. Cài dependency

```bash
cd Sstorage-FE
npm install
```

Không thêm dependency mới nếu shared foundation đã có khả năng tương đương.

## 3. Cấu hình môi trường

Copy `.env.example` thành `.env.local`:

```env
VITE_API_BASE_URL=http://localhost:8081
```

Dev preview tùy chọn:

```env
VITE_ENABLE_DEV_AUTH=true
VITE_DEV_AUTH_ROLE=WAREHOUSE_MANAGER
```

Không commit secret. Preview identity không gửi JWT tới Backend.

## 4. Chạy ứng dụng

```bash
npm run dev
```

## 5. Tạo feature

```text
src/features/example/
├── api/exampleApi.js
├── pages/ExamplePage.jsx
└── components/            # chỉ tạo khi cần
```

## 6. Khai báo route

Thêm metadata một lần trong `src/app/routeConfig.js`, sau đó ánh xạ page theo `module` trong `AppRouter.jsx`. Sidebar tự sinh từ metadata và role.

## 7. Gọi API

Trong `exampleApi.js`, dùng shared client:

```js
import { request } from '../../../shared/api/http.js'

export const exampleApi = {
  list: (query, options = {}) => request('/api/v1/examples', { query, signal: options.signal }),
}
```

Không viết URL trong component và không gọi Supabase trực tiếp.

## 8. Dùng shared component

```js
import { Button, DataTable, PageHeader, useToast } from '../../../shared/ui/index.js'
```

Nếu pattern thực sự dùng chung nhưng chưa có, đề xuất thay đổi shared component trong PR và nêu tác động tới các feature khác.

## 9. Kiểm tra RBAC

- Thêm đúng role vào route config.
- Ẩn action trái quyền bằng `PermissionGate` hoặc current user role.
- Kiểm tra Dealer ownership và dữ liệu nhạy cảm ở Backend, không tin client.
- Anonymous không nhận quyền mặc định.

## 10. Viết test và tạo Pull Request

Test tối thiểu: API contract, loading/error/empty, quyền hiển thị, validation và flow chính. Chạy:

```bash
npm run test
npm run lint
npm run build
git diff --check
```

PR phải ghi rõ route/API mới, role, file shared đã sửa, test đã chạy, dependency và giới hạn còn lại. Không đưa code demo/localStorage database vào production path.
