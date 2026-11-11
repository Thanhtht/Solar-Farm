import type { Placement } from "./scene-layout";

export type Point2 = [number, number];
export const referencePhoto = { width: 640, height: 425 };
export const hongLiemCamera: [number, number, number] = [0, 140, 180];

// Inverse perspective onto an assumed flat plane. The camera is an artistic
// calibration to the supplied oblique photograph, not a survey or metric scale.
export function photoToGround([u, v]: Point2): Point2 {
  const [_, height, depth] = hongLiemCamera;
  const length = Math.hypot(height, depth);
  const tangent = Math.tan((43 * Math.PI) / 360);
  const x = ((2 * u) / 640 - 1) * tangent * (640 / 425);
  const y = (1 - (2 * v) / 425) * tangent;
  const dy = -height / length + (y * depth) / length;
  const dz = -depth / length - (y * height) / length;
  const distance = -height / dy;
  return [x * distance, depth + dz * distance];
}

export function insidePolygon([x, z]: Point2, polygon: Point2[]): boolean {
  let inside = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const a = polygon[i],
      b = polygon[j];
    if (
      a[1] > z !== b[1] > z &&
      x < ((b[0] - a[0]) * (z - a[1])) / (b[1] - a[1]) + a[0]
    )
      inside = !inside;
  }
  return inside;
}

// Traced image coordinates, clockwise around visible PV fields. Vegetated
// gaps and detached southern blocks are intentionally retained.
const tracedFields: { name: string; polygon: Point2[]; inverter: Point2 }[] = [
  {
    name: "Tây Nam",
    polygon: [
      [19, 321],
      [138, 281],
      [204, 269],
      [225, 288],
      [263, 278],
      [276, 312],
      [63, 371],
      [43, 360],
    ],
    inverter: [180, 346],
  },
  {
    name: "Nam trung tâm",
    polygon: [
      [277, 235],
      [332, 222],
      [333, 209],
      [381, 194],
      [406, 225],
      [439, 240],
      [430, 266],
      [352, 296],
      [286, 313],
    ],
    inverter: [355, 298],
  },
  {
    name: "Tây trung tâm",
    polygon: [
      [181, 137],
      [221, 124],
      [289, 138],
      [323, 118],
      [360, 124],
      [353, 151],
      [297, 174],
      [248, 167],
      [205, 177],
      [180, 158],
    ],
    inverter: [255, 178],
  },
  {
    name: "Đông trung tâm",
    polygon: [
      [376, 121],
      [421, 108],
      [465, 117],
      [480, 107],
      [518, 130],
      [532, 160],
      [504, 185],
      [471, 225],
      [434, 235],
      [403, 207],
      [392, 174],
    ],
    inverter: [448, 232],
  },
  {
    name: "Đông Bắc",
    polygon: [
      [353, 51],
      [401, 42],
      [459, 44],
      [477, 63],
      [497, 87],
      [531, 104],
      [519, 121],
      [480, 97],
      [453, 86],
      [439, 70],
      [395, 65],
    ],
    inverter: [490, 99],
  },
  {
    name: "Tây Bắc",
    polygon: [
      [246, 26],
      [287, 22],
      [310, 26],
      [300, 35],
      [274, 37],
      [266, 46],
      [237, 49],
    ],
    inverter: [268, 51],
  },
  {
    name: "Bắc trung tâm",
    polygon: [
      [309, 22],
      [340, 27],
      [360, 32],
      [381, 26],
      [413, 34],
      [405, 42],
      [355, 47],
      [323, 39],
      [296, 41],
    ],
    inverter: [354, 51],
  },
  {
    name: "Dải phía Bắc",
    polygon: [
      [469, 52],
      [506, 53],
      [542, 57],
      [600, 61],
      [637, 65],
      [636, 77],
      [587, 72],
      [543, 74],
      [512, 66],
      [481, 67],
    ],
    inverter: [552, 79],
  },
  {
    name: "Đông khu trạm",
    polygon: [
      [580, 107],
      [608, 99],
      [629, 107],
      [619, 122],
      [589, 128],
      [569, 121],
    ],
    inverter: [606, 132],
  },
  {
    name: "Cụm Nam tách rời",
    polygon: [
      [85, 383],
      [143, 364],
      [132, 408],
      [94, 422],
      [67, 411],
    ],
    inverter: [145, 389],
  },
  {
    name: "Cụm phụ Tây Nam",
    polygon: [
      [215, 343],
      [235, 335],
      [249, 351],
      [220, 365],
    ],
    inverter: [250, 359],
  },
  {
    name: "Cụm phụ phía Nam",
    polygon: [
      [330, 313],
      [362, 310],
      [371, 324],
      [338, 331],
    ],
    inverter: [370, 332],
  },
];

export const pvRowRotation = -0.14;
export const pvRowScale: [number, number, number] = [0.48, 0.44, 0.18];
const halfWidth = 4.55 * pvRowScale[0],
  halfDepth = 4.95 * pvRowScale[2];
const rotated = (x: number, z: number): Point2 => [
  x * Math.cos(pvRowRotation) + z * Math.sin(pvRowRotation),
  -x * Math.sin(pvRowRotation) + z * Math.cos(pvRowRotation),
];

