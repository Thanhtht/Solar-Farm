# Solar Farm Digital Twin Demo

Demo web tương tác về bản sao số nhà máy điện mặt trời, kết hợp mô phỏng vận hành và trợ lý AI. Mục tiêu là giúp khách hàng hiểu giá trị giải pháp trong khoảng 3 phút và tạo cơ hội trao đổi chuyên sâu.

**Trạng thái:** đang review bản mô tả sản phẩm 0.2; chưa có ứng dụng, dependency hoặc lệnh chạy. Các thông số nhà máy dưới đây là giả định cho demo, có thể điều chỉnh.

## Bắt đầu làm việc

1. Đọc [hướng dẫn Codex](AGENTS.md).
2. Đọc [phạm vi sản phẩm](docs/PRODUCT.md) và [thiết kế](docs/DESIGN.md).
3. Xem [trạng thái bàn giao](docs/STATUS.md) để biết task tiếp theo.
4. Dùng [lộ trình và mẫu giao việc](docs/TASKS.md) khi mở chat mới.

Lần review hiện tại: đọc [các lựa chọn sản phẩm](docs/PRODUCT_REVIEW.md) trước khi bắt đầu T01.

## Định hướng kỹ thuật

- Next.js, TypeScript, Tailwind CSS; dùng phiên bản ổn định tương thích khi khởi tạo và lưu lockfile.
- Mô hình nhà máy 2.5D tương tác bằng SVG/CSS ở bản đầu.
- Bộ mô phỏng xác định kết quả từ trạng thái và kịch bản; dữ liệu giả lập được ghi nhãn rõ.
- Nhận định theo quy tắc hoạt động độc lập; AI hội thoại qua API là lớp bổ sung phía máy chủ.
- Mục tiêu triển khai: Vercel, sau khi kiểm tra cấu hình và tài khoản thực tế.

Chưa có kết nối SCADA, mô hình vật lý đã hiệu chỉnh hoặc tích hợp dữ liệu nhà máy thật. Demo không dùng để điều khiển thiết bị.
