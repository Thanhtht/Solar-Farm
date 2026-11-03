# T03 — Phân tích và hội thoại

## Trạng thái

Đã triển khai nhận định theo quy tắc và đường API máy chủ Gemini `generateContent`. Người dùng đã chọn Gemini và xác nhận secret `Gemini_API` được lưu tại Vercel Project Settings. Cloud không đọc được secret của Vercel. **Chưa kiểm chứng credential hoặc request AI thật trên deployment; T03 chưa hoàn tất phần tích hợp AI.** Không dùng kết quả fixture kiểm thử làm bằng chứng API thật. Không thay đổi GLB, camera, phép tính hoặc giao diện mô phỏng T02; chỉ bổ sung nội dung trong cột trợ lý có sẵn. Không mở T04/T05.

Nhận định luôn hoạt động khi không có API, ghi nhãn **Phân tích mô phỏng · theo quy tắc**. Ba vấn đề nền gồm INV-03, một nhánh PV-06/INV-06 và GW-01. Tổn thất 1,0944 MWh trước 10:30 tách khỏi dự kiến mất thêm sau khi áp dụng kịch bản. Forecast dùng `forecast(config, initial)` với nền 30,1536 MW. Reset không chữa các vấn đề nền.

## Ngữ cảnh và sự kiện

`src/lib/analysis.ts` tạo một nguồn nhận định dùng chung cho UI và API. Ngữ cảnh gồm mode, asset, revision, submitted, cấu hình, run ID, mốc đo, tín hiệu/chất lượng/đơn vị, ba mẫu gần nhất, quan hệ, KPI lịch sử và forecast riêng. Dữ liệu GLB, tọa độ, toàn bộ lịch sử không được gửi. Máy chủ chỉ nhận định danh và đầu vào kịch bản rồi tái dựng dữ kiện; không tin MW/MWh hoặc chỉ dẫn từ browser.

Context key có mode + asset + revision + applied state + cấu hình theo thứ tự chuẩn. Khi thay ngữ cảnh, client abort request và tăng generation; đáp án đến muộn bị loại, kể cả A → B → A. Hội thoại chỉ hiển thị trong nguồn đang hỏi, có nhãn thiết bị/mode. Thay tab không reset T02.

Quy tắc cập nhật tức thì. API chủ động chỉ gọi sau snapshot Hiện trạng ban đầu hoặc bấm áp dụng; cần cấu hình và mã truy cập. Gộp sự kiện 250 ms, tối đa một lần tự động cho cùng event trong phiên trang. Không gọi khi hover, xoay camera, đổi thiết bị hoặc chỉnh tham số chưa áp dụng. Đổi ngữ cảnh hủy kết quả đang chờ; không tự phát lại request bị hủy. Người dùng có thể gửi câu hỏi mới có chủ đích.

## Cấu hình máy chủ

Nhà cung cấp Gemini theo xác nhận của người dùng, API cố định `https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent`, header `x-goog-api-key`, `systemInstruction` và `contents`. Không nhận endpoint từ browser. Model mặc định `gemini-2.5-flash`, có thể đổi bằng `GEMINI_MODEL`; quyền dùng model và một lượt generateContent thật vẫn cần xác minh trên deployment. Tham chiếu schema chính thức: googleapis/googleapis `google/ai/generativelanguage/v1beta/generative_service.proto`.

| Biến máy chủ     | Yêu cầu                                                                               |
| ---------------- | ------------------------------------------------------------------------------------- |
| `Gemini_API`     | Đúng tên secret đã lưu tại Vercel, chỉ ở server; hỗ trợ `GEMINI_API_KEY` làm fallback |
| `GEMINI_MODEL`   | Tùy chọn, mặc định `gemini-2.5-flash`                                                 |
| `AI_ENABLED`     | Chỉ `true` mới bật sinh nội dung; mặc định tắt                                        |
| `AI_ACCESS_CODE` | Mã truy cập riêng 24–128 ký tự; bắt buộc để giới hạn người dùng API                   |

