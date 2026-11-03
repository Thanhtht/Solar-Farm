# Thiết bị và giám sát IoT — đề xuất chi tiết 0.4

## Review suy giảm nhẹ và màu đường điện

Thêm `Asset.operatingState` để đồng bộ thiết bị liên quan cùng nhánh: PV-06/INV-06 `degraded`, INV-03 `stopped`. Cùng vấn đề nhánh 06 chỉ có một attention tại PV-06; inverter mang trạng thái/giải thích tương ứng, tránh đếm hai lần tổn thất. Kịch bản giữ và cập nhật trạng thái này: công suất 0 → stopped/critical, dương nhưng ảnh hưởng → degraded/warning. Lỗi có sẵn vẫn hợp với lỗi kịch bản; tác động nhỏ không bị tính thành mất khả dụng.

`PowerLink.state` là normal/degraded/stopped/unknown. Fault hoặc trạng thái stopped đã xác nhận làm dây đỏ và `running=false`; nhánh suy giảm còn công suất vàng/chạy; bình thường xanh/chạy; số đo không dùng được không chạy. Chấm sphere 0,11 thay arrow cone; không thay giá trị công suất vì animation. Nội dung cảnh báo rút gọn ngôn ngữ vận hành, nguồn mô phỏng giữ nhãn chung ở trang. Tham chiếu và ngưỡng giả định vẫn được ghi trong tài liệu kỹ thuật, không xóa nguồn gốc dữ liệu.

## Review nền Mô phỏng và chi tiết chỉ số

`createMonitoringSnapshot()` tạo hai đối tượng độc lập cho Hiện trạng và trạng thái ban đầu Mô phỏng. `Session.initial` tiếp tục clone đầu vào, dùng fault hiện hữu, hệ số DC và tín hiệu nhiệt/thời tiết/gateway làm nền; effects nhân với hệ số nền, lỗi là hợp của lỗi có sẵn và lỗi kịch bản. Sửa/chạy/reset kịch bản không mutate nguồn Hiện trạng. Metadata vấn đề có sẵn được giữ; khi cùng thiết bị chịu kịch bản, thẻ giải thích ghi rõ “trước kịch bản”, không trình bày số đo nền như số đo mới. Nhánh dừng sẵn không phát sinh thêm tổn thất.

Chi tiết bốn KPI từ `monitoring-metrics.ts` và snapshot hiện trạng: tích phân đầu trái theo phút, tham chiếu từ cùng bức xạ/cấu hình, khả dụng từ mã lỗi từng inverter, không thay mẫu thiếu bằng 0. Khả dụng phát điện vẫn độc lập kết nối. Các chart/lưu ý dưới trang được chuyển vào modal của card; liên kết ID mở đúng thiết bị. `Run.energyMWh/lossMWh` của phiên kịch bản tích phân phần tương lai từ 10:30, dù đồ thị tín hiệu được seed 31 mẫu lịch sử; số 15,7392 MWh/1,08 MWh quá khứ giữ trong snapshot ban đầu, không cộng vào kết quả kịch bản. Quyết định này thay yêu cầu không dùng Hiện trạng làm nền trong review cũ, vẫn giữ cách ly đối tượng dữ liệu.

## Lớp đường điện

`buildPowerLinks` dùng quan hệ registry PV → inverter → transformer để dựng đúng 16 tuyến, không coi quan hệ gateway/thiết bị là dây điện. Mỗi tuyến DC đọc `.pdc` ở PV, tuyến AC đọc `.pac` ở inverter, đơn vị MW. Chỉ số đo valid/finite > 0 mới có mũi tên; 0 hoặc thiếu/cũ/invalid không chạy. Màu đỏ lan theo nhánh liên quan (PV + inverter; tuyến AC thêm trạng thái trạm), không lan lỗi mạng của GW sang toàn bộ nhà máy và không nhân đôi công suất/tổn thất. `attention` hoặc `scenario` đánh dấu vấn đề của thiết bị; Lưu ý có thể làm đỏ dây nhưng không chuyển thành Cảnh báo/mất sản lượng. Không bổ sung phép tính tổn hao dây, dòng phản kháng, topology điện thực tế hoặc giả nối lưới ngoài registry. Chi tiết ví dụ: [MONITORING](MONITORING.md).

## Review hiện hành: vấn đề giám sát và lịch sử mẫu

