# T02A — Nền dữ liệu và IoT mô phỏng

T01 được người dùng chấp nhận ngày 03/11/2026. Giao diện và cảnh GLB đã có bản test qua GitHub/Vercel; không cần dựng lại giao diện hoặc model. T02A đã triển khai; xem SIMULATION.md và STATUS.md cho kết quả và giới hạn. Phạm vi dưới đây là hợp đồng triển khai gốc. Đọc AGENTS, PRODUCT, DESIGN, IOT, STATUS và TASKS trước khi bắt đầu.

## Ràng buộc bổ sung sau review T02A

Tab Hiện trạng và tab Mô phỏng có snapshot độc lập. Mô phỏng không được sửa dữ liệu, lịch sử hoặc cảnh báo hiện trạng; chuyển tab chỉ đổi nguồn hiển thị và tạm dừng phát lại mô phỏng. Các kịch bản/tự cấu hình nằm riêng trong tab Mô phỏng. Giữ ràng buộc này khi tiếp tục T02B/T02C; xem PRODUCT và SIMULATION.

## Phạm vi thực hiện

1. Tách cấu hình nhà máy, registry thiết bị và bộ tạo dữ liệu khỏi thành phần giao diện. Giữ 19 ID, quan hệ, model và bố trí hiện tại; tổng 50 MWp DC / giới hạn 40 MW AC. Không cộng công suất trạm lần nữa vào tổng inverter.
2. Tạo trạng thái lượt mô phỏng có ID/revision, thời gian mô phỏng, seed cố định và bước dữ liệu 60 giây. Có chạy, tạm dừng và đặt lại cho điều kiện nền; không dùng đồng hồ máy để sinh telemetry hoặc tự làm dữ liệu stale khi tạm dừng. Đồng hồ thực chỉ dùng điều khiển phát lại.
3. Sinh điều kiện nền, DC/AC và telemetry từ một nguồn; tổng hợp công suất, năng lượng MWh và khả dụng. Ghi công thức, hiệu suất, giới hạn, điều kiện ban đầu và cách tích phân trong `docs/SIMULATION.md` khi triển khai. Đối chiếu fixture cơ sở hiện có (4,5 MW DC/cụm, 4,32 MW AC/inverter, tổng AC 34,56 MW); nếu thay giả định phải ghi nguyên nhân và cập nhật đồng bộ.
4. Bổ sung chất lượng từng tín hiệu: hợp lệ, cũ, không hợp lệ, thiếu; heartbeat/kết nối riêng với vận hành. Giá trị thiếu không đổi thành 0; tổng hợp phải thể hiện phần dữ liệu thiếu và chất lượng thay vì giả tổng đầy đủ. Có fixture kiểm thử stale/thiếu/lỗi nhưng online; không tạo preset thứ tư.
5. Cho KPI, HUD, các biểu đồ đồng thời, danh sách cảnh báo và viền 3D đọc cùng snapshot/revision. INV-03 đỏ 78 °C và PV-06 vàng 58 °C hiện là fixture review: ghi rõ cách giữ làm fixture kiểm thử hoặc chuyển sang trạng thái từ tín hiệu; không âm thầm biến thành mất kết nối/mất khả dụng. Chưa mô hình hóa tác động nhiệt thì không tự trừ công suất.

## Giữ nguyên và chưa thực hiện

- Giữ light mode, logo gốc, GLB, hover, HUD/popup, pan/zoom/reset và dấu chọn. Không remount/reset camera khi dữ liệu cập nhật; viền nhịp sáng chỉ thể hiện lựa chọn, màu viền thể hiện tình trạng.
- Ba thẻ mây/bụi/lỗi và tự cấu hình vẫn là minh họa T01. T02A không bật nút chạy kịch bản như thể đã tính được tác động; phần đó thuộc T02B.
- So sánh vệ sinh/khôi phục thuộc T02C; hội thoại và phân tích AI thuộc T03. Không cần API key, broker hoặc cảm biến thật cho T02A.

## Tiêu chí bàn giao

- Cùng seed/đầu vào/revision cho cùng chuỗi dữ liệu; tổng DC/AC và đơn vị đúng, năng lượng tính bằng tích phân MW theo giờ. Với đường công suất hằng P, khoảng t giờ cho P × t MWh.
- Tạm dừng không tích lũy năng lượng; đặt lại không giữ lịch sử/cảnh báo từ lượt cũ. Không hiển thị dữ liệu tương lai như mẫu đã nhận. Lịch sử biểu đồ lấy đúng thời gian lượt chạy, thay nhãn 10:25–10:30 đang cố định trong T01.
- Dữ liệu thiếu/stale và inverter lỗi nhưng online được phân biệt; hồ sơ/viền/KPI không mâu thuẫn cùng mốc dữ liệu. Không dùng số ngẫu nhiên riêng trong UI.
- Test phép tính/trạng thái/quality có ý nghĩa; kiểm thử trình duyệt chạy nền–tạm dừng–đặt lại, chuyển thiết bị/quan hệ, biểu đồ, bảo toàn camera và dấu chọn; build/TypeScript qua.
- Cập nhật SIMULATION, STATUS, README và tài liệu liên quan; ghi phần nào chưa hoàn thành, tạo commit/push theo ủy quyền hiện có. Phân biệt kiểm tra cục bộ với deployment Ready và kiểm tra URL thật.

## Lệnh giao việc cho chat tiếp theo

```text
Tiếp tục dự án Thanhtht/Solar-Farm trong checkout hiện tại.
T01 đã được chấp nhận; không dựng lại giao diện hay model.
Đọc AGENTS.md, docs/PRODUCT.md, docs/DESIGN.md, docs/IOT.md,
docs/STATUS.md, docs/TASKS.md và docs/T02A_HANDOFF.md.
Thực hiện T02A theo phạm vi và tiêu chí bàn giao đã ghi.
Dùng các giả định đã chốt; kiểm tra code và git status trước khi sửa.
Chạy kiểm tra phù hợp, cập nhật tài liệu và tạo commit.
Đẩy cập nhật lên GitHub main để tiếp tục test qua Vercel như quy trình hiện tại.
Không tự mở rộng sang T02B/T02C hoặc tích hợp AI trong task này.
```