function fillField(polygon: Point2[]): Placement[] {
  const minX = Math.min(...polygon.map((p) => p[0]));
  const maxX = Math.max(...polygon.map((p) => p[0]));
  const minZ = Math.min(...polygon.map((p) => p[1]));
  const maxZ = Math.max(...polygon.map((p) => p[1]));
  const rows: Placement[] = [];
  for (let z = minZ; z <= maxZ; z += 2.8)
    for (let x = minX; x <= maxX; x += 4.65) {
      const corners = [
        [-halfWidth, -halfDepth],
        [-halfWidth, halfDepth],
        [halfWidth, -halfDepth],
        [halfWidth, halfDepth],
      ].map(([dx, dz]) => {
        const offset = rotated(dx, dz);
        return [x + offset[0], z + offset[1]] as Point2;
      });
      if (corners.every((p) => insidePolygon(p, polygon)))
        rows.push({
          position: [x, 0.1, z],
          rotation: pvRowRotation,
          scale: pvRowScale,
        });
    }
  return rows;
}

export const hongLiemFields = tracedFields.map((field, index) => {
  const polygon = field.polygon.map(([x, y]) => photoToGround([x, y]));
  const rows = fillField(polygon);
  const center: Point2 = [
    rows.reduce((s, p) => s + p.position[0], 0) / rows.length,
    rows.reduce((s, p) => s + p.position[2], 0) / rows.length,
  ];
  return {
    id: `HL3-PV-${String(index + 1).padStart(2, "0")}`,
    name: field.name,
    photoPolygon: field.polygon,
    polygon,
    rows,
    center,
    inverter: photoToGround(field.inverter),
  };
});

export const serviceYard: Point2[] = [
  [544, 116],
  [579, 114],
  [602, 138],
  [567, 144],
  [544, 131],
].map(([x, y]) => photoToGround([x, y]));
export const vegetationIsland: Point2[] = [
  [306, 68],
  [345, 55],
  [394, 66],
  [443, 92],
  [455, 108],
  [390, 114],
  [363, 108],
  [324, 116],
].map(([x, y]) => photoToGround([x, y]));
export const roadTraces: Point2[][] = [
  [
    [48, 383],
    [160, 350],
    [277, 316],
    [357, 301],
    [439, 270],
    [472, 234],
    [509, 191],
    [540, 157],
    [558, 141],
    [580, 141],
  ],
  [
    [324, 120],
    [339, 102],
    [341, 76],
    [354, 56],
    [393, 52],
    [444, 58],
    [482, 83],
    [529, 109],
    [555, 117],
  ],
  [
    [176, 163],
    [206, 184],
    [248, 178],
    [293, 184],
    [355, 160],
    [374, 124],
  ],
  [
    [284, 315],
    [276, 276],
    [270, 233],
    [297, 226],
    [333, 227],
  ],
  [
    [538, 157],
    [547, 185],
    [534, 225],
    [514, 257],
    [486, 294],
  ],
].map((trace) => trace.map(([x, y]) => photoToGround([x, y])));

export function segments(
  points: Point2[],
  width: number,
  modelLength = 5,
  modelWidth = 3,
  closed = false,
): Placement[] {
  const result: Placement[] = [];
  const list = closed ? [...points, points[0]] : points;
  for (let i = 1; i < list.length; i++) {
    const a = list[i - 1],
      b = list[i];
    const length = Math.hypot(b[0] - a[0], b[1] - a[1]);
    result.push({
      position: [(a[0] + b[0]) / 2, 0.04, (a[1] + b[1]) / 2],
      rotation: -Math.atan2(b[1] - a[1], b[0] - a[0]),
      scale: [length / modelLength, 0.3, width / modelWidth],
    });
  }
  return result;
}

const soilBoundary: Point2[] = [
  [8, 316],
  [171, 265],
  [171, 134],
  [230, 110],
  [233, 24],
  [291, 13],
  [414, 25],
  [461, 43],
  [639, 55],
  [639, 93],
  [611, 96],
  [638, 109],
  [625, 140],
  [570, 153],
  [535, 197],
  [484, 268],
  [383, 316],
  [361, 344],
  [266, 333],
  [254, 372],
  [160, 404],
  [128, 424],
  [60, 424],
  [48, 382],
].map(([x, y]) => photoToGround([x, y]));
export const hongLiemBoundary = soilBoundary;
export const hongLiemRoads = roadTraces.flatMap((trace) =>
  segments(trace, 2.7),
);
export const hongLiemFence = segments(soilBoundary, 0.35, 5, 1, true);
export const stationLocation = photoToGround([565, 127]);

// Sparse deterministic vegetation, constrained to visible empty land and the
// central island, never over the PV cells or schematic access roads.
export const hongLiemTrees: Placement[] = [];
for (let i = 0; i < 190; i++) {
  const u = 25 + ((i * 137.508) % 600),
    v = 25 + ((i * 79.31) % 370);
  const point = photoToGround([u, v]);
  const inIsland = insidePolygon(point, vegetationIsland);
  if (
    (inIsland || !insidePolygon(point, soilBoundary)) &&
    !hongLiemFields.some((f) => insidePolygon(point, f.polygon))
  )
    hongLiemTrees.push({
      position: [point[0], 0, point[1]],
      rotation: i * 1.71,
      scale: [0.5, 0.45, 0.5],
    });
}
