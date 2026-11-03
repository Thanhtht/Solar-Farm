# Bàn giao T03 — Phân tích và AI

> **Cập nhật triển khai:** quy tắc và đường hội thoại/API đã có trong code; chi tiết cấu hình, cơ chế ngữ cảnh và giới hạn ở [AI](AI.md), bằng chứng mới ở [STATUS](STATUS.md). Người dùng đã chọn Gemini và lưu Gemini_API tại Vercel; cloud không đọc được binding đó. Chưa xác minh credential/generation thật trên deployment, nên T03 còn mở. Các đoạn “chưa triển khai” bên dưới mô tả mốc bàn giao trước khi bắt đầu; giữ chúng làm đặc tả đầu vào, không triển khai lại phần đã có.

## Mốc bắt đầu và tài liệu ưu tiên

Người dùng đã chấp nhận kết quả T02 trong chat sau mốc ứng dụng **`82cef18`** và yêu cầu chuẩn bị chuyển sang T03 ở chat mới. T03 chưa triển khai. Đây là tài liệu bàn giao hiện hành; không yêu cầu nghiệm thu lại T02 như điều kiện bắt đầu. Việc người dùng chấp nhận không thay cho bằng chứng cloud trực tiếp kiểm tra deployment Vercel.

Đọc AGENTS, PRODUCT, DESIGN, IOT, STATUS, TASKS, [MONITORING](MONITORING.md), [SIMULATION](SIMULATION.md) và [T02_ACCEPTANCE](T02_ACCEPTANCE.md). Các review cũ trong PRODUCT/DESIGN/IOT/STATUS là lịch sử; khi mô tả UI hoặc số liệu khác, dùng tài liệu bàn giao này, MONITORING/SIMULATION hiện hành và code. Dùng checkout hiện có trên phiên bản main mới nhất; không tạo worktree hoặc làm lại T01/T02.

## Giữ nguyên các quyết định đã chốt

- Hai tab Hiện trạng/Mô phỏng, mặc định Hiện trạng; dữ liệu và lựa chọn thiết bị riêng. Mô phỏng bắt đầu từ bản sao Hiện trạng có sẵn ba vấn đề, không phải nhà máy khỏe mạnh.
- Hiện trạng có bốn card mở modal chi tiết. Không khôi phục biểu đồ/thời tiết/danh sách chú ý dưới 3D. Danh sách vấn đề nằm trong card Khả dụng/Tổn thất và dẫn tới đúng thiết bị.
- Mô phỏng chỉ có loại kịch bản, quy mô 1–8 cụm, thời gian 1/2/3/4/6/8/12/24 giờ, Xem kết quả mô phỏng và Về trạng thái ban đầu. Không phục hồi UI nâng cao, phát lại, ba lớp so sánh hoặc biến `activeLayer` đã bị bỏ.
- 19 ID, 16 GLB, camera, vị trí, HUD/hover/dialog/cột AI giữ nguyên. Chấm nhỏ trên dây: xanh bình thường, vàng suy giảm còn công suất, đỏ dừng và không chạy; missing/stale/invalid không giả có dòng.
- Lưu ý có thể là suy giảm thấp chưa cần báo động hoặc vấn đề chưa ảnh hưởng sản lượng. PV-06/INV-06 cùng một vấn đề nhánh; không gộp thành hai sự cố hoặc cộng đôi tổn thất. Không kết luận thiết bị hỏng từ lỗi kết nối/chất lượng dữ liệu.
- Cảnh báo dùng ngôn ngữ vận hành; không chèn lại các đoạn dữ liệu mẫu/giả định vào mỗi cảnh báo. Nhãn nguồn mô phỏng giữ cấp trang; không tuyên bố có IoT/SCADA thật.

## Dữ liệu đã chốt

| Dữ kiện tại 10:30 ICT ngày 02/11/2026 | Giá trị                                                                                           |
| ------------------------------------- | ------------------------------------------------------------------------------------------------- |
| Tổng AC hiện tại                      | 30,1536 MW (UI 30,15)                                                                             |
| Đã phát trong 10:00–10:30             | 15,7248 MWh (UI 15,72)                                                                            |
| Tổn thất đã xảy ra cùng cửa sổ        | 1,0944 MWh (UI 1,09)                                                                              |
| Khả dụng phát điện                    | 7/8 inverter = 87,5%; độc lập kết nối                                                             |
| INV-03                                | Dừng từ 10:15, AC 0; mất 4,32 MW và 1,08 MWh/15 phút; vẫn online                                  |
| PV-06/INV-06                          | Suy giảm 2% từ 10:20; DC 4,41 MW, AC 4,2336 MW; mất 0,0864 MW AC và 0,0144 MWh/10 phút; mức Lưu ý |
| GW-01                                 | 850 ms > ngưỡng 500 ms, còn 18 nguồn; chưa gây tổn thất năng lượng                                |

