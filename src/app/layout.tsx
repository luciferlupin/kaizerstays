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
  authors: [{ name: "Curious Kaizer", url: "https://www.curiouskaizer.com/" }],
  creator: "Curious Kaizer",
  publisher: "Curious Kaizer",
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
        <meta name="developer" content="Curious Kaizer - https://www.curiouskaizer.com/" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "WebApplication",
              "name": "KaizerStays",
              "description": "Hotel Operating System & Property Management Platform",
              "creator": {
                "@type": "Organization",
                "name": "Curious Kaizer",
                "url": "https://www.curiouskaizer.com/",
                "sameAs": [
                  "https://www.instagram.com/curiouskaizer",
                  "https://www.linkedin.com/company/curiouskaizer"
                ]
              }
            })
          }}
        />
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
