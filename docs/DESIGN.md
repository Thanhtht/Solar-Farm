# Định hướng thiết kế

## Review header gọn và giao diện tổng quan

Theo yêu cầu mới, bỏ menu dọc và dải breadcrumb/trạng thái/avatar; đưa tên Solar Farm One/Digital Twin cùng nhãn nguồn dữ liệu mô phỏng lên header. Hai tab giữ vị trí giữa, nút danh sách thiết bị ở góc phải. Main bắt đầu bằng KPI hoặc thiết lập mô phỏng, tăng diện tích cảnh/chat. Màu nền mint, card gradient nhẹ, icon theo chỉ số, sparkline lấy lịch sử cùng snapshot; không trang trí bằng số liệu giả hoặc thay màu mức vận hành 3D. Chat giữ cỡ 13px và nút gửi bên phải. Góc tổng quan hướng thẳng từ cổng theo ảnh review mới (camera [0,33,51]); camera Hiện trạng có thể focus từ câu hỏi/câu trả lời; lệnh chat chỉ thay đổi kịch bản khi ở Mô phỏng. Chi tiết [AI](AI.md).

## Review mới nhất: một hội thoại và gợi ý thiết bị

Không có thanh ngữ cảnh phía trên. Các nhãn thiết bị/mode gắn cố định vào từng tin nhắn, lịch sử không mất khi chọn thiết bị khác. @ mở gợi ý ID/tên ngay trên composer; chọn giữ bản nháp, thẻ có nút bỏ chọn. Màu icon gửi trắng khi nhập nội dung, disabled xám và loading có spinner. Tab Hiện trạng/Mô phỏng đặt giữa heading, active xanh đậm và chữ trắng, giữ keyboard navigation. Camera chọn thiết bị tăng apparent zoom 50%, overview không đổi. Các quy định reset hội thoại và header nguồn bên dưới là lịch sử.

## Review mới: chat toàn nhà máy

Cột AI 360px, từ viewport 1400px là 380px; 3D co phần ngang còn lại. Chat/textarea 13px bằng dòng summary “Trạng thái hiện tại”. Composer có thẻ @thiết bị (kèm bỏ chọn) phía trên và nút gửi icon bên phải. Mặc định không chọn thiết bị, nguồn là Toàn nhà máy; mode vẫn độc lập. Lời chờ “Để tôi xem và trả lời anh/chị nhé…”. Các cỡ chữ 16px bên dưới là review trước.

## Review cột chat

Bỏ eyebrow “ĐỒNG HÀNH VẬN HÀNH” và badge “AI sẵn sàng”; thông báo lỗi/thiếu cấu hình vẫn giữ khi cần. Nguồn thiết bị/mode thu gọn; rule analysis đóng mặc định để ưu tiên hội thoại. Chữ tin nhắn và ô nhập 16px; composer cố định trong panel, tin nhắn cuộn riêng và tự tới cuối. Enter gửi, Shift+Enter xuống dòng, tôn trọng IME tiếng Việt. Không đổi bố cục/camera/model 3D.


> **Bàn giao hiện hành trước T03:** T02 đã được người dùng chấp nhận ở mốc ứng dụng `82cef18`. Dữ kiện/UI và phạm vi T03 dùng [T03_HANDOFF](T03_HANDOFF.md), [MONITORING](MONITORING.md), [SIMULATION](SIMULATION.md), [T02_ACCEPTANCE](T02_ACCEPTANCE.md). Các review trước bên dưới giữ lịch sử quyết định; khi mâu thuẫn không khôi phục UI nâng cao/phát lại, nền khỏe mạnh hoặc định nghĩa/màu cũ. Yêu cầu AI chưa triển khai vẫn thuộc T03.

## Review chấm dòng điện và ba màu mức vận hành

Thay cone mũi tên bằng sphere nhỏ bán kính 0,11 đơn vị cảnh, giữ instancing và chiều di chuyển Pin → Inverter → Trạm. Chú thích dây: xanh #008b65 bình thường, vàng #e9b323 suy giảm, đỏ #e44538 ngừng phát điện; chấm xanh/vàng theo dây, dây đỏ tuyệt đối không có chấm chạy. Giảm chuyển động giữ chấm tĩnh; ẩn trang dừng lịch vẽ. Không thay độ dày dây hoặc geometry GLB.

