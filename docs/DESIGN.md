# Định hướng thiết kế

**Bản định hướng 0.3:** đã xác nhận 3 preset, màn hình tự cấu hình đơn giản và kết quả ngay trong 3D. Người xem ưu tiên và tên ba preset còn chờ review. Yêu cầu 3D thay thế đề xuất 2.5D trước đó.

## Cảm giác chung

Một trung tâm điều hành năng lượng hiện đại: chính xác, gọn, có chiều sâu. Khu nhà máy là điểm nhìn chính; các số liệu hỗ trợ câu chuyện. Tránh quá nhiều thẻ, hiệu ứng nhấp nháy hoặc trang trí che dữ liệu.

## Hệ hình ảnh ban đầu

| Thành phần | Đề xuất |
| --- | --- |
| Nền trang | Xanh đen `#07111F` |
| Bề mặt bảng | `#101E30` |
| Chữ chính | `#EDF4FC` |
| Chữ phụ | `#A5B6CC` |
| Điểm nhấn, trạng thái bình thường | Xanh ngọc `#36D6B0` |
| Năng lượng, cảnh báo | Vàng `#F7C65D` |
| Sự cố | Đỏ `#FF727D` |

Đây là màu khởi đầu; kiểm tra tương phản thực tế khi xây UI. Màu trạng thái luôn đi cùng chữ hoặc biểu tượng, không dùng màu làm dấu hiệu duy nhất.

- Font sans hỗ trợ đầy đủ tiếng Việt; ưu tiên font hệ thống ở bản đầu để tránh phụ thuộc mạng khi chạy.
- Số có thể dùng chữ số cùng chiều rộng để không rung khi cập nhật.
- Chuyển động ngắn, có mục đích; hỗ trợ `prefers-reduced-motion`.
- Chọn thiết bị có viền/vùng sáng rõ, trạng thái hover và focus bàn phím.

## Bố cục laptop

1. Thanh đầu: tên demo, nhãn “Dữ liệu mô phỏng”, thời gian mô phỏng, nút hướng dẫn và liên hệ.
2. Hàng bốn chỉ số chính, có đơn vị và nhãn giải thích ngắn.
3. Cảnh nhà máy 3D lớn bên trái; bảng chi tiết/phân tích bên phải. Giữ ít nhất khoảng một nửa chiều ngang cho mô hình khi đủ chỗ.
4. Có chuyển đổi “Kịch bản có sẵn” / “Tự cấu hình”. Ở màn hình tự cấu hình, bảng tham số đặt cạnh cảnh 3D; biểu đồ hỗ trợ bên dưới. Không giấu kết quả sau một tab khác.

Ở điện thoại, chuyển thành một cột theo thứ tự: chỉ số → nhà máy → chi tiết → mô phỏng → biểu đồ → phân tích. Trợ lý không phủ nút chạy; không dựa vào hover để đọc dữ liệu.

## Mô hình nhà máy

- Dùng Three.js qua React Three Fiber/Drei tạo cảnh 3D: khối pin theo hàng, inverter, trạm điện và đường nội bộ. Đây là cảnh có hình học và camera 3D thực, không thay bằng SVG phối cảnh khi nghiệm thu.
- Các cụm có ID tương ứng với dữ liệu; tránh tạo nhiều chi tiết không thể tương tác hoặc không có ý nghĩa.
- Hiệu ứng mây, vùng bám bụi hoặc lỗi thiết bị chỉ xuất hiện khi có kịch bản tương ứng.
- Hiển thị chú giải trạng thái; không dùng bản đồ địa lý của một nhà máy thật chưa được cung cấp.
- Ưu tiên mô hình tạo bằng hình học đơn giản, dùng instancing cho các tấm pin; tránh phụ thuộc CAD/BIM hoặc thư viện bản đồ cần khóa API. Chất lượng bóng và số chi tiết điều chỉnh theo thiết bị.
- Có camera phối cảnh, xoay/zoom, nút tổng quan và chọn cụm; vùng được chọn có viền/sáng rõ. Thay tham số không làm mất góc nhìn hiện tại.
- Mây và bụi có hiệu ứng khác nhau; cụm inverter lỗi có ký hiệu và nhãn riêng. Hiệu ứng gắn cùng ID và dữ liệu với KPI; không chỉ chạy hoạt ảnh trang trí.
- Nhãn nổi neo vào cụm được chọn: tên/ID, trạng thái, MW; các cụm khác giữ nhãn gọn khi cần. Hạn chế chồng chữ và nhấp nháy.
- Có trạng thái tải cảnh, lỗi và không hỗ trợ WebGL. Dùng hình tĩnh dự phòng có ghi rõ khi cần, nhưng hình này không thay điều kiện nghiệm thu 3D.

## Màn hình tự cấu hình

- Có tiêu đề riêng và cách quay về ba preset; không bắt buộc có URL riêng.
- Bên trái là nhà máy 3D và kết quả nổi; bên phải là bảng tham số ngắn. Ở màn hình hẹp, dùng ngăn điều khiển có thể thu gọn và giữ một phần cảnh cùng chỉ số tóm tắt nhìn thấy được.
- Thứ tự: loại tình huống → vùng ảnh hưởng → mức độ nếu áp dụng → thời lượng → nút phát lại/đặt lại.
- Thanh điều chỉnh cập nhật bản xem thử ngay; nhãn “Xem thử” và mốc thời gian nằm gần cảnh. Nút “Chạy mô phỏng” phát lại diễn biến thay vì là điều kiện để thấy kết quả.
- Kết quả toàn kỳ và tích lũy hiện tại có nhãn khác nhau; không đổi tên chỉ số âm thầm giữa hai chế độ.

## Nội dung và trạng thái

- Nhãn ngắn: “Công suất hiện tại”, “Tổn thất mô phỏng”, “Chạy mô phỏng”, “Đặt lại”.
- Tooltip giải thích MWp, MW, MWh và đường cơ sở cho người xem không chuyên.
- Có trạng thái ban đầu, đang chạy, tạm dừng, hoàn thành và lỗi.
- Chế độ chưa cấu hình AI giải thích ngắn, vẫn hiển thị phân tích theo quy tắc.
- Không dùng logo khách hàng, phần trăm tiết kiệm hoặc chứng nhận không có thật.
- Hướng dẫn demo cho phép khách tự thao tác; tránh chặn màn hình bằng lời giới thiệu dài.

## Kiểm tra hình ảnh

Chụp/kiểm tra các kích thước trong PRODUCT khi có công cụ trình duyệt. Kiểm tra dấu tiếng Việt, chữ phụ, focus, chú giải và bố cục khi nội dung AI dài. Nếu chưa thể xem bằng trình duyệt, ghi rõ giới hạn thay vì khẳng định UI đã được nghiệm thu.
