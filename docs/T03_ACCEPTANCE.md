# Rà soát T03 — Phân tích và AI

> **Phạm vi mới nhất:** tiếp tục theo [T05_HANDOFF](T05_HANDOFF.md). Hướng dẫn ba phút pending; phần liên hệ và quota/chi phí Gemini không thuộc đợt hiện tại, không hỏi lại hoặc coi là blocker. Giữ các guard API đã có. Các ghi chép cũ về phần này là lịch sử/giới hạn chưa xác minh, không phải yêu cầu triển khai mới.


Rà soát ngày 04/11/2026 trên main tại `03450df`. Yêu cầu mới trong AI.md/STATUS được ưu tiên hơn mô tả lịch sử của T03_HANDOFF.

## Kết luận

**Đạt phần chức năng và kiểm chứng tích hợp T03; có thể chuyển sang T04 về mặt kỹ thuật.** Chưa đánh dấu đã nghiệm thu toàn bộ demo hoặc đã sẵn sàng phát hành rộng rãi. Người dùng chưa chốt nghiệm thu T03 chính thức; quota/giới hạn chi phí toàn project Gemini chưa được xác minh.

## Đối chiếu tiêu chí

| Hạng mục | Kết quả và bằng chứng |
| --- | --- |
| AC-07: phân tích tổn thất/vùng ảnh hưởng | Dùng snapshot máy chủ và bộ tính T02; tách tổn thất lịch sử 1,0944 MWh với dự kiến phát sinh thêm; không cộng đôi PV/inverter/trạm. Kiểm tra trong analysis.spec.ts và assistant-actions.spec.ts. |
| AC-08: thiếu cấu hình, lỗi, phản hồi đến muộn | Quy tắc/mô phỏng vẫn dùng được; thử lỗi provider, timeout, giới hạn request, source/revision đổi khi đang chờ. Browser không kẹt loading, action cũ không ghi đè thiết lập mới. |
| AC-19: phân tích chủ động | Phân tích sau snapshot/áp dụng, gộp 250ms và đánh dấu event; không gọi do hover/camera/chọn thiết bị/đổi tham số. Có liên kết thiết bị trong nhận định theo quy tắc. |
| AC-20: đúng thiết bị và nguồn | Mỗi tin giữ context lúc gửi; hai hội thoại riêng theo Hiện trạng/Mô phỏng, bản nháp/trạng thái chờ riêng. Đã kiểm tra INV-04 bình thường trước khi giải thích INV-03 dừng; không gọi INV-06 suy giảm nhẹ là bình thường trong guard. |
| Gemini thật | STATUS lưu request generation thật trên Vercel, model gemini-3.5-flash-lite, không mã truy cập. GET /api/ai trong lần rà soát này: available=true, credentialStatus=ready; GET không được coi là bằng chứng generation mới. |
| AI thiết lập mô phỏng theo review mới | Native set_simulation/reset_simulation chỉ trên Mô phỏng; kiểm tra tham số cả server/browser. Đã kiểm chứng thật preview/apply/reset và đúng câu “nếu 4 inverter bị hỏng thì sao”: UI chọn fault/4 cụm/1 giờ, hiển thị mất thêm 12,96 MWh. Phép thử UI build kết nối API Vercel qua fetch Node, không dùng response fixture. |
| Điều hướng và chat | @ có suggest ID/tên, chọn là zoom ngay; câu hỏi/đáp án Hiện trạng có thể focus thiết bị. Enter gửi, Shift+Enter xuống dòng, IME không gửi nhầm; phân biệt người/AI, giữ lịch sử và giới hạn body UTF-8. |
| Khóa và giới hạn demo | Key chỉ ở server; input/body/history/output có giới hạn, timeout server/client, dedup/cache, sáu request/phút và 50 request/vòng đời process. Giới hạn process không phải hạn mức toàn project. |

## Kiểm tra trong lần rà soát

- Đã chạy lại **25/25 bài T03, tất cả qua trong 1,5 phút**: analysis, ai-panel, assistant-actions, assistant-ui. Các fixture kiểm thử API không được coi là request Gemini thật.
- Main hiện tại đã build/typecheck qua ở lần cập nhật theme; 13 bài chat/KPI/mô phỏng và bài bố cục desktop/mobile qua. Không sửa code ứng dụng trong đợt rà soát này.
- Không sinh request trả phí mới trong đợt rà soát; dùng bằng chứng generation thật đã lưu và kiểm tra capability GET hiện tại. Không đọc/gửi lịch sử khách hàng hoặc giá trị secret.

## Điểm còn mở

1. **Chi phí khi chia sẻ rộng:** xác minh và cấu hình quota thực sự được nhà cung cấp cưỡng chế cho project Gemini. Bộ đếm trong RAM mất khi cold start và không dùng chung giữa các instance. Không đánh dấu mục này đã xong từ giới hạn process hoặc thông báo ngân sách mềm.
2. **Nghiệm thu người dùng:** người dùng quyết định chốt kết quả T03; báo cáo này là rà soát kỹ thuật, không tự ghi người dùng đã chấp nhận.

## T04 sẽ thực hiện

Theo TASKS/PRODUCT: luồng hướng dẫn khoảng ba phút, có bỏ qua/thoát/đặt lại; hoàn thiện responsive, bàn phím, giảm chuyển động, lỗi WebGL/AI và kiểm tra trải nghiệm xuyên suốt. Dùng các phần hiện có để kể câu chuyện: tổng quan → thiết bị bất thường → hỏi AI → chạy kịch bản → xem ảnh hưởng → trở về tự khám phá.

Chuẩn bị phần liên hệ bằng thông tin thật khi được cung cấp (PRODUCT hiện ghi chưa có thông tin liên hệ chính thức); không dựng form giả gửi thành công. T04 không bao gồm đợt thiết kế lại giao diện mà người dùng đã để sau. Chưa triển khai T04/T05 hoặc publish cấu hình cloud trong đợt rà soát này.