Lịch sử 31 mẫu mỗi phút từ 10:00–10:30; nhiệt PV-06 58 °C. Ngưỡng và tình huống phục vụ mô phỏng, không phải chẩn đoán đã kiểm định hoặc tiêu chuẩn bảo vệ thiết bị.

## Điểm nối code và ngữ cảnh bắt buộc

- `src/lib/monitoring.ts`: snapshot Hiện trạng và nguồn ban đầu Mô phỏng; `monitoring-metrics.ts`: chi tiết bốn card, tích phân và tham chiếu cùng bức xạ.
- `src/components/dashboard.tsx`: `view`, `selected` theo tab, `current`, `simulationInitial`, `session`, `submitted`. Nguồn hiển thị là `current` khi Hiện trạng; `simulationInitial` khi Mô phỏng chưa áp dụng; `session.untreated` khi đã áp dụng.
- Đổi cấu hình tạo session/revision mới và đặt `submitted=false`. Nút xem đặt `submitted=true`; nút về ban đầu tăng revision, bỏ kind/kết quả, trả 1 cụm/1 giờ và nguồn ban đầu. Đổi tab giữ cấu hình/kết quả, không reset tự động.
- `Session.phase` trên UI hiện hành có thể vẫn là preview ngay cả khi đã bấm xem kết quả; không dùng phase/elapsed để đoán kết quả đã áp dụng. `activeLayer` không tồn tại trên UI. Core vẫn có base/untreated/treated và API playback/can thiệp để kiểm thử, không phải phần UI cần xây lại.
- Phải gọi **`forecast(session.config, session.initial)`**, không dùng `forecast(config)` cho UI. Không truyền initial là đường khỏe mạnh 34,56 MW phục vụ test, khác nền UI 30,1536 MW.
- `powerAt(config, 0, false, session.initial)` là công suất lúc tác động; giảm MW so với `referencePower(session.initial)`. Forecast là **mất thêm dự kiến trong toàn thời đoạn tương lai**, không phải mất đã quan sát. Không cộng 1,0944 MWh quá khứ vào forecast. Ví dụ lỗi toàn bộ 1 giờ mất thêm 30,1536 MWh, 24 giờ 723,6864 MWh.
- `Run.energyMWh/lossMWh` của session bắt đầu 0 và chỉ tích phân tương lai từ 10:30, trong khi lịch sử tín hiệu seed 31 mẫu trước đó. Không lấy số Run preview bằng 0 làm kết luận forecast không mất năng lượng; không tích phân lại toàn lịch sử rồi cộng vào kết quả.
- Asset có `operation`, `connection`, `attention`, `monitoringIssue`, `operatingState`, `scenario`; Signal có ID/đơn vị/quality/value có thể null/sampledAt/history/historyTimes. Metadata vấn đề có sẵn phải phân biệt với tác động mới; giữ số nguồn gốc khi đổi thiết bị.

Snapshot gửi API tối thiểu: mode, selected asset ID, run ID/revision, `submitted`, config đã áp dụng/thời đoạn, mốc quan sát, tín hiệu cần thiết kèm chất lượng/đơn vị, KPI lịch sử và forecast tách trường, issue/quan hệ. Hiện trạng và bản sao ban đầu có thể cùng snapshot ID; **ID riêng lẻ không đủ định danh ngữ cảnh**. Dùng context key gồm mode + asset + revision + trạng thái áp dụng/cấu hình. Giới hạn payload/lịch sử; không gửi GLB hoặc dữ liệu không cần thiết.

## Phạm vi thực hiện T03

