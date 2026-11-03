# Phạm vi sản phẩm

## Quyết định UX mới: luồng mô phỏng đơn giản

Luồng chính là chọn kịch bản, chọn số cụm ảnh hưởng (1–8), chọn thời gian rồi đọc MW/MWh giảm hoặc mất. 3D minh họa cùng phạm vi đó. Mức giảm/vị trí chi tiết và toàn bộ biểu đồ/tốc độ/so sánh phương án là nâng cao, không bắt người xem mới đi qua. Mây mặc định vẫn bốn cụm trái, nhưng quy mô không còn cố định; bụi/lỗi có thể tác động nhiều cụm. Quyết định này thay các mô tả luồng nhiều bước/ba đường luôn mở ở mốc T02 trước.

## Cập nhật triển khai T02B/T02C

Ba preset và tự cấu hình đã dùng dữ liệu tính theo kịch bản ở tab Mô phỏng, thay lớp annotation chỉ minh họa của các review T01/T02A. Bản xem thử cập nhật công suất/trạng thái ngay; phát lại tính năng lượng theo bước 60 giây, có pause/restart/reset và revision. Đối chiếu cơ sở/chưa xử lý/có phương án vệ sinh hoặc khôi phục cùng thời đoạn; mây chỉ phục hồi tự nhiên. Hiện trạng vẫn độc lập. Xem SIMULATION và STATUS cho công thức, giới hạn và bằng chứng kiểm tra. Các đoạn nhắc giới hạn T01/T02A dưới đây mô tả mốc trước, không thay thế cập nhật này.

## Tách Hiện trạng và Mô phỏng — quyết định review

Hai tab chính **Hiện trạng** và **Mô phỏng** có dữ liệu và lựa chọn thiết bị riêng; mặc định mở Hiện trạng. Hiện trạng dùng snapshot mẫu cố định, không phải kết nối nhà máy thật. Toàn bộ KPI, hồ sơ, biểu đồ, thời tiết và cảnh báo đọc snapshot của tab đang xem. Chạy/tạm dừng/đặt lại hoặc thay tham số mô phỏng không ghi vào hiện trạng. Chuyển về Hiện trạng tạm dừng lượt mô phỏng; quay lại giữ kết quả, tham số và thiết bị để chủ động chạy tiếp. Không tự reset lượt khi đổi tab.

Thẻ kịch bản, tự cấu hình và điều khiển phát lại chỉ có trong tab Mô phỏng. Hai lựa chọn “Kịch bản có sẵn” và “Tự cấu hình” là chế độ con bên trong tab này. Cảnh/model và thao tác camera được giữ; không remount cảnh khi đổi dữ liệu. T02A/B/C đã có điều kiện nền, tác động ba kịch bản và so sánh phương án; AI thuộc T03, chưa triển khai. Quyết định này thay thế bố cục trộn theo dõi và mô phỏng trước review.

**Phạm vi sản phẩm sau T02.** T01 đã được người dùng chấp nhận; T02 đã triển khai và kiểm thử cục bộ, chờ nghiệm thu trên bản test Vercel. Các mục AI, hướng dẫn demo và bàn giao công khai thuộc T03–T05. Giả định chưa xác nhận vẫn được ghi rõ, không coi là dữ kiện nhà máy thật.

Yêu cầu đã biết từ người dùng: demo web bản sao số điện mặt trời, tích hợp AI, có cài đặt kịch bản mô phỏng, hình ảnh đẹp để thu hút khách hàng và tạo cơ hội gặp trình bày. Người dùng đã xác nhận có đúng 3 kịch bản sẵn, thêm màn hình tự cấu hình tham số đơn giản và xem kết quả mô phỏng ngay trong 3D. Đã xác nhận bộ ba mây che, bám bụi, lỗi inverter; người xem chính là giám đốc nhà máy/đội vận hành. Người dùng muốn click thiết bị để xem tình trạng với giả định đã gắn cảm biến IoT, khám phá nhà máy, mô phỏng/so sánh phương án và AI vừa hội thoại vừa chủ động phân tích, hỗ trợ quyết định. Thông số nhà máy và nhận diện cụ thể vẫn là đề xuất. Xem [bản review](PRODUCT_REVIEW.md) để trả lời các lựa chọn ảnh hưởng lớn.


