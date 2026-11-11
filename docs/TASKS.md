# Lộ trình và cách giao việc

## Hồng Liêm 3 — mốc dựng hình

Yêu cầu người dùng 11/11/2026: thêm nhà máy Hồng Liêm 3 theo ảnh, tái sử dụng model Sava và dữ liệu giả định. Phạm vi: hình học theo ảnh, điều khiển 3D/chọn vùng, dữ liệu riêng và ba kịch bản; không mở rộng sang lịch sử/AI đa nhà máy. Bàn giao: [HONG_LIEM_3](HONG_LIEM_3.md), bằng chứng tại STATUS.

> Review mới nhất 05/11: dropdown Theo ngày/Khoảng thời gian cùng hàng Phạm vi, bỏ ngày lặp phía dưới. AI Thống kê phân giải tháng/cụm từ câu hỏi trước tổng hợp và ghi đúng nguồn từng tin; tháng chưa đủ dữ liệu phải nói rõ. Giữ bộ tính và cơ sở Thiếu hụt đã chốt. Xem HISTORY_UI và AI.


> Review trước 05/11: module đổi thành Thống kê; hai hàng Theo ngày/Trong khoảng, một ô khoảng ngày đồng bộ preset; sự kiện theo đúng phạm vi ngay dưới chỉ số. AI dùng chung thiết kế với hai module cũ. Người dùng đã chốt giữ cơ sở sản lượng kỳ vọng theo điều kiện từng ngày; card hiển thị “Thiếu hụt” kèm chú thích, không đổi phép tính; xem HISTORY_UI.

> Review bố cục mới nhất 05/11: gom điều khiển/chỉ số/3D vào một khung, AI ở cột phải desktop, nút đổi chỉ số trong cảnh. Ưu tiên mô tả hiện hành ở HISTORY_UI thay yêu cầu full-width trước đó.

> Cập nhật 05/11: mặc định xem từng ngày/toàn tháng với slider sát 3D; tổng hợp khoảng ngày là chế độ riêng. Có trợ lý AI lịch sử độc lập, context do máy chủ dựng lại; xem HISTORY_UI và AI. Phát hiện bất thường vẫn pending.

Làm tuần tự ở giai đoạn đầu. Mỗi task dùng một chat, kết thúc bằng kết quả đã kiểm tra và cập nhật STATUS. Task mới cần checkout chứa kết quả của task trước; không giả định các thay đổi chưa commit sẽ tự chuyển qua chat.

**Trạng thái hiện tại:** T01 và T02 đã được người dùng chấp nhận trong chat; mốc ứng dụng T02 cuối là `82cef18`, gồm các review giao diện, nền Mô phỏng, card chi tiết, chấm điện và suy giảm nhánh 06. T03 đã đạt phần chức năng và kiểm chứng Gemini thật, có rà soát tại [T03_ACCEPTANCE](T03_ACCEPTANCE.md); còn xác minh quota toàn project và chốt nghiệm thu người dùng. T04 chưa triển khai. Bàn giao T03 giữ tại [T03_HANDOFF](T03_HANDOFF.md), không yêu cầu nghiệm thu lại T02 hoặc khôi phục UI cũ. [T02_ACCEPTANCE](T02_ACCEPTANCE.md) ghi checklist/số liệu hiện hành; STATUS giữ lịch sử bằng chứng. Giữ Hiện trạng/Mô phỏng riêng, model/giao diện đã chốt, người xem chính là giám đốc nhà máy/đội vận hành. Không mở T04/T05 trước phạm vi được giao; T05/kiểm chứng deployment toàn demo vẫn riêng với việc chấp nhận T02.

## Module Hiệu suất — lịch sử theo ngày

Yêu cầu mới được người dùng cho phép triển khai sau khảo sát BD. Đặc tả: [PERFORMANCE_HISTORY](PERFORMANCE_HISTORY.md); bộ dữ liệu/phép tính và mẫu số: [HISTORY_DATA](HISTORY_DATA.md).

1. **Mốc 1: dữ liệu/phép tính đã triển khai.** Một tháng trước hôm nay, seed cố định theo ngày/cụm, môi trường ngày đêm và các tình huống; khóa hôm nay/tương lai ở truy vấn; tổng hợp MWh AC, actual/expected có trọng số và coverage. Kiểm tra qua script `npm run test:history`.
2. **Mốc 2: giao diện đã triển khai.** Module thứ ba ngang hàng Hiện trạng/Mô phỏng, heatmap hai chỉ số, timeline ngày, chọn khoảng tự do/preset, KPI/chart/chi tiết đồng bộ. Không thay nguồn dữ liệu hai module cũ. Cách dùng tại [HISTORY_UI](HISTORY_UI.md).
3. **Mốc 3: so sánh kỳ đã triển khai, bằng chứng tại STATUS.** Kỳ liền trước/tùy chọn, cùng ngữ cảnh cụm/ngày; không cắt kỳ vượt cửa sổ, bình quân theo số ngày, không suy diễn % thay đổi sản lượng khi thiếu dữ liệu. Kiểm tra tương tác/responsive/3D và hồi quy; không tự mở rộng kho dữ liệu hoặc AI lịch sử.

