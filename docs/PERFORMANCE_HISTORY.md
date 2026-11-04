# Module Hiệu suất — ghi nhận yêu cầu và khảo sát dữ liệu

Ngày ghi nhận: 04/11/2026, múi giờ người dùng Asia/Bangkok (UTC+7).
Trạng thái: đã triển khai cả ba mốc, typecheck/build và 87/87 bài hồi quy qua. Công thức, API và bảng xem trước tại [HISTORY_DATA](HISTORY_DATA.md); cách dùng và giới hạn UI tại [HISTORY_UI](HISTORY_UI.md). Chưa nghiệm thu trên thiết bị thật hoặc deployment mới; không có API lịch sử mới. Phát hiện bất thường giữ pending.

## Nguồn khảo sát

- GitHub: Thanhtht/Solar-Farm, nhánh main tại `f1c10b3a21bd0b5f3251ba37635fd675f900b30f`.
- Checkout của phiên khảo sát: `218413a8a4bac0af2289f6fd9c50541af72e594f`, sạch trước khi ghi tài liệu. GitHub mới hơn 5 commit; đã đọc tài liệu hiện hành trên GitHub và đối chiếu diff. Các file dữ liệu/bộ tính/cảnh/dashboard nêu dưới không đổi giữa hai mốc.
- Đọc registry `src/data/plant.ts`, `src/lib/monitoring.ts`, `src/lib/monitoring-metrics.ts`, `src/lib/simulation.ts`, `src/lib/scenario-simulation.ts`, dashboard/cảnh/material và tài liệu sản phẩm/thiết kế/IoT/mô phỏng/hiện trạng/trạng thái/task.
- Đây là kết quả khảo sát mã nguồn; không phải xác minh dữ liệu hoặc database ngoài repo, không phải nghiệm thu chức năng lịch sử đã chạy.

## Quyết định người dùng đã chốt

1. Tạo module riêng ngang hàng Hiện trạng và Mô phỏng; không ghép luồng lịch sử vào Hiện trạng. Tên đề xuất: **Hiệu suất**; tên chưa được chốt.
2. Heatmap có hai chỉ số: **Sản lượng** và **Hiệu suất so với kỳ vọng**.
3. Một mốc trên timeline tương ứng **một ngày**, không chọn giờ/phút trong quá khứ. Khoảng thời gian là từ ngày đến ngày; cho phép chọn tự do.
4. Preset tính theo ngày hôm nay và kết thúc vào hôm qua. Nếu hôm nay 04/11/2026: 1 ngày = 03/11; 3 ngày = 01/11–03/11; 7 ngày = 28/10–03/11. Khoảng ngày tính cả hai đầu. All Time lấy từ ngày đầu có dữ liệu đến hôm qua.
5. Giữ yêu cầu chú giải/đơn vị/thang màu, trạng thái thiếu dữ liệu khác 0, chi tiết theo cụm, ánh xạ cấp đo, đồng bộ ba thành phần và so sánh các khoảng thời gian.
6. **Phát hiện bất thường: PENDING, chưa làm trong đợt này. Giữ hạng mục để người dùng quyết định sau, không xóa và không coi là điều kiện hoàn tất bản đầu.**
7. Người dùng xác nhận tạo dữ liệu lịch sử mô phỏng trong **một tháng trước ngày hiện tại**, đủ đa dạng để khám phá các tình huống. Quy ước triển khai đề xuất: từ cùng ngày của tháng trước đến hôm qua, không phải tháng dương lịch trước; với hôm nay 04/11/2026 là 04/10–03/11/2026 (31 ngày). Khi tháng trước thiếu ngày tương ứng, lấy ngày cuối tháng đó. Khoảng dữ liệu tiến theo ngày thực tế ở UTC+7.
8. **Không cho chọn hôm nay**, áp dụng cả lịch tùy chọn và preset; ngày tương lai cũng không có trong lịch sử. Ngày bắt đầu không trước đầu cửa sổ dữ liệu, ngày kết thúc không sau hôm qua.
9. Người dùng đồng ý cấu trúc ba module và định nghĩa chỉ số đề xuất: MWh AC theo nhánh, tỷ lệ tổng actual/tổng expected cùng thời đoạn, xử lý thiếu dữ liệu và kỳ vọng bằng 0 như bên dưới.

