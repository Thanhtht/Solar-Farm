# Module Thống kê — giao diện và so sánh kỳ

## Review biểu đồ miền — 05/11/2026

Hai chart đứng cạnh nhau trên desktop: Sản lượng thực tế & kỳ vọng theo thời tiết (MWh AC), và Hiệu suất theo ngày (%). Trên mobile/tablet nhỏ xếp dọc. Miền tô gradient nhẹ, ít nhãn ngày/chấm hơn, hover/focus hiện số liệu; cả hai dùng cùng dữ liệu và lựa chọn ngày, hỗ trợ Enter/Space. Phần So sánh kỳ nằm ở hàng riêng bên dưới.

Miền và đường thực tế/hiệu suất ngắt tại ngày không có dữ liệu, không nối qua khoảng thiếu hay vẽ thành 0. Điểm rỗng biểu thị phần dữ liệu chưa đầy đủ; một ngày vẫn có miền hẹp/điểm để đọc giá trị. Trục hiệu suất bắt đầu từ 0%, giữ giá trị >100% nếu có; tỷ lệ vẫn dùng tổng năng lượng trên cùng phần có dữ liệu, không đổi công thức.

Chú giải nêu rõ **Kỳ vọng theo thời tiết**: tham chiếu nhánh khỏe trong bức xạ/nhiệt độ của mỗi ngày. Công suất AC tối đa 40 MW là giới hạn tức thời; năng lượng ngày là tích phân MW theo giờ. Ví dụ 40 MW giữ đủ 12 giờ là 480 MWh, chỉ là trần giả định cho 12 giờ, không phải dự báo đạt được mỗi ngày. Giữ quyết định kỳ vọng đã chốt, không tự đổi mẫu số sang công suất tối đa hay tăng Thiếu hụt do thiếu nắng.


## Review 05/11 — Dropdown thời gian và phạm vi (hiện hành)

Review chỉ số/sự kiện tiếp theo: ba card Sản lượng thực tế, Thiếu hụt, Hiệu suất xếp dọc trong cột gọn bên trái; khung Sự kiện cần chú ý ở bên phải, có tổng số và cuộn riêng. Cả hai vẫn nằm dưới hàng điều khiển, phía trên 3D. Sản lượng dùng xanh nước biển, Thiếu hụt đỏ; Hiệu suất lấy màu từ cùng `heatmapColor`/tỷ lệ tổng hợp đang xem như heatmap 3D, thiếu dữ liệu dùng xám. Viền/nền mang màu thang, chữ số pha đậm để đọc rõ.

Sự kiện lọc đồng thời theo ngày/khoảng **và cụm đang chọn**; Toàn nhà máy mới hiển thị các cụm. Chọn từ dropdown, 3D, bảng hoặc bấm một sự kiện đều cập nhật cùng phạm vi; bộ đếm đếm đúng danh sách sau lọc. Không có sự kiện thì hiện trạng thái rỗng. Giữ đủ sự kiện trong phạm vi, không giới hạn số bản ghi để làm khung ngắn.


Theo ảnh review mới: thứ tự desktop **Phạm vi → Xem theo → timeline hoặc chọn khoảng**, cùng một hàng; màn hình hẹp giữ hai dropdown cạnh nhau và đưa phần thời gian xuống hàng riêng. Bỏ dải tên phạm vi/chất lượng/độ phủ dưới bộ lọc; thông tin chất lượng vẫn có ở bảng và chi tiết.

Thang màu chuyển vào bên phải trong khung 3D dưới dạng thanh dọc, giá trị cao ở trên/thấp ở dưới. Giữ thang hiệu suất cố định và sản lượng tối đa 45 MWh/cụm/ngày × số ngày; đơn vị MWh AC rõ. Nút thông tin nhỏ mở giải thích xám/viền nâu/thang màu. Không còn thanh ngang chiếm hàng riêng bên dưới. Cảnh 3D dùng phần chiều cao được giải phóng.

