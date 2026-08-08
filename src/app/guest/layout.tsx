import "@/app/globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Guest Self-Service Portal — StaySphere",
  description: "Self check-in, room folio, and guest services for Hotel Shemron Neemrana",
};

export default function GuestLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div style={{ background: "var(--color-bg-primary)", minHeight: "100vh" }}>
      {children}
    </div>
  );
}
