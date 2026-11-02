# Prompt tạo model 3D cho Solar Farm One / SAVA

Dùng cùng [bộ đặc tả đầy đủ](3D_ASSET_BRIEF.md). Gửi tài liệu đó làm ngữ cảnh cho công cụ AI; sau đó dùng **prompt chung + đúng một prompt model** trong mỗi lượt. Không yêu cầu gen cả nhà máy cùng lúc trước khi kiểm tra hai model mẫu đầu tiên.

Các đoạn prompt dùng tiếng Anh để giữ rõ thuật ngữ xuất GLB. Bạn có thể trao đổi/review bằng tiếng Việt.

## 1. Prompt chung — luôn gửi kèm

```text
You are producing real, production-ready 3D assets for a browser-based solar farm digital twin built with Three.js, React Three Fiber, and Drei. Follow the attached 3D_ASSET_BRIEF.md as the delivery contract. This is a light, clean industrial scene for SAVA, not a photorealistic offline render and not a cartoon game.

Deliver an actual glTF 2.0 binary .glb model, editable source (.blend or a reproducible Blender .py script), a measured manifest, and front/back/top/perspective preview PNGs. A concept image, video, code listing, or fake download link is not a finished 3D asset.

If you cannot create and attach actual binary files in your current environment, state this clearly. Instead deliver one complete, standalone Blender Python script that creates the geometry, materials, anchors, exports GLB, and writes the manifest. The script must run in a declared Blender version using built-in modules only, without internet downloads or proprietary plugins. Do not claim the model was exported or validated unless you executed those steps. Report checks you did not run.

Output coordinate contract after GLB export:
- Meter units, right-handed coordinates, +Y up, +Z front, +X right.
- Identity ROOT at the center of the ground-contact footprint, bottom at Y=0.
- Model dimensions in the individual brief are X width × Z depth × Y height. JSON vectors are XYZ.
- Apply transforms before export; no negative scales, cameras, lights, studio floor, sky, UI text, watermark, baked sunlight, or unrelated objects.
- Embed textures in GLB; no external URLs or machine-local paths. Standard PBR metallic-roughness only. Untextured PBR materials are acceptable where appropriate. Bake procedural textures before export if used.
- Base GLB must not require Draco, Meshopt, KTX2, or custom shader support. Optional optimized variants are separate deliverables.
- Correct outward normals; no z-fighting, missing faces, NaN coordinates, or indiscriminate double-sided materials.
- Keep important material groups separate and named exactly as specified. Merge repeated decorative geometry by material. Prefer normal/texture details over thousands of tiny meshes.
- Add empty nodes ANCHOR_LABEL and ANCHOR_STATUS, plus model-specific anchors. Do not include a visible hitbox. Supply local bounding box coordinates in the manifest.
- Provide the normal state only. Selection, faults, dust, clouds, and status colors are controlled by the application.

Art direction: premium architectural visualization with optimized game-ready geometry. Clean industrial silhouette, small bevels, realistic thickness, restrained PBR highlights, light gray painted equipment, blue solar cells, satin metal, and subtle SAVA blue accents. Do not invent branding, serial numbers, ratings, or text. Leave decal locations blank; the application will use the real company logo.

This is a representational demo, not a physical engineering design. Do not infer actual electrical ratings from the display model dimensions.

For the exported model, report actual dimensions, triangle count after triangulation, primitives, materials, texture resolutions, file bytes, node/material names, pivot and anchor coordinates, and any validation warnings. Use measured values; leave unmeasured results explicitly unknown. Include commercial-use provenance for all resources. Use only original geometry and permitted resources.

Before delivery, inspect the exported GLB, not only the Blender scene. Render neutral-lit previews and, when tooling is available, run Khronos glTF Validator. Do not substitute a pretty render for valid geometry or a validation report.
```

## 2. Prompt cụm pin — `pv-block.glb`

