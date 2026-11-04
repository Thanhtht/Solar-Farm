# Solar Farm One · Digital Twin

Demo tiếng Việt về nhà máy điện mặt trời hư cấu **50 MWp DC / 40 MW AC**, dùng Next.js, TypeScript, Three.js, React Three Fiber và Drei. T01/T02 đã được người dùng chấp nhận; mốc ứng dụng T02 là `82cef18`. UI dùng nền Hiện trạng, kịch bản đơn giản, reset và card chi tiết; phát lại/so sánh phương án chỉ còn trong core đã kiểm thử. T03 đã có nhận định theo quy tắc và đường hội thoại/API máy chủ, đã xác minh một request Gemini thật thành công trên Vercel, không cần mã truy cập. Chưa kết nối nhà máy thật, chưa phải bản bàn giao toàn demo T03–T05. Xem [cấu hình và giới hạn AI](docs/AI.md).

## Dữ liệu lịch sử cho module Hiệu suất

Mở tab **Hiệu suất** để xem heatmap Sản lượng/Đạt kỳ vọng, chọn ngày hoặc khoảng, kéo timeline từng ngày và đối chiếu kỳ liền trước/tùy chọn. Chọn cụm trong 3D, dropdown hoặc bảng; KPI/chart/chi tiết cùng cập nhật, thiếu dữ liệu khác 0. Có một tháng lịch sử mô phỏng đến hôm qua; không chọn hôm nay. Ba module giữ trạng thái riêng, chưa có AI lịch sử; phát hiện bất thường pending. Cách dùng/thang màu/so sánh và kiểm tra tại [HISTORY_UI](docs/HISTORY_UI.md), công thức/bảng dữ liệu tại [HISTORY_DATA](docs/HISTORY_DATA.md). Chạy `npm run test:history` không cần server/browser/API key; `npm run test:e2e -- tests/performance-ui.spec.ts` kiểm tra luồng lịch sử trên production build.

## Kiểm tra Hiện trạng

- Mở **Hiện trạng**, bấm card **Khả dụng thiết bị** để xem 1 Cảnh báo và 2 Lưu ý; chọn thiết bị trong cửa sổ để xem HUD/hồ sơ.
- Chọn **INV-03**: dừng phát từ 10:15, mất **4,32 MW**, **1,08 MWh trong 15 phút**; vẫn có kết nối IoT mẫu.
- Chọn **PV-06**: 58 °C, nhánh suy giảm nhẹ 2% từ 10:20 (4,41 MW DC/4,23 MW AC), màu vàng và vẫn có dòng chấm; chọn INV-06 thấy cùng vấn đề nhánh. Chọn **GW-01**: 850 ms vượt ngưỡng mẫu 500 ms, chưa giảm sản lượng; đọc nguy cơ số đo/cảnh báo đến muộn.
- Bấm **Xem chi tiết**: tất cả thông số có đồ thị 31 mẫu từ **10:00 đến 10:30 ICT**; INV-03 có bước mất đầu ra tại 10:15. Số cuối đồ thị khớp số hiện tại.
- Chạy kịch bản ở tab Mô phỏng rồi quay về: KPI, vấn đề và lịch sử Hiện trạng giữ nguyên. Đây là dữ liệu giả định, không phải kết nối nhà máy thật. [Giả định giám sát](docs/MONITORING.md).

## Chi tiết từ bốn card

- **Công suất AC:** đồ thị 31 mẫu, 30,15 MW thực tế / 34,56 MW dự kiến / 4,41 MW đang mất, công suất từng inverter và điều kiện thời tiết.
- **Năng lượng tích lũy:** đồ thị 15,72 MWh trong 10:00–10:30, chia hai khoảng 15 phút, đối chiếu tham chiếu và tổn thất; không phải sản lượng cả ngày.
- **Khả dụng thiết bị:** đồ thị 100% → 87,5%, phân biệt phát điện với kết nối, ba vấn đề và liên kết thiết bị.
- **Tổn thất năng lượng:** đồ thị tăng lên 1,09 MWh tổng cộng, gồm INV-03 1,08 MWh và nhánh 06 0,0144 MWh, kèm liên kết thiết bị.

Dùng Esc hoặc nút đóng để về card. Cửa sổ cuộn được trên điện thoại; không còn các bảng dài bên dưới cảnh 3D.

## Kiểm tra đường điện 3D

Đường nối **Pin → Inverter → Trạm thu gom**: xanh bình thường, vàng suy giảm còn công suất, đỏ dừng hoàn toàn. Dòng điện thể hiện bằng chấm nhỏ. Nhánh INV-03 đỏ và không có chấm chạy; PV-06/INV-06 vàng, giảm nhẹ 2%, vẫn có chấm chạy. GW-01 không có dây điện. Mô phỏng mây/bụi còn công suất thì vàng và chạy; về 0 thì đỏ/dừng. Reset khôi phục đúng nền. Giảm chuyển động giữ chấm tĩnh.