Nhánh PV-06/INV-06 đều có viền vàng (cùng một vấn đề giảm 2%); danh sách vẫn 1 Cảnh báo + 2 Lưu ý. Lưu ý có thể có mất sản lượng nhẹ. Trong cảnh báo/hồ sơ bỏ nhắc “dữ liệu mẫu”, “tham chiếu dữ liệu mẫu”, “giả định”, dùng số đo/ảnh hưởng/hành động ngắn gọn. Giữ nhãn nguồn cấp trang, không thêm badge giả “live” hoặc đổi nguồn đo thành dữ liệu nhà máy thật.

## Review hiện hành: card mở chi tiết, khôi phục mô phỏng

Bốn card Hiện trạng giữ bố cục nhưng trở thành nút có gợi ý “Xem chi tiết ↗”, hover/focus bàn phím. Cửa sổ modal nằm giữa viewport, đầu cố định, nội dung cuộn; có ba số tóm tắt, đồ thị cùng 31 mốc 10:00–10:30 và bảng/ngữ cảnh liên quan. Trục khả dụng cố định 0–100%; tổn thất màu đỏ. Danh sách ba vấn đề chuyển vào Khả dụng; thiết bị gây tổn thất vào Tổn thất; chọn ID đóng modal rồi focus thiết bị trong cảnh/HUD. Xóa các khối dưới cảnh 3D/cột AI ở Hiện trạng, giữ danh sách thiết bị mở theo yêu cầu và footer.

Thiết lập Mô phỏng thêm nút “Về trạng thái ban đầu” cạnh nút xem kết quả; luôn dùng được sau chọn/chạy kịch bản. Trạng thái ban đầu khớp Hiện trạng (ba vấn đề, số đo, đường điện/lịch sử), dữ liệu là bản sao riêng. Reset xóa hiệu ứng, kết quả, chọn thiết bị/camera của Mô phỏng về mặc định và giữ nguyên Hiện trạng. Khối kết quả ghi rõ tổn thất phát sinh thêm. Không sửa GLB, vị trí/model, cột AI hoặc thêm UI nâng cao.

## Review đường điện 3D

Thêm 8 tuyến DC từ cạnh cụm pin tới inverter và 8 tuyến AC chạy theo lối kỹ thuật tới trạm, giữ nguyên model/footprint/camera. Đường xanh `#008b65` cho nhánh bình thường, đỏ `#e44538` khi thiết bị trên nhánh có vấn đề; đường đỏ bao gồm Lưu ý chưa giảm sản lượng, không đồng nhất màu dây với mức Cảnh báo thiết bị. Mũi tên đi một chiều Pin → Inverter → Trạm khi công suất dương; không có mũi tên trên tuyến 0 MW hoặc số đo không dùng được. Chú thích đường đặt dưới chú thích trạng thái thiết bị, tránh che model/HUD. Lớp dây/mũi tên không chặn click hoặc hover thiết bị. Tôn trọng giảm chuyển động bằng mũi tên tĩnh và dừng animation khi tab trình duyệt ẩn. Thiếu/chưa hợp lệ/cũ dùng đường xám khi không có vấn đề đã biết, không giả xanh hoặc đang có điện.

## Review hiện hành: giải thích vấn đề Hiện trạng

Giữ bố cục/camera/GLB đã chốt. Hiện trạng có một viền đỏ Cảnh báo (INV-03) và hai viền vàng Lưu ý (PV-06, GW-01). Danh sách chú ý giải thích ngắn quy ước đã giảm sản lượng/vượt ngưỡng chưa giảm sản lượng. Chọn thiết bị mở cùng thẻ giải thích trong HUD và hồ sơ: Cảnh báo có MW, MWh, thời đoạn và tham chiếu; Lưu ý có giá trị/ngưỡng và nguy cơ nếu tiếp diễn. Màu đỏ dành cho tổn thất hiện tại, không dùng nguy cơ để khẳng định đã mất sản lượng. Hồ sơ ghi nhãn lịch sử giả định và trục thời gian 10:00–10:30, hiển thị đường thay vì một điểm. HUD có thể cuộn ở màn hình nhỏ để đọc đủ giải thích và mở chi tiết. Xem [MONITORING](MONITORING.md).

