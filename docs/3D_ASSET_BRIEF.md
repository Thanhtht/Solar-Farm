# Yêu cầu sản xuất model 3D — Solar Farm One / SAVA

Phiên bản 1.0, ngày 02/11/2026. Đây là **hợp đồng bàn giao asset được đề xuất cho lần nâng cấp hình ảnh** từ cảnh T01 hiện tại. Chưa có model mới được tạo hay tích hợp; các ngân sách hiệu năng dưới đây là mục tiêu cần đo, không phải kết quả đã đạt.

## 1. Kết quả cần nhận

Một thư viện model 3D thật cho web Next.js / Three.js / React Three Fiber / Drei, nhìn đẹp ở góc toàn cảnh và khi zoom tới thiết bị. Không chỉ nhận ảnh PNG, video quay model hoặc một khối 3D duy nhất chứa cả nhà máy.

Gói tối thiểu gồm:

- Năm GLB thiết bị: cụm pin, inverter, trạm thu gom, trạm thời tiết, gateway.
- Cảnh quan: nền địa hình, đường, hàng rào/cổng, cây và bụi cây, nhà điều hành nhỏ.
- Manifest mô tả kích thước, trục, pivot, node, vật liệu và ngân sách thực tế của từng model.
- Ảnh xem trước cùng phong cách, file nguồn có thể chỉnh sửa, nguồn gốc/quyền sử dụng tài nguyên.

**Về công cụ AI:** tính năng gen ảnh chỉ xuất ảnh, không tự tạo mesh dùng được trên website. Có thể dùng ChatGPT để viết brief, dựng ảnh tham chiếu hoặc viết script Blender. Để nhận GLB cần công cụ xuất model 3D thật hoặc Blender chạy script. Nếu AI chỉ trả script, cần chạy script, xuất GLB và kiểm tra file xuất; không coi script chưa chạy là model đã hoàn thành.

## 2. Hướng mỹ thuật chung

**Phong cách:** nhà máy công nghiệp hiện đại, bán hiện thực, hình học sạch, vật liệu PBR, ánh sáng ban ngày. Đẹp như mô hình kiến trúc chất lượng cao, không quá hoạt hình; không đẩy chi tiết đến mức mô hình kỹ thuật CAD nặng.

- Phải nhận ra hình dáng thiết bị từ góc nhìn trên cao 35–55°: pin theo hàng; inverter có cửa/lưới gió; trạm thu gom có cụm tản nhiệt; trạm thời tiết có cột/cảm biến; gateway có tủ và anten.
- Thêm vát cạnh nhẹ, độ dày thật, chân đế, bóng tiếp xúc do runtime tạo. Tránh các hộp vuông trơn không có cấu tạo.
- Bề mặt mới, được bảo trì; bụi/xước rất nhẹ. Không bake bám bụi hoặc hỏng hóc vào model mặc định vì ba kịch bản cần được điều khiển bằng code.
- Hình thức cùng một bộ: cùng mức chi tiết, độ bão hòa màu, độ nhám và tỷ lệ chi tiết. Không trộn cây kiểu hoạt hình với máy móc kiểu ảnh chụp.
- Không chứa chữ ngẫu nhiên, watermark, logo hãng thiết bị hoặc biển thông số tự bịa. Không tự vẽ lại logo SAVA. Nếu cần logo, để một mặt phẳng/decal riêng để runtime gắn file gốc.

| Thành phần             | Màu tham chiếu sRGB             | Cảm giác vật liệu                                 |
| ---------------------- | ------------------------------- | ------------------------------------------------- |
| Cell pin               | `#123E66` đến `#20558A`         | Xanh đậm, phản chiếu vừa; không đen tuyệt đối     |
| Khung nhôm             | `#B9C7CE`                       | Kim loại satin, cạnh bắt sáng nhẹ                 |
| Giá thép mạ            | `#879A9F`                       | Nhám hơn nhôm, có độ dày                          |
| Tủ điện/inverter       | `#EDF2EF`                       | Sơn trắng xám, sạch, nhám vừa                     |
| Điểm nhấn SAVA         | `#2C79BA`, `#27A9DA`            | Ít, ở nẹp/tay nắm/biển; không tô cả thiết bị xanh |
| Tản nhiệt/trạm thu gom | `#738B87`                       | Kim loại sơn xanh xám                             |
| Đất/cỏ                 | `#A7BE88`, `#7F9E67`, `#CBBE9B` | Biến thiên tự nhiên, không xanh neon              |
| Đường nội bộ           | `#D7D3C2`                       | Bê tông/sỏi, sáng, khác nền cỏ                    |
| Mái nhà                | `#658E9D`                       | Tôn sơn nhám, không phản chiếu như gương          |