**Phạm vi sản phẩm sau T02.** T01 đã được người dùng chấp nhận; T02 đã triển khai và kiểm thử cục bộ, chờ nghiệm thu trên bản test Vercel. Các mục AI, hướng dẫn demo và bàn giao công khai thuộc T03–T05. Giả định chưa xác nhận vẫn được ghi rõ, không coi là dữ kiện nhà máy thật.

Yêu cầu đã biết từ người dùng: demo web bản sao số điện mặt trời, tích hợp AI, có cài đặt kịch bản mô phỏng, hình ảnh đẹp để thu hút khách hàng và tạo cơ hội gặp trình bày. Người dùng đã xác nhận có đúng 3 kịch bản sẵn, thêm màn hình tự cấu hình tham số đơn giản và xem kết quả mô phỏng ngay trong 3D. Đã xác nhận bộ ba mây che, bám bụi, lỗi inverter; người xem chính là giám đốc nhà máy/đội vận hành. Người dùng muốn click thiết bị để xem tình trạng với giả định đã gắn cảm biến IoT, khám phá nhà máy, mô phỏng/so sánh phương án và AI vừa hội thoại vừa chủ động phân tích, hỗ trợ quyết định. Thông số nhà máy và nhận diện cụ thể vẫn là đề xuất. Xem [bản review](PRODUCT_REVIEW.md) để trả lời các lựa chọn ảnh hưởng lớn.

## Mục tiêu

Xây demo web đẹp, dễ chia sẻ bằng đường link HTTPS, giúp khách hàng trải nghiệm giá trị của bản sao số nhà máy điện mặt trời có AI và mô phỏng. Trong khoảng 3 phút, người xem cần hiểu: khu vực nào đang bất thường, ảnh hưởng ra sao, và nên ưu tiên hành động gì.

Thành công ban đầu được đánh giá bằng việc hoàn thành luồng trải nghiệm và mức độ dễ hiểu; không dùng số liệu chuyển đổi hoặc lợi ích tài chính chưa đo lường để quảng bá.

## Giả định khởi đầu

- Khách hàng chính: người quản lý vận hành nhà máy; chủ đầu tư là người xem thứ hai.
- Nhà máy hư cấu: “Solar Farm One”, 50 MWp DC. Công suất AC và số lượng thiết bị được xác định nhất quán trong task T02.
- Tiếng Việt, ưu tiên laptop; vẫn dùng được trên điện thoại.
- Logo SAVA và tagline “GOOD TO GREAT” đã được người dùng cung cấp ở review giao diện sau T01. Thông tin liên hệ chính thức chưa được cung cấp; không tự tạo thông tin liên hệ.
- Demo độc lập, không cần đăng nhập; dữ liệu vận hành tổng hợp, không chứa dữ liệu khách hàng.
- Đây là mô phỏng minh họa, chưa phải bản sao số đã kết nối và hiệu chỉnh theo nhà máy thực tế.

## Câu chuyện trải nghiệm

1. Khách thấy tổng quan nhà máy trong điều kiện bình thường và nhãn dữ liệu mô phỏng.
2. Chọn thiết bị trong 3D để xem hồ sơ, trạng thái vận hành, kết nối IoT, cảm biến, xu hướng và cảnh báo.
3. Mở kịch bản mây che hoặc lỗi inverter, điều chỉnh mức độ, chạy mô phỏng.
4. Quan sát vùng chịu ảnh hưởng, đường công suất so với đường cơ sở và năng lượng mất đi.
5. Đọc phân tích chủ động, hỏi AI về thiết bị đang chọn, thử phương án xử lý và so sánh kết quả trong cùng thời đoạn.
6. Đặt lại demo hoặc mở phần trao đổi về nhu cầu của nhà máy mình.

## Phạm vi bản đầu

### Tổng quan và thiết bị

- Mô hình nhà máy 3D thực với các khối pin và cụm inverter có thể chọn; xoay, zoom và trở về góc nhìn tổng quan.
- Bốn chỉ số chính: công suất AC hiện tại, năng lượng mô phỏng tích lũy, mức khả dụng và tổn thất năng lượng so với đường cơ sở.
- Biểu đồ công suất có đường cơ sở và đường kịch bản; trục thời gian và đơn vị rõ ràng.
- Click các thiết bị được quản lý trong 3D để mở hồ sơ và dữ liệu IoT giả lập; có cảm biến, lịch sử, cảnh báo và liên kết tới thiết bị liên quan. Chi tiết ở [đặc tả thiết bị/IoT](IOT.md).
- Danh sách cảnh báo và chú giải riêng cho tình trạng vận hành và chất lượng/kết nối dữ liệu.

