# Tích hợp GLB và cảnh quan — Solar Farm One

Cảnh dùng bộ model do người dùng upload, đã kiểm tra trong [3D_ASSET_AUDIT](3D_ASSET_AUDIT.md). Renderer mới tải các GLB thật, thay hình học thiết bị/terrain/đường vẽ thủ công trước đó. File GLB gốc không bị sửa.

## Mã và ánh xạ

- `src/data/scene-layout.ts`: URL của đủ 16 GLB và bố trí prefab theo tọa độ cố định. Có thể chỉnh bố cục mà không sửa registry telemetry.
- `src/components/scene-models.tsx`: cache GLB, clone vật liệu thiết bị, chuẩn hóa màu khi render và instancing cảnh quan.
- `src/components/plant-scene.tsx`: sự kiện chọn thiết bị, hitbox không render, label lấy từ anchor của GLB, camera, ánh sáng, hiệu ứng minh họa và xử lý lỗi.
- `src/data/plant.ts`: vẫn giữ 19 ID và quan hệ/dữ liệu fixture. Chuẩn hóa Y=0 cho model pivot đáy. MET-01 chuyển từ vị trí hình học cũ sang `[-27,0,-11]` để tránh đường vòng; không đổi tín hiệu/công suất.

| Loại           | Model                                          | Instance thiết bị |
| -------------- | ---------------------------------------------- | ----------------- |
| PV             | `/pv-block/pv-block.glb`                       | PV-01..08         |
| Inverter       | `/inverter/inverter.glb`                       | INV-01..08        |
| Trạm thu gom   | `/transformer-station/transformer-station.glb` | TR-01             |
| Trạm thời tiết | `/weather-station/weather-station.glb`         | MET-01            |
| Gateway        | `/iot-gateway/iot-gateway.glb`                 | GW-01             |

Dùng toàn bộ scene từ GLTFLoader; không giả định root bắt buộc tên ROOT. Các template lặp chia sẻ geometry/texture nhưng mỗi thiết bị có vật liệu clone riêng để hiệu ứng không đổi lây.

## Bố trí cảnh quan

- Lõi nhà máy nằm trong hàng rào X=±35, Z=±21,5. Terrain thật có lõi phẳng Y=0; bỏ nền platform và lưới nền cũ.
- Đường chính theo X, đường vòng bốn góc, lối vào từ cổng phía +Z và các nhánh ngắn đến khu kỹ thuật. Đoạn đường được scale theo chiều dài; góc đường xoay đúng đầu nối. Không đặt đường xuyên footprint của thiết bị.
- Cổng tại `[0,0,21.5]`, chừa khoảng mở 5,29 m tính cả cột. Hàng rào dùng 46 đoạn đã scale đoạn cuối cho khớp ranh giới.
- Nhà điều hành tại `[31.5,0,-12]`, bên phải dãy pin, có lối tiếp cận riêng.
- 22 cây và 18 bụi cây ở ngoài hàng rào; tọa độ/biến thể deterministic. Raycast lên terrain để đặt gốc đúng cao độ. Canvas hẹp dưới 600 px giảm còn 12 cây và 10 bụi; không bỏ thiết bị.
- Dùng InstancedMesh theo primitive/material của từng prefab. Cảnh quan không raycast để không giành sự kiện chọn thiết bị. Các hitbox thiết bị giữ raycast nhưng không render.

## Màu, shading và trạng thái

- Màu cell PV được đặt bằng mã sRGB `#16477B` trong Three.js để khắc phục độ sáng lệch của baseColorFactor trong GLB. Khung/giá/tủ và cây được hiệu chỉnh tông thống nhất với giao diện sáng.
- Tính normal trên bản clone geometry cho terrain và tán cây/bụi, tắt flatShading ở đúng các nhóm này. Giữ hard edge của tủ, cột, khung và các phần công nghiệp khác. Không ghi đè GLB gốc.
- Nhãn lấy từ `ANCHOR_LABEL`; nếu thiếu có thể dùng bbox. Vòng chọn lấy kích thước bbox, không dùng cùng một bán kính lớn cho mọi thiết bị.
- Hiệu ứng vùng chọn/bụi/lỗi áp trên vật liệu riêng của thiết bị; mây là lớp minh họa của ứng dụng. Đổi cấu hình không remount cảnh hoặc reset camera.
- Cảnh báo fixture được ưu tiên hơn hiệu ứng vùng chọn/kịch bản: INV-03 đỏ (nhiệt độ trong 78 °C), PV-06 vàng (nhiệt độ module 58 °C). Vật liệu riêng, beacon tại `ANCHOR_STATUS` và marker `!` giúp nhận biết từ cảnh tổng quan. Đây là lưu ý nhiệt độ; thiết bị vẫn kết nối và phát điện.
- Các KPI và telemetry vẫn là fixture T01. Model đẹp hơn không có nghĩa đã triển khai mô phỏng T02, AI hay kết nối nhà máy thật.

