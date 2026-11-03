# T02A — Điều kiện nền và IoT mô phỏng

## Tách Hiện trạng và Mô phỏng — quyết định review

Hai tab chính **Hiện trạng** và **Mô phỏng** có dữ liệu và lựa chọn thiết bị riêng; mặc định mở Hiện trạng. Hiện trạng dùng snapshot mẫu cố định, không phải kết nối nhà máy thật. Toàn bộ KPI, hồ sơ, biểu đồ, thời tiết và cảnh báo đọc snapshot của tab đang xem. Chạy/tạm dừng/đặt lại hoặc thay tham số mô phỏng không ghi vào hiện trạng. Chuyển về Hiện trạng tạm dừng lượt mô phỏng; quay lại giữ kết quả, tham số và thiết bị để chủ động chạy tiếp. Không tự reset lượt khi đổi tab.

Thẻ kịch bản, tự cấu hình và điều khiển phát lại chỉ có trong tab Mô phỏng. Hai lựa chọn “Kịch bản có sẵn” và “Tự cấu hình” là chế độ con bên trong tab này. Cảnh/model và thao tác camera được giữ; không remount cảnh khi đổi dữ liệu. T02A vẫn chỉ tính điều kiện nền, tác động ba kịch bản thuộc T02B; so sánh và AI chưa triển khai. Quyết định này thay thế bố cục trộn theo dõi và mô phỏng trước review.

## Cấu hình và nguồn dữ liệu

`src/data/plant.ts` giữ registry 19 ID/quan hệ/vị trí T01. `src/lib/simulation.ts` chứa cấu hình nền, bộ sinh snapshot và reducer phát lại thuần. Dashboard giữ snapshot hiện trạng riêng và một Run mô phỏng riêng; KPI, thời tiết, hồ sơ, cảnh báo và Equipment 3D nhận snapshot của tab đang xem. Camera tiếp tục dùng ID/vị trí registry, không phụ thuộc revision. Không sửa GLB, bố trí, vật liệu hay logo.

Điều kiện nền hằng, seed 1 (không dùng bộ số ngẫu nhiên): bức xạ 780 W/m², môi trường 31 °C, gió 2,4 m/s. Mốc bắt đầu 02/11/2026 10:30 ICT; mỗi bước 60 giây mô phỏng, phát lại một bước mỗi giây thực. Lượt ban đầu tạm dừng; chỉ có một mẫu đã nhận, năng lượng 0. Pause không cập nhật thời gian/chất lượng/năng lượng. Reset tạo ID và revision mới trong phiên, xóa lịch sử và trả về nền tạm dừng; giữ hai fixture nhiệt như điều kiện ban đầu. Không có dữ liệu tương lai. ID lượt có phạm vi phiên trình duyệt, chưa lưu trên máy chủ.

## Công thức và đơn vị

Tám cụm, mỗi cụm 6,25 MWp DC cấp một inverter giới hạn 5 MW AC. Pdc = 6,25 × (780/1000) × (12/13) = 4,5 MW. Hệ số DC 12/13 là hệ số hiệu chỉnh minh họa để giữ fixture T01, chưa phải mô hình hiệu suất được kiểm định. Vdc = 1000 V; Idc = Pdc × 10⁶ / Vdc = 4500 A ở mạch tương đương. Pac = min(5 MW, Pdc × 0,96) = 4,32 MW. Tổng DC 36 MW, AC 34,56 MW; giới hạn AC nhà máy 40 MW. Trạm thu gom dùng tổng inverter, không cộng lần nữa.

Năng lượng theo mô hình: E[k+1] = E[k] + (P[k] + P[k+1])/2 × 60/3600 MWh (hình thang). 60 bước nền cho 34,56 MWh; pause không tích phân. Khả dụng là tỷ lệ inverter vận hành theo mô hình, độc lập heartbeat; cảnh báo nhiệt không trừ công suất/khả dụng. Tổn thất nền là 0; chưa tính kịch bản hoặc phương án xử lý.

## Chất lượng và vận hành

Mỗi tín hiệu có asset ID, snapshot ID/revision, thời điểm mẫu, chu kỳ và history; cùng lượt nhận một mẫu cho mỗi bước. Bốn chất lượng: valid, stale, invalid, missing. Quá 120 giây mô phỏng mới stale (đúng 120 vẫn hợp lệ); null là missing; số không hữu hạn hoặc cờ invalid là invalid. Không lấy giờ máy để làm stale. Lịch sử không dùng được ghi null, biểu đồ không nối qua khoảng thiếu và không đổi thiếu thành 0. Giá trị cũ vẫn có thể hiển thị cùng chất lượng/thời điểm, giá trị invalid hiển thị —.

Nếu bất kỳ công suất inverter nào không hợp lệ, tổng AC và tín hiệu tổng trạm là null, KPI hiển thị — cùng số inverter thiếu. Năng lượng/khả dụng ghi rõ theo mô hình, không giả là tổng đo đầy đủ. Heartbeat và connection là trường riêng, không suy ra lỗi vận hành từ quality. Fixture nội bộ `generate(..., fixtures)` cho stale/missing/invalid, offline và inverter lỗi nhưng online phục vụ test; không có preset thứ tư hoặc UI cấu hình mạng. Fixture lỗi không phải mô hình kịch bản T02B.

Nhiệt độ INV-03 = 78 °C, PV-06 = 58 °C giữ từ review T01. Ngưỡng cấu hình: inverter ≥70 đỏ, PV ≥55 vàng; attention lấy tín hiệu nhiệt hợp lệ cùng snapshot. Không đổi màu model. Những nhiệt độ khác giữ fixture registry; chưa mô hình hóa nhiệt động lực.

## Giới hạn

Mô hình điều kiện nền hằng phục vụ minh họa và kiểm tra hạ tầng thời gian/dữ liệu, không dự báo sản lượng thực. Ba thẻ và tự cấu hình vẫn là lớp minh họa T01; nút chạy kịch bản chưa bật. T02B/T02C, AI, giao thức IoT thật, dữ liệu lưu máy chủ và nghiệm thu GPU thiết bị thật chưa thuộc mốc này.

## Phạm vi lớp minh họa sau review

Mây phủ PV-01, PV-02, PV-05 và PV-06 (bốn cụm phía trái theo bố trí x âm). Phạm vi mây cố định ở lớp minh họa hiện tại. Bụi chỉ đổi màu/độ nhám vật liệu mặt pin của cụm liên kết với inverter mục tiêu và thêm nhãn; không đổi số đo hoặc KPI. Những hiệu ứng này không thay thế mô hình tác động T02B.

## Trạng thái xem thử theo kịch bản

`scenarioAssets` gắn annotation `preview` vào bản hiển thị, không ghi đè `operation`, attention nhiệt, kết nối hoặc signals của snapshot nền. `assetStatus` thống nhất màu mức độ và nhãn cho viền, hover, HUD, dialog và danh sách chú ý. Ưu tiên mức đỏ nếu cảnh báo nhiệt hoặc kịch bản có mức đỏ. Mây gắn annotation vào bốn PV trái, bụi vào PV/inverter mục tiêu, lỗi vào inverter và PV liên quan; mức mây/bụi 0 gỡ annotation. Hồ sơ ghi “xem thử”, trạng thái nền và giới hạn số đo. Đây chưa phải tính công suất/khả dụng theo sự cố T02B.
