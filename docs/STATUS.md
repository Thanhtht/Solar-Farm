# Trạng thái bàn giao

## Mốc hiện tại

**T01 — hoàn thành, được người dùng chấp nhận ngày 03/11/2026.** Mã giao diện gần nhất: `40f24bf`, đã push `main`. Người dùng đã xác nhận bản test Vercel hoạt động và chấp nhận kết quả T01; không coi đó là nghiệm thu toàn demo T02–T05 hoặc bằng chứng cloud đã trực tiếp kiểm tra deployment mới. T02A đã triển khai điều kiện nền, telemetry và chất lượng dữ liệu; task tiếp theo sau nghiệm thu là T02B. Xem [bàn giao T02A](T02A_HANDOFF.md).

## Review tách theo dõi hiện trạng và mô phỏng

- Mặc định mở tab Hiện trạng với snapshot mẫu độc lập; tab Mô phỏng giữ Run, tham số, lớp minh họa và lựa chọn thiết bị riêng. Dùng hai đối tượng snapshot riêng, không ghi ngược từ mô phỏng vào hiện trạng.
- Chuyển về Hiện trạng tự tạm dừng mô phỏng; quay lại giữ kết quả và tham số. Điều khiển chạy/reset, ba thẻ và tự cấu hình chỉ xuất hiện ở Mô phỏng. Badge, KPI và biểu đồ có nhãn theo chế độ. Tabs hỗ trợ phím mũi tên/Home/End và hiển thị ở 390 px.
- Kiểm tra: TypeScript, production build Webpack, git diff --check và **17/17 test qua (2,1 phút)**. Test mới xác nhận mặc định Hiện trạng, không có điều khiển/kịch bản ở Hiện trạng; chạy/reset mô phỏng không đổi KPI/lịch sử hiện trạng; tham số, lựa chọn và lượt mô phỏng giữ riêng; chuyển tab tạm dừng, hỗ trợ bàn phím và hiển thị ở 390 px.
- Giữ GLB, bố trí, camera và hồ sơ T01; không mở rộng mô hình kịch bản T02B/T02C/AI. Cập nhật PRODUCT, DESIGN, SIMULATION và README để tránh tiếp tục trộn hai workflow.

## T02A — điều kiện nền và IoT mô phỏng

- Thêm bộ sinh snapshot/reducer thuần ngoài UI với ID/revision, seed 1, bước 60 giây và thời gian mô phỏng cố định. Chạy nền, tạm dừng và đặt lại riêng; không dùng đồng hồ máy để sinh số đo hoặc làm stale.
- Giữ 19 ID/quan hệ, GLB/bố trí/light mode/logo/HUD/popup và cơ chế chọn/camera T01. KPI, biểu đồ, hồ sơ, thời tiết, cảnh báo và viền nhận cùng snapshot; không remount cảnh khi tick. Hai fixture nhiệt giữ nguyên, không giảm công suất/khả dụng.
- Nền 36 MW DC / 34,56 MW AC; tích phân hình thang MW × giờ thành MWh. Tổng trạm lấy từ inverter, không cộng trùng. Chất lượng valid/stale/invalid/missing; heartbeat độc lập vận hành. Thiếu công suất inverter làm tổng đo null, không thành 0; năng lượng/khả dụng ghi rõ theo mô hình.
- TypeScript và production build Webpack qua. Test mới kiểm tra chuỗi deterministic, 60 phút = 34,56 MWh, pause/reset, revision/lịch sử, stale/thiếu/invalid và inverter lỗi online. Browser kiểm tra chạy–pause–reset, dialog và giữ camera/lựa chọn.
- Lượt full đầu: 15/16 qua; bài camera T01 có sai lệch trong kiểm tra pan (độ dịch camera so với target). Chạy riêng lại cùng mã không sửa camera/test đã qua 1/1; không tái hiện lỗi ở lượt riêng. Lượt chạy lại toàn bộ cùng mã: **16/16 qua (1,8 phút)**, không sửa camera/test hoặc nới assertion. TypeScript, Prettier và git diff --check qua.
- Công thức/giới hạn: [SIMULATION](SIMULATION.md). Ba preset/tự cấu hình vẫn minh họa T01; chưa T02B/T02C/AI/IoT thật. Bằng chứng Chromium headless không thay GPU/cảm ứng máy thật. Push main nhằm kích hoạt bản test Vercel theo ủy quyền; chưa có bằng chứng deployment mới Ready hoặc kiểm tra URL công khai.

## Chốt T01 và rà soát lộ trình