### Phòng mô phỏng

- Đúng 3 kịch bản cài sẵn đã được người dùng xác nhận: mây che, bám bụi và lỗi inverter.
- Có màn hình “Tự cấu hình” riêng; bảng tham số và cảnh 3D cùng xuất hiện để khách thấy kết quả ngay khi chỉnh. Chọn phạm vi thiết bị, mức độ và thời lượng hợp lệ; hiển thị ý nghĩa các tham số.
- Bản đầu chạy một kịch bản tại một thời điểm để kết quả dễ giải thích.
- Có chạy, tạm dừng và đặt lại; đặt lại khôi phục cả đồng hồ, tham số, thiết bị, chỉ số và biểu đồ.
- Cùng đầu vào và seed cho cùng kết quả; các bộ phận giao diện đọc cùng một trạng thái.
- Tổn thất MWh được tích phân từ chênh lệch công suất theo bước thời gian, không cộng trực tiếp MW thành MWh.
- Nếu hiển thị doanh thu ảnh hưởng, tính từ năng lượng và mức giá giả định có thể nhìn thấy; ghi rõ là ước tính minh họa.

### Giám sát IoT giả lập

- Giả định cảm biến/telemetry đã được trang bị; mỗi đối tượng tương tác trong cảnh có hồ sơ, ID, các tín hiệu phù hợp, trạng thái kết nối, lần cập nhật, xu hướng và cảnh báo.
- Đề xuất các loại đại diện: cụm pin, inverter, máy biến áp, trạm thời tiết và gateway IoT. Chi tiết và phạm vi tín hiệu ở [IOT](IOT.md); số lượng và đặc tính vẫn là giả định demo.
- Bấm thiết bị trong cảnh hoặc cây thiết bị để mở chi tiết; bấm cảnh báo để đi tới đúng thiết bị. AI biết thiết bị đang được hỏi và chất lượng dữ liệu của nó.
- Tình trạng vận hành và tình trạng dữ liệu là hai lớp riêng; dữ liệu mất/cũ không đồng nghĩa thiết bị hỏng. Dữ liệu và kết nối đều được ghi là giả lập.

### Nhận định và AI

- AI có hai vai trò bắt buộc: trợ lý hội thoại theo ngữ cảnh và chủ động phân tích khi xuất hiện bất thường/kết thúc lượt chạy; có dẫn chứng và đề xuất hành động để người vận hành cân nhắc.
- Nhận định theo quy tắc hoạt động độc lập: nêu bất thường, thiết bị ảnh hưởng, số liệu dẫn chứng và hành động đề xuất; không gắn nhãn AI API khi chỉ dùng quy tắc.
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
- Mô hình CAD/BIM chi tiết theo nhà máy thật, VR, quản lý nhiều nhà máy hoặc hệ thống bảo trì hoàn chỉnh. 3D tương tác cho demo nằm trong phạm vi bắt buộc.

## Tiêu chí nghiệm thu toàn demo

- Mở link HTTPS trong trình duyệt khách và hoàn thành câu chuyện chính không cần đăng nhập.
- Chọn thiết bị trong 3D, chạy được 3 preset và tự chỉnh tham số; thấy tác động trong cảnh 3D đồng bộ với chỉ số và biểu đồ, đặt lại được.
- Tham số không tạo công suất âm, năng lượng vô lý hoặc số không hợp lệ; kiểm tra bằng test bộ mô phỏng.
- Nhận định bám sát trạng thái hiện tại và ghi đúng chế độ AI; lỗi API không làm hỏng demo.
- Bản gửi khách có AI API đã kiểm chứng trên URL triển khai, bao gồm trả lời đúng ngữ cảnh và xử lý khi dịch vụ không khả dụng.
- Có nhãn dữ liệu mô phỏng và giả định quan trọng ở vị trí dễ thấy.
- Giao diện dùng được ở chiều rộng 1440, 1024 và 390 px; không tràn ngang trang hoặc che nút chính.
- Build và kiểm tra kiểu thành công; kiểm tra các tương tác chính và ghi bằng chứng vào STATUS.
- Không có secret ở trình duyệt, Git hoặc log; không có nút hành động chính bị hỏng hay giả thành công.
- Chỉ gọi là đã triển khai sau khi mở và kiểm tra link công khai thực tế.

