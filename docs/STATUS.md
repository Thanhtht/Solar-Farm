# Trạng thái bàn giao

## 06/11/2026 — popup danh sách thiết bị có thông số trong khung 3D

- Thay danh sách nằm dưới cảnh bằng native dialog định vị trong sceneFrame, cuộn riêng, resize/scroll theo khung, tìm mã/tên/khu vực và lọc trạng thái. Nút mở ở chân cảnh nổi xanh đậm, icon/chữ lớn hơn, cao 44px; header mở cùng popup. X/Esc đóng, focus giữ trong modal và trả về nút mở; chọn thiết bị đóng danh sách, focus camera/HUD hiện hành.
- Dòng thiết bị có mã/tên/khu vực/danh định, mức vận hành, tín hiệu/đơn vị, IoT, thời điểm cập nhật và lý do vấn đề. Đọc trực tiếp assets của snapshot hiện tại; giữ viền xanh/vàng/đỏ đã chốt, null/invalid/missing không thành 0, stale có nhãn, mã lỗi inverter đổi sang trạng thái dễ hiểu.
- Kiểm tra: typecheck/build Webpack, Prettier và diff-check qua. Lượt hồi quy đầu 7/8 bài qua (AI offline, camera/chọn thiết bị, fallback WebGL, viền/cảnh báo và kịch bản); đã hoàn thiện focus ban đầu ở nút đóng, Tab vòng trong modal, Esc đóng cả khi ô search đang có chữ. **3/3 bài danh sách/cảnh báo/trạng thái qua (31,9 giây)**; sau thu gọn tiêu đề mobile, **1/1 bài popup desktop/mobile qua ở build cuối (9,9 giây)**. Kiểm tra bbox nằm trong sceneFrame, 19 thiết bị, số đo khớp snapshot, lọc/tìm, trạng thái rỗng, đóng/trả focus, không tràn ngang và chọn đóng popup/mở HUD. Đã xem ảnh popup desktop/mobile; không gọi service AI thật.
- Không thay bộ tính/model/camera/AI; không gọi Gemini thật, thay secret hoặc publish cấu hình cloud.

## 06/11/2026 — viền trạng thái trong danh sách và cảnh báo đỏ nổi trong 3D

- Nút trong danh sách lấy cùng assetStatus của snapshot hiện hành với cảnh 3D: viền xanh/vàng/đỏ và nền nhạt, chấm/icon, mô tả trợ năng/tooltip. Khi chọn giữ màu mức độ và thêm viền ngoài. Cập nhật theo áp dụng/reset kịch bản và cách ly hai tab, hoạt động cả khi WebGL không khả dụng.
- Viền critical nhịp nhẹ khi chưa chọn; inverter cảnh báo có nhãn đỏ ID/Dừng phát điện luôn thấy, gộp Đang chọn vào nhãn khi chọn. Không lặp nhãn trên PV cùng nhánh; không bật nhãn vận hành ở Thống kê. Giảm chuyển động giữ cảnh báo tĩnh, trang ẩn dừng timer viền như SelectionPulse hiện có; nhãn pointer-events none, không đổi camera/model/vật liệu/dây/bộ tính/AI.
- Kiểm tra: typecheck/build Webpack, Prettier và diff-check qua. Các bài GLB/picking/vật liệu, dây điện, phép tính Hiện trạng, HUD/kịch bản, fallback WebGL và viền chọn đã qua. **2/2 bài UI mới qua ở build cuối (35,8 giây)**: màu/mô tả trợ năng, chọn bằng bàn phím, nhãn đỏ không cần hover, nhịp viền/giảm chuyển động, xóa cảnh báo và khôi phục opacity sau reset, cách ly tab, chuyển lỗi → bụi và mobile không tràn ngang. Các lượt đầu sửa kỳ vọng của test: reset đóng danh sách, bụi có opacity riêng, lấy mẫu nhịp ngắn để tránh trùng chu kỳ; không đổi hành vi ứng dụng để làm test qua. Đã xem ảnh danh sách desktop/mobile và cảnh 3D thật. Không gọi lại service AI không đổi.
- Không gọi Gemini thật, thay secret hoặc publish cấu hình cloud.

## 05/11/2026 — làm rõ phần vẽ chart sau review style quá nhẹ

- Tăng tương phản miền/đường, kỳ vọng nét đứt, nền ngày chọn/điểm nổi; tăng cỡ tiêu đề/chú giải, card có viền trên xanh lam/xanh ngọc. Hai chart cột có chuyển sắc, cột rộng hơn, nền nhóm A/B và số rõ hơn. Sửa CSS cùng thuộc tính trình bày SVG, giữ loại chart, bộ tính, dữ liệu/trục/đơn vị, màu hiệu suất và hành vi; không làm mượt hay nối miền qua ngày thiếu.
- Giữ hatch/vòng rỗng cho phần dữ liệu thiếu và không vẽ null thành 0; hover tôn trọng giảm chuyển động. Không sửa chart khu vực đã được chấp nhận.
- Kiểm tra: typecheck/build Webpack, Prettier và diff-check qua; **3/3 bài UI liên quan qua (44,9 giây)** ở build cuối. Kiểm tra biểu đồ miền và chọn ngày đồng bộ, ngắt miền ở dữ liệu thiếu, số liệu chart khớp tổng hợp, lịch/phạm vi A/B độc lập, hatch/null và responsive. Đã xem ảnh desktop/mobile của chart miền và cột, tăng riêng cỡ nhãn số cột trên mobile. Không chạy lại bộ tính/service AI không đổi.
- Không gọi Gemini thật, thay secret hoặc publish cấu hình cloud.

## 05/11/2026 — đồng bộ phong cách chart theo mẫu khu vực

- Chỉ sửa history.css: dùng chung nền/viền/góc bo/padding của chart khu vực cho hai chart theo ngày và hai chart so sánh. Thu gọn tiêu đề/chú giải, bỏ khoảng trắng thừa ở đầu chart so sánh, đồng bộ màu chữ/trục/lưới và làm nhẹ lớp tô miền/tooltip.
- Giữ nguyên component, loại chart miền/cột, dữ liệu/công thức, miền/trục/đơn vị, màu chuỗi/heatmap, chất lượng dữ liệu và tương tác. Không đổi bố cục hai chart cạnh nhau hoặc xếp dọc theo viewport.
- Kiểm tra: typecheck/build Webpack, Prettier và diff-check qua; **3/3 bài UI liên quan qua (1,6 phút)**. Kiểm tra miền/chọn ngày đồng bộ, ngắt miền ở dữ liệu thiếu, lịch/phạm vi hai kỳ độc lập, giá trị chart so sánh khớp bộ tính và responsive. Đã xem ảnh chart miền desktop/mobile và cặp chart so sánh desktop. Không chạy lại phép tính/service AI không đổi.
- Không gọi Gemini thật, thay secret hoặc publish cấu hình cloud.

## 05/11/2026 — chart giữa các cụm và khu vực độc lập cho A/B

- Bảng khu vực thu chiều ngang về trái, giữ số liệu/chất lượng; bên phải thêm chart sản lượng thực tế/kỳ vọng và hiệu suất của 8 cụm. Chart cùng nguồn bảng/heatmap, hỗ trợ chọn bằng chuột/Enter/Space; hiệu suất dùng màu heatmap, null giữ —. Mobile xếp dọc, bảng cuộn riêng.
- So sánh mở mặc định. Mỗi kỳ có dropdown Toàn nhà máy/Khu A/Khu B/PV riêng và lịch riêng, không đổi theo scope phía trên. Hai chart sản lượng MWh/ngày và hiệu suất % cạnh nhau bên phải bảng số, không trộn trục đơn vị.
- Thêm historyScopeRange và tham số scope B tùy chọn cho compareHistory, giữ tương thích lời gọi cũ. Khu vực tổng hợp theo tổng năng lượng/valid intervals, không trung bình tỷ lệ; guard thiếu/trùng bản ghi của nguồn giữ nguyên. Không đổi dữ liệu/model hoặc cơ sở kỳ vọng.
- Kiểm tra: typecheck/build Webpack, Prettier và diff-check qua; **32/32 bài dữ liệu/UI qua (2,4 phút)**. Kiểm tra tổng hợp khu vực có trọng số, scope/ngày A/B độc lập với thanh trên, mở mặc định, giá trị chart khớp bảng, chọn cụm bằng bàn phím và responsive không tràn ngang. Đã xem ảnh desktop/mobile của bố cục và chart so sánh. Không chạy lại service AI không đổi.
- Không gọi Gemini thật, thay secret hoặc publish cấu hình cloud.


## 05/11/2026 — so sánh hai kỳ tự do, sắp xếp bảng khu vực

- Ẩn khối chi tiết/chất lượng, bỏ tự mở khi chọn cụm. Đưa Chi tiết theo khu vực ngay sau cặp chart sản lượng/hiệu suất và trước So sánh với kỳ khác. Giữ bảng dữ liệu/chất lượng, card, sự kiện, heatmap và AI.
- So sánh có hai lịch Kỳ A/Kỳ B riêng, không nhận scope ngày/khoảng từ thanh trên; mặc định 7 ngày gần nhất và 7 ngày trước đó. Cả hai được chọn tự do trong lịch sử có dữ liệu; min/max/hôm nay/tương lai và lỗi form độc lập. Giữ phạm vi cụm hiện hành. Nếu ngày cũ ra ngoài cửa sổ mới, báo chọn lại, không cắt kỳ ngầm.
- Bảng số gọn bên trái, bổ sung tổng sản lượng kỳ vọng và kỳ vọng bình quân/ngày. Chart cột nhóm bên phải thể hiện thực tế/kỳ vọng MWh/ngày để đối chiếu cả kỳ khác số ngày. Actual một phần có gạch chéo; null không bị vẽ thành 0; giữ guard không tính % thay đổi sản lượng khi thiếu dữ liệu.
- Kiểm tra: typecheck/build Webpack, Prettier, diff-check và liên kết tài liệu qua; **30/30 bài dữ liệu/UI qua (3,3 phút)**. Bài so sánh kiểm tra chọn cả A/B, tổng kỳ vọng và giá trị cột bình quân khớp bộ tính, thay ngày/khoảng/slider phía trên không đổi hai kỳ, thứ tự chart → bảng khu vực → so sánh, form lỗi giữ kết quả và có ID lỗi riêng, cột gạch chéo khi partial/null không vẽ thành 0, responsive. Đã xem ảnh so sánh desktop/mobile. Không chạy lại service AI không đổi.
- Không đổi bộ tính, model/camera hoặc service AI; không gọi Gemini thật, không thay secret/publish cấu hình cloud.


## 05/11/2026 — cặp biểu đồ miền sản lượng và hiệu suất

- Đổi chart đường toàn bề ngang thành hai chart miền cạnh nhau trên desktop, xếp dọc khi hẹp. Sản lượng thực tế/kỳ vọng dùng xanh lam và xám xanh, hiệu suất dùng xanh ngọc với trục %. Tô miền gradient nhẹ, giảm nhãn/chấm, hover/focus có số liệu và chọn ngày đồng bộ bằng chuột/Enter/Space. So sánh kỳ chuyển xuống hàng riêng.
- Giữ ngày thiếu dưới dạng ngắt miền/đường và không đặt điểm thực tế tại 0; tỷ lệ null cũng không có điểm. Chất lượng một phần có vòng rỗng, một ngày vẫn đọc/chọn được. Không đổi dữ liệu, công thức, heatmap hoặc AI.
- Trả lời thắc mắc kỳ vọng: hiện là tham chiếu nhánh khỏe theo bức xạ/nhiệt độ từng ngày, có giới hạn AC; vì thế biến động theo thời tiết. Đổi nhãn/giải thích thành Kỳ vọng theo thời tiết. Công suất tối đa (MW) không phải sản lượng ngày cố định (MWh); không tự đổi cơ sở đã chốt sang AC×12h.
- Kiểm tra: typecheck/build Webpack, Prettier, diff-check và liên kết tài liệu qua. Lượt dữ liệu/UI 30 bài có 29 qua, bài 3D hết 90 giây ở chụp ảnh sau khi toàn bộ assert chức năng đã qua; thử chụp phần tử vẫn kẹt auto-scroll/stability. Bỏ capture trùng trong bài picking, giữ ảnh renderer thật ở bài bố cục và ảnh riêng hai chart; không nới timeout hoặc sửa model. **2/2 bài 3D/bố cục chạy lại qua (1,3 phút)**. Bài chart mới kiểm tra hai miền cạnh nhau, chọn ngày từ hiệu suất đồng bộ cả hai chart/KPI, miền ngắt qua ngày missing, không vẽ null thành điểm 0, marker partial và xếp dọc/không tràn ngang mobile. Đã xem ảnh chart desktop/mobile và renderer. Không chạy lại service AI không đổi.
- Không gọi generation Gemini thật, thay secret hay publish cấu hình cloud.


## 05/11/2026 — ba card dọc và sự kiện đúng cụm

- Theo yêu cầu mới, gom ba chỉ số thành cột gọn bên trái và khung sự kiện có cuộn bên phải. Thu khoảng cách nhãn/số, giữ đơn vị MWh AC/% và nhãn sản lượng một phần. Sản lượng xanh nước biển, Thiếu hụt đỏ; Hiệu suất dùng cùng hàm màu của heatmap trên tổng hợp đang chọn, màu xám nếu không có tỷ lệ. Không đổi công thức hoặc dữ liệu.
- Sửa nguyên nhân sự kiện sai phạm vi: trước chỉ lọc ngày/khoảng; thêm điều kiện assetId khi chọn cụm. Toàn nhà máy vẫn đủ sự kiện các cụm, bộ đếm và trạng thái rỗng theo cùng tập đã lọc. Click sự kiện vẫn focus đúng ngày/cụm, không khôi phục danh sách toàn nhà máy ngoài ý muốn.
- Kiểm tra: typecheck/build Webpack, Prettier và diff-check qua; **14/14 bài UI lịch sử qua (3,5 phút)**. Kiểm tra ba card xếp dọc/cột sự kiện bên phải, màu Hiệu suất theo đúng tổng hợp PV-04, lọc đồng thời cụm + khoảng/ngày, click sự kiện, quay lại Toàn nhà máy và trạng thái không có sự kiện. Responsive 320/390/768/1024 và các luồng 3D chuột/chạm, chat/cách ly module vẫn qua. Đã xem ảnh desktop renderer thật và desktop/mobile phạm vi PV-04; ảnh phạm vi mới dùng fallback để tập trung bố cục. Không chạy lại phép tính/service AI không đổi.
- Không thay model/camera, AI/service/secret hoặc publish cấu hình cloud.


## 05/11/2026 — hàng điều khiển theo thứ tự và thang màu dọc trong 3D

- Theo ảnh/yêu cầu mới, xếp desktop Phạm vi → Xem theo → timeline hoặc lịch/preset cùng hàng; màn hình nhỏ phần thời gian xuống hàng. Xóa cả dải phạm vi/chất lượng/độ phủ ngay bên dưới, giữ dữ liệu chất lượng trong bảng/chi tiết và AI.
- Composer lịch sử đổi theo ảnh: ô nhập nền nhạt/viền riêng, nút gửi riêng bên phải, hướng dẫn phím bên dưới. Không đổi logic/ngữ cảnh AI hoặc service.
- Chuyển chú giải heatmap thành thang dọc bên phải trong cảnh, đầu cao ở trên; cả sản lượng/hiệu suất dùng cùng vị trí. Giữ màu/mốc/đơn vị và giới hạn sản lượng theo số ngày; nút thông tin mở giải thích chất lượng/thang. Gỡ hàng chú giải dưới cảnh, cho 3D dùng diện tích còn lại. Không sửa model, bộ tính hoặc nguồn dữ liệu.
- Kiểm tra: typecheck/build Webpack, Prettier và diff-check qua. Lượt toàn nhóm UI lịch sử có 13/14 qua; bài còn lại giữ assertion cũ đòi nút gửi nằm lọt trong viền chung, đã cập nhật đúng mẫu nút riêng sát mép. Nhóm bố cục/responsive chạy lại 2/2 qua; sau sửa khoảng chừa cho thông báo WebGL, build lại và 2/2 qua (17,3 giây). Đã xác minh thứ tự điều khiển, thanh màu dọc nằm trong cảnh, thông báo không bị che, không tràn ngang 320/390/768/1024, gửi/Shift+Enter và nguồn chat. Đã xem ảnh desktop renderer thật và mobile/fallback cuối. Không chạy lại phép tính/service AI không đổi.
- Không gọi Gemini thật, thay secret hoặc publish cấu hình cloud.


## 05/11/2026 — chỉnh hai vùng UI theo ảnh review

