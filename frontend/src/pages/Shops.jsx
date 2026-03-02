import { useEffect, useState } from "react";
import api from "../api/axios";

const empty = { name: "", owner_name: "", phone: "", route_id: "" };

export default function Shops() {
  const [shops, setShops] = useState([]);
  const [routes, setRoutes] = useState([]);
  const [bills, setBills] = useState([]);
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState(empty);
  const [editing, setEditing] = useState(null);
  const [expandedShop, setExpandedShop] = useState(null);

  const load = () => {
    api.get("/shops").then(r => setShops(r.data));
    api.get("/bills").then(r => setBills(r.data));
  };
  useEffect(() => {
    load();
    api.get("/routes").then(r => setRoutes(r.data));
  }, []);

  const getShopStats = (shopId) => {
    const shopBills = bills.filter(b => b.shop_id === shopId);
    const totalBilled = shopBills.reduce((s, b) => s + parseFloat(b.total_amount || 0), 0);
    const totalPaid = shopBills.reduce((s, b) => s + parseFloat(b.paid_amount || 0), 0);
    const totalPending = shopBills.reduce((s, b) => s + parseFloat(b.pending_amount || 0), 0);
    const pendingBills = shopBills.filter(b => b.status !== "CLEARED");
    return { totalBilled, totalPaid, totalPending, pendingBills, totalBills: shopBills.length };
  };

  const openAdd = () => { setForm(empty); setEditing(null); setModal(true); };
  const openEdit = (s) => { setForm(s); setEditing(s.id); setModal(true); };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (editing) await api.put(`/shops/${editing}`, form);
    else await api.post("/shops", form);
    setModal(false);
    load();
  };

  const handleDelete = async (id) => {
    if (!confirm("Delete this shop?")) return;
    await api.delete(`/shops/${id}`);
    load();
  };

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "24px" }}>
        <h1 className="section-title">Shops</h1>
        <button className="btn-primary" onClick={openAdd}>+ Add Shop</button>
      </div>

      <div className="card" style={{ padding: 0, overflow: "hidden" }}>
        <table style={{ width: "100%", fontSize: "14px", borderCollapse: "collapse" }}>
          <thead className="table-head">
            <tr>
              {["Shop Name", "Owner", "Phone", "Route", "Total Billed", "Total Paid", "Outstanding", "Actions"].map(h => (
                <th key={h}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {shops.map(s => {
              const stats = getShopStats(s.id);
              const isExpanded = expandedShop === s.id;
              return (
                <>
                  <tr key={s.id} className="table-row"
                    style={{ background: stats.totalPending > 0 ? "#fff9f9" : "" }}>
                    <td>
                      <div style={{ fontWeight: 500 }}>{s.name}</div>
                      {stats.pendingBills.length > 0 && (
                        <div style={{ fontSize: "11px", color: "#C8102E" }}>
                          {stats.pendingBills.length} bill{stats.pendingBills.length > 1 ? "s" : ""} pending
                        </div>
                      )}
                    </td>
                    <td>{s.owner_name || "—"}</td>
                    <td>{s.phone || "—"}</td>
                    <td><span className="badge-gray">{s.route_name || "—"}</span></td>
                    <td style={{ color: "#6b7280" }}>
                      {stats.totalBills > 0 ? `₹${stats.totalBilled.toLocaleString()}` : "—"}
                    </td>
                    <td style={{ color: "#16a34a", fontWeight: 500 }}>
                      {stats.totalBills > 0 ? `₹${stats.totalPaid.toLocaleString()}` : "—"}
                    </td>
                    <td>
                      {stats.totalPending > 0 ? (
                        <div>
                          <span style={{ color: "#C8102E", fontWeight: 700, fontSize: "15px" }}>
                            ₹{stats.totalPending.toLocaleString()}
                          </span>
                          <button
                            onClick={() => setExpandedShop(isExpanded ? null : s.id)}
                            style={{ display: "block", fontSize: "11px", color: "#9ca3af", background: "none", border: "none", cursor: "pointer", padding: 0, marginTop: "2px" }}>
                            {isExpanded ? "▲ Hide" : "▼ View bills"}
                          </button>
                        </div>
                      ) : (
                        <span className="badge-green">Cleared</span>
                      )}
                    </td>
                    <td>
                      <div style={{ display: "flex", gap: "12px" }}>
                        <button onClick={() => openEdit(s)}
                          style={{ color: "#C8102E", fontSize: "12px", background: "none", border: "none", cursor: "pointer" }}>Edit</button>
                        <button onClick={() => handleDelete(s.id)}
                          style={{ color: "#9ca3af", fontSize: "12px", background: "none", border: "none", cursor: "pointer" }}>Delete</button>
                      </div>
                    </td>
                  </tr>

                  {/* Expanded pending bills */}
                  {isExpanded && stats.pendingBills.length > 0 && (
                    <tr key={`${s.id}-expanded`}>
                      <td colSpan={8} style={{ padding: "0 16px 12px 32px", background: "#fff5f5" }}>
                        <div style={{ fontSize: "12px", fontWeight: 600, color: "#9ca3af", textTransform: "uppercase", marginBottom: "6px", paddingTop: "8px" }}>
                          Pending Bills
                        </div>
                        <table style={{ width: "100%", fontSize: "13px", borderCollapse: "collapse" }}>
                          <thead>
                            <tr style={{ borderBottom: "1px solid #fee2e2" }}>
                              {["Bill #", "Date", "Total", "Paid", "Pending", "Status"].map(h => (
                                <th key={h} style={{ textAlign: "left", padding: "4px 8px", color: "#9ca3af", fontSize: "11px", textTransform: "uppercase" }}>{h}</th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            {stats.pendingBills.map(b => (
                              <tr key={b.id} style={{ borderBottom: "1px solid #fee2e2" }}>
                                <td style={{ padding: "6px 8px", fontWeight: 700, color: "#C8102E" }}>#{b.bill_number}</td>
                                <td style={{ padding: "6px 8px", color: "#6b7280" }}>{new Date(b.created_at).toLocaleDateString("en-IN")}</td>
                                <td style={{ padding: "6px 8px" }}>₹{Number(b.total_amount).toLocaleString()}</td>
                                <td style={{ padding: "6px 8px", color: "#16a34a" }}>₹{Number(b.paid_amount || 0).toLocaleString()}</td>
                                <td style={{ padding: "6px 8px", color: "#C8102E", fontWeight: 600 }}>₹{Number(b.pending_amount || 0).toLocaleString()}</td>
                                <td style={{ padding: "6px 8px" }}>
                                  <span className={b.status === "PARTIAL" ? "badge-red" : "badge-gray"}>{b.status}</span>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </td>
                    </tr>
                  )}
                </>
              );
            })}
          </tbody>
        </table>
        {shops.length === 0 && <p style={{ textAlign: "center", color: "#9ca3af", padding: "32px", fontSize: "14px" }}>No shops yet</p>}
      </div>

      {modal && (
        <div className="modal-overlay">
          <div className="modal-box">
            <h2 style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: "1.8rem", fontWeight: 700, marginBottom: "16px" }}>
              {editing ? "Edit Shop" : "Add Shop"}
            </h2>
            <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              <div>
                <label style={{ fontSize: "11px", color: "#9ca3af", textTransform: "uppercase" }}>Shop Name</label>
                <input className="input" style={{ marginTop: "4px" }} value={form.name} onChange={e => setForm({...form, name: e.target.value})} required />
              </div>
              <div>
                <label style={{ fontSize: "11px", color: "#9ca3af", textTransform: "uppercase" }}>Owner Name</label>
                <input className="input" style={{ marginTop: "4px" }} value={form.owner_name} onChange={e => setForm({...form, owner_name: e.target.value})} />
              </div>
              <div>
                <label style={{ fontSize: "11px", color: "#9ca3af", textTransform: "uppercase" }}>Phone</label>
                <input className="input" style={{ marginTop: "4px" }} value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} />
              </div>
              <div>
                <label style={{ fontSize: "11px", color: "#9ca3af", textTransform: "uppercase" }}>Route</label>
                <select className="input" style={{ marginTop: "4px" }} value={form.route_id} onChange={e => setForm({...form, route_id: e.target.value})}>
                  <option value="">Select Route</option>
                  {routes.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
                </select>
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