## Review hiện hành: một khối thiết lập/kết quả phía trên

Gom kịch bản, quy mô, thời gian và kết quả MW/MWh vào một khối gọn phía trên 3D. Thời gian có các lựa chọn theo giờ: 1, 2, 3, 4, 6, 8, 12, 24. Chỉ áp dụng sau nút “Xem kết quả mô phỏng”; thay cấu hình làm mất hiệu lực kết quả cũ. 3D minh họa vùng tại lúc chịu ảnh hưởng, không có đồng hồ phát lại trong UI. Bỏ toàn bộ nâng cao/tham số/biểu đồ/so sánh cùng các khối điều kiện mẫu/thiết bị cần chú ý bên dưới tab Mô phỏng; Hiện trạng giữ nguyên. Các mô tả UI nhiều phần ở review trước là lịch sử. Bộ tính vẫn dùng phút nội bộ, giới hạn tăng lên 1440 phút; kết quả là ước tính toàn kỳ chưa xử lý. T02C giữ API/test nhưng không còn đường truy cập nâng cao trên UI.

## Quyết định UX mới: luồng mô phỏng đơn giản

Luồng chính là chọn kịch bản, chọn số cụm ảnh hưởng (1–8), chọn thời gian rồi đọc MW/MWh giảm hoặc mất. 3D minh họa cùng phạm vi đó. Mức giảm/vị trí chi tiết và toàn bộ biểu đồ/tốc độ/so sánh phương án là nâng cao, không bắt người xem mới đi qua. Mây mặc định vẫn bốn cụm trái, nhưng quy mô không còn cố định; bụi/lỗi có thể tác động nhiều cụm. Quyết định này thay các mô tả luồng nhiều bước/ba đường luôn mở ở mốc T02 trước.

## Cập nhật triển khai T02B/T02C

Ba preset và tự cấu hình đã dùng dữ liệu tính theo kịch bản ở tab Mô phỏng, thay lớp annotation chỉ minh họa của các review T01/T02A. Bản xem thử cập nhật công suất/trạng thái ngay; phát lại tính năng lượng theo bước 60 giây, có pause/restart/reset và revision. Đối chiếu cơ sở/chưa xử lý/có phương án vệ sinh hoặc khôi phục cùng thời đoạn; mây chỉ phục hồi tự nhiên. Hiện trạng vẫn độc lập. Xem SIMULATION và STATUS cho công thức, giới hạn và bằng chứng kiểm tra. Các đoạn nhắc giới hạn T01/T02A dưới đây mô tả mốc trước, không thay thế cập nhật này.

## Tách Hiện trạng và Mô phỏng — quyết định review

Hai tab chính **Hiện trạng** và **Mô phỏng** có dữ liệu và lựa chọn thiết bị riêng; mặc định mở Hiện trạng. Hiện trạng dùng snapshot mẫu cố định, không phải kết nối nhà máy thật. Toàn bộ KPI, hồ sơ, biểu đồ, thời tiết và cảnh báo đọc snapshot của tab đang xem. Chạy/tạm dừng/đặt lại hoặc thay tham số mô phỏng không ghi vào hiện trạng. Chuyển về Hiện trạng tạm dừng lượt mô phỏng; quay lại giữ kết quả, tham số và thiết bị để chủ động chạy tiếp. Không tự reset lượt khi đổi tab.

Thẻ kịch bản, tự cấu hình và điều khiển phát lại chỉ có trong tab Mô phỏng. Hai lựa chọn “Kịch bản có sẵn” và “Tự cấu hình” là chế độ con bên trong tab này. Cảnh/model và thao tác camera được giữ; không remount cảnh khi đổi dữ liệu. T02A/B/C đã có điều kiện nền, kịch bản và so sánh; AI thuộc T03, chưa triển khai. Quyết định này thay thế bố cục trộn theo dõi và mô phỏng trước review.

