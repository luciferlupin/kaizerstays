import "./globals.css";
import type { Metadata, Viewport } from "next";

export const metadata: Metadata = {
  title: {
    default: "KaizerStays — Hotel Operating System",
    template: "%s",
  },
  description: "Run your entire hotel from one intelligent operating system. Bookings. Rooms. Guests. Payments. Housekeeping. Revenue. One platform.",
  keywords: ["hotel management", "PMS", "hotel software", "property management", "KaizerStays", "Hotel Shemron"],
  applicationName: "KaizerStays",
  authors: [{ name: "KaizerStays" }],
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#2563EB",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="KaizerStays" />
      </head>
      <body>{children}</body>
    </html>
  );
}
