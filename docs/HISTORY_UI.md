# Module Hiệu suất — giao diện và so sánh kỳ

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

Bốn chỉ số: sản lượng ghi nhận, kỳ vọng khỏe mạnh toàn thời đoạn, tỷ lệ so kỳ vọng cùng phần dữ liệu và độ phủ ban ngày. Khi thiếu, ghi rõ sản lượng một phần và mẫu số dùng phần dữ liệu đối chiếu hợp lệ. Chi tiết có chênh lệch MWh trên phần biết; không gọi phần chưa đo là tổn thất.

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
