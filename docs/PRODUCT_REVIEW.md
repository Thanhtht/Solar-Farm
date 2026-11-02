# Review sản phẩm — bản làm việc 0.2

## Điều người dùng đã yêu cầu

Demo bản sao số nhà máy điện mặt trời chạy trên web, có AI và chế độ cài đặt kịch bản mô phỏng. Cần đẹp, ấn tượng để gửi khách trải nghiệm và tạo cơ hội gặp trình bày giải pháp.

Người dùng đang muốn review và mô tả sản phẩm chi tiết hơn trước khi khởi tạo ứng dụng. Hiện chưa có quyết định xác nhận về loại khách hàng ưu tiên, mức tùy chỉnh kịch bản, nhà máy mẫu hoặc mức độ 3D.

## Đánh giá bản phạm vi đầu

| Khoảng trống | Rủi ro khi triển khai ngay | Cách bổ sung trong PRODUCT 0.2 |
| --- | --- | --- |
| Chưa chọn người xem chính | UI có nhiều số liệu nhưng không làm rõ giá trị với người quyết định | Phân biệt nhu cầu lãnh đạo, vận hành, đối tác; chờ chọn ưu tiên |
| Chưa cụ thể hóa câu chuyện | Các tính năng đẹp nhưng rời rạc | Luồng khoảng 3 phút và kết quả mong muốn ở từng nhịp |
| “Cài đặt kịch bản” còn rộng | Làm preset rồi mới phát hiện cần trình biên tập/lưu cấu hình | Nêu ba mức tùy chỉnh và ảnh hưởng phạm vi |
| AI có thể bị xem là tùy chọn toàn bộ | Bàn giao không đạt yêu cầu tích hợp AI ban đầu | AI API thật là điều kiện bản gửi khách; quy tắc là chế độ dự phòng |
| Chưa định nghĩa KPI/đường cơ sở | Chỉ số không nhất quán, nhầm công suất và năng lượng | Từ điển chỉ số, đối chứng, đơn vị và khoảng tính |
| Chưa định nghĩa vòng đời mô phỏng | Đặt lại không sạch, dữ liệu/AI trộn giữa các lượt chạy | Trạng thái, revision, ảnh chụp AI và quy tắc chạy lại |
| Chưa có ví dụ kiểm chứng | Khó kết luận tính năng đã xong | Ma trận AC-01–AC-11 |

## Ba lựa chọn cần review trước

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

| Mức | Người dùng làm được gì? | Ảnh hưởng triển khai |
| --- | --- | --- |
| Preset có tham số | Chọn loại, thiết bị, mức độ, thời điểm và thời lượng rồi chạy | Phạm vi hiện tại, dễ hoàn thiện và giải thích |
| Ghép nhiều loại | Mây che + bụi + lỗi tại các khoảng khác nhau | Cần quy tắc kết hợp, timeline và test tương tác; không cộng thẳng phần trăm giảm |
| Chuẩn bị và lưu trước | Đặt tên cấu hình để người trình diễn chọn lại | Cần chọn lưu trên trình duyệt hay chia sẻ qua URL/máy chủ; chưa mặc định có đăng nhập |

Các mức có thể kết hợp về sau. Trong lần review đầu nên chọn khả năng thực sự cần cho buổi gặp khách, tránh ngầm làm cả ba.

## Mục có thể quyết định sau

- Logo, tên thương hiệu, tên nhà máy, thông tin liên hệ.
- Nhà cung cấp AI, mức sử dụng và tài khoản triển khai.
- Thông số vật lý chi tiết nếu có nhà máy thật làm tham chiếu.
- Tối ưu 3D đầy đủ, kết nối dữ liệu thật và các tính năng ngoài demo.

## Kết quả của lần review này

Đã bổ sung bản mô tả hành vi và tiêu chí kiểm tra trong PRODUCT. Các lựa chọn A/B/C vẫn đang chờ phản hồi; chưa đánh dấu người dùng đã chốt. Sau phản hồi, cập nhật PRODUCT, DESIGN, TASKS và STATUS cùng nhau rồi mới bắt đầu T01.