Các giá trị màu là điểm xuất phát. Đánh giá dưới ánh sáng trung tính trước; màu cuối còn phụ thuộc ánh sáng và tone mapping của ứng dụng.

## 3. Quy ước bắt buộc để nhập model

### Định dạng và tỷ lệ

- File giao chính: **glTF 2.0 binary `.glb`**, một thiết bị mẫu mỗi file. Texture nhúng trong GLB, không đường dẫn tới máy người dựng hoặc URL ngoài.
- Giao thêm `.blend` hoặc script Blender `.py` có thể chạy lại. File GLB là bắt buộc dù có file nguồn.
- 1 đơn vị xuất = 1 mét. Hệ tọa độ GLB/Three.js: **+Y lên trên, +X sang phải, mặt trước +Z**. GLB xuất từ Blender phải được kiểm tra sau chuyển trục; không chỉ nhìn tọa độ trong Blender.
- Root tên `ROOT`, đặt tại `[0,0,0]`, rotation `[0,0,0]`, scale `[1,1,1]`. Pivot nằm giữa đáy tiếp xúc mặt đất. Không dùng scale âm; không có tọa độ NaN/Infinity.
- Kích thước theo thứ tự **X × Z × Y = rộng × sâu × cao**. Mọi bảng trong tài liệu dùng thứ tự này, tránh nhầm với thứ tự XYZ của vector tọa độ.
- Sai số kích thước thiết bị: tối đa ±5% so với kích thước đích. Ghi kích thước thực tế vào manifest; không giấu scale 100 lần trong node con.
- Không có camera, đèn, HDRI, sàn studio, nền trời, chữ giao diện hoặc cả một nhà máy đi kèm trong GLB thiết bị.

### Phân biệt tỷ lệ trưng bày với nhà máy thật

Cảnh hiện tại là bố cục đại diện trên nền 70 × 43 đơn vị, không phải mặt bằng đủ diện tích cho một nhà máy 50 MWp thực tế. Quy ước mét giúp asset lắp khớp nhau; nó không chứng minh công suất, số tấm hoặc diện tích thực.

- `PV-01..08` là tám cụm đại diện, không phải từng serial tấm pin. Một model cụm được dùng lại tám lần.
- `INV-01..08` là đối tượng đại diện nhóm công suất, không tuyên bố một tủ nhỏ ngoài đời có công suất 5 MW.
- Trạm thu gom là mô hình đại diện cho điểm tổng hợp, không phải thiết kế điện được kiểm định.
- Không tạo hàng chục nghìn tấm chỉ để khớp nhãn 50 MWp; dữ liệu danh định vẫn lấy từ registry.
- File thiết bị chỉ chứa hình học cục bộ. Vị trí thế giới và asset ID do code gán. Các offset Y hiện tại 0 / 0,5 / 1 là của hình học cũ; khi tích hợp GLB pivot đáy, code phải chuẩn hóa vị trí đặt đáy theo mặt đất, không giữ offset khiến thiết bị nổi.

### Mesh và vật liệu

