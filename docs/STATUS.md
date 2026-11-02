# Trạng thái bàn giao

## Mốc hiện tại

**T00 — đang review chi tiết sản phẩm, bản làm việc 0.2.** Bộ tài liệu nền đã có; người dùng yêu cầu làm rõ phạm vi trước khi triển khai. Chưa khởi tạo ứng dụng. Chưa có dependency, dịch vụ đang chạy, cấu hình AI hoặc bản triển khai web.

## Đã làm

- Định nghĩa mục tiêu demo và luồng trải nghiệm khoảng 3 phút.
- Chọn giả định ban đầu: nhà máy hư cấu 50 MWp, tiếng Việt, ưu tiên quản lý vận hành.
- Ghi phạm vi, tiêu chí nghiệm thu, hướng thiết kế và lộ trình T01–T05.
- Tạo hướng dẫn Codex và quy trình bàn giao qua Git/tài liệu.

## Bằng chứng và giới hạn

- Trước khi tạo tài liệu: checkout không có file dự án, không có commit và không có thay đổi người dùng.
- Chỉ có tài liệu ở T00; không có ứng dụng để build, chạy hoặc kiểm thử chức năng.
- Chưa thể xác nhận khả năng chạy web, mô phỏng, AI hoặc triển khai.
- Thông tin thương hiệu, liên hệ và API AI chưa được cung cấp; không chặn T01.
- Lệnh cài đặt, chạy và kiểm tra sẽ được ghi sau khi thực thi ở T01.
- Các lựa chọn công nghệ là định hướng, chưa phải dependency đã cài.
- Ở lần review 0.2, đã kiểm tra lại liên kết nội bộ và cặp hàng rào khối mã của cả 7 file Markdown; tất cả hợp lệ. Kiểm tra whitespace bằng Git thành công. Đây là kiểm tra tài liệu, không phải kiểm thử ứng dụng.
- Bộ tài liệu được lưu bằng commit cục bộ trên nhánh `work`; chưa push lên GitHub. Để dùng ở máy mới, cần chuyển commit sang remote theo hướng dẫn TASKS.

## Task tiếp theo

**Hiện tại:** review `docs/PRODUCT_REVIEW.md` và bản chi tiết `docs/PRODUCT.md`; ba lựa chọn đang chờ người dùng: đối tượng ưu tiên, điểm nhấn và mức tùy chỉnh kịch bản. Chưa coi các đề xuất là đã xác nhận.

Đã bổ sung bản đồ màn hình, nhịp demo, dữ liệu tối thiểu, định nghĩa KPI, hành vi kịch bản, vòng đời mô phỏng, hợp đồng AI và AC-01–AC-11. AI API thật là điều kiện bản gửi khách; dự phòng theo quy tắc không thay thế nghiệm thu AI.

**Sau review:** đồng bộ DESIGN/TASKS theo các lựa chọn rồi thực hiện **T01 — Khởi tạo và giao diện tổng quan**.

Khi bắt đầu, kiểm tra nhánh và commit hiện tại. Nếu dùng máy mới, xác nhận bộ tài liệu này đã có trong checkout; không giả định lịch sử chat hay commit cục bộ tự được chuyển sang.

## Quyết định có thể điều chỉnh

- Tên công ty, logo, màu thương hiệu và phương thức liên hệ.
- Nhà máy mẫu, số lượng inverter và giả định giá điện.
- Nhà cung cấp AI, mức sử dụng và dịch vụ triển khai sau khi kiểm tra quyền truy cập.

Các mục thương hiệu, cấu hình API và thông số mẫu chưa cần thiết cho lần review đầu. Tiếp tục làm rõ sản phẩm trước; không tự chuyển sang viết ứng dụng khi người dùng đang review phạm vi.