- Người dùng xác nhận T01 đã ổn. Giữ nguyên giao diện/model và các quyết định đã chốt; không bắt đầu T02A trong lượt rà soát tài liệu này.
- Thứ tự còn lại: T02A dữ liệu/IoT nền → T02B ba kịch bản/tự cấu hình/phát lại → T02C so sánh phương án → T03 phân tích/hội thoại AI → T04 luồng demo/hoàn thiện → T05 nghiệm thu bản gửi khách trên URL thật.
- Đã cập nhật README/TASKS để bỏ trạng thái lỗi thời “chưa triển khai công khai”, phân biệt bản test Vercel với bàn giao demo hoàn chỉnh. Thêm T02A_HANDOFF làm đầu vào cho chat mới; SIMULATION.md sẽ được tạo khi triển khai và kiểm tra công thức T02A, chưa ghi công thức chưa thực hiện như kết quả đã có.
- Chỉ sửa tài liệu; kiểm tra liên kết nội bộ và whitespace, không chạy lại build/E2E. Bằng chứng kiểm thử ứng dụng được giữ trong các mốc bên dưới.

## Review dấu hiệu thiết bị đang chọn

- Viền thiết bị chọn nhịp sáng nhẹ chu kỳ 2 giây, không đổi màu model/tình trạng. Thêm nhãn “Đang chọn · ID” để nhận ra khi zoom ra hoặc pan, không phải hồ sơ hover.
- Chuyển lựa chọn trả viền cũ về độ đậm bình thường; chỉ một timer khoảng 12,5 Hz, dừng khi tab ẩn và khi unmount. Reduced motion giữ viền sáng cố định cùng nhãn.
- Build/TypeScript và 3 bài Chromium được chọn qua: camera/pan/reset, hover không đổi cảnh với reduced motion, nhịp độ đậm viền chọn thay đổi và viền khác đứng yên, chuyển ID trả viền cũ về bình thường, reduced motion giữ độ đậm cố định. Đã xem ảnh dấu chọn; Prettier và `git diff --check` qua. Không chạy lại các bài popup/model tải lỗi không thay đổi; chưa xác nhận Vercel Ready.

## Review 03/11/2026 — zoom thêm, pan và góc đường nhấp nháy

- Giảm khoảng cách focus thêm 20%: PV 41 → 32,8, các thiết bị khác 31 → 24,8; giữ reduced motion, khả năng ngắt camera và HUD.
- Bật pan bằng kéo chuột phải, ngang/dọc theo mặt phẳng màn hình; trái xoay, cuộn zoom. Cảm ứng dùng một ngón xoay, hai ngón pan/pinch zoom. Cập nhật hướng dẫn theo loại con trỏ. Loại click phụ và click sau drag khỏi chọn thiết bị; nút tổng quan khôi phục vị trí lẫn tâm nhìn và xóa quán tính pan.
- Xác định lỗi bốn góc đường từ GLB thật: winding mặt trên Y=0,07 quay xuống, bị cull; đáy Y=0 hướng lên trùng terrain gây z-fighting khi hover kích hoạt render. Đảo winding và tính normal trên clone geometry riêng của corner khi tải; giữ nguyên file GLB, vật liệu và bố trí đường. Không dịch đường lên để che lỗi.
- Build production/TypeScript và **12 bài kiểm thử qua** (7 Chromium, 5 hình học/dữ liệu). Kiểm tra chuột phải thực sự tịnh tiến camera/target cùng nhau, không chọn nhầm; reset trả về cả vị trí/tâm; khoảng cách focus đo được 32,8/24,8; hover không đổi ảnh cảnh khi ẩn riêng nhãn HTML lúc chụp. Raycast model góc đường xác nhận thấy mặt trên Y=0,07 và geometry nguồn không đổi. Đã xem ảnh sau sửa; Prettier và `git diff --check` qua. Lượt đầu phát hiện reset pan còn lệch, đã chuyển reset vào controller trong Canvas; hai bài kiểm tra cũng được sửa để tách tooltip khỏi ảnh so sánh và nhận diện mesh GLTF qua `isMesh` giữa ESM/CJS. Lượt tổng cuối 12/12 thành công; chưa xác nhận Vercel Ready từ cloud.

## Review 03/11/2026 — lưới biểu đồ, hover và viền theo model