- PBR metallic–roughness glTF chuẩn; base color, roughness/metallic, normal và AO khi cần. Không shader node chỉ chạy trong Blender, displacement thật, procedural texture chưa bake hoặc đường dẫn texture ngoài.
- Base color không chứa bóng đổ mặt trời, phản chiếu trời cố định hoặc highlight mạnh được vẽ sẵn. AO nhẹ chỉ thể hiện khe/kết cấu, không tạo bóng đen dưới cả model.
- Texture màu dùng sRGB; normal/roughness/metallic/AO là dữ liệu tuyến tính theo glTF. Normal map đúng chuẩn glTF/OpenGL; xuất và kiểm tra qua Blender exporter.
- Mặt ngoài có normal đúng, không mất mặt, không chớp do hai mặt trùng nhau. Không bật double-sided cho toàn model để che lỗi normal.
- Ưu tiên opaque; không mô phỏng kính trong suốt dày trên mọi tấm pin. Dùng mặt pin opaque xanh bóng nhẹ. Alpha mask chỉ dành cho lá cây khi cần; hạn chế alpha blend gây overdraw.
- UV hợp lệ, không kéo giãn rõ. Có thể chồng UV cho chi tiết lặp có chủ đích. Không cần UV lightmap riêng vì phiên bản này dùng ánh sáng runtime.
- Cell, vít, gân nhỏ chủ yếu bằng texture/normal, không tạo mỗi cell/vít là một object.
- Tham số PBR tham chiếu: cell pin metalness 0–0,1 / roughness 0,2–0,35; nhôm 0,75–1 / 0,3–0,5; tủ sơn 0–0,15 / 0,45–0,7; giá thép mạ 0,6–0,9 / 0,45–0,7; đất/cỏ 0 / 0,85–1. Điều chỉnh theo preview nhưng không dùng kim loại bóng gương cho tủ sơn hoặc phát sáng cho cell pin.
- Bản cơ sở không yêu cầu extension nén. Draco, Meshopt, KTX2 chỉ giao thêm bản tùy chọn sau khi thống nhất decoder; luôn có GLB cơ sở không phụ thuộc decoder ngoài.

### Tương tác và tên node

Thiết bị không được gộp với đường, cây hay trạm khác. Một template được tái sử dụng cho nhiều ID. Không bake `INV-01` vào tên root để rồi phải tạo tám file giống nhau.

Mỗi file có các node rỗng (không tạo mesh) sau:

- `ANCHOR_LABEL`: vị trí nhãn HTML, ở trên đỉnh thiết bị khoảng 0,3–0,5 m.
- `ANCHOR_STATUS`: vị trí đặt marker cảnh báo; ưu tiên góc trên, không trùng nhãn.
- Các node bổ sung theo từng loại trong bảng model, khi cần.

Manifest có bounding box dành cho click. **Code sẽ tạo hitbox vô hình**, không nhúng hộp click có vật liệu vào model. Cây/đường không được bắt sự kiện click thay thiết bị.

Các nhóm vật liệu có thể điều khiển phải tách tên ổn định:

- Pin: `PV_CELLS`, `PV_FRAME`, `PV_SUPPORTS`.
- Inverter: `INV_BODY`, `INV_VENTS`, `INV_INDICATOR`.
- Trạm thu gom: `TR_BODY`, `TR_RADIATORS`, `TR_INSULATORS`.
- Thời tiết: `MET_MAST`, `MET_SENSORS`.
- Gateway: `GW_BODY`, `GW_ANTENNA`, `GW_INDICATOR`.

Mesh tương ứng nên dùng cùng tên dễ đối chiếu. Không gộp `PV_CELLS` với giá thép: hiệu ứng bụi cần tác động đúng bề mặt pin. Đèn chỉ báo là một mesh nhỏ có vật liệu emissive, không phải PointLight.

Model mặc định chỉ có trạng thái bình thường. Vùng chọn, bụi, mây, sự cố và marker sẽ do ứng dụng tạo. Khi dùng lại GLB, code phải clone vật liệu cần sửa cho từng đối tượng, tránh chọn một inverter làm cả tám inverter đổi màu; geometry/texture không đổi có thể chia sẻ.

## 4. Danh mục model thiết bị

Số lượng dưới đây là **số instance trong cảnh**, chỉ cần tạo một model mẫu cho mỗi loại.

| File                      | Số instance | Kích thước đích X × Z × Y (m trưng bày) |  Ngân sách LOD0 | Vật liệu/primitives tối đa |
| ------------------------- | ----------: | --------------------------------------- | --------------: | -------------------------: |
| `pv-block.glb`            |           8 | 9 × 10 × 1,5                            |  4.000 tam giác |                          3 |
| `inverter.glb`            |           8 | 1,6 × 1,1 × 2                           |  5.000 tam giác |                          4 |
| `transformer-station.glb` |           1 | 4 × 3 × 3                               | 12.000 tam giác |                          5 |
| `weather-station.glb`     |           1 | 2 × 2 × 4,5                             |  4.000 tam giác |                          3 |
| `iot-gateway.glb`         |           1 | 1,2 × 0,8 × 2,2                         |  3.000 tam giác |                          3 |

