# Định hướng thiết kế

**Bản định hướng ban đầu:** đang review cùng PRODUCT 0.2. Chưa có quyết định mới từ người dùng về người xem ưu tiên, điểm nhấn hoặc mức cấu hình kịch bản; cần cập nhật bố cục theo kết quả review trước T01.

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
3. Khu nhà máy lớn bên trái; bảng chi tiết/phân tích bên phải. Giữ ít nhất khoảng một nửa chiều ngang cho mô hình khi đủ chỗ.
4. Biểu đồ công suất và bảng kịch bản ở phía dưới hoặc trong ngăn mở; không giấu tác động mô phỏng khi chỉnh tham số.

Ở điện thoại, chuyển thành một cột theo thứ tự: chỉ số → nhà máy → chi tiết → mô phỏng → biểu đồ → phân tích. Trợ lý không phủ nút chạy; không dựa vào hover để đọc dữ liệu.

## Mô hình nhà máy

- Dùng SVG/CSS tạo phối cảnh 2.5D: khối pin theo hàng, inverter, trạm điện và đường nội bộ.
- Các cụm có ID tương ứng với dữ liệu; tránh tạo nhiều chi tiết không thể tương tác hoặc không có ý nghĩa.
- Hiệu ứng mây, vùng bám bụi hoặc lỗi thiết bị chỉ xuất hiện khi có kịch bản tương ứng.
- Hiển thị chú giải trạng thái; không dùng bản đồ địa lý của một nhà máy thật chưa được cung cấp.
- Tránh tải mô hình 3D nặng hoặc thư viện bản đồ cần khóa API ở bản đầu.

## Nội dung và trạng thái

- Nhãn ngắn: “Công suất hiện tại”, “Tổn thất mô phỏng”, “Chạy mô phỏng”, “Đặt lại”.
- Tooltip giải thích MWp, MW, MWh và đường cơ sở cho người xem không chuyên.
- Có trạng thái ban đầu, đang chạy, tạm dừng, hoàn thành và lỗi.
- Chế độ chưa cấu hình AI giải thích ngắn, vẫn hiển thị phân tích theo quy tắc.
- Không dùng logo khách hàng, phần trăm tiết kiệm hoặc chứng nhận không có thật.
- Hướng dẫn demo cho phép khách tự thao tác; tránh chặn màn hình bằng lời giới thiệu dài.

## Kiểm tra hình ảnh

Chụp/kiểm tra các kích thước trong PRODUCT khi có công cụ trình duyệt. Kiểm tra dấu tiếng Việt, chữ phụ, focus, chú giải và bố cục khi nội dung AI dài. Nếu chưa thể xem bằng trình duyệt, ghi rõ giới hạn thay vì khẳng định UI đã được nghiệm thu.