## Dữ liệu thực sự đang có

- Nhà máy hư cấu 50 MWp DC, giới hạn 40 MW AC; 8 cụm 6,25 MWp, 8 inverter 5 MW AC, 1 trạm thu gom, 1 trạm thời tiết và 1 gateway: tổng 19 thiết bị, hai khu A/B.
- Quan hệ PV-01 → INV-01 … PV-08 → INV-08 → TR-01 đã có. Các tấm lặp trong 3D đại diện cho cụm; không có đo lường riêng từng tấm.
- Có công suất DC/AC, bức xạ, nhiệt độ, gió, mã lỗi, heartbeat, timestamp và quality valid/stale/invalid/missing. Dữ liệu được sinh trong mã cho demo, không có kết nối SCADA/IoT thật.
- Hiện trạng được tạo cố định ngày 02/11/2026, 10:00–10:30 ICT, 31 mẫu cách nhau một phút. Sản lượng 15,7248 MWh chỉ thuộc cửa sổ 30 phút; không phải sản lượng cả ngày. Cuối cửa sổ 30,1536 MW.
- Bộ tổng hợp có tham chiếu khỏe mạnh cùng bức xạ/cấu hình và phép tích phân năng lượng. Tham chiếu cửa sổ này là 16,8192 MWh; chênh lệch 1,0944 MWh.
- INV-03 dừng từ 10:15; nhánh 06 giảm 2% từ 10:20. Đây là dữ kiện fixture hiện trạng, không được tự suy rộng thành lịch sử sự cố nhiều ngày.
- Chưa có nguồn lịch sử nhiều ngày, bảng tổng hợp ngày/tháng hoặc kho dữ liệu lịch sử trong repo. API ứng dụng hiện có chỉ phục vụ AI.
- Mô phỏng dùng điều kiện nền hằng; thời lượng 24 giờ trong kịch bản không có chu kỳ ngày/đêm. Không lấy công suất 10:30 nhân 24 để tạo sản lượng ngày.
- Mô hình 3D đã clone material theo thiết bị và có vật liệu PV_CELLS. Có thể tái sử dụng cho heatmap; hiện chưa có lớp tô màu theo sản lượng/hiệu suất.

## Định nghĩa chỉ số đã được đồng ý

Người dùng đồng ý cách tính chỉ số; các tham số cụ thể của mô hình kỳ vọng, quality và thang màu vẫn cần đặc tả khi triển khai.

- Sản lượng: MWh AC của nhánh inverter tương ứng, hiển thị trên cụm PV; tooltip ghi rõ cấp số liệu. Tổng nhà máy = tổng các nhánh AC, không cộng thêm TR-01 hoặc cộng lẫn DC và AC.
- Hiệu suất so với kỳ vọng = sản lượng ghi nhận / sản lượng kỳ vọng × 100%, cùng nhánh, cùng thời đoạn và cùng cơ sở điều kiện môi trường. Không dùng hằng số hiệu suất chuyển đổi inverter 0,96 làm tỷ lệ này; không dùng nền đã có lỗi của kịch bản làm kỳ vọng khỏe mạnh.
- Khoảng nhiều ngày hoặc nhiều cụm: cộng tử số và mẫu số rồi chia, không trung bình cộng các tỷ lệ phần trăm.
- Kỳ vọng bằng 0 hoặc thiếu dữ liệu đối chiếu: tỷ lệ không xác định; không hiển thị 0% hoặc 100% giả. Cho phép biểu diễn trên 100% nếu nguồn/mô hình cho kết quả đó.
- Thiếu dữ liệu: lưu mức độ đầy đủ và phân biệt số liệu một phần với cả ngày. Nếu tính tỷ lệ trên phần có dữ liệu thì actual/expected phải dùng đúng các khoảng hợp lệ trùng nhau; không so actual thiếu với expected cả ngày.
- Thang màu có số và đơn vị; giữ nhất quán khi so sánh các ngày/kỳ tương đương. Ngưỡng màu mô tả giá trị, chưa phải quy tắc tự kết luận bất thường.

## Đề xuất luồng sử dụng