Composer AI theo ảnh tham khảo: textarea có nền/viền riêng, nút gửi đứng riêng bên phải và căn phía dưới, gợi ý phím ngay dưới. Không có viền chung bao cả nút; giữ Enter/Shift+Enter, ngữ cảnh và các luồng gửi hiện có.

“Xem theo” là dropdown Theo ngày/Khoảng thời gian. Bộ chọn Phạm vi nằm ngay cạnh trong cùng hàng, tự xuống dòng trên màn hình nhỏ. Chỉ hiển thị điều khiển tương ứng: timeline/ngày đang xem hoặc ô khoảng ngày/preset. Bỏ ngày/khoảng lặp trong dải trạng thái bên dưới, giữ tên cụm và chất lượng dữ liệu.

Chat có thể hỏi rõ tháng/cụm khác lựa chọn trên màn hình; nhãn nguồn từng tin phản ánh khoảng và cụm thực sự được phân tích. Không đổi bộ lọc/camera chỉ vì gửi câu hỏi. Chi tiết quy ước tháng tại AI.md.

## Review trước: hai hàng thời gian (được thay bởi dropdown)

Tên module công khai là Thống kê; bỏ tiêu đề Hiệu suất trong khung. Theo ngày và Trong khoảng xếp dọc: slider chỉ ở bên phải Theo ngày, đầu/cuối nằm sát hai phía của slider, ngày đang xem ở phía trên. Trong khoảng có một ô tóm tắt ngày đầu–cuối luôn hiển thị; bấm ô để tùy chỉnh và Áp dụng, preset cập nhật chính ô này. Dữ liệu lấy từ khoảng đã áp dụng; ô vẫn hiện cả hai ngày nếu đầu=cuối. Dải giá trị bên dưới dùng nhãn Sản lượng thực tế và Hiệu suất. Hiệu suất hiện vẫn là tỷ lệ so kỳ vọng như trước, chỉ đổi nhãn.

Sự kiện cần chú ý nằm ngay dưới giá trị: chỉ đúng ngày đang chọn, hoặc tất cả ngày trong khoảng. Không còn giới hạn bốn mục hay gộp mất sự kiện các ngày khác; có tổng số và vùng cuộn để giữ khung gọn. Đây vẫn là metadata tình huống mô phỏng, không phải bộ phát hiện bất thường.

AI dùng chung AssistantHeader và các lớp panel/message/composer, icon và kiểu tin nhắn với hai module cũ; vẫn giữ phiên lịch sử riêng. Mobile giới hạn chiều cao chat thay vì để panel kéo dài rỗng.

**Đã chốt theo trả lời của người dùng:** giữ cơ sở sản lượng kỳ vọng theo bức xạ và nhiệt độ từng ngày, chỉ đổi cách hiển thị. Card dùng nhãn “Thiếu hụt”, có chú thích cơ sở so sánh qua tooltip và nhãn trợ năng. Giữ nguyên shortfallMWh và hiệu suất, chỉ so phần dữ liệu hợp lệ; không quy đổi sang giới hạn công suất AC danh định.


## Bố cục gọn theo ảnh review 05/11 — hiện hành

Một khung chung bên trái chứa tiêu đề/chế độ/ngày/phạm vi, dải ba chỉ số, timeline và heatmap. Không còn panel tiêu đề và ba card tách riêng phía trên. Đổi Sản lượng/Đạt kỳ vọng và reset camera là lớp điều khiển bên trong cảnh. Desktop có cột AI 360/380px bên phải; tablet nhỏ/mobile xếp AI dưới bản đồ. Chiều cao bản đồ theo viewport để ô nhập chat xuất hiện trong màn hình đầu 1440×900. Dải chỉ số có đường phân chia, không dùng ba card lớn. Diễn biến là phần mở theo yêu cầu ở chân khung; chi tiết/bảng/chart/so sánh nằm dưới workspace. Chat tự cuộn tới phản hồi mới, không đổi lịch sử hoặc API. Bố cục này thay các mô tả trước về 3D toàn chiều ngang và AI dưới cảnh.

## Điều chỉnh 05/11 — xem ngày và trợ lý lịch sử

