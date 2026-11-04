# Hướng dẫn làm việc cho Codex

## Đọc trước khi sửa

- Đọc `docs/PRODUCT.md`, `docs/DESIGN.md`, `docs/STATUS.md` và task tương ứng trong `docs/TASKS.md`. Với T03, đọc thêm `docs/T03_HANDOFF.md`, `docs/MONITORING.md` và `docs/SIMULATION.md`: đây là bàn giao hiện hành; các review cũ không phải yêu cầu khôi phục UI đã bỏ.
- Với thiết bị, telemetry hoặc AI theo thiết bị, đọc thêm `docs/IOT.md`; không đồng nhất trạng thái vận hành với trạng thái kết nối/chất lượng dữ liệu.
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
- Dữ liệu mô phỏng có nhãn nguồn ở cấp trang; theo review đã chốt không lặp các đoạn dữ liệu mẫu/giả định trong từng cảnh báo. Không gọi dữ liệu là trực tiếp từ nhà máy thật.
- Dùng seed hoặc đầu vào cố định cho kiểm thử; không sinh số ngẫu nhiên riêng ở từng thẻ/biểu đồ.
- AI giải thích số liệu do bộ mô phỏng tính, không tự tạo số tổn thất hoặc cam kết hiệu quả.
- Khóa API chỉ ở máy chủ; không commit secret, không đưa vào biến public hoặc log.

## Kiểm tra và bàn giao

Ứng dụng T01/T02 dùng Node.js 24, npm và `package-lock.json`. Từ gốc checkout: `npm ci`, `npm run dev`, `npm run typecheck`, `npm run build`, `npm run start`. Dev/build dùng Webpack vì giới hạn cổng nội bộ Turbopack trong cloud. Chi tiết fixture và giới hạn ở README. Kiểm tra trình duyệt: `npm run test:e2e` (sau build), Chromium hệ thống `/usr/bin/chromium`; có thể đổi bằng `PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH`. Không cần API key cho T01/T02. Công thức, vòng đời và phương án xử lý T02 ở docs/SIMULATION.md; giữ Hiện trạng và Mô phỏng độc lập.

- Chat mặc định toàn nhà máy (`assetId=null`), hai hội thoại độc lập theo mode Hiện trạng/Mô phỏng, giữ hội thoại khi đổi thiết bị trong cùng mode. Từng tin giữ context lúc gửi; không gắn nhãn lại theo lựa chọn mới. Có autocomplete @ theo ID/tên. Không gán ngầm INV-01.
- Với T03, đọc `docs/AI.md` và STATUS mới nhất. Quy tắc hoạt động độc lập; API tự bật khi có Gemini_API; khách không nhập mã. Không coi fixture là request AI thật; hạn mức process không thay quota toàn project Gemini.
- Dùng package manager và lockfile đã chọn; cài đặt với lockfile khi đã tồn tại.
- Chạy build, kiểm tra kiểu và kiểm tra phù hợp với chức năng đã sửa. Không thêm test chỉ để kiểm tra nội dung tĩnh.
- Kiểm thử có ý nghĩa cho phép tính mô phỏng; kiểm tra tương tác thực tế cho các luồng chính nếu công cụ cho phép.
- Nêu rõ kiểm tra nào đã chạy, thất bại, chưa chạy và giới hạn của bằng chứng.
- Cuối mỗi task cập nhật `docs/STATUS.md`; cập nhật các tài liệu khác nếu quyết định thay đổi.
- Khi được giao lưu thay đổi, tạo commit đúng phạm vi; không tự push, merge hoặc triển khai công khai nếu task chưa yêu cầu.
- Kết thúc bằng kết quả, bằng chứng kiểm tra và task tiếp theo. Không đánh dấu toàn bộ demo sẵn sàng khi chỉ có giao diện.
