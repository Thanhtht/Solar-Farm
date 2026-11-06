# Hiện trạng và nền Mô phỏng — đặc tả hiện hành

Mốc ứng dụng T02 đã được chấp nhận: `82cef18`. Đây là dữ liệu mô phỏng cố định, không phải kết nối nhà máy thật. `src/lib/monitoring.ts` tạo snapshot `monitoring-fixture`; Dashboard tạo đối tượng riêng cho Hiện trạng và nền Mô phỏng, `Session.initial` clone nguồn khi tạo phiên. Các mô tả nền 30,24 MW hoặc nhánh 06 chưa suy giảm trong lịch sử không còn áp dụng.

## Ba vấn đề

Danh sách thiết bị mở thành popup phủ trong khung 3D, không chiếm phần bên dưới cảnh. Nút nằm trong thanh tiêu đề cảnh, cạnh Góc nhìn tổng quan, có nền xanh đậm và cao tối thiểu 44px; cách mép vùng vẽ bằng khoảng đệm riêng. Trên mobile nút nằm cùng hàng với nút reset camera dạng icon, vẫn giữ nhãn trợ năng; nút Thiết bị ở header cũng mở cùng popup. Popup có cuộn riêng, tìm mã/tên/khu vực và lọc mức trạng thái, đóng bằng X/Esc, giữ focus bên trong và trả về nút mở. Chọn mã đóng popup, focus camera và mở HUD; vẫn có đường Xem chi tiết trong HUD để xem toàn bộ hồ sơ/lịch sử.

Mỗi dòng trong popup có mã/tên, khu vực/thông số danh định, mức/trạng thái vận hành, tất cả tín hiệu chính của thiết bị, kết nối IoT, thời điểm cập nhật và lý do vấn đề nếu có. Số liệu đọc cùng snapshot với HUD/3D, giữ đơn vị; null/missing/invalid là —, stale có nhãn dữ liệu cũ; lỗi inverter hiển thị bằng trạng thái thay mã 0/1. Không suy lỗi vận hành từ kết nối IoT.

Card thu gọn khoảng một nửa chiều cao theo review: mã/tên cùng hàng, bốn tín hiệu cùng hàng trên desktop; IoT/cập nhật nằm ngay dưới tín hiệu thay vì một hàng toàn chiều ngang. Giảm padding/gap nhưng không ẩn dữ liệu. Khi khung popup hẹp, card chuyển sang nhận diện gọn và hai cột nhãn/số theo container width, giữ nội dung đọc được trên mobile/tablet.

Danh sách dùng cùng `assetStatus` với viền 3D: xanh bình thường, vàng lưu ý, đỏ cảnh báo, kèm chấm/icon và mô tả trạng thái cho bàn phím/trình đọc màn hình. Thiết bị được chọn có thêm viền ngoài, không thay mất màu trạng thái; màu cập nhật theo snapshot của từng tab và kết quả/reset Mô phỏng. Gateway trễ vẫn là lưu ý, không đổi thành lỗi phát điện.

Thiết bị cảnh báo đỏ có viền nhịp nhẹ ngay cả khi chưa chọn. Inverter dừng có nhãn đỏ nổi cố định ghi ID và Dừng phát điện, không cần hover; không lặp nhãn trên cụm PV cùng nhánh. Chọn inverter gộp nhãn Đang chọn vào cùng cảnh báo để tránh chồng chữ. Nhãn không chặn chuột/chạm hoặc raycast, không đổi model/vị trí/camera. Chế độ giảm chuyển động giữ viền/nhãn tĩnh; Thống kê không dùng cảnh báo vận hành này.

| Vấn đề                         | Mức      | Số đo và ảnh hưởng                                                                           | Hiển thị                                                |
| ------------------------------ | -------- | -------------------------------------------------------------------------------------------- | ------------------------------------------------------- |
| INV-03 dừng từ 10:15           | Cảnh báo | AC 0; mất 4,32 MW và 1,08 MWh/15 phút; telemetry/heartbeat vẫn hoạt động                     | Đỏ, không có dòng chấm                                  |
| PV-06/INV-06 suy giảm từ 10:20 | Lưu ý    | Nhiệt PV-06 58 °C; giảm 2%; DC 4,41 MW, AC 4,2336 MW; mất 0,0864 MW AC và 0,0144 MWh/10 phút | Cụm pin, inverter và dây vàng, có dòng chấm             |
| GW-01 độ trễ cao               | Lưu ý    | 850 ms > ngưỡng giám sát 500 ms; 18 nguồn, heartbeat còn hoạt động, chưa gây mất sản lượng   | Gateway vàng, không có dây điện nối vào sơ đồ công suất |