## Giá trị sản phẩm và hành động mong muốn

Thông điệp cho người vận hành: “Theo dõi từng thiết bị, hiểu bất thường, thử phương án trước khi quyết định.”

| Người xem | Câu hỏi họ cần được giải đáp | Bằng chứng demo nên thể hiện |
| --- | --- | --- |
| Chủ đầu tư / lãnh đạo | Bất thường này ảnh hưởng gì tới hoạt động và giá trị kinh tế? | Tổn thất MWh, khu vực ảnh hưởng; giá trị tiền chỉ khi có giả định giá điện rõ |
| Quản lý nhà máy | Tôi nên chú ý khu vực nào và xử lý gì trước? | Vùng bất thường trên nhà máy, cảnh báo có mức độ, nhận định kèm dẫn chứng |
| Kỹ sư / đối tác | Số liệu, mô phỏng và AI có liên hệ với nhau không? | Chọn thiết bị, đổi tham số, xem kết quả đồng bộ và phần giả định mô hình |

Người dùng đã chọn giám đốc nhà máy/đội vận hành làm đối tượng chính. Ưu tiên khả năng khám phá thiết bị, dữ liệu IoT, cảnh báo và so sánh xử lý; thông tin kinh tế là hỗ trợ. Không yêu cầu ba giao diện hoặc hệ thống phân quyền.

Sau trải nghiệm, khách có thể nêu: sự cố nào đang xảy ra, tác động ở đâu, một hành động cần cân nhắc và một câu hỏi muốn trao đổi với nhà cung cấp. CTA mở thông tin liên hệ thật khi được cung cấp; không yêu cầu khách đăng ký trước khi xem demo.

## Bản đồ màn hình và tương tác

Có hai màn hình/chế độ rõ ràng: “Kịch bản có sẵn” và “Tự cấu hình”. Cả hai dùng cùng cảnh nhà máy 3D, dữ liệu và ngôn ngữ thiết kế; không yêu cầu mở tab mới để xem kết quả.

| Khu vực | Nội dung | Hành động chính | Kết quả nhìn thấy |
| --- | --- | --- | --- |
| Mở đầu | Tên demo, thông điệp, nhãn dữ liệu, hai lựa chọn trải nghiệm | “Trải nghiệm 3 phút” / “Tự khám phá” | Vào cùng nhà máy với trạng thái ban đầu nhất quán |
| Tổng quan | Nhà máy, bốn KPI, trạng thái vận hành, chú giải | Chọn một cụm inverter | Vùng chọn và bảng chi tiết cùng đổi |
| Chi tiết thiết bị | Hồ sơ, vận hành, kết nối, cảm biến, lần cập nhật, xu hướng và cảnh báo theo IOT | Chọn thiết bị, mở cảm biến/cảnh báo, hỏi AI | Nội dung đúng ID thiết bị; thấy dữ liệu mới/cũ và quan hệ thiết bị |
| Kịch bản có sẵn | Ba thẻ mô tả tình huống, nút chạy và đặt lại | Chọn preset → chạy | Hiệu ứng trong 3D, KPI và đường công suất cùng thay đổi |
| Tự cấu hình | Loại tình huống, thiết bị, mức độ khi áp dụng, thời lượng; cảnh 3D đặt cạnh bảng điều khiển | Đổi tham số → xem thử ngay → chạy | Bản xem thử được tính lại từ đầu vào và hiển thị trực tiếp trong 3D |
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
| 160–180 giây | Đặt lại, tự khám phá hoặc mở liên hệ | Có thể thử hai preset còn lại, tự cấu hình và xem bước tiếp theo | Chuyển từ sự tò mò sang cuộc trao đổi |

So sánh phương án xử lý thuộc phạm vi đã xác nhận qua lựa chọn của người dùng. Các thao tác cụ thể được mô tả ở mục “So sánh phương án xử lý”; không tạo thêm preset thứ tư.

## Hợp đồng dữ liệu tối thiểu

Chốt mô hình đối tượng trước khi T01 tạo fixture; T02 dùng lại ID và cấu trúc, không tạo một nhà máy khác cho phần mô phỏng.

