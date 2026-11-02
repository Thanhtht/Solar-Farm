export type AssetType =
  "pv" | "inverter" | "transformer" | "weather" | "gateway";
export type Signal = {
  id: string;
  assetId: string;
  sampledAt: string;
  snapshotId: string;
  sampleIntervalSeconds: number;
  name: string;
  unit: string;
  value: number | null;
  quality: "valid" | "stale" | "missing";
  source: "telemetry" | "calculated";
  history: number[];
};
export type Asset = {
  id: string;
  name: string;
  type: AssetType;
  area: string;
  position: [number, number, number];
  related: string[];
  nominal: string;
  operation: string;
  connection: string;
  signals: Signal[];
};
export const timestamp = "02/11/2026 · 10:30 ICT";
const signal = (
  id: string,
  name: string,
  unit: string,
  value: number | null,
  source: Signal["source"] = "telemetry",
  quality: Signal["quality"] = "valid",
): Signal => ({
  id,
  assetId: id.split(".")[0],
  sampledAt: "2026-11-02T10:30:00+07:00",
  snapshotId: "fixture-T01",
  sampleIntervalSeconds: 60,
  name,
  unit,
  value,
  source,
  quality,
  history:
    value === null
      ? []
      : [0.91, 0.94, 0.93, 0.97, 0.98, 1].map((n) =>
          Number(
            (
              value *
              (id.endsWith(".vdc") ||
              id.endsWith(".fault") ||
              id.endsWith(".sources")
                ? 1
                : n)
            ).toFixed(2),
          ),
        ),
});
export const typeNames: Record<AssetType, string> = {
  pv: "Cụm pin",
  inverter: "Inverter",
  transformer: "Máy biến áp",
  weather: "Trạm thời tiết",
  gateway: "Gateway IoT",
};
export const assets: Asset[] = Array.from({ length: 8 }, (_, i) => {
  const n = String(i + 1).padStart(2, "0");
  const x = ((i % 4) - 1.5) * 12,
    z = (Math.floor(i / 4) - 0.5) * 17;
  return [
    {
      id: `PV-${n}`,
      name: `Cụm pin ${n}`,
      type: "pv" as const,
      area: i < 4 ? "Khu A" : "Khu B",
      position: [x, 0, z] as [number, number, number],
      related: [`INV-${n}`, "GW-01"],
      nominal: "6,25 MWp DC · cụm đại diện",
      operation: "Bình thường",
      connection: "Đang kết nối",
      signals: [
        signal(`PV-${n}.temp`, "Nhiệt độ module đại diện", "°C", 44 + i * 0.2),
        signal(`PV-${n}.vdc`, "Điện áp mạch DC tương đương", "V", 1000),
        signal(`PV-${n}.idc`, "Dòng DC tổng tương đương", "A", 4500),
        signal(
          `PV-${n}.pdc`,
          "Công suất DC tính toán",
          "MW",
          4.5,
          "calculated",
        ),
      ],
    },
    {
      id: `INV-${n}`,
      name: `Inverter ${n}`,
      type: "inverter" as const,
      area: i < 4 ? "Khu A" : "Khu B",
      position: [x, 0.5, z + 6] as [number, number, number],
      related: [`PV-${n}`, "TR-01", "GW-01"],
      nominal: "5 MW AC · 6,25 MWp DC đầu vào",
      operation: "Bình thường",
      connection: "Đang kết nối",
      signals: [
        signal(`INV-${n}.pac`, "Công suất AC", "MW", 4.32, "calculated"),
        signal(`INV-${n}.temp`, "Nhiệt độ bên trong", "°C", 48 + i * 0.3),
        signal(`INV-${n}.vdc`, "Điện áp DC", "V", 1000),
        signal(`INV-${n}.fault`, "Mã lỗi (0: không lỗi)", "", 0),
      ],
    },
  ];
}).flat();
assets.push(
  {
    id: "TR-01",
    name: "Trạm thu gom",
    type: "transformer",
    area: "Khu kỹ thuật",
    position: [29, 1, 0],
    related: assets.filter((a) => a.type === "inverter").map((a) => a.id),
    nominal: "40 MW AC · tổng 8 inverter",
    operation: "Bình thường",
    connection: "Đang kết nối",
    signals: [
      signal("TR-01.power", "Công suất tổng hợp", "MW", 34.56, "calculated"),
      signal("TR-01.temp", "Nhiệt độ cuộn dây đại diện", "°C", 57),
    ],
  },
  {
    id: "MET-01",
    name: "Trạm thời tiết",
    type: "weather",
    area: "Khu kỹ thuật",
    position: [-28, 1, -12],
    related: ["GW-01"],
    nominal: "Điểm đo đại diện · không đo từng tấm",
    operation: "Bình thường",
    connection: "Đang kết nối",
    signals: [
      signal("MET-01.irr", "Bức xạ mặt phẳng pin", "W/m²", 780),
      signal("MET-01.temp", "Nhiệt độ môi trường", "°C", 31),
      signal("MET-01.wind", "Tốc độ gió", "m/s", 2.4),
    ],
  },
  {
    id: "GW-01",
    name: "Gateway trung tâm",
    type: "gateway",
    area: "Khu kỹ thuật",
    position: [29, 1, 9],
    related: ["MET-01", "TR-01"],
    nominal: "18 nguồn thiết bị · heartbeat mẫu",
    operation: "Bình thường",
    connection: "Đang kết nối",
    signals: [
      signal("GW-01.sources", "Nguồn đang cung cấp dữ liệu", "nguồn", 18),
      signal("GW-01.latency", "Độ trễ mẫu", "ms", 42),
    ],
  },
);
export const plant = {
  id: "SF-01",
  name: "Solar Farm One",
  dcMWp: 50,
  acLimitMW: 40,
  timezone: "Asia/Ho_Chi_Minh",
  assets,
};
export const snapshot = {
  id: "fixture-T01",
  revision: 1,
  powerMW: assets
    .filter((a) => a.type === "inverter")
    .reduce((s, a) => s + (a.signals[0].value ?? 0), 0),
  energyMWh: 0,
  availability: 100,
  lossMWh: 0,
};
export const powerHistory = Array.from({ length: 6 }, (_, i) =>
  assets
    .filter((a) => a.type === "inverter")
    .reduce((sum, a) => sum + a.signals[0].history[i], 0),
);
export const scenarios = [
  {
    id: "cloud",
    icon: "☁",
    name: "Mây che",
    tag: "THỜI TIẾT",
    description: "Khám phá vùng pin dưới một lớp mây cục bộ.",
    severity: 45,
    duration: 30,
  },
  {
    id: "dust",
    icon: "◌",
    name: "Bám bụi",
    tag: "HIỆU SUẤT",
    description: "Quan sát vùng pin cần được kiểm tra bề mặt.",
    severity: 20,
    duration: 60,
  },
  {
    id: "fault",
    icon: "ϟ",
    name: "Lỗi inverter",
    tag: "THIẾT BỊ",
    description: "Đánh dấu một inverter trong tình huống sự cố.",
    severity: 100,
    duration: 30,
  },
] as const;
export type ScenarioId = (typeof scenarios)[number]["id"];

const transformerPower = assets.find((a) => a.id === "TR-01")!.signals[0];
transformerPower.history = [...powerHistory];
transformerPower.value = snapshot.powerMW;