1. Nhận định theo quy tắc: bất thường → bằng chứng → ảnh hưởng → việc nên kiểm tra → giới hạn. Ghi rõ chế độ Phân tích mô phỏng/theo quy tắc, không giả AI API.
2. Hội thoại trong cột AI theo thiết bị/ngữ cảnh đang chọn và phân tích chủ động theo sự kiện. Vì UI không có nút phát lại/hoàn thành lượt, sự kiện công khai là snapshot ban đầu và **bấm áp dụng kết quả kịch bản**; không chờ `phase=complete` để hiện phân tích. Không gọi API mỗi lần hover/xoay camera/chọn tham số hoặc mỗi tick.
3. Tách dữ kiện tính sẵn khỏi diễn giải AI; AI không tạo số tổn thất mới, không chẩn đoán chắc chắn ngoài dữ liệu, không điều khiển thiết bị hoặc tự thực hiện bảo trì.
4. Cập nhật: đã chọn Gemini, biến `Gemini_API` ở Vercel, model mặc định `gemini-2.5-flash` (override bằng `GEMINI_MODEL`), adapter đã có. Chưa xác minh credential/generation thật; xem `AI.md` cho cờ bật, mã truy cập và quota. Không hỏi lại nhà cung cấp/tên biến hoặc quyết định UI; không yêu cầu gửi giá trị secret trong chat.
5. API ở máy chủ; không để khóa trong biến public/browser/Git/log. Giới hạn tần suất/ngân sách, chiều dài câu hỏi/đáp án/payload, timeout; gộp/chống gọi lặp cho cùng sự kiện. Không dùng cơ chế public không giới hạn chi phí khi deploy demo.
6. Đổi tab/thiết bị/cấu hình/applied state/reset khi đang chờ phải hủy hoặc loại đáp án cũ theo context key. Hội thoại cũ có thể giữ nhưng phải ghi đúng nguồn, không hiện như trả lời cho thiết bị mới.
7. Thiếu cấu hình/lỗi/timeout/quality xấu phải có trạng thái rõ và giữ mô phỏng hoạt động. Có thể hoàn thành phần theo quy tắc khi chưa có credential, nhưng không đánh dấu toàn bộ T03 hoàn tất nếu chưa kiểm tra API thật.

## Kiểm tra và bàn giao T03

- Phân tích đúng ba vấn đề nền, không cộng đôi PV-06/INV-06 hoặc trạm thu gom; phân biệt Lưu ý suy giảm nhẹ với dừng đỏ.
- Giữ riêng số đã mất quá khứ/forecast phát sinh thêm và các đơn vị MW/MWh/MWp. Không dùng baseline khỏe mạnh thay nền UI.
- Test race khi đổi mode/asset/revision/submitted/reset lúc request chờ; lỗi/timeout/thiếu credential không kẹt trạng thái loading, không lộ secret.
- Browser: chọn thiết bị → hỏi → đọc trả lời đúng nguồn; phân tích chủ động khi áp dụng; liên kết đúng thiết bị; thử reset/đổi tab/mobile. Giữ GLB, camera và các luồng T02 đã chốt.
- Chạy typecheck/build và test phù hợp. Bằng chứng trước T03: 33/33 bài qua ở `82cef18`, không coi đó là bằng chứng AI đã hoạt động.
- Chỉ ghi API đã tích hợp khi có request thật thành công. Cập nhật STATUS/README/cấu hình, commit và push main theo phạm vi được giao; không mở T04/T05 hoặc publish cấu hình cloud.

## Prompt mở chat mới

```text
Tiếp tục Solar-Farm trên GitHub main mới nhất trong checkout hiện tại.
T01/T02 đã được chấp nhận; mốc ứng dụng T02 là 82cef18.
Đọc AGENTS.md, docs/PRODUCT.md, docs/DESIGN.md, docs/IOT.md,
docs/STATUS.md, docs/TASKS.md, docs/MONITORING.md,
docs/SIMULATION.md, docs/T02_ACCEPTANCE.md và docs/T03_HANDOFF.md.
Thực hiện T03 theo bàn giao hiện hành: nhận định chủ động và hội thoại AI
đúng thiết bị, đúng nguồn Hiện trạng/Mô phỏng.
Giữ giao diện, model, chấm dòng điện, quy ước màu và logic T02 đã chốt;
không khôi phục UI nâng cao/phát lại hoặc hỏi lại các quyết định đã chấp nhận.
Kiểm tra cấu hình AI có sẵn trước khi hỏi thêm; không yêu cầu giá trị secret trong chat.
Chạy kiểm tra phù hợp, cập nhật tài liệu, tạo commit và push GitHub main để test Vercel.
Chưa mở T04/T05 và không publish cấu hình cloud.
```
