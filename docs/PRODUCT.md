# Phạm vi sản phẩm

**Phiên bản làm việc: 0.2 — đang review phạm vi, chưa chuyển sang T01.**

Yêu cầu đã biết từ người dùng: demo web bản sao số điện mặt trời, tích hợp AI, có cài đặt kịch bản mô phỏng, hình ảnh đẹp để thu hút khách hàng và tạo cơ hội gặp trình bày. Đối tượng ưu tiên, mức tùy chỉnh kịch bản, thông số nhà máy và phong cách cụ thể là đề xuất ban đầu, chưa phải quyết định đã xác nhận. Xem [bản review](PRODUCT_REVIEW.md) để trả lời các lựa chọn ảnh hưởng lớn.

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
- Bản phát triển có thể dùng phân tích theo quy tắc. Bản bàn giao để gửi khách phải kiểm tra được ít nhất một lượt hội thoại AI qua API thật; thiếu API không được đánh dấu hoàn thành yêu cầu tích hợp AI.

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
- Bản gửi khách có AI API đã kiểm chứng trên URL triển khai, bao gồm trả lời đúng ngữ cảnh và xử lý khi dịch vụ không khả dụng.
- Có nhãn dữ liệu mô phỏng và giả định quan trọng ở vị trí dễ thấy.
- Giao diện dùng được ở chiều rộng 1440, 1024 và 390 px; không tràn ngang trang hoặc che nút chính.
- Build và kiểm tra kiểu thành công; kiểm tra các tương tác chính và ghi bằng chứng vào STATUS.
- Không có secret ở trình duyệt, Git hoặc log; không có nút hành động chính bị hỏng hay giả thành công.
- Chỉ gọi là đã triển khai sau khi mở và kiểm tra link công khai thực tế.

## Giá trị sản phẩm và hành động mong muốn

Thông điệp đề xuất: “Nhìn thấy bất thường, hiểu tác động, thử kịch bản trước khi ra quyết định.”

| Người xem | Câu hỏi họ cần được giải đáp | Bằng chứng demo nên thể hiện |
| --- | --- | --- |
| Chủ đầu tư / lãnh đạo | Bất thường này ảnh hưởng gì tới hoạt động và giá trị kinh tế? | Tổn thất MWh, khu vực ảnh hưởng; giá trị tiền chỉ khi có giả định giá điện rõ |
| Quản lý nhà máy | Tôi nên chú ý khu vực nào và xử lý gì trước? | Vùng bất thường trên nhà máy, cảnh báo có mức độ, nhận định kèm dẫn chứng |
| Kỹ sư / đối tác | Số liệu, mô phỏng và AI có liên hệ với nhau không? | Chọn thiết bị, đổi tham số, xem kết quả đồng bộ và phần giả định mô hình |

Đây là ba góc nhìn nội dung trong cùng demo, chưa yêu cầu ba giao diện hoặc hệ thống phân quyền. Chọn người xem ưu tiên sau review để sắp thứ tự nội dung.

Sau trải nghiệm, khách có thể nêu: sự cố nào đang xảy ra, tác động ở đâu, một hành động cần cân nhắc và một câu hỏi muốn trao đổi với nhà cung cấp. CTA mở thông tin liên hệ thật khi được cung cấp; không yêu cầu khách đăng ký trước khi xem demo.

## Bản đồ màn hình và tương tác

Đề xuất một không gian làm việc chính với các bảng chi tiết, tránh bắt khách di chuyển qua nhiều trang.

