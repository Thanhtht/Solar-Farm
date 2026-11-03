# Solar Farm One · Digital Twin

Demo tiếng Việt về nhà máy điện mặt trời hư cấu **50 MWp DC / 40 MW AC**, dùng Next.js, TypeScript, Three.js, React Three Fiber và Drei. T01 đã được chấp nhận; T02 bổ sung tính toán kịch bản, phát lại và so sánh phương án. Chưa có AI API hoặc kết nối nhà máy thật, chưa phải bản bàn giao toàn demo T03–T05.

## Cách kiểm tra T02

1. **Hiện trạng** mở mặc định: snapshot mẫu độc lập, không bị thay đổi bởi mô phỏng.
2. Sang **Mô phỏng** và chọn mây/bụi/lỗi ở góc trên trái cảnh. KPI, trạng thái và telemetry cập nhật ngay ở **Xem thử tại phút 0**. Năng lượng tích lũy vẫn 0; dự kiến toàn kỳ nằm ở Kết quả mô phỏng bên dưới.
3. **Chạy mô phỏng**, **Tạm dừng**, **Tiếp tục**, chọn tốc độ 1/5/15 phút mỗi giây. Lịch sử chỉ chứa mẫu đã phát lại; kết thúc tự dừng. **Chạy lại** tạo lượt mới; **Đặt lại mô phỏng** trở về cơ sở.
4. **Tự cấu hình** để đổi vùng (bụi/lỗi), mức giảm, thời đoạn. Mây phủ bốn PV trái: 01, 02, 05, 06. Đổi tham số tạo bản xem thử mới và xóa kết quả cũ, giữ camera.
5. Với bụi/lỗi, bật phương án vệ sinh/khôi phục ở Kết quả mô phỏng, chọn phút hoàn tất; bụi có tỷ lệ khôi phục. Chuyển **Chưa xử lý / Có phương án** để xem KPI, hồ sơ, 3D và đường công suất tương ứng. Năng lượng có thể thu hồi là chênh lệch hai phương án, không phải ROI.
6. Quay lại **Hiện trạng**: dữ liệu vẫn nguyên; lượt mô phỏng tạm dừng và được giữ để tiếp tục. Ẩn tab trình duyệt cũng tạm dừng.

Mây hết che cuối thời đoạn; bụi/lỗi vẫn còn nếu chưa có phương án xử lý. Inverter lỗi có AC = 0 nhưng vẫn online. Nhiệt độ mẫu INV-03 78 °C, PV-06 58 °C vẫn cảnh báo, không tự giảm thêm công suất. Công thức/giả định và ví dụ MWh: [SIMULATION](docs/SIMULATION.md).

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
- `src/lib/asset-status.ts`: màu/mức độ và nhãn dùng chung.
- `src/components/dashboard.tsx`, `simulation-results.tsx`: hai chế độ, tham số, KPI và đối chiếu.
- `src/components/plant-scene.tsx`, `scene-models.tsx`: GLB, viền, camera, mây và vật liệu bụi; không phải bản vẽ/tỷ lệ nhà máy thật.
- `tests/`: kiểm thử mô hình và trình duyệt. Tài liệu hiện hành: [AGENTS](AGENTS.md), [PRODUCT](docs/PRODUCT.md), [DESIGN](docs/DESIGN.md), [IOT](docs/IOT.md), [STATUS](docs/STATUS.md), [TASKS](docs/TASKS.md).

Bộ 16 GLB gốc và bố trí giữ từ T01; không cần chạy script Blender/Python để chạy website. Xem [3D_SCENE_INTEGRATION](docs/3D_SCENE_INTEGRATION.md), [3D_ASSET_BRIEF](docs/3D_ASSET_BRIEF.md) và [3D_ASSET_PROMPTS](docs/3D_ASSET_PROMPTS.md).

## Vercel

`vercel.json` dùng framework `nextjs`, build `npm run build`, output `.next`; Root Directory phải là gốc repository. GitHub main đã được người dùng kết nối Vercel để test. Push thành công không chứng minh deployment mới Ready hoặc URL đã được kiểm tra. Task sau T02 là T03 khi người dùng giao; chưa tự tích hợp AI hoặc mở rộng T04/T05.