- Thu gọn đầu popup, đưa giá trị hiện tại vào từng thẻ biểu đồ. Hiển thị đồng thời 4 biểu đồ cho PV/inverter, đủ 3 biểu đồ của MET và 2 biểu đồ của TR/GW; desktop hai cột, mobile một cột cuộn nội dung. Biểu đồ bất thường giữ màu vàng/đỏ theo đúng `attention.signalId`; thiết bị liên quan ở cuối và tiếp tục đổi đúng hồ sơ.
- Nhãn trên model chỉ hiện khi hover chuột, rời chuột/click thì ẩn; không làm đổi lựa chọn/camera và không bắt click. Click/chạm vẫn zoom và mở HUD góc phải, có đường chọn bằng danh sách khi không có hover/WebGL.
- Thay vòng tròn bằng dải viền rỗng từ convex hull hình học GLB chiếu xuống XZ, nới 0,12–0,28 đơn vị; không phủ màu kín dưới model. Đủ 19 thiết bị có viền: 17 xanh lá bình thường, INV-03 đỏ, PV-06 vàng. Màu model/dữ liệu/kết nối/công suất không đổi; vùng xem trước bụi/lỗi dùng cùng viền và banner minh họa.
- Build production/TypeScript thành công; 11 bài kiểm thử đã qua (7 Chromium, 4 hình học/dữ liệu). Lượt toàn bộ có 10 qua, một bài kỳ vọng sai 3 biểu đồ cho TR/GW; đối chiếu registry, sửa kỳ vọng thành 2 và chạy lại bài đủ 5 loại GLB thành công. Đã chạy lại bài responsive để xem ảnh popup mobile; đã xem ảnh desktop 4 biểu đồ, hover và viền. Có kiểm tra hover không chọn/không kéo camera, rời chuột ẩn nhãn, đủ 19 viền đúng màu/kích thước, giữa viền không bị tô kín, model xoay giữ đúng hình chiếu, quan hệ, bàn phím, WebGL dự phòng và model tải lỗi. Prettier và `git diff --check` qua; chưa xác nhận Vercel Ready từ cloud.

## Review vòng cảnh báo, zoom gần hơn và số đo trên nhãn

- Giữ nguyên màu/emissive của model khi chọn hoặc cảnh báo. Bỏ beacon và marker chấm than; vòng đỏ/vàng dưới chân luôn hiện với INV-03/PV-06, không phụ thuộc lựa chọn. Vùng xem trước bụi/lỗi cũng dùng vòng để không nhuộm asset; banner minh họa và dữ liệu T01 được giữ.
- Camera chọn tiến gần hơn khoảng 16–18%: khoảng cách PV 49 → 41, thiết bị khác 38 → 31; vẫn ngắt bằng thao tác camera/reset và giữ reduced motion.
- Nhãn ngay trên thiết bị được chọn thêm tên/số đo/đơn vị bất thường, chữ tình trạng và màu tương ứng. Bỏ scale chữ theo khoảng cách để nhãn không phóng lớn che model khi zoom. HUD góc phải đưa số đo bất thường lên đầu và nhấn đỏ/vàng, popup mở sẵn biểu đồ tín hiệu đó. Tất cả đọc đúng `attention.signalId`, không tạo số đo riêng.
- Build production/TypeScript và 8 test qua: xác minh mức zoom mới, vòng đỏ/vàng tồn tại khi chưa chọn, màu vật liệu giống các thiết bị bình thường và không đổi khi chọn/xem trước bụi/lỗi, số đo 58/78 °C đúng nhãn/HUD; các luồng dialog, responsive, WebGL dự phòng và model lỗi/thử lại tiếp tục qua. Sau chỉnh nhãn tránh che model, đã build lại và chạy lại thành công 2 bài HUD/dialog và desktop/mobile; xem ảnh desktop và điện thoại 390 px. Prettier và `git diff --check` qua. Chưa xác nhận deployment Vercel Ready từ cloud.

## Review HUD, chi tiết, camera và trạng thái đỏ/vàng

- Chọn thiết bị mở HUD ngắn trong góc trên phải của khung 3D; camera tự tiến gần theo hướng hiện tại và dịch điểm nhìn tránh HUD. Chuyển động khoảng 650 ms, có thể ngắt bằng thao tác camera, hỗ trợ reduced motion và reset tổng quan; ẩn HUD không bỏ chọn.
- “Xem chi tiết” mở native dialog đặt trong biên khung 3D, có biểu đồ tín hiệu và quan hệ; chọn thiết bị liên quan cập nhật đúng ID/nội dung. Có Escape/focus trap/trả focus. Cột bên phải đổi thành giao diện AI dành sẵn, ghi rõ chưa kết nối, không gửi hoặc giả trả lời API.
- Fixture: INV-03 nhiệt độ 78 °C → cảnh báo đỏ, PV-06 nhiệt độ 58 °C → lưu ý vàng. Màu GLB, beacon/marker, HUD/dialog và danh sách cần chú ý lấy chung trạng thái. Cả hai vẫn đang vận hành/kết nối; không làm giảm giả công suất hoặc khả dụng.
- Đưa điều khiển tự cấu hình sang vùng trái trong cảnh trên desktop, xuống ngay dưới cảnh trên mobile để cột phải luôn dành cho AI. Không mở rộng sang mô phỏng T02/AI T03.
- Build production/TypeScript và **8 test qua** (6 Chromium + 2 dữ liệu/bố trí): xoay/zoom/reset/tự focus, HUD ẩn/hiện, dialog/biểu đồ/quan hệ/Escape/focus trap, cột AI, click 5 loại GLB, hai cảnh báo độc lập, responsive, cấu hình, lỗi model/thử lại và WebGL dự phòng. Đã xem ảnh desktop, HUD cảnh báo, dialog và mobile 390 px. Một lượt đầu vướng bảo vệ click của Playwright khi marker HTML nằm trên canvas; đổi bài kiểm tra sang click tọa độ thực qua chuột, không bỏ kiểm tra ID/kết quả.
- Không xác nhận deployment Vercel Ready từ cloud; bằng chứng trên là build và Chromium/SwiftShader cục bộ, chưa thay cho kiểm tra trên GPU/trình duyệt người dùng. Tài liệu DESIGN/IOT/README và hướng dẫn tích hợp GLB đã cập nhật.
- Sau tinh chỉnh lớp/vị trí marker để không bị nhãn chọn che, đã build lại và chạy lại thành công 2 bài HUD/dialog và click GLB/cảnh báo; xem lại ảnh cảnh báo đỏ. Prettier và `git diff --check` qua.

