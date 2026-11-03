# T02 — Mô hình mô phỏng và so sánh phương án

## Hai nguồn dữ liệu độc lập

Tab **Hiện trạng** giữ snapshot mẫu cố định, không có kết nối nhà máy thật. Tab **Mô phỏng** giữ cấu hình, revision, đồng hồ và ba đường tính riêng: cơ sở, chưa xử lý, có phương án. KPI, hồ sơ, tooltip, cảnh báo, viền và vật liệu 3D đọc cùng đường đang xem. Thay lớp Chưa xử lý/Có phương án chỉ đổi nguồn hiển thị, không đổi mốc thời gian. Không ghi dữ liệu mô phỏng vào Hiện trạng.

Registry/model/bố trí/19 ID T01 giữ nguyên ở `src/data/plant.ts`. Cấu hình nền và telemetry ở `src/lib/simulation.ts`; mô hình sự kiện, tích phân, so sánh và vòng đời ở `src/lib/scenario-simulation.ts`. `asset-status.ts` thống nhất trạng thái hiển thị. Annotation “xem thử” độc lập số đo nền của review trước đã được thay bằng dữ liệu tính thật theo kịch bản.

## Điều kiện và công thức nền

Nhà máy hư cấu 50 MWp DC / giới hạn 40 MW AC, tám cụm 6,25 MWp cấp tám inverter 5 MW AC. Mốc ban đầu 02/11/2026 10:30 ICT. Seed cố định 1, điều kiện nền hằng, không sinh số ngẫu nhiên: bức xạ 780 W/m², nhiệt độ môi trường 31 °C, gió 2,4 m/s.

- Pdc mỗi cụm = 6,25 × (780/1000) × (12/13) = 4,5 MW. Hệ số 12/13 hiệu chỉnh minh họa để khớp fixture T01, chưa phải mô hình đã kiểm định.
- Vdc mạch tương đương = 1000 V; Idc = Pdc × 10⁶/Vdc = 4500 A.
- Pac = min(5 MW, Pdc × 0,96) = 4,32 MW/inverter. Tổng DC 36 MW, AC 34,56 MW. Trạm thu gom lấy tổng inverter, không cộng lại vào KPI.
- Nhiệt độ INV-03 78 °C (ngưỡng đỏ ≥70), PV-06 58 °C (vàng ≥55) giữ làm fixture review. Chưa mô hình hóa tác động nhiệt lên công suất/khả dụng. Cảnh báo nhiệt có mức nghiêm trọng cao hơn vẫn được giữ khi đổi kịch bản hoặc sửa inverter.

## Ba kịch bản

Sự kiện bắt đầu ở phút 0; mỗi mẫu cách 60 giây mô phỏng. Thời đoạn đánh giá 5–120 phút.

| Kịch bản | Phạm vi | Tác động | Mặc định | Cuối thời đoạn |
| --- | --- | --- | --- | --- |
| Mây che | 1–8 cụm; mặc định PV-01, PV-02, PV-05, PV-06 | Pdc giảm theo mức che, Idc và Pac tính lại; khả dụng không giảm | 45%, 30 phút | Mây hết che, công suất phục hồi tự nhiên |
| Bám bụi | 1–8 cụm, mặc định một cụm tại inverter mục tiêu | Pdc giảm theo tỷ lệ bụi; Idc/Pac tính lại; khả dụng không giảm | 20%, 60 phút | Bụi vẫn còn nếu chưa vệ sinh |
| Lỗi inverter | 1–8 inverter và PV liên quan, mặc định một | Pac = 0, mã lỗi = 1, khả dụng giảm theo số inverter lỗi; PV bị giới hạn khai thác DC về 0 | 30 phút | Lỗi vẫn còn nếu chưa có phương án khôi phục |

Mây giảm 0–100%, bụi 0–50%. Suy giảm Pdc = Pdc nền × (1 − tỷ lệ). Vdc giữ hằng trong mô hình đơn giản. MET-01 là điểm đo môi trường chung ngoài vùng mây cục bộ, không giả rằng toàn nhà máy cùng bị giảm bức xạ đo được. Inverter lỗi vẫn online và gửi telemetry; không tự tạo lỗi gateway.

Vật liệu bụi và mây được gắn với tỷ lệ suy giảm hiện tại của đường đang xem; phục hồi 100% gỡ lớp minh họa. Không tô cả nhà máy lỗi nếu chỉ có một inverter hỏng. Quy mô `scale` giới hạn 1–8 cụm, làm tròn số nguyên. Mây ưu tiên thứ tự INV-01, 02, 05, 06, 03, 04, 07, 08 để mặc định giữ bốn cụm trái. Bụi/lỗi bắt đầu từ inverter mục tiêu rồi các ID còn lại theo registry. `affectedInverters()` là nguồn phạm vi chung cho tính toán và 3D. Target `all` vẫn phục vụ test; UI chọn toàn nhà máy bằng quy mô 8, không có preset thứ tư.

## Tích phân năng lượng và biên sự kiện

Mẫu tại phút k biểu diễn công suất không đổi trên khoảng **[k, k+1)**. Năng lượng tăng mỗi bước = P[k] × 1/60 MWh. Mẫu ở phút kết thúc là trạng thái tại biên tiếp theo, không được dùng thay công suất của khoảng vừa trôi qua. Cách tích phân này giữ đúng bước nhảy khi mất điện, sửa chữa hoặc mây kết thúc, không làm mất nửa bước như hình thang tại gián đoạn.

