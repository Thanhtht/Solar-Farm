# Trạng thái bàn giao

## Mốc hiện tại

**T01 — ứng dụng và giao diện tổng quan 3D đã hoàn thành, ngày 02/11/2026.** Chưa triển khai công khai. Task tiếp theo: **T02A — điều kiện nền, telemetry và chất lượng dữ liệu**.

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
