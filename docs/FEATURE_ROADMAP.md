# Lộ trình triển khai Use Case Sstorage

**Phạm vi:** Backend Spring Boot và Frontend React/Vite  
**Cập nhật:** 2026-10-28

Tài liệu này sắp xếp 16 use case theo quan hệ phụ thuộc dữ liệu và nghiệp vụ. Frontend và backend có thể phát triển song song sau khi thống nhất API contract, nhưng không nên làm UI thành công giả trước khi API và quy tắc nghiệp vụ được chốt.

## Trạng thái hiện tại

| Use case | Trạng thái theo mã nguồn hiện tại |
|---|---|
| UC-01 Đăng nhập | Đã có backend JWT, trả hồ sơ người dùng và endpoint xác minh phiên; frontend login, role routing, ghi nhớ email và khôi phục/kiểm tra phiên. Còn cần kiểm thử end-to-end với môi trường triển khai thật. |
| UC-05 Sản phẩm và danh mục | Đã có CRUD, tìm kiếm/phân trang và kiểm soát quyền ở API/UI. |
| Đơn vị tính | Có CRUD API và frontend; đây là master data hỗ trợ UC-05, không có mã riêng trong bảng use case. |
| UC-15 Dashboard | Có khung giao diện, chưa có API/số liệu nghiệp vụ. |
| UC-02 | Đã có API quản trị tài khoản và giao diện Admin: tìm kiếm/lọc/phân trang, tạo/sửa, đặt lại mật khẩu, khóa/mở khóa; chưa có kiểm thử với database triển khai. |
| UC-03 Vai trò và phân quyền | Frontend có ma trận xem quyền vào route từ registry; backend vẫn dùng role cố định và annotation, chưa hỗ trợ chỉnh permission động. |
| UC-04, UC-06–14, UC-16 | Chưa có module nghiệp vụ hoàn chỉnh trong hai repo đã rà soát. |

## Các giai đoạn

### Giai đoạn 0 — Chốt nền tảng và xác nhận UC-01

**Mục tiêu:** làm ổn định hợp đồng API, xác thực và schema trước khi nhiều module cùng ghi dữ liệu.

- **Backend:** thống nhất response lỗi, phân trang, định dạng ID/thời gian; quản lý schema bằng migration có version; hoàn thiện profile người dùng nếu frontend cần tên/ID thật thay vì fallback từ email; xác nhận policy JWT, CORS và cấu hình theo môi trường.
- **Frontend:** giữ auth adapter tách biệt; xử lý hết hạn/401 và role; kiểm tra form, lỗi mạng và điều hướng sau login.
- **Hoàn tất khi:** đăng nhập, tải lại trang, logout, token hết hạn và truy cập sai role đều có hành vi được xác định; frontend và backend chạy qua cùng một bộ tích hợp.

UC-01 đã có nền tảng ở cả hai repo; giai đoạn này là xác nhận hành vi trong môi trường kết nối thật, không phải viết lại từ đầu.

### Giai đoạn 1 — Quản trị và truy vết: UC-02, UC-03, UC-04

**Phụ thuộc:** UC-01 và mô hình người dùng/role ổn định.

| UC | Backend | Frontend | Điều kiện hoàn tất |
|---|---|---|---|
| UC-02 Quản lý tài khoản | API danh sách/tìm kiếm/tạo/cập nhật/khóa-mở khóa; hash mật khẩu; validate email; ngăn vô hiệu hóa admin cuối cùng; không trả password/hash. | Bảng người dùng, form tạo/sửa, gán vai trò, trạng thái, xác nhận thao tác khóa. | Admin có thể quản lý user; tài khoản bị khóa không dùng được; thao tác bị từ chối nếu không phải Admin. |
| UC-03 Quản lý vai trò và phân quyền | API vai trò/quyền và kiểm tra quyền tại service/endpoint; lưu thay đổi quyền; audit mọi thay đổi. | Màn hình danh sách role, xem quyền và chỉnh quyền theo phạm vi đã chốt; cảnh báo thay đổi quyền quan trọng. | Quyền backend là nguồn quyết định; thay đổi role được áp dụng đúng và có lịch sử. |
| UC-04 Xem nhật ký hoạt động | Lưu audit bền vững trong DB, gồm actor, hành động, entity, thời điểm, giá trị trước/sau; API filter, sort, phân trang. | Bộ lọc thời gian, actor, loại hành động/entity; trang chi tiết thay đổi; chỉ Admin truy cập. | Nhật ký còn sau khi restart; không ghi password, JWT, secret hoặc dữ liệu nhạy cảm không cần thiết. |