## Hội thoại điều hướng và thiết lập

Ở Hiện trạng, hỏi “Inverter 3 đang gặp vấn đề gì?” để AI trả lời và camera tự đưa tới thiết bị. Có thể gõ @ để chọn thiết bị ngay trong ô chat; mỗi tab Hiện trạng/Mô phỏng giữ một phiên riêng; đổi thiết bị trong cùng tab vẫn giữ lịch sử.

Ở Mô phỏng, có thể nhắn “Cho 8 inverter dừng trong 24 giờ và xem kết quả”, “Chỉ thiết lập mây che 4 cụm trong 2 giờ”, tiếp theo “Xem kết quả”, hoặc “Về trạng thái ban đầu”. AI dùng đúng bộ tính hiện có; lệnh chỉ thay đổi tab Mô phỏng. Chuyển tab hoặc sửa thiết lập khi đang chờ sẽ ngăn lệnh cũ ghi đè. Chi tiết và giới hạn tại [AI](docs/AI.md).

## Cách dùng mô phỏng

1. Mở **Mô phỏng**: trạng thái ban đầu khớp Hiện trạng, gồm ba vấn đề có sẵn và AC 30,15 MW. Chọn kịch bản, quy mô 1–8 cụm, thời gian **1/2/3/4/6/8/12/24 giờ**.
2. Bấm **Xem kết quả mô phỏng**. Cùng khối phía trên hiển thị **MW công suất giảm/mất** và **MWh tổng sản lượng mất thêm so với trạng thái ban đầu** trong thời gian đã chọn; 3D minh họa vùng chịu ảnh hưởng.
3. Đổi lựa chọn sẽ xóa kết quả cũ và lớp ảnh hưởng; bấm xem lại để áp dụng. Không có tùy chọn nâng cao, tham số, biểu đồ/so sánh hoặc điều khiển phát lại trên giao diện này.
4. Bấm **Về trạng thái ban đầu** để bỏ kịch bản/kết quả và trở lại dữ liệu ban đầu, 1 cụm/1 giờ. **Hiện trạng** có đối tượng dữ liệu riêng nên không bị thay đổi. Các biểu đồ/thời tiết/danh sách chú ý dưới trang Hiện trạng đã bỏ; mở nội dung qua bốn card KPI.

Thời gian UI theo giờ, nội bộ đổi sang phút để bộ tính dùng cùng công thức. Kết quả là ước tính toàn thời đoạn chưa xử lý, không phải năng lượng đã đo hoặc lượt phát lại hoàn tất. Mức giảm mặc định mây 45%, bụi 20%, inverter lỗi mất toàn đầu ra; mây mặc định bốn cụm trái. Ảnh 3D hiển thị tại mốc đang chịu ảnh hưởng. Bộ tính T02C vẫn có test nhưng không còn hiển thị phần nâng cao theo review UX.

Công thức: [SIMULATION](docs/SIMULATION.md). Checklist: [T02_ACCEPTANCE](docs/T02_ACCEPTANCE.md). Bàn giao sau: [T03_HANDOFF](docs/T03_HANDOFF.md). T02 đã được người dùng chấp nhận qua chat; API Gemini đã trả lời thành công trên Vercel; xem STATUS về phạm vi kiểm tra thực tế.

## T05 — trải nghiệm và kiểm tra bản triển khai

Đã bổ sung sửa focus/cuộn popup @, timeout 10 giây và nút thử lại kiểm tra kết nối AI. Ma trận kiểm tra, giới hạn thiết bị thật và checklist Vercel tại [T05_ACCEPTANCE](docs/T05_ACCEPTANCE.md); bàn giao tại [T05_HANDOFF](docs/T05_HANDOFF.md). Phạm vi: Mobile/Tablet, bàn phím, giảm chuyển động, kiểm tra luồng/lỗi Vercel. Hướng dẫn ba phút pending; liên hệ và quota/chi phí Gemini ngoài phạm vi hiện tại, không phải điều kiện chặn. Giữ cấu trúc/style/model/bộ tính và guard API hiện có.

## Trạng thái T03

Rà soát 04/11/2026: phần chức năng và tích hợp Gemini thật đã đạt; 25/25 bài T03 chạy lại qua. Có thể chuyển T04 về mặt kỹ thuật; còn xác minh quota toàn project và người dùng chốt nghiệm thu. Xem [T03_ACCEPTANCE](docs/T03_ACCEPTANCE.md) để phân biệt bằng chứng fixture/live và giới hạn.

Chat mặc định toàn nhà máy; Hiện trạng/Mô phỏng giữ hai hội thoại và bản nháp riêng, đổi thiết bị trong cùng tab không xóa lịch sử. Chọn thiết bị hoặc gõ @ để tìm ID/tên và thêm thẻ; bỏ thẻ để về toàn nhà máy. Từng câu trả lời giữ nhãn nguồn gốc riêng. Chữ chat 13px, nút gửi bên phải; Enter gửi, Shift+Enter xuống dòng. Mục nhận định thu gọn mang tên Trạng thái hiện tại.

