# T03 — Phân tích và hội thoại

## Trạng thái

Đã triển khai nhận định theo quy tắc và đường API máy chủ Gemini `generateContent`. Người dùng đã chọn Gemini và xác nhận secret `Gemini_API` được lưu tại Vercel Project Settings. Cloud không đọc được secret của Vercel. **Đã xác minh credential và một request hội thoại Gemini thật trên Vercel: HTTP 200, model gemini-3.5-flash-lite, không yêu cầu mã truy cập.** Không dùng kết quả fixture kiểm thử làm bằng chứng API thật. Giữ GLB và phép tính T02; các cập nhật giao diện, camera và lệnh thiết lập mô phỏng theo review mới bên dưới. Không mở T04/T05.

Nhận định luôn hoạt động khi không có API, trong mục **Trạng thái hiện tại** (nhận định theo quy tắc). Ba vấn đề nền gồm INV-03, một nhánh PV-06/INV-06 và GW-01. Tổn thất 1,0944 MWh trước 10:30 tách khỏi dự kiến mất thêm sau khi áp dụng kịch bản. Forecast dùng `forecast(config, initial)` với nền 30,1536 MW. Reset không chữa các vấn đề nền.

## Review mới: đúng thiết bị và hai hội thoại riêng

Theo yêu cầu mới, Hiện trạng và Mô phỏng có **hai phiên chat độc lập** trong cùng lần mở trang. Mỗi mode giữ riêng lịch sử, bản nháp, lỗi và request đang chờ; đổi thiết bị hoặc revision trong cùng mode không xóa chat. Đáp án đến muộn lưu vào mode gốc; không xuất hiện ở tab khác và không ngăn người dùng chat ở tab khác. Máy chủ loại lịch sử có context khác mode trước khi gửi model. Reload bắt đầu lại hai phiên. Quyết định này thay yêu cầu một phiên xuyên mode ở review trước.

Đối tượng trả lời ưu tiên thiết bị nêu trong câu hỏi, rồi thiết bị đang chọn; không ưu tiên thiết bị lỗi nhất trong findings. Máy chủ gửi riêng dữ kiện thiết bị đích. Khi người dùng hỏi sai tiền đề về INV-04, cần nói rõ thiết bị vẫn hoạt động, rồi phân biệt INV-03 mới dừng. Nếu model bỏ qua thiết bị đích và nhảy sang thiết bị khác, câu mở đầu được bổ sung từ snapshot, có kiểm tra chất lượng tín hiệu (không coi thiếu dữ liệu là 0/hỏng). Camera giữ trọng tâm thiết bị được hỏi.

Sau phân tích chung Hiện trạng đầu tiên, thêm một câu hướng dẫn hỏi về nhà máy, dùng @ chọn thiết bị hoặc sang Mô phỏng thiết lập tình huống; không lặp ở từng đáp án. Popup @ có tiêu đề, số kết quả, icon, tên/khu vực và mã nhỏ gọn, hỗ trợ bàn phím như trước.

Góc nhìn tổng quan mới hướng thẳng từ cổng vào hai hàng pin: camera `[0,33,51]`, target `[0,0,0]`, FOV chuẩn 43°; lens responsive giữ cơ chế cũ. Nút tổng quan/reset về cùng góc này. Không đổi model/topology hoặc mức zoom khi chọn thiết bị.

Lệnh mô phỏng rõ ràng dùng Gemini function calling ANY, còn câu hỏi giải thích dùng AUTO. Prompt có ánh xạ mây→cloud, bụi→dust, lỗi/dừng inverter→fault và ví dụ cấu hình/chạy/reset. Vẫn kiểm tra giới hạn tham số và chỉ áp dụng action trong tab Mô phỏng. Lần thử thật đầu ở commit 233d803 trả HTTP 200 nhưng model hỏi lại loại mây đã nêu, chưa tạo action; không coi lượt đó là xác minh lệnh mô phỏng thành công.

## Review: lệnh mô phỏng và camera từ hội thoại

Trên tab **Mô phỏng**, hội thoại Gemini được cung cấp hai native function: `set_simulation` và `reset_simulation`. Ví dụ: “Cho 8 inverter dừng trong 24 giờ và xem kết quả”, “Chỉ thiết lập mây che 4 cụm trong 2 giờ”, rồi “Xem kết quả”, hoặc “Về trạng thái ban đầu”. AI hiểu ý định; máy chủ kiểm tra tham số và tái dựng kết quả bằng bộ tính T02. Không thực thi mã hoặc điều khiển thiết bị thật. Chat giải thích thông thường không thay đổi thiết lập.

