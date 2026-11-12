# Bình Nguyên — bổ sung nhà máy thứ ba

## Nguồn và mức độ tin cậy

Người dùng cung cấp một ảnh toàn cảnh 600×400 và ảnh vệ tinh khoảng 665×600. Lấy ảnh vệ tinh làm mốc mặt bằng: khu Bắc có phần lõm phía Đông Bắc, khu Nam dạng ngũ giác với biên chéo Đông Nam, dải cây ở giữa, đường Bắc–Nam nối hai khu. 12 vùng hiển thị (7 Bắc, 5 Nam) là nhóm giám sát minh họa, không phải xác nhận số inverter/thông số đấu nối thật.

`binh-nguyen-layout.ts` quy đổi pixel theo một hệ tọa độ cảnh đồng nhất (0,32 đơn vị/pixel); không coi là tỷ lệ mét thực. Phác polygon từng vùng, xếp 1.089 cụm nhỏ theo lưới: 72/132/48/66/132/135/113/61/98/92/97/43. Số cụm và kích thước đều ước lượng, chưa có bảng đếm, bản vẽ hay GCP. Không chuyển các mốc đếm 7/6 của Hồng Liêm 3 sang Bình Nguyên. Hồ sơ vùng và cụm ghi nguồn này.

50 MWp DC / 40 MW AC là cấu hình giả định phục vụ demo; chưa được kiểm chứng từ hồ sơ nhà máy. Hai vùng sân và nhà điều hành/trạm phía Bắc, nhà phụ phía Nam, cây/hàng rào/đường được dựng từ model Sava. Tuyến AC chạy trên đồ thị đường nội bộ nối hai khu, DC tới inverter đại diện; không nhận là sơ đồ cáp thực tế.

## Dùng chung giao diện, tách dữ liệu

Route `/plants/binh-nguyen` dùng cùng Dashboard, ba module Hiện trạng/Mô phỏng/Thống kê, KPI/modal, HUD/hồ sơ, danh sách phân trang/tìm kiếm đến cụm nhỏ, AI/@/focus và cấu hình/native actions đã tối ưu. Danh sách ngoài thêm thẻ thứ ba, giữ Sava/Hồng Liêm 3 trước.

`site-layout.ts` cấp cấu hình cảnh và danh mục cụm theo plantId; renderer cảnh dùng chung thay vì sao chép dashboard. Sau review chân đỡ, toàn bộ cụm Bình Nguyên có khung nhẹ sáu chân/bốn thanh luôn hiện, không bật/tắt theo ngưỡng khoảng cách hoặc cụm chọn; instancing 120 tam giác/cụm. Mặt pin lọc mipmap không phản sáng; nhịp hạt và thời gian thực dùng bản đã chỉnh. Focus/camera tổng quan phù hợp bố cục dài Bắc–Nam. Không sửa mặt bằng Sava/Hồng Liêm 3.

Registry Bình Nguyên có 12 vùng PV, 12 inverter + TR/MET/GW, ID đầy đủ `(plantId,assetId)`. 50/40 phân bổ theo số cụm minh họa; không tăng tổng công suất khi tạo cụm con. Cụm nhỏ nhận telemetry/history/quality phân bổ vùng cha, ghi rõ không có số đo riêng. Hiện trạng dùng fixture vấn đề minh họa cùng loại nhưng tính lại rating; Mô phỏng độc lập. Thống kê seed riêng 20261112, cửa sổ đến hôm qua UTC+7. Chat/cache/sự kiện/phân tích đều tách plantId; lịch sử chat không có nguồn chỉ tương thích Sava, không đưa vào Bình Nguyên. Các guard/credential AI giữ nguyên.

## Kiểm chứng

`tests/binh-nguyen.spec.ts`: hình học/không lấp khoảng trống giữa hai khu, rating/tổng MW, route đường không đứt, dữ liệu con/kịch bản fault/lịch sử/khóa riêng; browser đi từ danh sách tới 3D, chọn cụm nhỏ, mô phỏng đủ 12 nhánh, Thống kê; mobile/fallback. Suite Hong Liem/analysis/power network là hồi quy chung. Bằng chứng và triển khai tại STATUS.
