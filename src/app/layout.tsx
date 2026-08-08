import "./globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "KaizerStay — Hotel Operating System",
  description: "Run your entire hotel from one intelligent operating system. Bookings. Rooms. Guests. Payments. Housekeeping. Revenue. One platform.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