| Khu vực | Nội dung | Hành động chính | Kết quả nhìn thấy |
| --- | --- | --- | --- |
| Mở đầu | Tên demo, thông điệp, nhãn dữ liệu, hai lựa chọn trải nghiệm | “Trải nghiệm 3 phút” / “Tự khám phá” | Vào cùng nhà máy với trạng thái ban đầu nhất quán |
| Tổng quan | Nhà máy, bốn KPI, trạng thái vận hành, chú giải | Chọn một cụm inverter | Vùng chọn và bảng chi tiết cùng đổi |
| Chi tiết cụm | ID, công suất danh định/hiện tại, trạng thái, nhiệt độ khi liên quan, xu hướng | Chọn cụm khác hoặc xem cảnh báo liên quan | Nội dung tương ứng đúng cụm |
| Kịch bản | Loại, thiết bị ảnh hưởng, mức độ, thời điểm bắt đầu và thời lượng | Cấu hình → chạy | Hiệu ứng không gian, KPI và đường công suất cùng thay đổi |
| Kết quả | Đường cơ sở, đường kịch bản, tổn thất, phạm vi ảnh hưởng | Đọc giải thích / hỏi AI | Số liệu có đơn vị và cùng khoảng thời gian |
| Phân tích / AI | Nhận định, bằng chứng, đề xuất, câu hỏi gợi ý | Gửi câu hỏi hoặc chọn gợi ý | Trả lời theo lần chạy và trạng thái hiện tại |
| Liên hệ | Giá trị đã minh họa, bước triển khai với nhà máy thật, thông tin đơn vị | Mở phương thức liên hệ đã cấu hình | Khách biết cách tiếp tục trao đổi |

Không bắt buộc làm trang mở đầu riêng: có thể dùng một lớp giới thiệu gọn trên màn hình chính. Sau khi bỏ qua, khách truy cập trực tiếp mọi chức năng cốt lõi.

## Kịch bản trình diễn khoảng 3 phút — đề xuất để review

Thời gian dưới đây là nhịp kể chuyện, không phải yêu cầu tự chuyển màn hình đúng từng giây. Người xem chủ động bấm tiếp, quay lại hoặc thoát.

| Nhịp | Người xem làm gì? | Demo thể hiện gì? | Ý nghĩa |
| --- | --- | --- | --- |
| 0–30 giây | Quan sát và chọn một cụm | Nhà máy có chiều sâu, chỉ số rõ, chi tiết thiết bị | Có thể nhìn từ toàn cảnh tới khu vực |
| 30–75 giây | Chọn lỗi inverter và chạy preset | Cụm bị ảnh hưởng đổi trạng thái; biểu đồ tách khỏi đường cơ sở | Bất thường có tác động định lượng |
| 75–120 giây | Xem kết quả và mở nhận định | Tổn thất tích lũy, thiết bị liên quan, bằng chứng và việc cần kiểm tra | Dữ liệu được chuyển thành thông tin hành động |
| 120–160 giây | Hỏi “Tôi nên kiểm tra gì trước?” | AI trả lời dựa vào dữ liệu của lượt chạy, nêu giới hạn | Có thể trao đổi bằng ngôn ngữ tự nhiên |
| 160–180 giây | Đặt lại, tự khám phá hoặc mở liên hệ | Có thể thử ba kịch bản còn lại và xem bước tiếp theo | Chuyển từ sự tò mò sang cuộc trao đổi |

Nhịp “so sánh trước/sau một phương án xử lý” có tiềm năng tăng sức thuyết phục; đang là đề xuất mở rộng cần review, chưa ngầm đưa vào phạm vi bắt buộc.

## Hợp đồng dữ liệu tối thiểu

Chốt mô hình đối tượng trước khi T01 tạo fixture; T02 dùng lại ID và cấu trúc, không tạo một nhà máy khác cho phần mô phỏng.

- **Nhà máy:** ID, tên, tổng MWp DC, giới hạn MW AC, múi giờ và danh sách cụm.
- **Cụm inverter:** ID, tên, vị trí trong mô hình, công suất DC/AC, trạng thái, công suất đầu ra; nhiệt độ có tên rõ khi được hiển thị. Các tấm pin vẽ lặp mang tính minh họa, chưa biểu diễn từng serial tấm pin thật.
- **Cấu hình kịch bản:** loại, danh sách ID cụm, mức độ theo đơn vị của loại kịch bản, thời điểm bắt đầu, thời lượng, seed.
- **Lần chạy:** ID/revision, cấu hình đã chốt, thời gian mô phỏng, trạng thái phát lại, chuỗi dữ liệu cơ sở/kịch bản, kết quả tổng hợp và sự kiện.
- **Cảnh báo:** ID, thời điểm mô phỏng, cụm liên quan, loại, mức độ và dữ kiện phát sinh; phân biệt sự kiện thời tiết với hỏng thiết bị.
- **Ngữ cảnh AI:** ID/revision lần chạy, thời điểm chụp dữ liệu, KPI, kịch bản, thiết bị liên quan, cảnh báo và giả định. Không cần gửi toàn bộ lịch sử hay thông tin cá nhân.