**Bản định hướng 0.4:** đã xác nhận 3 preset, màn hình tự cấu hình đơn giản và kết quả ngay trong 3D. Đã chốt người xem chính là giám đốc nhà máy/đội vận hành và bộ ba mây che/bám bụi/lỗi inverter. Bổ sung click thiết bị và IoT giả lập theo IOT. Yêu cầu 3D thay thế đề xuất 2.5D trước đó.


**Bản định hướng 0.4:** đã xác nhận 3 preset, màn hình tự cấu hình đơn giản và kết quả ngay trong 3D. Đã chốt người xem chính là giám đốc nhà máy/đội vận hành và bộ ba mây che/bám bụi/lỗi inverter. Bổ sung click thiết bị và IoT giả lập theo IOT. Yêu cầu 3D thay thế đề xuất 2.5D trước đó.

## Cảm giác chung

Một trung tâm điều hành năng lượng hiện đại: chính xác, gọn, có chiều sâu. Khu nhà máy là điểm nhìn chính; các số liệu hỗ trợ câu chuyện. Tránh quá nhiều thẻ, hiệu ứng nhấp nháy hoặc trang trí che dữ liệu.

## Hệ hình ảnh — cập nhật light mode theo review

| Thành phần | Đề xuất |
| --- | --- |
| Nền trang | Trắng xanh `#F3F8FB`, chuyển nhẹ sang xanh mint |
| Bề mặt bảng | Trắng `#FFFFFF`, đường viền `#DCE7EC` |
| Chữ chính | Xanh mực `#183B49` |
| Chữ phụ | Xanh xám `#5B7381` |
| Điểm nhấn, trạng thái bình thường | Xanh ngọc `#00866B` |
| Năng lượng, cảnh báo | Vàng nắng `#E5B252` |
| Sự cố | Cam san hô `#C65C3E` |

Logo SAVA dùng đúng file PNG gốc 808×632 do người dùng upload lên GitHub (`030ab5a`), chuyển nguyên file vào `public/brand/sava-logo.png`; bản SVG vẽ lại đã được bỏ. Header giữ đúng tỷ lệ, nền trong suốt, không nén/chuyển đổi ảnh qua Next Image. Cỡ chữ nội dung chính 15–17 px, nhãn phụ 12–14 px; nhãn KPI 13–14 px, số KPI 24–28 px trong hàng gọn.

Người dùng đã yêu cầu light mode, màu tươi và không gian 3D lớn hơn sau khi xem bản Vercel. Nền cảnh 3D là xanh trời nhạt, địa hình xanh lá và đường nội bộ màu kem; góc nhìn mặc định đưa nhà máy lại gần hơn. Đây là bảng màu cập nhật; kiểm tra tương phản thực tế khi xây UI. Màu trạng thái luôn đi cùng chữ hoặc biểu tượng, không dùng màu làm dấu hiệu duy nhất.

- Font sans hỗ trợ đầy đủ tiếng Việt; ưu tiên font hệ thống ở bản đầu để tránh phụ thuộc mạng khi chạy.
- Số có thể dùng chữ số cùng chiều rộng để không rung khi cập nhật.
- Chuyển động ngắn, có mục đích; hỗ trợ `prefers-reduced-motion`.
- Chọn thiết bị có viền/vùng sáng rõ, trạng thái hover và focus bàn phím.

## Bố cục laptop

1. Thanh đầu: tên demo, nhãn “Dữ liệu mô phỏng”, thời gian mô phỏng, nút hướng dẫn và liên hệ.
2. Hàng bốn chỉ số chính, có đơn vị và nhãn giải thích ngắn.
3. Cảnh nhà máy 3D lớn bên trái; cột bên phải dành cho hội thoại AI. Hồ sơ ngắn xuất hiện dạng HUD ở góc trên phải trong cảnh và có thể ẩn/hiện. Cảnh 3D chiếm khoảng 75% chiều ngang ở desktop với cột AI 300–320 px; chiều cao toàn khung được tính bằng phần viewport còn lại sau header, tiêu đề và hàng KPI, chừa 12 px cuối màn hình. Hàng KPI dùng nhãn/giá trị cạnh nhau, giảm padding để kéo cảnh lên. Ở desktop/laptop, thấy trọn thanh công cụ, cảnh và chú giải mà không phải cuộn; không áp min-height 620–680 px gây vượt màn hình thấp.
4. Có chuyển đổi “Kịch bản có sẵn” / “Tự cấu hình”. Ở màn hình tự cấu hình, bảng tham số đặt cạnh cảnh 3D; biểu đồ hỗ trợ bên dưới. Không giấu kết quả sau một tab khác.