Chỉ hỗ trợ ba kịch bản có sẵn (mây/bụi/lỗi), 1–8 cụm, thời gian 1/2/3/4/6/8/12/24 giờ. Mức giảm theo giới hạn model: bụi 0–50%, mây 0–100%, lỗi 100%. Bụi/lỗi có thể chỉ định inverter bắt đầu; mây vẫn bố trí theo các cụm phía trái như T02, không nhận vị trí tùy ý. Không mở thêm phương án can thiệp, loại tình huống hay mô hình vật lý mới. Thiếu loại kịch bản và chưa có thiết lập thì hỏi lại; thông số bỏ trống dùng thiết lập/preset hiện hành. Thiết lập chưa áp dụng được gửi riêng cho model để câu “xem kết quả” dùng đúng kịch bản đang chọn.

Tools chỉ có trong request chat có nguồn Mô phỏng. Máy chủ bỏ function call ở Hiện trạng/phân tích chủ động và chặn tham số ngoài giới hạn. Browser kiểm tra action lần nữa, chỉ áp dụng nếu mode, revision, submitted và cấu hình vẫn khớp nguồn lúc gửi (đổi thiết bị không làm mất hiệu lực lệnh). Nếu đã đổi tab hoặc sửa thiết lập khi chờ, trả lời rõ chưa áp dụng; không ghi đè thiết lập mới. Lệnh thành công cập nhật khối thiết lập/kết quả và 3D cùng nguồn, tăng revision, gắn tin trả lời với context mới. Reset giữ nguyên vấn đề nền; Hiện trạng luôn độc lập.

Ở **Hiện trạng**, khi gửi câu hỏi có ID/tên thiết bị hoặc thẻ @, camera focus thiết bị đó; tên như “Inverter 3”, “cụm pin 06” được nhận diện từ registry. Nếu câu hỏi toàn nhà máy và câu trả lời hướng tới thiết bị, ưu tiên thiết bị đầu tiên được nhận diện trong đáp án. Tin trả lời toàn nhà máy có nhãn “Trọng tâm: ID”. Không zoom do phân tích tự động, không di chuyển camera Mô phỏng khi đáp án Hiện trạng đến muộn. Chọn @ trong lúc soạn vẫn chỉ đặt đích câu hỏi, tới lúc gửi mới focus.

Header gom logo, Solar Farm One / Digital Twin, thông số và nhãn nguồn mô phỏng; hai tab ở giữa. Bỏ rail, breadcrumb, pill trạng thái và avatar. Nút danh sách thiết bị chuyển lên header và vẫn có ở chân 3D. Card có icon, màu nhấn và sparkline từ chính lịch sử snapshot (không tạo dữ liệu trang trí). Giữ cỡ chat 13px, Enter gửi, một hội thoại và nhãn nguồn từng tin. Lời chờ: “Anh/Chị chờ em một chút nhé…”.

## Hội thoại và bố cục hiện hành

Chat trả lời trọng tâm, lịch sự và mạch lạc như trợ lý hỗ trợ giám đốc; kết luận trước rồi giải thích vừa đủ, không ép 1–4 câu và không trả lời cụt lủn; xưng tôi, gọi người hỏi là anh/chị khi cần, không gọi là bạn; không tự ghép báo cáo vận hành, bằng chứng, ảnh hưởng hoặc khuyến nghị nếu không cần. Không nhắc tên CONTEXT_JSON/cấu trúc nội bộ, không chào và tự giới thiệu mỗi lượt. Phân tích chủ động dùng hướng dẫn riêng, tối đa ba câu về sự kiện chính. Đầu ra ưu tiên văn bản thuần, không ký hiệu Markdown.

Đã bỏ eyebrow, badge AI sẵn sàng và toàn bộ thanh ngữ cảnh Hiện trạng/Toàn nhà máy phía trên. Mục Trạng thái hiện tại vẫn thu gọn mặc định. Chat/ô nhập 13px, cột AI 360/380px, nút gửi icon bên phải có icon trắng khi có thể gửi, màu dịu khi vô hiệu hóa và spinner lúc chờ. Enter gửi, Shift+Enter xuống dòng; tôn trọng IME/229. Hai tab Hiện trạng/Mô phỏng được đặt giữa và nhấn mạnh lựa chọn hiện hành.

