"use client";

import EmployeeClient from "./EmployeeClient";
import { AppStateProvider } from "@/context/AppStateContext";

export default function EmployeePage() {
  return (
    <AppStateProvider>
      <EmployeeClient />
    </AppStateProvider>
  );
}