- Nền main `e764200`, không có thay đổi sẵn. Hai bộ lọc trước bị lệch do nhãn Xem theo xếp dọc còn Phạm vi xếp ngang và chiều cao select khác nhau. Thống nhất nhãn phía trên, dropdown 36px, hai cột cùng cạnh trên/dưới ở desktop/mobile; giữ vị trí gần nhau.
- Composer bị thừa cột grid và nút gửi đặt tuyệt đối, tạo khoảng trống/nút rời ô nhập. Gom ô nhập và nút gửi vào một khung, bỏ định vị tuyệt đối, focus chung và gợi ý phím sát bên dưới. Không đổi logic chat, dữ liệu, model/camera hoặc cấu hình cloud.
- Kiểm tra: typecheck/build Webpack, Prettier và diff-check qua; **5/5 bài UI liên quan qua (1,0 phút)**. Bổ sung kiểm tra hình học: hai select cùng cạnh/chiều cao, nút gửi nằm trong khung và không đè textarea, desktop/mobile; Enter gửi, Shift+Enter xuống dòng, nhãn nguồn tháng/cụm giữ đúng. Đã xem ảnh desktop/mobile mới. Không chạy lại phép tính/service AI không đổi, không gọi Gemini thật.


## 05/11/2026 — dropdown thời gian và sửa ngữ cảnh AI hỏi theo tháng

- Đồng bộ main `b557996`, working tree ban đầu sạch. Người dùng xác nhận bản trước đã publish và truy cập web được; đây là xác nhận sử dụng của người dùng, không thay kiểm chứng production của thay đổi mới.
- Thay hai nút Theo ngày/Trong khoảng bằng dropdown Theo ngày/Khoảng thời gian; đưa Phạm vi về cùng hàng; bỏ ngày/khoảng đang xem lặp trong dải bên dưới. Giữ timeline/preset/lịch áp dụng, chất lượng, KPI/sự kiện, cơ sở Thiếu hụt và camera/model.
- Tìm đúng nguyên nhân câu hỏi tháng trả lời ngày: browser gửi duy nhất ngày đang xem; server chỉ dựng số ngày đó và chưa phân giải cụm được nhắc. Thêm resolver dùng chung browser/server cho tháng/cụm, server xác thực lại và tổng hợp nhiều ngày. Nhãn nguồn/key chat theo phạm vi thực; UI ngày đang xem không bị đổi. “Tháng này” theo tháng lịch UTC+7; dữ liệu chưa đủ tháng luôn có thông báo giới hạn do server thêm, ngoài cửa sổ không tạo số. Quy ước chi tiết tại AI.md.
- Kiểm tra: typecheck/build Webpack, Prettier, diff-check và liên kết tài liệu qua. **46/46 bài liên quan qua (3,3 phút)**: dữ liệu lịch sử, service AI/native guard, toàn bộ UI lịch sử gồm chuột/chạm 3D, responsive và hai bài hồi quy mới cho câu hỏi tháng/payload/nhãn nguồn. Đã xem screenshot desktop/mobile mới (bài mới chủ động tắt WebGL để tập trung bố cục/chat; bài renderer thật nằm trong cùng lượt). Không chạy lại toàn bộ suite không liên quan.
- Không gọi generation Gemini thật hoặc đổi secret/cấu hình cloud. Dữ liệu/heatmap v2, hai chat Hiện trạng/Mô phỏng và phát hiện bất thường pending giữ nguyên.


## 05/11/2026 — chốt cơ sở chỉ số Thiếu hụt

- Người dùng chọn giữ sản lượng kỳ vọng theo điều kiện từng ngày, chỉ đổi cách hiển thị. Card đổi nhãn thành Thiếu hụt, có tooltip và nhãn trợ năng giải thích bức xạ/nhiệt độ và phần dữ liệu hợp lệ. Không đổi shortfallMWh, hiệu suất, dữ liệu hoặc API. Mục chờ xác nhận ở lượt trước đã được giải quyết.
- Typecheck, production build và git diff --check đều qua. Thay đổi chỉ là nội dung hiển thị, không thêm kiểm thử nội dung tĩnh hoặc chạy lại các bài tính toán không đổi.

## 05/11/2026 — Thống kê, hai hàng thời gian và sự kiện đúng phạm vi

- Đổi tên tab thành Thống kê, bỏ title góc trái. Theo ngày/Trong khoảng xếp dọc, slider/đầu-cuối/ngày đang xem sát hàng Theo ngày; hàng Trong khoảng có ô tóm tắt luôn hiển thị, popup chỉnh ngày và preset cập nhật cùng khoảng áp dụng. Giá trị bên dưới đổi nhãn Sản lượng thực tế/Hiệu suất.
- Sự kiện lọc theo scope ngày hoặc khoảng, giữ đầy đủ bản ghi theo ngày/cụm/loại thay vì gộp loại và cắt bốn mục; tổng số và danh sách cuộn đặt ngay dưới chỉ số.
- Tách AssistantHeader dùng chung cho cả ba panel; Thống kê dùng lớp hiển thị/chat/message/composer/icon cùng AI cũ, giữ context/request/history độc lập. Sửa padding header và giới hạn chiều cao chat mobile. Không thay model dữ liệu, tỷ lệ hay service API.
- Kiểm tra: typecheck/build qua; 19/19 UI lịch sử và AI cũ qua (3,4 phút). Sau đổi nhãn/chi tiết popup và padding cuối, build lại +3/3 responsive/contextchat và bài mới kiểm tra hai hàng/ô phạm vi/preset/custom/toàn bộ số sự kiện qua (25,2 giây). Đã xem ảnh mobile và desktop; ảnh desktop bài mới cố tình tắt WebGL để kiểm tra fallback, kiểm tra renderer chuột/chạm có trong lượt 19 bài. Không gọi generation Gemini thật.
- **Chưa hoàn tất yêu cầu tính thiếu hụt theo công suất tối đa**: đã gửi câu hỏi người dùng chọn so kỳ vọng theo điều kiện ngày hoặc giới hạn AC×12h/ngày (MW cần quy đổi MWh). Tại thời điểm lượt đó chưa nhận câu trả lời; giữ shortfallMWh và nhãn kỳ vọng hiện hành. Đã được giải quyết ở mục chốt cơ sở chỉ số phía trên.

## 05/11/2026 — gom workspace Hiệu suất theo ảnh khoanh

- Gộp panel tiêu đề/chọn chế độ và panel phân bố cụm vào một khung; trạng thái và ba KPI trở thành dải gọn trong khung. Nút Sản lượng/Đạt kỳ vọng và reset nằm trong cảnh, timeline sát cảnh. Phạm vi trong cùng hàng bộ lọc; diễn biến thu gọn ở chân khung.
- HistoryAssistant chuyển sang cột phải 360/380px desktop (320px ở desktop hẹp), xếp dưới trên mobile/tablet nhỏ. Giữ phiên/request/context/API như cũ, thêm cuộn tới phản hồi mới. Chiều cao renderer theo viewport để nhìn được cả bản đồ và ô nhập chat ở 1440×900; không sửa dữ liệu, tính toán, hai module hoặc service AI khác.
- Kiểm tra: typecheck/build qua; 12/12 UI lịch sử qua (2,9 phút). Sau chỉnh chiều cao cuối/cuộn chat, build lại và 5/5 bài bố cục, responsive, chạm, cách ly module và chat dài qua (49,1 giây). Có assert AI ở phải, toolbar trong scene-panel, switch trong scene-wrap, dải KPI thấp hơn 80px và composer không thấp quá viewport 900px. Đã xem screenshot desktop thực WebGL và kiểm tra 320/390/768/1024px. Không chạy lại các phép tính/server AI không đổi hoặc toàn suite 87 bài.
- HISTORY_UI/PRODUCT/DESIGN/TASKS cập nhật ưu tiên layout mới. Phát hiện bất thường vẫn pending; không đổi secret/cloud hoặc gọi generation Gemini thật. Đưa lên pipeline Vercel hiện có để người dùng tiếp tục review.

## 05/11/2026 — xem từng ngày toàn tháng, slider sát 3D và AI lịch sử

- Theo yêu cầu mới: mặc định Từng ngày/toàn bộ cửa sổ lịch sử/chọn hôm qua; chế độ ngày luôn trở về toàn tháng khi chọn ngày qua slider, biểu đồ hoặc nút diễn biến. Tổng hợp khoảng ngày mới có preset/lịch, không dùng slider. Chuyển slider vào panel heatmap ngay trước cảnh, hiển thị ngày đang xem và phạm vi lịch sử ngay cạnh thanh trượt.
- Giải thích dữ liệu: generator có đủ bản ghi ngày/cụm; missing/stale/invalid là tình huống mô phỏng không nhận số đo/nhận số cũ/số đo không đủ chất lượng, không phải gen thiếu. Nhãn sự kiện đổi thành Mô phỏng mất dữ liệu hoặc lỗi kiểm tra chất lượng, không suy ra công suất 0 hay lỗi thiết bị.
- Thêm HistoryAssistant độc lập với hai hội thoại cũ, cùng API Gemini hiện có và hạn mức/cache/timeout/guard. Nút phân tích lựa chọn và chat mang context ngày/khoảng/cụm. Máy chủ tự dựng lại dữ liệu lịch sử, bỏ summary giả từ browser, chỉ dùng lịch sử cùng khóa; không gửi snapshot Hiện trạng hay công cụ mô phỏng vào prompt lịch sử. Đổi lựa chọn/module hủy request, giữ nhãn gốc từng tin và bản nháp. Không tự gọi model mỗi lần kéo thanh.
- Typecheck và production build qua; **25/25 bài qua (3,4 phút)** gồm analysis/server (có kiểm tra history mới), assistant-ui cũ và 12 UI lịch sử. Kiểm tra mặc định ngày/toàn tháng, vị trí slider, context hội thoại riêng; service fixture xác nhận facts dựng tại server, khóa ngày tương lai và không cung cấp tool. Đây không phải bằng chứng generation Gemini production mới; cloud trước đó bị chặn Vercel trực tiếp. Sau chỉnh dòng phạm vi tháng, build lại và 2/2 kiểm tra default/3D touch qua (25,7 giây). Sau bổ sung chặn payload hội thoại UTF-8 19KB, build lại và bài default/context AI mở rộng qua (27,3 giây), xác nhận cả context ngày/khoảng và nhiều lượt tiếng Việt dài. Không chạy toàn bộ suite không liên quan; các lượt trước có bằng chứng riêng bên dưới.
- HISTORY_UI/AI/HISTORY_DATA đã cập nhật quyết định mới; các đoạn cũ về mặc định 7 ngày hoặc chưa có AI lịch sử được thay thế. Phát hiện bất thường vẫn pending; trợ lý giải thích theo yêu cầu, không thêm thuật toán cảnh báo. Không thay secret hoặc cấu hình cloud.

## 05/11/2026 — review lại UX và dữ liệu Hiệu suất theo feedback người dùng

- Xác định vấn đề: bày đồng thời lịch khoảng, dropdown ngày, timeline và lịch đối chiếu; 4 KPI/chi tiết/so sánh cùng mở khiến cảnh bị đẩy xuống. V1 có nhánh khỏe 98,5–100%, các sự cố ngắn dễ bị bỏ lỡ ở 7 ngày gần nhất.
- Gom preset/lịch tùy chọn/timeline vào một vùng; lịch chỉ hiện khi bấm Tùy chọn, bỏ dropdown ngày lặp. Heatmap toàn chiều ngang, cao 65vh (470–760 px desktop), 420px mobile; chỉnh riêng lens lịch sử từ minimumAspect 1,45 về 1,2 để nhà máy lớn hơn nhưng vừa khung. Không đổi lens của Hiện trạng/Mô phỏng. Thu gọn chi tiết và so sánh; chọn cụm mới mở chi tiết. Ba KPI chính: ghi nhận/thiếu hụt/đạt kỳ vọng; độ phủ và kỳ vọng đối chiếu đưa về nhãn/chi tiết/bảng.
- Model `daily-history-v2`: thêm bụi tích lũy/vệ sinh PV-04, nhánh DC giảm 15–35% và phục hồi PV-07, giới hạn bảo vệ do nhiệt buổi trưa PV-06. Actual thay đổi theo các tình huống có diễn biến, expected giữ cùng môi trường; nhánh khỏe vẫn quanh 99%. Giữ seed/khóa ngày ổn định, không sinh số riêng từng card. Mọi cửa sổ 7 ngày trong 28 ngày kiểm tra đều có nhánh >98%, nhánh <95% và chênh >5 điểm %. Ví dụ 29/10–04/11: PV-04 92,0%, PV-06 91,1%, PV-07 89,8%.
- Nút Khám phá diễn biến đưa đến đúng ngày/cụm từ metadata đã dựng, không phải phát hiện bất thường tự động. Thang màu cố định 0/70/85/95/100+, chú giải cùng mốc; phân biệt thiếu dữ liệu và sản lượng 0. Không sửa nguồn Hiện trạng hoặc kịch bản Mô phỏng. Phát hiện bất thường vẫn pending.
- Kiểm tra: **15/15 dữ liệu/phép tính qua (3,6 giây)**, **15/15 UI/hồi quy qua (2,8 phút)** gồm 11 bài lịch sử mới/cũ và 4 bài monitoring-metrics. Sau tinh chỉnh lens cuối, build lại và **2/2 bài 3D chuột/chạm qua (1,5 phút)**. Typecheck/build Webpack, Prettier và diff-check qua; đã xem ảnh desktop/mobile. Không chạy lại toàn bộ 87 bài vì thay đổi giới hạn trong lịch sử/lens nhánh history; bằng chứng 87 bài bên dưới thuộc phiên bản trước.
- Lượt kiểm tra đầu có va chạm trace do chạy hai suite dùng chung test-results đồng thời và assertion còn định dạng coverage cũ; đã chạy tuần tự, sửa assertion theo nhãn thực và kiểm tra lại qua. Không dùng lượt lỗi làm nghiệm thu. README/DESIGN/PRODUCT/HISTORY_UI/HISTORY_DATA đã cập nhật, bảng số v1 đánh dấu lưu lịch sử, không coi là số v2.
- Hoàn thành bản sửa để đưa lên pipeline Vercel hiện có theo luồng người dùng đã yêu cầu publish/kiểm tra. Không thay secret hoặc cấu hình cloud; không gọi generation AI. Kiểm chứng thiết bị thật/Safari và phát hiện bất thường vẫn ngoài phần đã hoàn tất.

## 05/11/2026 — publish module Hiệu suất lên Vercel theo yêu cầu người dùng

- Đã kiểm tra working tree sạch, fetch main và xác nhận nền remote là tổ tiên của HEAD; push fast-forward `f1c10b3` → `e81e0f1` lên `origin/main`, gồm cả mốc dữ liệu `4dbd512` và UI/so sánh `e81e0f1`. `git ls-remote` xác nhận remote main đúng `e81e0f18937d514428d0409a282e39d9b22e5540`.
- GitHub commit status của đúng SHA do Vercel gửi: **success — Deployment has completed**, cập nhật `2026-11-04T17:46:45Z` (05/11/2026 00:46:45 UTC+7). Deployment: https://vercel.com/thanh-877e/solar-farm/9FhW3TSv3vVTxWUJtUNjz3Cxy9Jj . URL dự án hiện có: https://solar-farm-pi.vercel.app/ .
- HTTPS trực tiếp từ cloud tới URL dự án bị proxy 403 CONNECT; không coi đây là lỗi HTTP của ứng dụng hoặc bằng chứng trang thực đã mở thành công. Xác nhận deploy dựa trên Vercel status của đúng commit; chưa kiểm tra mới UI/AI trên production. Bằng chứng cục bộ vẫn là 87/87 test và build/typecheck của mốc 2/3 ở mục dưới; không gọi generation mới hoặc thay secret/cấu hình Vercel/cloud.
- Người dùng có thể mở tab Hiệu suất để kiểm tra. Các dòng “chưa push/deploy” ở mốc trước giữ lịch sử; lần publish này đã đưa code lên remote và pipeline hoàn tất. Phát hiện bất thường vẫn pending. Ghi chú bàn giao này được lưu cục bộ sau deploy, không push thêm một lượt chỉ để cập nhật log.

## 04/11/2026 — hoàn tất mốc 2/3 module Hiệu suất và so sánh kỳ

