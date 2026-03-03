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
  const [loading, setLoading] = useState(false);

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
    if (loading) return;
    setLoading(true);
    try {
      if (editing) await api.put(`/shops/${editing}`, form);
      else await api.post("/shops", form);
      setModal(false);
      load();
    } catch (err) {
      alert(err.response?.data?.error || "Failed to save shop");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm("Delete this shop?")) return;
    await api.delete(`/shops/${id}`);
    load();
  };

  const labelStyle = {
    fontSize: "11px",
    color: "#888",
    textTransform: "uppercase",
    letterSpacing: "0.08em",
    fontFamily: "'Barlow Condensed', sans-serif",
    fontWeight: 600
  };

  const actionBtn = (color) => ({
    color,
    fontSize: "15px",
    background: "none",
    border: "none",
    cursor: "pointer",
    fontFamily: "'Barlow Condensed', sans-serif",
    fontWeight: 700,
    textTransform: "uppercase",
    letterSpacing: "0.06em"
  });

  return (
    <div>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: "20px", marginTop: "20px" }}>
        <div>
          <h1 className="section-title">Shops</h1>
          <p style={{ fontSize: "15px", color: "#888", marginTop: "4px" }}>
            All shops • Latest on top
          </p>
        </div>
        <button className="btn-primary" onClick={openAdd}>
          + Add Shop
        </button>
      </div>

      {/* Table */}
      <div className="card" style={{ padding: 0, overflow: "hidden" }}>
        <table style={{ width: "100%", fontSize: "14px", borderCollapse: "collapse" }}>
          <thead className="table-head">
            <tr>
              {["Shop Name", "Owner", "Phone", "Route", "Total Billed", "Total Paid", "Outstanding", "Actions"].map(h => (
                <th key={h} style={{ padding: "12px 16px" }}>{h}</th>
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
                    style={{ background: stats.totalPending > 0 ? "#fff8f8" : "" }}>
                    <td style={{ padding: "16px" }}>
                      <div style={{ fontWeight: 600, fontSize: "16px" }}>{s.name}</div>
                      {stats.pendingBills.length > 0 && (
                        <div style={{ fontSize: "13px", color: "#C8102E", marginTop: "4px" }}>
                          {stats.pendingBills.length} bill{stats.pendingBills.length > 1 ? "s" : ""} pending
                        </div>
                      )}
                    </td>
                    <td style={{ fontSize: "15px", padding: "16px" }}>
                      {s.owner_name || "—"}
                    </td>
                    <td style={{ fontSize: "15px", padding: "16px" }}>
                      {s.phone || "—"}
                    </td>
                    <td style={{ padding: "16px" }}>
                      <span className="badge-gray">{s.route_name || "—"}</span>
                    </td>
                    <td style={{ fontFamily: "'IBM Plex Sans', sans-serif", fontWeight: 700, fontSize: "19px", padding: "16px" }}>
                      {stats.totalBills > 0 ? `₹${stats.totalBilled.toLocaleString()}` : "—"}
                    </td>
                    <td style={{ fontFamily: "'IBM Plex Sans', sans-serif", fontWeight: 700, fontSize: "19px", color: "#16a34a", padding: "16px" }}>
                      {stats.totalBills > 0 ? `₹${stats.totalPaid.toLocaleString()}` : "—"}
                    </td>
                    <td style={{ padding: "16px" }}>
                      {stats.totalPending > 0 ? (
                        <div>
                          <span style={{ fontFamily: "'IBM Plex Sans', sans-serif", fontWeight: 700, fontSize: "19px", color: "#C8102E" }}>
                            ₹{stats.totalPending.toLocaleString()}
                          </span>
                          <button
                            onClick={() => setExpandedShop(isExpanded ? null : s.id)}
                            style={{
                              display: "block",
                              fontSize: "13px",
                              color: "#888",
                              background: "none",
                              border: "none",
                              cursor: "pointer",
                              padding: 0,
                              marginTop: "4px"
                            }}
                          >
                            {isExpanded ? "▲ Hide bills" : "▼ View bills"}
                          </button>
                        </div>
                      ) : (
                        <span className="badge-green">Cleared</span>
                      )}
                    </td>
                    <td style={{ padding: "16px" }}>
                      <div style={{ display: "flex", gap: "16px" }}>
                        <button onClick={() => openEdit(s)} style={actionBtn("#C8102E")}>
                          Edit
                        </button>
                        <button onClick={() => handleDelete(s.id)} style={actionBtn("#aaaaaa")}>
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>

                  {/* Expanded pending bills */}
                  {isExpanded && stats.pendingBills.length > 0 && (
                    <tr key={`${s.id}-expanded`}>
                      <td colSpan={8} style={{ padding: "0 16px 16px 32px", background: "#fff5f5" }}>
                        <div style={{
                          fontSize: "13px",
                          fontWeight: 700,
                          color: "#444",
                          textTransform: "uppercase",
                          marginBottom: "8px",
                          paddingTop: "12px"
                        }}>
                          Pending Bills
                        </div>
                        <table style={{ width: "100%", fontSize: "13px", borderCollapse: "collapse" }}>
                          <thead>
                            <tr style={{ borderBottom: "2px solid #fee2e2" }}>
                              {["Bill #", "Date", "Total", "Paid", "Pending", "Status"].map(h => (
                                <th key={h} style={{
                                  textAlign: "left",
                                  padding: "8px 12px",
                                  color: "#888",
                                  fontSize: "11px",
                                  textTransform: "uppercase",
                                  fontWeight: 600
                                }}>
                                  {h}
                                </th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            {stats.pendingBills.map(b => (
                              <tr key={b.id} style={{ borderBottom: "1px solid #fee2e2" }}>
                                <td style={{
                                  padding: "10px 12px",
                                  fontFamily: "'IBM Plex Sans', sans-serif",
                                  fontWeight: 700,
                                  color: "#C8102E"
                                }}>
                                  #{b.bill_number}
                                </td>
                                <td style={{ padding: "10px 12px", color: "#555" }}>
                                  {new Date(b.created_at).toLocaleDateString("en-IN")}
                                </td>
                                <td style={{ padding: "10px 12px", fontWeight: 600 }}>
                                  ₹{Number(b.total_amount).toLocaleString()}
                                </td>
                                <td style={{ padding: "10px 12px", color: "#16a34a", fontWeight: 600 }}>
                                  ₹{Number(b.paid_amount || 0).toLocaleString()}
                                </td>
                                <td style={{ padding: "10px 12px", color: "#C8102E", fontWeight: 600 }}>
                                  ₹{Number(b.pending_amount || 0).toLocaleString()}
                                </td>
                                <td style={{ padding: "10px 12px" }}>
                                  <span className={
                                    b.status === "PARTIAL" ? "badge-red" :
                                    b.status === "CLEARED" ? "badge-green" :
                                    "badge-gray"
                                  }>
                                    {b.status}
                                  </span>
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

        {shops.length === 0 && (
          <div style={{ textAlign: "center", padding: "48px 24px" }}>
            <p style={{
              fontFamily: "'Barlow Condensed', sans-serif",
              fontSize: "1.2rem",
              color: "#ccc",
              textTransform: "uppercase",
              letterSpacing: "0.1em"
            }}>
              No shops yet
            </p>
          </div>
        )}
      </div>

      {/* Modal */}
      {modal && (
        <div className="modal-overlay">
          <div className="modal-box" style={{ maxWidth: "520px", maxHeight: "90vh", overflowY: "auto" }}>
            <div style={{ borderBottom: "2px solid #f0f0f0", paddingBottom: "16px", marginBottom: "20px" }}>
              <h2 style={{
                fontFamily: "'Barlow Condensed', sans-serif",
                fontSize: "2rem",
                fontWeight: 800,
                textTransform: "uppercase",
                letterSpacing: "0.04em"
              }}>
                {editing ? "Edit Shop" : "Add Shop"}
              </h2>
            </div>

            <form onSubmit={handleSubmit}>
              <div style={{ marginBottom: "20px" }}>
                <label style={labelStyle}>Shop Name</label>
                <input
                  className="input"
                  style={{ marginTop: "6px" }}
                  value={form.name}
                  onChange={e => setForm({ ...form, name: e.target.value })}
                  required
                />
              </div>

              <div style={{ marginBottom: "20px" }}>
                <label style={labelStyle}>Owner Name</label>
                <input
                  className="input"
                  style={{ marginTop: "6px" }}
                  value={form.owner_name}
                  onChange={e => setForm({ ...form, owner_name: e.target.value })}
                />
              </div>

              <div style={{ marginBottom: "20px" }}>
                <label style={labelStyle}>Phone</label>
                <input
                  className="input"
                  style={{ marginTop: "6px" }}
                  value={form.phone}
                  onChange={e => setForm({ ...form, phone: e.target.value })}
                />
              </div>

              <div style={{ marginBottom: "24px" }}>
                <label style={labelStyle}>Route</label>
                <select
                  className="input"
                  style={{ marginTop: "6px" }}
                  value={form.route_id}
                  onChange={e => setForm({ ...form, route_id: e.target.value })}
                >
                  <option value="">Select Route</option>
                  {routes.map(r => (
                    <option key={r.id} value={r.id}>{r.name}</option>
                  ))}
                </select>
              </div>

              <div style={{ display: "flex", gap: "12px" }}>
                <button type="submit" className="btn-primary" style={{ flex: 1 }} disabled={loading}>
                  {loading ? "Saving..." : "Save"}
                </button>
                <button type="button" className="btn-outline" style={{ flex: 1 }} onClick={() => setModal(false)}>
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}