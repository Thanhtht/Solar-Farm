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
  },
] as const;