- **Nhà máy:** ID, tên, tổng MWp DC, giới hạn MW AC, múi giờ và danh sách cụm.
- **Cụm inverter:** ID, tên, vị trí trong mô hình, công suất DC/AC, trạng thái, công suất đầu ra; nhiệt độ có tên rõ khi được hiển thị. Các tấm pin vẽ lặp mang tính minh họa, chưa biểu diễn từng serial tấm pin thật.
- **Thiết bị/cảm biến/telemetry:** ID và quan hệ ổn định theo IOT, loại thiết bị, tín hiệu, đơn vị, thời điểm, chất lượng, kết nối và lịch sử; cùng ID gắn với đối tượng 3D.
- **Cấu hình kịch bản:** loại, danh sách ID cụm, mức độ theo đơn vị của loại kịch bản, thời điểm bắt đầu, thời lượng, seed.
- **Lần chạy:** ID/revision, cấu hình đã chốt, thời gian mô phỏng, trạng thái phát lại, chuỗi dữ liệu cơ sở/kịch bản, kết quả tổng hợp và sự kiện.
- **Cảnh báo:** ID, thời điểm mô phỏng, cụm liên quan, loại, mức độ và dữ kiện phát sinh; phân biệt sự kiện thời tiết với hỏng thiết bị.
- **Ngữ cảnh AI:** ID/revision lần chạy, thời điểm chụp dữ liệu, KPI, kịch bản, thiết bị đang chọn/đang hỏi, tín hiệu và chất lượng dữ liệu, cảnh báo và giả định. Không cần gửi toàn bộ lịch sử hay thông tin cá nhân.

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

## Đặc tả 3 preset — bộ ba đã xác nhận

Các khoảng dưới đây là đề xuất UX cho mô hình đơn giản. T02 phải ghi công thức và kiểm tra giới hạn; không diễn giải thành đặc tính kỹ thuật của nhà máy thật.

| Kịch bản | Cài đặt của người xem | Tác động cần thấy | Giải thích / hành động đề xuất |
| --- | --- | --- | --- |
| Mây che | Phạm vi cụm; mức giảm bức xạ 0–80%; thời điểm và thời lượng | Vùng che, bức xạ và công suất giảm, phục hồi khi mây đi qua | Giải thích tác động thời tiết; không khuyến nghị thay inverter vì mây |
| Bám bụi | Phạm vi; hệ số giảm hiệu suất do bụi 0–30%; thời điểm và thời lượng đánh giá | Nhóm pin có dấu hiệu bụi; đầu ra thấp hơn đối chứng | Gợi ý kiểm tra/vệ sinh; chưa tự tính ROI vệ sinh nếu không có chi phí |
| Lỗi inverter | Một hoặc nhiều cụm; thời điểm và thời lượng mất hoạt động | Đầu ra cụm bằng 0 trong thời gian sự cố, mức khả dụng giảm | Ưu tiên xác minh cảnh báo, bảo vệ và kiểm tra bởi nhân sự phù hợp |

Quá nhiệt không là preset riêng. Có thể hiển thị nhiệt độ cảm biến giả lập trong hồ sơ thiết bị theo IOT; việc hiển thị nhiệt độ không ngầm bổ sung mô hình suy giảm công suất do nhiệt.

Bám bụi không tự biến mất khi hết thời đoạn đánh giá. Mô phỏng chuyển sang trạng thái hoàn thành; muốn khôi phục cần đặt lại hoặc chọn phương án vệ sinh nếu phần so sánh được bổ sung. Mây có thể phục hồi tự nhiên; preset lỗi inverter nếu giả định phục hồi phải ghi rõ.

Mỗi preset có giá trị mặc định chạy ngay; cấu hình nâng cao nằm trong bảng mở rộng. Giá trị mặc định và giới hạn được lưu cùng cấu hình mô phỏng, tránh lặp ở nhiều nơi.

## Màn hình tự cấu hình và kết quả trong 3D

**Yêu cầu đã xác nhận:** có màn hình tự cấu hình một số tham số đơn giản và xem được kết quả ngay trong 3D. Các chi tiết điều khiển dưới đây là đề xuất thực hiện, có thể chỉnh trong review.