- Nền `4dbd512`; người dùng yêu cầu triển khai cả mốc 2 và 3. Thêm tab Hiệu suất ngang hàng Hiện trạng/Mô phỏng; preset 1/3/7 ngày/Tất cả, khoảng tự do với kiểm tra min/max/thứ tự, khóa hôm nay/tương lai; timeline từng ngày, chọn ngày từ biểu đồ và quay về Toàn khoảng. Bộ lọc/cụm/chỉ số được giữ khi đổi module; cửa sổ/preset cập nhật khi qua nửa đêm UTC+7 hoặc quay lại cửa sổ.
- Tô màu vật liệu PV_CELLS trực tiếp cho 8 cụm theo MWh AC hoặc % kỳ vọng, thang cố định có chú giải, xám khi không có dữ liệu và viền nâu cho dữ liệu một phần. Chọn bằng 3D/dropdown/bảng, đồng bộ KPI/chi tiết/biểu đồ và giữ camera khi đổi ngày/chỉ số. Lịch sử không dùng viền cảnh báo hoặc dòng điện tức thời của Hiện trạng. Không sửa nguồn snapshot hoặc mô hình kịch bản cũ.
- So sánh kỳ liền trước/tùy chọn theo cùng cụm/thời đoạn; hiển thị ngày, số ngày, tổng/bình quân sản lượng, tỷ lệ/độ phủ. Kỳ khác độ dài dùng bình quân/ngày; kỳ có dữ liệu thiếu không báo % thay đổi sản lượng, tỷ lệ dùng phần có số liệu; kỳ ngoài cửa sổ báo không đủ thay vì cắt ngắn. Dashboard/biểu đồ/chi tiết phân biệt 0/thiếu/một phần, có điểm kỳ vọng khi chỉ xem một ngày.
- Giữ hai hội thoại và bản nháp Hiện trạng/Mô phỏng; khi mở Hiệu suất hủy/invalidate request AI đang chờ và tắt phân tích panel ẩn để lệnh cũ không áp dụng sau khi quay lại. Không thêm AI lịch sử hoặc API/backend mới. Chỉ mount một renderer WebGL tại module đang xem; đổi module khởi tạo lại camera, đổi ngày trong lịch sử không remount. Fallback không WebGL vẫn dùng bộ lọc/bảng/so sánh.
- Kiểm tra cuối trên cùng production build: **87/87 bài qua (10,8 phút)**, gồm 14 bài dữ liệu/phép tính lịch sử và 10 bài UI lịch sử, toàn bộ nhóm AI/mô phỏng/model/đường điện/T05. `npm run typecheck`, `npm run build` Webpack, Prettier, diff-check và liên kết tài liệu đều qua. Suite lịch sử độc lập trước hồi quy cũng **14/14 qua (1,6 giây)**; lượt UI đầu 8/8 qua rồi bổ sung kiểm tra AI muộn và chạm. Lượt typecheck đầu phát hiện annotation `this` thiếu trong fixture WebGL của test mới, đã sửa trước lượt build/hồi quy cuối, không bỏ kiểm tra kiểu.
- Đã xem ảnh desktop 1440 px và mobile thực thi WebGL 390 px; kiểm tra không tràn ngang 320/390/768/1024, bảng có vùng cuộn riêng, SVG điểm có Enter/Space, slider/tab có bàn phím, chọn cụm bằng chuột và Chromium hasTouch thật trên renderer. Reduced motion/chạm xoay/pan/pinch của module cũ cũng qua. Chưa kiểm chứng Safari/Firefox, thiết bị iOS/Android/GPU thật hoặc bàn phím ảo/IME mới; giả lập cảm ứng Chromium không thay thiết bị thật.
- Hướng dẫn/bảng thang màu/phép đối chiếu/cách ly module tại [HISTORY_UI](HISTORY_UI.md); README/PRODUCT/DESIGN/TASKS/HISTORY_DATA/PERFORMANCE_HISTORY được đồng bộ. Các mục mốc trước bên dưới giữ lịch sử. **Phát hiện bất thường vẫn PENDING**, không xóa backlog hoặc coi là điều kiện chặn. Không gọi generation Gemini thật, không push/deploy; kiểm tra URL Vercel mới vẫn là công việc riêng khi người dùng yêu cầu đưa commit lên remote.

## 04/11/2026 — triển khai mốc 1 dữ liệu lịch sử Hiệu suất

- Đã fetch và fast-forward checkout từ `218413a` đến GitHub main `f1c10b3`, bảo toàn ghi chú đã có trong STATUS và PERFORMANCE_HISTORY; không thay cấu hình/style/model/nguồn hai module hiện tại.
- Thêm history-model, history-dates và performance-history: nguồn mô phỏng một tháng đến hôm qua, 8 nhánh theo registry, 96 khoảng 15 phút/ngày, tích phân MWh và tổng hợp ngày/cụm/khoảng. Ngày cũ ổn định theo date/asset/seed khi cửa sổ dịch. Preset và truy vấn từ chối hôm nay/tương lai/ngoài cửa sổ, kiểm tra biên tháng/năm/năm nhuận/UTC+7; không cắt kỳ đối chiếu cho vừa dữ liệu.
- Tình huống có mây chung/cục bộ, bụi tăng dần/vệ sinh, inverter dừng/khôi phục, thiếu/cũ/invalid; đêm bằng 0. Kỳ vọng khỏe mạnh cùng điều kiện môi trường; tỷ lệ theo tổng năng lượng trên cùng khoảng dữ liệu hợp lệ. Thiếu dữ liệu không thay 0; độ phủ chỉ tính các khoảng ban ngày. Metadata tình huống là cấu hình demo, không phải phát hiện bất thường.
- Mẫu neo 04/11: 04/10–03/11, 248 bản ghi, 23.808 khoảng; actual ghi nhận một phần 6.543,1198 MWh, kỳ vọng đầy đủ 6.741,9075, kỳ vọng khớp phần có dữ liệu 6.696,4856 MWh; tỷ lệ 97,7098%, độ phủ 99,4288%. Công thức, API và bảng ví dụ tại [HISTORY_DATA](HISTORY_DATA.md); nguồn này không tái dựng snapshot Hiện trạng 30 phút.
- Kiểm tra cuối: **12/12 test lịch sử qua (1,3 giây)**, typecheck/build Webpack qua; **15/15 test hồi quy qua (1,0 phút)** của monitoring/monitoring-metrics/scenario-simulation/simulation, gồm 3 luồng trình duyệt. Không chạy toàn bộ suite AI/style hoặc kiểm tra Vercel vì không sửa các phần đó. Lượt test đầu bị chi phí format assertion trên dataset lớn, đã đổi sang checksum toàn nội dung; một kiểm tra dùng equality cho tổng float, đã đổi tolerance 10⁻⁹. Không dùng các lượt dừng/lỗi làm bằng chứng hoàn tất.
- Build sandbox mặc định không đọc được output child TypeScript (spawn EPERM); cùng lệnh build/typecheck qua khi cấp quyền mạng cho executor, không sửa cấu hình build/dependency hoặc tắt kiểm tra để né lỗi. README/PRODUCT/DESIGN/TASKS cập nhật phạm vi và hướng chạy test độc lập. Không thêm dịch vụ/database/API mới, không gọi generation AI.
- Đã hoàn tất mốc dữ liệu và phép tính; **chưa có giao diện module thứ ba**, chưa triển khai heatmap/timeline/dashboard lịch sử/so sánh UI. Phát hiện bất thường vẫn **PENDING**. Bước tiếp theo: mốc 2 theo [PERFORMANCE_HISTORY](PERFORMANCE_HISTORY.md). Không push/deploy.

## 04/11/2026 — chốt nguồn lịch sử một tháng và khóa ngày hiện tại

- Người dùng xác nhận nguồn lịch sử mô phỏng một tháng trước ngày hiện tại, đa dạng tình huống; đồng ý ba module và định nghĩa chỉ số. Không cho chọn hôm nay, kể cả lịch tùy chọn.
- Cập nhật [PERFORMANCE_HISTORY](PERFORMANCE_HISTORY.md): quy ước đề xuất 04/10–03/11 nếu hôm nay 04/11, All Time chỉ toàn cửa sổ này; dữ liệu ổn định theo ngày/thiết bị, các tình huống có diễn biến, kỳ vọng cùng điều kiện môi trường. Chia kế hoạch thành dữ liệu/phép tính → module giao diện → so sánh/nghiệm thu; không so kỳ bị cắt ngắn như kỳ đủ dữ liệu. Phát hiện bất thường vẫn pending.
- Chỉ cập nhật tài liệu, chưa code/commit/push/deploy. Kiểm tra diff và liên kết; không chạy lại test ứng dụng cho thay đổi tài liệu.

## 04/11/2026 — khảo sát module hiệu suất lịch sử theo feedback BD

- Đã đọc GitHub main tại `f1c10b3`; checkout local vẫn ở `218413a`, chưa đổi nhánh/pull. Main mới hơn 5 commit, đã đối chiếu diff và đọc tài liệu hiện hành từ GitHub; phần registry/bộ tính/cảnh/dashboard khảo sát không đổi.
- Chốt theo người dùng: module riêng ngang hàng Hiện trạng/Mô phỏng; heatmap sản lượng và hiệu suất so kỳ vọng; đơn vị ngày, khoảng ngày tự do; preset 1/3/7 ngày kết thúc hôm qua. All Time theo ngày đầu có dữ liệu. Phát hiện bất thường **pending, giữ backlog**, không bỏ.
- Lưu khảo sát, quyết định, đề xuất và điểm chưa chốt tại [PERFORMANCE_HISTORY](PERFORMANCE_HISTORY.md). Có 31 mẫu lịch sử 10:00–10:30 ngày 02/11; chưa có nguồn lịch sử theo ngày, bộ mô phỏng chưa có chu kỳ ngày đêm. Không coi 15,7248 MWh là sản lượng cả ngày hoặc nhân công suất mẫu với 24.
- Chỉ thêm tài liệu phân tích; chưa triển khai module/API/AI mới. Không chạy build/browser hoặc test ứng dụng vì không sửa code; kiểm tra liên kết tài liệu và git diff --check. Chưa commit/push/deploy. Bước tiếp theo: chốt nguồn/độ dài lịch sử, cách xử lý hôm nay, baseline kỳ vọng và thiết kế chi tiết theo tài liệu mới.

## T05 — rà soát UX, phục hồi kết nối AI và bàn giao kiểm tra Vercel

- Đã fetch và dùng main mới nhất `3d48607`; giữ các quyết định T05: hướng dẫn ba phút pending, liên hệ/quota Gemini ngoài phạm vi, không redesign hoặc publish cấu hình cloud. Không đổi model/19 ID, camera, phép tính, dữ liệu nền, hai phiên chat hoặc guard API.
- Sửa popup @: option và container cuộn không nằm trong thứ tự Tab; Shift+Tab rời composer, popup đóng khi focus ra ngoài. Cuộn ↑↓ chỉ trong popup, không kéo cả trang. Chọn @ vẫn giữ bản nháp và focus thiết bị mà không gọi API.
- Probe AI ở browser có timeout 10 giây, phân biệt HTTP lỗi với thiếu cấu hình và có nút Thử lại kết nối AI. Chỉ retry khi người dùng bấm; không generation từ GET, không reload, không thay Mô phỏng hoặc xóa chat; kết nối thành công trả focus về ô nhập. Giữ chế độ quy tắc khi thiếu key/lỗi.
- Bổ sung 5 bài T05: focus/@, probe 503/thử lại, probe treo/timeout, ma trận 7 viewport và thao tác cảm ứng Chromium. Đã kiểm tra 390/768/1024/1440 px cùng landscape/viewport thấp, popup/composer/gửi, modal/focus, bản nháp/không tràn ngang. Chromium hasTouch/CDP thực hiện xoay một ngón, pan/pinch hai ngón, tap đúng PV-02, reset và hồ sơ trên renderer thật, bật reduced motion. Không gọi đây là kiểm tra bàn phím ảo hoặc thiết bị thật.
- Kiểm tra: Node 24.22.1/npm 11.9.0, typecheck/build Webpack/Prettier/diff-check và liên kết tài liệu qua. Nhóm chat/T05 **15/15 qua (2,0 phút)** sau sửa. Lượt hồi quy cuối trên cùng build **63/63 qua (8,5 phút)**, không còn bài lỗi.
- Các lượt đầu tái hiện lỗi bàn phím và probe HTTP; kiểm tra tiếp tìm thêm container cuộn tự nhận Tab của Chromium, đã sửa bằng tabindex. Một assertion vị trí cuộn bị ảnh hưởng bởi smooth focus scroll đang chạy; phép đo popup nay tắt riêng smooth scroll để đo đúng nguyên nhân. Lượt khảo sát ban đầu còn bị chạy trùng Playwright làm mất trace/cổng bận; đã dừng tiến trình/server của lượt đó, chạy tuần tự và không dùng các lượt lỗi làm nghiệm thu. Không nới timeout/ngưỡng hoặc sửa model/bộ tính để làm test qua.
- Đã xem ảnh popup @ trên 390 px, HUD desktop và 3D/HUD tablet sau gesture. Tạo [T05_ACCEPTANCE](T05_ACCEPTANCE.md) với ma trận/bằng chứng và checklist Vercel/thiết bị thật; cập nhật HANDOFF/TASKS/README/AI, sửa dòng README lỗi thời về một chat xuyên mode.
- Vercel: trong phiên này HTTPS tới `solar-farm-pi.vercel.app` bị proxy **403 CONNECT**; không có binding Gemini trong cloud, không copy key hoặc sinh generation mới. Status GitHub của nền `3d48607` là Vercel success, không dùng làm chứng cứ deployment của thay đổi T05. Commit/push main để pipeline hiện có test; trạng thái deployment mới cần kiểm tra riêng sau push. Không thay/publish cấu hình cloud hoặc Vercel.
- Phần tiếp theo: xác minh commit/deployment mới trên URL thật và luồng Gemini, iOS/Android/tablet thật, bàn phím ảo/IME, Safari/Firefox. Chưa ghi T05 nghiệm thu toàn demo; giữ nguyên các mục ngoài phạm vi đã chốt.

## Chuẩn bị bàn giao T05 sang chat mới

- Phạm vi chốt: Mobile/Tablet, bàn phím, giảm chuyển động, kiểm tra luồng/lỗi 3D/AI/mô phỏng trên Vercel. Hướng dẫn ba phút pending; liên hệ và quota/chi phí Gemini không làm trong đợt này, không hỏi lại/không coi là blocker. Không xóa guard API hiện có.
- Tạo [T05_HANDOFF](T05_HANDOFF.md) với checklist, nền cần giữ, lệnh chạy và prompt chat mới; cập nhật AGENTS/TASKS/README và ghi đè ưu tiên phạm vi trong các tài liệu cũ. Không sửa code ứng dụng hoặc tối ưu style thêm.
- Kiểm tra nền: Node 24.22.1/npm 11.9.0; typecheck/build và diff-check qua; 4/4 bài chọn lọc qua (49,9 giây): bố cục desktop/mobile, keyboard/Enter/IME, autocomplete @, quy tắc offline/apply/reset/mobile. Trang Vercel HTTP 200; GET /api/ai available=true, credentialStatus=ready, requiresAccessCode=false, model gemini-3.5-flash-lite. Không sinh generation mới; GET không thay bằng chứng AI thật.
- Main đã đối chiếu origin/main không lệch trước lưu bàn giao; chỉ sửa tài liệu. Chưa xác minh mới Safari/Firefox, bàn phím ảo, iOS/Android/cảm ứng thật; đó là phần chat triển khai cần kiểm tra. Chưa hoàn tất T05; không publish cloud.

## Chuyển T05 theo yêu cầu người dùng

- Người dùng yêu cầu pending hướng dẫn trình diễn ba phút và chuyển T05; không coi T04 đã hoàn tất. Mobile/tablet, bàn phím, giảm chuyển động vẫn là hạng mục rà soát trải nghiệm cần ghi rõ khi bàn giao.
- Đã kiểm tra URL HTTPS Vercel: trang HTTP 200; GET /api/ai available=true, credentialStatus=ready, requiresAccessCode=false, model gemini-3.5-flash-lite. Đây là capability check, không phải generation mới.
- vercel.json dùng Next.js, npm run build và .next. Không đổi cấu hình cloud hoặc secret. T05 đang thực hiện, chưa đánh dấu nghiệm thu toàn demo.
- Còn cần thông tin liên hệ công khai thật; đã hỏi người dùng kênh và thông tin muốn hiển thị. Quota/chi phí toàn project Gemini và kiểm tra trình duyệt/cảm ứng thật vẫn chưa được xác minh.

## Rà soát mức hoàn thành T03 và phạm vi T04

- Đã đối chiếu TASKS/T03_HANDOFF/PRODUCT với code và bằng chứng: phần chức năng T03 và tích hợp Gemini thật đã đạt, đủ cơ sở kỹ thuật chuyển T04. Không tự ghi người dùng đã nghiệm thu hoặc demo đã sẵn sàng phát hành rộng.
- Điểm còn mở là quota/giới hạn chi phí trên toàn project Gemini; cap sáu/phút, 50/vòng đời chỉ ở từng process. T04 theo kế hoạch là luồng trình diễn ba phút, responsive/bàn phím/giảm chuyển động/lỗi và phần liên hệ khi có thông tin thật.
- Sửa dòng TASKS lỗi thời “T03 chưa bắt đầu” và mô tả bàn giao một chat xuyên mode/@ không zoom. Chi tiết tại [T03_ACCEPTANCE](T03_ACCEPTANCE.md). Đã chạy lại 25/25 bài T03 qua (1,5 phút); capability Vercel hiện available=true, credentialStatus=ready, model gemini-3.5-flash-lite. Không sinh request generation mới; dùng bằng chứng generation/action thật đã lưu. Không sửa code ứng dụng, không triển khai T04/T05 hoặc publish cloud.

## Review style theo ảnh tham khảo, giữ cấu trúc

- Thêm lớp theme CSS riêng: nền xám khoáng, panel trắng mờ, viền nhẹ, shadow mềm, điều khiển xanh lam; đồng bộ header/tab/KPI/chat/composer/gợi ý/HUD/modal. Giữ nguyên các khối, vị trí và kích thước gọn hiện hành, không thêm menu/chart từ mẫu.
- Tin người dùng giữ lệch phải/màu đậm, tin AI lệch trái/màu nhạt; chat 13px. Không sửa code AI, mô phỏng, camera/GLB hoặc màu trạng thái vận hành.
- Build/typecheck/Prettier/diff-check qua; 13 bài chat/KPI/mô phỏng qua (Playwright last-run passed, không có bài lỗi), thêm bài bố cục desktop/mobile qua (40,9 giây). Đã xem ảnh 1440×900 và 390×844; card vẫn cao 92,34px trên desktop, cỡ chat và phân biệt người/AI được giữ, tab active xanh lam. Chỉ thêm theme CSS và import, không sửa component/logic. Không publish cloud hoặc mở T04/T05.

