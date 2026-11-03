# Solar Farm One · Digital Twin

Demo tiếng Việt về nhà máy điện mặt trời hư cấu **50 MWp DC / 40 MW AC**, dùng Next.js, TypeScript, Three.js, React Three Fiber và Drei. T01 đã được chấp nhận; T02 bổ sung tính toán kịch bản, phát lại và so sánh phương án. Chưa có AI API hoặc kết nối nhà máy thật, chưa phải bản bàn giao toàn demo T03–T05.

## Cách dùng mô phỏng

1. Mở **Mô phỏng** và chọn kịch bản, quy mô 1–8 cụm, thời gian **1/2/3/4/6/8/12/24 giờ**.
2. Bấm **Xem kết quả mô phỏng**. Cùng khối phía trên hiển thị **MW công suất giảm/mất** và **MWh tổng sản lượng mất** trong thời gian đã chọn; 3D minh họa vùng chịu ảnh hưởng.
3. Đổi lựa chọn sẽ xóa kết quả cũ và lớp ảnh hưởng; bấm xem lại để áp dụng. Không có tùy chọn nâng cao, tham số, biểu đồ/so sánh hoặc điều khiển phát lại trên giao diện này.
4. **Hiện trạng** có snapshot riêng; quay về vẫn giữ dữ liệu theo dõi như trước. Các khối điều kiện mẫu/thiết bị cần chú ý chỉ còn ở Hiện trạng.

Thời gian UI theo giờ, nội bộ đổi sang phút để bộ tính dùng cùng công thức. Kết quả là ước tính toàn thời đoạn chưa xử lý, không phải năng lượng đã đo hoặc lượt phát lại hoàn tất. Mức giảm mặc định mây 45%, bụi 20%, inverter lỗi mất toàn đầu ra; mây mặc định bốn cụm trái. Ảnh 3D hiển thị tại mốc đang chịu ảnh hưởng. Bộ tính T02C vẫn có test nhưng không còn hiển thị phần nâng cao theo review UX.

Công thức: [SIMULATION](docs/SIMULATION.md). Checklist: [T02_ACCEPTANCE](docs/T02_ACCEPTANCE.md). Bàn giao sau: [T03_HANDOFF](docs/T03_HANDOFF.md). Chưa ghi nhận nghiệm thu trên Vercel hoặc tích hợp AI thật.

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
- `src/components/dashboard.tsx`, `simulation-setup.tsx`: hai chế độ, tham số, KPI và đối chiếu.
- `src/components/plant-scene.tsx`, `scene-models.tsx`: GLB, viền, camera, mây và vật liệu bụi; không phải bản vẽ/tỷ lệ nhà máy thật.
- `tests/`: kiểm thử mô hình và trình duyệt. Tài liệu hiện hành: [AGENTS](AGENTS.md), [PRODUCT](docs/PRODUCT.md), [DESIGN](docs/DESIGN.md), [IOT](docs/IOT.md), [STATUS](docs/STATUS.md), [TASKS](docs/TASKS.md).

Bộ 16 GLB gốc và bố trí giữ từ T01; không cần chạy script Blender/Python để chạy website. Xem [3D_SCENE_INTEGRATION](docs/3D_SCENE_INTEGRATION.md), [3D_ASSET_BRIEF](docs/3D_ASSET_BRIEF.md) và [3D_ASSET_PROMPTS](docs/3D_ASSET_PROMPTS.md).

## Vercel

`vercel.json` dùng framework `nextjs`, build `npm run build`, output `.next`; Root Directory phải là gốc repository. GitHub main đã được người dùng kết nối Vercel để test. Push thành công không chứng minh deployment mới Ready hoặc URL đã được kiểm tra. Task sau T02 là T03 khi người dùng giao; chưa tự tích hợp AI hoặc mở rộng T04/T05.