Cột trợ lý có phân tích mô phỏng theo quy tắc, hoạt động không cần key. Hội thoại và diễn giải chủ động qua API tự bật khi máy chủ có `Gemini_API`; khách không cần nhập mã. Đã chọn Gemini với secret `Gemini_API` trong Vercel; đã xác minh credential và một request API thật HTTP 200; không coi chế độ quy tắc/fixture là hoàn thành tích hợp. Xem [AI](docs/AI.md) để cấu hình, quota, giới hạn serverless và kiểm tra thật; [STATUS](docs/STATUS.md) ghi bằng chứng mới. Giữ quyết định T02 trong [T03_HANDOFF](docs/T03_HANDOFF.md); T05 theo phạm vi đã chốt; không publish cấu hình cloud.

## Chạy cục bộ

Node.js 24 (đã kiểm tra Node 24.22.1/npm 11; `.nvmrc` ghi 24.19.0), npm và lockfile. Dùng checkout hiện có; không tạo worktree khi chưa được yêu cầu.

```sh
npm ci
npm run dev
```

Cổng 3000; không cần API key, biến môi trường, broker hoặc database. WebGL 2 cần cho cảnh 3D; danh sách thiết bị vẫn dùng được khi không có WebGL. Dev/build dùng Webpack vì giới hạn cổng Turbopack trong cloud.

```sh
npm run typecheck
npm run build
npm run test:e2e
npm run start
```

Playwright tự khởi động/dừng production server nếu cổng 3000 trống. Mặc định Chromium hệ thống `/usr/bin/chromium` với SwiftShader; có thể đổi bằng `PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH`. Không chạy dev/start cùng cổng; stop các server do bạn đã mở trước khi test. Browser tải từ CDN Playwright có thể bị policy chặn; không cần tải nếu đã có Chromium hệ thống.

Test gồm phép tính DC/AC, MW→MWh, biên sự kiện, mất toàn bộ công suất, zero-severity, giới hạn đầu vào, pause/reset/revision, so sánh cùng thời đoạn, cùng thao tác GLB/camera/HUD/dialog, desktop/mobile, fallback và tách hai tab. `test-results/`, `.next/`, tsbuildinfo được ignore. Kiểm thử headless không thay nghiệm thu GPU, Safari/Firefox hoặc cảm ứng thật.

## Cấu trúc và bàn giao

- `src/data/plant.ts`: registry 19 ID, quan hệ, cấu hình fixture T01 và ba preset.
- `src/lib/simulation.ts`: điều kiện nền, telemetry và quality.
- `src/lib/scenario-simulation.ts`: kịch bản, vòng đời, tích phân, can thiệp và dự kiến toàn kỳ.
- `src/lib/monitoring.ts`, `monitoring-metrics.ts`: nền hiện trạng/ban đầu và dữ liệu chi tiết bốn card.
- `src/lib/asset-status.ts`, `power-network.ts`: mức độ, quan hệ điện, màu và điều kiện có dòng dùng chung.
- `src/components/dashboard.tsx`, `simulation-setup.tsx`, `metric-dialog.tsx`: nguồn hiển thị hai tab, áp dụng/reset và chi tiết KPI.
- `src/components/plant-scene.tsx`, `scene-models.tsx`: GLB, viền, camera, mây và vật liệu bụi; không phải bản vẽ/tỷ lệ nhà máy thật.
- `tests/`: kiểm thử mô hình và trình duyệt. Tài liệu hiện hành: [AGENTS](AGENTS.md), [PRODUCT](docs/PRODUCT.md), [DESIGN](docs/DESIGN.md), [IOT](docs/IOT.md), [STATUS](docs/STATUS.md), [TASKS](docs/TASKS.md).

Bộ 16 GLB gốc và bố trí giữ từ T01; không cần chạy script Blender/Python để chạy website. Xem [3D_SCENE_INTEGRATION](docs/3D_SCENE_INTEGRATION.md), [3D_ASSET_BRIEF](docs/3D_ASSET_BRIEF.md) và [3D_ASSET_PROMPTS](docs/3D_ASSET_PROMPTS.md).

## Vercel

`vercel.json` dùng framework `nextjs`, build `npm run build`, output `.next`; Root Directory phải là gốc repository. GitHub main đã được người dùng kết nối Vercel để test. Push thành công không chứng minh deployment mới Ready hoặc URL đã được kiểm tra. Trong phiên T05 này proxy trả 403 CONNECT tới tên miền Vercel; chưa xác minh URL của deployment mới. Dùng checklist [T05_ACCEPTANCE](docs/T05_ACCEPTANCE.md) từ mạng truy cập được URL; không cần copy key hoặc đổi cấu hình cloud.