Đếm tam giác sau triangulate, kể cả phần khuất còn được xuất; một primitive thường tương ứng một lượt vẽ, không chỉ đếm object. Các con số là trần đề xuất, không phải yêu cầu phải dùng hết.

### A. Cụm pin `pv-block.glb`

- Sáu bàn pin song song, mỗi bàn dài theo X; đặt tâm bàn lần lượt tại Z = −4,25; −2,55; −0,85; 0,85; 2,55; 4,25 m.
- Mỗi mặt bàn khoảng 9 × 1,35 m, nghiêng −12° quanh X. Đầu cạnh phía +Z cao hơn đầu phía −Z. Giữ tất cả mặt pin, kể cả độ nghiêng, trong bbox đích; mặt cao nhất không vượt 1,5 m.
- Mỗi bàn gợi khoảng 8–10 module bằng đường chia/texture; cell có sắc xanh thay đổi rất nhẹ, đường dẫn điện mảnh. Không tạo mặt bóng trắng hoặc kính xuyên nhìn thấy đất.
- Khung nhôm có độ dày, mép vát nhỏ; giá chữ A/thanh giằng, chân đỡ thực sự chạm mặt đất. Có một đường cáp gọn phía sau, không cần mô hình hóa dây từng cell.
- Merged mesh theo ba nhóm vật liệu; không để 60 object/module nhân lên tám cụm.
- `ANCHOR_LABEL` khoảng `[0,2,0]`, `ANCHOR_STATUS` khoảng `[4,1.8,4]`.
- Nếu cần một bàn pin riêng để dựng cảnh tương lai, có thể giao thêm `pv-table.glb`, nhưng không thay thế model cụm đã chốt. Không load cả cụm và bàn chồng nhau.

### B. Inverter `inverter.glb`

- Tủ điện ngoài trời dạng đứng, chân đế thấp, thân trắng xám, nẹp xanh SAVA nhẹ. Mặt trước +Z.
- Có đường ghép cửa, bản lề/tay nắm đơn giản, khe gió, panel hiển thị tối nhỏ và đèn chỉ báo riêng. Hông/sau có cấu tạo thông gió đủ để nhìn từ nhiều hướng.
- Bệ bê tông thấp nằm trong chiều cao 2 m. Không có sân/đường riêng kèm model. Mép vát khoảng 1–2 cm theo tỷ lệ mô hình.
- Cáp DC và AC chỉ cần đầu cáp/ống dẫn ngắn, kết thúc gần chân đế; không nối sang thiết bị khác trong file.
- Thêm `ANCHOR_DC` và `ANCHOR_AC` ở vị trí đầu nối, `ANCHOR_LABEL` trên đỉnh. `INV_INDICATOR` có thể đổi màu bằng code.
- Không ghi 5 MW lên tủ: công suất thuộc dữ liệu đại diện, không phải chứng nhận thiết bị vật lý.

### C. Trạm thu gom `transformer-station.glb`

- Nhận diện là trạm thu gom điện, gồm thân máy biến áp, cụm tản nhiệt hai bên, sứ cách điện và tủ đóng cắt gọn trên cùng bệ.
- Dùng tỷ lệ hình khối có chủ đích, tránh biến thành một hộp container trơn. Có bề mặt tản nhiệt bằng gân đủ lớn; vít/lưới nhỏ dùng normal map.
- Thân xanh xám, tủ phụ trắng xám, sứ màu xám nhạt; đường nhấn xanh dương nhỏ nếu cần.
- Không có tia điện, khói, lửa, công nhân, xe hay hàng rào trong file. Hệ thống dây cao thế phức tạp và mô phỏng an toàn điện nằm ngoài yêu cầu.
- Root giữa đáy bệ; `ANCHOR_LABEL` trên cụm cao nhất, `ANCHOR_STATUS` ở mép trước. Hình học cáp ra chỉ là đầu nối ngắn.

### D. Trạm thời tiết `weather-station.glb`

