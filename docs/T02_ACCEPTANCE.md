# Rà soát và nghiệm thu T02

## Kiểm tra điều chỉnh chấm và mức suy giảm

- Hiện trạng PV-06 và INV-06 cùng vàng, giảm 2%, DC 4,41/AC 4,23 MW; chấm nhỏ vàng di chuyển trên cả hai đoạn dây. INV-03 đỏ và không có chấm; nhánh bình thường xanh có chấm.
- Mô phỏng kế thừa đúng nền; mây/bụi giảm một phần vàng/chạy, lỗi hoặc giảm về 0 đỏ/dừng. Reset trả về nền vàng nhánh 06/đỏ nhánh 03. Bật giảm chuyển động: chấm tĩnh.
- Bốn KPI mới: 30,15 MW, 15,72 MWh, 87,5%, 1,09 MWh. Mở Tổn thất thấy INV-03 và PV-06, không tính thêm lần nữa INV-06. Tổng lỗi 24 giờ mất thêm 723,69 MWh.
- HUD/hồ sơ và nội dung cảnh báo không còn “dữ liệu mẫu”, “tham chiếu mẫu”, “dữ liệu giả định”; chỉ giữ nhãn nguồn chung cấp trang. Các checklist số liệu/mũi tên cũ bên dưới thuộc review lịch sử.

## Kiểm tra review nền Mô phỏng, reset và card chỉ số

1. Mở từng card Hiện trạng: có biểu đồ 31 mẫu và nội dung phù hợp, Esc/nút đóng quay về đúng card; Khả dụng/Tổn thất có liên kết tới thiết bị. Không còn chart/thời tiết/danh sách chú ý dưới 3D.
2. Chuyển Mô phỏng trước chọn kịch bản: ba vấn đề và đường điện phải khớp Hiện trạng. INV-03 vẫn lỗi, GW-01 vẫn 850 ms.
3. Chọn lỗi 1 cụm/1 giờ → mất thêm 4,32 MWh. Chọn toàn bộ 8/1 giờ → mất thêm 30,24 MWh; không cộng lại lỗi INV-03 hoặc 1,08 MWh quá khứ. 24 giờ → 725,76 MWh.
4. Bấm Về trạng thái ban đầu sau mây/bụi/lỗi: chọn kịch bản trở về trạng thái ban đầu, số kết quả —, hiệu ứng gỡ sạch, ba vấn đề/lịch sử/đường điện ban đầu trở lại; 1 cụm/1 giờ, camera tổng quan. Chọn kịch bản mới được.
5. Quay về Hiện trạng: bốn chỉ số/lịch sử/vấn đề không đổi. Kiểm tra modal và nút reset tại 390 px, không tràn ngang. Các checklist số nền khỏe mạnh/phát lại/nâng cao cũ bên dưới là lịch sử/test core.

## Kiểm tra đường điện và chiều dòng công suất

Trong cả hai tab có 16 đoạn điện: 8 DC Pin → Inverter và 8 AC Inverter → Trạm. Hiện trạng: nhánh INV-03 đỏ và không chạy mũi tên (0 MW); nhánh PV-06/INV-06 đỏ nhưng vẫn chạy (Lưu ý, còn công suất); nhánh bình thường xanh và chạy. GW-01 không có dây điện. Mô phỏng mây/bụi: nhánh chịu ảnh hưởng đỏ, còn công suất thì còn chạy; lỗi cả 8 inverter: mọi dòng dừng. Đổi tab khôi phục đúng màu/công suất theo snapshot riêng. Thử click/hover model, camera và chế độ giảm chuyển động (mũi tên tĩnh); đồ thị/KPI không thay đổi vì animation. Đây là sơ đồ minh họa, không phải bản vẽ đấu nối thực tế.

## Kiểm tra bổ sung Hiện trạng sau review

