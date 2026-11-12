import { insidePolygon, segments, type Point2 } from "./hong-liem-layout";
import type { Placement } from "./scene-layout";
// Hand-traced from the supplied 665x600 satellite view. No survey scale supplied.
export const photoToGround = ([x, y]: Point2): Point2 => [
  (x - 310) * 0.32,
  (y - 300) * 0.32,
];
const convert = (p: Point2[]) => p.map(photoToGround);
export const pvRowScale: [number, number, number] = [0.12, 0.4, 0.4];
export const pvRowRotation = 0;
export const camera: [number, number, number] = [0, 165, 175];
const traces: Point2[][] = [
  [
    [97, 20],
    [158, 20],
    [158, 120],
    [94, 120],
  ],
  [
    [167, 20],
    [273, 20],
    [273, 120],
    [167, 120],
  ],
  [
    [283, 20],
    [309, 20],
    [309, 86],
    [397, 86],
    [397, 120],
    [283, 120],
  ],
  [
    [94, 131],
    [158, 131],
    [158, 222],
    [96, 218],
  ],
  [
    [167, 131],
    [273, 131],
    [273, 231],
    [167, 227],
  ],
  [
    [283, 131],
    [397, 131],
    [397, 213],
    [349, 235],
    [283, 235],
  ],
  [
    [409, 92],
    [487, 92],
    [487, 143],
    [516, 143],
    [516, 173],
    [409, 215],
  ],
  [
    [214, 385],
    [288, 344],
    [288, 447],
    [214, 447],
  ],
  [
    [300, 339],
    [371, 339],
    [371, 447],
    [300, 447],
  ],
  [
    [381, 339],
    [450, 339],
    [450, 436],
    [381, 454],
  ],
  [
    [214, 458],
    [288, 458],
    [288, 544],
    [238, 581],
    [214, 551],
  ],
  [
    [300, 458],
    [368, 458],
    [368, 486],
    [300, 535],
  ],
];
export const inverterPhoto: Point2[] = [
  [163, 70],
  [279, 70],
  [318, 125],
  [163, 176],
  [279, 180],
  [404, 174],
  [522, 180],
  [294, 394],
  [376, 394],
  [456, 394],
  [294, 496],
  [378, 474],
];
export const fields = traces.map((photoPolygon, index) => {
  const polygon = convert(photoPolygon),
    rows: Placement[] = [];
  const minX = Math.min(...polygon.map((p) => p[0])),
    maxX = Math.max(...polygon.map((p) => p[0])),
    minZ = Math.min(...polygon.map((p) => p[1])),
    maxZ = Math.max(...polygon.map((p) => p[1]));
  for (let z = minZ + 2.1; z < maxZ; z += 4.9)
    for (let x = minX + 0.7; x < maxX; x += 1.55) {
      if (
        [
          [-0.56, -2],
          [-0.56, 2],
          [0.56, -2],
          [0.56, 2],
        ].every(([dx, dz]) => insidePolygon([x + dx, z + dz], polygon))
      )
        rows.push({ position: [x, 0.1, z], rotation: 0, scale: pvRowScale });
    }
  const center: Point2 = [
    rows.reduce((s, r) => s + r.position[0], 0) / rows.length,
    rows.reduce((s, r) => s + r.position[2], 0) / rows.length,
  ];
  return {
    id: `BN-PV-${String(index + 1).padStart(2, "0")}`,
    name: `Khu ${index < 7 ? "Bắc" : "Nam"} · vùng ${String(index + 1).padStart(2, "0")}`,
    photoPolygon,
    polygon,
    rows,
    center,
    inverter: photoToGround(inverterPhoto[index]),
    countBasis: "area-estimate" as const,
    estimatedRange: [rows.length, rows.length],
  };
});
export const groundPatches = [
  convert([
    [88, 18],
    [313, 14],
    [317, 78],
    [403, 79],
    [403, 87],
    [523, 87],
    [526, 177],
    [352, 243],
    [229, 241],
    [88, 229],
  ]),
  convert([
    [208, 381],
    [309, 331],
    [455, 331],
    [460, 444],
    [383, 492],
    [240, 594],
    [205, 555],
  ]),
];
export const boundary = convert([
  [88, 18],
  [313, 14],
  [317, 78],
  [403, 79],
  [523, 87],
  [526, 177],
  [353, 243],
  [318, 247],
  [318, 328],
  [455, 331],
  [460, 444],
  [383, 492],
  [240, 594],
  [205, 555],
  [208, 381],
  [304, 327],
  [305, 249],
  [229, 241],
  [88, 229],
]);
export const vegetationIsland = convert([
  [110, 260],
  [280, 260],
  [280, 312],
  [180, 345],
  [110, 345],
]);
export const serviceYard = convert([
  [492, 90],
  [520, 90],
  [520, 139],
  [492, 139],
]);
export const building = photoToGround([508, 100]);
export const station = photoToGround([505, 126]);
export const roadPhoto: Point2[][] = [
  [
    [163, 18],
    [163, 70],
    [163, 125],
    [163, 176],
    [163, 231],
  ],
  [
    [279, 18],
    [279, 70],
    [279, 125],
    [279, 180],
    [279, 238],
    [314, 238],
    [314, 331],
    [294, 331],
    [294, 394],
    [294, 451],
    [294, 496],
    [294, 550],
  ],
  [
    [89, 125],
    [163, 125],
    [279, 125],
    [318, 125],
    [404, 125],
    [488, 125],
    [505, 126],
  ],
  [
    [404, 87],
    [404, 125],
    [404, 174],
    [404, 217],
  ],
  [
    [505, 126],
    [526, 126],
    [526, 180],
    [522, 180],
  ],
  [
    [208, 451],
    [294, 451],
    [376, 451],
    [456, 451],
  ],
  [
    [376, 332],
    [376, 394],
    [376, 451],
    [378, 474],
  ],
  [
    [456, 332],
    [456, 394],
    [456, 451],
  ],
];
export const roadTraces = roadPhoto.map(convert);
export const roads = roadTraces.flatMap((p) => segments(p, 1.7));
export const fence = groundPatches.flatMap((p) => segments(p, 0.3, 5, 1, true));
export const trees: Placement[] = [];
for (let i = 0; i < 260; i++) {
  const p = photoToGround([40 + ((i * 137.5) % 560), 5 + ((i * 79.3) % 590)]);
  if (!groundPatches.some((g) => insidePolygon(p, g)) && Math.abs(p[0] - 1) > 6)
    trees.push({
      position: [p[0], 0, p[1]],
      rotation: i * 0.8,
      scale: [0.9, 1.1, 0.9],
    });
}

export const buildings: Placement[] = [
  { position: [building[0], 0.18, building[1]], scale: [0.65, 0.65, 0.65] },
  { position: [28.16, 0.18, 51.52], scale: [0.5, 0.5, 0.5] },
];
export const southernYard = convert([
  [382, 453],
  [421, 445],
  [438, 455],
  [386, 481],
]);
