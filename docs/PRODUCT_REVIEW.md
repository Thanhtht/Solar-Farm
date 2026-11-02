# Review sản phẩm — bản làm việc 0.3

## Điều người dùng đã yêu cầu

Demo bản sao số nhà máy điện mặt trời chạy trên web, có AI và chế độ cài đặt kịch bản mô phỏng. Cần đẹp, ấn tượng để gửi khách trải nghiệm và tạo cơ hội gặp trình bày giải pháp.

Người dùng đang muốn review và mô tả sản phẩm chi tiết hơn trước khi khởi tạo ứng dụng.

**Đã xác nhận trong phản hồi mới nhất:** có 3 kịch bản sẵn; thêm màn hình để người dùng tự cấu hình một số tham số đơn giản; xem được kết quả mô phỏng ngay trong 3D. Yêu cầu 3D thực thay thế đề xuất 2.5D trước đó.

**Chưa xác nhận:** đối tượng ưu tiên, tên cụ thể của bộ ba, thông số nhà máy, so sánh phương án xử lý. Không diễn giải việc người dùng chốt 3D thành đã chốt các mục này.

## Đánh giá bản phạm vi đầu

| Khoảng trống | Rủi ro khi triển khai ngay | Cách bổ sung trong PRODUCT hiện tại |
| --- | --- | --- |
| Chưa chọn người xem chính | UI có nhiều số liệu nhưng không làm rõ giá trị với người quyết định | Phân biệt nhu cầu lãnh đạo, vận hành, đối tác; chờ chọn ưu tiên |
| Chưa cụ thể hóa câu chuyện | Các tính năng đẹp nhưng rời rạc | Luồng khoảng 3 phút và kết quả mong muốn ở từng nhịp |
| “Cài đặt kịch bản” còn rộng | Làm preset rồi mới phát hiện cần màn hình riêng | Đã chốt 3 preset + tự cấu hình đơn giản + xem kết quả trong 3D; chi tiết tham số còn là đề xuất |
| AI có thể bị xem là tùy chọn toàn bộ | Bàn giao không đạt yêu cầu tích hợp AI ban đầu | AI API thật là điều kiện bản gửi khách; quy tắc là chế độ dự phòng |
| Chưa định nghĩa KPI/đường cơ sở | Chỉ số không nhất quán, nhầm công suất và năng lượng | Từ điển chỉ số, đối chứng, đơn vị và khoảng tính |
| Chưa định nghĩa vòng đời mô phỏng | Đặt lại không sạch, dữ liệu/AI trộn giữa các lượt chạy | Trạng thái, revision, ảnh chụp AI và quy tắc chạy lại |
| Chưa có ví dụ kiểm chứng | Khó kết luận tính năng đã xong | Ma trận AC-01–AC-11 |

## Các lựa chọn review và phần đã xác nhận

### A. Ai cần được thuyết phục nhất?

- **Lãnh đạo/chủ đầu tư:** nhấn tác động sản lượng, ưu tiên xử lý và giá trị kinh tế có giả định rõ. Giảm chi tiết kỹ thuật ở màn hình đầu.
- **Quản lý vận hành:** nhấn thiết bị, cảnh báo, so sánh và hành động kiểm tra.
- **Đối tác kỹ thuật:** nhấn quan hệ dữ liệu, khả năng mô phỏng và cách kết nối khi triển khai thật.

Có thể phục vụ cả ba, nhưng cần chọn một người xem chính để tránh dàn trải.

### B. Khoảnh khắc gây ấn tượng là gì?

**Đề xuất ưu tiên:** khách gây ra một bất thường, thấy tổn thất, thử một phương án xử lý và thấy tác động thay đổi. AI giải thích bằng dữ liệu ngay trong cùng màn hình.

Phần “thử phương án xử lý” chưa có trong phạm vi ban đầu; nếu chọn cần bổ sung đối chứng kết quả phương án, giả định thời điểm khôi phục và công thức năng lượng có thể tránh mất. Không gọi đó là số tiền tiết kiệm đã được kiểm chứng.

Hai hướng khác: tập trung khám phá nhà máy trực quan, hoặc tập trung AI hỗ trợ ra quyết định. Chọn trọng tâm để quyết định mức đầu tư hình ảnh và chiều sâu mô phỏng.

### C. “Cài đặt kịch bản” cần sâu đến đâu?

**Hình thức đã chốt:** đúng 3 preset và màn hình tự cấu hình tham số đơn giản, kết quả hiện ngay trong cảnh 3D. Không hỏi lại người dùng chọn giữa preset và màn hình tự cấu hình; cần có cả hai.

**Đề xuất bộ ba để review:** mây che (tác động thời tiết), bám bụi (suy giảm hiệu suất), lỗi inverter (mất khả dụng). Quá nhiệt được bỏ khỏi đề xuất để giữ đúng số lượng ba; chưa có nghĩa người dùng đã xác nhận tên các preset.

**Đề xuất tham số:** loại tình huống, phạm vi cụm, mức độ nếu áp dụng, thời lượng. Chỉnh tham số cập nhật bản xem thử trong 3D; bấm chạy để xem diễn biến theo thời gian. Chưa mặc định có ghép nhiều loại, lưu thư viện hoặc chia sẻ cấu hình.

### D. Kết quả trong 3D cụ thể là gì?

- Mây/bóng minh họa đúng vùng, bụi trên vùng pin được chọn, cảnh báo tại cụm inverter lỗi.
- Nhãn gắn với cụm: trạng thái và công suất; KPI và biểu đồ bên ngoài cảnh vẫn đồng bộ.
- Camera xoay/zoom, chọn cụm, trở về tổng quan; không thay 3D bằng ảnh phối cảnh.
- Đề xuất dùng Three.js / React Three Fiber / Drei và hình học nhẹ, chưa cần CAD/BIM theo nhà máy thật.
- Bản xem thử có mốc thời gian và kết quả dự kiến; tách khỏi lượt phát lại đang chạy để tránh nhầm năng lượng tích lũy.

## Mục có thể quyết định sau

- Logo, tên thương hiệu, tên nhà máy, thông tin liên hệ.
- Nhà cung cấp AI, mức sử dụng và tài khoản triển khai.
- Thông số vật lý chi tiết nếu có nhà máy thật làm tham chiếu.
- Mức chi tiết CAD/BIM, kết nối dữ liệu thật và các tính năng ngoài demo. Cảnh 3D tương tác cơ bản là yêu cầu hiện tại, không trì hoãn sang phiên bản sau.

## Kết quả của lần review này

Đã đồng bộ PRODUCT, DESIGN, TASKS, README và STATUS với yêu cầu mới. Các lựa chọn A/B và tên bộ ba/chi tiết tham số còn mở. Tiếp tục review sản phẩm; chưa khởi tạo ứng dụng. Các yêu cầu đã xác nhận ở mục C không cần hỏi lại.
