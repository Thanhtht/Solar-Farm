# Hướng dẫn làm việc cho Codex

## Đọc trước khi sửa

- Đọc `docs/PRODUCT.md`, `docs/DESIGN.md`, `docs/STATUS.md` và task tương ứng trong `docs/TASKS.md`.
- Kiểm tra code, nhánh và `git status` hiện tại; bảo toàn thay đổi có sẵn.
- Mỗi cloud task đã có môi trường riêng. Dùng checkout hiện có; không tạo Git worktree nếu người dùng chưa yêu cầu.
- Không giả định nhớ chat trước. Tài liệu và code trong repo là nguồn bàn giao; yêu cầu mới của người dùng được ưu tiên.

## Cách thực hiện task

- Hoàn thành một mốc có thể kiểm tra; tránh tự mở rộng sang task sau.
- Nêu các giả định có ảnh hưởng, rồi chủ động làm trong phạm vi được giao.
- Giao diện và nội dung sản phẩm mặc định bằng tiếng Việt. Tên code có thể dùng tiếng Anh.
- Không tự đổi công nghệ hoặc thêm dịch vụ trả phí nếu chưa có nhu cầu thực tế.
- Không triển khai hay tích hợp API giả rồi báo là đã hoạt động. Nhận định theo quy tắc phải được phân biệt với hội thoại AI qua API.
- Không tự gửi liên hệ, email hay dữ liệu khách hàng ra ngoài.

## Quy tắc dữ liệu và mô phỏng

- Các con số phải có cùng nguồn dữ liệu: trạng thái thiết bị → tính toán → tổng hợp → biểu đồ, nhận định.
- Tách bộ mô phỏng và cấu hình nhà máy khỏi thành phần giao diện.
- Ghi đơn vị rõ: MWp cho công suất DC danh định; MW cho công suất; MWh cho năng lượng; °C cho nhiệt độ.
- Mọi dữ liệu giả lập đều có nhãn; không gọi dữ liệu là trực tiếp từ nhà máy thật.
- Dùng seed hoặc đầu vào cố định cho kiểm thử; không sinh số ngẫu nhiên riêng ở từng thẻ/biểu đồ.
- AI giải thích số liệu do bộ mô phỏng tính, không tự tạo số tổn thất hoặc cam kết hiệu quả.
- Khóa API chỉ ở máy chủ; không commit secret, không đưa vào biến public hoặc log.

## Kiểm tra và bàn giao

Hiện repo chưa có mã ứng dụng nên chưa có lệnh cài đặt, chạy hay kiểm tra. Task T01 phải bổ sung lệnh thật vào README và file này sau khi chạy thành công; không ghi lệnh dự kiến thành đã kiểm chứng.

- Dùng package manager và lockfile đã chọn; cài đặt với lockfile khi đã tồn tại.
- Chạy build, kiểm tra kiểu và kiểm tra phù hợp với chức năng đã sửa. Không thêm test chỉ để kiểm tra nội dung tĩnh.
- Kiểm thử có ý nghĩa cho phép tính mô phỏng; kiểm tra tương tác thực tế cho các luồng chính nếu công cụ cho phép.
- Nêu rõ kiểm tra nào đã chạy, thất bại, chưa chạy và giới hạn của bằng chứng.
- Cuối mỗi task cập nhật `docs/STATUS.md`; cập nhật các tài liệu khác nếu quyết định thay đổi.
- Khi được giao lưu thay đổi, tạo commit đúng phạm vi; không tự push, merge hoặc triển khai công khai nếu task chưa yêu cầu.
- Kết thúc bằng kết quả, bằng chứng kiểm tra và task tiếp theo. Không đánh dấu toàn bộ demo sẵn sàng khi chỉ có giao diện.
