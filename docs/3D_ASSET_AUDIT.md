# Kiểm tra bộ model upload — 02/11/2026

Nguồn: các file trong `public` tại commit `9e25361` (đã fetch/fast-forward từ GitHub). Đối chiếu [đặc tả](3D_ASSET_BRIEF.md), đọc trực tiếp GLB và kiểm tra độc lập; không chỉ tin vào preview hoặc validation report do công cụ tạo model cung cấp.

**Kết luận: có thể đưa vào lượt tích hợp đầu tiên, có các lưu ý chuẩn hóa và hình ảnh bên dưới.** Chưa thay model đang hiển thị trong ứng dụng. Cảnh tổng thể, click/telemetry, hiệu năng trên máy thật và chất lượng mỹ thuật khi ghép đủ cảnh chưa được nghiệm thu.

## Kết quả đã kiểm chứng

- Có đủ **16 GLB**: 5 thiết bị, terrain, nhà điều hành, đường thẳng/góc, hàng rào/cổng, 3 cây và 2 bụi cây.
- Tổng GLB **546.944 byte ≈ 534,1 KiB**; tổng hình học của mỗi template tính một lần là **24.446 tam giác**. Không tính nhân bản trong nhà máy, các file nguồn và preview vào hai số này.
- **16/16 file không có error hoặc warning** khi chạy Khronos glTF Validator. Có thông tin mức INFO `BUFFER_VIEW_TARGET_MISSING` và `NODE_EMPTY`; các empty node chủ yếu là anchor. Đây không phải kết quả lỗi validation.
- **16/16 file parse được qua GLTFLoader của Three.js**. Không cần texture ngoài, decoder hoặc extension bắt buộc. Tất cả sử dụng PBR màu phẳng/vertex color, không có image texture.
- **16/16 file render được trong Chromium/WebGL2 dùng SwiftShader**, không có JavaScript page error. Dùng viewer tạm trong cloud, ánh sáng tương tự ứng dụng; không sửa renderer sản phẩm để thực hiện bài kiểm tra này.
- Geometry của tất cả thiết bị có đáy tại Y=0; kích thước đều hữu hạn. Terrain có skirt tới Y=−0,12 theo thiết kế.
- Raycast xuống terrain tại **110 điểm** trong lõi X=−35..35, Z=−21,5..21,5: không mất giao điểm, sai lệch Y so với 0 là **0** tại các điểm đã lấy mẫu. Đây là kiểm tra lấy mẫu, không phải chứng minh mọi tam giác bằng phẳng bằng phân tích hình học đầy đủ.
- Các nhóm vật liệu/anchor quan trọng của thiết bị đều có mặt, hỗ trợ chọn thiết bị, nhãn và sửa vật liệu độc lập trong bước tích hợp.

Thống kê từng file, tọa độ, anchors, materials, checksum và kết quả validation: [3D_ASSET_AUDIT.json](3D_ASSET_AUDIT.json).

## Kích thước và độ nhẹ thực tế

Kích thước dưới đây dùng thứ tự **rộng X × sâu Z × cao Y**, đơn vị mét trưng bày; JSON dùng XYZ.

| Model          | Kích thước thực đo, làm tròn | Tam giác | Primitives |   KiB |
| -------------- | ---------------------------- | -------: | ---------: | ----: |
| Inverter       | 1,60 × 1,10 × 2,00           |      988 |          3 |  21,8 |
| Gateway        | 1,20 × 0,80 × 2,20           |      724 |          3 |  16,2 |
| Cụm pin        | 9,00 × 9,84 × 1,09           |    3.888 |          3 | 109,7 |
| Nhà điều hành  | 6,00 × 4,00 × 3,50           |      408 |          4 |  11,4 |
| Hàng rào       | 5,00 × 0,055 × 1,80          |      288 |          1 |   6,7 |
| Cổng           | 5,29 × 0,21 × 2,43           |      396 |          2 |   9,6 |
| Góc đường      | 4,00 × 4,00 × 0,07           |       20 |          1 |   1,8 |
| Đường thẳng    | 5,00 × 3,00 × 0,07           |       12 |          1 |   1,3 |
| Bụi A          | 1,04 × 0,82 × 0,72           |      344 |          1 |   7,4 |
| Bụi B          | 1,12 × 0,85 × 0,89           |      344 |          1 |   7,4 |
| Cây A          | 2,31 × 2,07 × 4,00           |      728 |          2 |  15,0 |
| Cây B          | 2,66 × 2,42 × 5,00           |      728 |          2 |  15,0 |
| Cây C          | 2,94 × 2,60 × 6,00           |      952 |          2 |  19,1 |
| Terrain        | 160 × 120 × 1,65             |   10.744 |          1 | 213,3 |
| Trạm thu gom   | 4,00 × 3,00 × 2,83           |    2.208 |          5 |  45,1 |
| Trạm thời tiết | 1,72 × 0,75 × 4,50           |    1.674 |          3 |  33,3 |

Tất cả nằm trong ngân sách tam giác/primitives đã đề xuất. Các kích thước cụ thể cần được dùng thay vì giả định file khớp tuyệt đối brief: trạm thu gom thấp hơn đích 3 m khoảng 5,6%; PV thấp hơn 1,5 m nhưng vẫn nằm trong envelope tối đa; trạm thời tiết cũng nằm trong envelope tối đa. Đây không phải blocker buộc gen lại model.