```text
Create pv-block.glb under the shared contract.

Size envelope: X=9 m, Z=10 m, Y<=1.5 m. This is one reusable display cluster representing PV-01 through PV-08, not a literal 6.25 MWp physical array. Root is centered at the ground footprint with bottom at Y=0.

Build six parallel solar tables aligned along X. Place their local Z centers at -4.25, -2.55, -0.85, 0.85, 2.55, 4.25 m. Each table has an approximately 9×1.35 m panel face, tilted -12 degrees about X in the exported Y-up system: its +Z edge is higher than its -Z edge. Keep all geometry inside the size envelope.

Show 8–10 visually separated modules per table with subtle blue cell pattern and thin busbar details. Use a deep blue opaque cell surface (#123E66–#20558A), satin aluminum frames, and galvanized support legs/braces that touch the ground. Add a simple rear cable channel. Avoid transparent glazing and excessive cell geometry.

Use exactly three shared material groups and corresponding merged render meshes: PV_CELLS, PV_FRAME, PV_SUPPORTS. Separate the cell surface so the application can apply dust coloration without recoloring steel. Do not produce one object per cell or module. No built-in dirt/fault/selection effects.

Triangle cap 4,000; no more than 3 render primitives/materials; GLB target <=0.8 MB; textures <=1024 px. Add ANCHOR_LABEL at approximately [0,2,0] and ANCHOR_STATUS near [4,1.8,4], as empty nodes. Deliver only this local cluster, no terrain or inverter.
```

## 3. Prompt inverter — `inverter.glb`

```text
Create inverter.glb under the shared contract.

Size X=1.6 m, Z=1.1 m, Y=2.0 m including a low concrete plinth. This is a representative field cabinet for an inverter group, not a certified physical 5 MW product. +Z is the front.

Create a premium outdoor industrial cabinet in light gray painted metal (#EDF2EF). Include subtle edge bevels, front door seam, handle and hinges, front/side ventilation features, a small dark display, and one separate indicator lens. Use restrained SAVA blue accents; no baked logo or rating text. The side and rear must look finished when orbiting around the model.

Add short DC/AC cable glands or conduits ending near the base, without connections to neighboring equipment. The base touches Y=0. No roads or surrounding pad extending beyond the footprint.

Separate material groups INV_BODY, INV_VENTS, INV_INDICATOR. The indicator may use mild emissive material, but do not include actual lights. Add ANCHOR_LABEL, ANCHOR_STATUS, ANCHOR_DC, and ANCHOR_AC empty nodes at useful positions.

Triangle cap 5,000; <=4 materials/primitives; GLB <=1 MB; texture cap 1024 px. Deliver one reusable cabinet, no unique INV-01 serial baked into geometry or texture.
```

## 4. Prompt trạm thu gom — `transformer-station.glb`

```text
Create transformer-station.glb under the shared contract.

Size X=4 m, Z=3 m, Y=3 m including the plinth. Represent a compact electrical collection station, not a dimensionally certified 40 MW installation.

Compose a transformer body, visible radiator fins on both sides, a few simplified ceramic insulators/bushings, and a compact associated switchgear cabinet on a shared low base. The silhouette must read as electrical infrastructure from an elevated view. Use muted green-gray painted metal (#738B87), light gray switchgear, satin metal, and pale ceramic. Use small bevels and believable thickness, not a smooth shipping-container box.

Keep recognizable radiator/insulator geometry; put tiny bolts and grilles in normal/texture details. Include only short connection terminals. No smoke, sparks, fire, people, fence, overhead transmission network, or fake hazard text.

Material groups TR_BODY, TR_RADIATORS, TR_INSULATORS, with at most two additional shared materials if necessary. Add ANCHOR_LABEL above the tallest body and ANCHOR_STATUS at the front upper corner.

Triangle cap 12,000; <=5 materials/primitives; GLB <=1.5 MB; textures normally 1024 px, maximum 2048 px only if justified. Deliver one complete station, not the entire farm.
```

## 5. Prompt trạm thời tiết — `weather-station.glb`

