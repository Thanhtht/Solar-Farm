import type { Metadata } from "next";
import HongLiemDashboard from "@/components/hong-liem-dashboard";

export const metadata: Metadata = {
  title: "Hồng Liêm 3 · Digital Twin",
  description:
    "Mô hình 3D nhà máy điện mặt trời Hồng Liêm 3 theo ảnh tham chiếu, với dữ liệu giả định.",
};
export default function HongLiemPage() {
  return <HongLiemDashboard />;
}
