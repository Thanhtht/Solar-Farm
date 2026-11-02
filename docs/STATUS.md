# Trạng thái bàn giao

## Mốc hiện tại

**T00 — hoàn thành bộ tài liệu nền.** Chưa khởi tạo ứng dụng. Chưa có dependency, dịch vụ đang chạy, cấu hình AI hoặc bản triển khai web.

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
- Đã kiểm tra liên kết nội bộ và cặp hàng rào khối mã của cả 6 file Markdown; tất cả hợp lệ. Kiểm tra whitespace bằng Git thành công.
- Bộ tài liệu được lưu bằng commit cục bộ trên nhánh `work`; chưa push lên GitHub. Để dùng ở máy mới, cần chuyển commit sang remote theo hướng dẫn TASKS.

## Task tiếp theo

**T01 — Khởi tạo và giao diện tổng quan**, theo `docs/TASKS.md`.

Khi bắt đầu, kiểm tra nhánh và commit hiện tại. Nếu dùng máy mới, xác nhận bộ tài liệu này đã có trong checkout; không giả định lịch sử chat hay commit cục bộ tự được chuyển sang.

## Quyết định có thể điều chỉnh

- Tên công ty, logo, màu thương hiệu và phương thức liên hệ.
- Nhà máy mẫu, số lượng inverter và giả định giá điện.
- Nhà cung cấp AI, mức sử dụng và dịch vụ triển khai sau khi kiểm tra quyền truy cập.

Nếu chưa có lựa chọn mới, tiếp tục theo giả định trong PRODUCT; không dừng T01 để hỏi lại các mục tùy chọn này.
