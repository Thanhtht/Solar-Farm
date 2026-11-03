# Bàn giao T03 — Phân tích và AI

## Cập nhật nền nhánh 06

Hiện trạng và nền Mô phỏng nay có PV-06/INV-06 giảm nhẹ 2%: tổng AC 30,1536 MW, quá khứ đã phát 15,7248 MWh/mất 1,0944 MWh. Lưu ý có thể có suy giảm thấp, không chỉ vượt ngưỡng chưa tổn thất. `operatingState` đồng bộ thiết bị trong cùng nhánh; một attention tại PV-06, không tính INV-06 thành mất mát thứ hai. Màu normal/degraded/stopped là xanh/vàng/đỏ, đỏ không có dòng chấm. Đọc SIMULATION mới nhất trước khi dùng số nền cũ trong các mục bàn giao dưới.

## Nguồn dữ liệu sau review nền Mô phỏng

UI Mô phỏng dùng `Session.initial` là bản sao độc lập Hiện trạng có ba vấn đề, nền 30,24 MW. Kết quả kịch bản tính mất thêm, không cộng 1,08 MWh đã mất trước 10:30. API không truyền initial vẫn có nền khỏe mạnh 34,56 MW để test. Không dùng con số tham chiếu khỏe mạnh làm nền UI một cách ngầm định. `Run.energyMWh/lossMWh` phiên là phần tương lai từ 10:30; tín hiệu có thêm lịch sử seed 31 mẫu trước đó. Nút Về trạng thái ban đầu tăng revision, gỡ kết quả và khôi phục bản sao; nhận định/AI tương lai phải vô hiệu hóa theo revision. Bốn card Hiện trạng mở modal chi tiết, không còn các bảng dưới 3D.

## Lưu ý review UX mới nhất

UI hiện chỉ có khối thiết lập/kết quả phía trên và nút Xem kết quả mô phỏng, thời gian tính theo giờ. `submitted` phân biệt kết quả đã áp dụng với cấu hình đang chỉnh; chưa bấm xem thì 3D là nền, không gửi AI như một kết quả đã được áp dụng. Không phục hồi UI nâng cao/phát lại/so sánh đã bị bỏ. Thời gian config vẫn là phút, có thể tới 1440; ảnh 3D là snapshot lúc chịu ảnh hưởng, năng lượng là dự kiến toàn thời đoạn.

## Đầu vào đã có

T01 đã được chấp nhận. T02A/B/C có mốc code `61f4ca9`, đã kiểm tra cục bộ; các review UX sau đó đơn giản hóa luồng chọn loại/quy mô/thời gian và thu gọn phần nâng cao. Config hiện có `scale` (1–8 cụm); không khôi phục UI ba đường luôn mở. Kết luận/điểm nghiệm thu còn mở tại [T02_ACCEPTANCE](T02_ACCEPTANCE.md). Không dựng lại model, giao diện hoặc bộ mô phỏng. Giữ hai tab Hiện trạng/Mô phỏng độc lập và cột AI đã dành sẵn.

Đọc AGENTS, PRODUCT, DESIGN, IOT, STATUS, TASKS và SIMULATION. Dùng checkout có sẵn, bảo toàn thay đổi, không tạo worktree nếu chưa được yêu cầu. Nếu có lỗi T02 đã được xác nhận trên Vercel, xử lý đúng phạm vi trước khi gắn AI vào dữ liệu sai.

## Nguồn dữ kiện cho phân tích

- `Session` có config, revision, phase, elapsed và ba `Run`: base/untreated/treated. Phase của Session là nguồn trạng thái phát lại; không dùng cờ `Run.running` của API T02A để đoán trạng thái T02B/C.
- `activeLayer` quyết định đường KPI/3D/hồ sơ đang xem; Hiện trạng có snapshot riêng. Phải gửi rõ nguồn Hiện trạng hay Mô phỏng, lớp đang xem và snapshot ID của Run đó.
- Asset có ID/quan hệ, operation, connection, attention nhiệt và scenario. Signals có snapshot ID/revision, sampledAt, quality, đơn vị, giá trị có thể null và lịch sử đã phát lại.
- `forecast(config)` là **dự kiến toàn kỳ**, không phải năng lượng đã tích lũy. Không đưa số dự kiến thành dữ liệu đã quan sát hoặc khẳng định đã vệ sinh/sửa chữa ngoài thực tế.
- Công suất/khả dụng/tổn thất/gain lấy từ bộ tính. AI không tự tính một bộ số riêng, không làm thay đổi telemetry và không điều khiển thiết bị.