Ở điện thoại, chuyển thành một cột theo thứ tự: chỉ số → nhà máy → chi tiết → mô phỏng → biểu đồ → phân tích. Trợ lý không phủ nút chạy; không dựa vào hover để đọc dữ liệu.

## Mô hình nhà máy

- Dùng Three.js qua React Three Fiber/Drei tạo cảnh 3D: khối pin theo hàng, inverter, trạm điện và đường nội bộ. Đây là cảnh có hình học và camera 3D thực, không thay bằng SVG phối cảnh khi nghiệm thu.
- Các cụm có ID tương ứng với dữ liệu; tránh tạo nhiều chi tiết không thể tương tác hoặc không có ý nghĩa.
- Hiệu ứng mây, vùng bám bụi hoặc lỗi thiết bị chỉ xuất hiện khi có kịch bản tương ứng.
- Hiển thị chú giải trạng thái; không dùng bản đồ địa lý của một nhà máy thật chưa được cung cấp.
- Cảnh đã chuyển sang GLB thiết bị và cảnh quan người dùng cung cấp; dùng instancing cho prefab lặp, vật liệu riêng cho từng thiết bị cần tương tác. Terrain, đường vòng, cổng/hàng rào, cây và nhà điều hành theo `src/data/scene-layout.ts`. Giữ cảnh tổng quan sáng, nhà máy là chủ thể; giảm cây/bụi trên màn hình hẹp. Chi tiết tại `3D_SCENE_INTEGRATION.md`.
- Có camera phối cảnh: kéo chuột trái xoay, kéo chuột phải dịch chuyển ngang/dọc theo màn hình, cuộn để zoom; cảm ứng dùng một ngón xoay/hai ngón dịch chuyển và pinch zoom. Có nút tổng quan khôi phục cả vị trí và tâm nhìn sau khi pan; click/drag được phân biệt để không chọn nhầm thiết bị khi điều hướng; vùng được chọn có viền/sáng rõ. Thay tham số không làm mất góc nhìn hiện tại.
- Mây và bụi có hiệu ứng khác nhau; cụm inverter lỗi có ký hiệu và nhãn riêng. Hiệu ứng gắn cùng ID và dữ liệu với KPI; không chỉ chạy hoạt ảnh trang trí.
- Nhãn nổi hiện khi hover chuột vào model/viền: tên/ID, tình trạng và số đo bất thường nếu có. Hover không chọn thiết bị và không đổi camera; rời chuột ẩn nhãn. Click chọn mở HUD góc phải và zoom, không ghim thêm nhãn trên model. Điện thoại dùng chạm chọn/HUD, không phụ thuộc hover.
- Có trạng thái tải cảnh, lỗi và không hỗ trợ WebGL. Dùng hình tĩnh dự phòng có ghi rõ khi cần, nhưng hình này không thay điều kiện nghiệm thu 3D.

## Màn hình tự cấu hình

- Có tiêu đề riêng và cách quay về ba preset; không bắt buộc có URL riêng.
- Bên trái là nhà máy 3D và kết quả nổi; bên phải là bảng tham số ngắn. Ở màn hình hẹp, dùng ngăn điều khiển có thể thu gọn và giữ một phần cảnh cùng chỉ số tóm tắt nhìn thấy được.
- Thứ tự: loại tình huống → vùng ảnh hưởng → mức độ nếu áp dụng → thời lượng → nút phát lại/đặt lại.
- Thanh điều chỉnh cập nhật bản xem thử ngay; nhãn “Xem thử” và mốc thời gian nằm gần cảnh. Nút “Chạy mô phỏng” phát lại diễn biến thay vì là điều kiện để thấy kết quả.
- Kết quả toàn kỳ và tích lũy hiện tại có nhãn khác nhau; không đổi tên chỉ số âm thầm giữa hai chế độ.

## Khám phá thiết bị và IoT

