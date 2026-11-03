# Nghiệm thu T02 — trạng thái đã chấp nhận

Người dùng đã chấp nhận T02 trong chat sau mốc ứng dụng **`82cef18`** và yêu cầu bàn giao sang T03. Không cần hỏi nghiệm thu lại để bắt đầu T03. Đây là checklist hiện hành thay các checklist UI phát lại/nâng cao hoặc số nền cũ. Lịch sử triển khai/kiểm thử nằm trong [STATUS](STATUS.md).

## Phạm vi đã hoàn thành

- Hiện trạng và Mô phỏng độc lập; Mô phỏng kế thừa bản sao nền hiện tại, áp dụng kịch bản bằng nút xem kết quả, quay về ban đầu bằng nút riêng.
- Ba kịch bản mây che/bám bụi/lỗi inverter, quy mô 1–8 và thời gian theo giờ; MW/MWh phát sinh thêm cùng nguồn tính/3D/hồ sơ.
- Ba vấn đề nền: INV-03 dừng, nhánh PV-06/INV-06 suy giảm nhẹ 2%, GW-01 trễ dữ liệu. Một vấn đề nhánh 06, không đếm hai lần.
- 19 ID, 16 GLB, camera/chọn/hover/HUD/hồ sơ; lịch sử tín hiệu 31 mẫu. Đường điện có chấm nhỏ, xanh bình thường/vàng suy giảm/đỏ dừng, đỏ không chạy dòng.
- Bốn card Hiện trạng mở modal chi tiết; bỏ các bảng dài dưới 3D. Nguồn mô phỏng ghi cấp trang, cảnh báo dùng ngôn ngữ vận hành.
- Core T02C có tích phân/phương án/so sánh đã kiểm thử; UI nâng cao/phát lại đã được bỏ theo review, không phải thiếu sót cần phục hồi trong T03.

## Số liệu nghiệm thu

| Hiện trạng lúc 10:30 ICT | Giá trị chính xác | UI        |
| ------------------------ | ----------------- | --------- |
| Công suất AC             | 30,1536 MW        | 30,15 MW  |
| Năng lượng 10:00–10:30   | 15,7248 MWh       | 15,72 MWh |
| Khả dụng                 | 87,5%             | 87,5%     |
| Tổn thất quá khứ         | 1,0944 MWh        | 1,09 MWh  |

INV-03 mất 4,32 MW/15 phút = 1,08 MWh; nhánh 06 giảm 2% từ 10:20, mất 0,0864 MW AC/10 phút = 0,0144 MWh. GW-01 không gây tổn thất. Bức xạ cuối 780 W/m², nhiệt PV-06 58 °C, độ trễ GW-01 850 ms, còn 18 nguồn. Xem [MONITORING](MONITORING.md).

## Checklist hồi quy cho chat sau

1. Mặc định Hiện trạng; mở bốn card, thấy đồ thị/chi tiết đúng chỉ số, Esc/nút đóng về card. Khả dụng có 1 Cảnh báo + 2 Lưu ý; chọn ID tới đúng thiết bị. Tổn thất có INV-03/PV-06, không cộng thêm INV-06.
2. INV-03 đỏ, đầu ra 0, vẫn online, không có chấm chạy. PV-06/INV-06 vàng và vẫn phát 4,41 MW DC/4,2336 MW AC. Các nhánh bình thường xanh/chạy; gateway/trạm thời tiết không nối điện trong sơ đồ. Giảm chuyển động giữ chấm tĩnh.
3. Chuyển Mô phỏng trước áp dụng: nền khớp Hiện trạng. Chọn kịch bản/quy mô/thời gian chưa bấm xem thì kết quả — và chưa tạo ảnh hưởng. Bấm xem mới áp dụng; sửa lựa chọn vô hiệu kết quả cũ.
4. Dự kiến mất thêm trong 1 giờ: mây mặc định 4 cụm **7,73712 MWh**, bụi INV-01 **0,864 MWh**, lỗi INV-01 **4,32 MWh**, lỗi toàn bộ **30,1536 MWh**. Toàn bộ lỗi 24 giờ **723,6864 MWh** (UI 723,69). Không cộng lại tổn thất quá khứ.
5. Về trạng thái ban đầu sau cả mây/bụi/lỗi: gỡ hiệu ứng/vật liệu, bỏ kết quả/kind, về 1 cụm/1 giờ và camera tổng quan/INV-01; vẫn giữ ba vấn đề nền. Chọn kịch bản mới được. Hiện trạng không bị thay đổi.
6. Giữ camera/hover/click/hồ sơ/quan hệ và layout 1440/1024/390 px; không tràn ngang; thiếu WebGL/model vẫn có đường xem thiết bị phù hợp.

## Bằng chứng và giới hạn

Mốc ứng dụng `82cef18`: TypeScript, build Webpack, Prettier và git diff --check qua; **33/33 bài kiểm tra qua (3,2 phút)**. Có kiểm tra Chromium/SwiftShader về tính toán, quality, camera, vật liệu, màu/dòng chấm, các modal, chuyển tab/reset và mobile; đã xem ảnh desktop/mobile. Đây là bằng chứng của lượt trước, không phải mới chạy lại khi chỉ sửa tài liệu bàn giao.

Người dùng đã chấp nhận qua chat. URL người dùng cung cấp trong ảnh: https://solar-farm-pi.vercel.app/. Cloud chưa trực tiếp xác minh deployment Ready/HTTPS ở mốc cuối; không gán việc người dùng chấp nhận thành bằng chứng công cụ đã kiểm tra URL. T05/nghiệm thu bản gửi khách vẫn riêng.

Chưa có AI API, IoT/SCADA thật hoặc mô hình vật lý đã hiệu chỉnh với nhà máy. Chưa triển khai T03/T04/T05. Task tiếp theo là [T03_HANDOFF](T03_HANDOFF.md).