**Quyết định cần chốt cho UC-03:** hiện role là enum cố định (`ADMIN`, `WAREHOUSE_MANAGER`, `WAREHOUSE_STAFF`, `DEALER`). Nếu chỉ cần quản lý việc gán bốn role thì giữ enum và giới hạn API. Nếu Admin cần tự tạo role/quyền mới, phải chuyển sang permission model lưu trong DB và lập kế hoạch migration riêng.

### Giai đoạn 2 — Master data đối tác: UC-05, UC-06, UC-07

**Phụ thuộc:** Giai đoạn 0; UC-08 cần nhà cung cấp, UC-13 cần đại lý.

| UC | Backend | Frontend | Điều kiện hoàn tất |
|---|---|---|---|
| UC-05 Sản phẩm và danh mục | Củng cố API hiện tại: validate quan hệ category/unit, mã duy nhất, status, các ràng buộc khi sản phẩm đã phát sinh giao dịch. | Hoàn thiện list/detail/form/filter theo role; thông báo lỗi nghiệp vụ và trạng thái rỗng/loading. | Không xóa/sửa mã làm hỏng giao dịch tham chiếu; dealer chỉ thấy sản phẩm được phép xem. |
| UC-06 Nhà cung cấp | Supplier entity/repository/service/API; mã duy nhất; trạng thái; tìm kiếm/phân trang; bảo vệ tham chiếu từ phiếu nhập. | Danh sách, chi tiết, tạo/sửa, kích hoạt/ngừng giao dịch và chọn supplier khi nhập kho. | Supplier đã được tham chiếu không bị xóa vật lý; endpoint chỉ quản lý kho được phép sửa. |
| UC-07 Đại lý | Dealer entity/API; thông tin liên hệ, trạng thái; liên kết user với dealer; kiểm soát dữ liệu thuộc dealer. | Danh sách/chi tiết/form cho quản lý; màn hình chọn đại lý trong yêu cầu; hồ sơ dealer nếu nằm trong phạm vi. | Tài khoản dealer chỉ truy cập dữ liệu dealer được gán, kiểm tra ownership phía backend. |

### Giai đoạn 3 — Sổ kho và giao dịch: UC-08, UC-09, UC-11

**Phụ thuộc:** UC-05 đến UC-07. Đây là lõi nghiệp vụ; xây sổ biến động trước khi làm dashboard, kiểm kê và dự báo.

| UC | Backend | Frontend | Điều kiện hoàn tất |
|---|---|---|---|
| UC-08 Quản lý nhập kho | Phiếu nhập và dòng hàng; liên kết supplier; trạng thái nháp/xác nhận; transaction nguyên tử cập nhật sổ biến động và số dư; chống submit lặp. | Tạo/sửa phiếu nháp, chọn supplier/sản phẩm, xác nhận nhập, xem lịch sử/trạng thái. | Xác nhận một lần tạo đúng một biến động nhập; lỗi giữa chừng không cập nhật dở dang. |
| UC-09 Quản lý xuất kho | Phiếu xuất và dòng hàng; kiểm tra số lượng khả dụng; transaction nguyên tử; idempotency; liên kết yêu cầu đại lý khi có. | Lập phiếu, chọn hàng, cảnh báo tồn không đủ, xác nhận xuất, xem lịch sử. | Không cho tồn âm; hai yêu cầu đồng thời không xuất vượt tồn; mọi biến động truy ngược được. |
| UC-11 Quản lý tồn kho | API số dư theo sản phẩm và vị trí/kho nếu có; lịch sử ledger; tổng hợp từ stock movement; khóa/cạnh tranh cập nhật có kiểm soát. | Tra cứu tồn, tìm kiếm/lọc, xem chi tiết và lịch sử nhập-xuất. | Số dư khớp tổng biến động; quyền xem tồn được áp dụng theo role. |

