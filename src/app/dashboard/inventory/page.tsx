import { Metadata } from "next";
import InventoryClient from "./InventoryClient";

export const metadata: Metadata = {
  title: "Stock & Inventory Management — KaizerStays",
  description: "Enterprise hotel stock inventory management, real-time valuation, low stock alerts, inter-department requisitions, and purchase orders for Hotel Shemron.",
};

export default function InventoryPage() {
  return <InventoryClient />;
}
