# Phạm vi sản phẩm

## Mục tiêu

Xây demo web đẹp, dễ chia sẻ bằng đường link HTTPS, giúp khách hàng trải nghiệm giá trị của bản sao số nhà máy điện mặt trời có AI và mô phỏng. Trong khoảng 3 phút, người xem cần hiểu: khu vực nào đang bất thường, ảnh hưởng ra sao, và nên ưu tiên hành động gì.

Thành công ban đầu được đánh giá bằng việc hoàn thành luồng trải nghiệm và mức độ dễ hiểu; không dùng số liệu chuyển đổi hoặc lợi ích tài chính chưa đo lường để quảng bá.

## Giả định khởi đầu

- Khách hàng chính: người quản lý vận hành nhà máy; chủ đầu tư là người xem thứ hai.
- Nhà máy hư cấu: “Solar Farm One”, 50 MWp DC. Công suất AC và số lượng thiết bị được xác định nhất quán trong task T02.
- Tiếng Việt, ưu tiên laptop; vẫn dùng được trên điện thoại.
- Chưa có logo, tên công ty hay thông tin liên hệ chính thức; dùng nhận diện trung tính và không tự tạo thông tin thật.
- Demo độc lập, không cần đăng nhập; dữ liệu vận hành tổng hợp, không chứa dữ liệu khách hàng.
- Đây là mô phỏng minh họa, chưa phải bản sao số đã kết nối và hiệu chỉnh theo nhà máy thực tế.

## Câu chuyện trải nghiệm

1. Khách thấy tổng quan nhà máy trong điều kiện bình thường và nhãn dữ liệu mô phỏng.
2. Chọn một cụm inverter để xem trạng thái, công suất và xu hướng.
3. Mở kịch bản mây che hoặc lỗi inverter, điều chỉnh mức độ, chạy mô phỏng.
4. Quan sát vùng chịu ảnh hưởng, đường công suất so với đường cơ sở và năng lượng mất đi.
5. Đọc nhận định, hành động đề xuất và hỏi AI nếu tính năng API được cấu hình.
6. Đặt lại demo hoặc mở phần trao đổi về nhu cầu của nhà máy mình.

## Phạm vi bản đầu

### Tổng quan và thiết bị

- Mô hình nhà máy 2.5D với các khối pin và inverter có thể chọn.
- Bốn chỉ số chính: công suất AC hiện tại, năng lượng mô phỏng tích lũy, mức khả dụng và tổn thất năng lượng so với đường cơ sở.
- Biểu đồ công suất có đường cơ sở và đường kịch bản; trục thời gian và đơn vị rõ ràng.
- Bảng chi tiết thiết bị, danh sách cảnh báo và chú giải màu trạng thái.

### Phòng mô phỏng

- Bốn kịch bản cài sẵn: mây che, bám bụi, quá nhiệt, lỗi inverter.
- Chọn phạm vi thiết bị, mức độ và thời lượng hợp lệ; hiển thị ý nghĩa các tham số.
- Bản đầu chạy một kịch bản tại một thời điểm để kết quả dễ giải thích.
- Có chạy, tạm dừng và đặt lại; đặt lại khôi phục cả đồng hồ, tham số, thiết bị, chỉ số và biểu đồ.
- Cùng đầu vào và seed cho cùng kết quả; các bộ phận giao diện đọc cùng một trạng thái.
- Tổn thất MWh được tích phân từ chênh lệch công suất theo bước thời gian, không cộng trực tiếp MW thành MWh.
- Nếu hiển thị doanh thu ảnh hưởng, tính từ năng lượng và mức giá giả định có thể nhìn thấy; ghi rõ là ước tính minh họa.

### Nhận định và AI

- Nhận định theo quy tắc: nêu bất thường, thiết bị ảnh hưởng, số liệu dẫn chứng và hành động đề xuất; hoạt động khi không có API.
- Giao diện ghi đúng chế độ: “Phân tích mô phỏng” cho quy tắc; “Trợ lý AI” khi API đã hoạt động.
- API AI chạy phía máy chủ, nhận ngữ cảnh tối thiểu của mô phỏng và phân biệt dữ kiện với giả thuyết.
- Khi không có khóa, quá hạn hoặc lỗi dịch vụ: giao diện thông báo rõ và vẫn dùng được mô phỏng.
- Chỉ tư vấn; không có lệnh điều khiển thiết bị hay tự thực hiện bảo trì.

### Luồng trình diễn và liên hệ

- Nút “Trải nghiệm demo 3 phút” dẫn qua các bước, có thể bỏ qua hoặc thoát.
- Nút “Trao đổi về nhà máy của bạn” mở phần tóm tắt nhu cầu và phương thức liên hệ khi có cấu hình thật.
- Chưa có địa chỉ nhận thì ghi rõ chưa cấu hình; không hiện thông báo gửi thành công giả.

## Chưa làm ở bản đầu

- Kết nối SCADA/IoT thật, điều khiển thiết bị, đăng nhập và phân quyền.
- Mô hình vật lý hoặc dự báo đã được kiểm định; tuyên bố độ chính xác chẩn đoán.
- Trình biên tập kịch bản tùy ý, kết hợp nhiều sự cố cùng lúc.
- 3D đầy đủ, VR, quản lý nhiều nhà máy hoặc hệ thống bảo trì hoàn chỉnh.

## Tiêu chí nghiệm thu toàn demo

- Mở link HTTPS trong trình duyệt khách và hoàn thành câu chuyện chính không cần đăng nhập.
- Chọn thiết bị, chạy được bốn kịch bản, thấy tác động đồng bộ, đặt lại được.
- Tham số không tạo công suất âm, năng lượng vô lý hoặc số không hợp lệ; kiểm tra bằng test bộ mô phỏng.
- Nhận định bám sát trạng thái hiện tại và ghi đúng chế độ AI; lỗi API không làm hỏng demo.
- Có nhãn dữ liệu mô phỏng và giả định quan trọng ở vị trí dễ thấy.
- Giao diện dùng được ở chiều rộng 1440, 1024 và 390 px; không tràn ngang trang hoặc che nút chính.
- Build và kiểm tra kiểu thành công; kiểm tra các tương tác chính và ghi bằng chứng vào STATUS.
- Không có secret ở trình duyệt, Git hoặc log; không có nút hành động chính bị hỏng hay giả thành công.
- Chỉ gọi là đã triển khai sau khi mở và kiểm tra link công khai thực tế.