## Tích hợp GLB và bố trí cảnh quan

- Thay hình học thiết bị bằng 5 template GLB cho đủ 19 ID, đặt đáy Y=0, dùng label anchor và hitbox; chuyển MET-01 tránh đường mới. Dữ liệu và các quan hệ thiết bị giữ nguyên.
- Tích hợp đủ 16 GLB: terrain, đường vòng/đường chính, cổng/hàng rào, nhà điều hành, 3 cây và 2 bụi. Dùng instancing, raycast cao độ cho cây, giảm mật độ trên canvas nhỏ; cảnh quan không bắt click thiết bị.
- Chuẩn hóa màu PV, clone vật liệu để không đổi lây, làm mượt normal có chọn lọc cho cây/terrain. Thêm tải batch/Suspense, lỗi asset có thử lại riêng và xử lý mất context.
- Dùng một ModelLibrary cho cả scene để chỉ tải/phân tích mỗi GLB một lần. Canvas vẽ theo nhu cầu (`frameloop=demand`), invalidate khi camera/vật liệu/instance/ống kính thay đổi; tránh render liên tục khi đứng yên.
- **Build/TypeScript và 6 test qua**: 5 bài Chromium + 1 bài bố trí/bbox, gồm đủ 16 request GLB, click trực tiếp đủ 5 loại, vật liệu không đổi lây, trạng thái minh họa, lỗi HTTP 503/thử lại, WebGL dự phòng, xoay/zoom/reset, responsive và kích thước hồ sơ. Đã xem ảnh desktop/laptop/390 px; 16 GLB gốc vẫn trùng checksum audit.
- Bộ đếm frame quan sát trong Chromium SwiftShader: 152 draw calls / 173.968 tam giác gồm cả pass bóng; đây không phải số draw calls riêng pass màu hoặc benchmark fps trên GPU máy thật. Cần kiểm tra thêm trên thiết bị người dùng; không tuyên bố đã đạt 60 fps mọi máy.
- Các lượt test đầu phát hiện lỗi phân biệt tải GLB/mất context, chờ khởi tạo và tải GPU liên tục ảnh hưởng screenshot/resize; đã sửa và lượt 6 test cuối cùng hoàn tất thành công. Không dùng lượt fail để nghiệm thu.
- Tham chiếu `docs/3D_SCENE_INTEGRATION.md`; chưa bổ sung tính toán mô phỏng/AI. Code được chuẩn bị để push và Vercel build theo kết nối hiện có; chưa có bằng chứng deployment mới Ready từ Vercel trong cloud.

## Kiểm tra bộ model đã upload

- Đã fetch/fast-forward đến `9e25361`, nhận 16 GLB cùng manifest, nguồn và preview trong `public`.
- Audit độc lập: Khronos Validator 16/16 không error/warning; Three.js parse và Chromium WebGL render 16/16 không page error. Tổng GLB 546.944 byte (~534,1 KiB), hình học template tổng 24.446 tam giác. Terrain raycast 110 điểm lõi có Y=0.
- Kết quả: đủ để tích hợp vòng đầu, cần xử lý root ROOT/world, normal/flat shading và màu PV khác preview; chưa sửa GLB hoặc renderer sản phẩm. Nguồn Blender chưa được chạy; chưa có nghiệm thu cảnh tổng thể/hiệu năng máy thật.
- Chi tiết và dữ liệu đo trong `docs/3D_ASSET_AUDIT.md` và `.json`. Chưa triển khai các model mới trong ứng dụng ở task kiểm tra này.

## Đặc tả đặt hàng model 3D và cảnh quan