Phát hiện bất thường **PENDING**, giữ backlog, không phải điều kiện chặn. T05/các phần ngoài phạm vi hiện có giữ nguyên.

## T00 — Định hướng và bàn giao

- Tạo PRODUCT, DESIGN, STATUS, TASKS và AGENTS.
- Ghi rõ giả định, phạm vi và tiêu chí nghiệm thu.
- Không bao gồm khởi tạo ứng dụng.

## T01 — Khởi tạo và giao diện tổng quan

**Trạng thái:** hoàn thành và được người dùng chấp nhận ngày 03/11/2026. Các review GLB/giao diện/điều hướng/dấu chọn được bàn giao trong STATUS.

**Đầu vào:** tài liệu T00.

- Khởi tạo Next.js + TypeScript + Tailwind trong repo hiện tại, bảo toàn tài liệu có sẵn. Chọn các phiên bản ổn định tương thích và commit lockfile.
- Tạo cấu trúc mã nguồn dễ tách mô phỏng, dữ liệu và giao diện; dùng một fixture nhà máy dùng chung.
- Tạo registry thiết bị/cảm biến và quan hệ ổn định theo IOT; có đối tượng đại diện cho cụm pin, inverter, máy biến áp, trạm thời tiết và gateway. Dựng hồ sơ theo loại, cây thiết bị và thao tác từ cảnh báo tới thiết bị bằng fixture; ghi rõ chưa có luồng IoT thật.
- Dựng màn hình tổng quan theo DESIGN: bốn chỉ số, cảnh nhà máy 3D thực (Three.js / React Three Fiber / Drei), biểu đồ mẫu, bảng chi tiết và 3 thẻ preset. Dựng cả màn hình tự cấu hình cạnh cảnh 3D; tham số ở T01 là fixture, chưa được báo đã mô phỏng.
- Có thể xoay/zoom, trở về tổng quan, chọn cụm thiết bị trong 3D và xem dữ liệu fixture. Xử lý trạng thái tải/lỗi WebGL; không coi hình 2D dự phòng là đã đáp ứng yêu cầu 3D. Ghi rõ phần nào chưa được triển khai; không tạo nút chính giả hoạt động.
- Không tích hợp AI API hoặc tính toán mô phỏng đầy đủ ở task này.
- Chạy thử cảnh WebGL trong trình duyệt nếu có công cụ; kiểm tra xoay/zoom, chọn thiết bị, camera tổng quan và bố cục của màn hình tự cấu hình. Không báo đã kiểm chứng cảnh 3D nếu chỉ build thành công.

**Hoàn thành khi:** ứng dụng chạy được; trang và chọn thiết bị được kiểm tra; build/kiểm tra kiểu thành công; lưu lệnh thật vào README/AGENTS; báo giới hạn kiểm tra responsive nếu chưa có browser.

## T02 — Dữ liệu thiết bị và bộ mô phỏng

**Trạng thái:** hoàn thành và được người dùng chấp nhận sau mốc ứng dụng `82cef18`; 33/33 test qua. Xem [nghiệm thu hiện hành](T02_ACCEPTANCE.md). Các mục T02 bên dưới lưu phạm vi triển khai gốc/core; không dùng để mở lại UI phát lại/nâng cao đã bỏ.

**Phụ thuộc:** T01.

