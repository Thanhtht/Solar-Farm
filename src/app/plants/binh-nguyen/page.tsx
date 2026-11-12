import type { Metadata } from "next";
import Dashboard from "@/components/dashboard";
export const metadata: Metadata = {
  title: "Bình Nguyên · Digital Twin",
  description:
    "Hai khu pin Bắc–Nam theo ảnh tham chiếu, giao diện chung với dữ liệu giả định.",
};
export default function BinhNguyenPage() {
  return <Dashboard plantId="binh-nguyen" />;
}