Thông số AC và số cụm được chốt trong SIMULATION trước khi triển khai tính toán. Nếu chọn số mẫu để dựng UI ở T01, ghi thành cấu hình dùng chung và nêu rõ đang là giả định.

## Định nghĩa chỉ số

| Chỉ số | Định nghĩa và giới hạn |
| --- | --- |
| Công suất hiện tại | Tổng đầu ra AC của các cụm tại thời điểm mô phỏng; đơn vị MW, không vượt giới hạn AC |
| Năng lượng tích lũy | Tích phân công suất kịch bản từ đầu lượt chạy tới thời điểm đang xem; MWh, không tự gọi là sản lượng cả ngày |
| Mức khả dụng | Tỷ lệ công suất AC danh định của thiết bị sẵn sàng so với tổng AC danh định; demo chưa tính khả dụng kỹ thuật theo chuẩn ngành |
| Tổn thất năng lượng | Tích phân phần giảm công suất so với đường cơ sở trong cùng lượt chạy; MWh |
| Ước tính doanh thu ảnh hưởng | Tổn thất kWh × giá điện giả định (đồng/kWh); hiển thị rõ giá và thời đoạn, không tự ngoại suy thành năm |

Mây che và bám bụi làm giảm đầu ra nhưng không tự làm thiết bị mất khả dụng. “Công suất thấp” không đồng nghĩa “inverter hỏng”.

Đường cơ sở là đối chứng không có tác động bổ sung của kịch bản, với cùng cấu hình nhà máy, thời gian và môi trường nền. Đường này là dữ liệu mô phỏng để so sánh, không phải dự báo đã kiểm định hoặc cam kết sản lượng.

## Đặc tả bốn kịch bản

Các khoảng dưới đây là đề xuất UX cho mô hình đơn giản. T02 phải ghi công thức và kiểm tra giới hạn; không diễn giải thành đặc tính kỹ thuật của nhà máy thật.

| Kịch bản | Cài đặt của người xem | Tác động cần thấy | Giải thích / hành động đề xuất |
| --- | --- | --- | --- |
| Mây che | Phạm vi cụm; mức giảm bức xạ 0–80%; thời điểm và thời lượng | Vùng che, bức xạ và công suất giảm, phục hồi khi mây đi qua | Giải thích tác động thời tiết; không khuyến nghị thay inverter vì mây |
| Bám bụi | Phạm vi; hệ số giảm hiệu suất do bụi 0–30%; thời điểm và thời lượng đánh giá | Nhóm pin có dấu hiệu bụi; đầu ra thấp hơn đối chứng | Gợi ý kiểm tra/vệ sinh; chưa tự tính ROI vệ sinh nếu không có chi phí |
| Quá nhiệt | Phạm vi; mức giảm công suất do nhiệt 0–25%; thời điểm và thời lượng | Cụm màu cảnh báo, đầu ra giảm theo mức giả định | Kiểm tra làm mát/điều kiện nhiệt; không khẳng định chẩn đoán nguyên nhân thật |
| Lỗi inverter | Một hoặc nhiều cụm; thời điểm và thời lượng mất hoạt động | Đầu ra cụm bằng 0 trong thời gian sự cố, mức khả dụng giảm | Ưu tiên xác minh cảnh báo, bảo vệ và kiểm tra bởi nhân sự phù hợp |