```text
Create weather-station.glb under the shared contract.

Size X<=2 m, Z<=2 m, Y=4.5 m. Create a slender but clearly visible galvanized meteorological mast with a secure ground base, cross-arm, small data box, cup anemometer/wind vane, solar irradiance sensor, and white radiation shield for an air-temperature sensor.

Sensor shapes should be readable from a 35–55 degree elevated camera angle. Keep thin visible parts around 2–3 cm or thicker where appropriate. Use gray metal mast, white sensor housings, and a small blue accent. This is a small field weather station, not a giant wind turbine, radar, or telecom tower.

Use MET_MAST and MET_SENSORS material groups, at most 3 total. Add ANCHOR_LABEL above the mast, ANCHOR_STATUS, ANCHOR_IRRADIANCE at the irradiance sensor, and ANCHOR_WIND at the wind sensor.

Triangle cap 4,000; <=3 materials/primitives; GLB <=0.5 MB; texture cap 1024 px. The base version is static. If providing a separate wind rotor, name it WIND_ROTOR and place its pivot at the actual spin axis; do not animate the entire mast.
```

## 6. Prompt gateway — `iot-gateway.glb`

```text
Create iot-gateway.glb under the shared contract.

Size X=1.2 m, Z=0.8 m, Y=2.2 m including the base. Depict an outdoor gateway enclosure containing communications electronics, not an oversized desktop Wi-Fi router.

Use a clean light gray industrial cabinet with a shallow low base, door seam, small handle, two modest antennas, connector panel, and a small separate status indicator. Include subtle SAVA blue trim and a blank decal area. Do not invent network names, QR codes, serial numbers, or credentials.

Material groups GW_BODY, GW_ANTENNA, GW_INDICATOR. Add empty nodes ANCHOR_LABEL and ANCHOR_STATUS, the latter near the indicator. Do not add a point light.

Triangle cap 3,000; <=3 materials/primitives; GLB <=0.5 MB; texture cap 1024 px. Deliver one reusable enclosure, without ground scenery or external long cables.
```

## 7. Prompt cảnh quan — chia thành từng lượt

### 7A. Nền địa hình

```text
Create terrain.glb for the shared Solar Farm One asset contract.

Ground is 160 m along X and 120 m along Z, centered on the origin. The entire central rectangle X[-35,35], Z[-21.5,21.5] is flat at Y=0 for the plant. Outside the central rectangle, create gently varying grass/soil/gravel areas, with low distant rises mainly toward negative Z. Keep elevation changes subtle, approximately 0–3 m outside the plant. The central working area must not contain bumps, rocks, holes, or a steep border.

Use an elegant sunlit rural Southeast Asian setting: muted natural greens and warm light soil, with variation at several scales rather than a uniform green plane or a noisy satellite texture. Match the clean semi-realistic equipment style. Use at most 3 standard PBR materials; <=12,000 triangles. Textures normally 1024 px, one 2048 px atlas only if necessary.

Do not include PV tables, electrical devices, roads, trees, fences, buildings, baked shadows, cameras, lights, or sky. Those are separate assets. The application places them. Provide measured terrain bounds; terrain may extend vertically below Y=0 only as a thin edge skirt, not under raised equipment.
```

### 7B. Đường, hàng rào, cổng

```text
Create a matching modular infrastructure kit under the shared contract:
- road-straight.glb: 5 m along X, 3 m wide along Z, bottom Y=0, top surface at Y<=0.08 m, thickness <=0.08 m, <=300 triangles, 1 material.
- road-corner.glb: within a 5×5 m cell, road width 3 m, endpoints matching the straight road, <=500 triangles, 1 material.
- fence-segment.glb: 5 m along X, height 1.8 m, ground-center pivot, endpoints X=-2.5 and +2.5, <=600 triangles, <=2 materials.
- gate.glb: clear 5 m-wide opening with posts, height <=2.5 m, <=2,000 triangles, <=3 materials.

Use light warm concrete/gravel roads with subtle edge detail, galvanized fence posts, and a restrained blue gate accent. Fence mesh should use an appropriate alpha-mask texture or low-detail geometry, not individually modeled thousands of wire loops. Keep all elements clean and functional. Do not bake a SAVA logo; leave a small blank sign area if needed.

Roads have ANCHOR_START and ANCHOR_END for joining. Follow the exact shared axis/pivot conventions. Deliver separate reusable GLBs, not a preassembled arbitrary layout. No terrain, equipment, cars, lamps, or plants inside these files.
```

