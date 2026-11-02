# Lộ trình và cách giao việc

Làm tuần tự ở giai đoạn đầu. Mỗi task dùng một chat, kết thúc bằng kết quả đã kiểm tra và cập nhật STATUS. Task mới cần checkout chứa kết quả của task trước; không giả định các thay đổi chưa commit sẽ tự chuyển qua chat.

**Trạng thái hiện tại:** đang review bản sản phẩm 0.2, xem `PRODUCT_REVIEW.md` và STATUS. Các mốc dưới đây là lộ trình dự kiến; cần đồng bộ khi chốt người xem ưu tiên, điểm nhấn và mức cấu hình kịch bản. Chưa bắt đầu T01.

## T00 — Định hướng và bàn giao

- Tạo PRODUCT, DESIGN, STATUS, TASKS và AGENTS.
- Ghi rõ giả định, phạm vi và tiêu chí nghiệm thu.
- Không bao gồm khởi tạo ứng dụng.

## T01 — Khởi tạo và giao diện tổng quan

**Đầu vào:** tài liệu T00.

- Khởi tạo Next.js + TypeScript + Tailwind trong repo hiện tại, bảo toàn tài liệu có sẵn. Chọn các phiên bản ổn định tương thích và commit lockfile.
- Tạo cấu trúc mã nguồn dễ tách mô phỏng, dữ liệu và giao diện; dùng một fixture nhà máy dùng chung.
- Dựng màn hình tổng quan theo DESIGN: bốn chỉ số, nhà máy SVG 2.5D, biểu đồ mẫu, bảng chi tiết và khu kịch bản.
- Có thể chọn cụm thiết bị và xem dữ liệu fixture. Ghi rõ phần nào chưa được triển khai; không tạo nút chính giả hoạt động.
- Không tích hợp AI API hoặc tính toán mô phỏng đầy đủ ở task này.

**Hoàn thành khi:** ứng dụng chạy được; trang và chọn thiết bị được kiểm tra; build/kiểm tra kiểu thành công; lưu lệnh thật vào README/AGENTS; báo giới hạn kiểm tra responsive nếu chưa có browser.

## T02 — Dữ liệu thiết bị và bộ mô phỏng

**Phụ thuộc:** T01.

- Hoàn thiện cấu hình nhà máy và đơn vị từ fixture dùng chung ở T01; tổng công suất DC khớp 50 MWp, công suất AC có giới hạn được giải thích. ID và cấu trúc đối tượng tuân thủ PRODUCT.
- Tạo đường cơ sở, bước thời gian, trạng thái chạy/dừng/đặt lại và bốn kịch bản trong PRODUCT.
- Tất cả chỉ số, biểu đồ, trạng thái thiết bị và cảnh báo lấy từ cùng kết quả mô phỏng.
- Lưu giả định/công thức vào `docs/SIMULATION.md`; không tuyên bố mô hình đã kiểm định.
- Test tính xác định, giới hạn đầu vào/công suất, tổng hợp thiết bị, chuyển MW sang MWh và đặt lại.

**Hoàn thành khi:** người dùng chạy được bốn kịch bản với tác động hợp lý; test mô phỏng và build thành công; kiểm tra thao tác chạy/dừng/đặt lại.

## T03 — Phân tích và AI

**Phụ thuộc:** T02.

- Thêm nhận định theo quy tắc từ kết quả mô phỏng với dẫn chứng định lượng.
- Thêm API máy chủ cho nhà cung cấp AI phù hợp khi xác định được khả năng và cấu hình sẵn có. Kiểm tra tên biến/binding trước khi yêu cầu thêm khóa; không yêu cầu gửi giá trị secret trong chat.
- Giới hạn ngữ cảnh, độ dài yêu cầu, timeout và số lần gọi phù hợp cho demo chia sẻ công khai.
- Phân biệt chế độ quy tắc/API; xử lý thiếu cấu hình, lỗi và quá hạn.

**Hoàn thành khi:** số liệu phân tích khớp mô phỏng; chế độ không API hoạt động; đường lỗi được kiểm tra. Chỉ ghi tích hợp AI đã xác minh khi có yêu cầu API thật thành công, nếu thiếu credential phải ghi rõ còn chặn phần đó.

Bản gửi khách yêu cầu AI API thật đã kiểm chứng; không xem chế độ quy tắc là hoàn thành toàn bộ T03. Có thể tiếp tục T04 trong khi chờ cấu hình, nhưng phải giữ mục AI chưa hoàn thành trong STATUS.

## T04 — Luồng trình diễn và hoàn thiện

**Phụ thuộc:** T02; tích hợp T03 nếu đã có.

- Tạo trải nghiệm hướng dẫn khoảng 3 phút; có bỏ qua, thoát và đặt lại.
- Hoàn thiện responsive, bàn phím, giảm chuyển động và thông báo lỗi.
- Chuẩn bị phần liên hệ; dùng thông tin thật khi được cung cấp, không giả gửi form.
- Kiểm tra toàn bộ câu chuyện chính, giao diện các kích thước và chế độ AI có/không cấu hình.

**Hoàn thành khi:** luồng demo hoạt động, kiểm tra tương tác chính và build qua; các thiếu sót liên hệ/AI được nêu rõ.

## T05 — Triển khai và bàn giao demo

**Phụ thuộc:** T04; T03 hoàn thành để bàn giao bản gửi khách có AI; người dùng yêu cầu triển khai và có quyền truy cập dịch vụ.

- Kiểm tra tài khoản/dự án triển khai hiện có; chuẩn bị cấu hình, secret và mức sử dụng AI phù hợp.
- Triển khai lên Vercel hoặc dịch vụ được người dùng chọn; không đặt secret phía trình duyệt.
- Kiểm tra URL HTTPS công khai, tài nguyên, mô phỏng, lỗi AI và liên hệ.
- Lưu hướng dẫn chạy, cấu hình và triển khai; hoàn thiện cấu hình cloud tái sử dụng nếu công cụ hỗ trợ.

**Hoàn thành khi:** có URL thật được kiểm tra và báo rõ giới hạn; không xem một bản build cục bộ là đã triển khai.

## Mẫu mở chat

```text
Tiếp tục dự án Solar-Farm trong checkout hiện tại.
Đọc AGENTS.md, docs/PRODUCT.md, docs/DESIGN.md và docs/STATUS.md.
Thực hiện T01 trong docs/TASKS.md. [Đổi mã task ở các lần sau.]
Kiểm tra code và git status trước khi sửa, bảo toàn thay đổi có sẵn.
Hoàn thành task, chạy kiểm tra phù hợp, cập nhật tài liệu bàn giao và tạo commit.
Không tự mở rộng sang task kế tiếp hoặc triển khai công khai.
```

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