Áp dụng bộ dữ liệu hiện hành tại [MONITORING](MONITORING.md), thay hai vấn đề nhiệt của snapshot cũ. Vào Hiện trạng → card Khả dụng thiết bị → Thiết bị cần chú ý: đúng **1 Cảnh báo + 2 Lưu ý**. Chọn INV-03: thấy 0 MW so với tham chiếu 4,32 MW, đã mất 1,08 MWh trong 15 phút, kết nối vẫn hoạt động. Chọn PV-06/GW-01: thấy giá trị vượt ngưỡng, chưa giảm sản lượng và hậu quả có điều kiện. Mở Xem chi tiết: đồ thị 31 mẫu từ 10:00 đến 10:30, số cuối khớp số hiện tại; INV-03 giảm đầu ra tại 10:15. KPI Hiện trạng: 30,24 MW, 15,74 MWh tích lũy trong cửa sổ mẫu, 87,5% khả dụng, 1,08 MWh mất. Đổi tab và thử mô phỏng không đổi các số/lịch sử này. Các mục phát lại/nâng cao bên dưới mô tả UI lịch sử, không phải luồng công khai hiện hành.

## Review hiện hành: một khối thiết lập/kết quả phía trên

Gom kịch bản, quy mô, thời gian và kết quả MW/MWh vào một khối gọn phía trên 3D. Thời gian có các lựa chọn theo giờ: 1, 2, 3, 4, 6, 8, 12, 24. Chỉ áp dụng sau nút “Xem kết quả mô phỏng”; thay cấu hình làm mất hiệu lực kết quả cũ. 3D minh họa vùng tại lúc chịu ảnh hưởng, không có đồng hồ phát lại trong UI. Bỏ toàn bộ nâng cao/tham số/biểu đồ/so sánh cùng các khối điều kiện mẫu/thiết bị cần chú ý bên dưới tab Mô phỏng; Hiện trạng giữ nguyên. Các mô tả UI nhiều phần ở review trước là lịch sử. Bộ tính vẫn dùng phút nội bộ, giới hạn tăng lên 1440 phút; kết quả là ước tính toàn kỳ chưa xử lý. T02C giữ API/test nhưng không còn đường truy cập nâng cao trên UI.

Rà soát ban đầu: 03/11/2026 (ICT), mốc ứng dụng `61f4ca9`. Luồng mô phỏng và quy mô đã được cập nhật tiếp theo review UX bên dưới; trạng thái mới nhất tại STATUS và GitHub main.

## Điều chỉnh sau review UX

Luồng chính hiện là loại kịch bản → quy mô 1–8 cụm → thời gian → kết quả MW/MWh và hình ảnh 3D. Kiểm tra bổ sung: tăng quy mô từ 1 lên 4 phải tăng tổn thất gấp bốn với cùng mức/thời gian; chọn 8 inverter lỗi phải mất toàn bộ AC và khả dụng 0%. Mây mặc định vẫn bốn cụm trái. Khi cần kiểm tra tốc độ/biểu đồ/T02C, mở “Xem diễn biến và so sánh phương án (nâng cao)”; mặc định các điều khiển này được thu gọn. Các kết quả mặc định trong checklist bên dưới giữ nguyên.

## Kết luận

**T02A/B/C đã hoàn thành phần triển khai và kiểm tra trong môi trường cloud. Chưa ghi nhận người dùng nghiệm thu T02 trên bản Vercel mới.** Không còn công việc AI nào nằm trong T02; AI thuộc T03 và chưa bắt đầu. T02 hoàn thành không đồng nghĩa toàn demo T03–T05 đã sẵn sàng gửi khách.

Rà soát này đối chiếu TASKS, PRODUCT, IOT, SIMULATION với `simulation.ts`, `scenario-simulation.ts`, `asset-status.ts`, Dashboard và các test hiện có. Không thay công thức hoặc giao diện khi rà soát.

## Đối chiếu phạm vi và bằng chứng

