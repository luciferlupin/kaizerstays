"use client";

import { useState } from "react";
import { useAppState, StockInventoryItem, StockRequisition } from "@/context/AppStateContext";
import { formatCurrency, formatDate } from "@/lib/utils";
import {
  Boxes,
  Plus,
  Search,
  Filter,
  AlertTriangle,
  CheckCircle2,
  Clock,
  ArrowUpRight,
  Download,
  FileSpreadsheet,
  Package,
  ShoppingCart,
  Truck,
  TrendingDown,
  TrendingUp,
  Building,
  UserCheck,
  RotateCcw,
  Layers,
  ArrowDownRight,
  X,
  Sparkles,
  SlidersHorizontal,
  Check,
  ShieldAlert,
  Archive,
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
  const [categoryFilter, setCategoryFilter] = useState("ALL");
  const [toastMessage, setToastMessage] = useState<string | null>(null);

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
  const [newItemSupplier, setNewItemSupplier] = useState("Local Vendor Neemrana");

  // Stock Adjustment Form State
  const [adjustType, setAdjustType] = useState<"IN" | "OUT">("IN");
  const [adjustQty, setAdjustQty] = useState(10);
  const [adjustReason, setAdjustReason] = useState("New Purchase Delivery");

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

  // Metrics
  const totalValuation = inventoryItems.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);
  const lowStockItems = inventoryItems.filter((i) => i.quantity <= i.minThreshold);
  const lowStockCount = lowStockItems.length;
  const pendingRequisitions = requisitions.filter((r) => r.status === "PENDING_APPROVAL");

  // Suppliers Map
  const suppliersMap: Record<string, { category: string; items: string[]; contact: string; lastDelivery: string }> = {
    "Rajasthan Textile Mills": { category: "Linen & Bedding", items: ["Premium King Bed Sheets", "Bath Towels 600 GSM"], contact: "+91 98290 11223", lastDelivery: "3 days ago" },
    "CleanPro Linens": { category: "Linen Supplies", items: ["Bath Towels 600 GSM", "Hand Towels"], contact: "+91 98112 44332", lastDelivery: "Yesterday" },
    "Forest Essentials": { category: "Guest Toiletries", items: ["Luxury Guest Shampoo & Body Wash 50ml", "Handmade Soaps"], contact: "+91 98711 00998", lastDelivery: "5 days ago" },
    "Amul Dairy Neemrana": { category: "F&B Dairy", items: ["Amul Butter 500g", "Amul Fresh Cream", "Pasteurized Milk"], contact: "+91 94140 33221", lastDelivery: "Today, 06:00 AM" },
    "Fresh Farms Dairy": { category: "Fresh Perishables", items: ["Fresh Cottage Cheese (Paneer)", "Curd / Yogurt"], contact: "+91 99281 77665", lastDelivery: "Today, 07:30 AM" },
    "Tata Tea Supplies": { category: "F&B Dry Pantry", items: ["Premium Tea Leaves & Coffee Sachets", "Sugar Sachets"], contact: "+91 98100 55443", lastDelivery: "1 week ago" },
    "SmartCard Tech": { category: "Front Desk Hardware", items: ["RFID Key Cards (Hotel Branded)", "Key Envelopes"], contact: "+91 98990 44321", lastDelivery: "2 weeks ago" },
    "Havells India": { category: "Electrical & Spares", items: ["LED Warm White Bulbs 9W", "MCB Switches"], contact: "+91 97110 88776", lastDelivery: "4 days ago" },
    "Jaquar Supplies": { category: "Plumbing Fixtures", items: ["Faucet Aerators & Plumbing Washers", "Shower Heads"], contact: "+91 98292 66554", lastDelivery: "1 week ago" },
  };

  const handleOpenAdjustModal = (item: StockInventoryItem) => {
    setSelectedAdjustItem(item);
    setAdjustType("IN");
    setAdjustQty(10);
    setAdjustReason("Purchase Stock In");
    setShowAdjustModal(true);
  };

  const handleExecuteAdjustment = () => {
    if (!selectedAdjustItem || adjustQty <= 0) return;
    const finalQty = adjustType === "IN" ? adjustQty : -adjustQty;
    updateInventoryStock(selectedAdjustItem.id, finalQty, adjustReason);
    showToast(`✅ Stock updated for ${selectedAdjustItem.name}: ${adjustType === "IN" ? `+${adjustQty}` : `-${adjustQty}`} ${selectedAdjustItem.unit}`);
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

    showToast(`📦 Added ${newItemName} to Stock Inventory!`);
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
    showToast(`📋 Material Requisition for ${itemName} created!`);
    setShowReqModal(false);
  };

  const exportStockReport = () => {
    const headers = "Item Code,Item Name,Category,Department,Quantity,Unit,Unit Price,Total Value,Location,Supplier,Status\n";
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
    a.download = `StaySphere_Stock_Inventory_${formatDate(new Date(), "yyyy-MM-dd")}.csv`;
    a.click();
  };

  const filteredItems = inventoryItems.filter((item) => {
    if (categoryFilter !== "ALL" && item.category !== categoryFilter) return false;
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

  return (
    <div className="page-content">
      {/* Toast Notification */}
      {toastMessage && (
        <div
          style={{
            position: "fixed",
            bottom: "24px",
            right: "24px",
            background: "var(--color-bg-primary, #1c1c1e)",
            color: "#fff",
            padding: "14px 20px",
            borderRadius: "10px",
            boxShadow: "0 10px 30px rgba(0,0,0,0.3)",
            zIndex: 9999,
            display: "flex",
            alignItems: "center",
            gap: "10px",
            fontSize: "14px",
            border: "1px solid rgba(255,255,255,0.15)",
          }}
        >
          <Sparkles size={18} className="text-primary" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title" style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <Boxes size={26} className="text-primary" />
            Stock & Inventory Management
          </h1>
          <p className="page-description">
            Complete real-time stock ledger, valuation, inter-department requisitions, low-stock alerts, and store controls for <strong>Hotel Shemron</strong>.
          </p>
        </div>
        <div className="page-actions" style={{ gap: "10px" }}>
          <button className="btn btn-secondary" onClick={exportStockReport}>
            <Download size={16} /> Export Stock Valuation
          </button>
          <button className="btn btn-secondary" onClick={() => setShowReqModal(true)}>
            <ShoppingCart size={16} /> + New Requisition
          </button>
          <button
            className="btn btn-primary"
            style={{
              background: "linear-gradient(135deg, #0071E3 0%, #34C759 100%)",
              color: "#fff",
              fontWeight: 600,
              boxShadow: "0 4px 12px rgba(0, 113, 227, 0.3)",
            }}
            onClick={() => setShowAddItemModal(true)}
          >
            <Plus size={16} /> + Add Stock Item
          </button>
        </div>
      </div>

      {/* KPI Metrics */}
      <div className="stats-grid" style={{ marginBottom: "24px" }}>
        <div className="stat-card">
          <span className="stat-card-label">Total Stock Valuation</span>
          <div className="stat-card-value text-primary">{formatCurrency(totalValuation)}</div>
          <span className="text-xs text-secondary" style={{ marginTop: "6px" }}>
            Across {inventoryItems.length} active SKUs
          </span>
        </div>

        <div className="stat-card">
          <span className="stat-card-label">Low Stock Alerts</span>
          <div className="stat-card-value text-danger" style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            {lowStockCount} SKUs
            {lowStockCount > 0 && (
              <span className="badge badge-danger" style={{ fontSize: "11px" }}>Action Needed</span>
            )}
          </div>
          <span className="text-xs text-secondary" style={{ marginTop: "6px" }}>
            Below min safety threshold
          </span>
        </div>

        <div className="stat-card">
          <span className="stat-card-label">Pending Requisitions</span>
          <div className="stat-card-value text-warning">{pendingRequisitions.length} Requests</div>
          <span className="text-xs text-secondary" style={{ marginTop: "6px" }}>
            Awaiting GM / Owner approval
          </span>
        </div>

        <div className="stat-card">
          <span className="stat-card-label">Active Suppliers</span>
          <div className="stat-card-value text-success">{Object.keys(suppliersMap).length} Vendors</div>
          <span className="text-xs text-success" style={{ marginTop: "6px", display: "flex", alignItems: "center", gap: "4px" }}>
            <CheckCircle2 size={12} /> 100% Verified Partners
          </span>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="card" style={{ padding: "14px 20px", marginBottom: "20px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "12px" }}>
          <div className="tabs" style={{ margin: 0 }}>
            <button
              className={`tab ${activeTab === "stock" ? "active" : ""}`}
              onClick={() => setActiveTab("stock")}
            >
              <Boxes size={16} /> Stock Ledger ({inventoryItems.length})
            </button>
            <button
              className={`tab ${activeTab === "requisitions" ? "active" : ""}`}
              onClick={() => setActiveTab("requisitions")}
            >
              <ShoppingCart size={16} /> Requisitions ({requisitions.length})
            </button>
            <button
              className={`tab ${activeTab === "low_stock" ? "active" : ""}`}
              onClick={() => setActiveTab("low_stock")}
            >
              <AlertTriangle size={16} /> Low Stock Alerts ({lowStockCount})
            </button>
            <button
              className={`tab ${activeTab === "suppliers" ? "active" : ""}`}
              onClick={() => setActiveTab("suppliers")}
            >
              <Truck size={16} /> Suppliers & Vendors
            </button>
          </div>

          {(activeTab === "stock" || activeTab === "low_stock") && (
            <div style={{ display: "flex", gap: "12px", alignItems: "center", flexWrap: "wrap" }}>
              <div className="search-input-wrapper" style={{ width: "220px" }}>
                <Search size={14} color="var(--color-text-tertiary)" />
                <input
                  type="text"
                  className="form-input"
                  placeholder="Search SKU, name, vendor..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>

              <select
                className="form-select"
                style={{ width: "160px" }}
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
              >
                <option value="ALL">All Categories</option>
                <option value="HOUSEKEEPING">Housekeeping</option>
                <option value="FNB_KITCHEN">F&B Kitchen</option>
                <option value="AMENITIES">Guest Amenities</option>
                <option value="FRONT_OFFICE">Front Office</option>
                <option value="ENGINEERING">Maintenance & Eng.</option>
              </select>
            </div>
          )}
        </div>
      </div>

      {/* ─── TAB 1: Stock Inventory Ledger ─── */}
      {activeTab === "stock" && (
        <div className="card" style={{ padding: 0 }}>
          <div className="data-table-wrapper">
            <table className="data-table">
              <thead>
                <tr>
                  <th>SKU Code</th>
                  <th>Item Name & Description</th>
                  <th>Department / Category</th>
                  <th>In-Stock Quantity</th>
                  <th>Unit Cost</th>
                  <th>Total Valuation</th>
                  <th>Storage Location</th>
                  <th>Supplier</th>
                  <th>Status</th>
                  <th>Quick Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredItems.map((item) => {
                  const isLow = item.quantity <= item.minThreshold;
                  const stockHealthPct = Math.min(100, Math.round((item.quantity / (item.minThreshold * 2)) * 100));

                  return (
                    <tr key={item.id}>
                      <td style={{ fontWeight: 700, fontFamily: "monospace" }}>{item.code}</td>
                      <td>
                        <div style={{ fontWeight: 600 }}>{item.name}</div>
                        <div className="text-xs text-tertiary">Min Threshold: {item.minThreshold} {item.unit}</div>
                      </td>
                      <td>
                        <span className="badge badge-secondary" style={{ fontSize: "11px" }}>
                          {item.department}
                        </span>
                      </td>
                      <td>
                        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                          <span style={{ fontWeight: 800, fontSize: "15px", color: isLow ? "var(--red-600)" : "inherit" }}>
                            {item.quantity} {item.unit}
                          </span>
                        </div>
                        <div
                          style={{
                            width: "80px",
                            height: "4px",
                            background: "var(--color-border)",
                            borderRadius: "2px",
                            marginTop: "4px",
                            overflow: "hidden",
                          }}
                        >
                          <div
                            style={{
                              width: `${stockHealthPct}%`,
                              height: "100%",
                              background: isLow ? "var(--red-500, #ff3b30)" : "var(--green-500, #34c759)",
                            }}
                          />
                        </div>
                      </td>
                      <td className="mono">{formatCurrency(item.unitPrice)}</td>
                      <td className="mono font-bold text-primary">{formatCurrency(item.quantity * item.unitPrice)}</td>
                      <td className="text-secondary" style={{ fontSize: "13px" }}>{item.location}</td>
                      <td style={{ fontSize: "13px" }}>{item.supplier}</td>
                      <td>
                        {isLow ? (
                          <span className="badge badge-danger" style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                            <AlertTriangle size={12} /> Low Stock
                          </span>
                        ) : (
                          <span className="badge badge-success" style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                            <CheckCircle2 size={12} /> Optimal
                          </span>
                        )}
                      </td>
                      <td>
                        <div style={{ display: "flex", gap: "6px" }}>
                          <button
                            className="btn btn-secondary btn-sm"
                            style={{ padding: "4px 8px", fontSize: "12px" }}
                            title="Quick Stock Adjustment"
                            onClick={() => handleOpenAdjustModal(item)}
                          >
                            <SlidersHorizontal size={13} /> Adjust
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ─── TAB 2: Material Requisitions ─── */}
      {activeTab === "requisitions" && (
        <div className="card" style={{ padding: 0 }}>
          <div className="data-table-wrapper">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Requisition #</th>
                  <th>Department</th>
                  <th>Requested By</th>
                  <th>Item Requested</th>
                  <th>Quantity</th>
                  <th>Priority</th>
                  <th>Status</th>
                  <th>Date & Time</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {requisitions.length === 0 ? (
                  <tr>
                    <td colSpan={9} style={{ textAlign: "center", padding: "40px" }}>
                      <ShoppingCart size={36} className="text-tertiary" style={{ margin: "0 auto 12px auto" }} />
                      <h3 style={{ fontSize: "16px", fontWeight: 700 }}>No Material Requisitions</h3>
                      <p className="text-xs text-secondary" style={{ marginTop: "4px" }}>
                        Click &quot;+ New Requisition&quot; above to submit an inter-department stock order.
                      </p>
                    </td>
                  </tr>
                ) : (
                  requisitions.map((req) => (
                    <tr key={req.id}>
                      <td style={{ fontWeight: 700, fontFamily: "monospace" }}>{req.reqNumber}</td>
                      <td style={{ fontWeight: 600 }}>{req.department}</td>
                      <td style={{ fontSize: "13px" }}>{req.requestedBy}</td>
                      <td style={{ fontWeight: 600 }}>{req.item}</td>
                      <td style={{ fontWeight: 800 }}>{req.quantity} {req.unit}</td>
                      <td>
                        {req.priority === "URGENT" ? (
                          <span className="badge badge-danger">URGENT</span>
                        ) : (
                          <span className="badge badge-secondary">NORMAL</span>
                        )}
                      </td>
                      <td>
                        {req.status === "PENDING_APPROVAL" && (
                          <span className="badge badge-warning" style={{ gap: "4px" }}>
                            <Clock size={12} /> Awaiting Approval
                          </span>
                        )}
                        {req.status === "APPROVED" && (
                          <span className="badge badge-primary" style={{ gap: "4px" }}>
                            <CheckCircle2 size={12} /> Approved by GM
                          </span>
                        )}
                        {req.status === "ISSUED" && (
                          <span className="badge badge-success" style={{ gap: "4px" }}>
                            <Package size={12} /> Issued to Store
                          </span>
                        )}
                        {req.status === "REJECTED" && (
                          <span className="badge badge-danger">Rejected</span>
                        )}
                      </td>
                      <td style={{ fontSize: "12px" }} className="text-secondary">
                        {formatDate(req.date, "dd MMM yyyy, hh:mm a")}
                      </td>
                      <td>
                        <div style={{ display: "flex", gap: "6px" }}>
                          {req.status === "PENDING_APPROVAL" && (
                            <>
                              <button
                                className="btn btn-primary btn-sm"
                                style={{ fontSize: "11px", padding: "4px 8px" }}
                                onClick={() => {
                                  updateRequisitionStatus(req.id, "APPROVED");
                                  showToast(`✅ Approved Requisition ${req.reqNumber}`);
                                }}
                              >
                                Approve
                              </button>
                              <button
                                className="btn btn-secondary btn-sm"
                                style={{ fontSize: "11px", padding: "4px 8px" }}
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
                              style={{ fontSize: "11px", padding: "4px 8px" }}
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
                              <Check size={12} /> Completed
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
            <div className="card" style={{ padding: "48px 24px", textAlign: "center" }}>
              <CheckCircle2 size={44} className="text-success" style={{ margin: "0 auto 12px auto" }} />
              <h3 style={{ fontSize: "18px", fontWeight: 700 }}>All Stock Levels Optimal</h3>
              <p className="text-xs text-secondary" style={{ marginTop: "4px" }}>
                Zero SKUs are below safety threshold. All department inventories are sufficiently stocked.
              </p>
            </div>
          ) : (
            <div className="card" style={{ padding: 0 }}>
              <div className="card-header" style={{ padding: "16px 20px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <h3 style={{ fontSize: "16px", fontWeight: 700, color: "var(--red-600)", display: "flex", alignItems: "center", gap: "8px" }}>
                    <ShieldAlert size={18} /> Urgent Restock Alert ({lowStockItems.length} SKUs)
                  </h3>
                  <p className="text-xs text-secondary" style={{ marginTop: "2px" }}>
                    Items listed below have breached minimum safety levels and need vendor purchase orders immediately.
                  </p>
                </div>
              </div>
              <div className="data-table-wrapper">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>SKU Code</th>
                      <th>Item Name</th>
                      <th>Department</th>
                      <th>Current In-Stock</th>
                      <th>Min Safety Threshold</th>
                      <th>Shortfall</th>
                      <th>Supplier / Vendor</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {lowStockItems.map((item) => {
                      const shortfall = Math.max(0, item.minThreshold - item.quantity);
                      return (
                        <tr key={item.id}>
                          <td style={{ fontWeight: 700, fontFamily: "monospace" }}>{item.code}</td>
                          <td style={{ fontWeight: 600 }}>{item.name}</td>
                          <td><span className="badge badge-secondary">{item.department}</span></td>
                          <td>
                            <span style={{ fontWeight: 800, color: "var(--red-600)", fontSize: "15px" }}>
                              {item.quantity} {item.unit}
                            </span>
                          </td>
                          <td className="font-semibold">{item.minThreshold} {item.unit}</td>
                          <td>
                            <span className="badge badge-danger font-bold">
                              -{shortfall} {item.unit} Short
                            </span>
                          </td>
                          <td style={{ fontSize: "13px" }}>{item.supplier}</td>
                          <td>
                            <button
                              className="btn btn-primary btn-sm"
                              style={{ fontSize: "12px", gap: "6px" }}
                              onClick={() => handleOpenAdjustModal(item)}
                            >
                              <Plus size={13} /> Quick Restock
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

      {/* ─── TAB 4: Suppliers & Vendors ─── */}
      {activeTab === "suppliers" && (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))",
            gap: "20px",
          }}
        >
          {Object.entries(suppliersMap).map(([supplierName, sup]) => (
            <div key={supplierName} className="card" style={{ padding: "20px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "12px" }}>
                <div>
                  <h3 style={{ fontSize: "16px", fontWeight: 700, margin: 0 }}>{supplierName}</h3>
                  <span className="badge badge-secondary" style={{ marginTop: "6px", fontSize: "11px" }}>
                    {sup.category}
                  </span>
                </div>
                <span className="badge badge-success" style={{ fontSize: "11px" }}>Verified</span>
              </div>

              <div style={{ fontSize: "12px", color: "var(--color-text-secondary)", marginBottom: "12px" }}>
                <div><strong>Phone / Contact:</strong> {sup.contact}</div>
                <div style={{ marginTop: "3px" }}><strong>Last Delivery:</strong> {sup.lastDelivery}</div>
              </div>

              <div style={{ background: "var(--color-bg-tertiary)", padding: "10px", borderRadius: "8px", marginBottom: "14px" }}>
                <span className="text-xs text-tertiary" style={{ display: "block", marginBottom: "4px" }}>Supplied Hotel SKUs:</span>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
                  {sup.items.map((it, idx) => (
                    <span key={idx} style={{ fontSize: "11px", background: "var(--color-bg-primary)", padding: "2px 8px", borderRadius: "4px", border: "1px solid var(--color-border)" }}>
                      {it}
                    </span>
                  ))}
                </div>
              </div>

              <button
                className="btn btn-secondary btn-sm"
                style={{ width: "100%", justifyContent: "center", fontSize: "12px" }}
                onClick={() => {
                  setShowReqModal(true);
                  setReqItem(sup.items[0] || "");
                }}
              >
                <ShoppingCart size={13} /> Create Purchase Requisition
              </button>
            </div>
          ))}
        </div>
      )}

      {/* ─── MODAL 1: Add New Stock Item ─── */}
      {showAddItemModal && (
        <div className="modal-backdrop" onClick={() => setShowAddItemModal(false)}>
          <div className="modal" style={{ maxWidth: "560px" }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title" style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <Plus className="text-primary" size={20} />
                Add New Stock SKU
              </h3>
              <button className="btn btn-ghost btn-icon btn-sm" onClick={() => setShowAddItemModal(false)}>
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleCreateNewItem}>
              <div className="modal-body" style={{ padding: "20px" }}>
                <div className="form-row" style={{ gridTemplateColumns: "1fr 1fr", gap: "16px", marginBottom: "16px" }}>
                  <div className="form-group">
                    <label className="form-label">SKU / Item Code *</label>
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
                    <label className="form-label">Category *</label>
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
                      <option value="HOUSEKEEPING">Housekeeping Linen & Chemical</option>
                      <option value="FNB_KITCHEN">F&B Raw Materials & Kitchen</option>
                      <option value="AMENITIES">Guest Room Amenities</option>
                      <option value="FRONT_OFFICE">Front Office & Keycards</option>
                      <option value="ENGINEERING">Maintenance & Spares</option>
                    </select>
                  </div>
                </div>

                <div className="form-group" style={{ marginBottom: "16px" }}>
                  <label className="form-label">Item Name & Description *</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="e.g. Luxury Velvet Cushion Covers"
                    value={newItemName}
                    onChange={(e) => setNewItemName(e.target.value)}
                    required
                  />
                </div>

                <div className="form-row" style={{ gridTemplateColumns: "1fr 1fr 1fr", gap: "12px", marginBottom: "16px" }}>
                  <div className="form-group">
                    <label className="form-label">Initial Quantity *</label>
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
                    <label className="form-label">Unit of Measure *</label>
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
                    <label className="form-label">Unit Cost (₹) *</label>
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

                <div className="form-row" style={{ gridTemplateColumns: "1fr 1fr", gap: "16px", marginBottom: "16px" }}>
                  <div className="form-group">
                    <label className="form-label">Min Safety Threshold *</label>
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
                    <label className="form-label">Storage Location</label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="e.g. Main Store Shelf B"
                      value={newItemLocation}
                      onChange={(e) => setNewItemLocation(e.target.value)}
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Primary Vendor / Supplier</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="e.g. Rajasthan Textile Mills"
                    value={newItemSupplier}
                    onChange={(e) => setNewItemSupplier(e.target.value)}
                  />
                </div>
              </div>

              <div className="modal-footer" style={{ display: "flex", gap: "12px", justifyContent: "flex-end" }}>
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

      {/* ─── MODAL 2: Quick Stock Adjustment ─── */}
      {showAdjustModal && selectedAdjustItem && (
        <div className="modal-backdrop" onClick={() => setShowAdjustModal(false)}>
          <div className="modal" style={{ maxWidth: "480px" }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title" style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <SlidersHorizontal className="text-primary" size={18} />
                Quick Stock Adjustment
              </h3>
              <button className="btn btn-ghost btn-icon btn-sm" onClick={() => setShowAdjustModal(false)}>
                <X size={16} />
              </button>
            </div>

            <div className="modal-body" style={{ padding: "20px" }}>
              <div style={{ background: "var(--color-bg-tertiary)", padding: "12px", borderRadius: "8px", marginBottom: "16px" }}>
                <div style={{ fontWeight: 700, fontSize: "15px" }}>{selectedAdjustItem.name}</div>
                <div className="text-xs text-secondary" style={{ marginTop: "2px" }}>
                  SKU: <code className="mono">{selectedAdjustItem.code}</code> • Current In-Stock: <strong>{selectedAdjustItem.quantity} {selectedAdjustItem.unit}</strong>
                </div>
              </div>

              <div className="form-group" style={{ marginBottom: "16px" }}>
                <label className="form-label">Adjustment Type</label>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                  <button
                    type="button"
                    className={`btn ${adjustType === "IN" ? "btn-primary" : "btn-secondary"}`}
                    onClick={() => {
                      setAdjustType("IN");
                      setAdjustReason("Purchase Stock In");
                    }}
                    style={{ justifyContent: "center" }}
                  >
                    <Plus size={14} /> + Stock In (Add)
                  </button>
                  <button
                    type="button"
                    className={`btn ${adjustType === "OUT" ? "btn-primary" : "btn-secondary"}`}
                    onClick={() => {
                      setAdjustType("OUT");
                      setAdjustReason("Department Issue / Consumption");
                    }}
                    style={{ justifyContent: "center" }}
                  >
                    <TrendingDown size={14} /> - Stock Out (Deduct)
                  </button>
                </div>
              </div>

              <div className="form-group" style={{ marginBottom: "16px" }}>
                <label className="form-label">Quantity to {adjustType === "IN" ? "Add" : "Deduct"} ({selectedAdjustItem.unit})</label>
                <input
                  type="number"
                  className="form-input"
                  value={adjustQty}
                  onChange={(e) => setAdjustQty(Math.max(1, Number(e.target.value)))}
                  min={1}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Reason / Reference Note</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. Vendor delivery, Room damage, Count audit"
                  value={adjustReason}
                  onChange={(e) => setAdjustReason(e.target.value)}
                />
              </div>
            </div>

            <div className="modal-footer" style={{ display: "flex", gap: "12px", justifyContent: "flex-end" }}>
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

      {/* ─── MODAL 3: New Material Requisition ─── */}
      {showReqModal && (
        <div className="modal-backdrop" onClick={() => setShowReqModal(false)}>
          <div className="modal" style={{ maxWidth: "500px" }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title" style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <ShoppingCart className="text-primary" size={18} />
                Create Material Requisition
              </h3>
              <button className="btn btn-ghost btn-icon btn-sm" onClick={() => setShowReqModal(false)}>
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleCreateRequisition}>
              <div className="modal-body" style={{ padding: "20px" }}>
                <div className="form-group" style={{ marginBottom: "16px" }}>
                  <label className="form-label">Requesting Department *</label>
                  <select
                    className="form-select"
                    value={reqDept}
                    onChange={(e) => setReqDept(e.target.value)}
                  >
                    <option value="Housekeeping">Housekeeping</option>
                    <option value="Restaurant Kitchen">Restaurant Kitchen</option>
                    <option value="Front Desk">Front Desk</option>
                    <option value="Maintenance">Engineering & Maintenance</option>
                    <option value="F&B Service">F&B Service & Banquet</option>
                  </select>
                </div>

                <div className="form-group" style={{ marginBottom: "16px" }}>
                  <label className="form-label">Select Stock Item *</label>
                  <select
                    className="form-select"
                    value={reqItem}
                    onChange={(e) => {
                      setReqItem(e.target.value);
                      const match = inventoryItems.find((i) => i.name === e.target.value);
                      if (match) setReqUnit(match.unit);
                    }}
                  >
                    <option value="">-- Choose Stock Item --</option>
                    {inventoryItems.map((item) => (
                      <option key={item.id} value={item.name}>
                        {item.name} ({item.code}) — In-Stock: {item.quantity} {item.unit}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-row" style={{ gridTemplateColumns: "1fr 1fr", gap: "16px", marginBottom: "16px" }}>
                  <div className="form-group">
                    <label className="form-label">Quantity Needed *</label>
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
                    <label className="form-label">Priority *</label>
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

              <div className="modal-footer" style={{ display: "flex", gap: "12px", justifyContent: "flex-end" }}>
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
