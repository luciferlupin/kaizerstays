"use client";

import "@/app/globals.css";
import { AppStateProvider } from "@/context/AppStateContext";

export default function GuestLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AppStateProvider>
      <div style={{ background: "var(--color-bg-primary)", minHeight: "100vh" }}>
        {children}
      </div>
    </AppStateProvider>
  );
}