| Nhóm / tiêu chí                                     | Kết quả triển khai                                                                                        | Bằng chứng                                                                                                                                                               |
| --------------------------------------------------- | --------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| T02A: nhà máy, registry, DC/AC                      | Giữ 19 ID, 50 MWp danh định / giới hạn 40 MW AC; nền 36 MW DC / 34,56 MW AC, không cộng trùng trạm        | `simulation.spec.ts`, `scene-layout.spec.ts`; công thức SIMULATION                                                                                                       |
| AC-02: cùng đầu vào cho cùng chuỗi                  | Bộ tính thuần, seed cố định, không dùng giờ máy/random để sinh số đo                                      | Test deterministic trong `simulation.spec.ts`, `scenario-simulation.spec.ts`                                                                                             |
| AC-03/04/05: ba kịch bản, mức 0, mất toàn công suất | Mây/bụi giảm DC/AC; fault AC 0 nhưng online; khả dụng chỉ giảm do lỗi vận hành                            | Test ba kịch bản, zero reduction và target `all`; target all chỉ phục vụ kiểm thử, không có preset thứ tư                                                                |
| MW→MWh, tổng hợp và biên sự kiện                    | Tích phân theo khoảng một phút, đúng tại mốc mây kết thúc/repair; tổng trạm từ inverter                   | Test đối chiếu dự kiến với phát lại và các kết quả giải tích trong `scenario-simulation.spec.ts`                                                                         |
| AC-06: pause/restart/reset/revision                 | Pause không tăng dữ liệu/năng lượng; sửa cấu hình xóa lượt cũ; hoàn thành tự dừng                         | Test model và browser. Bộ tốc độ chỉ gọi cùng phép tick; browser đã chạy ở 1 và 15 phút/giây, không thay công thức theo tốc độ                                           |
| AC-12/13: camera và xem thử                         | Tham số đổi bản xem thử ngay, giữ góc camera; KPI/hồ sơ/viền/3D theo cùng snapshot                        | `dashboard.spec.ts`, browser workflow trong `scenario-simulation.spec.ts`; đo input→KPI dưới mục kết quả chạy                                                            |
| AC-14: thay thời đoạn                               | Dự kiến toàn kỳ tính riêng, năng lượng tích lũy vẫn theo phần đã phát lại                                 | `forecast()` và test tích phân/can thiệp; browser thay thời đoạn từ preset về 5 phút, tạo revision mới                                                                   |
| AC-15: preset/tự cấu hình                           | Đúng ba preset; tùy chỉnh dùng bản cấu hình riêng; mây 4 PV trái, bụi đổi riêng vật liệu, fault đúng vùng | Browser chạy cả ba preset, chỉnh loại/vùng/mức/thời đoạn; kiểm tra GLB/màu/raycast                                                                                       |
| AC-17/18: thiết bị, chất lượng và vận hành          | Hồ sơ theo ID, lịch sử theo lượt, quality/heartbeat độc lập operation; thiếu không thành 0                | `simulation.spec.ts` có fixture missing/stale/invalid/lỗi online; HUD/dialog và quan hệ được kiểm tra browser. Fixture quality không có nút bật trên UI hoặc preset mạng |
| AC-21: T02C so sánh                                 | Cơ sở/chưa xử lý/có phương án cùng thời gian; vệ sinh/repair không vượt cơ sở; không gọi gain là ROI      | Test 0%/50%/100% phục hồi, phút 0/cuối thời đoạn, cùng lịch sử; browser chuyển lớp và kiểm tra trên 390 px                                                               |
| Review tách hai chế độ                              | Hiện trạng mẫu độc lập; mô phỏng không ghi ngược; chuyển tab tạm dừng và giữ lượt                         | `simulation.spec.ts`: KPI/lịch sử/lựa chọn/kịch bản độc lập                                                                                                              |
| Tài liệu/công cụ                                    | Có công thức, giả định, lệnh chạy, kiểm thử và bàn giao                                                   | README, SIMULATION, TASKS, STATUS; Node 24/npm 11, lockfile giữ nguyên                                                                                                   |

## Kết quả chạy và giới hạn bằng chứng