Snapshot gửi API cần tối thiểu: nguồn/chế độ, layer, run ID/revision, phase, phút và thời điểm mô phỏng; asset ID và quan hệ; các tín hiệu cần thiết kèm đơn vị/chất lượng/mốc đo; KPI, giả định kịch bản/phương án và nhãn tích lũy/dự kiến. Giới hạn lịch sử và kích thước payload, không gửi toàn GLB hoặc dữ liệu không cần thiết.

## Phạm vi T03

1. Nhận định theo quy tắc từ dữ liệu mô phỏng: bất thường → bằng chứng → ảnh hưởng → việc nên kiểm tra → giới hạn. Có thể chạy không API nhưng phải ghi “Phân tích mô phỏng/theo quy tắc”, không giả là AI API.
2. Hội thoại theo thiết bị/ngữ cảnh đang xem và phân tích chủ động theo sự kiện mới/hoàn thành lượt. Gắn dữ kiện với snapshot gốc; thẻ dẫn tới đúng thiết bị hoặc giả định phương án.
3. API chỉ ở máy chủ; khóa không vào biến public, browser, Git hoặc log. Kiểm tra cấu hình và tên/trạng thái biến hiện có, Git/proxy/identity trước khi yêu cầu thêm credential. Không yêu cầu gửi giá trị secret trong chat. Nhà cung cấp/model chỉ chốt sau khi kiểm tra khả năng và lựa chọn sẵn có; không tự thêm dịch vụ trả phí.
4. Bảo vệ revision/ngữ cảnh: đổi tab, layer, asset, tham số hoặc lượt trong khi chờ phải hủy/loại phản hồi cũ, hoặc giữ nó với nhãn nguồn gốc; không biến phản hồi thiết bị cũ thành kết luận cho thiết bị mới.
5. Chống gửi lặp, gộp sự kiện, giới hạn tần suất/ngân sách phía máy chủ, độ dài câu hỏi/payload/đáp án và timeout. Không gọi API mỗi tick, khi chỉ kéo tham số xem thử hoặc khi tab bị ẩn.
6. Xử lý thiếu khóa, lỗi nhà cung cấp, quá hạn và dữ liệu thiếu/stale/invalid. Giữ mô phỏng hoạt động; không kết luận inverter hỏng chỉ vì mất dữ liệu/heartbeat.

## Kiểm tra và điều kiện bàn giao

- Test nhận định khớp kịch bản và đơn vị, không cộng trùng trạm, không dùng dự kiến như tích lũy; phân biệt lỗi inverter với quality/kết nối.
- Test ngữ cảnh khi đổi ID/layer/revision lúc request đang chờ, chống phản hồi đến muộn; lỗi/timeout/thiếu cấu hình không phá mô phỏng hoặc giữ trạng thái “đang trả lời” vô hạn.
- Browser kiểm tra chọn thiết bị → hỏi → đọc trả lời đúng nguồn, thẻ chủ động dẫn đúng ID, đổi lượt và retry có chủ đích. Không đổi camera/model hoặc ghi vào Hiện trạng.
- TypeScript/build và kiểm tra phù hợp qua; kiểm tra không lộ credential vào client bundle/log.
- Chỉ ghi API đã tích hợp khi có yêu cầu API thật thành công và kiểm tra được kết quả. Mock/test hoặc chế độ quy tắc không đủ để đánh dấu toàn bộ T03 hoàn thành. Nếu credential còn thiếu, nêu phần nào hoàn tất/phần nào bị chặn; không tự bắt đầu T04/T05 để che phần thiếu.
- Cập nhật STATUS/README/tài liệu cấu hình, tạo commit/push theo quyền được giao. Phân biệt kiểm tra cloud với deployment Vercel Ready và URL thật.

## Prompt mở task sau

```text
Tiếp tục Solar-Farm trong checkout hiện tại.
Đọc AGENTS.md, docs/PRODUCT.md, docs/DESIGN.md, docs/IOT.md,
docs/STATUS.md, docs/TASKS.md, docs/SIMULATION.md,
docs/T02_ACCEPTANCE.md và docs/T03_HANDOFF.md.
T01 đã được chấp nhận; T02 có code và kiểm thử cục bộ.
Kiểm tra kết quả nghiệm thu Vercel còn mở, không giả định đã được chấp nhận.
Thực hiện T03, giữ Hiện trạng/Mô phỏng và ba lớp dữ liệu đúng nguồn.
Không làm lại T01/T02, không đổi model/giao diện đã chốt.
Kiểm tra cấu hình có sẵn trước khi yêu cầu API key; không hỏi giá trị secret trong chat.
Chạy kiểm tra phù hợp, cập nhật tài liệu, tạo commit.
Không tự mở rộng T04/T05; chỉ push/triển khai trong phạm vi được giao.
```