Cổng có **5 m khoảng mở**, nhưng bao cả cột rộng 5,29 m. Góc đường có bbox 4×4 nằm lệch quanh origin theo hình chữ L, các đầu nối vẫn ở `ANCHOR_START=[-2.5,0.07,0]`, `ANCHOR_END=[0,0.07,2.5]`; cần ghép bằng anchors, không căn theo tâm bbox.

## Các điểm cần xử lý khi tích hợp

### 1. Root chưa thống nhất tên

Một số file có `ROOT`, một số có node `world`. Ví dụ PV, gateway, nhà điều hành, terrain và trạm thu gom dùng `world`. Không được chỉ load bằng `getObjectByName('ROOT')` cho mọi file.

Có thể dùng toàn bộ `gltf.scene`, bọc trong một group do ứng dụng tạo, rồi lấy anchor theo tên. Các transform đã đo của root/world là identity. Đây là khác biệt tên gọi có thể xử lý ở loader, không cần yêu cầu người dùng gen lại toàn bộ.

### 2. Shading và mức chi tiết

**15/16 file thiếu vertex NORMAL**; chỉ PV có NORMAL. Thiếu NORMAL là hợp lệ với glTF, nên Validator không báo lỗi. GLTFLoader chuyển các mesh này sang flat shading. Cây/bụi có các mảng mặt phẳng rõ, phong cách hiện tại vẫn là low-poly; các tủ điện có cấu tạo rõ hơn khối cũ nhưng mép vát và chi tiết vật liệu còn đơn giản.

Nếu muốn tiến gần hình thức bán hiện thực hơn, ưu tiên chỉnh normal/smoothing phù hợp và bevel cho thiết bị, cải thiện tán cây. Không áp smooth normals toàn model một cách mù quáng vì sẽ làm mép tủ/khung thép bị mềm sai. Bản hiện tại đủ dùng cho tích hợp vòng một; chưa khẳng định đã đạt kỳ vọng thẩm mỹ cuối cùng.

### 3. Màu preview khác màu glTF trong web

Ảnh preview PV có màu xanh navy đậm; render Three.js dưới ánh sáng tương tự sản phẩm sáng hơn. Có một khác biệt định lượng: manifest PV mô tả màu cell 8-bit `[24,72,115]`, tương ứng sRGB `#184873`, nhưng GLB đặt `baseColorFactor=[24/255,72/255,115/255]`.

Theo glTF, baseColorFactor là tuyến tính; Three.js đổi bộ số này về sRGB khoảng **`#5691B3`** trước tác động ánh sáng. Nếu chủ đích là `#184873`, cần chuyển sRGB sang linear trước khi xuất, hoặc đặt màu sRGB đúng bằng API Three.js khi tích hợp. Ánh sáng/tone mapping cũng ảnh hưởng màu cuối, nên không sửa toàn bộ asset theo ảnh preview mà không so sánh trong renderer thật.

Tất cả 16 file hiện không dùng image texture. Điều này giúp bộ asset rất nhẹ nhưng không tự mang lại các chi tiết cell, xước sơn hay vật liệu vi mô như một bộ PBR có texture. Có thể thêm sau khi ghép cảnh và đánh giá góc nhìn thực tế.

### 4. Nguồn Blender chưa được xác minh

Không chạy các `source.py`, `build_asset.py` hoặc `finalize.py` upload trong bài kiểm tra này. Kết quả đọc/render GLB không chứng minh script có thể tái tạo đúng bản xuất.

Qua đọc tĩnh, `inverter/source.py` gọi tham số `export_selected` ở lệnh xuất. Cần kiểm tra tham số với đúng phiên bản Blender (nhiều phiên bản dùng `use_selection`). `sava-control-building-v2/finalize.py` còn có đường dẫn môi trường tạo asset `/mnt/data/control-building.zip`. Một số source dùng dữ liệu nén nhúng. Các điểm này không chặn sử dụng GLB có sẵn, nhưng cần kiểm tra riêng nếu tái xuất từ nguồn.

### 5. Giữ dữ liệu và trạng thái của ứng dụng

Đặt template vào ID PV/INV/TR/MET/GW hiện có, chuẩn hóa đáy thiết bị về mặt terrain thay vì giữ các offset Y của hình học cũ. Clone vật liệu có thể đổi màu cho từng instance; không làm chọn một thiết bị đổi màu tất cả.

Model cảnh quan là trang trí, không thêm vào tổng công suất/registry thiết bị. Bản tích hợp vẫn cần hitbox, raycast, label, hiệu ứng kịch bản và instancing cho cây/hàng rào. Các bài kiểm tra đó chưa chạy vì chưa thay model trong sản phẩm.

## Các bước tiếp theo

1. Tích hợp PV/inverter trước: hiệu chỉnh màu pin trong ánh sáng thật và kiểm tra nhãn/chọn thiết bị.
2. Đặt ba loại thiết bị còn lại lên terrain; dùng kích thước và anchors đo thực tế.
3. Ghép đường/cổng/hàng rào, cây/bụi và nhà điều hành, tránh che thiết bị.
4. Đo fps/draw calls ở cảnh đầy đủ trên máy mục tiêu, kiểm tra mobile và các thao tác hiện có trước khi cập nhật Vercel.

Không có yêu cầu người dùng upload lại chỉ vì tên thư mục hiện khác `public/models`: đường dẫn đang có có thể được ánh xạ trong code.