Trong tab Hiện trạng, mức **Cảnh báo** yêu cầu bằng chứng đã ảnh hưởng sản lượng; **Lưu ý** là vượt ngưỡng mẫu nhưng chưa ảnh hưởng sản lượng, kèm nguy cơ có điều kiện. INV-03 dừng phát AC vẫn online và gửi mã lỗi 1. GW-01 độ trễ 850 ms vượt ngưỡng giám sát 500 ms vẫn online, đủ 18 nguồn, số đo còn hợp lệ; đây không phải sự cố phát điện. PV-06 nhiệt 58 °C vượt ngưỡng mẫu 55 °C vẫn phát 4,5 MW DC. Các ngưỡng phục vụ demo, không phải quy chuẩn an toàn của thiết bị thực.

`monitoringIssue` chứa giải thích/ảnh hưởng định lượng hoặc hậu quả có thể xảy ra; `attention` là nguồn mức màu cho danh sách, viền, hover và hồ sơ. Mỗi tín hiệu có `historyTimes` đồng bộ `history`, 31 mẫu 10:00–10:30 ICT, mẫu cuối trùng giá trị/thời điểm hiện tại. Không dùng thời điểm tương lai hay dữ liệu ngẫu nhiên riêng cho từng chart. Hiện trạng được tạo riêng trong `src/lib/monitoring.ts`, không dùng làm đầu vào phiên mô phỏng. Xem [MONITORING](MONITORING.md) cho tích phân/giới hạn; fixture hai cảnh báo nhiệt T01 bên dưới là lịch sử, không phải hiện trạng hiện hành.

## Hiện trạng triển khai sau T02

Mô phỏng sinh telemetry, operation, mã lỗi, chất lượng và trạng thái kịch bản cùng ID/revision/thời điểm. Hiện trạng mẫu có snapshot riêng. HUD, popup, viền, danh sách chú ý và KPI đọc đường Chưa xử lý hoặc Có phương án đang xem; inverter lỗi có AC 0 nhưng vẫn online. DC của PV liên quan bị giới hạn khai thác về 0 theo giả định trong SIMULATION. Sửa chữa khôi phục mã lỗi/khả dụng, không tự xóa fixture nhiệt độ. Ngưỡng nhiệt nằm trong cấu hình baseline tại `src/lib/simulation.ts`.

Chất lượng stale/invalid/missing có fixture kiểm thử chuyên biệt, không có UI hoặc preset mất mạng. Không có broker/IoT thật. Phân tích và hội thoại AI chưa triển khai; các yêu cầu AI dưới đây là đầu vào T03. Xem [T02_ACCEPTANCE](T02_ACCEPTANCE.md) và [T03_HANDOFF](T03_HANDOFF.md).

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

## Review HUD và chi tiết theo yêu cầu mới

Hồ sơ ngắn được chuyển vào HUD góc phải của cảnh 3D, gồm tên/ID/tình trạng/số đo và nút mở dialog chi tiết. Biểu đồ tín hiệu và thiết bị liên quan chỉ xuất hiện trong dialog. Cột bên phải dành cho AI chưa kết nối. Fixture cảnh báo dùng INV-03 nhiệt độ bên trong 78 °C (ngưỡng đỏ ≥70 °C) và PV-06 nhiệt độ module 58 °C (ngưỡng lưu ý ≥55 °C), có `attention.signalId` liên kết đúng tín hiệu. Chỉ số AC/DC và khả dụng vẫn ở điều kiện vận hành; các nhiệt độ chưa được mô hình hóa tác động công suất, không tự biến thành mất điện/kết nối. Reset giữ hai fixture mẫu này. Ngưỡng là giả định demo, đã đưa về cấu hình baseline ở T02A.

Theo review tiếp theo, cảnh báo chỉ dùng vòng dưới chân model; vật liệu không đổi màu. Nhãn chọn hiển thị đúng tín hiệu liên kết qua `attention.signalId` (tên, giá trị và đơn vị). HUD ngắn ưu tiên tín hiệu đó lên đầu, tô đỏ/vàng nhất quán với tình trạng; dialog vẫn có biểu đồ theo cùng tín hiệu.

Review ngày 03/11/2026: dialog chi tiết hiển thị đồng thời toàn bộ tín hiệu, mỗi tín hiệu có giá trị/đơn vị và biểu đồ riêng (PV/inverter có 4, trạm thời tiết có 3, trạm thu gom/gateway có 2 theo registry; không tạo chỉ số thứ tư giả). Hover mở nhãn ngắn độc lập với lựa chọn và camera; click mới mở HUD góc phải. Tình trạng được thể hiện bằng viền theo hình chiếu model: xanh lá bình thường, vàng lưu ý, đỏ cảnh báo. Không đổi telemetry hoặc vật liệu.