- Đã soạn `docs/3D_ASSET_BRIEF.md`: art direction light mode/SAVA, 5 loại thiết bị, prefab cảnh quan, kích thước theo bố cục hiện có, GLB/PBR/trục/pivot/anchor, ngân sách hình học/texture/draw calls và checklist nghiệm thu.
- Đã soạn `docs/3D_ASSET_PROMPTS.md`: prompt chung, prompt từng thiết bị/cảnh quan và prompt kiểm tra đầu ra. Ưu tiên hai mẫu inverter + cụm pin trước để kiểm tra phong cách và tích hợp.
- Phân biệt model trưng bày với kích thước nhà máy 50 MWp thực tế; không thay registry/công suất bằng số lượng hình học. Nêu rõ gen ảnh không tương đương GLB; có thể dùng script Blender nhưng phải xuất và kiểm tra file thật.
- Chỉ bổ sung tài liệu; chưa tạo/tích hợp model hoặc thay renderer. Các mục tiêu fps, dung lượng và LOD là ngân sách đề xuất, chưa được đo trên asset mới. Đã kiểm tra liên kết nội bộ, hàng rào code, JSON mẫu và whitespace; không chạy lại build/E2E cho thay đổi tài liệu này.

## Review metadata trạm thời tiết

- Hồ sơ MET-01 bỏ dòng ID tín hiệu / Telemetry mẫu / chất lượng dưới các số đo, đồng bộ với các loại thiết bị khác. Bỏ mô tả “Điểm đo đại diện · không đo từng tấm” khỏi phần tóm tắt.
- Giữ tên bức xạ, nhiệt độ môi trường, tốc độ gió; giá trị, đơn vị, thời điểm cập nhật, biểu đồ và quan hệ không đổi. Registry vẫn giữ metadata gốc.
- Build/TypeScript thành công; kiểm tra Chromium được chọn (`WebGL, camera, thiết bị, cấu hình và responsive`) qua. Kiểm tra metadata được áp dụng cho cả MET-01, không còn ngoại lệ trạm thời tiết; nhãn, giá trị và thao tác chọn thiết bị vẫn đúng. Prettier và `git diff --check` qua.

## Review thu gọn hồ sơ thiết bị

- Đưa trạng thái vận hành thành một hàng ngang toàn bề rộng; giảm padding/khoảng cách ở phần nhận diện, các số đo, xu hướng và quan hệ. Số đo giữ nhãn và đơn vị rõ ràng; rút thông báo cuối hồ sơ thành “Không có cảnh báo vận hành”.
- Dùng chung chiều cao tính từ viewport cho khung 3D và hồ sơ desktop: hai khung thẳng cạnh trên/dưới ở màn hình tổng quan. Phần tóm tắt hồ sơ cố định, nội dung số đo/xu hướng/quan hệ cuộn bên trong khi dài. Điện thoại dùng chiều cao tự nhiên, không ép cuộn lồng nhau.
- Build/TypeScript và **3 test Chromium qua**. Đã xác minh hai khung có cùng chiều cao/vị trí (sai số ≤1 px) ở 1440×900, 1366×768, 1920×1080, 1024×768; phần quan hệ vẫn truy cập được khi cuộn bên trong. Các kiểm tra logo gốc, thiết bị, WebGL dự phòng và mobile vẫn qua. Đã xem ảnh giao diện sau chỉnh; `git diff --check` và Prettier qua.

## Logo gốc và metadata các hồ sơ còn lại

- Đã fetch và fast-forward commit người dùng upload `030ab5a`; di chuyển nguyên file `sava-logo.png` vào `public/brand/sava-logo.png` (808×632 RGBA), không chỉnh sửa pixel. Thay src header sang PNG gốc, dùng `unoptimized` và đúng tỷ lệ ảnh; xóa SVG dựng lại. Vấn đề thiếu file gốc ở các review trước đã được giải quyết.
- Inverter, trạm thu gom và gateway: bỏ dòng ID tín hiệu / Telemetry mẫu / Tính toán / chất lượng dưới từng số đo; rút gọn hậu tố “đại diện”, “mẫu” trong tên tín hiệu và “heartbeat mẫu” trong mô tả gateway. Giữ tên đại lượng (kể cả nhiệt độ), giá trị, đơn vị, thời điểm cập nhật, trạng thái vận hành và liên kết thiết bị.
- Bỏ đoạn giải thích snapshot dưới xu hướng; đổi “Mốc đo fixture” thành “Cập nhật”. Dữ liệu gốc và quality vẫn được lưu trong registry; nhãn dữ liệu mô phỏng trên header được giữ. Các metadata của trạm thời tiết nằm ngoài yêu cầu lần này được giữ.
- Kiểm tra: build/TypeScript thành công, **3 test Chromium qua**. Các hồ sơ PV/INV/TR/GW không có metadata nhưng tên số đo vẫn hiển thị; logo phục vụ qua HTTP đã xác minh trùng SHA-256 với PNG gốc người dùng upload. Kiểm tra khung 3D vừa viewport desktop/laptop và responsive vẫn qua; đã xem ảnh header/hồ sơ sau sửa.

## Review giao diện sau khi chạy trên Vercel