- Có nút “Tự cấu hình” dễ thấy từ màn hình ba preset; cho phép lấy một preset làm điểm bắt đầu mà không sửa preset gốc.
- Theo review hiện hành, bộ chọn kịch bản ở góc trên trái trong cảnh; bảng tham số nằm dưới cảnh để không che bộ chọn/HUD. Trên điện thoại, ưu tiên cảnh và chỉ số tóm tắt luôn nhìn thấy khi mở bảng điều khiển dạng ngăn, không để toàn bộ cảnh bị che.
- Chỉ hiện tham số liên quan: loại tình huống; cụm chịu ảnh hưởng (chọn trong cảnh hoặc danh sách); mức độ với mây/bụi; thời lượng. Lỗi inverter dùng trạng thái mất hoạt động của cụm được chọn, không thêm thanh phần trăm không có ý nghĩa.
- Mỗi thanh điều chỉnh có giá trị, đơn vị, khoảng hợp lệ và mặc định. Thời điểm bắt đầu mặc định ngay đầu lượt để người mới không phải cấu hình timeline; có thể để thời điểm bắt đầu trong mục nâng cao sau review.
- Thay đổi hợp lệ tính lại kết quả cục bộ, không cần nút lưu và không cần gọi AI. Đề xuất cập nhật sau tối đa khoảng 300 ms debounce khi ngừng kéo; phải đo ở T02 trên thiết bị kiểm tra, chưa phải hiệu năng đã đạt.
- Bản xem thử đặt tại một mốc có tác động của sự kiện, ghi rõ “Xem thử tại phút …”; không nhầm đây là diễn biến đang chạy. Thay thời lượng có thể không đổi công suất tức thời nhưng phải đổi kết quả năng lượng dự kiến toàn kỳ.
- Khi bấm chạy, phát lại từ đầu lượt với đồng hồ mô phỏng rõ ràng. Phân biệt “tổn thất đã tích lũy đến hiện tại” với “tổn thất dự kiến toàn kỳ” nếu cùng hiển thị.
- Cấu hình tùy chỉnh chỉ cần giữ trong phiên trải nghiệm hiện tại. Lưu thư viện, xuất/nhập hoặc chia sẻ cấu hình chưa nằm trong yêu cầu đã xác nhận.

### Biểu diễn kết quả trực tiếp trong cảnh

| Tình huống | Hiệu ứng 3D gắn với kết quả | Thông tin định lượng trong cảnh |
| --- | --- | --- |
| Bình thường | Các cụm có trạng thái hoạt động, cường độ hiển thị gắn công suất tương đối | Nhãn cụm được chọn: MW hiện tại, trạng thái |
| Mây che | Mây/vùng bóng biểu tượng phủ đúng các cụm được cấu hình; cụm giảm đầu ra | Nhãn cụm được chọn và chỉ số tổn thất đồng bộ; bóng là minh họa, không phải mô hình quang học |
| Bám bụi | Lớp bụi hoặc đổi vật liệu trên đúng vùng pin chịu ảnh hưởng | Mức giảm do bụi và công suất của vùng được chọn |
| Lỗi inverter | Thiết bị/vùng liên quan chuyển trạng thái sự cố, nhãn cảnh báo, đầu ra về 0 khi sự cố có hiệu lực | ID cụm lỗi, trạng thái và công suất; không vẽ toàn bộ nhà máy hỏng nếu chỉ lỗi một cụm |

Nhãn nổi được neo vào thiết bị 3D và có thể chọn; không hiển thị nhãn mọi cụm cùng lúc gây chồng chữ. Chú giải màu và chữ luôn có sẵn. Biểu đồ vẫn hỗ trợ đọc diễn biến, nhưng kết quả không chỉ xuất hiện ở biểu đồ hoặc bảng bên ngoài cảnh.

Camera có xoay, zoom giới hạn hợp lý, chọn cụm và nút trở về tổng quan. Đổi tham số giữ góc camera và thiết bị đang chọn nếu còn tồn tại; không tự bay camera liên tục. Khi chạy preset có thể giới thiệu vùng ảnh hưởng một lần, cho phép người xem chủ động điều khiển sau đó.

## Vòng đời mô phỏng và thao tác

