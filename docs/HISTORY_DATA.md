# Nguồn lịch sử Hiệu suất — mốc dữ liệu

Đã triển khai bộ sinh dữ liệu và phép tính; chưa có giao diện module Hiệu suất. Yêu cầu và backlog: [PERFORMANCE_HISTORY](PERFORMANCE_HISTORY.md).

## Cách dùng

```ts
import { createPerformanceHistory, historyRange } from "@/lib/performance-history";
import { historyPreset } from "@/lib/history-dates";

// Capture one instant for the whole view; production may omit now.
const data = createPerformanceHistory({ now: new Date("2026-11-04T05:00:00Z") });
const selected = historyRange(data, historyPreset("7d", data.window));
// selected.summary, selected.byDay, selected.byAsset use the same source.
const branch = historyRange(data, { start: "2026-10-20", end: "2026-10-22" }, "PV-03");
```

- `src/lib/history-dates.ts`: lịch UTC+7, một tháng đến hôm qua, preset, kiểm tra khoảng và kỳ liền trước.
- `src/data/history-model.ts`: cấu hình, ánh xạ 8 cụm/inverter từ registry và lịch tình huống demo.
- `src/lib/performance-history.ts`: sinh dữ liệu, tích phân MWh, tổng hợp ngày/cụm/khoảng.
- `npm run test:history`: kiểm tra phép tính độc lập, không cần browser/server/API key. Suite này cũng được phát hiện bởi suite Playwright mặc định.

## Lịch và tính ổn định

Cửa sổ bắt đầu từ cùng ngày tháng trước đến hôm qua, tính cả hai đầu. Ngày hiện tại/tương lai và ngày ngoài cửa sổ bị từ chối qua `historyRange`/`validateHistoryRange`. Ví dụ 04/11/2026 → 04/10–03/11 (31 ngày); 31/03/2026 → 28/02–30/03, năm nhuận 2024 → 29/02–30/03. Preset 1/3/7 ngày luôn kết thúc hôm qua. Tất cả là toàn cửa sổ hiện có. Kỳ đối chiếu vượt cửa sổ bị từ chối, không cắt ngắn.

Ngày được lưu dưới dạng YYYY-MM-DD theo lịch nhà máy; không dùng múi giờ browser để nhóm dữ liệu. Cửa sổ lấy hôm nay từ một `now` duy nhất. Khi tích hợp UI, khởi tạo từ một mốc chung server/client và cập nhật cửa sổ khi qua nửa đêm UTC+7; bộ sinh không tự chạy timer.

Seed mặc định 20261104, phiên bản `daily-history-v1`. Các biến thiên dùng khóa ngày/thiết bị/khu vực; không dựa trên vị trí của ngày trong cửa sổ, không gọi Math.random. Ngày cũ giữ nguyên khi cửa sổ dịch; đổi seed/phiên bản là đổi nguồn mô phỏng có chủ đích.

## Mô hình minh họa

- Registry giữ 8 cụm, mỗi cụm 6,25 MWp; ánh xạ sang inverter tương ứng, giới hạn 5 MW AC/nhánh và 40 MW AC nhà máy theo cấu hình nền hiện có. Không cộng TR-01 hay DC vào tổng AC.
- Mỗi ngày có 96 khoảng 15 phút, công suất lấy tại trung điểm để tích phân. 06:00–18:00 có 48 khoảng phát điện, ban đêm bằng 0. Giờ nắng cố định là giả định demo, không phải mô hình thiên văn theo địa điểm/mùa.
- Đường bức xạ hình sin, biến thiên theo ngày và mây theo khu A/B; ngày âm u đạt khoảng 25–35% mức nắng. Một số ngày khu B có đám mây cục bộ 11:00–14:00. Nhiệt module = nhiệt môi trường + 0,03 × bức xạ; hệ số nhiệt công suất −0,35%/°C so 25 °C, chặn tối thiểu 0,8.
- Kỳ vọng khỏe mạnh = min(giới hạn AC, MWp × bức xạ/1000 × dcDerating × hiệu suất chuyển đổi × hệ số nhiệt). Đây là giả định chưa hiệu chỉnh với thiết bị thật.
- Actual mô phỏng dùng cùng đường môi trường, nhân hệ số vận hành nhỏ 0,985–1 và tác động bụi/dừng. Vì vậy ngày âm u có thể ít điện mà vẫn đạt trên 98,5% kỳ vọng; không tự đánh giá thiết bị kém chỉ vì ít nắng.
- Tình huống lặp theo chu kỳ 28 ngày neo 04/10/2026, đủ xuất hiện trong mọi cửa sổ một tháng: bụi ở PV-05/06 tăng 2% → 18,2% rồi vệ sinh; INV-03 dừng từ 10:00 ngày chu kỳ 16 đến 09:00 ngày 18; PV-08 thiếu 3 giờ ngày 21 và toàn ngày 22; PV-02 có một giờ dữ liệu cũ ngày 24, một giờ invalid ngày 25. Ngày chu kỳ đánh số từ 0. Metadata ghi tình huống đã dựng, không phải kết quả thuật toán phát hiện bất thường.
- Lịch sử là nguồn mô phỏng độc lập. Không tái dựng hay kéo dài snapshot Hiện trạng cố định 10:00–10:30 ngày 02/11; không hứa khớp từng phút với snapshot đó. Nếu cần một nguồn xuyên module sau này, phải thiết kế riêng, không tự sửa Hiện trạng ở mốc này.