- Các thiết bị được quản lý có vùng click đủ lớn, viền khi chọn và ID ổn định; danh sách/cây thiết bị cho phép tìm khi khó click trong 3D. Tấm pin minh họa mở hồ sơ cụm tương ứng, không giả có dữ liệu từng tấm.
- Chọn thiết bị mở HUD trong cảnh; có nút ẩn hồ sơ và quay về tổng quan. Cột phải giữ ngữ cảnh thiết bị cho AI, không còn chứa hồ sơ.
- Khi chọn thiết bị, camera giữ hướng nhìn và tiến gần vừa phải; có thể ngắt chuyển động bằng thao tác camera hoặc về tổng quan. HUD chỉ có tên, ID, tình trạng và số đo, cuối HUD có nút “Xem chi tiết”. Nút này mở dialog giới hạn trong vùng khung 3D: các biểu đồ xu hướng hiện đồng thời thành lưới hai cột (PV/inverter 4 biểu đồ, thiết bị khác hiển thị đủ tín hiệu có sẵn), số đo nằm trong mỗi thẻ; đầu hồ sơ thu gọn, quan hệ ở cuối. Mobile xếp một cột và cuộn trong dialog, không chiếm cột AI. Dialog hỗ trợ Escape, focus trap và trả focus về nút mở. Trên mobile HUD gọn, các số đo có vùng cuộn; điểm camera dịch trái/xuống để tránh HUD. Mỗi loại có chỉ số riêng, không tái dùng nguyên bảng inverter cho mọi đối tượng.
- Theo review ảnh khoanh, hồ sơ chỉ hiển thị thẻ vận hành; thẻ kết nối IoT được lược bỏ khỏi UI. Hai trạng thái vẫn tách biệt trong dữ liệu. Số đo có đơn vị và thời điểm; dữ liệu cũ/thiếu có chữ rõ, không chỉ đổi màu.
- Cảnh báo có thao tác “Xem thiết bị”; nút “Hỏi AI về thiết bị này” chuyển đúng ngữ cảnh. Thay thiết bị không làm phát lại mô phỏng hoặc mất cấu hình.
- Vẽ liên kết tới các thiết bị liên quan khi được chọn, có thể tắt; không để tất cả đường liên kết che khu nhà máy.

## AI và so sánh phương án

- Thẻ phân tích chủ động xuất hiện khi có sự kiện đáng chú ý, gồm thiết bị, bằng chứng, mức ưu tiên và hành động đề xuất. Tách cảnh báo xác định từ dữ liệu khỏi phần giải thích AI đang tải/lỗi.
- Trợ lý hội thoại có nhãn thiết bị/lượt chạy/mốc dữ liệu đang hỏi, không hiển thị mọi phản hồi như dữ liệu hiện tại.
- Từ phân tích có thể mở phương án xử lý phù hợp. So sánh “Chưa xử lý” / “Có phương án” giữ cùng thời đoạn và camera; cảnh 3D, biểu đồ và chênh lệch năng lượng cùng đổi.
- Không dùng nút “Điều khiển” hoặc “Sửa thiết bị” khiến khách hiểu có thao tác thật. Dùng “Thử phương án” và nêu giả định khôi phục.

## Nội dung và trạng thái

- Nhãn ngắn: “Công suất hiện tại”, “Tổn thất mô phỏng”, “Chạy mô phỏng”, “Đặt lại”.
- Tooltip giải thích MWp, MW, MWh và đường cơ sở cho người xem không chuyên.
- Có trạng thái ban đầu, đang chạy, tạm dừng, hoàn thành và lỗi.
- Chế độ chưa cấu hình AI giải thích ngắn, vẫn hiển thị phân tích theo quy tắc.
- Không dùng logo khách hàng, phần trăm tiết kiệm hoặc chứng nhận không có thật.
- Hướng dẫn demo cho phép khách tự thao tác; tránh chặn màn hình bằng lời giới thiệu dài.

## Kiểm tra hình ảnh

Chụp/kiểm tra các kích thước trong PRODUCT khi có công cụ trình duyệt. Kiểm tra dấu tiếng Việt, chữ phụ, focus, chú giải và bố cục khi nội dung AI dài. Nếu chưa thể xem bằng trình duyệt, ghi rõ giới hạn thay vì khẳng định UI đã được nghiệm thu.

