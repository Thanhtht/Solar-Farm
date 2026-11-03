# Hiện trạng mẫu và quy ước vấn đề

Hiện trạng là bộ dữ liệu giả định cố định, không phải IoT/SCADA nhà máy thật. `src/lib/monitoring.ts` tạo snapshot `monitoring-fixture` riêng, dùng công thức DC/AC trong `simulation.ts` nhưng không ghi vào registry hoặc phiên kịch bản. Mô phỏng, kể cả lúc chưa bấm xem kết quả, đọc snapshot của riêng phiên đó. Không thay mô hình nhiệt hoặc preset T02 trong review này.

## Ba vấn đề hiện hành

| Thiết bị | Mức      | Bằng chứng hiện tại                                           | Ảnh hưởng hoặc nguy cơ                                                                                                                  |
| -------- | -------- | ------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------- |
| INV-03   | Cảnh báo | Mã lỗi 1, AC 0 MW từ 10:15; tham chiếu 4,32 MW nếu không lỗi  | Mất 4,32 MW, 1,08 MWh trong 15 phút đến 10:30; vẫn nhận telemetry/heartbeat                                                             |
| PV-06    | Lưu ý    | 58 °C > ngưỡng mẫu 55 °C; DC 4,5 MW, INV-06 vẫn 4,32 MW AC    | Chưa giảm sản lượng do nhiệt trong fixture; nếu tiếp tục tăng/kéo dài có thể giảm hiệu suất, tăng nguy cơ điểm nóng                     |
| GW-01    | Lưu ý    | 850 ms > ngưỡng giám sát mẫu 500 ms; đủ 18 nguồn và heartbeat | Chưa giảm sản lượng; nếu tiếp tục tăng có thể làm chậm số đo/cảnh báo. Mẫu quá 120 giây được đánh dấu cũ, không tự suy ra hỏng thiết bị |

**Cảnh báo** dùng khi đã có tác động sản lượng, phải có tham chiếu, MW, MWh và thời đoạn. **Lưu ý** dùng khi vượt ngưỡng nhưng chưa có tổn thất, phải nêu hậu quả có điều kiện. Các ngưỡng trên chỉ minh họa demo, không thay thế quy chuẩn/khuyến cáo nhà sản xuất. Khả năng xảy ra hậu quả không phải dự báo chắc chắn hoặc công thức tính thiệt hại. Những fixture INV-03 78 °C/PV-06 58 °C cùng cảnh báo nhiệt trong tài liệu T01 cũ không còn là bộ hiện trạng hiện hành; fixture nền T02 của Mô phỏng vẫn giữ độc lập.

## Lịch sử và phép tính

- Ngày 02/11/2026, 31 mẫu mỗi phút từ 10:00 đến 10:30 ICT, dừng ở thời điểm hiện tại của snapshot. `historyTimes` trên từng signal bằng `Run.times`; mẫu cuối bằng số đo hiện tại.
- Hệ số bức xạ tăng tuyến tính 0,9 → 1 từ 10:00 đến 10:15 rồi giữ 1. Bức xạ = 780 × hệ số W/m². Các nhánh không lỗi có DC = 4,5 × hệ số MW; AC = DC × 0,96 (giới hạn 5 MW/inverter, 40 MW toàn nhà máy).
- INV-03 lỗi từ mẫu 10:15, AC = 0; theo giả định T02, nhánh PV-03 bị hạn chế thu công suất DC về 0 khi inverter dừng. Đây là tác động của một sự cố, không tạo thêm cảnh báo độc lập ở PV-03. Đầu ra tham chiếu INV-03 lấy từ INV-01 cùng điều kiện mẫu; không tính tổn thất của cả nhánh hai lần.
- Tổng công suất = tổng 8 inverter = TR-01 = **30,24 MW** tại 10:30. Khả dụng phát điện = 7/8 = **87,5%**, độc lập kết nối vẫn online của 19 thiết bị.
- Năng lượng tích lũy chỉ trong cửa sổ 10:00–10:30, không phải sản lượng cả ngày. Tích phân đầu trái từng khoảng 60 giây: `Σ P[k]/60` MWh = **15,7392 MWh** (UI 15,74).
- Tổn thất = `Σ (P_tham_chiếu_INV03[k] − P_INV03[k])/60` trên cùng khoảng = **1,08 MWh**. Tại mốc nhảy 10:15, khoảng trước đó vẫn phát bình thường; không làm mượt thành nửa phút mất điện.
- Nhiệt PV-06 tăng 50 → 58 °C; độ trễ GW-01 tăng 200 → 850 ms. Nhiệt INV-03 giữ mức bình thường cuối 48,6 °C để không lặp lại hai vấn đề nhiệt. Các tín hiệu khác dùng cùng chuỗi mẫu xác định; tín hiệu ổn định như điện áp DC và số nguồn có đường phẳng, không tạo dao động giả cho đẹp.

HUD và hồ sơ cùng đọc `monitoringIssue`; danh sách, viền và hover đọc cùng `attention`/`assetStatus`. Mức đỏ không làm mất kết nối hoặc đổi chất lượng tín hiệu. Mọi diễn giải và số tổn thất là fixture có công thức, chưa AI hoặc kết nối thiết bị thật.