- Cột kim loại mảnh nhưng nhìn được từ trên cao; chân/bệ vững, thanh ngang trên cao.
- Nhận diện được: cảm biến bức xạ hướng cùng mặt phẳng pin, cảm biến gió trên đỉnh, hộp che bức xạ cho cảm biến nhiệt độ và hộp dữ liệu nhỏ.
- Không dựng cối xay gió khổng lồ, radar hay cột viễn thông. Đây là trạm đo thời tiết quy mô nhỏ.
- Hộp cảm biến trắng, cột xám mạ, điểm nhấn xanh nhạt. Chi tiết mảnh tối thiểu khoảng 2–3 cm để không biến mất ở góc tổng quan.
- `ANCHOR_IRRADIANCE` ở đầu đo bức xạ, `ANCHOR_WIND` trên đầu đo gió, `ANCHOR_LABEL` trên đỉnh.
- Animation quay cảm biến gió là tùy chọn. Nếu làm: node quay riêng `WIND_ROTOR`, pivot đúng trục, không bake vào mesh cả cột; giao mặc định đứng yên. Cường độ quay do code điều khiển sau.

### E. Gateway `iot-gateway.glb`

- Thể hiện một **tủ gateway ngoài trời** để đủ nhìn thấy trong cảnh, không phóng to một router để bàn thành tòa nhà.
- Tủ trắng xám đứng trên chân đế, có cửa, hai anten nhỏ, panel kết nối và đèn trạng thái riêng. Thiết bị gateway điện tử được hiểu là nằm trong tủ.
- Điểm nhấn xanh SAVA ở viền/nhãn trống. Không có tên mạng, QR code, serial hoặc thông tin liên lạc giả.
- `GW_INDICATOR` là mesh riêng; `ANCHOR_LABEL` trên đỉnh, `ANCHOR_STATUS` gần đèn.

## 5. Cảnh quan để nhà máy thật và ấn tượng hơn

### Bố cục tổng thể

Giữ phần nhà máy sáng, sạch và là chủ thể. Cảnh quan tạo chiều sâu, không che thiết bị hoặc tranh tương phản với các tấm pin.

- Lõi nhà máy: X từ −35 đến +35, Z từ −21,5 đến +21,5; mặt đất lõi Y = 0. Không gồ ghề dưới các vị trí thiết bị.
- Nền ngữ cảnh rộng khoảng 160 × 120 m, tâm `[0,0,0]`. Bên ngoài lõi có cỏ, đất pha sỏi, cây thấp; xa hơn là ruộng/vạt cây và đồi thấp nhẹ. Chưa cần mở rộng đến chân trời vô hạn.
- Đường nội bộ chính chạy dọc X tại Z = 0, rộng 3 m; đường phụ bao quanh khu kỹ thuật, không xuyên cụm pin. Có lề/sỏi và rãnh thoát nước nông.
- Hàng rào ở rìa lõi, có cổng rõ; cây đặt ngoài hàng rào và tránh che vùng pin trong góc tổng quan. Ưu tiên đồi thấp phía Z âm, không dựng một bức tường núi quanh nhà máy.
- Nhà điều hành nhỏ đặt ngoài lõi, phía khu kỹ thuật (+X), không lấn vào trạm thu gom/gateway. Vị trí cuối phải được kiểm tra với camera xoay, không chỉ đẹp ở một ảnh.
- Cây có 3 biến thể dáng, bụi cây 2 biến thể; lặp bằng instancing và xoay/scale nhỏ trong code, không tạo hàng trăm file riêng.
- Đèn đường, biển khu vực và một xe bảo trì nhỏ là tùy chọn giai đoạn hai. Không làm đường phố đông xe, sân chơi, cây nhiệt đới rực màu hoặc nhân vật lớn gây mất tập trung.

### Các prefab cảnh quan