Nhập credential qua cấu hình bảo mật của môi trường/Vercel; không gửi khóa qua chat, commit `.env`, log hoặc dùng biến `NEXT_PUBLIC_*`. `AI_ACCESS_CODE` phải là secret thực trong process vì máy chủ so sánh tại chỗ; proxy placeholder không phù hợp cho trường này. Mã người xem nhập chỉ giữ trong bộ nhớ trang, không localStorage/cookie hoặc log. Nếu dùng proxy credential cho API key trong cloud, cấu hình đúng domain nhà cung cấp và khởi động Node 24 với `NODE_USE_ENV_PROXY=1` để fetch đi qua proxy/CA hiện có. Không tắt TLS. Vercel cần cấu hình riêng; cloud không tự chuyển secret sang Vercel.

Không sao chép secret Vercel sang cloud. Đã lưu hai domain `solar-farm-pi.vercel.app` và `generativelanguage.googleapis.com` vào draft mạng, giữ preset hiện có; chưa áp dụng hoặc publish. Truy cập deployment từ cloud hiện bị proxy từ chối 403. Không publish cấu hình cloud trong task này.

## Giới hạn và lỗi

- API sinh nội dung tắt nếu thiếu key, mã truy cập hoặc `AI_ENABLED=true`; không có endpoint trả phí ẩn danh. GET `/api/ai` trả `available`, `requiresAccessCode`, `credentialStatus`. Khi có key, probe đọc `models?pageSize=1` với timeout 5 giây và cache/gộp 10 phút; không sinh token hoặc lộ key/provider body. `ready` chỉ chứng minh key đọc được danh sách model, chưa chứng minh generation/model được chọn hoạt động.
- POST kiểm tra same-origin theo Host, JSON tối đa 20.000 byte, ngữ cảnh hợp lệ, câu hỏi 1–1200 ký tự, tối đa sáu tin lịch sử × 2000 ký tự. Dữ kiện máy chủ tái dựng; lịch sử và câu hỏi là nội dung không đáng tin trong prompt.
- So sánh mã truy cập bằng digest constant-time. Giới hạn sáu request/phút và 50 request cho toàn vòng đời mỗi process, tính cả request lỗi. Chống gọi lặp cùng câu hỏi/ngữ cảnh/lịch sử, kể cả in-flight. Không tự retry.
- **Hạn mức trong bộ nhớ không phải ngân sách phân tán:** serverless nhiều instance/cold start có bộ đếm riêng. Giữ mã truy cập riêng và thiết lập quota chi phí được nhà cung cấp thực sự cưỡng chế trước khi bật deployment. Cảnh báo ngân sách mềm không thay thế hard quota. Chưa xác minh quota của project Gemini.
- Timeout server 20 giây, client 25 giây; 700 token đầu ra, stream tối đa 32 KiB và câu trả lời tối đa 4000 ký tự. Không chuyển nguyên error body từ provider về browser. Không render HTML/Markdown trả từ model; output là văn bản và có nhãn diễn giải.
- Thiếu cấu hình, sai mã, quá hạn mức, provider lỗi hoặc timeout đều giữ nhận định theo quy tắc và mô phỏng hoạt động. Model chỉ diễn giải dữ kiện, không điều khiển thiết bị; vẫn cần đối chiếu số liệu chuẩn và xác minh thực tế.

## Kiểm tra

Từ gốc checkout: `npm run build`, `npm run typecheck`, `CI=1 npm run test:e2e`. Chromium hệ thống và SwiftShader theo config hiện có. `tests/analysis.spec.ts` kiểm tra probe Gemini đọc-only/cache/lỗi, số liệu, định danh, dữ kiện tái dựng, input/auth/quota/dedup/timeout/response lỗi và HTTP boundary. `tests/ai-panel.spec.ts` kiểm tra offline, liên kết thiết bị, apply/reset/mobile, hội thoại fixture đúng nguồn, race mode/asset/config/applied/reset và thử lại sau lỗi.

Fixture provider/browser được gắn nhãn kiểm thử. Để xác nhận API thật sau khi có cấu hình: chạy server với các biến riêng, nhập mã truy cập, hỏi về INV-03/PV-06/GW-01, áp dụng lỗi toàn bộ 24 giờ, kiểm tra số quá khứ/forecast, đổi ngữ cảnh khi chờ và đối chiếu usage/quota của provider. Chỉ sau request thật thành công mới ghi phần tích hợp đã xác minh. Push main chỉ kích hoạt pipeline đã kết nối, không chứng minh deployment Vercel Ready.
