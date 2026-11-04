# Bàn giao T05 — Hoàn thiện trải nghiệm và kiểm tra bản triển khai

## Quyết định hiện hành

Đã triển khai sửa popup @/focus/cuộn và kiểm tra kết nối AI có timeout/thử lại theo T05. Bằng chứng, ma trận kiểm tra và checklist URL thật tại [T05_ACCEPTANCE](T05_ACCEPTANCE.md); kết quả cuối tại [STATUS](STATUS.md). Kiểm tra Vercel mới trong phiên này bị proxy 403; không coi các kết quả deployment của đợt chuẩn bị dưới đây là kiểm chứng mới.

- Hướng dẫn trình diễn ba phút: **pending**, không xây tour, bước hướng dẫn, nút bỏ qua/thoát tour.
- Phần liên hệ: **ngoài phạm vi hiện tại**, không thêm CTA/form/email/Zalo và không hỏi lại thông tin liên hệ.
- Quota/ngân sách/giới hạn chi phí project Gemini: **ngoài phạm vi hiện tại**, không làm mục này thành điều kiện chặn hoặc hỏi lại. Giữ các guard/rate limit/timeout hiện có trong code; đây không phải yêu cầu xóa bảo vệ API. Việc bỏ khỏi phạm vi không có nghĩa quota toàn project đã được xác minh.
- Tạm dừng tối ưu style sâu. Giữ cấu trúc, theme, card gọn và diện tích ưu tiên 3D/chat.
- Không publish cấu hình cloud. Commit/push main để test Vercel theo quy trình đã được người dùng cho phép.

Các quyết định trên thay thế phạm vi hướng dẫn/liên hệ/chi phí trong TASKS/PRODUCT và ghi chép cũ. Không hỏi lại các quyết định đã chốt.

## Nền cần giữ

- T01/T02 đã được người dùng chấp nhận; T03 đạt phần chức năng, đã rà soát 25/25 bài và có bằng chứng Gemini thật tại T03_ACCEPTANCE/AI/STATUS.
- Hai tab Hiện trạng/Mô phỏng có hai hội thoại riêng, giữ bản nháp/lịch sử khi đổi thiết bị trong cùng tab. Mỗi tin giữ nguồn lúc gửi; phản hồi đến muộn không áp dụng sai tab/revision/cấu hình.
- Mặc định không chọn thiết bị; @ gợi ý theo ID/tên, chọn là focus camera ngay, không gọi AI. Enter gửi, Shift+Enter xuống dòng, không gửi nhầm khi IME đang ghép chữ.
- Hiện trạng có bốn KPI mở chi tiết. Card desktop khoảng 92px; không tăng chiều cao để trang trí. Giữ cột 3D/chat, không thêm menu dọc.
- Góc tổng quan camera [0,33,51], FOV responsive, zoom chọn thiết bị hiện hành; 16 GLB và 19 ID giữ nguyên. Không sửa model/vị trí/bộ tính để làm test qua.
- Native Gemini chỉ cấu hình/chạy/reset trong tab Mô phỏng. Câu “nếu 4 inverter bị hỏng thì sao” áp dụng fault/4 cụm/1 giờ khi thời gian đang chọn là 1 giờ, mất thêm 12,96 MWh trên nền hiện có. Đây không phải điều khiển thiết bị thật.
- Nền 30,1536 MW; lịch sử mất 1,0944 MWh trước 10:30, không cộng vào dự kiến mất thêm. INV-03 dừng nhưng online; nhánh 06 giảm nhẹ 2%, GW-01 trễ dữ liệu. Giữ màu vận hành xanh/vàng/đỏ và chất lượng dữ liệu.

## Checklist T05 và phần kiểm chứng tiếp

1. **Mobile/Tablet:** kiểm tra 390px, 768px, 1024px và desktop; portrait/landscape, chat/composer khi bàn phím ảo mở, popup @, HUD/hồ sơ/modal, cuộn, nút đóng/gửi. Kiểm tra cảm ứng xoay/pan/pinch-zoom và chọn thiết bị. Không đánh đồng resize viewport với xác minh thiết bị thật.
2. **Bàn phím:** Tab/Shift+Tab, focus nhìn rõ và thứ tự hợp lý, Enter/Shift+Enter/IME, ↑↓/Enter/Tab/Esc trong gợi ý @, Esc đóng modal và trả focus, không kẹt hoặc lọt focus ra nội dung phía sau modal.
3. **Giảm chuyển động:** bật prefers-reduced-motion; kiểm tra camera focus/reset, viền nhấp nháy, chấm dòng điện, spinner, hover và cuộn. Giữ khả năng nhận biết trạng thái, không xóa dữ liệu/ý nghĩa đường điện.
4. **Luồng triển khai:** trang → chọn thiết bị/@ → hỏi đúng nguồn → chuyển Mô phỏng → chat thiết lập/chạy/reset → trở lại Hiện trạng không đổi. Kiểm tra lỗi/timeout/thiếu API và lỗi tải/WebGL, có cách thử lại và không kẹt loading.
5. Sửa vấn đề có bằng chứng; chạy kiểm tra thích hợp; cập nhật STATUS/bàn giao, commit và push main. Kiểm tra deployment mới trên URL thực trước khi nói đã lên Vercel.