| File                   | Hình thức/kích thước chuẩn                                            | Ngân sách tam giác / vật liệu |
| ---------------------- | --------------------------------------------------------------------- | ----------------------------- |
| `terrain.glb`          | Nền 160 × 120 m; lõi 70 × 43 m phẳng; không chứa thiết bị/cây/nhà     | ≤12.000 / ≤3                  |
| `road-straight.glb`    | Đoạn đường 5 × 3 m; dày ≤0,08 m, đáy Y=0, mặt chạy Y≤0,08             | ≤300 / ≤1                     |
| `road-corner.glb`      | Góc đường nằm trong ô 5 × 5 m; bề rộng 3 m; đầu mút khớp prefab thẳng | ≤500 / ≤1                     |
| `fence-segment.glb`    | Đoạn 5 m theo X, cao 1,8 m; tâm đáy; hai đầu X=±2,5                   | ≤600 / ≤2                     |
| `gate.glb`             | Cổng rộng 5 m, cao ≤2,5 m; có trụ, không thêm logo vẽ lại             | ≤2.000 / ≤3                   |
| `tree-a/b/c.glb`       | Cao lần lượt khoảng 4/5/6 m; tán 2–3 m; gốc ở origin                  | ≤1.500 mỗi cây / ≤2           |
| `shrub-a/b.glb`        | Cao 0,5–0,9 m, tán ≤1,2 m                                             | ≤400 mỗi bụi / ≤1             |
| `control-building.glb` | Nhà 6 × 4 × 3,5 m; mái tôn, cửa, cửa sổ, hiên nông                    | ≤6.000 / ≤4                   |

Đường và terrain không có hai mặt đồng phẳng chồng nhau: khi ghép sẽ đặt đường nhô nhẹ bằng code. Chỉ có một nền dưới thiết bị, không giữ thêm platform cũ khi đưa terrain mới vào. Hàng rào ưu tiên texture alpha mask/normal phù hợp; không mô hình hóa từng mắt lưới thép.

Các prefab dùng hệ trục +Y up, mặt trước +Z và pivot giữa đáy như thiết bị. Đoạn đường thẳng đi theo X; đầu mút `ANCHOR_START` và `ANCHOR_END` ở X=−2,5/+2,5. Cổng và hàng rào dùng cùng bề rộng module để ghép không hở.

## 6. Ngân sách hiệu năng toàn cảnh

Ngân sách từng model không đủ: tám bản sao của cùng model vẫn tạo chi phí vẽ và tam giác trong cảnh.

| Chỉ tiêu                                             | Desktop mục tiêu |             Điện thoại mục tiêu |
| ---------------------------------------------------- | ---------------: | ------------------------------: |
| Tam giác nhìn thấy, kể cả cây/cảnh quan              |         ≤250.000 | ≤120.000 với LOD/giảm cảnh quan |
| Draw calls của lượt vẽ màu, không tính pass bóng     |             ≤120 |                             ≤80 |
| Dữ liệu 3D tải ban đầu (tổng GLB/texture riêng biệt) |           ≤12 MB |             ≤6 MB cho bộ mobile |
| Texture resident ước tính                            |         ≤128 MiB |                         ≤64 MiB |
| Tốc độ xoay/zoom mục tiêu sau tải                    |    khoảng 60 fps |  ≥30 fps trên thiết bị mục tiêu |

- Texture mặc định 1024 px; chỉ model lớn/atlas quan trọng mới 2048 px. Cây/bụi 512–1024 px. Không có texture 4K/8K ở bộ cơ sở.
- File GLB thiết bị mục tiêu: PV ≤0,8 MB; inverter ≤1 MB; trạm thu gom ≤1,5 MB; thời tiết/gateway ≤0,5 MB mỗi loại. Nếu vượt trần, báo số liệu và nguyên nhân, không tuyên bố đạt.
- Giới hạn atlas độc lập; tránh mỗi vật nhỏ có một bộ 4 texture 2K. PNG/JPEG nhúng là baseline. Dùng lại texture/mat trong một file khi có thể.
- Cây/đường/hàng rào lặp cần được tích hợp bằng instancing/batching. Model tốt không tự bảo đảm ít draw calls nếu code clone mỗi mesh thành một lượt vẽ riêng.
- Không cho mọi lá cây, cỏ và vít castShadow. Chọn các khối chính đổ bóng; bóng runtime sẽ được điều chỉnh sau.
- `LOD0` là bản cơ sở bắt buộc. `LOD1` là tùy chọn, khoảng 30–50% tam giác LOD0, giữ cùng bbox/pivot/anchor và silhouette, texture nhỏ hơn. Giao file riêng như `inverter-lod1.glb`; không nhét cả hai mức chồng nhau trong cùng scene. Three.js không tự nhận LOD chỉ vì đặt tên; code sẽ lựa chọn mức.
- Khi đo hiệu năng phải ghi rõ thiết bị/GPU, browser, kích thước canvas và DPR. Mốc desktop tham chiếu: Chrome, GPU tích hợp, màn hình 1366×768 hoặc 1920×1080, DPR tối đa 1,5; mobile: Chrome Android trên máy tầm trung, DPR 1. Đo lúc xoay/zoom sau khi tải xong, không dùng fps của ảnh render ngoại tuyến hoặc kết quả máy mạnh để khẳng định mọi điện thoại đều đạt.
- Bộ tối thiểu có thể chỉ giao LOD0 nhẹ. Bộ mobile/LOD phải được kiểm thử sau; không bắt AI tạo hàng loạt LOD trước khi bản mẫu được chấp nhận.

