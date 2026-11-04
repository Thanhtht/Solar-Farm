# T05 — Kiểm tra trải nghiệm và triển khai

Ngày kiểm tra: 04/11/2026. Nền `origin/main` là `3d48607`. Phạm vi giữ theo [T05_HANDOFF](T05_HANDOFF.md): hướng dẫn ba phút pending; liên hệ và quota/chi phí Gemini ngoài phạm vi; không publish cấu hình cloud.

## Thay đổi từ vấn đề tái hiện được

- Popup @: trước đây Shift+Tab từ textarea đi vào các nút option, nhưng xử lý Esc/↑↓ nằm ở textarea. Nay option và container cuộn không tham gia thứ tự Tab; ↑↓ chọn, Enter/Tab xác nhận, Shift+Tab rời composer và đóng popup. Chạm/click option vẫn chọn/focus camera như cũ. Khi rời composer, popup đóng; nội dung bản nháp vẫn giữ.
- Cuộn gợi ý: thay `scrollIntoView` trên option bằng cuộn riêng popup. Chuyển từ cuối danh sách về đầu không kéo cả trang, tránh làm mất vị trí composer ở màn hình thấp.
- Kiểm tra kết nối AI: HTTP lỗi được phân biệt với thiếu cấu hình; probe GET có timeout 10 giây và nút **Thử lại kết nối AI**. Không tự retry. Probe thành công mở lại composer và trả focus, không reload hoặc thay thiết lập Mô phỏng. GET không sinh generation Gemini. Thiếu key/lỗi vẫn dùng nhận định theo quy tắc và mô phỏng.
- Giữ theme/cấu trúc, card desktop gọn, 13px chat, camera/model/19 ID, số liệu và guard API hiện có. Không thay key hoặc cấu hình Vercel/cloud.

## Ma trận kiểm tra cục bộ

| Hạng mục            | Phương pháp và giới hạn                                                                                                                                                                                                               |
| ------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Responsive          | Chromium ở 390×844, 768×1024, 1024×768, 1440×900, 844×390, 390×400 và 1024×400; popup @, composer/gửi, bản nháp, modal KPI, focus và không tràn ngang. Hai viewport thấp là kiểm tra không gian thu hẹp, không phải bàn phím ảo thật. |
| Bàn phím            | Hồi quy Enter gửi một lần, Shift+Enter/IME không gửi; ↑↓/Enter/Tab/Esc với @; Shift+Tab không đi vào option; modal giữ focus, Esc đóng và trả focus.                                                                                  |
| Cảm ứng mô phỏng    | Chromium `hasTouch` + CDP: một ngón xoay; hai ngón pan/pinch; tap PV-02 mở đúng HUD; reset khôi phục overview; mở/đóng hồ sơ. Quan sát camera/target của renderer thật, không thay bằng ảnh 2D.                                       |
| Giảm chuyển động    | Touch test chạy `prefers-reduced-motion: reduce`, chọn camera không có flight; hồi quy viền chọn cố định, chấm điện tĩnh nhưng giữ màu/trạng thái, dừng nhánh đỏ. CSS hiện có dừng spinner/transition/cuộn mượt.                      |
| Lỗi                 | Test mới probe HTTP 503, probe treo/timeout, retry có chủ ý; hồi quy lỗi generation/thử gửi lại, API thiếu cấu hình, timeout/validation/guard, tải GLB lỗi/thử lại và WebGL dự phòng.                                                 |
| Luồng nguồn dữ liệu | Hồi quy chọn/@ → hỏi đúng nguồn → Mô phỏng thiết lập/chạy/reset qua action fixture → trở lại Hiện trạng, hai chat riêng và chống action/phản hồi cũ ghi sai revision/tab. Fixture không phải Gemini thật.                             |

Kết quả cuối: typecheck/build Webpack qua; **63/63 bài hồi quy qua trong 8,5 phút**, trước đó nhóm chat/T05 15/15 qua trong 2,0 phút. Prettier, diff-check và liên kết tài liệu qua. Các lượt lỗi trong quá trình sửa được ghi riêng tại STATUS, không dùng để nghiệm thu.

Lệnh từ gốc checkout:

```bash
npm run typecheck
npm run build
CI=1 npm run test:e2e
npx prettier --check src/components/ai-panel.tsx src/app/globals.css tests/t05-ux.spec.ts
git diff --check
```

Chạy build xong mới test, một tiến trình Playwright mỗi lần. Chromium `/usr/bin/chromium`, SwiftShader; không suy ra hiệu năng GPU thật từ kết quả này. Kết quả cuối cùng và mã commit/push ghi tại [STATUS](STATUS.md).

## Vercel và phần cần xác minh tiếp

URL: https://solar-farm-pi.vercel.app. GitHub main đã nối pipeline. Trong phiên này, truy cập HTTPS tới tên miền Vercel bị proxy trả **403 CONNECT**; cloud không có binding Gemini. Không đổi/publish cấu hình cloud, không xin/copy secret và không coi bằng chứng HTTP 200/Gemini của phiên trước là xác minh deployment mới.

Sau khi pipeline nhận commit, kiểm tra từ mạng truy cập được URL:

1. Xác nhận deployment gắn đúng commit mới và trạng thái thành công. Mở HTTPS, logo/16 GLB tải được, không lỗi JavaScript.
2. Mở @ chọn INV-03: camera/HUD đúng; hỏi “INV-03 đã dừng bao lâu, mất bao nhiêu điện?” bằng hội thoại kiểm thử mới. Đáp án khớp 15 phút, 1,08 MWh riêng INV-03; tổng lịch sử toàn nhà máy 1,0944 MWh, không quy lỗi phát điện thành mất kết nối.
3. Chuyển Mô phỏng, hỏi “nếu 4 inverter bị hỏng thì sao”: fault/4 cụm/1 giờ, mất thêm 12,96 MWh. Nhờ “Về trạng thái ban đầu”, rồi quay về Hiện trạng: 30,1536 MW và ba vấn đề nền còn nguyên; hai hội thoại riêng.
4. Kiểm tra trên iOS Safari/Android và tablet thật: portrait/landscape, bàn phím ảo mở/đóng, nhập tiếng Việt/IME, @, gửi/đóng, cuộn HUD/hồ sơ/modal, xoay/pan/pinch/tap. Bật giảm chuyển động rồi chọn/reset camera.
5. Với lỗi mạng AI, thử lại kết nối hoặc gửi lại câu hỏi khi lỗi generation; xác nhận hết loading và vẫn mô phỏng được. Không tạo lỗi bằng cách sửa secret/cấu hình production.

Chưa xác minh Safari/Firefox, thiết bị iOS/Android, bàn phím ảo hoặc gesture trên phần cứng thật. T05 chưa được coi là nghiệm thu toàn demo khi thiếu kiểm tra deployment mới trên URL thật; các giới hạn này không mở lại phần hướng dẫn/liên hệ/quota đã loại khỏi phạm vi.
