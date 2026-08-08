"use client";

import LoginClient from "./LoginClient";
import { AppStateProvider } from "@/context/AppStateContext";

export default function LoginPage() {
  return (
    <AppStateProvider>
      <LoginClient />
    </AppStateProvider>
  );
}