Ở mô hình quá nhiệt, mức derating là đầu vào trực tiếp. Chỉ thêm nhiệt độ và hàm suy giảm theo nhiệt khi có mô hình được ghi rõ; không đặt một nhiệt độ minh họa rồi ngầm coi đó là nguyên nhân tính toán.

Bám bụi không tự biến mất khi hết thời đoạn đánh giá. Mô phỏng chuyển sang trạng thái hoàn thành; muốn khôi phục cần đặt lại hoặc chọn phương án vệ sinh nếu phần so sánh được bổ sung. Mây có thể phục hồi tự nhiên; preset lỗi/quá nhiệt nếu giả định phục hồi phải ghi rõ.

Mỗi preset có giá trị mặc định chạy ngay; cấu hình nâng cao nằm trong bảng mở rộng. Giá trị mặc định và giới hạn được lưu cùng cấu hình mô phỏng, tránh lặp ở nhiều nơi.

## Vòng đời mô phỏng và thao tác

- Các trạng thái: sẵn sàng, đang chạy, tạm dừng, hoàn thành. Lỗi dữ liệu có thông báo và đường đặt lại.
- Tách đồng hồ mô phỏng khỏi đồng hồ thực; luôn ghi “Thời gian mô phỏng”. Đề xuất bước dữ liệu 1 phút, thời đoạn 2 giờ và tốc độ phát 1 phút mô phỏng/giây; đây là mặc định chờ review, không làm biến đổi tổng năng lượng khi đổi tốc độ.
- Sửa tham số ở trạng thái sẵn sàng. Khi đang chạy/tạm dừng, muốn áp dụng cấu hình mới phải bấm “Chạy lại với cấu hình mới”; lượt chạy cũ không bị ghi đè âm thầm.
- Chạy lại tạo revision/lượt chạy mới và xóa kết quả hiển thị cũ. Mọi KPI, cảnh báo và phân tích gắn với lượt chạy tương ứng.
- Tạm dừng dừng cả thời gian, năng lượng tích lũy và sự kiện; vẫn chọn thiết bị hoặc hỏi AI về ảnh chụp dữ liệu tại thời điểm đó.
- Đặt lại trở về preset mặc định, thời gian bắt đầu, trạng thái thiết bị, biểu đồ và cuộc hội thoại tương ứng. Nếu có danh sách cấu hình đã lưu ở phạm vi sau, đặt lại lượt chạy không xóa cấu hình đã lưu.
- Không tiếp tục phát lại hay gọi AI ngầm khi tab bị ẩn; khi quay lại tiếp tục từ trạng thái tạm dừng rõ ràng.
- Một loại kịch bản trên mỗi lượt chạy ở phạm vi hiện tại; hỗ trợ ghép nhiều loại và lưu kịch bản còn chờ lựa chọn của người dùng.

## Hành vi AI có thể nghiệm thu

Nhận định ngắn trên màn hình gồm: **điều đang xảy ra → dẫn chứng → việc nên kiểm tra → giới hạn kết luận**. Ưu tiên ba câu hỏi gợi ý:

1. “Khu vực nào đang ảnh hưởng nhiều nhất đến sản lượng?”
2. “Tổn thất trong lượt mô phỏng này là bao nhiêu?”
3. “Tôi nên kiểm tra gì trước, và vì sao?”

- AI dùng ảnh chụp ngữ cảnh tại thời điểm gửi; hiển thị mốc thời gian đó nếu mô phỏng tiếp tục chạy.
- Khi đổi lượt chạy trong lúc chờ phản hồi, phản hồi cũ không được hiển thị như kết luận của lượt mới.
- Với câu hỏi về điều không có dữ liệu, nêu rõ thiếu thông tin và có thể gợi ý cần bổ sung dữ liệu gì.
- Không tự tạo số tiền, lỗi thiết bị, độ tin cậy phần trăm hoặc mức tiết kiệm. Các con số trả lời phải khớp kết quả mô phỏng sau làm tròn/đổi đơn vị.
- Với câu hỏi ngoài phạm vi, hướng người xem về nhà máy và tình huống đang mô phỏng.
- Hiển thị trạng thái đang trả lời; chống gửi lặp và có thử lại có chủ đích khi lỗi. Không gọi mô hình ở mỗi bước cập nhật biểu đồ.
- Bản public cần có giới hạn yêu cầu và chi phí ở máy chủ, kiểm tra độ dài đầu vào, timeout và xử lý khi hết hạn mức; thông số cụ thể được chốt khi T03 chọn nhà cung cấp.