**Thiết kế bắt buộc trước khi code:** xác định một hay nhiều kho/vị trí; đơn vị và quy tắc quy đổi; thời điểm ghi nhận tồn (khi xác nhận phiếu); xử lý hủy/điều chỉnh; chiến lược locking/idempotency. Không cập nhật số dư trực tiếp mà thiếu ledger/audit trail.

### Giai đoạn 4 — Quét, kiểm kê và yêu cầu đại lý: UC-10, UC-12, UC-13

**Phụ thuộc:** tồn kho/ledger; UC-10 cần mã định danh; UC-13 cần dealer, sản phẩm và chính sách giữ hàng.

| UC | Backend | Frontend | Điều kiện hoàn tất |
|---|---|---|---|
| UC-10 Nhận diện QR/RFID | Quản lý mã định danh và liên kết với sản phẩm/lô/đơn vị; API tra cứu/quét; chống mã trùng; ghi nhận kết quả quét. | Luồng quét camera QR; nhập mã thủ công; hiển thị sản phẩm/vị trí/trạng thái; adapter thiết bị RFID nếu có. | Mã không hợp lệ/trùng được xử lý rõ; kết quả tra cứu tuân theo quyền; có test thiết bị thật nếu chọn RFID. |
| UC-12 Kiểm kê kho | Phiếu kiểm kê, snapshot tồn tại thời điểm bắt đầu, dòng đếm, chênh lệch, luồng gửi duyệt và ghi adjustment có audit. | Nhân viên mở/đếm/gửi phiếu; quản lý xem chênh lệch, duyệt hoặc từ chối; theo dõi trạng thái. | Nhân viên không tự duyệt điều chỉnh; số dư chỉ đổi sau duyệt; kiểm kê không ghi đè lịch sử. |
| UC-13 Quản lý yêu cầu hàng | Yêu cầu gắn dealer, dòng hàng và trạng thái; quyền xem theo ownership; xử lý duyệt/từ chối; liên kết fulfillment với UC-09. | Dealer tạo/theo dõi yêu cầu của mình; quản lý lọc và duyệt/từ chối; hiển thị tiến độ thực hiện. | Dealer không đọc/sửa yêu cầu dealer khác; thay đổi trạng thái hợp lệ; yêu cầu được liên kết với xuất kho. |

**Quyết định cần chốt:** QR đại diện sản phẩm, lô hay từng đơn vị? RFID dùng reader/mobile SDK nào? Duyệt yêu cầu đại lý có giữ tồn ngay hay chỉ giữ khi lập phiếu xuất? Các câu trả lời ảnh hưởng schema và giao diện quét.

### Giai đoạn 5 — Thống kê, báo cáo và thông minh: UC-15, UC-16, UC-14

**Phụ thuộc:** dữ liệu giao dịch UC-08/09, tồn UC-11, kiểm kê UC-12 và yêu cầu UC-13. Làm dashboard/report cơ bản trước; chỉ triển khai forecast AI sau khi dữ liệu lịch sử đủ tin cậy.