## Review card gọn, @ zoom ngay, phân biệt người/AI và câu hỏi tình huống

- Thu gọn bốn card Hiện trạng, bỏ sparkline/icon lớn, giảm padding và giữ mở cửa sổ chi tiết. Tin người dùng nền xanh đậm/chữ trắng, lệch phải và có icon người; tin AI nền nhạt lệch trái, icon/nhãn riêng; giữ 13px.
- Chọn @ trong gợi ý gọi focus ngay ở tab đang mở, không chờ gửi chat và không gọi API. Giữ bản nháp và nguồn từng tin.
- Sửa câu “nếu 4 inverter bị hỏng thì sao”: trước đây bị loại khỏi nhóm lệnh native bởi nhánh ‘nếu’. Nay nhận tình huống cụ thể trong Mô phỏng, dùng tham số/thời gian hiện có và chạy qua bộ tính; câu hỏi kiểm tra/sửa chữa không bị ép thực thi. Hướng dẫn máy chủ nêu rõ tab đang mở, không yêu cầu người dùng chuyển lại Mô phỏng.
- Build/typecheck/Prettier/diff-check qua; 22/22 bài chat/action/API/KPI/mô phỏng qua (1,9 phút), gồm @ focus camera thật trước khi gửi và tình huống 4 inverter. Đã xem ảnh desktop/mobile: card cao 92px ở 1440×900 (giảm khoảng 50px so với bản trước), vùng 3D/chat mở rộng, chữ tin người dùng trắng rõ trên nền xanh. Đã thử đúng câu “nếu 4 inverter bị hỏng thì sao” trong trình duyệt với UI build 49dd227 kết nối API Gemini thật của Vercel (route API qua fetch Node, không dùng response fixture). HTTP 200 trả action configure/apply=true/fault/scale=4/duration=60; UI tự chọn lỗi inverter, 4 cụm, 1 giờ và hiện 12,96 MWh. Đây là tổn thất phát sinh thêm trên nền đã có INV-03 dừng. Đã xem ảnh kết quả UI; chỉ dùng hội thoại kiểm thử mới và dữ liệu nhà máy hư cấu công khai, không đọc/gửi chat thật hay dữ liệu khách hàng. Không publish cloud, không mở T04/T05.

## Review đúng thiết bị, hai phiên chat và góc tổng quan

- Theo yêu cầu mới, tách Hiện trạng/Mô phỏng thành hai phiên độc lập, mỗi phiên giữ lịch sử/bản nháp/trạng thái chờ riêng. Đổi thiết bị trong cùng mode vẫn giữ chat. Đáp án đến muộn lưu đúng mode, không trộn hoặc chặn ô chat của mode khác; server lọc lịch sử khác mode.
- AI phải xác nhận trạng thái thiết bị được hỏi trước; bổ sung dữ kiện thiết bị đích và câu mở đầu từ snapshot khi model nhảy thẳng sang lỗi thiết bị khác. Trường hợp INV-04 bình thường, INV-03 dừng được kiểm thử riêng.
- Thêm câu hướng dẫn sau phân tích Hiện trạng đầu tiên; popup @ gọn hơn có icon/tên/khu vực/mã. Tổng quan 3D đổi sang góc nhìn thẳng từ cổng theo ảnh, camera [0,33,51], không đổi geometry/phép tính.
- Build/typecheck/Prettier/diff-check qua. 30/31 bài liên quan qua; test cỡ chữ cần selector riêng vì có thêm đoạn hướng dẫn. Sau cập nhật selector, 11/11 bài chat/action qua (35,4 giây); toàn bộ camera/reset trong lượt 31 bài đã qua. Đã xem ảnh góc nhìn thẳng, popup mới và hướng dẫn trên desktop/mobile. Không nới ngưỡng ảnh/camera.
- Thử lệnh Gemini thật của bản 233d803 trả HTTP 200 nhưng chưa có action; đã tăng hướng dẫn và function calling cho lệnh mô phỏng rõ ràng. Đã kiểm tra 5 request Gemini thật trên Vercel ở dee93a5, đều HTTP 200: chỉ thiết lập mây che 4 cụm/2 giờ (apply=false); xem kết quả (apply=true, giảm 7,7371 MW, mất thêm 15,4742 MWh); reset; hỏi INV-06 nhận đúng suy giảm 2%; chọn INV-04 rồi hỏi “Sao lại bị dừng phát điện? lâu chưa?” nhận đúng INV-04 bình thường trước, INV-03 mới dừng 15 phút từ 10:15. Các action có tham số hợp lệ, focusAssetId đúng INV-06/INV-04. Chỉ dùng hội thoại kiểm thử mới với fixture nhà máy hư cấu công khai; không đọc/gửi chat thật hoặc dữ liệu khách hàng. Kiểm tra thêm guard không gọi INV-06 suy giảm là bình thường: 5/5 bài action/API qua (2,2 giây). Sau tách luôn cấu hình gửi từ Hiện trạng khỏi thiết lập Mô phỏng, build qua và 6/6 bài session/action/API qua (10,8 giây). Không publish cloud hoặc mở T04/T05.

## Review header, lệnh AI mô phỏng và camera theo chat

- Đưa tên nhà máy lên header, bỏ rail/breadcrumb/pill/avatar, giữ hai tab nổi bật ở giữa và nhãn dữ liệu mô phỏng cấp trang. KPI có icon/màu/sparkline từ cùng snapshot; mở rộng vùng hiển thị phía dưới. Giữ model, công thức và quy ước màu đường điện T02.
- Đổi lời chờ thành “Anh/Chị chờ em một chút nhé…”. Native Gemini function calling thiết lập/xem/reset ba kịch bản trong tab Mô phỏng; số MW/MWh từ bộ tính, không do model sinh. Kiểm tra tham số cả server/browser và ngăn lệnh đến muộn ghi đè thiết lập hoặc chạy khi đã về Hiện trạng.
- Hiện trạng tự focus camera khi gửi câu hỏi về thiết bị hoặc khi đáp án toàn nhà máy nhắc thiết bị trọng tâm. Không focus Mô phỏng từ đáp án Hiện trạng đến muộn; lịch sử vẫn một phiên với nhãn nguồn riêng.
- Build/typecheck/Prettier/diff-check qua. Lượt đầy đủ 55 bài có 54 qua; một bài KPI không tải được JS/CSS do chạy build đồng thời với test. Đã chạy lại trên build hoàn chỉnh: 10/10 bài action/chat/camera/KPI qua (48,9 giây), không nới ngưỡng. Đã xem ảnh desktop 1440×900 và mobile 390×844; không tràn ngang. Kiểm tra function calling thật trên Vercel sau push được ghi bổ sung khi hoàn tất. Chưa publish cloud hoặc mở T04/T05.

## Review một phiên chat, gợi ý @ và zoom gần hơn

- Bỏ thanh ngữ cảnh trên chat. Lịch sử và bản nháp giữ xuyên thiết bị/mode/revision/reset; mỗi tin và đáp án đến muộn giữ đúng context lúc gửi, có nhãn thiết bị/mode/kịch bản. API nhận lịch sử gần nhất kèm context hợp lệ, không trộn dữ kiện cũ sang nguồn mới.
- Gõ @ tìm ID/tên tiếng Việt không dấu, ↑↓ và Enter/Tab chọn, Esc đóng. Chọn gợi ý không bắt buộc thao tác 3D, không gây zoom hoặc gọi API; giữ câu hỏi đang gõ. Nút gửi khi sẵn sàng có icon trắng trên nền xanh, khi chờ có spinner. Giới hạn body UTF-8 trước khi gửi nhưng giữ toàn bộ lịch sử hiển thị.
- Hai tab giữa heading, lớn/nổi bật hơn. Thiết bị 3D nhìn gần hơn 1,5 lần (distance chia 1,5, minDistance 12), không đổi overview/FOV/GLB.
- Build/typecheck qua; lượt đầu 14/15 bài chat qua, sửa phép đo màu sau transition. Lượt đầy đủ 48 bài có 47 qua; camera pan cần đọc vị trí và target cùng một frame thay vì hai DOM request lúc damping đang chạy. Sau sửa cách đo đồng thời camera/target, giới hạn UTF-8 lịch sử và popup @ trên màn hình thấp, 18/18 bài liên quan qua (1,4 phút); build/typecheck/Prettier qua. Đã xem ảnh desktop/mobile: icon gửi trắng, lịch sử còn đủ nhãn cũ, popup @ và tab giữa. Ngưỡng ảnh/geometry camera giữ nguyên. Đã triển khai cb33c0d: GET trang trả HTTP 200, có aria-autocomplete=list, không còn thanh ai-context. Sau xác nhận README/MONITORING là dữ liệu nhà máy hư cấu công khai, đã kiểm tra ba request Gemini thật trên cùng hội thoại kiểm thử mới: INV-03 → PV-06 → toàn nhà máy đều HTTP 200; Gemini so sánh đúng hai thiết bị và nhớ INV-03 được hỏi đầu tiên. Không đọc/gửi lịch sử chat thật hay dữ liệu khách hàng. Không publish cấu hình cloud.


## Review chat toàn nhà máy và thẻ thiết bị

- Mặc định không chọn thiết bị ở cả hai tab; chat gửi assetId=null, máy chủ tái dựng ngữ cảnh toàn nhà máy và không giả chọn INV-01. Chọn thiết bị tạo thẻ @ID trong ô nhập; bỏ thẻ trở về toàn nhà máy. Reset Mô phỏng xóa lựa chọn.
- Chữ chat/ô nhập cùng cỡ 13px với summary; summary đổi thành Trạng thái hiện tại. Cột AI rộng 360/380px, nút gửi icon nằm bên phải ô nhập, giữ Enter/Shift+Enter/IME. Lời chờ tự nhiên hơn. Chat vẫn trọng tâm nhưng giọng trợ lý hỗ trợ giám đốc, giải thích vừa đủ thay vì ép 1–4 câu.
- Không đổi model hoặc phép tính T02. Build/typecheck/Prettier qua. Lượt đầy đủ 47 bài có 44 qua, 3 bài cũ cần đổi giả định lựa chọn ban đầu/ảnh mốc. Sau cập nhật test và bổ sung đủ tín hiệu cho ngữ cảnh toàn nhà máy, 17/17 bài liên quan qua (1,9 phút), gồm toàn bộ chat/API, camera, hover không chọn thiết bị và trạng thái độc lập hai tab. Giữ ngưỡng ảnh camera 0,02; không đổi code 3D để làm test qua. Đã xem ảnh desktop/mobile. Đã triển khai d367a43 và xác minh ba request Gemini thật HTTP 200: hai ngữ cảnh assetId=null có key null đúng nguồn, trả đúng MET-01 (780 W/m², 31 °C), giải thích thứ tự ưu tiên INV-03 → nhánh 06 → GW-01 thành các đoạn mạch lạc; request assetId=INV-03 trả đúng thiết bị. Sau đó thống nhất thêm xưng tôi/anh/chị, tránh gọi bạn; build/typecheck và 9/9 server test qua (2,6 giây). Không thay đổi cấu hình cloud hoặc mở T04/T05.


## Review chat: trả lời trọng tâm, chữ lớn và Enter gửi

- Chat dùng chỉ dẫn riêng với phân tích chủ động: trả lời đúng câu hỏi, ngắn gọn; không ép mọi đáp án theo khuôn trạng thái/bằng chứng/ảnh hưởng/kiểm tra/giới hạn, không lộ tên CONTEXT_JSON.
- Bỏ hai nhãn được khoanh, header ngữ cảnh gọn; phân tích quy tắc thu gọn theo yêu cầu mở. Hội thoại 16px, cuộn tới tin mới, composer gọn. Giữ riêng nguồn mode/asset và logic T02.
- Enter gửi; Shift+Enter xuống dòng; IME/229, câu trống và nhấn lặp khi chờ không gửi nhầm. Build/typecheck/Prettier qua; 14/14 bài chọn qua (50,2 giây): API/model/quota, chat, Enter/Shift+Enter/IME/chống gửi trùng, race, HUD và desktop/mobile T02. Đã xem ảnh desktop/mobile. Sửa race reset bản nháp sau đổi ngữ cảnh: draft gắn key và reset đồng bộ, không để effect đến muộn xóa câu vừa gõ. Đã triển khai 23ab778 và kiểm tra hai request Gemini thật trên Vercel, đều HTTP 200: câu hỏi INV-03 mất bao nhiêu MWh nhận đúng một câu “Inverter 03 đã mất 1,08 MWh trong 15 phút trước 10:30”; câu hỏi MW/MWh chỉ nhận định nghĩa hai đơn vị, không chèn báo cáo trạng thái/ảnh hưởng/kiểm tra và không nhắc CONTEXT_JSON. Không coi hai mẫu này là bảo đảm mọi đầu ra model.


## Bỏ mã truy cập theo yêu cầu demo công khai

- Khách mở trang và hỏi ngay khi Vercel có Gemini_API; không cần AI_ACCESS_CODE hoặc AI_ENABLED=true. AI_ENABLED=false vẫn có thể tạm tắt AI. Giữ key ở máy chủ, giới hạn sáu request/phút, 50 request/process, chống lặp, timeout và độ dài đầu vào/đầu ra. Hạn mức process không phải ngân sách phân tán; quota project Gemini vẫn cần cấu hình riêng.
- Đã bỏ trường nhập mã/header kiểm tra mã, cập nhật kiểm thử cấu hình chỉ key và browser không có ô mã. Giữ nguyên model/logic T02. Build Webpack, typecheck và Prettier qua; 10/10 bài T03 qua (1,6 phút), gồm browser không ô mã, race, timeout và quota. Đã đọc trạng thái Vercel cũ: credentialStatus=ready. Đã push 4f6a7f1, Vercel xác nhận available=true, requiresAccessCode=false và credentialStatus=ready. Request generation thật trả HTTP 502 từ provider; đã bổ sung mã HTTP provider an toàn để chẩn đoán (build/typecheck và 7/7 server test qua), Provider xác nhận HTTP 404: model gemini-2.5-flash không khả dụng. Đã thêm khám phá model từ danh sách được cấp quyền (Flash ổn định, ưu tiên Lite), không cần biến mới; Build/typecheck/Prettier và 11/11 bài liên quan qua (25 giây). Đồng thời sửa phân tích tự động xóa nháp câu hỏi đang gõ. Đã triển khai 0232f9e trên Vercel: available=true, requiresAccessCode=false, credentialStatus=ready, model=gemini-3.5-flash-lite. POST hội thoại thật không có mã truy cập trả HTTP 200; đáp án INV-03 khớp 0 MW, 4,32 MW giảm và 1,08 MWh quá khứ, kết nối vẫn bình thường. Đây là bằng chứng API thật, không phải fixture. Chưa kiểm tra thủ công mọi luồng AI trên URL; kiểm thử race/mobile/quota vẫn là bằng chứng tự động. Không mở T04/T05 hoặc publish cấu hình cloud.


## T03 — quy tắc và đường hội thoại, chờ cấu hình AI thật

- Tiếp tục từ GitHub main `2cf9e6e`; T01/T02 đã được chấp nhận. Giữ 19 ID/16 GLB, camera, màu/chấm dây, phép tính và hai tab T02. Chỉ thay nội dung cột trợ lý, không mở T04/T05 hoặc publish cấu hình cloud.
- Đã có nhận định theo quy tắc: ba vấn đề nền, liên kết đúng thiết bị, phân biệt kết nối/chất lượng với vận hành. Nhánh 06 chỉ tính một lần; tách 1,0944 MWh quá khứ khỏi forecast phát sinh thêm theo `session.initial`.
- Thêm context key chuẩn, API tái dựng dữ kiện phía máy chủ, hội thoại đúng nguồn và loại phản hồi cũ khi đổi mode/asset/revision/submitted/reset. Phân tích chủ động theo snapshot/áp dụng, không gọi mỗi lần hover/camera/chỉnh tham số.
- Đường Gemini generateContent có kiểm tra input/same-origin, mã truy cập bắt buộc, giới hạn bộ nhớ, chống request lặp, timeout và lỗi rõ. Chi tiết cấu hình và giới hạn serverless tại [AI](AI.md).
- Đã kiểm tra runtime/bindings, tên biến, manifest identity và tên file `.env`: không có cấu hình AI ứng dụng, model hoặc credential phù hợp. Người dùng sau đó xác nhận dùng Gemini, biến `Gemini_API` nằm ở Vercel Project Settings; đã hỗ trợ đúng tên, không yêu cầu gửi/copy giá trị key. Model mặc định gemini-2.5-flash có override. GET /api/ai probe danh sách model để xác minh credential mà không sinh token. Cloud hiện bị policy từ chối truy cập domain Vercel (403). Đã lưu hai domain Vercel/Gemini vào draft mạng, chưa áp dụng/publish. **Chưa kiểm chứng credential Vercel hoặc request AI thật thành công; toàn bộ T03 chưa hoàn tất.** API giữ tắt mặc định; cần bật AI_ENABLED, đặt AI_ACCESS_CODE riêng, xác minh quota Gemini và kiểm tra thật trước khi xác nhận tích hợp.
- Kiểm tra: build Webpack/TypeScript qua; lượt hồi quy đầy đủ **43/43 qua (6,6 phút)**. Sau kiểm tra ảnh 1024×768, sửa cuộn cột AI và bỏ câu hỏi đang gõ khỏi request phân tích tự động; build/typecheck lại và **11/11 bài bị ảnh hưởng qua (40,4 giây)**, gồm toàn bộ 10 bài T03 và bố cục desktop/mobile T02. Race test dùng gate để chỉ phát đáp án cũ sau khi đổi ngữ cảnh; không dựa vào delay cố định. Đã xem ảnh desktop/mobile và bố cục 3D 1024 px. Prettier, liên kết tài liệu và diff check qua. Lượt T03 đầu có lỗi assertion chuỗi float/same-origin; lượt sau phát hiện câu hỏi draft đi kèm phân tích tự động, đã sửa và kiểm tra lại. Không coi fixture là bằng chứng Gemini thật.