Mặc định Từng ngày, phạm vi toàn tháng, chọn hôm qua; slider nằm ngay sát cảnh trong panel 3D. Từng ngày luôn dùng toàn bộ cửa sổ, kể cả khi chọn điểm biểu đồ hoặc nút diễn biến. Tổng hợp khoảng ngày có preset/lịch tùy chọn, không có slider. Trợ lý AI lịch sử là phiên thứ ba độc lập: mỗi tin có nhãn nguồn ngày/khoảng/cụm; đổi nguồn hoặc module hủy yêu cầu chờ. Có nút Phân tích lựa chọn và chat, không tự gọi Gemini mỗi lần kéo slider. Máy chủ dựng lại dữ kiện theo cửa sổ ngày hiện tại, không tin summary trình duyệt; dùng chung giới hạn API hiện có, không có tool mô phỏng. Thiếu cấu hình/lỗi/timeout có thông báo, không giả phản hồi AI.

Các mục cũ về mặc định 7 ngày hoặc chưa có AI lịch sử dưới đây được thay thế bởi đoạn này.

## Review UX ngày 05/11/2026 — thay bố cục ban đầu

- Một khu vực thời gian chính: preset, lịch tùy chọn chỉ khi bấm Tùy chọn, timeline ngay trong cùng khối. Bỏ dropdown chọn ngày lặp lại; biểu đồ vẫn có thể chọn ngày đồng bộ như lối tắt.
- Heatmap toàn chiều ngang, cao 65vh (470–760px desktop), 420px mobile; cách vừa khung riêng cho lịch sử dùng minimumAspect 1,2 thay 1,45 để phóng lớn nhà máy trên màn hình dọc. Không đổi góc/lens của Hiện trạng/Mô phỏng.
- Ba chỉ số chính: sản lượng ghi nhận, thiếu hụt so kỳ vọng và tỷ lệ đạt kỳ vọng. Độ phủ chuyển vào nhãn dữ liệu và chi tiết. Chi tiết thu gọn mặc định, mở khi chọn cụm; so sánh kỳ là phần mở theo nhu cầu, không bày thêm lịch đối chiếu ngay khi vào trang.
- Nút Khám phá diễn biến lấy trực tiếp metadata tình huống trong khoảng đang xem; bấm đưa tới đúng ngày/cụm. Không phải thuật toán phát hiện bất thường. Dải nút cuộn ngang trên mobile để không đẩy cảnh xuống quá xa.
- Model daily-history-v2 bổ sung bụi tăng dần/vệ sinh ở PV-04, nhánh DC suy giảm/phục hồi PV-07 và giới hạn công suất bảo vệ lúc nóng tại PV-06. Nhánh khỏe vẫn gần 99%; không làm xấu số liệu khỏe để tăng độ tương phản. Mọi cửa sổ 7 ngày đều có nhánh khỏe và nhánh thấp hơn 95%, chênh trên 5 điểm %.
- Thang tỷ lệ cố định mới 0/70/85/95/100+%; chú giải và vật liệu dùng cùng các mốc. Không co giãn màu theo dataset. Giữ xử lý thiếu dữ liệu/0/kỳ vọng cùng phần quan sát.

Các mô tả bố cục ban đầu bên dưới là lịch sử; phần review này được ưu tiên khi có khác biệt. Phát hiện bất thường vẫn pending.

Luồng mới nằm ngang hàng **Hiện trạng | Mô phỏng | Hiệu suất**. Dùng bộ dữ liệu [HISTORY_DATA](HISTORY_DATA.md), giữ các quyết định và backlog ở [PERFORMANCE_HISTORY](PERFORMANCE_HISTORY.md). Đây vẫn là dữ liệu mô phỏng; không có API lịch sử/IoT mới hoặc AI lịch sử.

## Phạm vi thời gian