## Trạng thái mẫu và cột AI

INV-03 có cảnh báo nhiệt độ 78 °C (đỏ), PV-06 có lưu ý nhiệt độ 58 °C (vàng), cùng nguồn fixture với HUD/dialog. Màu vật liệu model giữ nguyên khi chọn/cảnh báo; dùng đường viền rỗng bám theo hình chiếu model xuống mặt đất, xanh lá cho bình thường/vàng cho lưu ý/đỏ cho cảnh báo. Cả 19 thiết bị đều có viền kể cả chưa chọn; không còn vòng tròn rộng, beacon hoặc dấu chấm than nổi. Nhãn hover hiển thị tên đại lượng, số đo, đơn vị và chữ tình trạng; số đo tương ứng trong HUD góc phải được đưa lên đầu và tô đỏ/vàng. Camera chọn tiến gần hơn (PV 32,8, thiết bị khác 24,8 đơn vị cảnh — gần thêm 20% so với bản trước), giữ nguyên thao tác xoay/ngắt/reset. Đây là cảnh báo nhiệt độ khi thiết bị vẫn vận hành/kết nối, không phải mất khả dụng hoặc preset mới. Cột AI hiện là giao diện dành sẵn, có nhãn chưa kết nối và ô gửi bị vô hiệu hóa; không có phản hồi giả hay gọi API.

Thiết bị đang chọn có viền nhịp sáng nhẹ chu kỳ 2 giây (giữ màu tình trạng) và nhãn nhỏ “Đang chọn · ID”, không phụ thuộc hover/HUD. Chỉ một viền chạy, cập nhật tối đa khoảng 12,5 lần/giây; ngừng lịch vẽ khi tab ẩn, dọn timer khi đổi chọn/unmount. Reduced motion dùng viền sáng cố định.

## Review bộ chọn kịch bản trong cảnh

Tab Mô phỏng đặt ba lựa chọn mây/bụi/lỗi ngay góc trên trái khung 3D, cùng chuyển chế độ tự cấu hình. Không lặp các thẻ kịch bản bên dưới. Mây phủ bốn cụm trái theo bố trí x âm (PV-01, 02, 05, 06); bụi dùng bề mặt pin màu đất nhám và nhãn ID rõ, chỉ trong lớp minh họa. Cảnh báo vận hành tiếp tục dùng viền, không đổi màu model. Chuyển về Hiện trạng gỡ toàn bộ lớp minh họa.

## Trạng thái thiết bị khi chọn kịch bản

Viền, nhãn hover, trạng thái HUD/popup và danh sách chú ý phải thống nhất cùng annotation xem thử. Không chỉ tô viền mà vẫn ghi Bình thường như trạng thái duy nhất. Nhãn kịch bản có hậu tố “xem thử”; thông tin nền được phân biệt rõ, không tự diễn giải số đo nền thành số đo sau sự cố. Hiện trạng không nhận annotation mô phỏng.

## Trạng thái tài liệu sau rà soát T02

Mô hình kịch bản đã tính số đo, trạng thái và năng lượng thật trong phạm vi mô hình minh họa, không còn chỉ đổi annotation trên fixture nền. Bộ chọn và điều khiển chạy trong cảnh; tham số và so sánh dưới cảnh; số đo trong HUD/dialog theo đường đang xem. Bảng nghiệm thu tại [T02_ACCEPTANCE](T02_ACCEPTANCE.md); bàn giao bước sau tại [T03_HANDOFF](T03_HANDOFF.md). Các review T01/T02A cũ ghi bên dưới là lịch sử quyết định giao diện, không phải kết luận mô phỏng chưa triển khai.

## Màu tổn thất và nguồn dữ liệu

Hai chỉ số giảm/mất MW và MWh dùng đỏ trên nền đỏ nhạt. Nhãn hồ sơ ghi “Dữ liệu mô phỏng theo kịch bản”; không ghép trạng thái kết nối giả lập vào nhãn nguồn như thể đã kết nối nhà máy thật. Vận hành và kết nối vẫn tách riêng trong mô hình.
