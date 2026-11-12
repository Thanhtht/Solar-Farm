# Hiệu chỉnh theo ảnh khoanh cụm nhỏ — 12/11/2026

Người dùng xác nhận PV-11 có 7 cụm, PV-12 có 6 cụm, cho phép ước lượng vùng khác theo kích thước. Ảnh khoanh cho thấy cụm là dải hẹp theo chiều sâu, thay cho khối rộng ngang cũ. Hai số này là mốc do người dùng cung cấp, không nhận là đã đếm chính xác tất cả vùng.

## Phương pháp hiện tại

Dùng diện tích đa giác sau phép quy đổi phối cảnh đã có. Diện tích vùng 11 là 71,238 và vùng 12 là 82,762 đơn vị cảnh vuông; tổng 13 cụm trên 154 đơn vị diện tích. Số ước lượng mỗi vùng = làm tròn(diện tích vùng × 13 / 154). Khoảng tham chiếu lấy hai mật độ riêng 7/71,238 và 6/82,762; đây là khoảng nhạy theo hai mốc, không phải khoảng tin cậy thống kê. Diện tích bao gồm khe/đường trống nên không coi là diện tích module đo được hay diện tích mét vuông thật.

Tỷ lệ mỗi cụm khoảng 0,95 × 4 đơn vị cảnh, xoay theo trục hàng hiện hành. Rải lưới trong hệ trục cụm, thử pha/bước để đủ số lượng, không chồng footprint và không vượt đa giác. Hai vùng mốc xếp một hàng 7 và 6 cụm. Không đồng nhất việc khớp số lượng với vị trí thực đã khảo sát: hướng/tọa độ/đường bao vẫn là phác theo ảnh. Cần tiếp tục đối chiếu trực quan khi người dùng có thêm mốc.

| Vùng | Số cụm | Nguồn | Khoảng tham chiếu |
|---|---:|---|---|
| PV-01 | 176 | Ước lượng | 150–205 |
| PV-02 | 215 | Ước lượng | 184–250 |
| PV-03 | 282 | Ước lượng | 241–328 |
| PV-04 | 486 | Ước lượng | 417–566 |
| PV-05 | 361 | Ước lượng | 309–420 |
| PV-06 | 141 | Ước lượng | 120–164 |
| PV-07 | 212 | Ước lượng | 181–247 |
| PV-08 | 200 | Ước lượng | 172–234 |
| PV-09 | 60 | Ước lượng | 51–70 |
| PV-10 | 20 | Ước lượng | 17–24 |
| PV-11 | 7 | Người dùng xác nhận | 7 |
| PV-12 | 6 | Người dùng xác nhận | 6 |
| **Tổng** | **2.166** | Có phần ước lượng | |

Hồ sơ vùng/cụm hiển thị nguồn số lượng. Công suất 50 MWp/40 MW AC vẫn là tổng demo; tỷ lệ vùng và telemetry/lịch sử phân bổ tính lại theo số cụm mới, không thêm công suất do tăng cụm và không cộng trùng.

---

## Lưu vết rà soát trước hiệu chỉnh (bản 1.664 cụm)

## Kết luận hiện tại

Ảnh người dùng cung cấp hiển thị ở kích thước 640×425. Mô hình hiện tại không phải kết quả số hóa từng cụm nhỏ: 12 đường bao được phác tay, `fillField()` rải lưới đều (bước 4,65×2,8), xoay chung −0,14 rad và giữ những footprint lọt trong vùng. Tổng 1.664 là kết quả thuật toán, không phải số đếm từ ảnh. Mã 12 vùng là nhóm giám sát minh họa; không có tài liệu xác nhận đó là ranh giới điện thực tế.

Không dùng bài kiểm tra chiếu ngược→chiếu thuận đang qua làm bằng chứng khớp ảnh: bài đó chỉ kiểm tra phép biến đổi tọa độ và footprint nằm trong chính polygon đã nhập. Nó chưa so đường bao/mỗi cụm nhỏ với nguồn ảnh độc lập.

## Số lượng đang có trong 3D — tất cả chưa xác minh theo ảnh

| Mã vùng | Tên vùng hiện tại | Cụm nhỏ trong 3D | Đối soát với ảnh |
|---|---|---:|---|
| PV-01 | Tây Nam | 131 | Chưa xác minh |
| PV-02 | Nam trung tâm | 162 | Chưa xác minh |
| PV-03 | Tây trung tâm | 222 | Chưa xác minh |
| PV-04 | Đông trung tâm | 397 | Chưa xác minh |
| PV-05 | Đông Bắc | 276 | Chưa xác minh |
| PV-06 | Tây Bắc | 104 | Chưa xác minh |
| PV-07 | Bắc trung tâm | 160 | Chưa xác minh |
| PV-08 | Dải phía Bắc | 159 | Chưa xác minh |
| PV-09 | Đông khu trạm | 37 | Chưa xác minh |
| PV-10 | Cụm Nam tách rời | 11 | Chưa xác minh |
| PV-11 | Cụm phụ Tây Nam | 1 | Chưa xác minh |
| PV-12 | Cụm phụ phía Nam | 4 | Chưa xác minh |

## Những phần phải làm lại

1. Số hóa đường bao các vùng pin có thật trong ảnh, gồm mép lõm, khe giữa vùng, đảo cây trung tâm và ba vùng nhỏ tách rời phía Nam; không mặc định 12 polygon giám sát hiện tại là đường bao chuẩn.
2. Xác định hướng hàng và ranh giới của **cụm nhỏ đúng định nghĩa người dùng đã khoanh**, phân biệt với một tấm module hoặc một dãy/string. Mô hình đang dùng chung một góc xoay/lưới, không có các điểm đặt đối chiếu nguồn ảnh.
3. Thay cách rải tự động bằng danh mục tọa độ/từng cụm hoặc từng hàng có số lượng và nguồn đối chiếu rõ ràng. Kiểm kê từng vùng, không chọn một mật độ lưới để tạo ra một tổng trông hợp lý.
4. Kiểm tra từ camera ảnh: overlay đường bao, hướng hàng, từng vị trí và bảng đếm nguồn→3D. Chỉ ghi “đúng số lượng” khi có nguồn đủ rõ hoặc bảng số lượng được xác nhận.

## Thông tin đang thiếu để đáp ứng yêu cầu chính xác

Ở ảnh 640×425, nhiều cụm phía xa chỉ chiếm vài pixel; ranh giới giữa các cụm nhỏ nối tiếp không hiện rõ. Cần ảnh gốc độ phân giải cao, bản bố trí pin (CAD/PDF/orthophoto), hoặc bảng đếm cụm nhỏ theo vùng. Không dùng ảnh phóng lớn/nội suy/ảnh tạo sinh làm nguồn đếm vì không bổ sung chi tiết thật.

Chưa sửa bố cục hay số lượng trên website bằng một bộ ước lượng mới. Thay số lượng ảnh hưởng ID cụm, rating phân bổ theo số cụm và lịch sử giả định; cần đối soát một lần có nguồn trước khi phát hành thay đổi đó.
