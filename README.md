# Solar Farm One · Digital Twin

Demo tiếng Việt về nhà máy điện mặt trời hư cấu **50 MWp DC / 40 MW AC**, dùng Next.js, TypeScript, Three.js, React Three Fiber và Drei. T01 đã được chấp nhận; T02 bổ sung tính toán kịch bản, phát lại và so sánh phương án. Chưa có AI API hoặc kết nối nhà máy thật, chưa phải bản bàn giao toàn demo T03–T05.

## Cách dùng mô phỏng

1. Mở tab **Mô phỏng**, chọn **Mây che / Bám bụi / Lỗi inverter**.
2. Chọn **Quy mô ảnh hưởng** (1–8 cụm) và **Thời gian ảnh hưởng** (5–120 phút).
3. Đọc kết quả: **giảm/mất bao nhiêu MW**, **mất bao nhiêu MWh** trong thời gian đó. Đây là ước tính toàn thời đoạn chưa xử lý; MW là công suất, MWh là sản lượng.
4. Bấm **Chạy mô phỏng** để cảnh 3D diễn lại ảnh hưởng đúng vùng; có thể tạm dừng, tiếp tục hoặc đặt lại. **Hiện trạng** có snapshot riêng và không bị thay đổi.

Mây mặc định 4 cụm trái, bụi/lỗi mặc định 1 cụm. Chọn quy mô 8 để thử ảnh hưởng toàn nhà máy. Mức giảm mặc định mây 45%, bụi 20%, inverter lỗi 100%; **Tùy chọn nâng cao** cho phép chỉnh mức giảm và vị trí bắt đầu. Mây hết che cuối thời đoạn; bụi/lỗi vẫn còn nếu chưa xử lý.

**Xem diễn biến và so sánh phương án (nâng cao)** bên dưới kết quả được đóng mặc định. Mở khi cần tốc độ 1/5/15 phút mỗi giây, biểu đồ hoặc so sánh vệ sinh/khôi phục. Phần này vẫn dùng mô hình T02C cùng thời gian/seed, không phải tính ROI hoặc lệnh điều khiển thật. Chuyển về Hiện trạng hoặc ẩn tab trình duyệt sẽ tạm dừng.

Công thức: [SIMULATION](docs/SIMULATION.md). Checklist nghiệm thu: [T02_ACCEPTANCE](docs/T02_ACCEPTANCE.md). Bàn giao sau: [T03_HANDOFF](docs/T03_HANDOFF.md). Chưa ghi nhận nghiệm thu T02 trên Vercel. Nhiệt độ mẫu INV-03 78 °C và PV-06 58 °C giữ nguyên, không tự giảm thêm công suất.

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