- Điều hướng: Hiện trạng | Mô phỏng | Hiệu suất. Module lịch sử giữ bộ lọc, cụm đang chọn và dữ liệu riêng; đổi ngày không sửa nguồn hiện trạng hoặc phiên mô phỏng.
- Bộ lọc: 1 ngày / 3 ngày / 7 ngày / Tất cả / Tùy chọn; bộ chọn ngày bắt đầu–kết thúc; bộ chọn chỉ số heatmap.
- Sau chọn khoảng: mặc định xem **Toàn khoảng**, heatmap và KPI tổng hợp cả khoảng, biểu đồ thể hiện diễn biến theo ngày.
- Timeline bước một ngày cho phép xem một ngày bên trong khoảng. Khi đang xem ngày, heatmap/KPI/đánh dấu biểu đồ phải ghi rõ ngày được chọn; có thao tác quay lại Toàn khoảng. Đây là tương tác đề xuất, chưa là quyết định UX đã duyệt.
- Một ngày thì không cần timeline theo giờ. Bản đầu chỉ có một tháng dữ liệu nên biểu đồ giữ độ chi tiết ngày; All Time là toàn cửa sổ một tháng, không tự thêm biểu đồ quý/năm.
- Chọn cụm để xem sản lượng, kỳ vọng, tỷ lệ, chênh lệch, thời đoạn và mức đầy đủ dữ liệu. Bảng/danh sách là cách chọn thay thế khi khó thao tác 3D.
- So sánh kỳ: đề xuất mặc định kỳ liền trước có cùng số ngày, cho phép chọn kỳ đối chiếu. Hiển thị rõ độ dài kỳ; nếu khác độ dài cần thêm số bình quân/ngày hoặc suất phát điện. Không suy ra suy giảm thiết bị chỉ từ chênh lệch sản lượng do thời tiết.
- Không biểu diễn dòng công suất tức thời đang chạy như số đo của cả ngày. Lớp heatmap cần phân biệt với màu trạng thái hiện tại; không đưa cảnh báo fixture của 10:30 sang các ngày khác.
- AI lịch sử chưa được người dùng yêu cầu. Nếu bổ sung sau phải có ngữ cảnh lịch sử riêng; không mặc định đưa dữ liệu lịch sử vào một trong hai hội thoại hiện có.

## Phần cần làm thêm

1. Nguồn lịch sử mô phỏng một tháng theo yêu cầu người dùng, độc lập khỏi Hiện trạng/Mô phỏng. Bộ sinh lịch sử xác định theo ngày/asset/seed, có quy luật ngày đêm và điều kiện môi trường; ghi nhãn mô phỏng ở cấp trang. Chưa có dữ liệu thật để nhập. Cùng một ngày/thiết bị phải giữ nguyên dữ liệu khi cửa sổ dịch sang ngày mới.
2. Bản ghi ngày tối thiểu: date, assetId, actualEnergyMWh, expectedEnergyMWh, coverage/quality, source, modelVersion. Múi giờ nhóm ngày lấy từ cấu hình nhà máy; nhà máy demo UTC+7. Chốt nghĩa của coverage và phiên bản baseline khi triển khai.
3. Bộ tổng hợp ngày/khoảng/nhà máy, tính tỷ lệ có trọng số và đối chiếu kỳ. Nguồn dữ liệu → tổng hợp → 3D/KPI/chart dùng cùng kết quả.
4. Trang/module riêng và cơ chế chọn thời gian theo ngày; preset neo theo ngày hiện tại ở múi giờ nhà máy, không neo theo snapshot 02/11 hoặc giờ UTC của máy chủ.
5. Heatmap theo cụm, chú giải, tooltip/chi tiết; xử lý 0/thiếu/một phần/kỳ vọng bằng 0; không lan material sang hai module khác.
6. Dashboard và tương tác đồng bộ, so sánh kỳ; tổng hợp khoảng dài có cache hoặc dữ liệu gộp phù hợp thay vì tải toàn bộ telemetry theo phút.
7. Khi có code: kiểm tra ranh giới tháng/năm và múi giờ, preset kết thúc hôm qua, tùy chọn ngày/khoảng, tổng năng lượng/tỷ lệ, quality, ánh xạ 8 nhánh, cách ly ba module và thao tác 3D/biểu đồ/mobile/bàn phím. Chưa chạy các test này vì chưa triển khai.

## Điểm chưa chốt