### 7C. Cây và bụi cây

```text
Create an optimized vegetation kit: tree-a.glb, tree-b.glb, tree-c.glb, shrub-a.glb, shrub-b.glb, following the shared meter/Y-up contract.

Trees are approximately 4, 5, and 6 m high, with 2–3 m canopy width. Use varied trunk/canopy silhouettes suited to a tidy rural solar farm. Shrubs are 0.5–0.9 m high and <=1.2 m wide. Pivots are centered at the roots, bottom Y=0.

Style: semi-realistic architectural landscape, soft irregular canopy volumes or restrained leaf cards, muted natural green variation, not low-poly cones, bright cartoon balls, or extremely dense photogrammetry. The three trees must feel related, not like unrelated asset packs.

Each tree <=1,500 triangles and <=2 materials; each shrub <=400 triangles and 1 material. Texture resolution <=1024 px, preferably a shared small atlas. Prefer opaque canopy construction where visually acceptable; if leaf cards are used, use alpha mask, not layered alpha blend. Avoid excessive overdraw. No individual leaf objects.

Deliver one model per variant, without instancing the forest in the file. The application will instance them outside the plant fence. No soil disc, pot, ground shadow plane, animations, or sky baked into the assets.
```

### 7D. Nhà điều hành

```text
Create control-building.glb under the shared contract.

Size X=6 m, Z=4 m, Y=3.5 m including the roof. A small single-story solar-farm operations building with light gray/off-white walls, a muted blue-gray metal roof, a front door facing +Z, two or three dark opaque windows, and a shallow covered entry that stays within the size envelope.

Use clean architectural proportions, small bevels, simple roof seams, and a few ventilation details. This is a supporting building, not the visual hero. No interior furniture, real transparent glazing, advertising text, invented company logo, or people. Provide a blank front sign/decal location for the real SAVA logo to be applied later.

Triangle cap 6,000; <=4 materials/primitives; textures <=1024 px unless justified. Root at ground center, bottom Y=0. No yard, fence, equipment, trees, or paved site attached.
```

## 8. Prompt yêu cầu tự kiểm tra trước khi bàn giao

Sau khi nhận model đầu tiên, gửi đoạn này cùng GLB/file nguồn:

```text
Audit the exported asset against 3D_ASSET_BRIEF.md. Do not redesign it yet.

Report a PASS / FAIL / NOT TESTED table for:
1) Actual GLB is present, loadable, self-contained, and standard glTF 2.0.
2) Exported Y-up/+Z front axes, meters, ground-centered pivot and correct bounding box.
3) ROOT transform and required anchor/material names.
4) Measured triangles, primitives, materials, texture size and file bytes.
5) Normals, missing faces/textures, z-fighting, excessive transparency and baked sunlight.
6) Whether material groups needed for runtime effects remain independent.
7) Khronos glTF Validator result, including any warnings.
8) Commercial-use provenance and all external dependencies.

List concrete failures and the smallest correction for each. Do not mark unrun validation as passed. Include actual measured values in manifest.json. If a model is visually good but invalid for the web contract, state that clearly.
```

## 9. Khi gửi lại cho tôi

Gửi GLB thật trước, cùng manifest và ảnh preview; có thêm file nguồn thì càng dễ sửa. Có thể đưa các file vào một thư mục riêng trên GitHub rồi gửi đường dẫn/commit. Không cần tự thay mã đang chạy.

Nên bắt đầu bằng **`inverter.glb` và `pv-block.glb`**. Tôi sẽ kiểm tra hai mẫu trong renderer của sản phẩm để chốt hướng mỹ thuật trước khi bạn tạo toàn bộ cảnh quan. Việc dùng được ngay được hiểu là asset đúng hợp đồng, không phải đã có sẵn mã tự thay mọi mesh hiện tại bằng file mới.
