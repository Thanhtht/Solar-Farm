import type { Metadata } from "next";
import Dashboard from "@/components/dashboard";

export const metadata: Metadata = {
  title: "Nhà máy điện Sava · Digital Twin",
};

export default function SavaPage() {
  return <Dashboard />;
}