- Người dùng xác nhận đã mở được website sau bản sửa `vercel.json` (`faa3e94`). Không còn dùng ảnh 404 trước đó làm trạng thái hiện tại.
- Theo yêu cầu review, chuyển toàn bộ giao diện sang light mode: bảng trắng, nền xanh nhạt, chữ xanh mực, điểm nhấn mint/vàng nắng/xanh dương/cam san hô. Đồng bộ cả cảnh WebGL, nhãn, đồ thị và trạng thái hover/selection.
- Tăng chiều cao cảnh desktop từ 440–530 px lên tối thiểu 620–680 px, khoảng 70–74vh; thu gọn header/KPI, giảm cột hồ sơ xuống 300–320 px. Nhà máy ở gần camera hơn; ống kính responsive giữ đủ thiết bị trong góc tổng quan. Điện thoại dùng cảnh cao 440 px.
- Giữ nguyên fixture và phạm vi T01; các kịch bản vẫn chỉ minh họa vùng, chưa tính mô phỏng/AI.
- Kiểm tra bản light mode: build/TypeScript qua; 2 test Chromium qua, bao gồm xoay/zoom/reset, chọn hình học và đủ 5 loại hồ sơ, cấu hình, responsive 1440/1024/390 px và dự phòng WebGL. Đã xem ảnh desktop/điện thoại; giới hạn GPU/trình duyệt thật như phần bằng chứng bên dưới.

## Review logo, typography và chiều cao màn hình

- Đưa logo SAVA vào header: asset `public/brand/sava-logo.svg` là bản vector dựng lại từ ảnh đính kèm (không phải file gốc được tải xuống), giữ biểu tượng hai màu xanh, wordmark và tagline, nền trong suốt; có alt text và liên kết về tổng quan.
- Tăng chữ nội dung chính lên 15–17 px, metadata 12–14 px; tăng chữ trong hồ sơ, cảm biến, nút và chú giải. Hàng KPI chuyển nhãn/số sang cạnh nhau, giảm padding và rút gọn tên chỉ số, giữ đơn vị và ghi chú fixture.
- Thay chiều cao tối thiểu 620–680 px bằng chiều cao viewport còn lại tính từ vị trí thực tế của khung, cập nhật khi đổi màn hình hoặc chiều cao header/KPI. Desktop thấy trọn cả thanh công cụ và chú giải, chừa 12 px cuối màn hình; điện thoại tiếp tục cuộn một cột.
- Build và TypeScript thành công; **3 test Chromium qua**. Đã xác minh logo tải được, toàn khung 3D nằm trong viewport 1440×900, 1366×768, 1920×1080, 1024×768, canvas cao trên 300 px và không tràn ngang; các kiểm tra tương tác trước vẫn được giữ. Đã xem ảnh laptop 1366×768 và điện thoại 390 px.

## Review lược bỏ nội dung theo ảnh khoanh

- Bỏ câu giới thiệu dưới tên nhà máy, số thiết bị mẫu, dòng địa điểm/nhà máy hư cấu và chú thích hình học trong cảnh. Nhãn “Dữ liệu mô phỏng” trên header được giữ.
- Bỏ thẻ kết nối IoT trong hồ sơ; dữ liệu và trạng thái kết nối trong registry được giữ nguyên. Bỏ hậu tố “cụm đại diện” trong mô tả danh định cụm pin.
- Theo vùng khoanh trên hồ sơ PV: ẩn tên tín hiệu nhiệt độ khỏi phần hiển thị (giữ tên cho trình đọc màn hình), bỏ metadata ở hai tín hiệu nhiệt độ/điện áp DC và bỏ hậu tố “tương đương” ở tên điện áp. Giữ giá trị, đơn vị và các hàng không được khoanh. Áp dụng nhất quán cho các cụm PV, không thay đổi dữ liệu fixture.
- Kiểm tra: build/TypeScript qua; smoke test Chromium mở PV-04 và đối chiếu các vùng khoanh, xác nhận chữ đã bỏ/ẩn và giá trị/đơn vị cùng các hàng không khoanh còn nguyên. Đã xem ảnh chụp sau sửa; `git diff --check` qua. Không chạy lại toàn bộ E2E cho thay đổi text này.

## Sửa nhãn nhiệt độ và làm gọn tín hiệu PV

- Khôi phục nhãn “Nhiệt độ” hiển thị trước giá trị °C; lần trước đã hiểu vùng khoanh quá rộng và ẩn nhầm nhãn này.
- Hồ sơ PV dùng nhãn ngắn: “Nhiệt độ”, “Điện áp mạch DC”, “Dòng DC”, “Công suất DC”. Bỏ các hậu tố “tổng tương đương”, “tính toán” và toàn bộ dòng metadata dưới các tín hiệu PV theo ảnh review mới. Registry, chất lượng dữ liệu, giá trị và đơn vị được giữ nguyên.
- Kiểm tra: build/TypeScript và 1 test Chromium được chọn (`WebGL, camera, thiết bị, cấu hình và responsive`) qua; đã thêm kiểm tra hồi quy nhãn “Nhiệt độ” phải nhìn thấy và các hàng PV không còn metadata/hậu tố được khoanh. Không chạy lại 2 test không liên quan.
- Logo: xác định asset hiện tại là SVG dựng lại từ ảnh xem trong chat, không phải file gốc, nên đường nét khác thương hiệu. Chưa thay logo lần nữa bằng bản vẽ phỏng đoán; cần PNG/SVG gốc để thay chính xác. Header giữ tỷ lệ ảnh bằng object-fit: contain, không có lỗi kéo giãn CSS.

