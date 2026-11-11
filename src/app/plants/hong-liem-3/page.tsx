import type { Metadata } from "next";
import Dashboard from "@/components/dashboard";

export const metadata: Metadata = {
  title: "Hồng Liêm 3 · Digital Twin",
  description:
    "Mô hình 3D nhà máy điện mặt trời Hồng Liêm 3 theo ảnh tham chiếu, với dữ liệu giả định.",
};
export default function HongLiemPage() {
  return <Dashboard plantId="hong-liem-3" />;
}
