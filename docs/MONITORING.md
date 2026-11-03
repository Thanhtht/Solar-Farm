# Hiện trạng mẫu và quy ước vấn đề

## Điều chỉnh hiện hành: nhánh 06 suy giảm nhẹ

PV-06/INV-06 giảm 2% từ 10:20 đến 10:30, vẫn phát 4,41 MW DC/4,2336 MW AC; mất 0,0864 MW AC và 0,0144 MWh. Một vấn đề nhánh được ghi tại PV-06, INV-06 có cùng trạng thái vận hành/giải thích, không đếm thêm sự kiện hay mất mát. Giữ mức Lưu ý vì suy giảm thấp, chưa cần báo động. GW-01 vẫn Lưu ý chưa ảnh hưởng sản lượng; INV-03 vẫn Cảnh báo dừng hoàn toàn.

Tổng Hiện trạng mới: 30,1536 MW AC; 15,7248 MWh đã phát, 16,8192 MWh dự kiến không có sự cố, 1,0944 MWh đã mất (1,08 + 0,0144). Khoảng 10:00–10:15 phát 8,1792 MWh; 10:15–10:30 phát 7,5456 MWh. Mô phỏng nhận bản sao đúng nền mới. Màu đường điện xanh/vàng/đỏ theo bình thường/suy giảm/dừng; đỏ không có chấm chạy. Nội dung UI không nhắc dữ liệu mẫu trong cảnh báo; nguồn mô phỏng vẫn ghi chung cấp trang. Các số nền 30,24 MW/PV-06 chưa giảm bên dưới là lịch sử trước review này, công thức và các giả định chưa bị thay thế vẫn dùng.

Hiện trạng là bộ dữ liệu giả định cố định, không phải IoT/SCADA nhà máy thật. `src/lib/monitoring.ts` tạo snapshot `monitoring-fixture` bằng công thức DC/AC trong `simulation.ts`. Mô phỏng bắt đầu từ một bản sao độc lập của cùng dữ liệu này; `Session.initial` clone lại khi tạo phiên. Kịch bản áp dụng lên nền có ba vấn đề, không sửa Hiện trạng. Nút “Về trạng thái ban đầu” bỏ tác động và phục hồi snapshot sao chép. Kết quả kịch bản là mất thêm trong thời gian tương lai, không cộng tổn thất 1,08 MWh quá khứ. Chi tiết tại [SIMULATION](SIMULATION.md).

Thông tin dưới trang Hiện trạng được chuyển vào cửa sổ của bốn card: Công suất AC (đồ thị/từng inverter/thời tiết), Năng lượng tích lũy (đồ thị/bảng theo 15 phút), Khả dụng (đồ thị %/ba vấn đề/liên kết), Tổn thất (đồ thị/phép tính/INV-03). `monitoring-metrics.ts` lấy cùng lịch sử để tính năng lượng và tham chiếu từ bức xạ; không lấp mẫu thiếu bằng 0.

## Ba vấn đề hiện hành

| Thiết bị | Mức      | Bằng chứng hiện tại                                           | Ảnh hưởng hoặc nguy cơ                                                                                                                  |
| -------- | -------- | ------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------- |
| INV-03   | Cảnh báo | Mã lỗi 1, AC 0 MW từ 10:15; tham chiếu 4,32 MW nếu không lỗi  | Mất 4,32 MW, 1,08 MWh trong 15 phút đến 10:30; vẫn nhận telemetry/heartbeat                                                             |
| PV-06    | Lưu ý    | 58 °C > ngưỡng mẫu 55 °C; DC 4,5 MW, INV-06 vẫn 4,32 MW AC    | Chưa giảm sản lượng do nhiệt trong fixture; nếu tiếp tục tăng/kéo dài có thể giảm hiệu suất, tăng nguy cơ điểm nóng                     |
| GW-01    | Lưu ý    | 850 ms > ngưỡng giám sát mẫu 500 ms; đủ 18 nguồn và heartbeat | Chưa giảm sản lượng; nếu tiếp tục tăng có thể làm chậm số đo/cảnh báo. Mẫu quá 120 giây được đánh dấu cũ, không tự suy ra hỏng thiết bị |

**Cảnh báo** dùng khi đã có tác động sản lượng, phải có tham chiếu, MW, MWh và thời đoạn. **Lưu ý** dùng khi vượt ngưỡng nhưng chưa có tổn thất, phải nêu hậu quả có điều kiện. Các ngưỡng trên chỉ minh họa demo, không thay thế quy chuẩn/khuyến cáo nhà sản xuất. Khả năng xảy ra hậu quả không phải dự báo chắc chắn hoặc công thức tính thiệt hại. Những fixture INV-03 78 °C/PV-06 58 °C cùng cảnh báo nhiệt trong tài liệu T01 cũ không còn là bộ hiện trạng hiện hành; fixture nền khỏe mạnh T02 chỉ giữ để đối chiếu test khi không truyền snapshot ban đầu; UI Mô phỏng dùng bản sao hiện trạng.