## Chốt T02 và bàn giao sang chat T03

- Người dùng đã chấp nhận T02 sau mốc ứng dụng **`82cef18`** và yêu cầu rà soát tài liệu để mở chat mới. T01/T02 được chấp nhận; T03 chưa triển khai. Không yêu cầu nghiệm thu lại T02 hoặc làm lại giao diện/model trước khi bắt đầu.
- Viết lại T03_HANDOFF, T02_ACCEPTANCE, MONITORING và SIMULATION thành đặc tả hiện hành: bỏ số nền cũ, biến `activeLayer`/UI phát lại đã bị bỏ và hướng dẫn forecast thiếu initial. Lịch sử triển khai/kiểm tra giữ tại STATUS bên dưới.
- Chốt nền 30,1536 MW, quá khứ đã phát 15,7248 MWh/mất 1,0944 MWh; PV-06/INV-06 là một vấn đề giảm 2%. UI dùng current/initial/untreated và `submitted`; `forecast(config, session.initial)` tính mất thêm tương lai. Không dùng phase=complete làm sự kiện UI hoặc đếm đôi nhánh/trạm/quá khứ.
- Bàn giao phạm vi T03: nhận định theo quy tắc, hội thoại theo thiết bị và phân tích chủ động theo sự kiện áp dụng; hủy ngữ cảnh cũ khi đổi tab/thiết bị/cấu hình/reset; API phía máy chủ và các đường lỗi. Nhà cung cấp/model/credential chưa chốt/xác minh, phiên mới kiểm tra cấu hình trước khi hỏi bổ sung. Không mở T04/T05 hoặc publish cấu hình cloud.
- Đồng bộ TASKS/README/AGENTS, thêm chỉ dẫn ưu tiên tại PRODUCT/DESIGN/IOT. Prompt mở chat mới ở cuối T03_HANDOFF; giao diện/model/card/3 màu/chấm/reset được giữ nguyên. Người dùng chấp nhận qua chat không phải bằng chứng công cụ đã xác minh deployment Ready; URL được người dùng đưa trong ảnh: https://solar-farm-pi.vercel.app/.
- Chỉ sửa tài liệu, không đổi ứng dụng/tests hoặc bắt đầu T03. Kiểm tra bàn giao: đối chiếu code/API, toàn bộ liên kết nội bộ của tài liệu thay đổi, định dạng bốn tài liệu viết lại và git diff --check đều qua. Bằng chứng ứng dụng vẫn là typecheck/build và **33/33 test qua ở `82cef18`**; không chạy lại build/browser cho thay đổi chỉ tài liệu.

## Review chấm nhỏ, ba màu dòng điện và suy giảm nhẹ nhánh 06

- Thay mũi tên cone bằng chấm sphere bán kính 0,11 đơn vị cảnh (đường kính 0,22), vẫn instancing/24 lần vẽ mỗi giây và di chuyển theo Pin → Inverter → Trạm; giảm chuyển động giữ chấm tĩnh, ẩn trang dừng lịch vẽ. Bỏ định hướng cone, không sửa GLB/topology/camera/độ dày dây.
- Cả Hiện trạng/Mô phỏng dùng normal xanh, degraded vàng, stopped đỏ. Nhánh đỏ có `running=false` và không tạo instance chấm; bao phủ lỗi inverter và giảm về 0 do mây. Thiếu dữ liệu giữ xám/không chạy. Chú thích đổi thành chấm và ba mức, theo cùng trạng thái vấn đề.
- PV-06/INV-06 giảm nhẹ 2% từ 10:20, còn 4,41 MW DC/4,2336 MW AC; mất 0,0864 MW AC × 10/60 giờ = 0,0144 MWh. Cả cụm pin/inverter/đường điện vàng và vẫn chạy, giữ mức Lưu ý chưa cần báo động. Một attention tại PV-06, inverter dùng `operatingState`/cùng giải thích, không đếm thêm vấn đề/tổn thất. INV-03 vẫn dừng đỏ, mất riêng 1,08 MWh. GW-01 vẫn Lưu ý trễ dữ liệu.
- Tổng mới đồng bộ KPI/biểu đồ/chi tiết/nguồn Mô phỏng: 30,1536 MW, 15,7248 MWh đã phát trong 30 phút, 1,0944 MWh đã mất, khả dụng 87,5%. Lỗi toàn bộ 24 giờ phát sinh thêm 723,6864 MWh. Lưu ý giờ có thể gồm suy giảm thấp; thay định nghĩa trước đây chỉ là vượt ngưỡng chưa tổn thất.
- Rút gọn cảnh báo/HUD/hồ sơ/modal: bỏ câu dữ liệu mẫu/tham chiếu mẫu/giả định, giữ số đo/ảnh hưởng/hành động. Tổng tổn thất liệt kê INV-03 và PV-06, không đổ toàn bộ cho INV-03 hoặc bỏ phần suy giảm nhẹ. Giữ nhãn nguồn mô phỏng ở cấp trang và tài liệu giả định, không khai báo đã có kết nối IoT thật.
- Cập nhật PRODUCT, DESIGN, IOT, MONITORING, SIMULATION, README, nghiệm thu/bàn giao T03. Không mở AI hay thay cấu hình cloud. Các thông số/mũi tên/logic dây đỏ mọi vấn đề trong các review cũ bên dưới là lịch sử.
- Kiểm tra: TypeScript/build Webpack qua. Lượt 8 bài liên quan có 7 qua; bài còn lại so sánh float 1,08 với 1,0800000000000003 bằng equality, đã chuyển kiểm tra năng lượng sang tolerance. Các bài mới/điều chỉnh kiểm tra tổng tổn thất có hai nguồn, không đếm hai lần nhánh 06, dot thực sự chuyển động/bán kính nhỏ, vàng còn công suất, đỏ dừng cả khi mây giảm 100%, giảm chuyển động và nền/reset độc lập. **33/33 bài hồi quy qua (3,2 phút)**; Prettier/git diff --check qua. Đã xem ảnh cảnh 3D ba màu và hồ sơ PV-06 có số đo/tổn thất mới, không còn đoạn giả định trong cảnh báo. Chưa xác minh deployment Vercel mới Ready.

## Review nền Mô phỏng, khôi phục và chi tiết từ card Hiện trạng

- Mô phỏng bắt đầu từ bản sao độc lập Hiện trạng (INV-03 dừng phát, PV-06 58 °C, GW-01 850 ms), khớp số đo, ba vấn đề, lịch sử và đường điện. `Session.initial` clone nguồn; faults hợp lỗi nền/kịch bản, DC factors nhân nền/sự kiện. Kịch bản không chữa lỗi có sẵn hoặc ghi ngược Hiện trạng.
- Tổn thất kịch bản tính **phát sinh thêm** so với 30,24 MW nền, không cộng 1,08 MWh đã mất trước 10:30. Lỗi toàn bộ 8 trong 1 giờ mất thêm 30,24 MWh (24 giờ 725,76 MWh); nhắm inverter đã dừng sẵn mất thêm 0. Năng lượng Run của phiên chỉ tích phân tương lai dù lịch sử tín hiệu seed 31 mẫu. API T02 không truyền initial vẫn giữ đường nền khỏe mạnh cho các test/đối chiếu cũ.
- Thêm nút **Về trạng thái ban đầu**, xóa kịch bản/kết quả/mây/bụi, trở về 1 cụm/1 giờ, chọn INV-01/camera tổng quan và phục hồi bản sao dữ liệu ban đầu. Các vấn đề có sẵn được giữ; thẻ giải thích trong vùng kịch bản ghi rõ thông tin trước kịch bản, không trình bày số đo quá khứ như số đo mới.
- Xóa khối công suất/thời tiết/thiết bị chú ý bên dưới Hiện trạng. Bốn card thành nút mở modal: Công suất (đồ thị, thực tế/tham chiếu/mất, bảng inverter và thời tiết), Năng lượng (đồ thị tích phân, bảng 15 phút), Khả dụng (đồ thị 0–100%, phân biệt kết nối, ba vấn đề và link thiết bị), Tổn thất (đồ thị MWh/phép tính/INV-03). Tất cả đọc snapshot/lịch sử cùng nguồn, giữ nhãn dữ liệu giả định. Link thiết bị đóng modal, focus đúng model/HUD. Esc/nút đóng phục hồi tiêu điểm card, nội dung modal cuộn được trên mobile.
- `monitoring-metrics.ts` tích phân đầu trái, tham chiếu theo cùng bức xạ/cấu hình, khả dụng từ lỗi inverter; không lấp mẫu thiếu bằng 0. Đối chiếu: năng lượng 15,7392 MWh, tham chiếu 16,8192 MWh, mất 1,08 MWh; hai khoảng 15 phút lần lượt 8,1792 và 7,56 MWh.
- Đã xem ảnh modal desktop, modal năng lượng 390 px, thiết lập Mô phỏng mobile/1024 px. Cập nhật PRODUCT, DESIGN, IOT, SIMULATION, MONITORING, README, checklist nghiệm thu và bàn giao T03; không mở AI, sửa GLB hoặc cấu hình cloud. Các review giữ nền Mô phỏng khỏe mạnh/giữ bảng dưới Hiện trạng bên dưới là lịch sử.
- Kiểm tra: TypeScript/build Webpack qua. Lượt mục tiêu đầu 14/15 qua, tìm và sửa lỗi trả focus về card khi đóng Esc. Lượt hồi quy 32/33 qua; bài còn lại dùng kỳ vọng cũ 17 thiết bị bình thường ở nền Mô phỏng, đã cập nhật thành 16 vì GW-01 cũng có Lưu ý. **5/5 bài liên quan qua khi chạy lại**, gồm bài GLB, đối chiếu dữ liệu, kế thừa nền, modal/focus và reset cả mây/bụi/lỗi (gỡ vật liệu/hiệu ứng, giữ đúng đường điện). Prettier/git diff --check qua. Chưa xác minh deployment Vercel mới Ready/URL thật.

## Review đường điện và animation dòng công suất

- Thêm 16 tuyến điện trong 3D: 8 DC cụm pin → inverter, 8 AC inverter → trạm thu gom. Dựng từ quan hệ thiết bị trong module `power-network.ts`; đi sát cạnh pin/lối kỹ thuật với các tuyến riêng, không sửa GLB, footprint, vị trí hoặc camera. Không nối điện tới gateway/trạm thời tiết.
- Đường xanh khi nhánh không có vấn đề, đỏ khi thiết bị liên quan có `attention`/`scenario` hoặc lỗi vận hành. Đỏ là nhánh có vấn đề, không tự đổi mức Lưu ý thành Cảnh báo hoặc tự gán tổn thất. Hiện trạng: nhánh INV-03 đỏ/0 MW/không mũi tên; nhánh PV-06/INV-06 đỏ vì Lưu ý nhiệt nhưng vẫn có mũi tên (4,5 MW DC/4,32 MW AC); Lưu ý độ trễ GW-01 không làm đỏ dây điện.
- Mũi tên đi theo Pin → Inverter → Trạm, chỉ chạy với số đo valid/finite dương. Công suất 0 hoặc missing/stale/invalid không chạy; khi chưa có vấn đề đã biết và thiếu dữ liệu thì dây xám. Màu/chiều đọc snapshot riêng của từng tab, gồm bản nháp Mô phỏng. Không sửa phép tính MW/MWh, ngưỡng, cảnh báo hoặc lịch sử.
- Mũi tên dùng instancing, lịch invalidate 24 lần/giây, dừng khi trang ẩn; giảm chuyển động giữ mũi tên tĩnh. Không nhận raycast nên vẫn chọn/hover model; thêm chú thích đường riêng dưới chú thích trạng thái thiết bị, hỗ trợ mobile. Tốc độ chỉ minh họa chiều truyền, không tỷ lệ dòng A/MW hoặc tốc độ electron. Tuyến là sơ đồ, không phải thiết kế thi công điện.
- Đã cập nhật PRODUCT, DESIGN, IOT, MONITORING, README và checklist nghiệm thu. Chưa mở AI hoặc thay cấu hình cloud.
- Kiểm tra: TypeScript/build Webpack/Prettier/git diff --check qua; 2/2 bài mới qua, xác nhận topology, MW tổng hợp, Lưu ý còn công suất, không truyền lỗi GW, missing/stale, toàn bộ inverter lỗi, màu material thực tế, biến đổi instance mũi tên thực tế, giảm chuyển động, click model và cách ly hai tab. Đã xem ảnh desktop/mobile 390 px. **29/29 bài hồi quy qua (2,9 phút)**, gồm camera, hover, model, hồ sơ/lịch sử Hiện trạng, các phép tính và luồng Mô phỏng. Chưa xác minh deployment Vercel mới Ready/URL thật.

## Review Hiện trạng: ba vấn đề khác nhau và lịch sử đồ thị

- Hiện trạng có đúng 3 vấn đề trên 3 thiết bị: INV-03 dừng phát điện (**Cảnh báo**), PV-06 nhiệt độ vượt ngưỡng và GW-01 độ trễ truyền dữ liệu cao (**2 Lưu ý**). Cảnh báo phải có tổn thất đã xảy ra; Lưu ý nêu ngưỡng bị vượt, chưa giảm sản lượng và nguy cơ nếu tiếp diễn. Quy ước này thay bộ hiện trạng hai vấn đề nhiệt trước review; preset/bộ tính Mô phỏng được giữ riêng.
- INV-03 AC 0 từ 10:15, tham chiếu 4,32 MW; mất **1,08 MWh trong 15 phút**. Tổng hiện trạng **30,24 MW**, khả dụng phát điện **87,5%**, năng lượng **15,7392 MWh** chỉ trong 10:00–10:30. IoT vẫn online; không quy lỗi phát điện thành lỗi kết nối.
- PV-06 58 °C > ngưỡng mẫu 55 °C, vẫn 4,5 MW DC; giải thích nguy cơ giảm hiệu suất/điểm nóng. GW-01 850 ms > ngưỡng giám sát 500 ms, đủ 18 nguồn hợp lệ; giải thích nguy cơ trễ số đo/cảnh báo. Ngưỡng là giả định demo, không phải tiêu chuẩn an toàn thiết bị thật.
- Tạo module `monitoring.ts` độc lập và lịch sử xác định **31 mẫu, 10:00–10:30 ICT**, cùng nguồn DC/AC/tổng hợp/tích phân. Tất cả tín hiệu có thời gian lịch sử rõ và mẫu cuối khớp số hiện tại; đồ thị không còn một điểm hoặc nhãn thời gian tương lai. Dữ liệu ổn định có đường phẳng. HUD/hồ sơ cùng có thẻ giải thích; tổn thất màu đỏ; HUD cuộn được trên mobile.
- Mô phỏng chưa áp dụng kịch bản dùng `session.base` của chính nó, tránh mang ba vấn đề Hiện trạng vào bản nháp. Không đổi GLB, vị trí, camera, công thức kịch bản, thêm AI hoặc dịch vụ.
- Cập nhật PRODUCT, DESIGN, IOT, README, checklist nghiệm thu và [MONITORING](MONITORING.md) về giả định/công thức/cách test. Các mục snapshot Hiện trạng hai cảnh báo nhiệt bên dưới là lịch sử.
- Kiểm tra: TypeScript, build Webpack, Prettier mã thay đổi và git diff --check qua; **27/27 test qua (2,7 phút)**. Test mới đối chiếu tổng công suất/năng lượng/tổn thất với lịch sử, 1 Cảnh báo + 2 Lưu ý, mã lỗi vẫn online, 31 thời điểm/mẫu cuối trên tất cả thiết bị, tính xác định và cách ly mô phỏng; browser kiểm tra giải thích, đường đồ thị, chuyển thiết bị và mobile không tràn ngang. Đã xem ảnh desktop có đường đồ thị và mobile 390 px có đồ thị độ trễ; 2/2 bài Hiện trạng qua khi kiểm tra lại việc cuộn/xem chart. Chưa xác minh deployment Vercel mới Ready/URL thật; người dùng nghiệm thu qua GitHub main.

