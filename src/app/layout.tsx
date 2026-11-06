import type { Metadata } from "next";
import "./globals.css";
import "./dashboard-theme.css";
import "./history.css";
export const metadata: Metadata = {
  title: "Solar Farm One · Digital Twin",
  description: "Khám phá nhà máy điện mặt trời 3D với dữ liệu IoT mẫu.",
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