- Mặc định mở 7 ngày đã kết thúc. Các preset 1/3/7 ngày và Tất cả kết thúc hôm qua ở UTC+7. Tất cả là toàn bộ một tháng dữ liệu sẵn có.
- Có thể chọn một ngày bằng cách đặt ngày đầu = ngày cuối, hoặc chọn khoảng bất kỳ. Form có min/max, kiểm tra hôm nay/tương lai/ngoài cửa sổ/ngược thứ tự và giữ kết quả đã áp dụng khi form chưa hợp lệ.
- Chọn khoảng → mặc định **Toàn khoảng**. Timeline có bước 1 ngày, nút ngày trước/sau và danh sách ngày thay thế. Chọn điểm biểu đồ bằng chuột/Enter/Space cũng chọn ngày tương ứng. Nút Toàn khoảng quay lại tổng hợp.
- KPI, chi tiết, heatmap, bảng cụm và kỳ chính của phần so sánh cùng theo ngày hoặc toàn khoảng đang xem. Biểu đồ giữ toàn khoảng đã chọn và đánh dấu ngày để không mất ngữ cảnh xu hướng.
- Dữ liệu khởi tạo ở browser khi lần đầu mở module, tránh lệch ngày giữa prerender/server và hydration. Khi qua nửa đêm UTC+7 hoặc quay lại tab/cửa sổ, kiểm tra lại lịch. Preset dịch theo hôm qua mới; khoảng tùy chọn giữ phần còn nằm trong cửa sổ, hoặc về một ngày mới nhất nếu không còn giao nhau. Các giới hạn chọn ngày cập nhật cùng nguồn.

## Heatmap 3D

- Tô vật liệu PV_CELLS của đúng 8 cụm, dùng model/topology/camera có sẵn. Mỗi cụm nhận MWh AC từ inverter tương ứng; không tự nhận số liệu của từng tấm pin.
- Hai chế độ: **Sản lượng · MWh** và **Đạt kỳ vọng · %**, mặc định tỷ lệ kỳ vọng. Giá trị null tô xám, khác 0 hợp lệ. Tooltip có chỉ số/chất lượng/độ phủ. Cụm có dữ liệu một phần dùng viền nâu khi chưa chọn; cụm đang chọn có viền xanh và nhãn ID.
- Tỷ lệ dùng thang cố định 0/50/80/95/100+% với đỏ đất/cam/vàng/ngọc/xanh. Màu mô tả tỷ lệ, không sinh cảnh báo hay nhận định tự động. Giá trị trên 100% vẫn giữ số thực; màu dừng ở đầu 100+.
- Sản lượng dùng thang 0 → 45 × số ngày đang xem MWh/cụm, không tự co giãn theo min/max của dataset. Vì vậy cùng sản lượng bình quân/ngày nhận cùng màu qua các khoảng khác độ dài. Thang được ghi rõ ở chú giải.
- Chọn cụm bằng 3D, dropdown hoặc bảng để đổi chi tiết/KPI/biểu đồ/so sánh. Đổi ngày/chỉ số không reset camera. Có nút về tổng quan. Thiết bị khác cụm pin giữ hình học tham chiếu; click không mở hồ sơ hiện trạng trong module lịch sử.
- Không vẽ dòng điện tức thời hoặc viền cảnh báo của snapshot Hiện trạng trong lịch sử. Nếu WebGL không khả dụng, dropdown/bảng/ngày/biểu đồ và so sánh vẫn sử dụng được.

## Dashboard và dữ liệu thiếu

Ba chỉ số chính: sản lượng ghi nhận, thiếu hụt so kỳ vọng trên phần biết và tỷ lệ so kỳ vọng cùng phần dữ liệu. Độ phủ và kỳ vọng đầy đủ/cùng phần quan sát nằm ở nhãn dữ liệu, bảng và chi tiết. Khi thiếu, ghi rõ sản lượng một phần và mẫu số dùng phần dữ liệu đối chiếu hợp lệ. Chi tiết có chênh lệch MWh trên phần biết; không gọi phần chưa đo là tổn thất.