## Review trạng thái inverter dễ hiểu

- HUD đổi tín hiệu mã lỗi 0/1 thành “Trạng thái inverter: Bình thường/Đang lỗi”. Missing/invalid ghi Chưa xác định; stale kèm nhãn dữ liệu cũ, không suy diễn thành bình thường.
- Khi mã 0 nhưng mô hình có suy giảm/cảnh báo nhiệt, HUD hiển thị trạng thái đó thay vì ghi Bình thường mâu thuẫn với trạng thái chung.
- Hover cũng không hiện mã lỗi thô; chỉ hồ sơ chi tiết giữ mã kỹ thuật.
- Dialog chi tiết vẫn giữ giá trị mã số và lịch sử; nhãn giải thích rõ “Mã lỗi mô phỏng (0: bình thường, 1: đang lỗi)”. Không đổi telemetry, công suất hoặc công thức kịch bản.
- Kiểm tra: TypeScript/build Webpack/Prettier/git diff --check qua; bài Chromium liên quan qua, xác nhận HUD/hover dùng chữ, dialog còn mã số, chuyển lỗi → suy giảm → bình thường nhất quán. Chưa xác minh deployment Vercel mới Ready.

## Review màu chỉ số tổn thất và nhãn nguồn dữ liệu

- Hai ô công suất giảm/mất và tổng sản lượng mất dùng chữ đỏ, nền đỏ nhạt để thể hiện tổn thất.
- HUD/dialog đổi nhãn thành “Dữ liệu mô phỏng theo kịch bản”, bỏ ghép “Đang kết nối” dễ hiểu nhầm là kết nối nhà máy thật. Lý do lỗi inverter cũng ghi rõ kết nối IoT trong mô phỏng vẫn bình thường; không đổi trường connection hoặc công thức số đo.
- T02 đã có số đo tính theo mô hình; không thiếu dữ liệu để tính kịch bản. Chưa có kết nối IoT/SCADA nhà máy thật và không coi đây là phần đã tích hợp.
- Kiểm tra: TypeScript/build Webpack/git diff --check qua; **3/3 bài liên quan qua**, bao gồm HUD/dialog cùng nhãn mới, kết quả giờ và Hiện trạng độc lập. Đã xem ảnh kết quả với hai ô màu đỏ. Chưa xác minh deployment Vercel mới Ready.

## Review khối thiết lập/kết quả gọn và thời gian theo giờ

- Một khối phía trên chứa loại kịch bản, quy mô, thời gian và hai kết quả MW/MWh. Kết quả chỉ xuất hiện sau nút Xem kết quả mô phỏng; chỉnh lựa chọn trả kết quả về — và gỡ ảnh hưởng cũ để không dùng số của cấu hình trước.
- Thời gian 1/2/3/4/6/8/12/24 giờ, quy đổi phút nội bộ và tăng giới hạn bộ tính lên 1440. Không chạy timer/tích lũy hoặc đồ thị trên UI hiện hành; 3D hiển thị snapshot tại lúc đang bị ảnh hưởng.
- Bỏ UI nâng cao/tham số/kết quả lặp bên dưới, điều kiện mẫu và danh sách chú ý khỏi Mô phỏng. Giữ Hiện trạng, model/ID, chọn/hover/HUD/dialog và camera. T02C vẫn được bảo toàn ở bộ tính/test, không còn UI nâng cao.
- Kiểm tra: TypeScript, build Webpack, Prettier và git diff --check qua; **25/25 test qua (2,7 phút)**. Test UI mới xác nhận kết quả chỉ áp dụng sau nút bấm, thay cấu hình xóa kết quả/cảnh cũ, lựa chọn giờ đúng, 24 giờ cho kết quả tích phân đúng và Hiện trạng độc lập. Các bài toán can thiệp T02C vẫn được kiểm tra ở core; test UI nâng cao cũ được thay bằng luồng công khai mới. Đã xem ảnh 1366 px, kết quả desktop và mobile. Chưa kiểm tra deployment Vercel mới Ready/URL thật.

## Review đơn giản hóa trải nghiệm mô phỏng

- Luồng chính: chọn kịch bản → quy mô 1–8 cụm → thời gian ảnh hưởng → xem công suất/sản lượng giảm hoặc mất. Thanh thiết lập nằm ở phía trên trong khung 3D, không che canvas.
- Hiện hai kết quả chính: MW giảm/mất (kèm % toàn nhà máy), MWh mất trong thời gian đã chọn. Kết quả là ước tính toàn thời đoạn chưa xử lý; cảnh 3D phát lại cùng phạm vi dữ liệu. Phân biệt kết quả này với tích lũy khi phát lại.
- Mở rộng quy mô cho cả ba kịch bản. Mây mặc định vẫn bốn cụm trái, có thể chọn 1–8; bụi/lỗi mặc định một cụm. Phạm vi màu/mây, số đo và dự kiến cùng dùng `affectedInverters`.
- Tốc độ, ba biểu đồ và so sánh vệ sinh/sửa chữa giữ trong “Xem diễn biến và so sánh phương án (nâng cao)”, mặc định đóng. Mức giảm/vị trí chi tiết là tùy chọn nâng cao; không bắt người dùng mới xử lý các tham số này. Hiện trạng vẫn độc lập.
- KPI chính của Mô phỏng chỉ còn công suất hiện tại và sản lượng mất ước tính trong thời gian đã chọn; tích lũy/khả dụng nằm trong phần nâng cao. Về góc nhìn tổng quan ẩn HUD để không che vùng bấm model; lựa chọn thiết bị vẫn được giữ và click lại mở HUD.
- Build/TypeScript/Prettier/git diff --check qua; lượt full **27/27 test qua (3,1 phút)**. Sau chỉnh độ rộng thanh thiết lập cho 1024 px và nhãn lựa chọn, build lại và **2/2 bài liên quan qua**; đã xem ảnh 1024 px và ảnh luồng đơn giản. Test thêm quy mô 1/4/8, đúng MW/MWh và phạm vi mây, nâng cao đóng mặc định, Hiện trạng độc lập. Đã xem ảnh desktop và kiểm tra quy mô/luồng mới trên Chromium; chưa xác minh deployment Vercel mới Ready.
- Các lượt đầu tìm thấy HUD che model khi về tổng quan và giới hạn chiều cao sau thêm thanh thiết lập; đã sửa. Test so chiều cao hai khung nay đọc cùng một lần render và chờ ổn định, giữ dung sai 1 px. Kiểm tra bố cục bổ sung đảm bảo mọi button/select nằm trong khung tại 1440/1366/1024 px.

## Kết luận rà soát T02 trước review đơn giản hóa

**Mã T02 đã push main: `61f4ca9`. T02A/B/C hoàn thành triển khai và kiểm tra cục bộ; chưa có xác nhận nghiệm thu T02 của người dùng trên Vercel.** T01 đã được chấp nhận; T03 chưa bắt đầu. Không coi T02 hoàn thành là toàn demo đã sẵn sàng gửi khách.

Kiểm tra lại ngày 03/11/2026: build Webpack, TypeScript và **25/25 test qua (3,2 phút)**; input→KPI đo 4,0 ms trong lượt Chromium headless này. Không đổi mã ứng dụng trong lượt rà soát. Đã kiểm tra đường dẫn Markdown nội bộ và whitespace.

Đối chiếu yêu cầu/mã/test, checklist Vercel và giới hạn tại [T02_ACCEPTANCE](T02_ACCEPTANCE.md). Bàn giao bước sau tại [T03_HANDOFF](T03_HANDOFF.md). Những mục review T01/T02A bên dưới là lịch sử, có thể mô tả khả năng tại mốc cũ; lấy kết luận này và SIMULATION làm trạng thái hiện hành.

## T02B/T02C — mô phỏng kịch bản và so sánh

- Hoàn thiện mô hình ba kịch bản, telemetry tính theo cùng nguồn với KPI/viền/HUD/cảnh báo/biểu đồ. AC về 0 khi inverter lỗi, DC bị giới hạn khai thác, mã lỗi/khả dụng và kết nối độc lập. Mây chỉ phủ bốn cụm trái; bụi và lỗi đúng vùng mục tiêu. Giữ GLB/model/ID/camera T01 và Hiện trạng độc lập.
- Vòng đời xem thử → chạy → pause/tiếp tục → hoàn thành; đổi tham số tăng revision, xóa kết quả cũ và cập nhật xem thử; chạy lại/reset sạch lịch sử. Chuyển Hiện trạng/ẩn tab dừng phát lại. Tốc độ 1/5/15 phút mỗi giây không đổi tích phân.
- T02C thêm thời điểm hoàn tất vệ sinh/khôi phục, phần khôi phục bụi và hai lớp Chưa xử lý/Có phương án. Ba đường cùng seed/thời gian, dự kiến toàn kỳ tách tích lũy đã chạy; năng lượng thu hồi không vượt đường cơ sở, không gọi là lợi nhuận/ROI.
- Công thức và giới hạn cập nhật tại SIMULATION; README hướng dẫn kiểm tra. Chưa AI/T03, không mở T04/T05 hoặc kết nối thiết bị thật. Chưa xác minh deployment Vercel mới Ready/URL thật.
- Kiểm tra cuối: **25/25 test qua (2,9 phút)**, TypeScript/build Webpack/Prettier/git diff --check qua. Bao phủ mất toàn nhà máy, 0% suy giảm, biên mây/repair, phương án 0%/50%/100%, MW→MWh, replay xác định, pause/hoàn thành/reset/revision, cả ba preset và mobile không tràn ngang. Đã xem ảnh so sánh desktop/390 px. Độ trễ input→KPI trong lượt Chromium headless: **14,9 ms** (một lượt đo, không phải cam kết mọi thiết bị).
- Lượt đầu 23/24 qua, phát hiện thao tác pause sát mốc hoàn thành có thể thành chạy lại khi trạng thái đổi trong hàng đợi; đã chốt ý định nút trước khi cập nhật state và tách key play/pause. Lượt cuối kiểm tra lại toàn bộ thành công; không dùng lượt lỗi làm bằng chứng hoàn tất.

## Mốc hiện tại

**T01 — hoàn thành, được người dùng chấp nhận ngày 03/11/2026.** `40f24bf` là mốc giao diện T01 trước đây; mã T02 hiện tại là `61f4ca9`, đã push `main`. Người dùng đã xác nhận bản test Vercel hoạt động và chấp nhận kết quả T01; không coi đó là nghiệm thu toàn demo T02–T05 hoặc bằng chứng cloud đã trực tiếp kiểm tra deployment mới. T02A/B/C đã triển khai nền, kịch bản và so sánh phương án; mốc tiếp theo sau nghiệm thu là T03 khi được người dùng giao. Xem [nghiệm thu T02](T02_ACCEPTANCE.md) và [bàn giao T03](T03_HANDOFF.md).

## Review đồng bộ trạng thái kịch bản và hồ sơ

- Khắc phục viền đỏ/vàng do kịch bản nhưng HUD/popup vẫn chỉ ghi trạng thái nền. Thêm annotation kịch bản tách riêng khỏi operation/telemetry; viền, hover, HUD, popup và danh sách chú ý đọc chung `assetStatus`.
- Thiết bị trong vùng kịch bản ghi rõ “Mây che/Bám bụi/Lỗi inverter · xem thử”; cụm pin liên quan lỗi inverter ghi “Ảnh hưởng lỗi inverter”. Giữ cảnh báo nhiệt có mức nghiêm trọng cao hơn và giải thích cùng lý do kịch bản. Mức 0 và bỏ kịch bản gỡ annotation; chuyển Hiện trạng không mang annotation sang.
- Hồ sơ ghi rõ vận hành nền và số đo chưa tính tác động kịch bản, không biến số đo nền thành kết quả sự cố hoặc giả mất kết nối. Chưa mở rộng tính vật lý T02B/T02C/AI.
- Kiểm tra: TypeScript, build Webpack, Prettier và git diff --check qua; **19/19 test qua (2,6 phút)**. Test mới đối chiếu mức viền/HUD/popup, chuyển lỗi → bụi → Hiện trạng, dữ liệu nền không bị ghi đè, phạm vi mây, mức 0 và ưu tiên cảnh báo nhiệt. Chưa xác minh deployment Vercel mới Ready hoặc URL thật.

## Review lựa chọn và lớp minh họa kịch bản trong 3D

- Chuyển bộ chọn ba kịch bản và lựa chọn tự cấu hình vào góc trên trái trong khung 3D, chỉ ở tab Mô phỏng; bỏ hàng thẻ lặp bên dưới. Có layout riêng cho điện thoại, tránh che HUD. Phần tham số tự cấu hình đặt dưới cảnh để không bị bộ chọn mới che.
- Mây minh họa phủ bốn cụm phía x âm của bố trí: PV-01, PV-02, PV-05, PV-06. Bảng tự cấu hình ghi phạm vi cố định tương ứng, không giả chọn một inverter khác rồi vẽ mây sai vùng. Khối mây không nhận raycast để vẫn chọn thiết bị được.
- Bám bụi đổi màu riêng vật liệu PV_CELLS của cụm được chọn sang màu đất, tăng độ nhám và có nhãn “Bám bụi · ID”. Vật liệu clone từng thiết bị; đổi kịch bản/đổi tab khôi phục màu gốc, không đổi màu theo cảnh báo vận hành. Mức 0 không tạo lớp bụi/mây.
- Không sửa GLB, bố trí hoặc công thức công suất; vẫn là minh họa T01/T02A, chưa tính tác động kịch bản T02B. Hiện trạng giữ snapshot độc lập.
- Kiểm tra: TypeScript/build Webpack/Prettier/git diff --check qua; full **17/17 test qua**. Đã xem ảnh bụi, mây và mobile; sau chỉnh khoảng cách chú thích/HUD, build lại và **3/3 test liên quan qua**, có assertion không chồng bộ chọn trên desktop/mobile, đúng 4 cụm mây, bụi đổi riêng PV-01 và khôi phục khi đổi kịch bản. Hiện trạng không nhận lớp minh họa. Chưa kiểm tra deployment Vercel mới Ready hoặc URL công khai.

## Review tách theo dõi hiện trạng và mô phỏng

- Mặc định mở tab Hiện trạng với snapshot mẫu độc lập; tab Mô phỏng giữ Run, tham số, lớp minh họa và lựa chọn thiết bị riêng. Dùng hai đối tượng snapshot riêng, không ghi ngược từ mô phỏng vào hiện trạng.
- Chuyển về Hiện trạng tự tạm dừng mô phỏng; quay lại giữ kết quả và tham số. Điều khiển chạy/reset, ba thẻ và tự cấu hình chỉ xuất hiện ở Mô phỏng. Badge, KPI và biểu đồ có nhãn theo chế độ. Tabs hỗ trợ phím mũi tên/Home/End và hiển thị ở 390 px.
- Kiểm tra: TypeScript, production build Webpack, git diff --check và **17/17 test qua (2,1 phút)**. Test mới xác nhận mặc định Hiện trạng, không có điều khiển/kịch bản ở Hiện trạng; chạy/reset mô phỏng không đổi KPI/lịch sử hiện trạng; tham số, lựa chọn và lượt mô phỏng giữ riêng; chuyển tab tạm dừng, hỗ trợ bàn phím và hiển thị ở 390 px.
- Giữ GLB, bố trí, camera và hồ sơ T01; không mở rộng mô hình kịch bản T02B/T02C/AI. Cập nhật PRODUCT, DESIGN, SIMULATION và README để tránh tiếp tục trộn hai workflow.

## T02A — điều kiện nền và IoT mô phỏng

- Thêm bộ sinh snapshot/reducer thuần ngoài UI với ID/revision, seed 1, bước 60 giây và thời gian mô phỏng cố định. Chạy nền, tạm dừng và đặt lại riêng; không dùng đồng hồ máy để sinh số đo hoặc làm stale.
- Giữ 19 ID/quan hệ, GLB/bố trí/light mode/logo/HUD/popup và cơ chế chọn/camera T01. KPI, biểu đồ, hồ sơ, thời tiết, cảnh báo và viền nhận cùng snapshot; không remount cảnh khi tick. Hai fixture nhiệt giữ nguyên, không giảm công suất/khả dụng.
- Nền 36 MW DC / 34,56 MW AC; tích phân hình thang MW × giờ thành MWh. Tổng trạm lấy từ inverter, không cộng trùng. Chất lượng valid/stale/invalid/missing; heartbeat độc lập vận hành. Thiếu công suất inverter làm tổng đo null, không thành 0; năng lượng/khả dụng ghi rõ theo mô hình.
- TypeScript và production build Webpack qua. Test mới kiểm tra chuỗi deterministic, 60 phút = 34,56 MWh, pause/reset, revision/lịch sử, stale/thiếu/invalid và inverter lỗi online. Browser kiểm tra chạy–pause–reset, dialog và giữ camera/lựa chọn.
- Lượt full đầu: 15/16 qua; bài camera T01 có sai lệch trong kiểm tra pan (độ dịch camera so với target). Chạy riêng lại cùng mã không sửa camera/test đã qua 1/1; không tái hiện lỗi ở lượt riêng. Lượt chạy lại toàn bộ cùng mã: **16/16 qua (1,8 phút)**, không sửa camera/test hoặc nới assertion. TypeScript, Prettier và git diff --check qua.
- Công thức/giới hạn: [SIMULATION](SIMULATION.md). Ba preset/tự cấu hình vẫn minh họa T01; chưa T02B/T02C/AI/IoT thật. Bằng chứng Chromium headless không thay GPU/cảm ứng máy thật. Push main nhằm kích hoạt bản test Vercel theo ủy quyền; chưa có bằng chứng deployment mới Ready hoặc kiểm tra URL công khai.

