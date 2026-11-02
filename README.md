# Solar Farm One · Digital Twin

Ứng dụng demo tiếng Việt về nhà máy điện mặt trời hư cấu **50 MWp DC / 40 MW AC**, dùng Next.js, TypeScript, Tailwind CSS, Three.js, React Three Fiber và Drei.

**T01:** giao diện tổng quan và cảnh 3D thực có xoay/zoom, chọn thiết bị, hồ sơ IoT mẫu, ba thẻ kịch bản và bảng tự cấu hình. Chưa có bộ mô phỏng, AI API, kết nối nhà máy thật hoặc triển khai công khai.

## Chạy cục bộ

Yêu cầu Node.js 24 (đã kiểm tra với 24.19.0), npm 11. Dùng checkout hiện có; mỗi cloud task đã có môi trường riêng, không cần tạo worktree.

```sh
npm ci
npm run dev
```

Máy chủ phát triển dùng cổng 3000. Trong trình duyệt cục bộ, mở `http://localhost:3000`. WebGL 2 và tăng tốc đồ họa cần thiết để xem cảnh 3D; danh sách thiết bị vẫn hoạt động khi WebGL không khả dụng. Không cần biến môi trường, tài khoản hay khóa API cho T01.

```sh
npm run typecheck
npm run build
npm run start
```

Dùng Webpack cho dev/build vì Turbopack bị môi trường cloud hiện tại chặn mở cổng nội bộ. `start` chạy bản production sau build. Không chạy dev và start cùng cổng một lúc.

## Kiểm tra trình duyệt

```sh
npm run build
npm run test:e2e
```

Playwright tự khởi động production server nếu cổng 3000 chưa chạy. Mặc định dùng Chromium tại `/usr/bin/chromium` trong cloud này và SwiftShader cho WebGL headless. Trên máy khác, đặt `PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH` tới Chromium/Chrome đã cài. Đây là biến đường dẫn cục bộ, không phải secret. Tải browser của Playwright từ `cdn.playwright.dev` hiện bị chính sách mạng chặn, nhưng Chromium hệ thống dùng được.

Test bao phủ WebGL, xoay/zoom/reset camera, click hình học 3D, năm loại hồ sơ, danh sách/quan hệ thiết bị, sự kiện gateway, ba preset, tham số tự cấu hình, đặt lại, bố cục 1440/1024/390 px và đường dự phòng không WebGL. Ảnh chụp được tạo trong `test-results/` (không commit). Kiểm tra headless không thay cho nghiệm thu trên GPU và trình duyệt thiết bị thật.

## Cách khám phá

- Kéo trong cảnh để xoay, cuộn để zoom, chọn **Góc nhìn tổng quan** để reset camera.
- Click thiết bị trong 3D hoặc mở **Danh sách thiết bị**. Hồ sơ hiển thị ID, cấp đo, đơn vị, thời điểm, chất lượng, xu hướng mẫu và quan hệ.
- Chọn **Mây che**, **Bám bụi** hoặc **Lỗi inverter** để xem lớp minh họa vùng.
- Mở **Tự cấu hình**: chọn loại, vùng inverter, mức độ (mây/bụi), thời lượng. Click cụm pin/inverter trong 3D cũng chọn vùng cấu hình. Camera được giữ nguyên khi chỉnh tham số.
- Các lớp minh họa **không thay đổi KPI, telemetry hay biểu đồ**. Nút chạy mô phỏng được vô hiệu hóa và ghi rõ có ở T02. AI chưa tích hợp.

## Cấu trúc và giả định T01

