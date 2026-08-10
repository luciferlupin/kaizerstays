"use client";

import { useState, useMemo } from "react";
import { useAppState, StockInventoryItem, StockRequisition } from "@/context/AppStateContext";
import { formatCurrency, formatDate } from "@/lib/utils";
import {
  Boxes,
  Plus,
  Search,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Download,
  Package,
  ShoppingCart,
  Truck,
  TrendingDown,
  TrendingUp,
  X,
  Sparkles,
  SlidersHorizontal,
  Check,
  ShieldAlert,
  ChevronRight,
  Minus,
  Info,
  Layers,
  Phone,
  Calendar,
  Warehouse,
  ArrowRight,
  Filter,
  CheckCircle,
} from "lucide-react";

export default function InventoryClient() {
  const {
    inventoryItems,
    requisitions,
    addInventoryItem,
    updateInventoryStock,
    addRequisition,
    updateRequisitionStatus,
    currentUser,
  } = useAppState();

  const [activeTab, setActiveTab] = useState<"stock" | "requisitions" | "low_stock" | "suppliers">("stock");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDeptFilter, setSelectedDeptFilter] = useState("ALL");
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Detail Modal / Item Inspector
  const [inspectingItem, setInspectingItem] = useState<StockInventoryItem | null>(null);

  // Modals
  const [showAddItemModal, setShowAddItemModal] = useState(false);
  const [showAdjustModal, setShowAdjustModal] = useState(false);
  const [showReqModal, setShowReqModal] = useState(false);
  const [selectedAdjustItem, setSelectedAdjustItem] = useState<StockInventoryItem | null>(null);

  // Add Item Form State
  const [newItemCode, setNewItemCode] = useState("");
  const [newItemName, setNewItemName] = useState("");
  const [newItemCategory, setNewItemCategory] = useState<StockInventoryItem["category"]>("HOUSEKEEPING");
  const [newItemDepartment, setNewItemDepartment] = useState("Housekeeping");
  const [newItemQuantity, setNewItemQuantity] = useState(20);
  const [newItemUnit, setNewItemUnit] = useState("Pcs");
  const [newItemMinThreshold, setNewItemMinThreshold] = useState(15);
  const [newItemUnitPrice, setNewItemUnitPrice] = useState(500);
  const [newItemLocation, setNewItemLocation] = useState("Main Linen Room");
  const [newItemSupplier, setNewItemSupplier] = useState("Rajasthan Textile Mills");

  // Stock Adjustment Form State
  const [adjustType, setAdjustType] = useState<"IN" | "OUT" | "SET">("IN");
  const [adjustQty, setAdjustQty] = useState(10);
  const [adjustReason, setAdjustReason] = useState("Purchase Delivery & Restock");

  // Requisition Form State
  const [reqDept, setReqDept] = useState("Housekeeping");
  const [reqItem, setReqItem] = useState("");
  const [reqQty, setReqQty] = useState(10);
  const [reqUnit, setReqUnit] = useState("Pcs");
  const [reqPriority, setReqPriority] = useState<"NORMAL" | "URGENT">("NORMAL");

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // KPIs
  const totalValuation = useMemo(
    () => inventoryItems.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0),
    [inventoryItems]
  );
  const lowStockItems = useMemo(
    () => inventoryItems.filter((i) => i.quantity <= i.minThreshold),
    [inventoryItems]
  );
  const lowStockCount = lowStockItems.length;
  const pendingRequisitions = useMemo(
    () => requisitions.filter((r) => r.status === "PENDING_APPROVAL"),
    [requisitions]
  );

  // Verified Supplier Directory
  const suppliersMap: Record<string, { category: string; items: string[]; contact: string; lastDelivery: string; rating: number }> = {
    "Rajasthan Textile Mills": { category: "Linen & Bedding", items: ["Premium King Bed Sheets", "Bath Towels 600 GSM"], contact: "+91 98290 11223", lastDelivery: "3 days ago", rating: 4.9 },
    "CleanPro Linens": { category: "Linen Supplies", items: ["Bath Towels 600 GSM", "Hand Towels"], contact: "+91 98112 44332", lastDelivery: "Yesterday", rating: 4.8 },
    "Forest Essentials": { category: "Guest Amenities", items: ["Luxury Guest Shampoo & Body Wash 50ml", "Handmade Soaps"], contact: "+91 98711 00998", lastDelivery: "5 days ago", rating: 5.0 },
    "Amul Dairy Neemrana": { category: "F&B Dairy", items: ["Amul Butter 500g", "Amul Fresh Cream", "Pasteurized Milk"], contact: "+91 94140 33221", lastDelivery: "Today, 06:00 AM", rating: 4.9 },
    "Fresh Farms Dairy": { category: "Fresh Perishables", items: ["Fresh Cottage Cheese (Paneer)", "Curd / Yogurt"], contact: "+91 99281 77665", lastDelivery: "Today, 07:30 AM", rating: 4.7 },
    "Tata Tea Supplies": { category: "F&B Dry Pantry", items: ["Premium Tea Leaves & Coffee Sachets", "Sugar Sachets"], contact: "+91 98100 55443", lastDelivery: "1 week ago", rating: 4.8 },
    "SmartCard Tech": { category: "Front Desk Hardware", items: ["RFID Key Cards (Hotel Branded)", "Key Envelopes"], contact: "+91 98990 44321", lastDelivery: "2 weeks ago", rating: 4.9 },
    "Havells India": { category: "Electrical & Spares", items: ["LED Warm White Bulbs 9W", "MCB Switches"], contact: "+91 97110 88776", lastDelivery: "4 days ago", rating: 4.9 },
    "Jaquar Supplies": { category: "Plumbing Fixtures", items: ["Faucet Aerators & Plumbing Washers", "Shower Heads"], contact: "+91 98292 66554", lastDelivery: "1 week ago", rating: 4.8 },
  };

  // Inline Quick Stepper
  const handleQuickStep = (item: StockInventoryItem, delta: number, e: React.MouseEvent) => {
    e.stopPropagation();
    if (item.quantity + delta < 0) return;
    updateInventoryStock(item.id, delta, delta > 0 ? "Quick 1-Tap Restock (+)" : "Quick 1-Tap Issue (-)");
    showToast(`${delta > 0 ? "➕ Added" : "➖ Deducted"} 1 ${item.unit} to ${item.name} (Now: ${item.quantity + delta} ${item.unit})`);
  };

  const handleOpenAdjustModal = (item: StockInventoryItem, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setSelectedAdjustItem(item);
    setAdjustType("IN");
    setAdjustQty(10);
    setAdjustReason("Purchase Delivery & Restock");
    setShowAdjustModal(true);
  };

  const handleExecuteAdjustment = () => {
    if (!selectedAdjustItem || adjustQty <= 0) return;
    const finalQty = adjustType === "IN" ? adjustQty : adjustType === "OUT" ? -adjustQty : adjustQty - selectedAdjustItem.quantity;
    updateInventoryStock(selectedAdjustItem.id, finalQty, adjustReason);
    showToast(`✅ Stock updated for ${selectedAdjustItem.name}: ${finalQty >= 0 ? `+${finalQty}` : `${finalQty}`} ${selectedAdjustItem.unit}`);
    setShowAdjustModal(false);
  };

  const handleCreateNewItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItemName.trim() || !newItemCode.trim()) return;

    addInventoryItem({
      code: newItemCode.trim().toUpperCase(),
      name: newItemName.trim(),
      category: newItemCategory,
      department: newItemDepartment,
      quantity: Number(newItemQuantity) || 0,
      unit: newItemUnit,
      minThreshold: Number(newItemMinThreshold) || 10,
      unitPrice: Number(newItemUnitPrice) || 0,
      location: newItemLocation,
      supplier: newItemSupplier,
    });

    showToast(`📦 Created SKU ${newItemCode.toUpperCase()} (${newItemName})`);
    setShowAddItemModal(false);
    setNewItemName("");
    setNewItemCode("");
  };

  const handleCreateRequisition = (e: React.FormEvent) => {
    e.preventDefault();
    const itemName = reqItem || (inventoryItems[0]?.name ?? "Stock Item");
    addRequisition({
      department: reqDept,
      requestedBy: currentUser?.name ? `${currentUser.name} (${currentUser.role})` : "Ninaad Khera (GM)",
      item: itemName,
      quantity: Number(reqQty) || 1,
      unit: reqUnit,
      priority: reqPriority,
      status: "PENDING_APPROVAL",
    });
    showToast(`📋 Requisition for ${itemName} submitted to GM!`);
    setShowReqModal(false);
  };

  const exportStockReport = () => {
    const headers = "Item Code,Item Name,Category,Department,Quantity,Unit,Unit Cost (INR),Total Valuation (INR),Location,Supplier,Status\n";
    const rows = inventoryItems
      .map((i) => {
        const isLow = i.quantity <= i.minThreshold;
        return `"${i.code}","${i.name}","${i.category}","${i.department}",${i.quantity},"${i.unit}",${i.unitPrice},${
          i.quantity * i.unitPrice
        },"${i.location}","${i.supplier}","${isLow ? "LOW STOCK" : "OPTIMAL"}"`;
      })
      .join("\n");

    const blob = new Blob([headers + rows], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `StaySphere_Hotel_Shemron_Inventory_${formatDate(new Date(), "yyyy-MM-dd")}.csv`;
    a.click();
  };

  // Department counts for chips
  const deptCounts = useMemo(() => {
    const counts: Record<string, number> = { ALL: inventoryItems.length };
    inventoryItems.forEach((i) => {
      counts[i.department] = (counts[i.department] || 0) + 1;
    });
    return counts;
  }, [inventoryItems]);

  const filteredItems = useMemo(() => {
    return inventoryItems.filter((item) => {
      if (selectedDeptFilter !== "ALL" && item.department !== selectedDeptFilter) return false;
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        return (
          item.name.toLowerCase().includes(q) ||
          item.code.toLowerCase().includes(q) ||
          item.department.toLowerCase().includes(q) ||
          item.supplier.toLowerCase().includes(q) ||
          item.location.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [inventoryItems, selectedDeptFilter, searchQuery]);

  return (
    <div className="page-content" style={{ maxWidth: "1400px", margin: "0 auto" }}>
      {/* Toast Notification */}
      {toastMessage && (
        <div
          style={{
            position: "fixed",
            bottom: "28px",
            right: "28px",
            background: "rgba(28, 28, 30, 0.95)",
            backdropFilter: "blur(20px)",
            WebkitBackdropFilter: "blur(20px)",
            color: "#fff",
            padding: "12px 18px",
            borderRadius: "12px",
            boxShadow: "0 12px 36px rgba(0,0,0,0.25)",
            zIndex: 9999,
            display: "flex",
            alignItems: "center",
            gap: "10px",
            fontSize: "13px",
            fontWeight: 500,
            border: "1px solid rgba(255,255,255,0.12)",
            animation: "fadeIn 0.2s ease",
          }}
        >
          <Sparkles size={16} className="text-primary" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* ─── Apple-Grade Page Header ─── */}
      <div className="page-header" style={{ marginBottom: "24px" }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <div
              style={{
                width: "40px",
                height: "40px",
                borderRadius: "10px",
                background: "linear-gradient(135deg, #0071E3 0%, #005BB5 100%)",
                color: "#fff",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                boxShadow: "0 4px 12px rgba(0, 113, 227, 0.25)",
              }}
            >
              <Boxes size={22} />
            </div>
            <div>
              <h1 className="page-title" style={{ fontSize: "24px", fontWeight: 700, letterSpacing: "-0.03em" }}>
                Stock & Inventory
              </h1>
              <p className="page-description" style={{ fontSize: "13px", marginTop: "2px" }}>
                Real-time stock ledger, inter-department requisitions, live valuation &amp; safety alerts for <strong>Hotel Shemron</strong>.
              </p>
            </div>
          </div>
        </div>

        <div className="page-actions" style={{ gap: "8px" }}>
          <button
            className="btn btn-secondary btn-sm"
            onClick={exportStockReport}
            style={{ borderRadius: "8px", fontWeight: 500 }}
          >
            <Download size={14} /> Export CSV
          </button>
          <button
            className="btn btn-secondary btn-sm"
            onClick={() => setShowReqModal(true)}
            style={{ borderRadius: "8px", fontWeight: 500 }}
          >
            <ShoppingCart size={14} /> + Requisition
          </button>
          <button
            className="btn btn-primary btn-sm"
            style={{
              borderRadius: "8px",
              background: "#0071E3",
              color: "#fff",
              fontWeight: 600,
              boxShadow: "0 2px 8px rgba(0, 113, 227, 0.25)",
            }}
            onClick={() => setShowAddItemModal(true)}
          >
            <Plus size={15} /> + Add Item
          </button>
        </div>
      </div>

      {/* ─── Apple-Style Metric Cards Grid ─── */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
          gap: "14px",
          marginBottom: "24px",
        }}
      >
        {/* Card 1: Valuation */}
        <div
          className="card"
          style={{
            padding: "18px 20px",
            borderRadius: "14px",
            background: "var(--color-bg-elevated, #fff)",
            border: "1px solid var(--color-border)",
            position: "relative",
            overflow: "hidden",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
            <span style={{ fontSize: "12px", fontWeight: 600, color: "var(--color-text-secondary)", textTransform: "uppercase", letterSpacing: "0.04em" }}>
              Total Valuation
            </span>
            <div
              style={{
                width: "28px",
                height: "28px",
                borderRadius: "8px",
                background: "var(--color-primary-light)",
                color: "var(--color-primary)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <TrendingUp size={15} />
            </div>
          </div>
          <div style={{ fontSize: "26px", fontWeight: 700, letterSpacing: "-0.03em", marginTop: "8px", color: "var(--color-text)" }}>
            {formatCurrency(totalValuation)}
          </div>
          <div style={{ fontSize: "12px", color: "var(--color-text-tertiary)", marginTop: "4px" }}>
            Across {inventoryItems.length} tracked items
          </div>
        </div>

        {/* Card 2: Low Stock Alerts */}
        <div
          className="card"
          style={{
            padding: "18px 20px",
            borderRadius: "14px",
            background: "var(--color-bg-elevated, #fff)",
            border: lowStockCount > 0 ? "1px solid rgba(255, 59, 48, 0.3)" : "1px solid var(--color-border)",
            cursor: "pointer",
            transition: "all 0.15s ease",
          }}
          onClick={() => setActiveTab("low_stock")}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
            <span style={{ fontSize: "12px", fontWeight: 600, color: "var(--color-text-secondary)", textTransform: "uppercase", letterSpacing: "0.04em" }}>
              Low Stock Alerts
            </span>
            <div
              style={{
                width: "28px",
                height: "28px",
                borderRadius: "8px",
                background: lowStockCount > 0 ? "rgba(255, 59, 48, 0.12)" : "rgba(52, 199, 89, 0.12)",
                color: lowStockCount > 0 ? "var(--red-600)" : "var(--green-600)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              {lowStockCount > 0 ? <AlertTriangle size={15} /> : <CheckCircle2 size={15} />}
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "baseline", gap: "8px", marginTop: "8px" }}>
            <span style={{ fontSize: "26px", fontWeight: 700, letterSpacing: "-0.03em", color: lowStockCount > 0 ? "var(--red-600)" : "var(--color-text)" }}>
              {lowStockCount}
            </span>
            <span style={{ fontSize: "13px", color: "var(--color-text-secondary)" }}>SKUs under threshold</span>
          </div>
          <div style={{ fontSize: "12px", color: lowStockCount > 0 ? "var(--red-600)" : "var(--green-600)", marginTop: "4px", fontWeight: 500 }}>
            {lowStockCount > 0 ? "⚠️ Needs Vendor Reorder" : "✔ All stock healthy"}
          </div>
        </div>

        {/* Card 3: Pending Requisitions */}
        <div
          className="card"
          style={{
            padding: "18px 20px",
            borderRadius: "14px",
            background: "var(--color-bg-elevated, #fff)",
            border: "1px solid var(--color-border)",
            cursor: "pointer",
          }}
          onClick={() => setActiveTab("requisitions")}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
            <span style={{ fontSize: "12px", fontWeight: 600, color: "var(--color-text-secondary)", textTransform: "uppercase", letterSpacing: "0.04em" }}>
              Requisitions
            </span>
            <div
              style={{
                width: "28px",
                height: "28px",
                borderRadius: "8px",
                background: "rgba(255, 149, 0, 0.12)",
                color: "var(--amber-600)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Clock size={15} />
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "baseline", gap: "8px", marginTop: "8px" }}>
            <span style={{ fontSize: "26px", fontWeight: 700, letterSpacing: "-0.03em", color: "var(--color-text)" }}>
              {pendingRequisitions.length}
            </span>
            <span style={{ fontSize: "13px", color: "var(--color-text-secondary)" }}>pending GM approval</span>
          </div>
          <div style={{ fontSize: "12px", color: "var(--amber-600)", marginTop: "4px", fontWeight: 500 }}>
            {requisitions.filter((r) => r.status === "APPROVED").length} ready for store issue
          </div>
        </div>

        {/* Card 4: Store Categories */}
        <div
          className="card"
          style={{
            padding: "18px 20px",
            borderRadius: "14px",
            background: "var(--color-bg-elevated, #fff)",
            border: "1px solid var(--color-border)",
            cursor: "pointer",
          }}
          onClick={() => setActiveTab("suppliers")}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
            <span style={{ fontSize: "12px", fontWeight: 600, color: "var(--color-text-secondary)", textTransform: "uppercase", letterSpacing: "0.04em" }}>
              Active Vendors
            </span>
            <div
              style={{
                width: "28px",
                height: "28px",
                borderRadius: "8px",
                background: "rgba(52, 199, 89, 0.12)",
                color: "var(--green-600)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Truck size={15} />
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "baseline", gap: "8px", marginTop: "8px" }}>
            <span style={{ fontSize: "26px", fontWeight: 700, letterSpacing: "-0.03em", color: "var(--color-text)" }}>
              {Object.keys(suppliersMap).length}
            </span>
            <span style={{ fontSize: "13px", color: "var(--color-text-secondary)" }}>verified partners</span>
          </div>
          <div style={{ fontSize: "12px", color: "var(--green-600)", marginTop: "4px", fontWeight: 500 }}>
            ✔ 100% Rate Agreement Linked
          </div>
        </div>
      </div>

      {/* ─── Apple Segmented Navigation Bar ─── */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: "12px",
          marginBottom: "18px",
        }}
      >
        {/* Segmented Control */}
        <div
          style={{
            display: "inline-flex",
            padding: "3px",
            background: "rgba(0, 0, 0, 0.06)",
            borderRadius: "10px",
            gap: "2px",
          }}
        >
          <button
            onClick={() => setActiveTab("stock")}
            style={{
              padding: "7px 16px",
              borderRadius: "8px",
              fontSize: "13px",
              fontWeight: 600,
              border: "none",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "6px",
              background: activeTab === "stock" ? "#fff" : "transparent",
              color: activeTab === "stock" ? "#000" : "var(--color-text-secondary)",
              boxShadow: activeTab === "stock" ? "0 2px 6px rgba(0,0,0,0.08)" : "none",
              transition: "all 0.15s ease",
            }}
          >
            <Boxes size={14} /> Stock Ledger ({inventoryItems.length})
          </button>
          <button
            onClick={() => setActiveTab("requisitions")}
            style={{
              padding: "7px 16px",
              borderRadius: "8px",
              fontSize: "13px",
              fontWeight: 600,
              border: "none",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "6px",
              background: activeTab === "requisitions" ? "#fff" : "transparent",
              color: activeTab === "requisitions" ? "#000" : "var(--color-text-secondary)",
              boxShadow: activeTab === "requisitions" ? "0 2px 6px rgba(0,0,0,0.08)" : "none",
              transition: "all 0.15s ease",
            }}
          >
            <ShoppingCart size={14} /> Requisitions ({requisitions.length})
          </button>
          <button
            onClick={() => setActiveTab("low_stock")}
            style={{
              padding: "7px 16px",
              borderRadius: "8px",
              fontSize: "13px",
              fontWeight: 600,
              border: "none",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "6px",
              background: activeTab === "low_stock" ? "#fff" : "transparent",
              color: activeTab === "low_stock" ? "#000" : "var(--color-text-secondary)",
              boxShadow: activeTab === "low_stock" ? "0 2px 6px rgba(0,0,0,0.08)" : "none",
              transition: "all 0.15s ease",
            }}
          >
            <AlertTriangle size={14} color={lowStockCount > 0 ? "#FF3B30" : "inherit"} />
            Low Stock ({lowStockCount})
          </button>
          <button
            onClick={() => setActiveTab("suppliers")}
            style={{
              padding: "7px 16px",
              borderRadius: "8px",
              fontSize: "13px",
              fontWeight: 600,
              border: "none",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "6px",
              background: activeTab === "suppliers" ? "#fff" : "transparent",
              color: activeTab === "suppliers" ? "#000" : "var(--color-text-secondary)",
              boxShadow: activeTab === "suppliers" ? "0 2px 6px rgba(0,0,0,0.08)" : "none",
              transition: "all 0.15s ease",
            }}
          >
            <Truck size={14} /> Vendors
          </button>
        </div>

        {/* Search Bar */}
        {(activeTab === "stock" || activeTab === "low_stock") && (
          <div style={{ position: "relative", minWidth: "260px" }}>
            <Search
              size={14}
              style={{
                position: "absolute",
                left: "12px",
                top: "50%",
                transform: "translateY(-50%)",
                color: "var(--color-text-tertiary)",
              }}
            />
            <input
              type="text"
              placeholder="Search SKU code, name, location..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                width: "100%",
                padding: "8px 12px 8px 34px",
                borderRadius: "10px",
                border: "1px solid var(--color-border)",
                background: "var(--color-bg-elevated, #fff)",
                fontSize: "13px",
                outline: "none",
                transition: "border-color 0.15s ease",
              }}
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                style={{
                  position: "absolute",
                  right: "10px",
                  top: "50%",
                  transform: "translateY(-50%)",
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  color: "var(--color-text-tertiary)",
                }}
              >
                <X size={13} />
              </button>
            )}
          </div>
        )}
      </div>

      {/* Department Filter Chips (for Stock tab) */}
      {activeTab === "stock" && (
        <div
          style={{
            display: "flex",
            gap: "8px",
            overflowX: "auto",
            paddingBottom: "10px",
            marginBottom: "12px",
          }}
        >
          {["ALL", "Housekeeping", "Restaurant Kitchen", "Front Desk", "Maintenance"].map((dept) => {
            const count = dept === "ALL" ? inventoryItems.length : deptCounts[dept] || 0;
            const isSelected = selectedDeptFilter === dept;
            return (
              <button
                key={dept}
                onClick={() => setSelectedDeptFilter(dept)}
                style={{
                  padding: "5px 12px",
                  borderRadius: "20px",
                  fontSize: "12px",
                  fontWeight: isSelected ? 600 : 500,
                  border: isSelected ? "1px solid #0071E3" : "1px solid var(--color-border)",
                  background: isSelected ? "rgba(0, 113, 227, 0.08)" : "var(--color-bg-elevated, #fff)",
                  color: isSelected ? "#0071E3" : "var(--color-text-secondary)",
                  cursor: "pointer",
                  whiteSpace: "nowrap",
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                  transition: "all 0.15s ease",
                }}
              >
                <span>{dept === "ALL" ? "All Departments" : dept}</span>
                <span
                  style={{
                    fontSize: "11px",
                    background: isSelected ? "#0071E3" : "rgba(0,0,0,0.06)",
                    color: isSelected ? "#fff" : "var(--color-text-tertiary)",
                    padding: "1px 6px",
                    borderRadius: "10px",
                    fontWeight: 600,
                  }}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      )}

      {/* ─── TAB 1: Apple-Style Stock Ledger Table ─── */}
      {activeTab === "stock" && (
        <div
          className="card"
          style={{
            padding: 0,
            borderRadius: "14px",
            overflow: "hidden",
            border: "1px solid var(--color-border)",
            background: "var(--color-bg-elevated, #fff)",
          }}
        >
          <div className="data-table-wrapper">
            <table className="data-table">
              <thead>
                <tr>
                  <th style={{ paddingLeft: "20px" }}>SKU Code</th>
                  <th>Item Description</th>
                  <th>Department</th>
                  <th style={{ width: "200px" }}>1-Tap Stock Stepper</th>
                  <th>Unit Cost</th>
                  <th>Valuation</th>
                  <th>Storage Shelf</th>
                  <th>Status</th>
                  <th style={{ textAlign: "right", paddingRight: "20px" }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredItems.length === 0 ? (
                  <tr>
                    <td colSpan={9} style={{ textAlign: "center", padding: "48px 20px" }}>
                      <Boxes size={36} className="text-tertiary" style={{ margin: "0 auto 10px auto" }} />
                      <div style={{ fontWeight: 600, fontSize: "15px" }}>No matching stock items found</div>
                      <p className="text-xs text-secondary" style={{ marginTop: "4px" }}>
                        Try clearing your search query or department filter.
                      </p>
                    </td>
                  </tr>
                ) : (
                  filteredItems.map((item) => {
                    const isLow = item.quantity <= item.minThreshold;
                    const stockPct = Math.min(100, Math.round((item.quantity / (item.minThreshold * 2.5)) * 100));

                    return (
                      <tr
                        key={item.id}
                        style={{ cursor: "pointer" }}
                        onClick={() => setInspectingItem(item)}
                      >
                        {/* SKU */}
                        <td style={{ paddingLeft: "20px" }}>
                          <span
                            style={{
                              fontFamily: "ui-monospace, SFMono-Regular, monospace",
                              fontSize: "12px",
                              fontWeight: 700,
                              background: "rgba(0,0,0,0.04)",
                              padding: "3px 7px",
                              borderRadius: "6px",
                            }}
                          >
                            {item.code}
                          </span>
                        </td>

                        {/* Name & Supplier */}
                        <td>
                          <div style={{ fontWeight: 600, fontSize: "13px", color: "var(--color-text)" }}>
                            {item.name}
                          </div>
                          <div className="text-xs text-tertiary" style={{ marginTop: "2px" }}>
                            Vendor: {item.supplier}
                          </div>
                        </td>

                        {/* Department */}
                        <td>
                          <span
                            style={{
                              fontSize: "11px",
                              fontWeight: 600,
                              padding: "3px 8px",
                              borderRadius: "6px",
                              background:
                                item.department === "Housekeeping"
                                  ? "rgba(0, 113, 227, 0.08)"
                                  : item.department === "Restaurant Kitchen"
                                  ? "rgba(255, 149, 0, 0.1)"
                                  : item.department === "Front Desk"
                                  ? "rgba(175, 82, 222, 0.1)"
                                  : "rgba(52, 199, 89, 0.1)",
                              color:
                                item.department === "Housekeeping"
                                  ? "#0071E3"
                                  : item.department === "Restaurant Kitchen"
                                  ? "#E08200"
                                  : item.department === "Front Desk"
                                  ? "#9B39CB"
                                  : "#28B94C",
                            }}
                          >
                            {item.department}
                          </span>
                        </td>

                        {/* 1-Tap Apple Stepper Control */}
                        <td>
                          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                            {/* Stepper Widget */}
                            <div
                              style={{
                                display: "inline-flex",
                                alignItems: "center",
                                background: "rgba(0,0,0,0.05)",
                                borderRadius: "8px",
                                padding: "2px",
                                border: "1px solid var(--color-border)",
                              }}
                              onClick={(e) => e.stopPropagation()}
                            >
                              <button
                                style={{
                                  width: "24px",
                                  height: "24px",
                                  borderRadius: "6px",
                                  border: "none",
                                  background: "#fff",
                                  color: "#000",
                                  cursor: "pointer",
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "center",
                                  boxShadow: "0 1px 3px rgba(0,0,0,0.08)",
                                  opacity: item.quantity <= 0 ? 0.4 : 1,
                                }}
                                disabled={item.quantity <= 0}
                                onClick={(e) => handleQuickStep(item, -1, e)}
                                title="Deduct 1"
                              >
                                <Minus size={12} />
                              </button>

                              <span
                                style={{
                                  padding: "0 10px",
                                  fontWeight: 700,
                                  fontSize: "13px",
                                  minWidth: "48px",
                                  textAlign: "center",
                                  color: isLow ? "var(--red-600)" : "inherit",
                                }}
                              >
                                {item.quantity}
                              </span>

                              <button
                                style={{
                                  width: "24px",
                                  height: "24px",
                                  borderRadius: "6px",
                                  border: "none",
                                  background: "#fff",
                                  color: "#000",
                                  cursor: "pointer",
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "center",
                                  boxShadow: "0 1px 3px rgba(0,0,0,0.08)",
                                }}
                                onClick={(e) => handleQuickStep(item, 1, e)}
                                title="Add 1"
                              >
                                <Plus size={12} />
                              </button>
                            </div>

                            <span className="text-xs text-secondary">{item.unit}</span>
                          </div>

                          {/* Mini Progress Bar */}
                          <div
                            style={{
                              width: "110px",
                              height: "3px",
                              background: "rgba(0,0,0,0.06)",
                              borderRadius: "2px",
                              marginTop: "5px",
                              overflow: "hidden",
                            }}
                          >
                            <div
                              style={{
                                width: `${stockPct}%`,
                                height: "100%",
                                background: isLow ? "#FF3B30" : "#34C759",
                                transition: "width 0.2s ease",
                              }}
                            />
                          </div>
                        </td>

                        {/* Unit Cost */}
                        <td style={{ fontSize: "13px", color: "var(--color-text-secondary)" }}>
                          {formatCurrency(item.unitPrice)}
                        </td>

                        {/* Valuation */}
                        <td style={{ fontSize: "13px", fontWeight: 700, color: "var(--color-text)" }}>
                          {formatCurrency(item.quantity * item.unitPrice)}
                        </td>

                        {/* Location */}
                        <td style={{ fontSize: "12px", color: "var(--color-text-secondary)" }}>
                          <span style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                            <Warehouse size={12} className="text-tertiary" />
                            {item.location}
                          </span>
                        </td>

                        {/* Status */}
                        <td>
                          {isLow ? (
                            <span
                              style={{
                                display: "inline-flex",
                                alignItems: "center",
                                gap: "4px",
                                fontSize: "11px",
                                fontWeight: 700,
                                padding: "3px 8px",
                                borderRadius: "12px",
                                background: "rgba(255, 59, 48, 0.12)",
                                color: "var(--red-600)",
                              }}
                            >
                              <AlertTriangle size={11} /> Low ({item.minThreshold} min)
                            </span>
                          ) : (
                            <span
                              style={{
                                display: "inline-flex",
                                alignItems: "center",
                                gap: "4px",
                                fontSize: "11px",
                                fontWeight: 600,
                                padding: "3px 8px",
                                borderRadius: "12px",
                                background: "rgba(52, 199, 89, 0.12)",
                                color: "var(--green-700)",
                              }}
                            >
                              <Check size={11} /> Healthy
                            </span>
                          )}
                        </td>

                        {/* Action */}
                        <td style={{ textAlign: "right", paddingRight: "20px" }}>
                          <button
                            className="btn btn-ghost btn-sm"
                            style={{ fontSize: "12px", padding: "4px 8px", borderRadius: "6px" }}
                            onClick={(e) => handleOpenAdjustModal(item, e)}
                          >
                            <SlidersHorizontal size={13} /> Adjust
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ─── TAB 2: Material Requisitions ─── */}
      {activeTab === "requisitions" && (
        <div
          className="card"
          style={{
            padding: 0,
            borderRadius: "14px",
            overflow: "hidden",
            border: "1px solid var(--color-border)",
            background: "var(--color-bg-elevated, #fff)",
          }}
        >
          <div className="data-table-wrapper">
            <table className="data-table">
              <thead>
                <tr>
                  <th style={{ paddingLeft: "20px" }}>Requisition #</th>
                  <th>Department</th>
                  <th>Requested By</th>
                  <th>Item Requested</th>
                  <th>Quantity</th>
                  <th>Priority</th>
                  <th>Status</th>
                  <th>Date Logged</th>
                  <th style={{ textAlign: "right", paddingRight: "20px" }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {requisitions.length === 0 ? (
                  <tr>
                    <td colSpan={9} style={{ textAlign: "center", padding: "48px 20px" }}>
                      <ShoppingCart size={36} className="text-tertiary" style={{ margin: "0 auto 10px auto" }} />
                      <div style={{ fontWeight: 600, fontSize: "15px" }}>No Material Requisitions</div>
                      <p className="text-xs text-secondary" style={{ marginTop: "4px" }}>
                        Click &quot;+ Requisition&quot; to request items from central store.
                      </p>
                    </td>
                  </tr>
                ) : (
                  requisitions.map((req) => (
                    <tr key={req.id}>
                      <td style={{ paddingLeft: "20px" }}>
                        <span
                          style={{
                            fontFamily: "ui-monospace, SFMono-Regular, monospace",
                            fontSize: "12px",
                            fontWeight: 700,
                            background: "rgba(0,0,0,0.04)",
                            padding: "3px 7px",
                            borderRadius: "6px",
                          }}
                        >
                          {req.reqNumber}
                        </span>
                      </td>
                      <td style={{ fontWeight: 600, fontSize: "13px" }}>{req.department}</td>
                      <td style={{ fontSize: "12px", color: "var(--color-text-secondary)" }}>{req.requestedBy}</td>
                      <td style={{ fontWeight: 600, fontSize: "13px" }}>{req.item}</td>
                      <td style={{ fontWeight: 700, fontSize: "13px" }}>
                        {req.quantity} {req.unit}
                      </td>
                      <td>
                        {req.priority === "URGENT" ? (
                          <span
                            style={{
                              fontSize: "10px",
                              fontWeight: 700,
                              background: "#FF3B30",
                              color: "#fff",
                              padding: "2px 6px",
                              borderRadius: "4px",
                            }}
                          >
                            URGENT
                          </span>
                        ) : (
                          <span
                            style={{
                              fontSize: "10px",
                              fontWeight: 600,
                              background: "rgba(0,0,0,0.06)",
                              padding: "2px 6px",
                              borderRadius: "4px",
                            }}
                          >
                            NORMAL
                          </span>
                        )}
                      </td>
                      <td>
                        {req.status === "PENDING_APPROVAL" && (
                          <span
                            style={{
                              display: "inline-flex",
                              alignItems: "center",
                              gap: "4px",
                              fontSize: "11px",
                              fontWeight: 600,
                              background: "rgba(255, 149, 0, 0.12)",
                              color: "#E08200",
                              padding: "3px 8px",
                              borderRadius: "12px",
                            }}
                          >
                            <Clock size={11} /> Pending GM
                          </span>
                        )}
                        {req.status === "APPROVED" && (
                          <span
                            style={{
                              display: "inline-flex",
                              alignItems: "center",
                              gap: "4px",
                              fontSize: "11px",
                              fontWeight: 600,
                              background: "rgba(0, 113, 227, 0.1)",
                              color: "#0071E3",
                              padding: "3px 8px",
                              borderRadius: "12px",
                            }}
                          >
                            <CheckCircle2 size={11} /> Approved
                          </span>
                        )}
                        {req.status === "ISSUED" && (
                          <span
                            style={{
                              display: "inline-flex",
                              alignItems: "center",
                              gap: "4px",
                              fontSize: "11px",
                              fontWeight: 600,
                              background: "rgba(52, 199, 89, 0.12)",
                              color: "#28B94C",
                              padding: "3px 8px",
                              borderRadius: "12px",
                            }}
                          >
                            <Package size={11} /> Store Issued
                          </span>
                        )}
                        {req.status === "REJECTED" && (
                          <span
                            style={{
                              fontSize: "11px",
                              fontWeight: 600,
                              background: "rgba(255, 59, 48, 0.1)",
                              color: "#FF3B30",
                              padding: "3px 8px",
                              borderRadius: "12px",
                            }}
                          >
                            Rejected
                          </span>
                        )}
                      </td>
                      <td style={{ fontSize: "12px", color: "var(--color-text-tertiary)" }}>
                        {formatDate(req.date, "dd MMM, hh:mm a")}
                      </td>
                      <td style={{ textAlign: "right", paddingRight: "20px" }}>
                        <div style={{ display: "inline-flex", gap: "6px" }}>
                          {req.status === "PENDING_APPROVAL" && (
                            <>
                              <button
                                className="btn btn-primary btn-sm"
                                style={{ fontSize: "11px", padding: "4px 8px", borderRadius: "6px" }}
                                onClick={() => {
                                  updateRequisitionStatus(req.id, "APPROVED");
                                  showToast(`✅ Approved Requisition ${req.reqNumber}`);
                                }}
                              >
                                Approve
                              </button>
                              <button
                                className="btn btn-ghost btn-sm"
                                style={{ fontSize: "11px", padding: "4px 8px", borderRadius: "6px" }}
                                onClick={() => {
                                  updateRequisitionStatus(req.id, "REJECTED");
                                  showToast(`❌ Rejected Requisition ${req.reqNumber}`);
                                }}
                              >
                                Reject
                              </button>
                            </>
                          )}
                          {req.status === "APPROVED" && (
                            <button
                              className="btn btn-success btn-sm"
                              style={{ fontSize: "11px", padding: "4px 8px", borderRadius: "6px" }}
                              onClick={() => {
                                updateRequisitionStatus(req.id, "ISSUED");
                                showToast(`📦 Issued ${req.item} to ${req.department}`);
                              }}
                            >
                              <Package size={12} /> Issue to Dept
                            </button>
                          )}
                          {req.status === "ISSUED" && (
                            <span className="text-xs text-success" style={{ fontWeight: 600, display: "flex", alignItems: "center", gap: "4px" }}>
                              <Check size={12} /> Fulfilled
                            </span>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ─── TAB 3: Low Stock & Reordering ─── */}
      {activeTab === "low_stock" && (
        <div>
          {lowStockItems.length === 0 ? (
            <div
              className="card"
              style={{
                padding: "48px 24px",
                textAlign: "center",
                borderRadius: "14px",
                border: "1px solid var(--color-border)",
              }}
            >
              <div
                style={{
                  width: "56px",
                  height: "56px",
                  borderRadius: "50%",
                  background: "rgba(52, 199, 89, 0.12)",
                  color: "#34C759",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  margin: "0 auto 14px auto",
                }}
              >
                <CheckCircle size={28} />
              </div>
              <h3 style={{ fontSize: "17px", fontWeight: 700 }}>Zero Stock Shortfalls</h3>
              <p className="text-xs text-secondary" style={{ marginTop: "4px" }}>
                All {inventoryItems.length} SKUs across Hotel Shemron departments are above minimum safety thresholds.
              </p>
            </div>
          ) : (
            <div
              className="card"
              style={{
                padding: 0,
                borderRadius: "14px",
                overflow: "hidden",
                border: "1px solid rgba(255, 59, 48, 0.3)",
                background: "var(--color-bg-elevated, #fff)",
              }}
            >
              <div
                style={{
                  padding: "16px 20px",
                  borderBottom: "1px solid var(--color-border)",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  background: "rgba(255, 59, 48, 0.04)",
                }}
              >
                <div>
                  <h3 style={{ fontSize: "15px", fontWeight: 700, color: "var(--red-600)", display: "flex", alignItems: "center", gap: "8px" }}>
                    <ShieldAlert size={17} /> Urgent Vendor Restock ({lowStockItems.length} SKUs Breached)
                  </h3>
                  <p className="text-xs text-secondary" style={{ marginTop: "2px" }}>
                    These essential items are depleted and require immediate procurement orders.
                  </p>
                </div>
              </div>

              <div className="data-table-wrapper">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th style={{ paddingLeft: "20px" }}>SKU Code</th>
                      <th>Item Name</th>
                      <th>Department</th>
                      <th>Current In-Stock</th>
                      <th>Safety Threshold</th>
                      <th>Shortfall</th>
                      <th>Primary Vendor</th>
                      <th style={{ textAlign: "right", paddingRight: "20px" }}>Restock Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {lowStockItems.map((item) => {
                      const shortfall = Math.max(0, item.minThreshold - item.quantity);
                      return (
                        <tr key={item.id}>
                          <td style={{ paddingLeft: "20px", fontWeight: 700, fontFamily: "monospace", fontSize: "12px" }}>
                            {item.code}
                          </td>
                          <td style={{ fontWeight: 600, fontSize: "13px" }}>{item.name}</td>
                          <td>
                            <span className="badge badge-secondary" style={{ fontSize: "11px" }}>{item.department}</span>
                          </td>
                          <td>
                            <span style={{ fontWeight: 800, color: "var(--red-600)", fontSize: "14px" }}>
                              {item.quantity} {item.unit}
                            </span>
                          </td>
                          <td style={{ fontWeight: 600 }}>{item.minThreshold} {item.unit}</td>
                          <td>
                            <span
                              style={{
                                fontSize: "11px",
                                fontWeight: 700,
                                background: "#FF3B30",
                                color: "#fff",
                                padding: "2px 7px",
                                borderRadius: "6px",
                              }}
                            >
                              -{shortfall} {item.unit}
                            </span>
                          </td>
                          <td style={{ fontSize: "12px", color: "var(--color-text-secondary)" }}>{item.supplier}</td>
                          <td style={{ textAlign: "right", paddingRight: "20px" }}>
                            <button
                              className="btn btn-primary btn-sm"
                              style={{ fontSize: "12px", borderRadius: "6px" }}
                              onClick={() => handleOpenAdjustModal(item)}
                            >
                              <Plus size={13} /> Restock Now
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ─── TAB 4: Vendors & Suppliers ─── */}
      {activeTab === "suppliers" && (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))",
            gap: "16px",
          }}
        >
          {Object.entries(suppliersMap).map(([supplierName, sup]) => (
            <div
              key={supplierName}
              className="card"
              style={{
                padding: "18px 20px",
                borderRadius: "14px",
                border: "1px solid var(--color-border)",
                background: "var(--color-bg-elevated, #fff)",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "10px" }}>
                <div>
                  <h3 style={{ fontSize: "15px", fontWeight: 700, margin: 0 }}>{supplierName}</h3>
                  <span
                    style={{
                      display: "inline-block",
                      fontSize: "11px",
                      fontWeight: 600,
                      color: "#0071E3",
                      background: "rgba(0, 113, 227, 0.08)",
                      padding: "2px 7px",
                      borderRadius: "6px",
                      marginTop: "4px",
                    }}
                  >
                    {sup.category}
                  </span>
                </div>
                <span
                  style={{
                    fontSize: "11px",
                    fontWeight: 700,
                    color: "#34C759",
                    background: "rgba(52, 199, 89, 0.12)",
                    padding: "2px 6px",
                    borderRadius: "6px",
                  }}
                >
                  ★ {sup.rating}
                </span>
              </div>

              <div style={{ fontSize: "12px", color: "var(--color-text-secondary)", marginBottom: "12px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                  <Phone size={12} className="text-tertiary" />
                  <strong>Contact:</strong> {sup.contact}
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "6px", marginTop: "4px" }}>
                  <Clock size={12} className="text-tertiary" />
                  <strong>Last Restock:</strong> {sup.lastDelivery}
                </div>
              </div>

              <div
                style={{
                  background: "rgba(0,0,0,0.03)",
                  padding: "10px 12px",
                  borderRadius: "8px",
                  marginBottom: "14px",
                }}
              >
                <span className="text-xs text-tertiary" style={{ display: "block", marginBottom: "4px" }}>
                  Hotel Contract SKUs:
                </span>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "4px" }}>
                  {sup.items.map((it, idx) => (
                    <span
                      key={idx}
                      style={{
                        fontSize: "11px",
                        background: "#fff",
                        padding: "2px 7px",
                        borderRadius: "4px",
                        border: "1px solid var(--color-border)",
                      }}
                    >
                      {it}
                    </span>
                  ))}
                </div>
              </div>

              <button
                className="btn btn-secondary btn-sm"
                style={{ width: "100%", justifyContent: "center", fontSize: "12px", borderRadius: "8px" }}
                onClick={() => {
                  setShowReqModal(true);
                  setReqItem(sup.items[0] || "");
                }}
              >
                <ShoppingCart size={13} /> Create Purchase Order
              </button>
            </div>
          ))}
        </div>
      )}

      {/* ─── MODAL 1: Item Inspector Drawer ─── */}
      {inspectingItem && (
        <div className="modal-backdrop" onClick={() => setInspectingItem(null)}>
          <div
            className="modal"
            style={{ maxWidth: "480px", borderRadius: "18px" }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header" style={{ borderBottom: "1px solid var(--color-border)" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <div
                  style={{
                    width: "36px",
                    height: "36px",
                    borderRadius: "10px",
                    background: "rgba(0, 113, 227, 0.1)",
                    color: "#0071E3",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Package size={18} />
                </div>
                <div>
                  <h3 className="modal-title" style={{ fontSize: "16px", fontWeight: 700 }}>
                    {inspectingItem.name}
                  </h3>
                  <span className="text-xs text-secondary">
                    SKU Code: <code className="mono">{inspectingItem.code}</code>
                  </span>
                </div>
              </div>
              <button className="btn btn-ghost btn-icon btn-sm" onClick={() => setInspectingItem(null)}>
                <X size={16} />
              </button>
            </div>

            <div className="modal-body" style={{ padding: "20px" }}>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: "12px",
                  marginBottom: "16px",
                }}
              >
                <div style={{ background: "rgba(0,0,0,0.03)", padding: "12px", borderRadius: "10px" }}>
                  <span className="text-xs text-tertiary">Current In-Stock</span>
                  <div style={{ fontSize: "20px", fontWeight: 700, marginTop: "2px", color: inspectingItem.quantity <= inspectingItem.minThreshold ? "var(--red-600)" : "inherit" }}>
                    {inspectingItem.quantity} {inspectingItem.unit}
                  </div>
                </div>
                <div style={{ background: "rgba(0,0,0,0.03)", padding: "12px", borderRadius: "10px" }}>
                  <span className="text-xs text-tertiary">Safety Threshold</span>
                  <div style={{ fontSize: "20px", fontWeight: 700, marginTop: "2px" }}>
                    {inspectingItem.minThreshold} {inspectingItem.unit}
                  </div>
                </div>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "10px", fontSize: "13px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: "1px solid var(--color-border-light)" }}>
                  <span className="text-secondary">Department</span>
                  <strong>{inspectingItem.department}</strong>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: "1px solid var(--color-border-light)" }}>
                  <span className="text-secondary">Unit Cost</span>
                  <strong>{formatCurrency(inspectingItem.unitPrice)}</strong>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: "1px solid var(--color-border-light)" }}>
                  <span className="text-secondary">Total Inventory Valuation</span>
                  <strong className="text-primary">{formatCurrency(inspectingItem.quantity * inspectingItem.unitPrice)}</strong>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: "1px solid var(--color-border-light)" }}>
                  <span className="text-secondary">Storage Shelf Location</span>
                  <strong>{inspectingItem.location}</strong>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", padding: "8px 0" }}>
                  <span className="text-secondary">Contract Vendor</span>
                  <strong>{inspectingItem.supplier}</strong>
                </div>
              </div>
            </div>

            <div className="modal-footer" style={{ display: "flex", gap: "10px", justifyContent: "flex-end" }}>
              <button
                className="btn btn-secondary"
                style={{ borderRadius: "8px" }}
                onClick={() => {
                  const it = inspectingItem;
                  setInspectingItem(null);
                  handleOpenAdjustModal(it);
                }}
              >
                <SlidersHorizontal size={14} /> Quick Adjust
              </button>
              <button
                className="btn btn-primary"
                style={{ borderRadius: "8px" }}
                onClick={() => setInspectingItem(null)}
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── MODAL 2: Add New Stock Item ─── */}
      {showAddItemModal && (
        <div className="modal-backdrop" onClick={() => setShowAddItemModal(false)}>
          <div
            className="modal"
            style={{ maxWidth: "540px", borderRadius: "18px" }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header">
              <h3 className="modal-title" style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "17px", fontWeight: 700 }}>
                <Plus className="text-primary" size={18} />
                Add New Inventory SKU
              </h3>
              <button className="btn btn-ghost btn-icon btn-sm" onClick={() => setShowAddItemModal(false)}>
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleCreateNewItem}>
              <div className="modal-body" style={{ padding: "20px" }}>
                <div className="form-row" style={{ gridTemplateColumns: "1fr 1fr", gap: "14px", marginBottom: "14px" }}>
                  <div className="form-group">
                    <label className="form-label" style={{ fontSize: "12px", fontWeight: 600 }}>SKU Code *</label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="e.g. HK-LIN-005"
                      value={newItemCode}
                      onChange={(e) => setNewItemCode(e.target.value)}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label" style={{ fontSize: "12px", fontWeight: 600 }}>Department *</label>
                    <select
                      className="form-select"
                      value={newItemCategory}
                      onChange={(e) => {
                        const cat = e.target.value as any;
                        setNewItemCategory(cat);
                        if (cat === "HOUSEKEEPING") setNewItemDepartment("Housekeeping");
                        else if (cat === "FNB_KITCHEN") setNewItemDepartment("Restaurant Kitchen");
                        else if (cat === "FRONT_OFFICE") setNewItemDepartment("Front Desk");
                        else if (cat === "ENGINEERING") setNewItemDepartment("Maintenance");
                      }}
                    >
                      <option value="HOUSEKEEPING">Housekeeping</option>
                      <option value="FNB_KITCHEN">Restaurant Kitchen</option>
                      <option value="AMENITIES">Guest Room Amenities</option>
                      <option value="FRONT_OFFICE">Front Desk</option>
                      <option value="ENGINEERING">Maintenance & Engineering</option>
                    </select>
                  </div>
                </div>

                <div className="form-group" style={{ marginBottom: "14px" }}>
                  <label className="form-label" style={{ fontSize: "12px", fontWeight: 600 }}>Item Name & Description *</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="e.g. Luxury Velvet Cushion Covers"
                    value={newItemName}
                    onChange={(e) => setNewItemName(e.target.value)}
                    required
                  />
                </div>

                <div className="form-row" style={{ gridTemplateColumns: "1fr 1fr 1fr", gap: "12px", marginBottom: "14px" }}>
                  <div className="form-group">
                    <label className="form-label" style={{ fontSize: "12px", fontWeight: 600 }}>Initial Qty *</label>
                    <input
                      type="number"
                      className="form-input"
                      value={newItemQuantity}
                      onChange={(e) => setNewItemQuantity(Number(e.target.value))}
                      min={0}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label" style={{ fontSize: "12px", fontWeight: 600 }}>Unit *</label>
                    <select
                      className="form-select"
                      value={newItemUnit}
                      onChange={(e) => setNewItemUnit(e.target.value)}
                    >
                      <option value="Pcs">Pcs</option>
                      <option value="Kg">Kg</option>
                      <option value="Packs">Packs</option>
                      <option value="Bottles">Bottles</option>
                      <option value="Boxes">Boxes</option>
                      <option value="Cards">Cards</option>
                      <option value="Liters">Liters</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label" style={{ fontSize: "12px", fontWeight: 600 }}>Unit Cost (₹) *</label>
                    <input
                      type="number"
                      className="form-input"
                      value={newItemUnitPrice}
                      onChange={(e) => setNewItemUnitPrice(Number(e.target.value))}
                      min={0}
                      required
                    />
                  </div>
                </div>

                <div className="form-row" style={{ gridTemplateColumns: "1fr 1fr", gap: "14px", marginBottom: "14px" }}>
                  <div className="form-group">
                    <label className="form-label" style={{ fontSize: "12px", fontWeight: 600 }}>Min Safety Threshold *</label>
                    <input
                      type="number"
                      className="form-input"
                      value={newItemMinThreshold}
                      onChange={(e) => setNewItemMinThreshold(Number(e.target.value))}
                      min={1}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label" style={{ fontSize: "12px", fontWeight: 600 }}>Storage Shelf / Room</label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="e.g. Main Linen Shelf 4"
                      value={newItemLocation}
                      onChange={(e) => setNewItemLocation(e.target.value)}
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label" style={{ fontSize: "12px", fontWeight: 600 }}>Contract Vendor</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="e.g. Rajasthan Textile Mills"
                    value={newItemSupplier}
                    onChange={(e) => setNewItemSupplier(e.target.value)}
                  />
                </div>
              </div>

              <div className="modal-footer" style={{ display: "flex", gap: "10px", justifyContent: "flex-end" }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowAddItemModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Save Stock Item
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── MODAL 3: Quick Stock Adjustment ─── */}
      {showAdjustModal && selectedAdjustItem && (
        <div className="modal-backdrop" onClick={() => setShowAdjustModal(false)}>
          <div
            className="modal"
            style={{ maxWidth: "460px", borderRadius: "18px" }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header">
              <h3 className="modal-title" style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "16px", fontWeight: 700 }}>
                <SlidersHorizontal className="text-primary" size={17} />
                Stock Level Adjustment
              </h3>
              <button className="btn btn-ghost btn-icon btn-sm" onClick={() => setShowAdjustModal(false)}>
                <X size={16} />
              </button>
            </div>

            <div className="modal-body" style={{ padding: "20px" }}>
              <div style={{ background: "rgba(0,0,0,0.03)", padding: "12px 14px", borderRadius: "10px", marginBottom: "16px" }}>
                <div style={{ fontWeight: 700, fontSize: "14px" }}>{selectedAdjustItem.name}</div>
                <div className="text-xs text-secondary" style={{ marginTop: "2px" }}>
                  SKU: <code className="mono">{selectedAdjustItem.code}</code> • Current In-Stock: <strong>{selectedAdjustItem.quantity} {selectedAdjustItem.unit}</strong>
                </div>
              </div>

              <div className="form-group" style={{ marginBottom: "16px" }}>
                <label className="form-label" style={{ fontSize: "12px", fontWeight: 600 }}>Action Type</label>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
                  <button
                    type="button"
                    style={{
                      padding: "8px",
                      borderRadius: "8px",
                      fontSize: "12px",
                      fontWeight: 600,
                      cursor: "pointer",
                      border: adjustType === "IN" ? "1px solid #34C759" : "1px solid var(--color-border)",
                      background: adjustType === "IN" ? "rgba(52, 199, 89, 0.1)" : "transparent",
                      color: adjustType === "IN" ? "#28B94C" : "inherit",
                    }}
                    onClick={() => {
                      setAdjustType("IN");
                      setAdjustReason("Purchase Delivery & Restock");
                    }}
                  >
                    + Stock In (Add)
                  </button>
                  <button
                    type="button"
                    style={{
                      padding: "8px",
                      borderRadius: "8px",
                      fontSize: "12px",
                      fontWeight: 600,
                      cursor: "pointer",
                      border: adjustType === "OUT" ? "1px solid #FF3B30" : "1px solid var(--color-border)",
                      background: adjustType === "OUT" ? "rgba(255, 59, 48, 0.1)" : "transparent",
                      color: adjustType === "OUT" ? "#FF3B30" : "inherit",
                    }}
                    onClick={() => {
                      setAdjustType("OUT");
                      setAdjustReason("Department Store Issue");
                    }}
                  >
                    - Stock Out (Deduct)
                  </button>
                </div>
              </div>

              <div className="form-group" style={{ marginBottom: "14px" }}>
                <label className="form-label" style={{ fontSize: "12px", fontWeight: 600 }}>
                  Quantity ({selectedAdjustItem.unit})
                </label>
                <input
                  type="number"
                  className="form-input"
                  value={adjustQty}
                  onChange={(e) => setAdjustQty(Math.max(1, Number(e.target.value)))}
                  min={1}
                />
              </div>

              <div className="form-group">
                <label className="form-label" style={{ fontSize: "12px", fontWeight: 600 }}>Audit Reason / Reference</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. Vendor delivery, Room issue, Audit correction"
                  value={adjustReason}
                  onChange={(e) => setAdjustReason(e.target.value)}
                />
              </div>
            </div>

            <div className="modal-footer" style={{ display: "flex", gap: "10px", justifyContent: "flex-end" }}>
              <button className="btn btn-secondary" onClick={() => setShowAdjustModal(false)}>
                Cancel
              </button>
              <button className="btn btn-primary" onClick={handleExecuteAdjustment}>
                Confirm Adjustment
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── MODAL 4: Material Requisition ─── */}
      {showReqModal && (
        <div className="modal-backdrop" onClick={() => setShowReqModal(false)}>
          <div
            className="modal"
            style={{ maxWidth: "480px", borderRadius: "18px" }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header">
              <h3 className="modal-title" style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "16px", fontWeight: 700 }}>
                <ShoppingCart className="text-primary" size={17} />
                Create Material Requisition
              </h3>
              <button className="btn btn-ghost btn-icon btn-sm" onClick={() => setShowReqModal(false)}>
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleCreateRequisition}>
              <div className="modal-body" style={{ padding: "20px" }}>
                <div className="form-group" style={{ marginBottom: "14px" }}>
                  <label className="form-label" style={{ fontSize: "12px", fontWeight: 600 }}>Requesting Department *</label>
                  <select
                    className="form-select"
                    value={reqDept}
                    onChange={(e) => setReqDept(e.target.value)}
                  >
                    <option value="Housekeeping">Housekeeping</option>
                    <option value="Restaurant Kitchen">Restaurant Kitchen</option>
                    <option value="Front Desk">Front Desk</option>
                    <option value="Maintenance">Engineering & Maintenance</option>
                  </select>
                </div>

                <div className="form-group" style={{ marginBottom: "14px" }}>
                  <label className="form-label" style={{ fontSize: "12px", fontWeight: 600 }}>Stock Item *</label>
                  <select
                    className="form-select"
                    value={reqItem}
                    onChange={(e) => {
                      setReqItem(e.target.value);
                      const match = inventoryItems.find((i) => i.name === e.target.value);
                      if (match) setReqUnit(match.unit);
                    }}
                  >
                    <option value="">-- Select Store Item --</option>
                    {inventoryItems.map((item) => (
                      <option key={item.id} value={item.name}>
                        {item.name} ({item.code}) — In-Stock: {item.quantity} {item.unit}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-row" style={{ gridTemplateColumns: "1fr 1fr", gap: "14px" }}>
                  <div className="form-group">
                    <label className="form-label" style={{ fontSize: "12px", fontWeight: 600 }}>Quantity Needed *</label>
                    <input
                      type="number"
                      className="form-input"
                      value={reqQty}
                      onChange={(e) => setReqQty(Number(e.target.value))}
                      min={1}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label" style={{ fontSize: "12px", fontWeight: 600 }}>Priority *</label>
                    <select
                      className="form-select"
                      value={reqPriority}
                      onChange={(e) => setReqPriority(e.target.value as any)}
                    >
                      <option value="NORMAL">Normal Requirement</option>
                      <option value="URGENT">Urgent Stock Out</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="modal-footer" style={{ display: "flex", gap: "10px", justifyContent: "flex-end" }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowReqModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Submit Requisition
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