## Chốt T01 và rà soát lộ trình

- Người dùng xác nhận T01 đã ổn. Giữ nguyên giao diện/model và các quyết định đã chốt; không bắt đầu T02A trong lượt rà soát tài liệu này.
- Thứ tự còn lại: T02A dữ liệu/IoT nền → T02B ba kịch bản/tự cấu hình/phát lại → T02C so sánh phương án → T03 phân tích/hội thoại AI → T04 luồng demo/hoàn thiện → T05 nghiệm thu bản gửi khách trên URL thật.
- Đã cập nhật README/TASKS để bỏ trạng thái lỗi thời “chưa triển khai công khai”, phân biệt bản test Vercel với bàn giao demo hoàn chỉnh. Thêm T02A_HANDOFF làm đầu vào cho chat mới; SIMULATION.md sẽ được tạo khi triển khai và kiểm tra công thức T02A, chưa ghi công thức chưa thực hiện như kết quả đã có.
- Chỉ sửa tài liệu; kiểm tra liên kết nội bộ và whitespace, không chạy lại build/E2E. Bằng chứng kiểm thử ứng dụng được giữ trong các mốc bên dưới.

## Review dấu hiệu thiết bị đang chọn

- Viền thiết bị chọn nhịp sáng nhẹ chu kỳ 2 giây, không đổi màu model/tình trạng. Thêm nhãn “Đang chọn · ID” để nhận ra khi zoom ra hoặc pan, không phải hồ sơ hover.
- Chuyển lựa chọn trả viền cũ về độ đậm bình thường; chỉ một timer khoảng 12,5 Hz, dừng khi tab ẩn và khi unmount. Reduced motion giữ viền sáng cố định cùng nhãn.
- Build/TypeScript và 3 bài Chromium được chọn qua: camera/pan/reset, hover không đổi cảnh với reduced motion, nhịp độ đậm viền chọn thay đổi và viền khác đứng yên, chuyển ID trả viền cũ về bình thường, reduced motion giữ độ đậm cố định. Đã xem ảnh dấu chọn; Prettier và `git diff --check` qua. Không chạy lại các bài popup/model tải lỗi không thay đổi; chưa xác nhận Vercel Ready.

## Review 03/11/2026 — zoom thêm, pan và góc đường nhấp nháy

- Giảm khoảng cách focus thêm 20%: PV 41 → 32,8, các thiết bị khác 31 → 24,8; giữ reduced motion, khả năng ngắt camera và HUD.
- Bật pan bằng kéo chuột phải, ngang/dọc theo mặt phẳng màn hình; trái xoay, cuộn zoom. Cảm ứng dùng một ngón xoay, hai ngón pan/pinch zoom. Cập nhật hướng dẫn theo loại con trỏ. Loại click phụ và click sau drag khỏi chọn thiết bị; nút tổng quan khôi phục vị trí lẫn tâm nhìn và xóa quán tính pan.
- Xác định lỗi bốn góc đường từ GLB thật: winding mặt trên Y=0,07 quay xuống, bị cull; đáy Y=0 hướng lên trùng terrain gây z-fighting khi hover kích hoạt render. Đảo winding và tính normal trên clone geometry riêng của corner khi tải; giữ nguyên file GLB, vật liệu và bố trí đường. Không dịch đường lên để che lỗi.
- Build production/TypeScript và **12 bài kiểm thử qua** (7 Chromium, 5 hình học/dữ liệu). Kiểm tra chuột phải thực sự tịnh tiến camera/target cùng nhau, không chọn nhầm; reset trả về cả vị trí/tâm; khoảng cách focus đo được 32,8/24,8; hover không đổi ảnh cảnh khi ẩn riêng nhãn HTML lúc chụp. Raycast model góc đường xác nhận thấy mặt trên Y=0,07 và geometry nguồn không đổi. Đã xem ảnh sau sửa; Prettier và `git diff --check` qua. Lượt đầu phát hiện reset pan còn lệch, đã chuyển reset vào controller trong Canvas; hai bài kiểm tra cũng được sửa để tách tooltip khỏi ảnh so sánh và nhận diện mesh GLTF qua `isMesh` giữa ESM/CJS. Lượt tổng cuối 12/12 thành công; chưa xác nhận Vercel Ready từ cloud.

## Review 03/11/2026 — lưới biểu đồ, hover và viền theo model

- Thu gọn đầu popup, đưa giá trị hiện tại vào từng thẻ biểu đồ. Hiển thị đồng thời 4 biểu đồ cho PV/inverter, đủ 3 biểu đồ của MET và 2 biểu đồ của TR/GW; desktop hai cột, mobile một cột cuộn nội dung. Biểu đồ bất thường giữ màu vàng/đỏ theo đúng `attention.signalId`; thiết bị liên quan ở cuối và tiếp tục đổi đúng hồ sơ.
- Nhãn trên model chỉ hiện khi hover chuột, rời chuột/click thì ẩn; không làm đổi lựa chọn/camera và không bắt click. Click/chạm vẫn zoom và mở HUD góc phải, có đường chọn bằng danh sách khi không có hover/WebGL.
- Thay vòng tròn bằng dải viền rỗng từ convex hull hình học GLB chiếu xuống XZ, nới 0,12–0,28 đơn vị; không phủ màu kín dưới model. Đủ 19 thiết bị có viền: 17 xanh lá bình thường, INV-03 đỏ, PV-06 vàng. Màu model/dữ liệu/kết nối/công suất không đổi; vùng xem trước bụi/lỗi dùng cùng viền và banner minh họa.
- Build production/TypeScript thành công; 11 bài kiểm thử đã qua (7 Chromium, 4 hình học/dữ liệu). Lượt toàn bộ có 10 qua, một bài kỳ vọng sai 3 biểu đồ cho TR/GW; đối chiếu registry, sửa kỳ vọng thành 2 và chạy lại bài đủ 5 loại GLB thành công. Đã chạy lại bài responsive để xem ảnh popup mobile; đã xem ảnh desktop 4 biểu đồ, hover và viền. Có kiểm tra hover không chọn/không kéo camera, rời chuột ẩn nhãn, đủ 19 viền đúng màu/kích thước, giữa viền không bị tô kín, model xoay giữ đúng hình chiếu, quan hệ, bàn phím, WebGL dự phòng và model tải lỗi. Prettier và `git diff --check` qua; chưa xác nhận Vercel Ready từ cloud.

## Review vòng cảnh báo, zoom gần hơn và số đo trên nhãn

- Giữ nguyên màu/emissive của model khi chọn hoặc cảnh báo. Bỏ beacon và marker chấm than; vòng đỏ/vàng dưới chân luôn hiện với INV-03/PV-06, không phụ thuộc lựa chọn. Vùng xem trước bụi/lỗi cũng dùng vòng để không nhuộm asset; banner minh họa và dữ liệu T01 được giữ.
- Camera chọn tiến gần hơn khoảng 16–18%: khoảng cách PV 49 → 41, thiết bị khác 38 → 31; vẫn ngắt bằng thao tác camera/reset và giữ reduced motion.
- Nhãn ngay trên thiết bị được chọn thêm tên/số đo/đơn vị bất thường, chữ tình trạng và màu tương ứng. Bỏ scale chữ theo khoảng cách để nhãn không phóng lớn che model khi zoom. HUD góc phải đưa số đo bất thường lên đầu và nhấn đỏ/vàng, popup mở sẵn biểu đồ tín hiệu đó. Tất cả đọc đúng `attention.signalId`, không tạo số đo riêng.
- Build production/TypeScript và 8 test qua: xác minh mức zoom mới, vòng đỏ/vàng tồn tại khi chưa chọn, màu vật liệu giống các thiết bị bình thường và không đổi khi chọn/xem trước bụi/lỗi, số đo 58/78 °C đúng nhãn/HUD; các luồng dialog, responsive, WebGL dự phòng và model lỗi/thử lại tiếp tục qua. Sau chỉnh nhãn tránh che model, đã build lại và chạy lại thành công 2 bài HUD/dialog và desktop/mobile; xem ảnh desktop và điện thoại 390 px. Prettier và `git diff --check` qua. Chưa xác nhận deployment Vercel Ready từ cloud.

## Review HUD, chi tiết, camera và trạng thái đỏ/vàng

- Chọn thiết bị mở HUD ngắn trong góc trên phải của khung 3D; camera tự tiến gần theo hướng hiện tại và dịch điểm nhìn tránh HUD. Chuyển động khoảng 650 ms, có thể ngắt bằng thao tác camera, hỗ trợ reduced motion và reset tổng quan; ẩn HUD không bỏ chọn.
- “Xem chi tiết” mở native dialog đặt trong biên khung 3D, có biểu đồ tín hiệu và quan hệ; chọn thiết bị liên quan cập nhật đúng ID/nội dung. Có Escape/focus trap/trả focus. Cột bên phải đổi thành giao diện AI dành sẵn, ghi rõ chưa kết nối, không gửi hoặc giả trả lời API.
- Fixture: INV-03 nhiệt độ 78 °C → cảnh báo đỏ, PV-06 nhiệt độ 58 °C → lưu ý vàng. Màu GLB, beacon/marker, HUD/dialog và danh sách cần chú ý lấy chung trạng thái. Cả hai vẫn đang vận hành/kết nối; không làm giảm giả công suất hoặc khả dụng.
- Đưa điều khiển tự cấu hình sang vùng trái trong cảnh trên desktop, xuống ngay dưới cảnh trên mobile để cột phải luôn dành cho AI. Không mở rộng sang mô phỏng T02/AI T03.
- Build production/TypeScript và **8 test qua** (6 Chromium + 2 dữ liệu/bố trí): xoay/zoom/reset/tự focus, HUD ẩn/hiện, dialog/biểu đồ/quan hệ/Escape/focus trap, cột AI, click 5 loại GLB, hai cảnh báo độc lập, responsive, cấu hình, lỗi model/thử lại và WebGL dự phòng. Đã xem ảnh desktop, HUD cảnh báo, dialog và mobile 390 px. Một lượt đầu vướng bảo vệ click của Playwright khi marker HTML nằm trên canvas; đổi bài kiểm tra sang click tọa độ thực qua chuột, không bỏ kiểm tra ID/kết quả.
- Không xác nhận deployment Vercel Ready từ cloud; bằng chứng trên là build và Chromium/SwiftShader cục bộ, chưa thay cho kiểm tra trên GPU/trình duyệt người dùng. Tài liệu DESIGN/IOT/README và hướng dẫn tích hợp GLB đã cập nhật.
- Sau tinh chỉnh lớp/vị trí marker để không bị nhãn chọn che, đã build lại và chạy lại thành công 2 bài HUD/dialog và click GLB/cảnh báo; xem lại ảnh cảnh báo đỏ. Prettier và `git diff --check` qua.

## Tích hợp GLB và bố trí cảnh quan

- Thay hình học thiết bị bằng 5 template GLB cho đủ 19 ID, đặt đáy Y=0, dùng label anchor và hitbox; chuyển MET-01 tránh đường mới. Dữ liệu và các quan hệ thiết bị giữ nguyên.
- Tích hợp đủ 16 GLB: terrain, đường vòng/đường chính, cổng/hàng rào, nhà điều hành, 3 cây và 2 bụi. Dùng instancing, raycast cao độ cho cây, giảm mật độ trên canvas nhỏ; cảnh quan không bắt click thiết bị.
- Chuẩn hóa màu PV, clone vật liệu để không đổi lây, làm mượt normal có chọn lọc cho cây/terrain. Thêm tải batch/Suspense, lỗi asset có thử lại riêng và xử lý mất context.
- Dùng một ModelLibrary cho cả scene để chỉ tải/phân tích mỗi GLB một lần. Canvas vẽ theo nhu cầu (`frameloop=demand`), invalidate khi camera/vật liệu/instance/ống kính thay đổi; tránh render liên tục khi đứng yên.
- **Build/TypeScript và 6 test qua**: 5 bài Chromium + 1 bài bố trí/bbox, gồm đủ 16 request GLB, click trực tiếp đủ 5 loại, vật liệu không đổi lây, trạng thái minh họa, lỗi HTTP 503/thử lại, WebGL dự phòng, xoay/zoom/reset, responsive và kích thước hồ sơ. Đã xem ảnh desktop/laptop/390 px; 16 GLB gốc vẫn trùng checksum audit.
- Bộ đếm frame quan sát trong Chromium SwiftShader: 152 draw calls / 173.968 tam giác gồm cả pass bóng; đây không phải số draw calls riêng pass màu hoặc benchmark fps trên GPU máy thật. Cần kiểm tra thêm trên thiết bị người dùng; không tuyên bố đã đạt 60 fps mọi máy.
- Các lượt test đầu phát hiện lỗi phân biệt tải GLB/mất context, chờ khởi tạo và tải GPU liên tục ảnh hưởng screenshot/resize; đã sửa và lượt 6 test cuối cùng hoàn tất thành công. Không dùng lượt fail để nghiệm thu.
- Tham chiếu `docs/3D_SCENE_INTEGRATION.md`; chưa bổ sung tính toán mô phỏng/AI. Code được chuẩn bị để push và Vercel build theo kết nối hiện có; chưa có bằng chứng deployment mới Ready từ Vercel trong cloud.

## Kiểm tra bộ model đã upload

- Đã fetch/fast-forward đến `9e25361`, nhận 16 GLB cùng manifest, nguồn và preview trong `public`.
- Audit độc lập: Khronos Validator 16/16 không error/warning; Three.js parse và Chromium WebGL render 16/16 không page error. Tổng GLB 546.944 byte (~534,1 KiB), hình học template tổng 24.446 tam giác. Terrain raycast 110 điểm lõi có Y=0.
- Kết quả: đủ để tích hợp vòng đầu, cần xử lý root ROOT/world, normal/flat shading và màu PV khác preview; chưa sửa GLB hoặc renderer sản phẩm. Nguồn Blender chưa được chạy; chưa có nghiệm thu cảnh tổng thể/hiệu năng máy thật.
- Chi tiết và dữ liệu đo trong `docs/3D_ASSET_AUDIT.md` và `.json`. Chưa triển khai các model mới trong ứng dụng ở task kiểm tra này.

## Đặc tả đặt hàng model 3D và cảnh quan

- Đã soạn `docs/3D_ASSET_BRIEF.md`: art direction light mode/SAVA, 5 loại thiết bị, prefab cảnh quan, kích thước theo bố cục hiện có, GLB/PBR/trục/pivot/anchor, ngân sách hình học/texture/draw calls và checklist nghiệm thu.
- Đã soạn `docs/3D_ASSET_PROMPTS.md`: prompt chung, prompt từng thiết bị/cảnh quan và prompt kiểm tra đầu ra. Ưu tiên hai mẫu inverter + cụm pin trước để kiểm tra phong cách và tích hợp.
- Phân biệt model trưng bày với kích thước nhà máy 50 MWp thực tế; không thay registry/công suất bằng số lượng hình học. Nêu rõ gen ảnh không tương đương GLB; có thể dùng script Blender nhưng phải xuất và kiểm tra file thật.
- Chỉ bổ sung tài liệu; chưa tạo/tích hợp model hoặc thay renderer. Các mục tiêu fps, dung lượng và LOD là ngân sách đề xuất, chưa được đo trên asset mới. Đã kiểm tra liên kết nội bộ, hàng rào code, JSON mẫu và whitespace; không chạy lại build/E2E cho thay đổi tài liệu này.

## Review metadata trạm thời tiết

- Hồ sơ MET-01 bỏ dòng ID tín hiệu / Telemetry mẫu / chất lượng dưới các số đo, đồng bộ với các loại thiết bị khác. Bỏ mô tả “Điểm đo đại diện · không đo từng tấm” khỏi phần tóm tắt.
- Giữ tên bức xạ, nhiệt độ môi trường, tốc độ gió; giá trị, đơn vị, thời điểm cập nhật, biểu đồ và quan hệ không đổi. Registry vẫn giữ metadata gốc.
- Build/TypeScript thành công; kiểm tra Chromium được chọn (`WebGL, camera, thiết bị, cấu hình và responsive`) qua. Kiểm tra metadata được áp dụng cho cả MET-01, không còn ngoại lệ trạm thời tiết; nhãn, giá trị và thao tác chọn thiết bị vẫn đúng. Prettier và `git diff --check` qua.

## Review thu gọn hồ sơ thiết bị