## 7. Cấu trúc bàn giao

```text
solar-farm-assets-v1/
  manifest.json
  devices/
    pv-block.glb
    inverter.glb
    transformer-station.glb
    weather-station.glb
    iot-gateway.glb
  environment/
    terrain.glb
    road-straight.glb
    road-corner.glb
    fence-segment.glb
    gate.glb
    tree-a.glb
    tree-b.glb
    tree-c.glb
    shrub-a.glb
    shrub-b.glb
    control-building.glb
  previews/
    pv-block-front.png
    pv-block-back.png
    pv-block-top.png
    pv-block-perspective.png
    ...cùng 4 góc cho mỗi model...
    environment-overview.png
  source/
    assets.blend
    generate_assets.py       # nếu dùng quy trình sinh bằng script
    README.md
  LICENSE.md
```

- Ảnh preview 1600×1200, nền xám sáng trung tính, cùng hướng ánh sáng; không chèn thông số giả lên model. Có thước kích thước trong ảnh kiểm tra riêng nếu muốn.
- Manifest phải thống kê **đúng số liệu file xuất**, không điền giá trị dự kiến. Đơn vị kích thước và vectơ trong JSON là XYZ như mục 8.
- README ghi phiên bản Blender/công cụ, cách chạy script nếu có, bước xuất, tên model, giới hạn hoặc chi tiết chưa hoàn thành.
- LICENSE ghi quyền sử dụng thương mại cho model, texture, HDRI/nguồn tham khảo có sử dụng; liệt kê tài nguyên bên thứ ba và điều kiện gắn nguồn. Không đính kèm texture không rõ nguồn hoặc khẳng định AI bảo đảm quyền sở hữu khi chưa kiểm tra điều khoản công cụ.
- Không cần gửi `node_modules`, cache Blender, video nặng hoặc dữ liệu cá nhân. Có thể upload cả thư mục qua GitHub; GLB/ảnh lớn hơn giới hạn GitHub cần kênh tải file phù hợp, không dùng Git LFS nếu chưa thống nhất hỗ trợ triển khai.

## 8. Mẫu manifest cho một thiết bị

Ví dụ sau là **khuôn điền**, không phải báo cáo một model đã có. `bounds` và `size` dùng thứ tự **XYZ**, khác cách ghi rộng × sâu × cao trong bảng đọc cho người. Thay `null` bằng số đo/thống kê thật trước bàn giao.

```json
{
  "schemaVersion": 1,
  "units": "meters",
  "upAxis": "+Y",
  "frontAxis": "+Z",
  "assets": [
    {
      "key": "inverter",
      "file": "devices/inverter.glb",
      "assetType": "inverter",
      "lod": 0,
      "sizeXYZ": [1.6, 2.0, 1.1],
      "bounds": {
        "min": [-0.8, 0.0, -0.55],
        "max": [0.8, 2.0, 0.55]
      },
      "pivot": [0, 0, 0],
      "anchors": {
        "label": "ANCHOR_LABEL",
        "status": "ANCHOR_STATUS",
        "dc": "ANCHOR_DC",
        "ac": "ANCHOR_AC"
      },
      "mutableMaterials": ["INV_BODY", "INV_INDICATOR"],
      "triangles": null,
      "primitives": null,
      "materials": null,
      "textureMaxSize": null,
      "fileBytes": null,
      "sha256": null
    }
  ]
}
```