Không cần viết lại tính năng đã có. Nhiều xử lý bàn phím/giảm chuyển động/fallback đã tồn tại; đọc code/test trước, bổ sung phần thiếu theo kết quả kiểm tra.

## Đọc và điểm nối

Đọc AGENTS, tài liệu này, STATUS, TASKS, PRODUCT, DESIGN, AI, T03_ACCEPTANCE; đọc MONITORING/SIMULATION/IOT nếu chạm dữ liệu hoặc thiết bị.

- `src/components/dashboard.tsx`: tab, selection, snapshot, revision, nhận action AI, chiều cao vùng 3D/chat.
- `src/components/ai-panel.tsx`: hai phiên, composer/@, keyboard, request đang chờ và nhãn nguồn.
- `src/components/device-profile.tsx`, `metric-dialog.tsx`: HUD/hồ sơ/modal/focus.
- `src/components/plant-scene.tsx`, `power-network.tsx`: camera, input cảm ứng, giảm chuyển động và fallback.
- `src/app/globals.css`: layout/responsive; `dashboard-theme.css`: lớp style hiện hành, giữ ưu tiên import sau globals.
- `src/lib/server/ai.ts`, `assistant-actions.ts`, `src/app/api/ai/route.ts`: API/validation/tool. Không đưa key ra browser hoặc log.

## Môi trường và lệnh

Checkout `/workspace/Solar-Farm`, nhánh main; dùng checkout hiện có, không tạo worktree. Đợt chuẩn bị dùng Node 24.22.1, npm 11.9.0; package-lock.json và node_modules có sẵn. Khi cần cài lại dùng npm ci.

```bash
npm run typecheck
npm run build
CI=1 npm run test:e2e
```

Test dùng Chromium `/usr/bin/chromium` và SwiftShader. Build/start dùng Webpack theo cấu hình repo. Chạy build xong mới chạy test; không rebuild trong lúc server test dùng .next. Nếu cổng 3000 đang bị server cũ chiếm, xác định/dừng server đó rồi chạy lại, không nới test hoặc dùng nhầm build cũ.

Vercel: https://solar-farm-pi.vercel.app — main đã nối pipeline. Key server tên `Gemini_API` nằm ở Vercel, cloud không có binding đó; không yêu cầu gửi/copy key. GET /api/ai chỉ kiểm tra capability; generation/action thật cần request riêng. Dùng fixture công khai và hội thoại kiểm thử mới, không gửi lịch sử người dùng.

## Bằng chứng và phần chưa kiểm chứng

Đợt chuẩn bị đã chạy typecheck/build và 4/4 bài chọn lọc qua (49,9 giây): bố cục desktop/mobile, keyboard/Enter/IME, gợi ý @, quy tắc offline/apply/reset/mobile. Trang Vercel HTTP 200; capability AI ready, không sinh generation mới. Xem mục chuẩn bị T05 mới nhất trong STATUS. Các test trước đã bao phủ nhiều màn hình, keyboard/IME, mode/race, API lỗi và giảm chuyển động. Chưa coi Safari/Firefox, iOS/Android, bàn phím ảo hoặc pinch-zoom trên thiết bị thật đã qua chỉ vì Chromium headless qua. T05 chưa hoàn tất.

## Prompt cho chat mới

```text
Tiếp tục Thanhtht/Solar-Farm trên GitHub main mới nhất.
Đọc AGENTS.md, docs/T05_HANDOFF.md, docs/STATUS.md và các tài liệu được dẫn.
Đọc thêm docs/T05_ACCEPTANCE.md: phần sửa UX và kiểm tra cục bộ đã thực hiện.
Tiếp tục kiểm chứng deployment mới trên URL Vercel và Mobile/Tablet thật,
bàn phím ảo, luồng 3D/AI/mô phỏng; chỉ sửa vấn đề tái hiện được.
Hướng dẫn 3 phút pending; không làm phần liên hệ hoặc quota/chi phí Gemini,
không hỏi lại các mục này và không xóa guard API đang có.
Giữ cấu trúc/style hiện tại, card gọn, model/bộ tính và hai chat riêng theo tab.
Kiểm tra code/test có sẵn trước khi sửa. Chạy kiểm tra, cập nhật tài liệu,
commit và push main để test Vercel. Xác minh bản triển khai thực tế.
Không publish cấu hình cloud. Báo rõ giới hạn nếu không có thiết bị thật.
```
