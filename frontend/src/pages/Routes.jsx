import { useEffect, useState } from "react";
import api from "../api/axios";

const empty = { name: "", driver_name: "", driver_phone: "" };

export default function AppRoutes() {
  const [routes, setRoutes] = useState([]);
  const [shops, setShops] = useState([]);
  const [bills, setBills] = useState([]);
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState(empty);
  const [editing, setEditing] = useState(null);
  const [expandedRoute, setExpandedRoute] = useState(null);

  const load = () => {
    api.get("/routes").then(r => setRoutes(r.data));
    api.get("/shops").then(r => setShops(r.data));
    api.get("/bills").then(r => setBills(r.data));
  };
  useEffect(() => { load(); }, []);

  const getRouteShops = (routeId) => shops.filter(s => s.route_id === routeId);

  const getShopPending = (shopId) => {
    const shopBills = bills.filter(b => b.shop_id === shopId && b.status !== "CLEARED");
    return shopBills.reduce((s, b) => s + parseFloat(b.pending_amount || 0), 0);
  };

  const openAdd = () => { setForm(empty); setEditing(null); setModal(true); };
  const openEdit = (r) => { setForm(r); setEditing(r.id); setModal(true); };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (editing) await api.put(`/routes/${editing}`, form);
    else await api.post("/routes", form);
    setModal(false);
    load();
  };

  const handleDelete = async (id) => {
    if (!confirm("Delete this route?")) return;
    await api.delete(`/routes/${id}`);
    load();
  };

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "24px" }}>
        <h1 className="section-title">Routes</h1>
        <button className="btn-primary" onClick={openAdd}>+ Add Route</button>
      </div>

      <div className="card" style={{ padding: 0, overflow: "hidden" }}>
        <table style={{ width: "100%", fontSize: "14px", borderCollapse: "collapse" }}>
          <thead className="table-head">
            <tr>
              {["Route Name", "Driver", "Phone", "Shops", "Actions"].map(h => (
                <th key={h}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {routes.map(r => {
              const routeShops = getRouteShops(r.id);
              const isExpanded = expandedRoute === r.id;
              const totalPending = routeShops.reduce((s, shop) => s + getShopPending(shop.id), 0);

              return (
                <>
                  <tr key={r.id} className="table-row">
                    <td style={{ fontWeight: 500 }}>{r.name}</td>
                    <td>{r.driver_name || "—"}</td>
                    <td>{r.driver_phone || "—"}</td>
                    <td>
                      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                        <span className="badge-gray">{routeShops.length} shops</span>
                        {totalPending > 0 && (
                          <span style={{ fontSize: "11px", color: "#C8102E", fontWeight: 600 }}>
                            ₹{totalPending.toLocaleString()} pending
                          </span>
                        )}
                        {routeShops.length > 0 && (
                          <button
                            onClick={() => setExpandedRoute(isExpanded ? null : r.id)}
                            style={{ fontSize: "11px", color: "#2563eb", background: "none", border: "none", cursor: "pointer" }}>
                            {isExpanded ? "▲ Hide" : "▼ View"}
                          </button>
                        )}
                      </div>
                    </td>
                    <td>
                      <div style={{ display: "flex", gap: "12px" }}>
                        <button onClick={() => openEdit(r)}
                          style={{ color: "#C8102E", fontSize: "12px", background: "none", border: "none", cursor: "pointer" }}>Edit</button>
                        <button onClick={() => handleDelete(r.id)}
                          style={{ color: "#9ca3af", fontSize: "12px", background: "none", border: "none", cursor: "pointer" }}>Delete</button>
                      </div>
                    </td>
                  </tr>

                  {/* Expanded shops */}
                  {isExpanded && (
                    <tr key={`${r.id}-expanded`}>
                      <td colSpan={5} style={{ padding: "0 16px 12px 40px", background: "#f9fafb" }}>
                        <div style={{ fontSize: "12px", fontWeight: 600, color: "#9ca3af", textTransform: "uppercase", marginBottom: "8px", paddingTop: "10px" }}>
                          Shops in {r.name}
                        </div>
                        <table style={{ width: "100%", fontSize: "13px", borderCollapse: "collapse" }}>
                          <thead>
                            <tr style={{ borderBottom: "1px solid #e5e7eb" }}>
                              {["Shop Name", "Owner", "Phone", "Outstanding"].map(h => (
                                <th key={h} style={{ textAlign: "left", padding: "4px 8px", color: "#9ca3af", fontSize: "11px", textTransform: "uppercase" }}>{h}</th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            {routeShops.map(shop => {
                              const pending = getShopPending(shop.id);
                              return (
                                <tr key={shop.id} style={{ borderBottom: "1px solid #f3f4f6" }}>
                                  <td style={{ padding: "8px 8px", fontWeight: 500 }}>{shop.name}</td>
                                  <td style={{ padding: "8px 8px", color: "#6b7280" }}>{shop.owner_name || "—"}</td>
                                  <td style={{ padding: "8px 8px", color: "#6b7280" }}>{shop.phone || "—"}</td>
                                  <td style={{ padding: "8px 8px" }}>
                                    {pending > 0 ? (
                                      <span style={{ color: "#C8102E", fontWeight: 700 }}>₹{pending.toLocaleString()}</span>
                                    ) : (
                                      <span className="badge-green">Cleared</span>
                                    )}
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                        {routeShops.length === 0 && (
                          <p style={{ color: "#9ca3af", fontSize: "13px", padding: "8px" }}>No shops assigned to this route</p>
                        )}
                      </td>
                    </tr>
                  )}
                </>
              );
            })}
          </tbody>
        </table>
        {routes.length === 0 && (
          <p style={{ textAlign: "center", color: "#9ca3af", padding: "32px", fontSize: "14px" }}>No routes yet</p>
        )}
      </div>

      {modal && (
        <div className="modal-overlay">
          <div className="modal-box">
            <h2 style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: "1.8rem", fontWeight: 700, marginBottom: "16px" }}>
              {editing ? "Edit Route" : "Add Route"}
            </h2>
            <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              <div>
                <label style={{ fontSize: "11px", color: "#9ca3af", textTransform: "uppercase" }}>Route Name</label>
                <input className="input" style={{ marginTop: "4px" }} value={form.name} onChange={e => setForm({...form, name: e.target.value})} required />
              </div>
              <div>
                <label style={{ fontSize: "11px", color: "#9ca3af", textTransform: "uppercase" }}>Driver Name</label>
                <input className="input" style={{ marginTop: "4px" }} value={form.driver_name} onChange={e => setForm({...form, driver_name: e.target.value})} />
              </div>
              <div>
                <label style={{ fontSize: "11px", color: "#9ca3af", textTransform: "uppercase" }}>Driver Phone</label>
                <input className="input" style={{ marginTop: "4px" }} value={form.driver_phone} onChange={e => setForm({...form, driver_phone: e.target.value})} />
              </div>
              <div style={{ display: "flex", gap: "12px", paddingTop: "4px" }}>
                <button type="submit" className="btn-primary" style={{ flex: 1 }}>Save</button>
                <button type="button" className="btn-outline" style={{ flex: 1 }} onClick={() => setModal(false)}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}