Tổn thất tích lũy = năng lượng cơ sở đến hiện tại − năng lượng đường đang xem. Năng lượng dự kiến toàn kỳ tính trên toàn thời đoạn, ghi nhãn riêng và không đưa các mẫu tương lai vào biểu đồ lịch sử. T02A độc lập giữ API tích phân hình thang cho đường nền hằng; T02B/C dùng tích phân từng khoảng như trên.

Ví dụ mặc định: nền 34,56 MW trong 1 giờ = 34,56 MWh; mây 45% trên bốn cụm trong 30 phút mất 3,888 MWh; bụi 20% trên một cụm trong 60 phút mất 0,864 MWh; inverter lỗi 30 phút mất 2,16 MWh.

## Phương án và đối chiếu T02C

Bật “Thử phương án vệ sinh” cho bụi hoặc “Thử phương án khôi phục inverter” cho sự cố. Chọn phút hoàn tất từ 0 đến hết thời đoạn; đây là giả định, không phải lệnh vận hành thật.

- Bụi: sau thời điểm hoàn tất, phần suy giảm còn lại = mức bụi × (1 − tỷ lệ khôi phục). Tỷ lệ 0–100% chỉ áp dụng phần tổn thất do bụi, không vượt đường cơ sở.
- Lỗi: đầu ra được khôi phục hoàn toàn từ phút hoàn tất trở đi, mã lỗi trở về 0 và khả dụng hồi phục; fixture nhiệt nếu có vẫn tồn tại.
- Mây: chỉ theo dõi thời tiết và phục hồi tự nhiên, không có thao tác sửa mây.

Ba đường dùng cùng seed, thời gian và môi trường. Năng lượng thu hồi = tích phân Pac có phương án − Pac chưa xử lý. Sửa ở phút 0 tránh toàn bộ tổn thất; sửa đúng cuối thời đoạn không thu hồi năng lượng trong thời đoạn đó. Ví dụ vệ sinh 100% ở phút 30/60 thu hồi 0,432 MWh; sửa inverter ở phút 15/30 thu hồi 1,08 MWh. Chưa tính chi phí, lợi nhuận hoặc ROI.

## Vòng đời và tính xác định

Mở tab Mô phỏng ở điều kiện cơ sở. Chọn một preset cập nhật bản **Xem thử tại phút 0** ngay, năng lượng tích lũy 0. Thay loại/vùng/mức/thời đoạn hoặc giả định can thiệp kết thúc lượt cũ, tăng revision và xóa lịch sử/kết quả cũ; không cần bấm chạy để xem tác động tức thời hoặc dự kiến toàn kỳ.

Chạy phát lại từ phút 0; tạm dừng giữ đồng hồ, năng lượng, quality và lịch sử. Tiếp tục giữ cùng revision. Đổi tốc độ 1/5/15 phút mô phỏng mỗi giây chỉ thay số bước phát lại, không thay kết quả tại cùng thời điểm. Hoàn thành tự dừng ở cuối thời đoạn. Chạy lại tạo revision mới; Đặt lại trả về cơ sở không sự kiện, xóa phương án/lịch sử/lựa chọn cũ. Chuyển về Hiện trạng hoặc ẩn tab trình duyệt tạm dừng; quay lại phải chủ động tiếp tục.

ID/revision của đường và các tín hiệu được gắn cùng nhau; lịch sử chứa đúng các mẫu đã phát lại từ đầu lượt đến hiện tại. Bộ tính thuần cho kết quả lặp lại với cùng đầu vào. Camera/model không remount khi đổi tham số hoặc cập nhật số liệu.

## Chất lượng dữ liệu

Chất lượng tín hiệu valid/stale/invalid/missing và heartbeat độc lập vận hành. Quá 120 giây mô phỏng mới stale; không dùng giờ máy để làm stale khi pause. Null giữ là thiếu, không đổi thành 0. Lịch sử không dùng được ghi null và không nối qua khoảng thiếu. Tổng đo AC là null nếu thiếu bất kỳ inverter nào, kèm số nguồn thiếu; năng lượng/khả dụng theo mô hình được ghi nhãn riêng. Fixture thiếu/cũ/lỗi online ở T02A tiếp tục có test, không thêm preset mạng.

## Giới hạn

Đây là mô hình minh họa có công thức, chưa hiệu chỉnh/kiểm định với nhà máy thật. Chưa mô phỏng nhiệt động lực, bức xạ không gian chi tiết, chất lượng điện/lưới, bảo vệ, SCADA, broker hoặc dữ liệu máy chủ. AI thuộc T03, chưa tích hợp. Chromium SwiftShader không thay nghiệm thu GPU/cảm ứng trên thiết bị thật.

## Luồng chính sau review đơn giản hóa

Người dùng chọn loại, số cụm ảnh hưởng và thời gian ở thanh phía trên khung 3D; kết quả chính là công suất giảm/mất tại lúc có sự kiện và sản lượng mất toàn thời đoạn chưa xử lý. Tỷ lệ phần trăm so với công suất nền toàn nhà máy. Nút Chạy mô phỏng phát lại hình ảnh theo thời gian. Mức giảm mặc định 45% cho mây, 20% cho bụi, lỗi mất toàn đầu ra; chỉ chỉnh khi mở tùy chọn nâng cao. Biểu đồ, tốc độ và can thiệp T02C vẫn có nhưng được thu gọn mặc định. Quy mô thay đổi phải cập nhật đồng thời MW/MWh, số thiết bị suy giảm/sự cố và lớp 3D.
