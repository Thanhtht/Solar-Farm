# Hồng Liêm 3 — bản dựng từ ảnh

## Phạm vi 11/11/2026

Nhà máy thứ hai tại `/plants/hong-liem-3`, chọn từ danh sách `/`. Bản dựng 3D dùng lại GLB của Sava, có góc Theo ảnh/Từ trên, xoay/pan/zoom, chọn vùng pin/inverter/trạm điện/thời tiết/gateway và xem số liệu. Có Hiện trạng và Mô phỏng độc lập, ba kịch bản mây/bụi/lỗi inverter. Chưa có Thống kê lịch sử hoặc hội thoại AI cho Hồng Liêm 3; không gọi API AI của Sava với dữ liệu nhà máy này.

## Hình học và giới hạn

- Nguồn hình dạng là ảnh góc xiên 640 × 425 do người dùng gửi trong chat. `src/data/hong-liem-layout.ts` lưu các polygon được phác bằng tọa độ pixel: 12 vùng pin, khoảng trống trung tâm, đường nội bộ, khu trạm và đường bao ước lượng.
- `photoToGround` chiếu ngược ảnh lên mặt phẳng bằng camera giả định `[0,140,180]`, FOV 43°. Đây là hiệu chỉnh phối cảnh phục vụ trình bày. Không có EXIF camera, GCP, tỷ lệ, tọa độ khảo sát hay cao độ; đơn vị cảnh không được công bố là mét thực tế. Không thể suy ra kích thước chính xác chỉ từ ảnh này.
- Các dãy GLB được xếp theo lưới cố định và chỉ giữ khi cả bốn góc footprint nằm trong polygon. Khoảng đất trống trung tâm không có pin; các cụm nhỏ phía Nam giữ tách rời. Đường/hàng rào/vị trí các thiết bị phụ trợ là sơ đồ ước lượng, không phải thiết kế đấu nối/as-built.
- Pin, inverter, trạm, nhà điều hành, trạm thời tiết, gateway, đường, hàng rào, nền và cây dùng GLB sẵn có của Sava. `ModelInstances` dùng instancing cho 1.664 cụm pin minh họa; góc xa chỉ vẽ cell geometry gốc, vùng đang chọn giữ model đầy đủ gồm khung và chân đỡ. Tài sản Sava và bố cục/camera Sava được giữ riêng.
- Muốn hiệu chỉnh kích thước thực cần tối thiểu một khoảng cách đã biết, bản đồ ranh giới hoặc bản vẽ tổng mặt bằng. Muốn khớp cao độ cần dữ liệu địa hình/ảnh đo đạc bổ sung.

## Dữ liệu

| Nội dung | Cơ sở |
| --- | --- |
| Công suất DC 50 MWp | Thông tin công khai của dự án, đối chiếu [PECC2](https://pecc2ese.com/vn/nha-may-dien-mat-troi-hong-liem-3.html) |
| Trạm 22/110 kV | Tham khảo bài công bố đóng điện; không dựng sơ đồ thiết bị thật |
| AC 40 MW, 12 inverter đại diện | Giả định demo; không phải cấu hình thiết bị đã xác minh |
| Phân bổ công suất từng vùng | Theo tỷ lệ số dãy minh họa, tổng đúng 50 MWp DC / 40 MW AC |
| Thời điểm dữ liệu | Fixture cố định 11/11/2026, 10:30 ICT; không phải dữ liệu trực tiếp |
| Bức xạ/nhiệt độ/gió/IoT | Giả định cố định; bộ tạo dữ liệu riêng trong `hong-liem-simulation.ts` |

Nhiệt độ module nền = 28 + 0,024 × bức xạ (W/m²). Hệ số nhiệt = 1 − 0,004 × (nhiệt độ nền − 25). DC nền = MWp vùng × bức xạ / 1000 × hệ số nhiệt × hệ số vùng. Vùng 04 có hệ số vùng 97%, các vùng khác 100%; nhiệt độ hiển thị vùng 04 cao hơn nền 3°C là tín hiệu điểm đo đại diện, không áp thêm hệ số nhiệt lần hai. Hiệu suất inverter giả định 97%. AC được giới hạn theo công suất AC phân bổ từng vùng.

Mây nhân bức xạ thu nhận với 65%, bụi nhân thu nhận DC với 85%, lỗi inverter đặt công suất nhánh về 0. Tác động trước giới hạn AC; bức xạ và hệ số nhiệt nền giữ cố định trong kỳ. Năng lượng = MW × số giờ; tổn thất phát sinh thêm = chênh lệch AC so với cùng đầu vào nền × số giờ, không tính lại suy giảm sẵn có. Đây là ước tính trạng thái không đổi, không có đồ thị thời tiết theo giờ. Inverter dừng vẫn có kết nối IoT. Không cộng công suất trạm thêm vào tổng inverter.

Hiện trạng không bị thay đổi khi chỉnh/chạy/reset hoặc chuyển mode. Thay đầu vào làm kết quả cũ mất hiệu lực; phải bấm Xem kết quả mô phỏng. Các giá trị, trạng thái màu và chi tiết đều đọc cùng snapshot. Không dùng registry, seed, snapshot hoặc API AI Sava.

## Kiểm chứng

Các bài tại `tests/hong-liem.spec.ts` kiểm tra chiếu lại polygon về ảnh, footprint nằm trong vùng, giữ trống đảo xanh, tổng công suất, tính quyết định, clipping, năng lượng/tổn thất, tách trạng thái và các luồng trình duyệt. Bằng chứng chạy thực tế và giới hạn tại STATUS.