Biểu đồ thể hiện ghi nhận và kỳ vọng toàn ngày, dùng điểm rỗng cho dữ liệu một phần/thiếu; đường ghi nhận ngắt tại ngày không có dữ liệu. Trường hợp một ngày vẫn có điểm actual/expected riêng. Bảng đủ 8 cụm, có chất lượng và độ phủ. “Diễn biến mô phỏng” trong chi tiết là metadata tình huống đã dựng, không phải thuật toán phát hiện bất thường.

## So sánh kỳ

- Mặc định đối chiếu kỳ liền trước có cùng số ngày với thời đoạn đang xem; khi chọn một ngày thì so ngày trước đó. Giữ cùng lựa chọn toàn nhà máy/cụm.
- Cho phép chọn kỳ đối chiếu tùy ý trong cửa sổ dữ liệu. Hai cột hiển thị ngày, số ngày, tổng ghi nhận, bình quân/ngày, tỷ lệ đạt kỳ vọng và độ phủ.
- Kỳ khác số ngày được ghi rõ và dùng bình quân MWh/ngày để tính % thay đổi. Tỷ lệ đạt kỳ vọng so bằng điểm phần trăm.
- Nếu một trong hai kỳ có dữ liệu chưa đủ: vẫn cho đọc phần ghi nhận và tỷ lệ trên phần hợp lệ, nhưng không tính % thay đổi sản lượng. Nếu mẫu số sản lượng kỳ đối chiếu bằng 0 hoặc tỷ lệ không xác định thì chênh lệch tương ứng là —.
- Nếu kỳ liền trước vượt ra ngoài tháng dữ liệu, báo không đủ và cho chọn kỳ khác; không cắt ngắn hoặc tự sinh thêm lịch sử để làm phép so sánh.
- Không suy ra nguyên nhân lỗi thiết bị từ chênh lệch sản lượng giữa các thời tiết khác nhau.

## Cách ly module và thao tác

- Giữ bộ lọc/ngày/cụm/chỉ số/kỳ đối chiếu của lịch sử khi đổi module. Hiện trạng/Mô phỏng tiếp tục giữ nguồn, cấu hình/kết quả, lựa chọn và hai hội thoại riêng.
- Chỉ một cảnh WebGL được mount ở module đang mở; đổi module khởi tạo lại camera cảnh đó để tránh giữ hai renderer hoạt động cùng lúc. Đổi ngày hoặc chỉ số bên trong lịch sử không remount cảnh.
- Khi rời sang Hiệu suất, hủy/invalidate request AI đang chờ và tắt phân tích chủ động ở panel ẩn; giữ hội thoại đã có và bản nháp. Lệnh cũ không được áp dụng khi quay về Mô phỏng. Không gửi context lịch sử vào một trong hai phiên AI hiện có.
- Điều hướng ba tab hỗ trợ ←/→ vòng qua ba module, Home về Hiện trạng, End tới Hiệu suất. Các form/slider/bảng/điểm biểu đồ có nhãn và thao tác bàn phím. Có bố cục desktop/tablet/mobile và fallback không WebGL.

## Kiểm tra

- `npm run test:history`: dữ liệu/phép tính, thang màu, kỳ đối chiếu khác độ dài và chất lượng dữ liệu.
- `npm run test:e2e -- tests/performance-ui.spec.ts`: preset/tùy chọn, ngày bị khóa, timeline/chart đồng bộ KPI, 0/thiếu, so sánh, vật liệu 3D/picking/camera, cách ly module, đổi lịch, responsive/fallback, lệnh AI muộn và chạm trên heatmap thật.
- `npm run typecheck`, `npm run build`, `npm run test:e2e`: kiểm tra kiểu, production build và hồi quy toàn bộ. Kết quả thực tế và giới hạn bằng chứng được ghi ở [STATUS](STATUS.md).

Chưa nghiệm thu Safari/Firefox, bàn phím ảo/IME hoặc thiết bị cảm ứng thật; Playwright Chromium cóTouch không thay thế thiết bị thật. Phát hiện bất thường vẫn **PENDING**, không bỏ khỏi backlog. Không tự push/deploy khi chỉ triển khai cục bộ.