`key` nhận diện template, không phải ID thiết bị trong nhà máy. Khi tích hợp, template `inverter` được gắn vào tám đối tượng INV, template `pv-block` gắn vào tám đối tượng PV. Asset cảnh quan không được giả thành thiết bị có telemetry.

## 9. Tiêu chí nghiệm thu trước khi giao

Bắt buộc cho từng model:

1. GLB mở được trong viewer glTF và Three.js, không cần internet ngoài để tải vật liệu. Nếu công cụ không có môi trường kiểm tra, ghi “chưa kiểm tra”; không báo đạt dựa trên preview.
2. Chạy Khronos glTF Validator: không có error; warning phải được ghi và giải thích. Không sửa report để giấu lỗi.
3. Đo bbox sau export đúng trục và ±5% kích thước đích; đáy ở Y=0, không xuyên đất/nổi. Root và các anchor đúng tên, có tọa độ hữu dụng.
4. Xem bốn góc và zoom gần: không thủng, lật normal, texture thiếu, z-fighting, cạnh răng cưa bất thường hoặc bóng bake sai hướng.
5. Kiểm tra mesh/material có tên đúng, số primitive/triangles/texture/fileBytes đúng giới hạn. Quan sát ở cỡ hiển thị nhỏ vẫn nhận ra loại thiết bị.
6. Không mất vật liệu khi bỏ camera/đèn của file nguồn. Vật liệu hoạt động dưới một bộ ánh sáng chung.
7. Các phần `PV_CELLS`, đèn indicator, anten và cảm biến cần điều khiển vẫn là nhóm riêng; đổi màu indicator không làm thân đổi màu.
8. Cảnh quan không che tuyến nhìn/nhãn các thiết bị chính; mô hình có thể quan sát khi xoay toàn vòng, không chỉ từ một góc render.
9. Nguồn và quyền sử dụng được ghi trong gói, không watermark/brand của bên thứ ba.

Các kiểm tra toàn cảnh sau khi tích hợp:

- Click đủ PV/INV/TR/MET/GW mở đúng hồ sơ, không bị cây/hàng rào chặn raycast.
- Vòng chọn và label đi đúng thiết bị, không đổi màu lây các instance khác.
- Xoay/zoom/reset camera thấy toàn nhà máy; thiết bị không chìm/nổi; ánh sáng không cháy trắng.
- Vùng mây/bụi/lỗi tác động đúng nhóm, không dính vào cảnh quan. Chưa được tuyên bố mô phỏng vật lý chỉ vì hiệu ứng đẹp.
- Đo tải ban đầu, tam giác/draw calls và fps trên máy mục tiêu; thử 1366×768, desktop lớn và điện thoại. Giảm LOD/cây nếu chưa đạt, không tắt tương tác để làm số fps đẹp.

## 10. Thứ tự làm để tránh phải gen lại cả bộ

1. Tạo **inverter và cụm pin** trước, mỗi loại một file, theo prompt trong `3D_ASSET_PROMPTS.md`.
2. Gửi GLB + manifest + preview để kiểm tra tỷ lệ, mặt trước, vật liệu, độ nhẹ và cảm giác khi xem trong web.
3. Chốt phong cách từ hai mẫu này, tạo tiếp trạm thu gom, thời tiết và gateway với cùng bộ vật liệu.
4. Làm terrain, đường, hàng rào, cây và nhà điều hành; ghép cảnh quan quanh các vị trí hiện có.
5. Sau khi scene mới đo đạt ngân sách, mới thêm trang trí/LOD nâng cao.

**Khi bạn giao asset đúng quy ước, tôi có thể tích hợp mà không phải tự đoán cấu trúc hay sửa lại model thủ công.** Vẫn cần một task code thay hình học hiện tại bằng GLB loader, gắn material/anchor/hitbox, chuẩn hóa Y, instancing cảnh quan, rồi chạy kiểm tra. Không có file model nào tự thay vào sản phẩm chỉ bằng việc upload và không thể bảo đảm “không cần sửa gì” trước khi kiểm tra GLB thật.
