# T02 — Bộ tính và nguồn dữ liệu hiện hành

Mốc ứng dụng đã chấp nhận: `82cef18`. UI không có phát lại/nâng cao/ba lớp so sánh; core vẫn giữ API T02C và test. Các quy tắc hiện hành dưới đây thay các review cũ trong STATUS/PRODUCT. Không mở lại UI đã bỏ khi triển khai T03.

## Nguồn UI và baseline

Hiện trạng giữ snapshot cố định riêng; Mô phỏng có `simulationInitial` cùng dữ kiện nhưng đối tượng độc lập và `Session.initial` clone nguồn. Nền UI có INV-03 lỗi, nhánh 06 factor 0,98, GW-01 trễ; tổng AC **30,1536 MW**. Quá khứ 10:00–10:30 đã phát 15,7248 MWh, đã mất 1,0944 MWh. Chi tiết tại [MONITORING](MONITORING.md).

`submitted=false`: UI dùng bản sao ban đầu, kết quả —. `submitted=true`: 3D/hồ sơ/dây dùng `session.untreated` tại mốc tác động; kết quả lấy forecast toàn thời đoạn. `Session.phase` có thể vẫn preview, `elapsed=0` ngay cả khi đã bấm xem. Không có `activeLayer` trên UI.

Đổi tham số tạo revision mới và vô hiệu kết quả; nút Về trạng thái ban đầu bỏ kind/kết quả, về 1 cụm/1 giờ, INV-01/camera tổng quan và phục hồi nền. Đổi tab giữ kết quả/cấu hình, không ghi ngược Hiện trạng. Mức giảm mặc định mây 45%, bụi 20%, lỗi 100%. UI chỉ lộ kịch bản/quy mô/thời gian theo giờ; severity/target/intervention còn ở core, không tự thêm control mới.

## Công thức nền và sự kiện

Nhà máy 50 MWp DC / giới hạn 40 MW AC; 8 cụm 6,25 MWp, 8 inverter 5 MW AC. Thời điểm nền 02/11/2026 10:30 ICT; seed 1; bước 60 giây. Bức xạ cuối 780 W/m², môi trường 31 °C, gió 2,4 m/s. Không có chu kỳ ngày đêm, nên 24 giờ là đánh giá điều kiện hằng, không phải dự báo sản lượng thực.

- Mỗi cụm khỏe: Pdc = 6,25 × (780/1000) × (12/13) = 4,5 MW; Vdc 1000 V; Idc = Pdc × 10⁶/Vdc. Pac = min(5, Pdc × 0,96) = 4,32 MW.
- Factor kịch bản nhân factor nền; lỗi là hợp lỗi nền và lỗi sự kiện. INV-03 đã dừng không phát sinh thêm mất mát khi chịu kịch bản. Nhánh 06 ban đầu 4,41 MW DC/4,2336 MW AC. Tổng trạm = tổng inverter, không cộng trạm hai lần.
- Mây/bụi giảm factor DC; mây kết thúc tự phục hồi về **nền có vấn đề**, bụi kéo dài nếu không vệ sinh. Lỗi dừng AC, mã lỗi 1 nhưng IoT vẫn online, DC nhánh bị hạn chế về 0. Repair/cleaning của T02C chỉ khôi phục phần sự kiện, không chữa lỗi/giảm nền có sẵn.
- `powerAt(config, minute, treated, initial)`: công suất tại thời điểm; `referencePower(initial)` là nền. `forecast(config, initial)`: chuẩn hóa rồi tích phân từng khoảng phút `P[k]/60`; mất thêm = nền cùng thời đoạn − năng lượng kịch bản, thu hồi = có phương án − chưa xử lý, không vượt nền.
- **UI/T03 phải truyền `session.initial`**. Không truyền initial là đường benchmark khỏe mạnh 34,56 MW của test cũ, không phải nền UI.

| Kịch bản UI 1 giờ       | Công suất giảm thêm | Sản lượng mất thêm |
| ----------------------- | ------------------- | ------------------ |
| Mây mặc định 4 cụm trái | 7,73712 MW          | 7,73712 MWh        |
| Bụi INV-01 20%          | 0,864 MW            | 0,864 MWh          |
| Lỗi INV-01              | 4,32 MW             | 4,32 MWh           |
| Lỗi toàn bộ 8 inverter  | 30,1536 MW          | 30,1536 MWh        |

Toàn bộ lỗi 24 giờ mất thêm 723,6864 MWh (UI 723,69). Không cộng lại 1,0944 MWh quá khứ. Cloud order: INV-01,02,05,06,03,04,07,08; bụi/lỗi đi từ target rồi các ID còn lại. Quy mô 1–8, duration 5–1440 phút nội bộ; UI chỉ 1/2/3/4/6/8/12/24 giờ. NaN/Infinity bị từ chối, các số hữu hạn chặn trong giới hạn; fault severity=100, dust tối đa 50%, cloud tối đa 100% ở core.

## Lịch sử, phiên và trạng thái

`createSession(config, revision, initial)` clone nguồn, sinh base/untreated/treated. Các signal seed 31 mẫu 10:00–10:30, thay mẫu cuối theo sự kiện tại 10:30; `Run.energyMWh/lossMWh` phiên bắt đầu 0 và chỉ tích phân tương lai khi gọi tick. Đừng tích phân lại lịch sử seed hoặc coi số Run preview 0 là forecast không mất năng lượng. Snapshot ban đầu giữ số tích lũy quá khứ riêng.

Core `sessionAction` có play/pause/tick/restart/reset; revision tăng khi tạo lại, reset giữ initial. UI không dùng timer/playback, không có chuyển layer. T03 gắn sự kiện phân tích với snapshot/submit/reset hiện hành thay vì chờ hoàn thành phát lại.

Asset có attention/operatingState/scenario và giải thích vấn đề có sẵn. Nhánh 06 một attention ở PV-06, INV-06 cùng trạng thái, không đếm đôi. Khi chịu kịch bản, metadata quá khứ ghi rõ trước kịch bản. Dây/viền dùng trạng thái hiện tại: xanh bình thường, vàng suy giảm còn công suất, đỏ dừng, không có chấm chạy trên dây đỏ. Giảm đến 0 vì mây cũng stopped; không cần giả thêm mã lỗi.

## Chất lượng, giới hạn và kiểm tra

Quality valid/stale/invalid/missing riêng connection/heartbeat và operation; thiếu/cũ/invalid không thay bằng 0. Stale khi quá 120 giây mô phỏng, không dùng đồng hồ máy khi đang dừng. Fault vẫn có thể online. Bộ fixture chất lượng chỉ phục vụ test, không tạo preset mất mạng trên UI.

Đây là mô hình minh họa chưa hiệu chỉnh với nhà máy: chưa tính clipping chi tiết, tổn hao dây, tổn thất lưới/điện phản kháng, từng tấm pin, khí tượng ngày đêm hoặc mô hình nhiệt vật lý. Không có broker/SCADA/AI API thật; chấm điện không phải tốc độ electron hay phép đo công suất.

Bằng chứng tại `82cef18`: typecheck/build/Prettier/diff check và 33/33 test qua. Test bao phủ MW/MWh, biên sự kiện/can thiệp, replay xác định, quality, nguồn ban đầu/mất thêm/reset, ba vấn đề, màu/chấm và các tương tác UI. Xem [T02_ACCEPTANCE](T02_ACCEPTANCE.md) và [STATUS](STATUS.md) để phân biệt người dùng chấp nhận với kiểm chứng deployment bằng công cụ.