- Hoàn thiện cấu hình nhà máy và đơn vị từ fixture dùng chung ở T01; tổng công suất DC khớp 50 MWp, công suất AC có giới hạn được giải thích. ID và cấu trúc đối tượng tuân thủ PRODUCT.
- Tạo đường cơ sở, bước thời gian, trạng thái chạy/dừng/đặt lại và 3 preset cùng màn hình tự cấu hình trong PRODUCT. Bộ ba mây che, bám bụi, lỗi inverter đã được người dùng xác nhận; không hỏi lại.
- Tất cả chỉ số, biểu đồ, trạng thái thiết bị, hiệu ứng trong cảnh 3D và cảnh báo lấy từ cùng kết quả mô phỏng. Tham số chỉnh trên màn hình tự cấu hình cập nhật bản xem thử ngay, không cần chuyển màn hình hoặc gọi AI.
- Lưu giả định/công thức vào `docs/SIMULATION.md`; không tuyên bố mô hình đã kiểm định.
- Test tính xác định, giới hạn đầu vào/công suất, tổng hợp thiết bị, chuyển MW sang MWh và đặt lại.
- Thực hiện AC-12–AC-15 ở mốc tương ứng; bản xem thử phân biệt với phát lại, năng lượng dự kiến toàn kỳ phân biệt với tích lũy. Đo thời gian phản hồi khi chỉnh tham số thay vì chỉ khẳng định cập nhật tức thì.
- Sinh telemetry, chất lượng dữ liệu và cảnh báo theo IOT từ cùng bộ mô phỏng; kiểm tra phân biệt mất kết nối với lỗi vận hành. Không cài broker hay yêu cầu cảm biến thật.
- Bổ sung so sánh phương án vệ sinh/khôi phục theo PRODUCT; đầu vào can thiệp là giả định, không thêm preset thứ tư. Kiểm tra cùng thời đoạn, seed, giới hạn phục hồi và tính MWh chênh lệch.

Để giữ mỗi chat có phạm vi vừa phải, chia T02 thành ba task nối tiếp:

| Task | Phạm vi                                                                          | Bằng chứng cần có                                                                                                       |
| ---- | -------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------- |
| T02A | Bộ mô phỏng điều kiện nền và IoT, thời gian, dữ liệu thiết bị/quan hệ/chất lượng | Test tín hiệu và tổng hợp, fixture stale/thiếu, hồ sơ thiết bị nhận đúng dữ liệu; chưa tuyên bố ba kịch bản đã hoàn tất |
| T02B | Ba preset, tự cấu hình, bản xem thử và diễn biến 3D                              | Test phép tính/trạng thái; kiểm tra phản hồi tham số và đồng bộ cảnh/chi tiết/biểu đồ                                   |
| T02C | Phương án xử lý và đối chiếu kết quả                                             | Test so sánh cùng thời đoạn, năng lượng có thể thu hồi và thao tác chuyển lớp xem trong 3D                              |

Bắt đầu bằng [bàn giao T02A](T02A_HANDOFF.md), gồm phạm vi, tiêu chí và prompt cho chat tiếp theo. T02A/T02B/T02C đã triển khai; xem SIMULATION và STATUS.

Hoàn thành từng task phải cập nhật STATUS trước khi mở chat tiếp theo. T03 dùng kết quả của cả T02A–T02C.

**Hoàn thành khi:** người dùng chạy được 3 preset và tùy chỉnh tham số, thấy tác động hợp lý ngay trong 3D; test mô phỏng và build thành công; kiểm tra thao tác chạy/dừng/đặt lại, thay tham số và vô hiệu hóa dữ liệu/AI của revision cũ.

## T03 — Phân tích và AI

**Trạng thái:** đạt phần chức năng và kiểm chứng tích hợp: quy tắc, hội thoại theo nguồn, phân tích chủ động, hai phiên theo mode, @/camera và native Gemini thiết lập mô phỏng. Đã kiểm chứng generation và action thật trên Vercel. Còn xác minh quota/chi phí toàn project và người dùng chốt nghiệm thu; không tự ghi đã sẵn sàng phát hành rộng rãi. Xem [T03_ACCEPTANCE](T03_ACCEPTANCE.md), [AI](AI.md) và [STATUS](STATUS.md).

**Phụ thuộc:** T02.

- Thêm nhận định theo quy tắc từ kết quả mô phỏng với dẫn chứng định lượng.
- Thực hiện cả hội thoại theo thiết bị đang hỏi và phân tích chủ động khi có snapshot/áp dụng kết quả. UI hiện không phát lại; dùng `submitted` và revision, không chờ `phase=complete` hoặc phục hồi UI playback. Gắn ảnh chụp dữ liệu, chất lượng và revision; thử lỗi/đổi thiết bị/đổi lượt khi đang chờ phản hồi.
- Thẻ chủ động dẫn tới thiết bị hoặc phương án mô phỏng. Chống gọi API lặp, gộp sự kiện và giới hạn ngân sách máy chủ; không gọi khi chỉ kéo thanh tham số.
- Thêm API máy chủ cho nhà cung cấp AI phù hợp khi xác định được khả năng và cấu hình sẵn có. Kiểm tra tên biến/binding trước khi yêu cầu thêm khóa; không yêu cầu gửi giá trị secret trong chat.
- Giới hạn ngữ cảnh, độ dài yêu cầu, timeout và số lần gọi phù hợp cho demo chia sẻ công khai.
- Phân biệt chế độ quy tắc/API; xử lý thiếu cấu hình, lỗi và quá hạn.