## Lịch sử và phép tính

- Ngày 02/11/2026, 31 mẫu mỗi phút từ 10:00 đến 10:30 ICT, dừng ở thời điểm hiện tại của snapshot. `historyTimes` trên từng signal bằng `Run.times`; mẫu cuối bằng số đo hiện tại.
- Hệ số bức xạ tăng tuyến tính 0,9 → 1 từ 10:00 đến 10:15 rồi giữ 1. Bức xạ = 780 × hệ số W/m². Các nhánh không lỗi có DC = 4,5 × hệ số MW; AC = DC × 0,96 (giới hạn 5 MW/inverter, 40 MW toàn nhà máy).
- INV-03 lỗi từ mẫu 10:15, AC = 0; theo giả định T02, nhánh PV-03 bị hạn chế thu công suất DC về 0 khi inverter dừng. Đây là tác động của một sự cố, không tạo thêm cảnh báo độc lập ở PV-03. Đầu ra tham chiếu INV-03 lấy từ INV-01 cùng điều kiện mẫu; không tính tổn thất của cả nhánh hai lần.
- Tổng công suất = tổng 8 inverter = TR-01 = **30,24 MW** tại 10:30. Khả dụng phát điện = 7/8 = **87,5%**, độc lập kết nối vẫn online của 19 thiết bị.
- Năng lượng tích lũy chỉ trong cửa sổ 10:00–10:30, không phải sản lượng cả ngày. Tích phân đầu trái từng khoảng 60 giây: `Σ P[k]/60` MWh = **15,7392 MWh** (UI 15,74).
- Tổn thất = `Σ (P_tham_chiếu_INV03[k] − P_INV03[k])/60` trên cùng khoảng = **1,08 MWh**. Tại mốc nhảy 10:15, khoảng trước đó vẫn phát bình thường; không làm mượt thành nửa phút mất điện.
- Nhiệt PV-06 tăng 50 → 58 °C; độ trễ GW-01 tăng 200 → 850 ms. Nhiệt INV-03 giữ mức bình thường cuối 48,6 °C để không lặp lại hai vấn đề nhiệt. Các tín hiệu khác dùng cùng chuỗi mẫu xác định; tín hiệu ổn định như điện áp DC và số nguồn có đường phẳng, không tạo dao động giả cho đẹp.

HUD và hồ sơ cùng đọc `monitoringIssue`; danh sách, viền và hover đọc cùng `attention`/`assetStatus`. Mức đỏ không làm mất kết nối hoặc đổi chất lượng tín hiệu. Mọi diễn giải và số tổn thất là fixture có công thức, chưa AI hoặc kết nối thiết bị thật.

## Đường điện và animation

`src/lib/power-network.ts` dựng 8 tuyến DC và 8 tuyến AC từ quan hệ thiết bị; `src/components/power-network.tsx` hiển thị dây và mũi tên. Nhánh INV-03 (PV-03 → INV-03 → TR-01) đỏ, 0 MW nên không có mũi tên. Nhánh PV-06 → INV-06 → TR-01 đỏ vì nhiệt độ vượt ngưỡng, nhưng 4,5 MW DC/4,32 MW AC nên mũi tên vẫn chạy; đó vẫn là Lưu ý, không tự phát sinh tổn thất. Các nhánh khác xanh. Lưu ý độ trễ GW-01 không làm đổi màu dây điện vì gateway không thuộc chuỗi công suất.

Màu dây đỏ biểu thị nhánh liên quan thiết bị có vấn đề, còn mức Lưu ý/Cảnh báo và mất sản lượng vẫn đọc từ snapshot đã định nghĩa phía trên. Thiếu/cũ/invalid không được biểu diễn thành có dòng điện: không chạy mũi tên; nếu không có vấn đề đã biết thì dây xám. Tốc độ mũi tên chỉ minh họa chiều truyền, không tỷ lệ với tốc độ electron, dòng A hoặc MW và không làm thay đổi dữ liệu/lịch sử.

Dây được bố trí nổi theo cạnh cụm pin và lối kỹ thuật để nhìn rõ, không phải hồ sơ hoàn công hoặc thiết kế an toàn điện. Hiệu ứng dùng một nhóm mũi tên instanced, lịch vẽ 24 lần/giây khi có công suất, dừng khi trang ẩn hoặc người dùng yêu cầu giảm chuyển động (giữ mũi tên tĩnh). Không chặn raycast chọn thiết bị. Cả hai tab lấy snapshot riêng, kể cả bản nháp Mô phỏng. Không thêm tải/lưới ngoài nhà máy, không nối điện tới MET-01/GW-01 và không tính tổn hao cáp.