- Đưa trạng thái vận hành thành một hàng ngang toàn bề rộng; giảm padding/khoảng cách ở phần nhận diện, các số đo, xu hướng và quan hệ. Số đo giữ nhãn và đơn vị rõ ràng; rút thông báo cuối hồ sơ thành “Không có cảnh báo vận hành”.
- Dùng chung chiều cao tính từ viewport cho khung 3D và hồ sơ desktop: hai khung thẳng cạnh trên/dưới ở màn hình tổng quan. Phần tóm tắt hồ sơ cố định, nội dung số đo/xu hướng/quan hệ cuộn bên trong khi dài. Điện thoại dùng chiều cao tự nhiên, không ép cuộn lồng nhau.
- Build/TypeScript và **3 test Chromium qua**. Đã xác minh hai khung có cùng chiều cao/vị trí (sai số ≤1 px) ở 1440×900, 1366×768, 1920×1080, 1024×768; phần quan hệ vẫn truy cập được khi cuộn bên trong. Các kiểm tra logo gốc, thiết bị, WebGL dự phòng và mobile vẫn qua. Đã xem ảnh giao diện sau chỉnh; `git diff --check` và Prettier qua.

## Logo gốc và metadata các hồ sơ còn lại

- Đã fetch và fast-forward commit người dùng upload `030ab5a`; di chuyển nguyên file `sava-logo.png` vào `public/brand/sava-logo.png` (808×632 RGBA), không chỉnh sửa pixel. Thay src header sang PNG gốc, dùng `unoptimized` và đúng tỷ lệ ảnh; xóa SVG dựng lại. Vấn đề thiếu file gốc ở các review trước đã được giải quyết.
- Inverter, trạm thu gom và gateway: bỏ dòng ID tín hiệu / Telemetry mẫu / Tính toán / chất lượng dưới từng số đo; rút gọn hậu tố “đại diện”, “mẫu” trong tên tín hiệu và “heartbeat mẫu” trong mô tả gateway. Giữ tên đại lượng (kể cả nhiệt độ), giá trị, đơn vị, thời điểm cập nhật, trạng thái vận hành và liên kết thiết bị.
- Bỏ đoạn giải thích snapshot dưới xu hướng; đổi “Mốc đo fixture” thành “Cập nhật”. Dữ liệu gốc và quality vẫn được lưu trong registry; nhãn dữ liệu mô phỏng trên header được giữ. Các metadata của trạm thời tiết nằm ngoài yêu cầu lần này được giữ.
- Kiểm tra: build/TypeScript thành công, **3 test Chromium qua**. Các hồ sơ PV/INV/TR/GW không có metadata nhưng tên số đo vẫn hiển thị; logo phục vụ qua HTTP đã xác minh trùng SHA-256 với PNG gốc người dùng upload. Kiểm tra khung 3D vừa viewport desktop/laptop và responsive vẫn qua; đã xem ảnh header/hồ sơ sau sửa.

## Review giao diện sau khi chạy trên Vercel

- Người dùng xác nhận đã mở được website sau bản sửa `vercel.json` (`faa3e94`). Không còn dùng ảnh 404 trước đó làm trạng thái hiện tại.
- Theo yêu cầu review, chuyển toàn bộ giao diện sang light mode: bảng trắng, nền xanh nhạt, chữ xanh mực, điểm nhấn mint/vàng nắng/xanh dương/cam san hô. Đồng bộ cả cảnh WebGL, nhãn, đồ thị và trạng thái hover/selection.
- Tăng chiều cao cảnh desktop từ 440–530 px lên tối thiểu 620–680 px, khoảng 70–74vh; thu gọn header/KPI, giảm cột hồ sơ xuống 300–320 px. Nhà máy ở gần camera hơn; ống kính responsive giữ đủ thiết bị trong góc tổng quan. Điện thoại dùng cảnh cao 440 px.
- Giữ nguyên fixture và phạm vi T01; các kịch bản vẫn chỉ minh họa vùng, chưa tính mô phỏng/AI.
- Kiểm tra bản light mode: build/TypeScript qua; 2 test Chromium qua, bao gồm xoay/zoom/reset, chọn hình học và đủ 5 loại hồ sơ, cấu hình, responsive 1440/1024/390 px và dự phòng WebGL. Đã xem ảnh desktop/điện thoại; giới hạn GPU/trình duyệt thật như phần bằng chứng bên dưới.

## Review logo, typography và chiều cao màn hình

- Đưa logo SAVA vào header: asset `public/brand/sava-logo.svg` là bản vector dựng lại từ ảnh đính kèm (không phải file gốc được tải xuống), giữ biểu tượng hai màu xanh, wordmark và tagline, nền trong suốt; có alt text và liên kết về tổng quan.
- Tăng chữ nội dung chính lên 15–17 px, metadata 12–14 px; tăng chữ trong hồ sơ, cảm biến, nút và chú giải. Hàng KPI chuyển nhãn/số sang cạnh nhau, giảm padding và rút gọn tên chỉ số, giữ đơn vị và ghi chú fixture.
- Thay chiều cao tối thiểu 620–680 px bằng chiều cao viewport còn lại tính từ vị trí thực tế của khung, cập nhật khi đổi màn hình hoặc chiều cao header/KPI. Desktop thấy trọn cả thanh công cụ và chú giải, chừa 12 px cuối màn hình; điện thoại tiếp tục cuộn một cột.
- Build và TypeScript thành công; **3 test Chromium qua**. Đã xác minh logo tải được, toàn khung 3D nằm trong viewport 1440×900, 1366×768, 1920×1080, 1024×768, canvas cao trên 300 px và không tràn ngang; các kiểm tra tương tác trước vẫn được giữ. Đã xem ảnh laptop 1366×768 và điện thoại 390 px.

## Review lược bỏ nội dung theo ảnh khoanh

- Bỏ câu giới thiệu dưới tên nhà máy, số thiết bị mẫu, dòng địa điểm/nhà máy hư cấu và chú thích hình học trong cảnh. Nhãn “Dữ liệu mô phỏng” trên header được giữ.
- Bỏ thẻ kết nối IoT trong hồ sơ; dữ liệu và trạng thái kết nối trong registry được giữ nguyên. Bỏ hậu tố “cụm đại diện” trong mô tả danh định cụm pin.
- Theo vùng khoanh trên hồ sơ PV: ẩn tên tín hiệu nhiệt độ khỏi phần hiển thị (giữ tên cho trình đọc màn hình), bỏ metadata ở hai tín hiệu nhiệt độ/điện áp DC và bỏ hậu tố “tương đương” ở tên điện áp. Giữ giá trị, đơn vị và các hàng không được khoanh. Áp dụng nhất quán cho các cụm PV, không thay đổi dữ liệu fixture.
- Kiểm tra: build/TypeScript qua; smoke test Chromium mở PV-04 và đối chiếu các vùng khoanh, xác nhận chữ đã bỏ/ẩn và giá trị/đơn vị cùng các hàng không khoanh còn nguyên. Đã xem ảnh chụp sau sửa; `git diff --check` qua. Không chạy lại toàn bộ E2E cho thay đổi text này.

## Sửa nhãn nhiệt độ và làm gọn tín hiệu PV

- Khôi phục nhãn “Nhiệt độ” hiển thị trước giá trị °C; lần trước đã hiểu vùng khoanh quá rộng và ẩn nhầm nhãn này.
- Hồ sơ PV dùng nhãn ngắn: “Nhiệt độ”, “Điện áp mạch DC”, “Dòng DC”, “Công suất DC”. Bỏ các hậu tố “tổng tương đương”, “tính toán” và toàn bộ dòng metadata dưới các tín hiệu PV theo ảnh review mới. Registry, chất lượng dữ liệu, giá trị và đơn vị được giữ nguyên.
- Kiểm tra: build/TypeScript và 1 test Chromium được chọn (`WebGL, camera, thiết bị, cấu hình và responsive`) qua; đã thêm kiểm tra hồi quy nhãn “Nhiệt độ” phải nhìn thấy và các hàng PV không còn metadata/hậu tố được khoanh. Không chạy lại 2 test không liên quan.
- Logo: xác định asset hiện tại là SVG dựng lại từ ảnh xem trong chat, không phải file gốc, nên đường nét khác thương hiệu. Chưa thay logo lần nữa bằng bản vẽ phỏng đoán; cần PNG/SVG gốc để thay chính xác. Header giữ tỷ lệ ảnh bằng object-fit: contain, không có lỗi kéo giãn CSS.

## Đã làm ở T01

- Khởi tạo Next.js 16.4.3, React 19.3.1, TypeScript, Tailwind CSS 4, Three.js, React Three Fiber và Drei. npm + lockfile; Node.js 24.19.0 trong `.nvmrc`.
- Giao diện tiếng Việt theo DESIGN: bốn KPI, cảnh nhà máy, đường công suất cơ sở, hồ sơ thiết bị, điều kiện thời tiết, sự kiện mẫu và đúng ba thẻ mây che/bám bụi/lỗi inverter.
- Cảnh 3D hình học thực: tám cụm pin, tám inverter, trạm thu gom, trạm thời tiết và gateway. Có xoay/zoom giới hạn, chọn hình học, nhãn thiết bị, vòng chọn và nút về góc tổng quan. Reset xả phần quán tính còn dư trước khi khôi phục camera.
- Cây thiết bị thay thế thao tác click, liên kết giữa hồ sơ và sự kiện gateway dẫn tới đúng ID. Có thể đóng hồ sơ.
- Hồ sơ phù hợp từng loại: ID, khu vực, thông số danh định, vận hành và kết nối tách biệt, tín hiệu có ID/cấp đo/đơn vị/nguồn/chất lượng/mốc đo, chọn tín hiệu xem xu hướng, thiết bị liên quan. Mọi dữ liệu đều ghi là mẫu/giả lập.
- Registry và fixture dùng chung tại `src/data/plant.ts`: 19 thiết bị, ID ổn định, quan hệ và vị trí. Snapshot `fixture-T01`, revision 1, mốc 10:30 ICT; tín hiệu mang asset ID, snapshot ID, chu kỳ và thời điểm. Không dùng số ngẫu nhiên hoặc đồng hồ máy để tạo dữ liệu.
- Màn hình tự cấu hình cạnh cảnh trên laptop: loại, vùng, mức mây/bụi, thời lượng; lỗi inverter không có thanh phần trăm. Có thể chọn vùng bằng danh sách hoặc click cụm/inverter. Đổi tham số giữ camera. Trên màn hình nhỏ, bảng cấu hình nằm ngay dưới cảnh; ống kính tự điều chỉnh để thấy toàn nhà máy.
- Ba lớp minh họa phân biệt: mây, vật liệu bụi và đánh dấu vùng lỗi. **Chưa tính tác động công suất**; KPI/telemetry/biểu đồ vẫn là snapshot cơ sở. Nút chạy bị vô hiệu hóa, ghi rõ có ở T02. Không giả lập thông báo chạy thành công.
- Trạng thái tải, lỗi cảnh, không có WebGL và mất context có hướng dẫn/thử lại; danh sách thiết bị vẫn sử dụng được.
- Đã ghi lệnh thực tế và giới hạn trong README/AGENTS. `next.config.ts` tắt `agentRules` để `next dev` không tự thêm nội dung vào AGENTS.

## Quyết định và giả định fixture

- Nhà máy hư cấu Solar Farm One, 50 MWp DC; tám cụm 6,25 MWp, mỗi cụm cấp vào inverter 5 MW AC; giới hạn nhà máy 40 MW AC. Hình học đại diện, không phải bản vẽ hay tỷ lệ vật lý.
- Mạch DC tương đương 1.000 V × 4.500 A = 4,5 MW/cụm; fixture AC 4,32 MW/inverter (tỷ lệ 0,96), tổng 34,56 MW. Chưa phải bộ mô hình hiệu suất/môi trường. Trạm thu gom dùng cùng tổng công suất và lịch sử inverter, không cộng trùng vào KPI.
- Có sáu mẫu lịch sử cố định 10:25–10:30, chu kỳ 60 giây. Đây là fixture quá khứ, không phải lịch sử phát lại. KPI năng lượng và tổn thất bằng 0 vì chưa có lượt mô phỏng; không tích phân từ lịch sử fixture để giả kết quả chạy.
- Gateway có 18 nguồn thiết bị phía dưới; tổng registry gồm gateway là 19. Không cài broker, không kết nối giao thức IoT thật.
- Mặc định mây 45%/30 phút, bụi 20%/60 phút, lỗi inverter 30 phút. Mây 0–100%, bụi 0–50%, thời lượng 5–120 phút. Đây là đầu vào giao diện để T02 tiếp nhận, chưa là kết quả mô phỏng đã kiểm định.

## Bằng chứng kiểm tra

- `npm ci --no-audit --no-fund`: cài lại từ lockfile.
- `npm run typecheck`: thành công, bao gồm mã ứng dụng và test.
- `npm run build`: thành công với Webpack; trang chính được prerender.
- `npm run dev -- --port 3001`: khởi động thành công; yêu cầu HTTP trả 200 và có tên nhà máy/nhãn dữ liệu. Đã dừng dev server sau kiểm tra.
- `npm run test:e2e`: **2 test trình duyệt Chromium thực thi và qua**, trên production server do Playwright khởi động.
  - WebGL tải được, xoay/zoom làm thay đổi ảnh, về tổng quan khôi phục hình ảnh trong dung sai pixel 2% (ngưỡng chênh kênh màu 25 để bỏ qua sai số raster). Có click trực tiếp hình học 3D và xác minh đổi thiết bị.
  - Chọn từ danh sách đủ năm loại (PV, INV, TR, MET, GW), kiểm tra ID/hồ sơ/nhãn 3D, mở gateway từ sự kiện, đóng hồ sơ.
  - Đúng ba preset; mở cấu hình, đổi loại/vùng/mức độ/thời lượng, ẩn thanh phần trăm cho inverter lỗi, nút chạy vô hiệu hóa và đặt lại.
  - 1440, 1024, 390 px: không tràn ngang; bảng tự cấu hình trên điện thoại nằm ngay dưới cảnh. Đã xem ảnh chụp desktop và điện thoại. Ảnh được tạo lại trong `test-results/`, không commit.
  - Khi chủ động chặn WebGL, có thông báo và vẫn chọn MET-01 từ danh sách để mở đúng hồ sơ.
- `git diff --check`: không lỗi whitespace. Mã được định dạng bằng Prettier.
- AC-01, AC-12 và phần hồ sơ fixture của AC-17 đã được kiểm tra ở T01. Không đánh dấu các AC mô phỏng/AI/triển khai là đã đạt.

## Sự cố môi trường đã xử lý và giới hạn bằng chứng

- Lệnh npm qua sandbox ban đầu không kết nối được proxy; cài package thành công khi chạy với quyền mạng phù hợp. Không cần token mới.
- Turbopack bị chặn mở cổng nội bộ; chuyển sang `next dev/build --webpack`, không bỏ qua kiểm tra kiểu hay xác thực gói.
- Tải Chromium từ `cdn.playwright.dev` bị policy trả 403. Dùng Chromium hệ thống `/usr/bin/chromium` và SwiftShader; không tắt TLS hoặc lách allowlist. README có biến đường dẫn browser để dùng trên máy khác.
- Các lần test đầu tìm thấy locator trùng tên và lỗi reset camera do quán tính; đã sửa và chạy lại. Bằng chứng hoàn tất là lượt test qua, không dùng các lượt thất bại làm nghiệm thu.
- Chưa kiểm tra trên GPU thiết bị thật, Safari, Firefox hoặc thao tác cảm ứng thật. Responsive ở ba độ rộng là headless Chromium; chưa phải nghiệm thu toàn bộ UX T04.
- Chưa có WebSocket/telemetry thật, mẫu stale/thiếu chuyên biệt, bộ tính vật lý, tích phân năng lượng, phát lại/pause/revision động, so sánh phương án, AI, hướng dẫn 3 phút hoặc liên hệ. Không gọi demo đã sẵn sàng gửi khách.
- Theo yêu cầu tiếp theo của người dùng, commit T01 `4102c6b` đã được push lên GitHub `main`. Người dùng đã kết nối Vercel để test; chưa xác minh website công khai hoạt động.
- Log Vercel do người dùng cung cấp: build hoàn tất nhưng cấu hình dự án yêu cầu output `public`. Đã thêm `vercel.json` với framework `nextjs`, build `npm run build`, output `.next` để ghi đè cấu hình output sai. Chưa có kết quả build Vercel sau bản sửa; cloud vẫn bị proxy chặn truy cập tên miền Vercel.

## Lịch sử bàn giao T01 → T02A (đã thực hiện)

Đọc PRODUCT, IOT, TASKS và mã fixture hiện tại. Giữ registry/ID, chốt mô hình điều kiện nền và công suất, tạo telemetry theo cùng snapshot/thời gian, trạng thái vận hành/quality/connection độc lập. Thêm test tính toán và stale/thiếu, không sinh preset thứ tư. Sau T02A mới làm T02B (ba kịch bản và phát lại), T02C (so sánh), T03 (AI), T04 (demo/UX), T05 (triển khai khi được yêu cầu).

Tài liệu nền T00 0.4 và các quyết định sản phẩm đã chốt vẫn được giữ trong PRODUCT, DESIGN, IOT và PRODUCT_REVIEW. Thương hiệu, thông tin liên hệ và nhà cung cấp AI chưa xác định không chặn T02A.