**Hoàn thành khi:** số liệu phân tích khớp mô phỏng; chế độ không API hoạt động; đường lỗi được kiểm tra. Chỉ ghi tích hợp AI đã xác minh khi có yêu cầu API thật thành công, nếu thiếu credential phải ghi rõ còn chặn phần đó.

Bản gửi khách yêu cầu AI API thật đã kiểm chứng; không xem chế độ quy tắc là hoàn thành toàn bộ T03. T04/T05 chưa triển khai; T03 không còn bị chặn bởi thiếu cấu hình Gemini.

## T04 — Luồng trình diễn và hoàn thiện

**Điều chỉnh hiện hành:** người dùng để pending phần hướng dẫn ba phút, bỏ liên hệ và quota/chi phí Gemini khỏi phạm vi hiện tại, yêu cầu chuyển T05. Không coi T04 đã hoàn tất; các kiểm tra trải nghiệm còn lại được theo dõi khi bàn giao.

**Phụ thuộc:** T02; tích hợp T03 nếu đã có.

- Tạo trải nghiệm hướng dẫn khoảng 3 phút; có bỏ qua, thoát và đặt lại.
- Hoàn thiện responsive, bàn phím, giảm chuyển động và thông báo lỗi.
- Chuẩn bị phần liên hệ; dùng thông tin thật khi được cung cấp, không giả gửi form.
- Kiểm tra toàn bộ câu chuyện chính, giao diện các kích thước và chế độ AI có/không cấu hình.

**Hoàn thành khi:** luồng demo hoạt động, kiểm tra tương tác chính và build qua; các thiếu sót liên hệ/AI được nêu rõ.

## T05 — Triển khai và bàn giao demo

**Phạm vi hiện hành (thay mô tả gốc bên dưới):** theo [T05_HANDOFF](T05_HANDOFF.md), đã triển khai các sửa UX có bằng chứng, kiểm tra Mobile/Tablet, bàn phím, giảm chuyển động và luồng/lỗi 3D/AI/mô phỏng cục bộ. Ma trận và checklist tại [T05_ACCEPTANCE](T05_ACCEPTANCE.md); kiểm tra URL Vercel mới còn bị proxy 403 trong phiên này. Hướng dẫn ba phút pending; không làm liên hệ hoặc quota/chi phí Gemini, không hỏi lại hoặc coi các mục này là blocker. Giữ guard API hiện có, không redesign UI, không publish cloud. T05 chưa hoàn tất.

**Phụ thuộc:** T04; T03 hoàn thành để bàn giao bản gửi khách có AI; người dùng yêu cầu triển khai và có quyền truy cập dịch vụ.

- Kiểm tra tài khoản/dự án triển khai hiện có; chuẩn bị cấu hình, secret và mức sử dụng AI phù hợp.
- Triển khai lên Vercel hoặc dịch vụ được người dùng chọn; không đặt secret phía trình duyệt.
- Kiểm tra URL HTTPS công khai, tài nguyên, mô phỏng, lỗi AI và liên hệ.
- Lưu hướng dẫn chạy, cấu hình và triển khai; hoàn thiện cấu hình cloud tái sử dụng nếu công cụ hỗ trợ.

**Hoàn thành khi:** có URL thật được kiểm tra và báo rõ giới hạn; không xem một bản build cục bộ là đã triển khai.

## Mẫu mở chat

Dùng prompt T05 ở cuối [T05_HANDOFF](T05_HANDOFF.md), thay mẫu T03 cũ.

## Mẫu kết thúc chat

```text
Cập nhật docs/STATUS.md theo kết quả thực tế: đã làm, kiểm tra đã chạy,
giới hạn và task tiếp theo. Ghi quyết định mới vào tài liệu liên quan.
Tạo commit đúng phạm vi và cung cấp mã commit cùng hướng dẫn mở chat tiếp theo.
Nêu rõ commit mới đang ở máy cục bộ hay đã được push/merge.
```

## Chuyển kết quả sang chat mới

- Trong cùng checkout: kiểm tra commit và file có sẵn trước khi tiếp tục.
- Nếu chat mới dùng máy hoặc nhánh khác: kết quả cần được đưa lên nhánh remote/merge PR theo yêu cầu của người dùng rồi chọn đúng nhánh đó. Commit cục bộ chưa push không tự bảo đảm có mặt ở máy mới.
- Nếu nền tảng yêu cầu nhánh gốc có commit trước khi tạo task, cần push commit nền đầu tiên. Không đổi repo/nhánh hoặc ghi đè lịch sử chỉ để vượt lỗi khởi tạo.