Lượt hoàn tất triển khai ở `61f4ca9`: TypeScript, build Webpack, Prettier và git diff --check qua; **25/25 test qua**. Đã xem ảnh desktop/390 px. Độ trễ input→KPI đo trong lượt đó là **14,9 ms**, một mẫu trên Chromium headless, không phải cam kết trên mọi thiết bị.

Lượt rà soát chạy lại trên cùng mã ứng dụng: **25/25 test qua (3,2 phút)**, build Webpack và TypeScript qua; input→KPI 4,0 ms trong lượt này. Kết quả được lưu trong STATUS. Test browser dùng Chromium hệ thống + SwiftShader; không suy diễn kết quả sang GPU máy thật, Safari/Firefox hoặc thao tác cảm ứng thật. Mô hình vật lý là minh họa, chưa hiệu chỉnh với nhà máy thật. Dữ liệu quality lỗi được kiểm tra bằng fixture chuyên biệt, không phải kết nối mạng lỗi thực tế.

Không có tool Vercel hoặc URL deployment cụ thể trong phiên rà soát. Vì vậy chưa xác minh deployment mới Ready, tải tài nguyên qua HTTPS công khai hoặc nghiệm thu của người dùng. Đây là phần kiểm tra bên ngoài còn mở, không tự đánh dấu đã đạt AC-11/T05.

## Checklist kiểm tra trên Vercel

Mở deployment chứa code từ `61f4ca9` trở đi sau khi Ready. Các giá trị UI được làm tròn tối đa hai số thập phân.

1. **Hiện trạng:** ghi lại KPI. Sang Mô phỏng thử các bước dưới, rồi quay lại: KPI/lịch sử/cảnh báo hiện trạng phải không đổi.
2. **Mây che mặc định:** xem thử công suất khoảng **26,78 MW**, khả dụng **100%**, dự kiến mất **3,89 MWh** trong 30 phút. Chạy tốc độ 15 để hoàn thành; mây hết che và công suất trở về **34,56 MW**, tổn thất đã tích lũy giữ nguyên.
3. **Bụi mặc định:** công suất khoảng **33,70 MW**, khả dụng **100%**, dự kiến mất **0,86 MWh** trong 60 phút. Hoàn thành vẫn còn bụi. Thử vệ sinh 100% ở phút 30: dự kiến thu hồi **0,43 MWh**; đổi hai lớp xem phải cho đúng số đo/cảnh tại cùng thời gian.
4. **Lỗi inverter mặc định:** INV-01 AC = **0 MW**, mã lỗi **1**, vẫn online; tổng nhà máy **30,24 MW**, khả dụng **87,5%**, dự kiến mất **2,16 MWh**/30 phút. Thử khôi phục phút 15: dự kiến thu hồi **1,08 MWh**; lớp có phương án phục hồi AC/khả dụng từ phút đó.
5. **Điều khiển và giao diện:** pause phải đứng thời gian/năng lượng; sửa tham số chuyển về Xem thử phút 0 với lịch sử mới; restart/reset không giữ kết quả cũ. Camera/chọn thiết bị, popup/quan hệ và điều khiển mobile phải dùng được. Reset giữ hai fixture nhiệt INV-03/PV-06, không tự coi đó là lỗi mạng.

Nếu có lỗi, ghi deployment/commit, tab/lớp đang xem, kịch bản, vùng/mức/thời đoạn, phương án, phút mô phỏng, kết quả thực tế và kết quả mong đợi. Xử lý lỗi T02 trước khi coi đó là lỗi AI ở T03.

## Công việc tiếp theo

1. Nghiệm thu checklist Vercel và ghi kết quả vào STATUS.
2. Khi được giao, làm T03 theo [T03_HANDOFF](T03_HANDOFF.md): nhận định theo quy tắc trước, API phía máy chủ và các đường lỗi sau khi kiểm tra cấu hình sẵn có.
3. Giữ T04 (hướng dẫn demo/UX/liên hệ) và T05 (nghiệm thu bản gửi khách) riêng; không triển khai đồng thời chỉ vì T02 đã có code.
