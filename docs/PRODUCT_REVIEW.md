# Review sản phẩm — bản làm việc 0.4

## Điều người dùng đã yêu cầu

Demo bản sao số nhà máy điện mặt trời chạy trên web, có AI và chế độ cài đặt kịch bản mô phỏng. Cần đẹp, ấn tượng để gửi khách trải nghiệm và tạo cơ hội gặp trình bày giải pháp.

Người dùng đang muốn review và mô tả sản phẩm chi tiết hơn trước khi khởi tạo ứng dụng.

**Đã xác nhận trong phản hồi mới nhất:** có 3 kịch bản sẵn; thêm màn hình để người dùng tự cấu hình một số tham số đơn giản; xem được kết quả mô phỏng ngay trong 3D. Yêu cầu 3D thực thay thế đề xuất 2.5D trước đó.

**Đã xác nhận bổ sung:** bộ ba mây che/bám bụi/lỗi inverter; người xem chính là giám đốc nhà máy/đội vận hành; click thiết bị xem tình trạng với giả định có cảm biến IoT; nhấn khám phá nhà máy và mô phỏng/so sánh; AI vừa trả lời vừa chủ động phân tích, hỗ trợ quyết định.

**Chưa xác nhận chi tiết:** thông số nhà máy, danh mục/số lượng thiết bị và cảm biến, tham số cụ thể của phương án xử lý, nhận diện/liên hệ. Các chi tiết này có đề xuất trong PRODUCT và IOT.

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

Đã chốt giám đốc nhà máy/đội vận hành là người xem chính. Các nhóm còn lại là góc nhìn phụ; không hỏi lại lựa chọn này.

### B. Khoảnh khắc gây ấn tượng là gì?

**Đề xuất ưu tiên:** khách gây ra một bất thường, thấy tổn thất, thử một phương án xử lý và thấy tác động thay đổi. AI giải thích bằng dữ liệu ngay trong cùng màn hình.

Người dùng đã chọn mô phỏng/so sánh và khám phá nhà máy làm điểm nhấn. Đã bổ sung mục so sánh phương án vào PRODUCT: đối chứng, thời điểm khôi phục và năng lượng có thể tránh mất. Thao tác vệ sinh/khôi phục và tham số cụ thể vẫn là đề xuất; không gọi kết quả là lợi ích đã được kiểm chứng.

AI có hai vai trò đã xác nhận: hội thoại về dữ liệu/thiết bị và chủ động phân tích bất thường, đề xuất quyết định. Không tự thực hiện thao tác ngoài mô phỏng.

### C. “Cài đặt kịch bản” cần sâu đến đâu?

**Hình thức đã chốt:** đúng 3 preset và màn hình tự cấu hình tham số đơn giản, kết quả hiện ngay trong cảnh 3D. Không hỏi lại người dùng chọn giữa preset và màn hình tự cấu hình; cần có cả hai.

**Bộ ba đã xác nhận:** mây che (thời tiết), bám bụi (suy giảm hiệu suất), lỗi inverter (mất khả dụng). Giữ đúng ba; quá nhiệt và mất kết nối không trở thành preset bổ sung.

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

Đã đồng bộ PRODUCT, DESIGN, TASKS, README và STATUS; bổ sung IOT mô tả hồ sơ thiết bị, cảm biến, timestamp, chất lượng dữ liệu, quan hệ và AI. Đối tượng chính, bộ ba, click thiết bị/IoT, khám phá/mô phỏng và hai vai trò AI đã chốt; không hỏi lại. Người dùng đã yêu cầu push tài liệu để bắt đầu T01 trong chat mới. Các chi tiết còn lại dùng giả định đã ghi và có thể tinh chỉnh khi xem giao diện đầu tiên; chưa khởi tạo ứng dụng.
