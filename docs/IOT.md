# Thiết bị và giám sát IoT — đề xuất chi tiết 0.4

## Yêu cầu và giới hạn

Người dùng đã xác nhận: click thiết bị để xem chi tiết tình trạng, với giả định thiết bị đã được gắn cảm biến IoT để tracking như digital twin. Bản demo mô phỏng dữ liệu cảm biến và liên kết với mô hình 3D; không cần lắp phần cứng hoặc kết nối mạng IoT thật.

Danh mục, tín hiệu và cách bố trí dưới đây là đề xuất thực hiện cho bản đầu. Chưa có bản vẽ, cấu hình cảm biến hoặc danh sách thiết bị của nhà máy thật.

## Những đối tượng có thể chọn

| Loại | Ví dụ ID | Dữ liệu đề xuất | Quan hệ cần thể hiện |
| --- | --- | --- | --- |
| Cụm/dãy pin đại diện | PV-01 | Nhiệt độ mặt sau module đại diện (°C); điện áp DC (V), dòng DC (A) ở mạch đo tương ứng; công suất DC tính từ dữ liệu | Thuộc khu vực nào, cấp vào inverter nào; vị trí cảm biến đại diện |
| Inverter | INV-01 | Điện áp/dòng phía DC, công suất AC (kW), nhiệt độ bên trong (°C), trạng thái chạy/dừng, mã lỗi | Nhận từ các cụm pin nào, nối tới máy biến áp nào |
| Máy biến áp/trạm thu gom | TR-01 | Nhiệt độ cuộn dây đại diện (°C), công suất tác dụng tổng hợp (kW), trạng thái | Danh sách inverter phía dưới; không cộng công suất trạm thêm vào tổng inverter |
| Trạm thời tiết | MET-01 | Bức xạ trên mặt phẳng pin (W/m²), nhiệt độ môi trường (°C), tốc độ gió (m/s) | Phạm vi đại diện; cảm biến thời tiết dùng chung không giả làm cảm biến riêng ở từng tấm pin |
| Gateway IoT | GW-01 | Trạng thái kết nối, lần heartbeat, số nguồn đo đang cung cấp dữ liệu | Thiết bị/cảm biến đi qua gateway nào; chỉ là mô hình giám sát giả lập |

Các tấm pin lặp trong cảnh đại diện cho cụm; click một tấm thuộc cụm sẽ mở đúng hồ sơ cụm và ghi rõ cấp đo. Không tự nhận có cảm biến từng tấm hoặc serial vật lý riêng. Cây thiết bị/danh sách là cách chọn thay thế khi các vật thể nhỏ khó bấm.

Số lượng cụ thể được chốt bằng cấu hình nhà máy dùng chung ở T01. Không cần triển khai hàng nghìn thiết bị để kể câu chuyện. Mỗi loại trong bảng cần ít nhất một đối tượng đại diện có thể chọn; mọi đối tượng được đánh dấu tương tác phải có dữ liệu hoặc trạng thái thiếu dữ liệu rõ ràng.

Các tín hiệu có thể lấy từ cảm biến bổ sung, đồng hồ hoặc telemetry tích hợp của thiết bị. Không gắn mọi số đo cho một cảm biến IoT vật lý riêng nếu không có lý do. Chưa yêu cầu đo đầy đủ chất lượng điện ba pha, mô phỏng bảo vệ hay tính toán lưới điện.

## Hồ sơ thiết bị khi click

1. **Đầu bảng:** tên, ID, loại, khu vực, nhãn dữ liệu mô phỏng; hai trạng thái độc lập “Vận hành” và “Dữ liệu IoT”.
2. **Tổng quan:** thông số danh định liên quan, 3–5 tín hiệu quan trọng, thời điểm đo gần nhất và chất lượng dữ liệu.
3. **Cảm biến:** ID/tên tín hiệu, vị trí/cấp đo, giá trị, đơn vị, thời gian đo, trạng thái; bấm tín hiệu để xem đồ thị.
4. **Xu hướng:** một vài tín hiệu phù hợp trong khoảng đã phát lại của lượt hiện tại; đơn vị/trục rõ. Chưa có lịch sử thì ghi đúng trạng thái, không vẽ dữ liệu tương lai như đã đo.
5. **Cảnh báo và sự kiện:** lúc phát sinh, thiết bị/tín hiệu liên quan, mức độ, đang hiệu lực/đã kết thúc. Không tự tạo lịch sử bảo trì đã thực hiện.
6. **Phân tích:** nhận định chủ động và nút “Hỏi AI về thiết bị này”; gửi ID cùng ảnh chụp dữ liệu hiện tại, không bắt người dùng gõ lại tên.

Đổi thiết bị đổi toàn bộ nội dung theo cùng ID; bảng không giữ biểu đồ hoặc câu trả lời của thiết bị cũ như thông tin của thiết bị mới. Có thể xem hội thoại cũ nhưng phải giữ nhãn thiết bị/thời điểm gốc.

## Phân biệt vận hành với dữ liệu

| Khía cạnh | Trạng thái đề xuất | Ý nghĩa |
| --- | --- | --- |
| Vận hành | Bình thường / suy giảm / sự cố / dừng / chưa xác định | Tình trạng thiết bị từ dữ liệu có chất lượng đủ hoặc từ mô hình mô phỏng đã ghi nhãn |
| Kết nối nguồn đo | Đang kết nối / mất kết nối / chưa có dữ liệu | Có nhận dữ liệu/heartbeat của nguồn không |
| Chất lượng từng tín hiệu | Hợp lệ / đã cũ / không hợp lệ / thiếu | Giá trị có thể được dùng để kết luận tại thời điểm đang xem không |

