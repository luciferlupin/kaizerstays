"use client";

import { useState } from "react";
import {
  menuItems,
  posTables,
  activeKOTs,
  menuCategories,
  posStats,
  MenuItem,
  POSTable,
  KitchenOrder,
} from "@/lib/pos-data";
import { demoReservations } from "@/lib/demo-data";
import { formatCurrency, formatDate } from "@/lib/utils";
import {
  Utensils,
  Plus,
  Search,
  ShoppingCart,
  CheckCircle2,
  Clock,
  QrCode,
  Hotel,
  CreditCard,
  X,
  Check,
  ChefHat,
  Filter,
  Send,
  Trash2,
} from "lucide-react";
import { useAppState } from "@/context/AppStateContext";

interface CartItem {
  menuItem: MenuItem;
  quantity: number;
  notes: string;
}

export default function POSClient() {
  const { reservations, addPOSOrder } = useAppState();
  const [activeTab, setActiveTab] = useState<"tables" | "menu" | "kots" | "qr">("tables");
  const [tables, setTables] = useState<POSTable[]>(posTables);
  const [kots, setKots] = useState<KitchenOrder[]>(activeKOTs);
  const [selectedTable, setSelectedTable] = useState<POSTable | null>(null);

  // Cart state
  const [cart, setCart] = useState<CartItem[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [vegOnly, setVegOnly] = useState(false);

  // Settlement modal state
  const [showBillModal, setShowBillModal] = useState(false);
  const [selectedRoomNumber, setSelectedRoomNumber] = useState<string>("301");
  const [paymentType, setPaymentType] = useState<"ROOM_FOLIO" | "UPI" | "CASH" | "CARD">("ROOM_FOLIO");
  const [orderBilled, setOrderBilled] = useState(false);

  // Filtered menu
  const filteredMenu = menuItems.filter((item) => {
    if (selectedCategory !== "ALL" && item.category !== selectedCategory) return false;
    if (vegOnly && !item.isVeg) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return item.name.toLowerCase().includes(q) || item.category.toLowerCase().includes(q);
    }
    return true;
  });

  const addToCart = (item: MenuItem) => {
    setCart((prev) => {
      const existing = prev.find((ci) => ci.menuItem.id === item.id);
      if (existing) {
        return prev.map((ci) =>
          ci.menuItem.id === item.id ? { ...ci, quantity: ci.quantity + 1 } : ci
        );
      }
      return [...prev, { menuItem: item, quantity: 1, notes: "" }];
    });
  };

  const updateQuantity = (itemId: string, delta: number) => {
    setCart((prev) =>
      prev
        .map((ci) => {
          if (ci.menuItem.id === itemId) {
            const newQty = ci.quantity + delta;
            return newQty > 0 ? { ...ci, quantity: newQty } : null;
          }
          return ci;
        })
        .filter(Boolean) as CartItem[]
    );
  };

  const cartSubtotal = cart.reduce((sum, ci) => sum + ci.menuItem.price * ci.quantity, 0);
  const cartGST = Math.round(cartSubtotal * 0.05); // 5% GST on F&B
  const cartTotal = cartSubtotal + cartGST;

  const handleSendToKitchen = () => {
    if (!selectedTable || cart.length === 0) return;

    const newKOT: KitchenOrder = {
      id: `kot_${Date.now()}`,
      kotNumber: `KOT-00${Math.floor(Math.random() * 90 + 10)}`,
      tableNumber: selectedTable.number,
      items: cart.map((ci) => ({
        menuItemId: ci.menuItem.id,
        name: ci.menuItem.name,
        quantity: ci.quantity,
        price: ci.menuItem.price,
        notes: ci.notes,
      })),
      status: "PREPARING",
      createdAt: new Date(),
      total: cartTotal,
      guestName: selectedTable.guestName,
      roomNumber: selectedTable.roomNumber,
      paymentMethod: null,
    };

    setKots([newKOT, ...kots]);
    setTables(
      tables.map((t) =>
        t.id === selectedTable.id ? { ...t, status: "OCCUPIED", currentOrderId: newKOT.id } : t
      )
    );
    setCart([]);
    alert(`KOT #${newKOT.kotNumber} sent to kitchen for Table ${selectedTable.number}!`);
  };

  const handleSettleOrder = () => {
    if (!selectedTable) return;
    const kotOrder: KitchenOrder = {
      id: `kot_${Date.now()}`,
      kotNumber: `KOT-00${Math.floor(Math.random() * 90 + 10)}`,
      tableNumber: selectedTable.number,
      items: cart.map((ci) => ({
        menuItemId: ci.menuItem.id,
        name: ci.menuItem.name,
        quantity: ci.quantity,
        price: ci.menuItem.price,
        notes: ci.notes,
      })),
      status: "BILLED",
      createdAt: new Date(),
      total: cartTotal,
      guestName: selectedTable.guestName,
      roomNumber: paymentType === "ROOM_FOLIO" ? selectedRoomNumber : null,
      paymentMethod: paymentType,
    };

    addPOSOrder(kotOrder, paymentType === "ROOM_FOLIO" ? selectedRoomNumber : undefined);

    setOrderBilled(true);
    setTimeout(() => {
      setTables(
        tables.map((t) =>
          t.id === selectedTable.id
            ? { ...t, status: "AVAILABLE", currentOrderId: null, guestName: null, roomNumber: null }
            : t
        )
      );
      setShowBillModal(false);
      setOrderBilled(false);
      setSelectedTable(null);
      setCart([]);
    }, 1500);
  };

  const advanceKOTStatus = (kotId: string) => {
    setKots((prev) =>
      prev.map((k) => {
        if (k.id !== kotId) return k;
        const statusMap: Record<string, KitchenOrder["status"]> = {
          PENDING: "PREPARING",
          PREPARING: "READY",
          READY: "SERVED",
          SERVED: "BILLED",
        };
        return { ...k, status: statusMap[k.status] || "SERVED" };
      })
    );
  };

  return (
    <div className="page-content">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title" style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <Utensils size={24} className="text-primary" />
            Restaurant POS & F&B Management
          </h1>
          <p className="page-description">
            Manage restaurant tables, kitchen orders (KOT), menu prices, and room folio posting for Hotel Shemron.
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="stats-grid">
        <div className="stat-card">
          <span className="stat-card-label">Today's Restaurant Sales</span>
          <div className="stat-card-value text-primary">{formatCurrency(posStats.todayRevenue)}</div>
        </div>

        <div className="stat-card">
          <span className="stat-card-label">Orders Settled</span>
          <div className="stat-card-value">{posStats.ordersToday}</div>
        </div>

        <div className="stat-card">
          <span className="stat-card-label">Avg Order Value</span>
          <div className="stat-card-value text-success">{formatCurrency(posStats.avgOrderValue)}</div>
        </div>

        <div className="stat-card">
          <span className="stat-card-label">Active KOT Queue</span>
          <div className="stat-card-value text-warning">{kots.length}</div>
        </div>
      </div>

      {/* Tabs */}
      <div className="tabs">
        <button
          className={`tab ${activeTab === "tables" ? "active" : ""}`}
          onClick={() => setActiveTab("tables")}
        >
          Tables & Billing
        </button>
        <button
          className={`tab ${activeTab === "menu" ? "active" : ""}`}
          onClick={() => setActiveTab("menu")}
        >
          Menu & Catalog ({menuItems.length})
        </button>
        <button
          className={`tab ${activeTab === "kots" ? "active" : ""}`}
          onClick={() => setActiveTab("kots")}
        >
          Live Kitchen Queue ({kots.length})
        </button>
        <button
          className={`tab ${activeTab === "qr" ? "active" : ""}`}
          onClick={() => setActiveTab("qr")}
        >
          QR Dining Code
        </button>
      </div>

      {/* TAB 1: TABLES & BILLING */}
      {activeTab === "tables" && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 380px", gap: "20px" }}>
          {/* Table Map */}
          <div>
            <div className="card" style={{ padding: "20px", marginBottom: "20px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
                <h3 style={{ fontSize: "16px", fontWeight: 700 }}>Restaurant Floor Plan</h3>
                <div style={{ display: "flex", gap: "12px", fontSize: "12px" }}>
                  <span style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                    <span style={{ width: "10px", height: "10px", borderRadius: "50%", background: "var(--green-500)" }} /> Available
                  </span>
                  <span style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                    <span style={{ width: "10px", height: "10px", borderRadius: "50%", background: "var(--color-primary)" }} /> Occupied
                  </span>
                  <span style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                    <span style={{ width: "10px", height: "10px", borderRadius: "50%", background: "var(--color-warning)" }} /> Reserved
                  </span>
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(130px, 1fr))", gap: "12px" }}>
                {tables.map((t) => (
                  <div
                    key={t.id}
                    onClick={() => setSelectedTable(t)}
                    style={{
                      padding: "16px",
                      borderRadius: "var(--radius-lg)",
                      textAlign: "center",
                      cursor: "pointer",
                      border: selectedTable?.id === t.id ? "2px solid var(--color-primary)" : "1px solid var(--color-border)",
                      background:
                        t.status === "AVAILABLE"
                          ? "var(--green-50)"
                          : t.status === "OCCUPIED"
                          ? "var(--color-primary-light)"
                          : "var(--amber-50)",
                      transition: "all 0.2s ease",
                    }}
                  >
                    <div style={{ fontSize: "18px", fontWeight: 800 }}>Table {t.number}</div>
                    <div className="text-xs text-secondary" style={{ margin: "4px 0" }}>
                      {t.seats} Seats • {t.location}
                    </div>
                    <span
                      className={`badge ${
                        t.status === "AVAILABLE"
                          ? "badge-success"
                          : t.status === "OCCUPIED"
                          ? "badge-primary"
                          : "badge-warning"
                      }`}
                      style={{ fontSize: "10px" }}
                    >
                      {t.status}
                    </span>
                    {t.roomNumber && (
                      <div className="text-xs font-semibold text-primary" style={{ marginTop: "4px" }}>
                        Room #{t.roomNumber}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Menu Items Picker when a table is selected */}
            {selectedTable && (
              <div className="card" style={{ padding: "20px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
                  <h3 style={{ fontSize: "16px", fontWeight: 700 }}>
                    Select Items for Table {selectedTable.number}
                  </h3>
                  <div style={{ display: "flex", gap: "8px" }}>
                    <div className="search-input-wrapper" style={{ width: "200px" }}>
                      <Search className="search-icon" size={14} />
                      <input
                        type="text"
                        className="form-input"
                        placeholder="Search menu..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                      />
                    </div>
                  </div>
                </div>

                {/* Category Pills */}
                <div style={{ display: "flex", gap: "8px", overflowX: "auto", paddingBottom: "8px", marginBottom: "16px" }}>
                  <button
                    className={`btn btn-sm ${selectedCategory === "ALL" ? "btn-primary" : "btn-secondary"}`}
                    onClick={() => setSelectedCategory("ALL")}
                  >
                    All Items
                  </button>
                  {menuCategories.map((cat) => (
                    <button
                      key={cat.id}
                      className={`btn btn-sm ${selectedCategory === cat.id ? "btn-primary" : "btn-secondary"}`}
                      onClick={() => setSelectedCategory(cat.id)}
                    >
                      {cat.emoji} {cat.label}
                    </button>
                  ))}
                </div>

                {/* Menu Grid */}
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: "12px", maxHeight: "350px", overflowY: "auto" }}>
                  {filteredMenu.map((item) => (
                    <div
                      key={item.id}
                      onClick={() => addToCart(item)}
                      style={{
                        padding: "12px",
                        borderRadius: "var(--radius-md)",
                        border: "1px solid var(--color-border-subtle)",
                        background: "white",
                        cursor: "pointer",
                        display: "flex",
                        flexDirection: "column",
                        justifyContent: "space-between",
                      }}
                      className="card-hover-effect"
                    >
                      <div>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                          <span style={{ fontSize: "14px", fontWeight: 600 }}>{item.name}</span>
                          <span
                            style={{
                              width: "12px",
                              height: "12px",
                              borderRadius: "2px",
                              border: item.isVeg ? "2px solid green" : "2px solid red",
                              display: "inline-block",
                            }}
                          />
                        </div>
                        <div className="text-xs text-secondary" style={{ marginTop: "4px" }}>
                          Prep: {item.prepTime} mins
                        </div>
                      </div>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "8px" }}>
                        <span className="mono font-bold text-primary">{formatCurrency(item.price)}</span>
                        <button className="btn btn-ghost btn-sm btn-icon">
                          <Plus size={14} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Cart & Billing Panel */}
          <div className="card" style={{ padding: "20px", display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingBottom: "12px", borderBottom: "1px solid var(--color-border)" }}>
                <h3 style={{ fontSize: "16px", fontWeight: 700 }}>
                  {selectedTable ? `Table ${selectedTable.number} Order` : "Select a Table"}
                </h3>
                {selectedTable && (
                  <span className="badge badge-primary">{selectedTable.location}</span>
                )}
              </div>

              {cart.length === 0 ? (
                <div style={{ textAlign: "center", padding: "40px 10px", color: "var(--color-text-tertiary)" }}>
                  <ShoppingCart size={36} style={{ margin: "0 auto 8px", opacity: 0.4 }} />
                  <p className="text-sm">Click items from menu to add to order cart.</p>
                </div>
              ) : (
                <div style={{ marginTop: "12px", display: "flex", flexDirection: "column", gap: "10px", maxHeight: "300px", overflowY: "auto" }}>
                  {cart.map((ci) => (
                    <div key={ci.menuItem.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: "14px", fontWeight: 600 }}>{ci.menuItem.name}</div>
                        <div className="text-xs text-secondary">{formatCurrency(ci.menuItem.price)} each</div>
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                        <button className="btn btn-secondary btn-sm" onClick={() => updateQuantity(ci.menuItem.id, -1)} style={{ padding: "2px 8px" }}>-</button>
                        <span style={{ fontWeight: 600, fontSize: "14px" }}>{ci.quantity}</span>
                        <button className="btn btn-secondary btn-sm" onClick={() => updateQuantity(ci.menuItem.id, 1)} style={{ padding: "2px 8px" }}>+</button>
                        <span className="mono font-semibold" style={{ width: "60px", textAlign: "right" }}>
                          {formatCurrency(ci.menuItem.price * ci.quantity)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Subtotal & Actions */}
            {cart.length > 0 && (
              <div style={{ paddingTop: "16px", borderTop: "1px solid var(--color-border)" }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px", fontSize: "13px" }}>
                  <span>Subtotal</span>
                  <span className="mono font-semibold">{formatCurrency(cartSubtotal)}</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px", fontSize: "13px" }}>
                  <span>GST (5%)</span>
                  <span className="mono font-semibold">{formatCurrency(cartGST)}</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "16px", fontSize: "16px", fontWeight: 800 }}>
                  <span>Total Amount</span>
                  <span className="mono text-primary">{formatCurrency(cartTotal)}</span>
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                  <button className="btn btn-primary w-full" onClick={handleSendToKitchen}>
                    <Send size={16} /> Send to Kitchen (KOT)
                  </button>
                  <button className="btn btn-success w-full" onClick={() => setShowBillModal(true)}>
                    <CreditCard size={16} /> Settle Bill / Charge to Room
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: MENU CATALOG */}
      {activeTab === "menu" && (
        <div className="card">
          <div className="card-header" style={{ padding: "16px 20px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", width: "100%", alignItems: "center" }}>
              <h3 style={{ fontSize: "16px", fontWeight: 700 }}>Hotel Shemron Restaurant Menu</h3>
              <div className="search-input-wrapper" style={{ width: "250px" }}>
                <Search className="search-icon" size={14} />
                <input
                  type="text"
                  className="form-input"
                  placeholder="Search item or category..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>
          </div>
          <div className="card-body" style={{ padding: 0 }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Item Name</th>
                  <th>Category</th>
                  <th>Type</th>
                  <th>Prep Time</th>
                  <th>Price</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {filteredMenu.map((item) => (
                  <tr key={item.id}>
                    <td className="font-semibold">{item.name}</td>
                    <td><span className="badge badge-default">{item.category}</span></td>
                    <td>
                      <span className={`badge ${item.isVeg ? "badge-success" : "badge-danger"}`}>
                        {item.isVeg ? "Veg" : "Non-Veg"}
                      </span>
                    </td>
                    <td>{item.prepTime} mins</td>
                    <td className="mono font-bold text-primary">{formatCurrency(item.price)}</td>
                    <td><span className="badge badge-success">Available</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: LIVE KOTS */}
      {activeTab === "kots" && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: "16px" }}>
          {kots.map((kot) => (
            <div key={kot.id} className="card" style={{ padding: "16px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
                <div>
                  <h4 style={{ fontSize: "16px", fontWeight: 800 }}>{kot.kotNumber}</h4>
                  <span className="text-xs text-secondary">Table {kot.tableNumber}</span>
                </div>
                <span
                  className={`badge ${
                    kot.status === "PENDING"
                      ? "badge-warning"
                      : kot.status === "PREPARING"
                      ? "badge-primary"
                      : "badge-success"
                  }`}
                >
                  {kot.status}
                </span>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "6px", margin: "12px 0" }}>
                {kot.items.map((it, idx) => (
                  <div key={idx} style={{ display: "flex", justifyContent: "space-between", fontSize: "13px" }}>
                    <span>{it.quantity}x {it.name}</span>
                    <span className="mono font-semibold">{formatCurrency(it.price * it.quantity)}</span>
                  </div>
                ))}
              </div>

              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingTop: "12px", borderTop: "1px solid var(--color-border-subtle)" }}>
                <div>
                  <span className="text-xs text-tertiary">Total</span>
                  <div className="mono font-bold text-primary">{formatCurrency(kot.total)}</div>
                </div>
                <button
                  className="btn btn-secondary btn-sm"
                  onClick={() => advanceKOTStatus(kot.id)}
                >
                  <ChefHat size={14} /> Next Status
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* TAB 4: QR DINING */}
      {activeTab === "qr" && (
        <div className="card" style={{ padding: "40px", textAlign: "center", maxWidth: "500px", margin: "0 auto" }}>
          <QrCode size={64} className="text-primary" style={{ margin: "0 auto 16px" }} />
          <h2 style={{ fontSize: "20px", fontWeight: 800 }}>Contactless QR Table & In-Room Dining</h2>
          <p className="text-sm text-secondary" style={{ margin: "12px 0 24px" }}>
            Configure a guest menu route before printing table or in-room dining QR codes. POS ordering and room-folio posting remain available to staff above.
          </p>

          <div style={{ background: "var(--color-bg-tertiary)", padding: "20px", borderRadius: "var(--radius-md)", margin: "16px 0" }}>
            <div style={{ fontSize: "13px", fontWeight: 600 }}>Guest QR portal</div>
            <div className="text-sm text-warning" style={{ marginTop: "4px" }}>Not configured</div>
          </div>

          <button className="btn btn-primary" disabled title="Create and verify a public guest menu route first">
            Download Printable Tabletop QR PDF
          </button>
        </div>
      )}

      {/* Bill Settlement Modal */}
      {showBillModal && selectedTable && (
        <div className="modal-backdrop" onClick={() => setShowBillModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">Settle Bill — Table {selectedTable.number}</h3>
              <button className="btn btn-ghost btn-icon btn-sm" onClick={() => setShowBillModal(false)}>
                <X size={16} />
              </button>
            </div>
            <div className="modal-body" style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              {orderBilled ? (
                <div style={{ textAlign: "center", padding: "20px" }}>
                  <div style={{ width: "48px", height: "48px", borderRadius: "50%", background: "var(--green-50)", color: "var(--green-600)", display: "inline-flex", alignItems: "center", justifyContent: "center", marginBottom: "12px" }}>
                    <Check size={24} />
                  </div>
                  <h3>Bill Settled Successfully!</h3>
                  <p className="text-sm text-secondary" style={{ marginTop: "8px" }}>
                    {paymentType === "ROOM_FOLIO"
                      ? `Charged ${formatCurrency(cartTotal)} to Room #${selectedRoomNumber} Folio.`
                      : `Settled via ${paymentType}.`}
                  </p>
                </div>
              ) : (
                <>
                  <div style={{ background: "var(--color-bg-tertiary)", padding: "16px", borderRadius: "var(--radius-md)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span>Amount Payable</span>
                    <span className="mono text-primary" style={{ fontSize: "20px", fontWeight: 800 }}>
                      {formatCurrency(cartTotal)}
                    </span>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Payment Method</label>
                    <select
                      className="form-select"
                      value={paymentType}
                      onChange={(e) => setPaymentType(e.target.value as any)}
                    >
                      <option value="ROOM_FOLIO">Charge to Guest Room Folio</option>
                      <option value="UPI">UPI / GPay / PhonePe</option>
                      <option value="CASH">Cash Payment</option>
                      <option value="CARD">Credit / Debit Card</option>
                    </select>
                  </div>

                  {paymentType === "ROOM_FOLIO" && (
                    <div className="form-group">
                      <label className="form-label">Select In-House Room</label>
                      <select
                        className="form-select"
                        value={selectedRoomNumber}
                        onChange={(e) => setSelectedRoomNumber(e.target.value)}
                      >
                        {demoReservations
                          .filter((r) => r.status === "CHECKED_IN")
                          .map((r) => (
                            <option key={r.id} value={r.roomNumber}>
                              Room #{r.roomNumber} — {r.guestName}
                            </option>
                          ))}
                      </select>
                    </div>
                  )}
                </>
              )}
            </div>

            {!orderBilled && (
              <div className="modal-footer">
                <button className="btn btn-secondary" onClick={() => setShowBillModal(false)}>
                  Cancel
                </button>
                <button className="btn btn-success" onClick={handleSettleOrder}>
                  Complete Settlement
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
