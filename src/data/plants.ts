import { plant } from "./plant";

// Only configured plants appear here; future plants get their own route and data.
export const plants = [
  {
    id: "sava",
    name: plant.name,
    href: "/plants/sava",
    description:
      "Khám phá nhà máy trong không gian 3D, theo dõi thiết bị và trải nghiệm các kịch bản vận hành.",
    dcMWp: plant.dcMWp,
    acMW: plant.acLimitMW,
    visualLabel: "SAVA",
    acLabel: "Giới hạn AC",
  },
  {
    id: "hong-liem-3",
    name: "Nhà máy điện Hồng Liêm 3",
    href: "/plants/hong-liem-3",
    description:
      "Khám phá bố cục nhà máy 3D dựng theo ảnh tham chiếu, chọn vùng pin và thử kịch bản với dữ liệu giả định.",
    dcMWp: 50,
    acMW: 40,
    visualLabel: "HỒNG LIÊM 3",
    acLabel: "AC giả định",
  },
  {
    id: "binh-nguyen",
    name: "Nhà máy điện Bình Nguyên",
    href: "/plants/binh-nguyen",
    description:
      "Hai khu pin Bắc–Nam theo ảnh tham chiếu, cùng giao diện giám sát, mô phỏng và thống kê. Công suất và dữ liệu giả định.",
    dcMWp: 50,
    acMW: 40,
    visualLabel: "BÌNH NGUYÊN",
    acLabel: "AC giả định",
  },
] as const;