Inverter hỏng có thể vẫn gửi telemetry và mã lỗi. Mất dữ liệu IoT không tự có nghĩa inverter hỏng hoặc công suất bằng 0. Khi thiếu dữ liệu, hiển thị “—” hoặc số cuối cùng kèm nhãn đã cũ và thời điểm; không âm thầm thay bằng 0 hoặc giá trị mới ngẫu nhiên.

Nếu toàn bộ dữ liệu cần thiết không dùng được, trạng thái giám sát là “Chưa xác định”. Tổng KPI lấy từ mô hình vẫn có thể hiển thị nhưng phải ghi là “Theo mô hình mô phỏng”; không trình bày là tổng đo trực tiếp đã xác minh. Mức khả dụng thiết bị và tình trạng kết nối là hai chỉ số khác nhau.

Đề xuất mô hình thời gian đơn giản: một mẫu đo mỗi phút mô phỏng, cùng bước dữ liệu ở PRODUCT. Tín hiệu được đánh dấu cũ khi quá hai chu kỳ dự kiến (hằng số cấu hình có kiểm thử); không dùng thời gian đồng hồ máy để làm dữ liệu cũ đi khi mô phỏng đang tạm dừng. Trạng thái kết nối cần heartbeat riêng; không suy ra chắc chắn mất kết nối chỉ vì một tín hiệu bị cũ.

Để kiểm tra chất lượng dữ liệu, dùng fixture/test chuyên biệt. Không thêm preset mất kết nối thành kịch bản thứ tư hoặc tự thêm một màn hình cấu hình mạng.

## Dữ liệu và liên kết định danh

- **Asset:** ID ổn định, loại, tên, vị trí 3D, khu vực, quan hệ cấp điện/thuộc về/giám sát, thông số danh định.
- **Sensor/Signal:** ID ổn định, asset nguồn hoặc cấp đo, tên đại lượng, đơn vị, chu kỳ dự kiến, gateway nếu áp dụng; giá trị suy ra phải có loại nguồn “tính toán”.
- **Telemetry:** ID tín hiệu, ID/revision lượt chạy, mốc đo, mốc nhận nếu cần, giá trị có thể thiếu và chất lượng. Không dùng tên hiển thị làm khóa nối dữ liệu.
- **Trạng thái thiết bị/cảnh báo:** nguồn dữ kiện, mốc thời gian, asset và tín hiệu liên quan; giữ tách vận hành với kết nối.
- **Ngữ cảnh AI:** thiết bị đang hỏi, các cảm biến và thời điểm, chất lượng dữ liệu, quan hệ với thiết bị khác, ảnh hưởng của kịch bản hiện tại.

Nguồn sự thật là bộ mô phỏng → tạo telemetry và trạng thái theo seed → tổng hợp và hiển thị. Cảnh 3D, bảng chi tiết, cảnh báo, biểu đồ và AI không tự sinh bộ số riêng.

Điện áp, dòng, công suất và năng lượng phải hợp lý với cấp đo và mô hình. Có thể dùng Pdc = Vdc × Idc cho mạch DC tương đương đã định nghĩa; AC phải tính từ DC/hiệu suất/giới hạn theo SIMULATION. Không dùng công thức DC cho công suất AC ba pha. Các tín hiệu nhiệt độ minh họa chưa tác động công suất nếu chưa có mô hình được ghi rõ.

Độ bụi trong kịch bản là đầu vào giả lập hoặc chỉ số suy ra; không gắn nhãn “cảm biến bụi đo được” nếu chưa mô hình hóa cảm biến tương ứng. Tương tự, mây cục bộ có thể khác bức xạ tại trạm thời tiết; ghi phạm vi đại diện thay vì ép mọi cụm dùng cùng giá trị đo.

## Liên kết với ba kịch bản

- **Mây che:** công suất và dòng DC ở cụm liên quan giảm theo mô hình; inverter vẫn hoạt động/kết nối. Trạm thời tiết chỉ phản ánh vùng đo đại diện của nó.
- **Bám bụi:** đầu ra giảm với cùng môi trường đối chứng; hệ số bụi hiển thị là tham số mô phỏng. AI gợi ý kiểm tra bề mặt/vệ sinh theo giả định, không khẳng định đã đo được nguyên nhân ngoài thực tế.
- **Lỗi inverter:** đầu ra AC mất trong khoảng sự cố, mã lỗi/sự kiện được tạo, pin và trạm liên quan phản ánh quan hệ theo mô hình. Telemetry có thể còn kết nối; không tự đồng nhất lỗi công suất với lỗi mạng.

## Chưa bao gồm

Kết nối MQTT/OPC UA/Modbus thật, broker, lưu chuỗi thời gian trên máy chủ, cấu hình mạng, provision cảm biến, điều khiển từ xa hoặc tài khoản vận hành. Mô hình dữ liệu tách riêng giúp bổ sung kết nối sau; không tuyên bố tích hợp giao thức đã hoàn thành.

## Kiểm tra nghiệm thu

- Click mỗi loại đối tượng đại diện: đúng ID và cấp đo, bảng phù hợp, cảm biến có đơn vị/thời điểm; chọn từ danh sách cũng mở đúng đối tượng 3D.
- Chạy ba preset: telemetry, trạng thái thiết bị, cảnh, cảnh báo và tổng công suất khớp cùng lượt chạy/thời điểm.
- Inverter có đầu ra 0 vẫn có thể online. Dữ liệu stale/thiếu không bị biến thành 0 hoặc bị AI kết luận là hỏng.
- Tạm dừng, chạy lại, đặt lại: lịch sử và chất lượng dữ liệu không vượt sang lượt cũ/mốc tương lai.
- AI trả lời đúng thiết bị đang hỏi, dẫn số liệu đúng mốc và nêu giới hạn khi dữ liệu thiếu.