## Tần suất vẽ

Chọn thiết bị từ model, marker, danh sách hoặc quan hệ đều đưa camera gần hơn trong khoảng 650 ms. Giữ hướng nhìn, dịch tâm tránh HUD; thao tác xoay/zoom ngắt chuyển động, reduced motion chuyển ngay, nút tổng quan khôi phục camera gốc. HUD ngắn ở góc trên phải trong canvas có thể ẩn/hiện; biểu đồ và quan hệ chuyển sang dialog mở bằng “Xem chi tiết”. Cột phải dành cho AI chưa kết nối.

Canvas dùng `frameloop="demand"`: cảnh tĩnh không vẽ lại liên tục. OrbitControls yêu cầu frame khi camera thay đổi; thay vật liệu, bố trí instance và ống kính đều gọi invalidate tương ứng. Điều này giảm tải GPU lúc người dùng đọc hồ sơ; không được thêm animation useFrame liên tục trong tương lai mà quên yêu cầu frame. Các bộ đếm renderer là số liệu của frame đã vẽ, không phải số frame/giây của một vòng render liên tục.

## Tải và phục hồi

- Batch tải 16 GLB qua Suspense và chia sẻ một ModelLibrary cho toàn cảnh; không gọi loader thêm lần nữa cho từng instance. Kiểm tra request bảo đảm đúng một request cho mỗi GLB trong lượt tải thành công. Chỉ bỏ trạng thái tải khi World đã được commit với model sẵn sàng.
- Lỗi tải asset được bắt trong renderer và hiện thông báo DOM, không phá hủy WebGL rồi báo nhầm thiếu WebGL. Nút thử lại xóa cache lỗi của cả batch và từng URL trước khi tải lại.
- Theo dõi mất WebGL context riêng, gỡ event listener khi unmount để không coi context bị dispose chủ động là sự cố người dùng.
- Danh sách thiết bị và hồ sơ vẫn dùng được khi WebGL/model không khả dụng.

## Kiểm tra và giới hạn

Các bài kiểm tra cập nhật trong `tests/dashboard.spec.ts` và `tests/scene-layout.spec.ts` gồm:

- Có đủ 16 file; đường/góc đường/nhà không chồng bbox thiết bị đo từ GLB.
- Tải GLB qua HTTP, click trực tiếp đủ 5 loại bằng vị trí chiếu thực từ scene, đúng hồ sơ/nhãn.
- Chọn PV-02 không đổi màu PV-01; chuyển thiết bị khôi phục màu; bụi chỉ đổi đúng cụm đích.
- Tạm trả HTTP 503 cho inverter: thông báo tải lỗi, thử lại phục hồi model.
- Giữ các kiểm tra xoay/zoom/reset/tự focus, cấu hình, WebGL dự phòng, logo gốc, responsive và chiều cao cột AI. Kiểm tra HUD ẩn/hiện, dialog trong biên canvas, bàn phím/Escape/trả focus, quan hệ và hai mức cảnh báo cùng số đo.

Canvas có thuộc tính dữ liệu quan sát chỉ đọc cho vị trí chiếu, màu vật liệu và `renderer.info` để test tương tác/chi phí thật; không có bảng debug trong giao diện người dùng. Bộ đếm render của Three.js có thể gồm cả pass bóng, không được so trực tiếp với ngân sách draw calls của riêng pass màu.

Bài kiểm tra trình duyệt dùng Chromium/SwiftShader trong cloud, không thay cho fps/GPU trên laptop và điện thoại thật. Cây vẫn dựa trên asset low-poly đã upload; làm mượt normals không tạo thêm chi tiết hình học hay texture. Hiệu năng, hình thức cuối cùng trên thiết bị thật và trạng thái deployment Vercel cần được phân biệt với build/test cục bộ.

Kết quả lần tích hợp: build/TypeScript và 6 test hoàn tất thành công (5 bài Chromium, 1 bài bố trí). Đã xem ảnh desktop/laptop/mobile và xác minh GLB gốc không đổi checksum. Bộ đếm frame quan sát 152 draw calls / 173.968 tam giác có gồm pass bóng; chưa benchmark fps trên GPU máy thật. Các lượt lỗi ban đầu đã được chẩn đoán/sửa trước lượt kiểm tra cuối.
