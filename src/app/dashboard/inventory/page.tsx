import { Metadata } from "next";
import InventoryClient from "./InventoryClient";

export const metadata: Metadata = {
  title: "Department Ordering & Inventory Requisition — StaySphere",
  description: "Enterprise StayFlexi-grade inventory management, stock valuation, inter-department requisitions, and purchase orders for Hotel Shemron.",
};

export default function InventoryPage() {
  return <InventoryClient />;
}
