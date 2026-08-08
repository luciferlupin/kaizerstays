"use client";

import { useState } from "react";
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
  Building,
  UserCheck,
} from "lucide-react";

interface InventoryItem {
  id: string;
  code: string;
  name: string;
  category: "HOUSEKEEPING" | "FNB_KITCHEN" | "FRONT_OFFICE" | "ENGINEERING";
  department: string;
  quantity: number;
  unit: string;
  minThreshold: number;
  unitPrice: number;
  location: string;
  supplier: string;
}

interface RequisitionOrder {
  id: string;
  reqNumber: string;
  department: string;
  requestedBy: string;
  item: string;
  quantity: number;
  unit: string;
  priority: "NORMAL" | "URGENT";
  status: "PENDING_APPROVAL" | "APPROVED" | "ISSUED" | "REJECTED";
  date: Date;
}

export default function InventoryClient() {
  const [activeTab, setActiveTab] = useState<"stock" | "requisitions" | "orders">("stock");
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("ALL");
  const [showReqModal, setShowReqModal] = useState(false);

  // Stock Items Data
  const [inventoryItems, setInventoryItems] = useState<InventoryItem[]>([
    { id: "inv_101", code: "HK-LIN-001", name: "Premium King Bed Sheets", category: "HOUSEKEEPING", department: "Housekeeping", quantity: 18, unit: "Pcs", minThreshold: 30, unitPrice: 1200, location: "Main Linen Room", supplier: "Rajasthan Textile Mills" },
    { id: "inv_102", code: "HK-TOW-002", name: "Bath Towels 600 GSM", category: "HOUSEKEEPING", department: "Housekeeping", quantity: 45, unit: "Pcs", minThreshold: 40, unitPrice: 450, location: "Main Linen Room", supplier: "CleanPro Linens" },
    { id: "inv_103", code: "FB-DAI-001", name: "Amul Butter 500g", category: "FNB_KITCHEN", department: "Restaurant Kitchen", quantity: 24, unit: "Packs", minThreshold: 15, unitPrice: 275, location: "Cold Store #1", supplier: "Amul Dairy Neemrana" },
    { id: "inv_104", code: "FB-PNE-002", name: "Fresh Cottage Cheese (Paneer)", category: "FNB_KITCHEN", department: "Restaurant Kitchen", quantity: 8, unit: "Kg", minThreshold: 10, unitPrice: 340, location: "Cold Store #2", supplier: "Fresh Farms Dairy" },
    { id: "inv_105", code: "FO-KEY-001", name: "RFID Key Cards (Hotel Branded)", category: "FRONT_OFFICE", department: "Front Desk", quantity: 120, unit: "Cards", minThreshold: 50, unitPrice: 85, location: "Front Desk Store", supplier: "SmartCard Tech" },
    { id: "inv_106", code: "ENG-BUL-001", name: "LED Warm White Bulbs 9W", category: "ENGINEERING", department: "Maintenance", quantity: 12, unit: "Pcs", minThreshold: 20, unitPrice: 140, location: "Engineering Workshop", supplier: "Havells India" },
  ]);

  // Requisitions Data
  const [requisitions, setRequisitions] = useState<RequisitionOrder[]>([
    { id: "req_1", reqNumber: "MR-2026-0042", department: "Housekeeping", requestedBy: "Meena Manager", item: "Premium King Bed Sheets", quantity: 12, unit: "Pcs", priority: "URGENT", status: "PENDING_APPROVAL", date: new Date() },
    { id: "req_2", reqNumber: "MR-2026-0041", department: "Restaurant Kitchen", requestedBy: "Arun Chef", item: "Fresh Cottage Cheese (Paneer)", quantity: 5, unit: "Kg", priority: "NORMAL", status: "APPROVED", date: new Date(Date.now() - 3600000 * 4) },
    { id: "req_3", reqNumber: "MR-2026-0040", department: "Maintenance", requestedBy: "Ramu Tech", item: "LED Warm White Bulbs 9W", quantity: 10, unit: "Pcs", priority: "NORMAL", status: "ISSUED", date: new Date(Date.now() - 3600000 * 24) },
  ]);

  // New Requisition Form State
  const [reqDept, setReqDept] = useState("Housekeeping");
  const [reqItem, setReqItem] = useState("Premium King Bed Sheets");
  const [reqQty, setReqQty] = useState(10);
  const [reqPriority, setReqPriority] = useState<"NORMAL" | "URGENT">("NORMAL");

  const totalValuation = inventoryItems.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);
  const lowStockCount = inventoryItems.filter((i) => i.quantity <= i.minThreshold).length;

  const handleApproveReq = (id: string) => {
    setRequisitions((prev) =>
      prev.map((r) => (r.id === id ? { ...r, status: "APPROVED" } : r))
    );
  };

  const handleCreateRequisition = () => {
    if (!reqItem) return;
    const newReq: RequisitionOrder = {
      id: `req_${Date.now()}`,
      reqNumber: `MR-2026-00${Math.floor(43 + Math.random() * 50)}`,
      department: reqDept,
      requestedBy: "Ninaad Khera (GM)",
      item: reqItem,
      quantity: reqQty,
      unit: "Pcs",
      priority: reqPriority,
      status: "APPROVED",
      date: new Date(),
    };
    setRequisitions([newReq, ...requisitions]);
    setShowReqModal(false);
  };

  const exportStockReport = () => {
    const headers = "Item Code,Item Name,Category,Department,Quantity,Unit Price,Total Value,Location\n";
    const rows = inventoryItems
      .map(
        (i) =>
          `"${i.code}","${i.name}","${i.category}","${i.department}",${i.quantity},${i.unitPrice},${
            i.quantity * i.unitPrice
          },"${i.location}"`
      )
      .join("\n");
    const blob = new Blob([headers + rows], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `StaySphere_Inventory_Valuation_${formatDate(new Date(), "yyyy-MM-dd")}.csv`;
    a.click();
  };

  const filteredItems = inventoryItems.filter((item) => {
    if (categoryFilter !== "ALL" && item.category !== categoryFilter) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return (
        item.name.toLowerCase().includes(q) ||
        item.code.toLowerCase().includes(q) ||
        item.department.toLowerCase().includes(q)
      );
    }
    return true;
  });

  return (
    <div className="page-content">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Department Ordering & Inventory Requisition</h1>
          <p className="page-description">
            StayFlexi-grade inter-department stock requisitions, purchase orders, and live inventory valuation for Hotel Shemron.
          </p>
        </div>
        <div className="page-actions">
          <button className="btn btn-secondary" onClick={exportStockReport}>
            <Download size={16} /> Export Stock Valuation
          </button>
          <button className="btn btn-primary" onClick={() => setShowReqModal(true)}>
            <Plus size={16} /> New Material Requisition
          </button>
        </div>
      </div>

      {/* KPI Metrics */}
      <div className="stats-grid" style={{ marginBottom: "24px" }}>
        <div className="stat-card">
          <span className="stat-card-label">Total Inventory Valuation</span>
          <div className="stat-card-value text-primary">{formatCurrency(totalValuation)}</div>
          <span className="text-xs text-secondary" style={{ marginTop: "6px" }}>
            Across 4 hotel store departments
          </span>
        </div>

        <div className="stat-card">
          <span className="stat-card-label">Low Stock Alerts</span>
          <div className="stat-card-value text-danger">{lowStockCount} Items</div>
          <span className="text-xs text-secondary" style={{ marginTop: "6px" }}>
            Below min safety threshold
          </span>
        </div>

        <div className="stat-card">
          <span className="stat-card-label">Pending Requisitions</span>
          <div className="stat-card-value text-warning">
            {requisitions.filter((r) => r.status === "PENDING_APPROVAL").length} Orders
          </div>
          <span className="text-xs text-secondary" style={{ marginTop: "6px" }}>
            Awaiting Owner / GM approval
          </span>
        </div>

        <div className="stat-card">
          <span className="stat-card-label">Store Fulfillments</span>
          <div className="stat-card-value text-success">
            {requisitions.filter((r) => r.status === "ISSUED").length} Completed
          </div>
          <span className="text-xs text-secondary" style={{ marginTop: "6px" }}>
            Issued to department stores
          </span>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="card" style={{ padding: "16px 20px", marginBottom: "20px" }}>
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
              <ShoppingCart size={16} /> Material Requisitions ({requisitions.length})
            </button>
          </div>

          {activeTab === "stock" && (
            <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
              <div className="search-input-wrapper" style={{ width: "200px" }}>
                <Search size={14} color="var(--color-text-tertiary)" />
                <input
                  type="text"
                  className="form-input"
                  placeholder="Search item code, name..."
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
                <option value="FRONT_OFFICE">Front Office</option>
                <option value="ENGINEERING">Maintenance</option>
              </select>
            </div>
          )}
        </div>
      </div>

      {/* Stock Ledger View */}
      {activeTab === "stock" && (
        <div className="card" style={{ padding: 0 }}>
          <div className="data-table-wrapper">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Item Code</th>
                  <th>Item Description</th>
                  <th>Department</th>
                  <th>In-Stock Qty</th>
                  <th>Unit Price</th>
                  <th>Total Valuation</th>
                  <th>Storage Location</th>
                  <th>Stock Status</th>
                </tr>
              </thead>
              <tbody>
                {filteredItems.map((item) => {
                  const isLow = item.quantity <= item.minThreshold;
                  return (
                    <tr key={item.id}>
                      <td style={{ fontWeight: 700, fontFamily: "monospace" }}>{item.code}</td>
                      <td style={{ fontWeight: 600 }}>{item.name}</td>
                      <td>
                        <span className="badge badge-secondary">{item.department}</span>
                      </td>
                      <td>
                        <span style={{ fontWeight: 800, fontSize: "15px", color: isLow ? "var(--red-600)" : "inherit" }}>
                          {item.quantity} {item.unit}
                        </span>
                      </td>
                      <td>{formatCurrency(item.unitPrice)}</td>
                      <td style={{ fontWeight: 700 }}>{formatCurrency(item.quantity * item.unitPrice)}</td>
                      <td className="text-secondary">{item.location}</td>
                      <td>
                        {isLow ? (
                          <span className="badge badge-danger">
                            <AlertTriangle size={12} /> Low Stock (Min: {item.minThreshold})
                          </span>
                        ) : (
                          <span className="badge badge-success">
                            <CheckCircle2 size={12} /> Optimal Stock
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Material Requisitions View */}
      {activeTab === "requisitions" && (
        <div className="card" style={{ padding: 0 }}>
          <div className="data-table-wrapper">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Requisition #</th>
                  <th>Department</th>
                  <th>Requested By</th>
                  <th>Item Description</th>
                  <th>Quantity</th>
                  <th>Priority</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {requisitions.map((req) => (
                  <tr key={req.id}>
                    <td style={{ fontWeight: 700, fontFamily: "monospace" }}>{req.reqNumber}</td>
                    <td style={{ fontWeight: 600 }}>{req.department}</td>
                    <td>{req.requestedBy}</td>
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
                        <span className="badge badge-warning">
                          <Clock size={12} /> Awaiting Approval
                        </span>
                      )}
                      {req.status === "APPROVED" && (
                        <span className="badge badge-primary">
                          <CheckCircle2 size={12} /> Approved by GM
                        </span>
                      )}
                      {req.status === "ISSUED" && (
                        <span className="badge badge-success">
                          <Package size={12} /> Issued to Department
                        </span>
                      )}
                    </td>
                    <td>
                      {req.status === "PENDING_APPROVAL" && (
                        <button
                          className="btn btn-primary btn-sm"
                          onClick={() => handleApproveReq(req.id)}
                        >
                          Approve Request
                        </button>
                      )}
                      {req.status === "APPROVED" && (
                        <span className="text-xs text-secondary">Ready for Issue</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* New Requisition Modal */}
      {showReqModal && (
        <div className="modal-backdrop" onClick={() => setShowReqModal(false)}>
          <div className="modal" style={{ maxWidth: "500px" }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Create Inter-Department Requisition</h3>
              <button className="btn btn-ghost btn-icon" onClick={() => setShowReqModal(false)}>✕</button>
            </div>
            <div className="modal-body">
              <div className="form-group" style={{ marginBottom: "16px" }}>
                <label className="form-label">Requesting Department</label>
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

              <div className="form-group" style={{ marginBottom: "16px" }}>
                <label className="form-label">Select Inventory Item</label>
                <select
                  className="form-select"
                  value={reqItem}
                  onChange={(e) => setReqItem(e.target.value)}
                >
                  {inventoryItems.map((item) => (
                    <option key={item.id} value={item.name}>
                      {item.name} ({item.code}) — Current: {item.quantity} {item.unit}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-row" style={{ gridTemplateColumns: "1fr 1fr", gap: "16px", marginBottom: "16px" }}>
                <div className="form-group">
                  <label className="form-label">Quantity Needed</label>
                  <input
                    type="number"
                    className="form-input"
                    value={reqQty}
                    onChange={(e) => setReqQty(Number(e.target.value))}
                    min={1}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Order Priority</label>
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
              <button className="btn btn-secondary" onClick={() => setShowReqModal(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={handleCreateRequisition}>Submit Requisition</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