PV-06 và INV-06 là **một vấn đề nhánh**: `attention` ở PV-06, inverter có `operatingState=degraded` và cùng giải thích. Không cộng hai lần tổn thất. Danh sách 1 Cảnh báo + 2 Lưu ý tương ứng 3 vấn đề, dù có bốn thiết bị được tô viền. Lưu ý có thể có giảm công suất nhẹ chưa cần báo động; không còn định nghĩa “luôn chưa ảnh hưởng sản lượng”. Ngưỡng và mức 2% là giả định minh họa, không phải tiêu chuẩn/đặc tính nhà sản xuất hoặc mô hình nhiệt đã kiểm định.

## Lịch sử và phép tính

- Ngày 02/11/2026, 31 mẫu từ 10:00–10:30 ICT, mỗi phút. `historyTimes` bằng `Run.times`, số cuối trùng số đo hiện tại. Không tự chạy theo đồng hồ thật.
- Hệ số bức xạ tăng tuyến tính 0,9 → 1 từ 10:00–10:15 rồi giữ nguyên; bức xạ = 780 × hệ số W/m². DC mỗi cụm khỏe = 4,5 × hệ số MW; AC = DC × 0,96, giới hạn 5 MW/inverter và 40 MW toàn nhà máy.
- INV-03 lỗi từ 10:15; nhánh PV-03 bị giới hạn khai thác DC về 0 theo giả định T02. Nhánh 06 nhân thêm factor 0,98 từ 10:20.
- Tổng inverter = TR-01 = **30,1536 MW** cuối cửa sổ. Khả dụng 7/8 = **87,5%**, độc lập kết nối của 19 thiết bị.
- Tích phân đầu trái: `Σ P[k]/60` MWh, không làm mượt bước sự cố. Đã phát **15,7248 MWh**: 10:00–10:15 là 8,1792; 10:15–10:30 là 7,5456. Đây không phải sản lượng cả ngày.
- Không có sự cố, cùng bức xạ: cuối cửa sổ 34,56 MW, năng lượng 16,8192 MWh. Chênh lệch đã mất **1,0944 MWh = 1,08 + 0,0144**; công suất đang mất **4,4064 MW**.
- PV-06 nhiệt tăng 50 → 58 °C; GW-01 độ trễ 200 → 850 ms; INV-03 nhiệt cuối 48,6 °C. Các tín hiệu ổn định có đường phẳng; không sinh dao động ngẫu nhiên cho đẹp.

`monitoring-metrics.ts` tính cùng lịch sử/bức xạ, không thay mẫu thiếu bằng 0. Bốn card mở modal: công suất/bảng inverter/thời tiết, năng lượng/bảng 15 phút, khả dụng/ba vấn đề, tổn thất/hai nguồn mất. Không có các bảng này dưới 3D. Nội dung cảnh báo chỉ nêu số đo/ảnh hưởng/hành động; nhãn nguồn mô phỏng ở cấp trang.

## Dây điện và nguồn Mô phỏng

`power-network.ts` dựng 8 tuyến DC PV → inverter và 8 tuyến AC inverter → trạm; không nối điện tới MET-01/GW-01. Xanh bình thường, vàng suy giảm còn công suất, đỏ dừng. Dây đỏ không tạo chấm chạy; số đo thiếu/cũ/invalid không giả có dòng, khi chưa biết vấn đề thì dây xám. Chấm sphere bán kính 0,11 dùng instancing, lịch vẽ 24 lần/giây, giảm chuyển động giữ chấm tĩnh, trang ẩn dừng animation. Tốc độ chỉ minh họa chiều truyền; không thay phép tính hoặc cản raycast chọn thiết bị. Tuyến là sơ đồ nhìn thấy, không phải bản vẽ thi công.

Mô phỏng lấy bản sao của nền trên, không sửa Hiện trạng. Kết quả kịch bản là phần mất **thêm** sau 10:30, không cộng 1,0944 MWh quá khứ. Reset phục hồi bản sao ban đầu, không chữa lỗi INV-03 hoặc xóa suy giảm nhánh 06. Xem [SIMULATION](SIMULATION.md) và [T03_HANDOFF](T03_HANDOFF.md).