## Ma trận kiểm tra nghiệm thu

| ID | Thao tác / điều kiện | Kết quả phải kiểm tra | Mốc |
| --- | --- | --- | --- |
| AC-01 | Mở trang và chọn hai cụm khác nhau | ID, vùng chọn, đơn vị và chi tiết khớp fixture | T01 |
| AC-02 | Chạy cùng cấu hình và seed hai lần | Chuỗi dữ liệu và tổn thất trùng nhau | T02 |
| AC-03 | Chạy mây che rồi lỗi inverter | Cả hai giảm công suất; chỉ thiết bị mất hoạt động làm giảm mức khả dụng | T02 |
| AC-04 | Đặt mức tác động bằng 0 | Đường kịch bản trùng đường cơ sở, tổn thất bằng 0 trong sai số số học | T02 |
| AC-05 | Làm mất toàn bộ cụm trong một khoảng | Công suất bằng 0 trong khoảng đó, khả dụng 0%; năng lượng tổn thất tính đúng khoảng thời gian | T02 |
| AC-06 | Dừng, đổi tốc độ phát, đặt lại | Dừng không tích lũy thêm; tốc độ không đổi kết quả cùng thời điểm; đặt lại không sót cảnh báo/kết quả | T02 |
| AC-07 | Hỏi AI về tổn thất và khu vực ảnh hưởng | Trả lời khớp dữ liệu của lượt chạy và thời điểm chụp | T03 |
| AC-08 | Thiếu khóa, API lỗi, đổi lượt khi đang chờ | Mô phỏng vẫn chạy; chế độ được ghi đúng; không dùng nhầm phản hồi cũ | T03 |
| AC-09 | Đi qua hướng dẫn, thoát, khám phá tự do | Không mắc kẹt ở lớp hướng dẫn, vẫn truy cập đủ tính năng | T04 |
| AC-10 | Dùng màn hình 1440/1024/390 px và bàn phím | Không tràn ngang, nút chính dùng được, có focus và nhãn trạng thái | T04 |
| AC-11 | Mở link public và thực hiện luồng chính | Tài nguyên tải được; mô phỏng và một yêu cầu AI thật thành công; liên hệ đúng cấu hình | T05 |

Đây là tiêu chí cần kiểm tra, chưa phải kết quả đã đạt. Test tự động bao phủ phép tính/trạng thái; kiểm tra trình duyệt bao phủ trải nghiệm. Không yêu cầu test tự động cho từng câu chữ trong tài liệu.

## Các lựa chọn còn mở

1. Người xem ưu tiên: lãnh đạo/chủ đầu tư, quản lý vận hành hay đối tác kỹ thuật.
2. Điểm nhấn: mô phỏng so sánh phương án, không gian nhà máy, hay AI phân tích.
3. Cài đặt kịch bản: preset đổi tham số, ghép nhiều loại, hay khu chuẩn bị/lưu kịch bản cho người trình diễn.
4. Mức mô phỏng cần thiết: đủ kể câu chuyện hay cần gần cấu hình một nhà máy cụ thể. Mặc định hiện tại là minh họa có quy luật.
5. Nhận diện và liên hệ thật; có thể bổ sung sau, không cần tạo dữ liệu giả.

Các lựa chọn 1–3 được đưa ra review trước T01 vì có thể thay đổi bố cục và cấu trúc dữ liệu. Chưa coi đề xuất mở rộng là yêu cầu đã chốt; cập nhật TASKS/DESIGN nếu lựa chọn mới làm đổi phạm vi.
