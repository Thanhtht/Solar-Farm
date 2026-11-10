import type { Metadata } from "next";
import "./globals.css";
import "./dashboard-theme.css";
import "./history.css";
import "./plant-directory.css";
export const metadata: Metadata = {
  title: "Nhà máy điện · Digital Twin",
  description:
    "Khám phá các nhà máy điện, xem hiện trạng, mô phỏng và phân tích dữ liệu vận hành.",
  icons: {
    icon: { url: "/brand/sava-logo.png", type: "image/png" },
  },
};
export default function Layout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="vi">
      <body>{children}</body>
    </html>
  );
}