## Đã làm ở T01

- Khởi tạo Next.js 16.4.3, React 19.3.1, TypeScript, Tailwind CSS 4, Three.js, React Three Fiber và Drei. npm + lockfile; Node.js 24.19.0 trong `.nvmrc`.
- Giao diện tiếng Việt theo DESIGN: bốn KPI, cảnh nhà máy, đường công suất cơ sở, hồ sơ thiết bị, điều kiện thời tiết, sự kiện mẫu và đúng ba thẻ mây che/bám bụi/lỗi inverter.
- Cảnh 3D hình học thực: tám cụm pin, tám inverter, trạm thu gom, trạm thời tiết và gateway. Có xoay/zoom giới hạn, chọn hình học, nhãn thiết bị, vòng chọn và nút về góc tổng quan. Reset xả phần quán tính còn dư trước khi khôi phục camera.
- Cây thiết bị thay thế thao tác click, liên kết giữa hồ sơ và sự kiện gateway dẫn tới đúng ID. Có thể đóng hồ sơ.
- Hồ sơ phù hợp từng loại: ID, khu vực, thông số danh định, vận hành và kết nối tách biệt, tín hiệu có ID/cấp đo/đơn vị/nguồn/chất lượng/mốc đo, chọn tín hiệu xem xu hướng, thiết bị liên quan. Mọi dữ liệu đều ghi là mẫu/giả lập.
- Registry và fixture dùng chung tại `src/data/plant.ts`: 19 thiết bị, ID ổn định, quan hệ và vị trí. Snapshot `fixture-T01`, revision 1, mốc 10:30 ICT; tín hiệu mang asset ID, snapshot ID, chu kỳ và thời điểm. Không dùng số ngẫu nhiên hoặc đồng hồ máy để tạo dữ liệu.
- Màn hình tự cấu hình cạnh cảnh trên laptop: loại, vùng, mức mây/bụi, thời lượng; lỗi inverter không có thanh phần trăm. Có thể chọn vùng bằng danh sách hoặc click cụm/inverter. Đổi tham số giữ camera. Trên màn hình nhỏ, bảng cấu hình nằm ngay dưới cảnh; ống kính tự điều chỉnh để thấy toàn nhà máy.
- Ba lớp minh họa phân biệt: mây, vật liệu bụi và đánh dấu vùng lỗi. **Chưa tính tác động công suất**; KPI/telemetry/biểu đồ vẫn là snapshot cơ sở. Nút chạy bị vô hiệu hóa, ghi rõ có ở T02. Không giả lập thông báo chạy thành công.
- Trạng thái tải, lỗi cảnh, không có WebGL và mất context có hướng dẫn/thử lại; danh sách thiết bị vẫn sử dụng được.
- Đã ghi lệnh thực tế và giới hạn trong README/AGENTS. `next.config.ts` tắt `agentRules` để `next dev` không tự thêm nội dung vào AGENTS.

## Quyết định và giả định fixture

- Nhà máy hư cấu Solar Farm One, 50 MWp DC; tám cụm 6,25 MWp, mỗi cụm cấp vào inverter 5 MW AC; giới hạn nhà máy 40 MW AC. Hình học đại diện, không phải bản vẽ hay tỷ lệ vật lý.
- Mạch DC tương đương 1.000 V × 4.500 A = 4,5 MW/cụm; fixture AC 4,32 MW/inverter (tỷ lệ 0,96), tổng 34,56 MW. Chưa phải bộ mô hình hiệu suất/môi trường. Trạm thu gom dùng cùng tổng công suất và lịch sử inverter, không cộng trùng vào KPI.
- Có sáu mẫu lịch sử cố định 10:25–10:30, chu kỳ 60 giây. Đây là fixture quá khứ, không phải lịch sử phát lại. KPI năng lượng và tổn thất bằng 0 vì chưa có lượt mô phỏng; không tích phân từ lịch sử fixture để giả kết quả chạy.
- Gateway có 18 nguồn thiết bị phía dưới; tổng registry gồm gateway là 19. Không cài broker, không kết nối giao thức IoT thật.
- Mặc định mây 45%/30 phút, bụi 20%/60 phút, lỗi inverter 30 phút. Mây 0–100%, bụi 0–50%, thời lượng 5–120 phút. Đây là đầu vào giao diện để T02 tiếp nhận, chưa là kết quả mô phỏng đã kiểm định.

