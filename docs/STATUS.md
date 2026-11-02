# Trạng thái bàn giao

## Mốc hiện tại

**T01 — ứng dụng và giao diện tổng quan 3D đã hoàn thành, ngày 02/11/2026.** Chưa triển khai công khai. Task tiếp theo: **T02A — điều kiện nền, telemetry và chất lượng dữ liệu**.

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