- Các trạng thái: sẵn sàng, xem thử, đang chạy, tạm dừng, hoàn thành. Lỗi dữ liệu có thông báo và đường đặt lại.
- Tách đồng hồ mô phỏng khỏi đồng hồ thực; luôn ghi “Thời gian mô phỏng”. Đề xuất bước dữ liệu 1 phút, thời đoạn 2 giờ và tốc độ phát 1 phút mô phỏng/giây; đây là mặc định chờ review, không làm biến đổi tổng năng lượng khi đổi tốc độ.
- Ở màn hình tự cấu hình, chỉnh tham số cập nhật bản xem thử 3D ngay. Khi chỉnh trong lúc đang chạy/tạm dừng, kết thúc phát lại cũ, chuyển về “Xem thử” với revision mới và làm mất hiệu lực kết quả/AI cũ. Không bắt khách bấm chạy lại chỉ để thấy thay đổi; nút chạy bắt đầu phát lại diễn biến theo thời gian.
- Chạy lại tạo revision/lượt chạy mới và xóa kết quả hiển thị cũ. Mọi KPI, cảnh báo và phân tích gắn với lượt chạy tương ứng.
- Tạm dừng dừng cả thời gian, năng lượng tích lũy và sự kiện; vẫn chọn thiết bị hoặc hỏi AI về ảnh chụp dữ liệu tại thời điểm đó.
- Đặt lại trở về điều kiện cơ sở không sự kiện như khi mở tab Mô phỏng, thời gian bắt đầu, thiết bị INV-01 và lịch sử mới. Chạy lại giữ cấu hình kịch bản hiện tại nhưng tạo revision mới. Hội thoại khi có ở T03 phải được tách theo lượt tương ứng. Nếu có danh sách cấu hình đã lưu ở phạm vi sau, đặt lại lượt chạy không xóa cấu hình đã lưu.
- Không tiếp tục phát lại hay gọi AI ngầm khi tab bị ẩn; khi quay lại tiếp tục từ trạng thái tạm dừng rõ ràng.
- Đề xuất màn hình tự cấu hình chọn một loại tình huống mỗi lần với một số tham số đơn giản. Ghép nhiều loại và lưu/chia sẻ cấu hình chưa được người dùng yêu cầu, không tự bổ sung.

## Hành vi AI có thể nghiệm thu

### Phân tích chủ động

- Cảnh báo xác định được sinh ngay từ quy tắc/bộ mô phỏng. Khi có sự kiện đáng chú ý hoặc lượt chạy hoàn thành, AI chủ động tạo thẻ phân tích mà không cần người xem gửi câu hỏi.
- Mỗi thẻ nêu thiết bị/vùng ảnh hưởng, dấu hiệu, tác động, việc nên kiểm tra và giới hạn kết luận; có nút “Xem thiết bị” và “Thử phương án” khi có phương án tương ứng.
- Đề xuất gộp sự kiện cùng nguyên nhân, tối đa một phân tích tự động cho một đợt sự kiện và một bản tổng kết mỗi lượt; không gọi API ở mọi mẫu đo hoặc mỗi lần kéo thanh tham số. T03 đặt ngân sách/giới hạn máy chủ và kiểm tra chống gọi lặp.
- Mỗi yêu cầu gắn revision và ảnh chụp dữ liệu. Phản hồi đến muộn được giữ đúng ngữ cảnh hoặc loại bỏ; không gán kết luận cũ cho thiết bị/lượt mới.
- Khi API không khả dụng, thẻ quy tắc vẫn hiển thị đúng nhãn và số liệu; không báo AI đã phân tích thành công.

### Hội thoại theo ngữ cảnh

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

## So sánh phương án xử lý

Người dùng đã chọn mô phỏng/so sánh là một điểm nhấn. Các phương án sau là thiết kế chi tiết đề xuất cho bản đầu; kết quả là giả định, không là lệnh điều khiển thiết bị thật.

| Kịch bản | Phương án đề xuất | Giả định người xem điều chỉnh | Kết quả so sánh |
| --- | --- | --- | --- |
| Bám bụi | Vệ sinh vùng pin đã chọn | Thời điểm hoàn tất và tỷ lệ khôi phục phần suy giảm do bụi | Công suất và MWh có thể thu hồi so với không vệ sinh trong cùng thời đoạn |
| Lỗi inverter | Khắc phục/khôi phục hoạt động theo giả định | Thời điểm khôi phục sau khi sự cố bắt đầu | Thời gian mất hoạt động và MWh có thể tránh mất so với không can thiệp |
| Mây che | Theo dõi và chờ thời tiết phục hồi | Mức/thời lượng che trong màn hình cấu hình | Diễn biến tác động thời tiết; không gán hành động sửa thiết bị hoặc tuyên bố kiểm soát được mây |

Giữ ba đối tượng phân biệt: đường cơ sở không sự kiện; kịch bản chưa xử lý; kịch bản có phương án. So sánh phương án dùng cùng seed, môi trường và thời đoạn; chỉ thay giả định can thiệp. Giao diện có thể chuyển hai lớp xem “Chưa xử lý” / “Có phương án” để cảnh 3D không bị rối, kèm chênh lệch MWh và biểu đồ đối chiếu.