## Bằng chứng kiểm tra

- `npm ci --no-audit --no-fund`: cài lại từ lockfile.
- `npm run typecheck`: thành công, bao gồm mã ứng dụng và test.
- `npm run build`: thành công với Webpack; trang chính được prerender.
- `npm run dev -- --port 3001`: khởi động thành công; yêu cầu HTTP trả 200 và có tên nhà máy/nhãn dữ liệu. Đã dừng dev server sau kiểm tra.
- `npm run test:e2e`: **2 test trình duyệt Chromium thực thi và qua**, trên production server do Playwright khởi động.
  - WebGL tải được, xoay/zoom làm thay đổi ảnh, về tổng quan khôi phục hình ảnh trong dung sai pixel 2% (ngưỡng chênh kênh màu 25 để bỏ qua sai số raster). Có click trực tiếp hình học 3D và xác minh đổi thiết bị.
  - Chọn từ danh sách đủ năm loại (PV, INV, TR, MET, GW), kiểm tra ID/hồ sơ/nhãn 3D, mở gateway từ sự kiện, đóng hồ sơ.
  - Đúng ba preset; mở cấu hình, đổi loại/vùng/mức độ/thời lượng, ẩn thanh phần trăm cho inverter lỗi, nút chạy vô hiệu hóa và đặt lại.
  - 1440, 1024, 390 px: không tràn ngang; bảng tự cấu hình trên điện thoại nằm ngay dưới cảnh. Đã xem ảnh chụp desktop và điện thoại. Ảnh được tạo lại trong `test-results/`, không commit.
  - Khi chủ động chặn WebGL, có thông báo và vẫn chọn MET-01 từ danh sách để mở đúng hồ sơ.
- `git diff --check`: không lỗi whitespace. Mã được định dạng bằng Prettier.
- AC-01, AC-12 và phần hồ sơ fixture của AC-17 đã được kiểm tra ở T01. Không đánh dấu các AC mô phỏng/AI/triển khai là đã đạt.

## Sự cố môi trường đã xử lý và giới hạn bằng chứng

- Lệnh npm qua sandbox ban đầu không kết nối được proxy; cài package thành công khi chạy với quyền mạng phù hợp. Không cần token mới.
- Turbopack bị chặn mở cổng nội bộ; chuyển sang `next dev/build --webpack`, không bỏ qua kiểm tra kiểu hay xác thực gói.
- Tải Chromium từ `cdn.playwright.dev` bị policy trả 403. Dùng Chromium hệ thống `/usr/bin/chromium` và SwiftShader; không tắt TLS hoặc lách allowlist. README có biến đường dẫn browser để dùng trên máy khác.
- Các lần test đầu tìm thấy locator trùng tên và lỗi reset camera do quán tính; đã sửa và chạy lại. Bằng chứng hoàn tất là lượt test qua, không dùng các lượt thất bại làm nghiệm thu.
- Chưa kiểm tra trên GPU thiết bị thật, Safari, Firefox hoặc thao tác cảm ứng thật. Responsive ở ba độ rộng là headless Chromium; chưa phải nghiệm thu toàn bộ UX T04.
- Chưa có WebSocket/telemetry thật, mẫu stale/thiếu chuyên biệt, bộ tính vật lý, tích phân năng lượng, phát lại/pause/revision động, so sánh phương án, AI, hướng dẫn 3 phút hoặc liên hệ. Không gọi demo đã sẵn sàng gửi khách.
- Theo yêu cầu tiếp theo của người dùng, commit T01 `4102c6b` đã được push lên GitHub `main`. Người dùng đã kết nối Vercel để test; chưa xác minh website công khai hoạt động.
- Log Vercel do người dùng cung cấp: build hoàn tất nhưng cấu hình dự án yêu cầu output `public`. Đã thêm `vercel.json` với framework `nextjs`, build `npm run build`, output `.next` để ghi đè cấu hình output sai. Chưa có kết quả build Vercel sau bản sửa; cloud vẫn bị proxy chặn truy cập tên miền Vercel.

## Task tiếp theo — T02A

Đọc PRODUCT, IOT, TASKS và mã fixture hiện tại. Giữ registry/ID, chốt mô hình điều kiện nền và công suất, tạo telemetry theo cùng snapshot/thời gian, trạng thái vận hành/quality/connection độc lập. Thêm test tính toán và stale/thiếu, không sinh preset thứ tư. Sau T02A mới làm T02B (ba kịch bản và phát lại), T02C (so sánh), T03 (AI), T04 (demo/UX), T05 (triển khai khi được yêu cầu).

Tài liệu nền T00 0.4 và các quyết định sản phẩm đã chốt vẫn được giữ trong PRODUCT, DESIGN, IOT và PRODUCT_REVIEW. Thương hiệu, thông tin liên hệ và nhà cung cấp AI chưa xác định không chặn T02A.