Hai hội thoại theo mode trong suốt thời gian mở trang. Đổi thiết bị, revision, áp dụng hoặc reset không xóa lịch sử và bản nháp của mode đó. Đổi mode hiển thị phiên riêng của mode mới. Mỗi tin lưu bản sao context tại lúc gửi; nhãn thiết bị/Toàn nhà máy, mode và kịch bản/thời lượng được dựng từ nguồn riêng đó, không từ lựa chọn hiện tại. Phản hồi đang chờ được giữ và gắn nguồn cũ kể cả khi đã đổi lựa chọn; chỉ timeout/đóng trang mới hủy. Không coi phản hồi cũ là dữ kiện mới. Trang reload bắt đầu hội thoại mới; không có lưu trữ server/tài khoản.

Mặc định không chọn thiết bị. Chọn 3D hoặc danh sách đặt thẻ @ID; bỏ thẻ về toàn nhà máy. Có thể gõ @ ngay trong ô nhập: gợi ý 19 ID/tên thiết bị, tìm không phân biệt hoa thường và dấu tiếng Việt. ↑↓ chọn, Enter/Tab xác nhận, Escape đóng; click dùng được. Chọn gợi ý giữ nguyên phần câu hỏi đang viết và lịch sử, chỉ đổi đích câu hỏi tiếp theo, không tự gọi API hay zoom camera. Câu hỏi/đáp án đã gửi không đổi nhãn.

Zoom khi chọn thiết bị 3D tăng 1,5 lần về kích thước nhìn thấy: khoảng cách cũ chia 1,5 (PV 32,8 → 21,87; loại khác 24,8 → 16,53); minDistance 18 → 12 để không chặn mức zoom mới. Góc tổng quan, FOV và GLB giữ nguyên.

## Ngữ cảnh và sự kiện

`src/lib/analysis.ts` tạo một nguồn nhận định dùng chung cho UI và API. Ngữ cảnh gồm mode, asset, revision, submitted, cấu hình, run ID, mốc đo, tín hiệu/chất lượng/đơn vị, ba mẫu gần nhất, quan hệ, KPI lịch sử và forecast riêng. Dữ liệu GLB, tọa độ, toàn bộ lịch sử không được gửi. Máy chủ chỉ nhận định danh và đầu vào kịch bản rồi tái dựng dữ kiện; không tin MW/MWh hoặc chỉ dẫn từ browser.

Context key vẫn có mode + asset + revision + submitted + cấu hình để xác minh đáp án đúng request gốc. Context đó không còn là khóa phiên chat. API nhận tối đa sáu tin gần nhất, mỗi tin tối đa 2000 ký tự và context đã kiểm tra bằng parseSelection; HISTORY là dữ liệu không đáng tin, có thể thuộc thiết bị/revision cũ trong cùng mode. Client giảm số tin gửi nếu cần để tổng body dưới 19.000 byte UTF-8 (API chặn 20.000 byte), nhưng không cắt lịch sử hiển thị. Model được nhắc không chuyển số liệu từ thiết bị/mode cũ sang nguồn hiện tại.

Quy tắc cập nhật tức thì. Phân tích chủ động theo snapshot/áp dụng, gộp 250ms, mỗi event tối đa một lần; nhãn tự động là Toàn nhà máy. Không gọi khi hover/camera/chọn thiết bị/gõ @. Nếu đang trả lời, chờ xong mới xử lý event mới; chat chủ động của người dùng cho cùng event không tạo thêm phân tích lặp. Mỗi lần chỉ một request; Enter lặp/câu trống không gửi thêm.

## Cấu hình máy chủ

Nhà cung cấp Gemini theo xác nhận của người dùng, API cố định `https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent`, header `x-goog-api-key`, `systemInstruction` và `contents`. Không nhận endpoint từ browser. Khi không đặt GEMINI_MODEL, máy chủ đọc danh sách model được key cấp quyền, chọn Flash ổn định hỗ trợ generateContent (ưu tiên Flash Lite, rồi phiên bản mới hơn). GEMINI_MODEL vẫn có thể chỉ định rõ model. gemini-2.5-flash chỉ còn là fallback nếu chưa khám phá được danh sách; model này đã trả 404 trong thử nghiệm Vercel. Tham chiếu schema chính thức: googleapis/googleapis `google/ai/generativelanguage/v1beta/generative_service.proto`.

| Biến máy chủ   | Yêu cầu                                                                               |
| -------------- | ------------------------------------------------------------------------------------- |
| `Gemini_API`   | Đúng tên secret đã lưu tại Vercel, chỉ ở server; hỗ trợ `GEMINI_API_KEY` làm fallback |
| `GEMINI_MODEL` | Tùy chọn; không đặt thì tự chọn Flash được cấp quyền                                  |
| `AI_ENABLED`   | Không bắt buộc; chỉ đặt `false` khi muốn tạm tắt AI                                   |