Năng lượng có thể thu hồi = tích phân chênh lệch giữa phương án và kịch bản chưa xử lý. Không đặt thời điểm hoàn tất trước lúc bắt đầu sự cố; không khôi phục vượt đường cơ sở. Chưa tính chi phí nhân sự, vệ sinh hay sửa chữa nên không gọi giá trị này là lợi nhuận ròng hoặc ROI. AI có thể đề xuất thử, người xem là người áp dụng giả định mô phỏng.

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
| AC-12 | Xoay/zoom, chọn cụm và trở về tổng quan | Camera 3D thực hoạt động, chọn đúng ID, không phụ thuộc một ảnh phối cảnh cố định | T01 |
| AC-13 | Đổi mức mây/bụi, chọn cụm khác trong màn hình tự cấu hình | Bản xem thử 3D và số liệu cập nhật từ cùng revision, đúng vùng; không cần bấm chạy hoặc gọi AI | T02 |
| AC-14 | Đổi thời lượng, giữ nguyên mức tác động | Năng lượng dự kiến toàn kỳ đổi đúng theo mô hình; nhãn phân biệt xem thử với phát lại | T02 |
| AC-15 | Chạy lần lượt 3 preset rồi mở tự cấu hình từ preset | Có đúng 3 preset; hiệu ứng 3D phân biệt được, chỉnh bản sao không làm đổi preset gốc | T02 |
| AC-16 | WebGL không khả dụng hoặc cảnh lỗi tải | Có thông báo và cách thử lại/hướng dẫn phù hợp; không quay vòng tải vô hạn hoặc báo đã xem được 3D | T04 |
| AC-17 | Click các loại thiết bị đại diện và chọn từ danh sách | Đúng hồ sơ, ID, cấp đo, cảm biến, đơn vị và mốc thời gian theo IOT | T01/T02 |
| AC-18 | Mẫu IoT hợp lệ, stale, thiếu và inverter lỗi nhưng online | Phân biệt vận hành với dữ liệu; không thay thiếu bằng 0 hay kết luận lỗi thiết bị chỉ vì mất tín hiệu | T02 |
| AC-19 | Sự kiện mới phát sinh, chưa gửi câu hỏi | Có phân tích chủ động, đúng thiết bị/dữ kiện, không lặp gọi API theo mỗi mẫu; đường lỗi được ghi đúng | T03 |
| AC-20 | Hỏi về thiết bị đang chọn rồi chuyển thiết bị | Câu trả lời giữ đúng ID/mốc gốc; không biến dữ liệu thiết bị cũ thành thông tin của thiết bị mới | T03 |
| AC-21 | So sánh chưa xử lý/có phương án ở cùng thời đoạn | Nhất quán cảnh 3D, công suất và MWh; không khôi phục vượt đối chứng; không tuyên bố lợi nhuận chưa tính chi phí | T02 |

Đây là tiêu chí cần kiểm tra, chưa phải kết quả đã đạt. Test tự động bao phủ phép tính/trạng thái; kiểm tra trình duyệt bao phủ trải nghiệm. Không yêu cầu test tự động cho từng câu chữ trong tài liệu.

## Các lựa chọn còn mở

1. Đã chốt: giám đốc nhà máy/đội vận hành là người xem chính.
2. Đã chốt: khám phá nhà máy, mô phỏng/so sánh phương án; AI hội thoại và chủ động hỗ trợ quyết định.
3. Đã chốt: 3 preset mây che/bám bụi/lỗi inverter + tự cấu hình đơn giản + kết quả trong 3D + click thiết bị có dữ liệu IoT giả lập. Các tham số và danh mục thiết bị cụ thể là đề xuất triển khai cần review.
4. Mức mô phỏng cần thiết: đủ kể câu chuyện hay cần gần cấu hình một nhà máy cụ thể. Mặc định hiện tại là minh họa có quy luật.
5. Nhận diện và liên hệ thật; có thể bổ sung sau, không cần tạo dữ liệu giả.

Các lựa chọn chưa xác nhận tiếp tục được review trước T01; không hỏi lại yêu cầu 3 preset, màn hình tự cấu hình và 3D đã được người dùng xác nhận. Chưa coi đề xuất mở rộng là yêu cầu đã chốt; cập nhật TASKS/DESIGN nếu lựa chọn mới làm đổi phạm vi.