## Chỉ số và chất lượng

`actualEnergyMWh` là tổng các khoảng hợp lệ đã biết; khi chỉ có một phần dữ liệu phải hiển thị **sản lượng ghi nhận một phần**. Khi không có khoảng ban ngày hợp lệ, giá trị là null, không phải 0.

`expectedEnergyMWh` là kỳ vọng cả ngày. `matchedExpectedEnergyMWh` chỉ gồm đúng các khoảng ban ngày có actual hợp lệ. Tỷ lệ = tổng actual / tổng matched expected × 100%; `shortfallMWh` = matched expected − actual. Chênh lệch này chỉ thuộc phần đã có dữ liệu, không ước lượng tổn thất ở các khoảng thiếu. Không dùng kỳ vọng toàn ngày làm mẫu số khi actual thiếu. Kỳ vọng đối chiếu bằng 0 hoặc không có dữ liệu → tỷ lệ null; không chặn tỷ lệ ở 100% nếu nguồn mở rộng có giá trị cao hơn kỳ vọng.

`coveragePct` = số khoảng ban ngày hợp lệ / số khoảng ban ngày dự kiến × 100%. Ban đêm không làm một ngày mất toàn bộ số liệu phát điện trông như vẫn có độ phủ 50%. Quality ngày/khoảng: complete khi đủ, partial khi có một phần, missing khi không có khoảng ban ngày hợp lệ. Stale/invalid/missing đều bị loại khỏi actual và matched reference, không tự suy ra thiết bị dừng hoặc mất kết nối.

Các tỷ lệ nhiều cụm/ngày tính từ tổng năng lượng, không trung bình phần trăm. Tổng theo các nhóm có thể lệch vài chữ số cuối do phép cộng dấu phẩy động; test đối chiếu năng lượng với sai số dưới 10⁻⁹ MWh. Bộ truy vấn từ chối dataset mất/trùng bản ghi ngày/cụm thay vì báo tổng nhỏ hơn như thể nhà máy đầy đủ.

## Bảng xem trước cố định ngày 04/11/2026

Seed mặc định; các giá trị làm tròn để đọc. “Kỳ vọng” là toàn ngày; tỷ lệ của dòng thiếu dữ liệu dùng kỳ vọng trên cùng khoảng hợp lệ.

| Ngày | Cụm | Tình huống | Ghi nhận MWh | Kỳ vọng MWh | Đạt kỳ vọng | Độ phủ |
| --- | --- | --- | ---: | ---: | ---: | ---: |
| 04/10 | PV-01 | Nắng, vận hành bình thường | 36,50 | 37,03 | 98,58% | 100% |
| 06/10 | PV-01 | Âm u, vẫn đạt kỳ vọng | 11,74 | 11,75 | 99,93% | 100% |
| 07/10 | PV-05 | Bắt đầu bám bụi | 31,57 | 32,59 | 96,85% | 100% |
| 16/10 | PV-05 | Bụi tích lũy | 19,51 | 24,15 | 80,76% | 100% |
| 17/10 | PV-05 | Sau vệ sinh | 36,07 | 36,33 | 99,29% | 100% |
| 20/10 | PV-03 | Dừng từ 10:00 | 3,48 | 13,85 | 25,10% | 100% |
| 21/10 | PV-03 | Dừng cả ngày, dữ liệu đủ | 0,00 | 34,70 | 0,00% | 100% |
| 22/10 | PV-03 | Khôi phục lúc 09:00 | 20,73 | 24,61 | 84,25% | 100% |
| 25/10 | PV-08 | Thiếu 3 giờ, ghi nhận một phần | 22,28 | 35,65 | 99,21% | 75% |
| 26/10 | PV-08 | Không có dữ liệu | — | 24,67 | — | 0% |

Toàn cửa sổ: 248 bản ghi ngày/cụm, 23.808 khoảng 15 phút. Ghi nhận **6.543,1198 MWh** (một phần), kỳ vọng toàn cửa sổ **6.741,9075 MWh**, kỳ vọng cùng phần dữ liệu **6.696,4856 MWh**. Đạt kỳ vọng **97,7098%**, chênh lệch phần biết **153,3657 MWh**, độ phủ **99,4288%**. Không diễn giải hiệu giữa actual và kỳ vọng toàn cửa sổ là tổn thất đã xác định.

## Tiếp theo

Gắn nguồn này vào module Hiệu suất độc lập: chọn khoảng/ngày, heatmap, KPI, chart, chi tiết cụm và so sánh. Chưa có UI/API lịch sử, cache lâu dài hoặc kết nối IoT. Phát hiện bất thường vẫn **PENDING** theo yêu cầu người dùng.