Nhập credential qua cấu hình bảo mật của môi trường/Vercel; không gửi khóa qua chat, commit `.env`, log hoặc dùng biến `NEXT_PUBLIC_*`. Không còn yêu cầu mã truy cập từ người xem. Nếu dùng proxy credential cho API key trong cloud, cấu hình đúng domain nhà cung cấp và khởi động Node 24 với `NODE_USE_ENV_PROXY=1` để fetch đi qua proxy/CA hiện có. Không tắt TLS. Vercel cần cấu hình riêng; cloud không tự chuyển secret sang Vercel.

Không sao chép secret Vercel sang cloud. Phiên cloud mới đã truy cập được Vercel; GET /api/ai của bản cũ xác nhận credentialStatus=ready. Không publish hay thay đổi cấu hình cloud trong lần sửa bỏ mã này.

## Giới hạn và lỗi

- API tự bật khi có `Gemini_API` (hoặc `GEMINI_API_KEY`); khách mở trang và hỏi ngay, không cần mã. `AI_ACCESS_CODE` cũ không còn tác dụng. Có thể tạm tắt bằng `AI_ENABLED=false`. GET `/api/ai` trả `available`, `requiresAccessCode=false`, `credentialStatus`, `model`. Khi có key, probe đọc `models?pageSize=100` với timeout 5 giây và cache/gộp 10 phút; không sinh token hoặc lộ key/provider body. `ready` chỉ chứng minh key đọc được danh sách model, chưa chứng minh generation/model được chọn hoạt động.
- POST kiểm tra same-origin theo Host, JSON tối đa 20.000 byte, ngữ cảnh hợp lệ, câu hỏi 1–1200 ký tự, tối đa sáu tin lịch sử × 2000 ký tự. Dữ kiện máy chủ tái dựng; lịch sử và câu hỏi là nội dung không đáng tin trong prompt.
- Giới hạn sáu request/phút và 50 request cho toàn vòng đời mỗi process, tính cả request lỗi. Chống gọi lặp cùng câu hỏi/ngữ cảnh/lịch sử, kể cả in-flight. Không tự retry.
- **Hạn mức trong bộ nhớ không phải ngân sách phân tán:** serverless nhiều instance/cold start có bộ đếm riêng. Cần thiết lập quota thực sự được nhà cung cấp cưỡng chế để chặn chi phí trên toàn project; hạn mức trong process không bảo đảm ngân sách toàn deployment. Cảnh báo ngân sách mềm không thay thế hard quota. Chưa xác minh quota của project Gemini.
- Timeout server 20 giây, client 25 giây; 700 token đầu ra, stream tối đa 32 KiB và câu trả lời tối đa 4000 ký tự. Không chuyển nguyên error body từ provider về browser. Không render HTML/Markdown trả từ model; output là văn bản và có nhãn diễn giải.
- Thiếu cấu hình, quá hạn mức, provider lỗi hoặc timeout đều giữ nhận định theo quy tắc và mô phỏng hoạt động. AI chỉ thay đổi thiết lập của bộ mô phỏng trên tab Mô phỏng, không điều khiển thiết bị thật; vẫn cần đối chiếu số liệu chuẩn và xác minh thực tế.

## Kiểm tra

Từ gốc checkout: `npm run build`, `npm run typecheck`, `CI=1 npm run test:e2e`. Chromium hệ thống và SwiftShader theo config hiện có. `tests/analysis.spec.ts` kiểm tra probe Gemini đọc-only/cache/lỗi, số liệu, định danh, dữ kiện tái dựng, input/quota/dedup/timeout/response lỗi và HTTP boundary. `tests/ai-panel.spec.ts` kiểm tra offline, liên kết thiết bị, apply/reset/mobile, hội thoại fixture đúng nguồn, race mode/asset/config/applied/reset và thử lại sau lỗi.

Fixture provider/browser được gắn nhãn kiểm thử. Để xác nhận API thật sau khi có cấu hình: chạy server với key Gemini, hỏi về INV-03/PV-06/GW-01, áp dụng lỗi toàn bộ 24 giờ, kiểm tra số quá khứ/forecast, đổi ngữ cảnh khi chờ và đối chiếu usage/quota của provider. Chỉ sau request thật thành công mới ghi phần tích hợp đã xác minh. Push main chỉ kích hoạt pipeline đã kết nối, không chứng minh deployment Vercel Ready.