- Tên module chính thức; quy ước một tháng theo lịch ở trên là giả định triển khai được nêu rõ, chưa có yêu cầu cố định 30 ngày.
- Chuẩn kỳ vọng chi tiết, phạm vi điều chỉnh thời tiết, ngưỡng chất lượng dữ liệu và màu heatmap. Nguồn thực tế/SCADA là mở rộng sau nếu có, không coi đã tích hợp.
- Bố cục/luồng so sánh cụ thể; khả năng AI lịch sử nếu người dùng muốn bổ sung.

## Đề xuất mốc thực hiện tiếp theo

### Mốc 1 — bộ dữ liệu lịch sử và phép tính

- Đặc tả và tạo nguồn mô phỏng một tháng cho 8 nhánh. Tình huống có diễn biến liên tục và phục hồi: ngày nắng/mây thay đổi, khác biệt giữa các khu, bám bụi tăng dần và vệ sinh, inverter dừng một phần ngày rồi khôi phục, dữ liệu gián đoạn ở một số khoảng.
- Dữ liệu đủ phong phú nhưng vẫn có ngày hoạt động bình thường làm đối chiếu. Tham số/seed cố định theo ngày và thiết bị; không tạo số ngẫu nhiên riêng cho KPI/chart/3D hoặc đổi dữ liệu của ngày cũ khi tải lại.
- Kỳ vọng khỏe mạnh dùng cùng điều kiện môi trường/ngày đêm với actual; bụi và dừng thiết bị là tác động lên actual. Ngày nhiều mây có thể ít sản lượng nhưng vẫn đạt kỳ vọng; không tạo quan hệ giả giữa ít nắng và thiết bị kém hiệu suất.
- Có thể tính theo bước dưới ngày trong bộ sinh để ra sản lượng ngày, nhưng UI chỉ chọn ngày. Chất lượng dữ liệu và diễn biến tình huống nằm trong cùng nguồn; metadata tình huống mô phỏng không phải thuật toán phát hiện bất thường.
- Kiểm tra tổng nhánh/nhà máy, tỷ lệ theo khoảng, ngày thiếu/0, preset và biên tháng/năm/múi giờ, tính ổn định khi cửa sổ dịch. Bàn giao bảng dữ liệu tổng hợp và mô tả các tình huống trước khi gắn UI.

### Mốc 2 — module Hiệu suất

- Bộ lọc 1/3/7 ngày, Tất cả và Tùy chọn trong cửa sổ dữ liệu; khóa hôm nay/tương lai.
- Heatmap hai chỉ số, timeline từng ngày, KPI/biểu đồ/chi tiết cụm đồng bộ; phân biệt Toàn khoảng và ngày đang xem.
- Xử lý thiếu dữ liệu, chú giải màu và điều hướng ba module độc lập.

### Mốc 3 — so sánh kỳ và nghiệm thu

- So sánh trong phạm vi dữ liệu hiện có; không sinh thêm tháng lịch sử chỉ để đủ kỳ đối chiếu. Nếu kỳ trước vượt cửa sổ thì báo không đủ dữ liệu; không so một kỳ bị cắt ngắn như thể cùng độ dài.
- Kiểm tra tương tác, responsive/bàn phím, tính nhất quán số liệu và hồi quy Hiện trạng/Mô phỏng. Giữ phát hiện bất thường pending.

Người dùng đã yêu cầu triển khai cả mốc 2 và 3 sau mốc 1. Giao diện và so sánh đã có tại [HISTORY_UI](HISTORY_UI.md); bằng chứng kiểm tra và giới hạn tại [STATUS](STATUS.md). Các mục khảo sát dữ liệu hiện trạng ở trên mô tả nguồn cũ, không thay thế nguồn lịch sử mới.

## Backlog giữ lại: phát hiện bất thường — PENDING

- Nhận diện ngày/khu vực có tỷ lệ thấp hoặc khác biệt so với kỳ vọng/nhóm tương đồng; có bằng chứng, thời đoạn, mức độ đầy đủ dữ liệu.
- Cần quyết định quy tắc/đường cơ sở, ngưỡng và thời gian kéo dài, cách xét thời tiết/bảo trì/mất kết nối, mức độ thông báo và hành động.
- Chưa tạo thuật toán, cảnh báo tự động hoặc tuyên bố chẩn đoán trong phạm vi module bản đầu. Người dùng sẽ xem xét sau; mục này phải được giữ khi chia task/bàn giao.