| UC | Backend | Frontend | Điều kiện hoàn tất |
|---|---|---|---|
| UC-15 Dashboard thống kê | API aggregate theo thời gian: tồn, nhập/xuất, hàng sắp hết, yêu cầu chờ xử lý; giới hạn truy vấn và kiểm tra quyền. | Thẻ KPI/biểu đồ theo khoảng thời gian, trạng thái tải/lỗi/không dữ liệu; không đưa số liệu giả. | Tổng hợp đối soát được với API nguồn và cập nhật theo phạm vi thời gian rõ ràng. |
| UC-16 Báo cáo kho | API truy vấn báo cáo có filter, phân trang/stream export; đảm bảo truy vấn không khóa giao dịch dài. | Chọn loại báo cáo, thời gian, bộ lọc; xem trước; tải định dạng đã thống nhất. | Số liệu báo cáo đối soát với ledger; export có encoding, quyền truy cập và giới hạn dữ liệu hợp lý. |
| UC-14 Dự báo và cảnh báo AI | Trước tiên thêm ngưỡng/cảnh báo quy tắc; sau đó baseline forecast, đánh giá sai số, version dữ liệu/model và giải thích kết quả. | Danh sách cảnh báo có mức độ/trạng thái; biểu đồ forecast và khoảng thời gian; phân biệt rõ dự báo với số liệu thực. | Cảnh báo có ngưỡng/nguồn rõ; forecast có kiểm thử trên dữ liệu quá khứ và không tự ghi/sửa tồn kho. |

## Bảng thứ tự tổng hợp

| Ưu tiên | Use case | Ghi chú phụ thuộc |
|---|---|---|
| P0 | UC-01 | Đã có; xác nhận end-to-end và chuẩn hóa phiên/schema. |
| P1 | UC-02, UC-03, UC-04 | Quản trị user/role và audit bền vững. |
| P2 | UC-05, UC-06, UC-07 | Hoàn thiện master data; supplier/dealer là đầu vào giao dịch. |
| P3 | UC-08, UC-09, UC-11 | Ledger, nhập/xuất và truy vấn tồn là lõi hệ thống. |
| P4 | UC-10, UC-12, UC-13 | Quét, kiểm kê, yêu cầu dealer dựa trên tồn và master data. |
| P5 | UC-15, UC-16, UC-14 | KPI và báo cáo dựa trên dữ liệu thật; AI/forecast đến sau. |

## Definition of Done chung cho mỗi UC

- Backend có DTO validation, quy tắc nghiệp vụ, phân quyền endpoint/service, xử lý lỗi nhất quán và migration schema.
- Frontend có list/detail/form hoặc workflow tương ứng; loading, empty, error, validation và trạng thái thao tác rõ ràng.
- Có kiểm thử backend cho quyền, validation, ràng buộc nghiệp vụ và trường hợp lỗi; frontend kiểm tra API adapter và luồng giao diện trọng yếu.
- Có API contract được ghi nhận; UI không dùng mock/fake success trong môi trường production.
- Có audit cho thao tác thay đổi dữ liệu; không ghi mật khẩu, token hay secret vào log.
- Đối chiếu role frontend với backend; mọi quyền và ownership quan trọng được kiểm tra ở backend.

## Quyết định liên nhóm cần ghi nhận

1. UC-03 dùng bốn role cố định hay cho phép tạo role/permission động?
2. Hệ thống quản lý một kho hay nhiều kho/vị trí? Có cần quản lý theo lô/hạn sử dụng không?
3. UC-13 là yêu cầu đặt hàng, yêu cầu cấp phát hay đơn bán? Khi nào giữ tồn?
4. UC-10 chỉ cần QR hay cần cả RFID thật; thiết bị và định dạng mã nào được hỗ trợ?
5. Báo cáo cần xuất CSV/XLSX/PDF nào; dữ liệu nào dealer được phép xem?
6. AI forecast cần dự báo nhu cầu, đề xuất nhập hàng hay cả hai; cần bao nhiêu lịch sử và chỉ số chấp nhận nào?

Các quyết định này cần được chốt trước schema/API tương ứng để tránh phải sửa lại dữ liệu và luồng giao dịch.