- `src/data/plant.ts`: fixture duy nhất, registry 19 thiết bị (8 cụm pin + 8 inverter + trạm thu gom + trạm thời tiết + gateway), tín hiệu, quan hệ và snapshot cố định `fixture-T01`.
- Mỗi cụm 6,25 MWp DC cấp vào inverter 5 MW AC. Fixture: DC 4,5 MW/cụm, AC 4,32 MW/inverter; tổng AC 34,56 MW. Trạm thu gom đọc cùng tổng, không cộng thêm vào KPI. Cấp DC là mạch tương đương, không phải dòng của một tấm pin.
- Snapshot ngày 02/11/2026 lúc 10:30 ICT, lịch sử mẫu 10:25–10:30, chu kỳ 60 giây. Không dùng đồng hồ máy để làm fixture cũ đi, không tạo số ngẫu nhiên.
- Năng lượng và tổn thất là 0 vì chưa có lượt mô phỏng; lịch sử công suất mẫu không phải một lượt tích phân năng lượng. Khả dụng 100% từ trạng thái cơ sở, tách khỏi kết nối IoT.
- `src/components/plant-scene.tsx`: hình học đại diện, camera, chọn thiết bị và xử lý lỗi WebGL. Không theo tỷ lệ/bản vẽ nhà máy thật.
- `src/components/dashboard.tsx`: giao diện, hồ sơ theo loại, biểu đồ mẫu và trạng thái cấu hình phiên hiện tại.
- `tests/dashboard.spec.ts`: kiểm tra tương tác trình duyệt production.

## Bàn giao

Đọc [AGENTS.md](AGENTS.md), [PRODUCT](docs/PRODUCT.md), [DESIGN](docs/DESIGN.md), [IOT](docs/IOT.md), [STATUS](docs/STATUS.md) và [TASKS](docs/TASKS.md). Các tiêu chí toàn demo trong PRODUCT thuộc T01–T05; T01 không thay thế nghiệm thu mô phỏng/AI/triển khai.

Task tiếp theo: **T02A — điều kiện nền, telemetry và chất lượng dữ liệu**, giữ registry/ID từ T01. Không cần broker hoặc cảm biến thật.

## Cấu hình Vercel để test

`vercel.json` khai báo framework `nextjs`, build `npm run build`, output `.next`. File này ghi đè cấu hình output `public` gây lỗi “No Output Directory named public found”. Root Directory trong Vercel cần là gốc repository (nơi có `package.json`). Theo dõi deployment của commit mới trên `main`; chỉ coi triển khai hoạt động sau khi deployment Ready và kiểm tra URL thật.

## Đặt hàng model 3D và cảnh quan

Bộ yêu cầu hình dáng, vật liệu, kích thước, GLB, pivot/anchor, ngân sách web và nghiệm thu: [3D_ASSET_BRIEF](docs/3D_ASSET_BRIEF.md). Bộ prompt dùng với AI/Blender: [3D_ASSET_PROMPTS](docs/3D_ASSET_PROMPTS.md). Đây là hợp đồng asset cho lần nâng cấp hình ảnh, chưa phải model đã tích hợp. Nên nghiệm thu inverter và cụm pin trước khi tạo toàn bộ bộ cảnh quan.

## Cảnh GLB và cảnh quan đã tích hợp

Cảnh dùng 16 GLB trong `public`, gồm đủ 5 loại thiết bị, terrain, đường, hàng rào/cổng, cây/bụi và nhà điều hành. Bố trí tại `src/data/scene-layout.ts`; loader/vật liệu/instancing tại `src/components/scene-models.tsx`. Xem [3D_SCENE_INTEGRATION](docs/3D_SCENE_INTEGRATION.md) để chỉnh vị trí, hiểu phạm vi hiệu ứng và kiểm tra. Không cần chạy các script Python do công cụ tạo model cung cấp để chạy website.

## Chọn thiết bị và xem chi tiết

Chọn model/danh sách để camera tiến gần và mở HUD trong cảnh. Có thể ẩn/hiện HUD; chọn “Xem chi tiết” để mở biểu đồ và thiết bị liên quan trong dialog. Đóng bằng nút × hoặc Escape. Cột bên phải dành sẵn cho AI, hiện chưa kết nối API. Có hai fixture nhiệt độ: vòng chân INV-03 đỏ (78 °C), PV-06 vàng (58 °C); model giữ màu bình thường, nhãn chọn và HUD nhấn số đo bất thường; cả hai vẫn vận hành, không phải mất kết nối hay mất khả dụng.
