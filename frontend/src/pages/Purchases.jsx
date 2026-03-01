import { useEffect, useState } from "react";
import api from "../api/axios";

const today = new Date().toISOString().split("T")[0];

export default function Purchases() {
  const [purchases, setPurchases] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [products, setProducts] = useState([]);
  const [modal, setModal] = useState(false);
  const [editModal, setEditModal] = useState(null);
  const [editPaid, setEditPaid] = useState("");

  const [form, setForm] = useState({
    company_id: "", purchase_date: today, paid_amount: "",
    gst_amount: "", transport_cost: "",
    items: [{ product_id: "", quantity_cases: "", price_per_case: "", total_price: "" }]
  });

  const load = () => api.get("/purchases").then(r => setPurchases(r.data));
  useEffect(() => {
    load();
    api.get("/companies").then(r => setCompanies(r.data));
    api.get("/products").then(r => setProducts(r.data));
  }, []);

  const openAdd = () => {
    setForm({
      company_id: "", purchase_date: today, paid_amount: "",
      gst_amount: "", transport_cost: "",
      items: [{ product_id: "", quantity_cases: "", price_per_case: "", total_price: "" }]
    });
    setModal(true);
  };

  const updateItem = (i, field, value) => {
    const items = [...form.items];
    items[i][field] = value;
    if (field === "quantity_cases" || field === "price_per_case") {
      items[i].total_price = (parseFloat(items[i].quantity_cases) || 0) * (parseFloat(items[i].price_per_case) || 0);
    }
    setForm({ ...form, items });
  };

  const addItem = () => setForm({ ...form, items: [...form.items, { product_id: "", quantity_cases: "", price_per_case: "", total_price: "" }] });
  const removeItem = (i) => setForm({ ...form, items: form.items.filter((_, idx) => idx !== i) });

  const itemsTotal = form.items.reduce((s, i) => s + parseFloat(i.total_price || 0), 0);
  const gst = parseFloat(form.gst_amount || 0);
  const transport = parseFloat(form.transport_cost || 0);
  const grandTotal = itemsTotal + gst + transport;

  const handleSubmit = async (e) => {
    e.preventDefault();
    await api.post("/purchases", form);
    setModal(false);
    load();
  };

  const handleDelete = async (id) => {
    if (!confirm("Delete this purchase? Inventory will be reversed.")) return;
    await api.delete(`/purchases/${id}`);
    load();
  };

  const handleEditSave = async () => {
    const adding = parseFloat(editPaid || 0);
    await api.post(`/purchases/${editModal}/payment`, { paid_amount: adding });
    setEditModal(null);
    setEditPaid("");
    load();
  };

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "24px" }}>
        <h1 className="section-title">Purchases</h1>
        <button className="btn-primary" onClick={openAdd}>+ New Purchase</button>
      </div>

      <div className="card" style={{ padding: 0, overflow: "hidden" }}>
        <table style={{ width: "100%", fontSize: "14px", borderCollapse: "collapse" }}>
          <thead className="table-head">
            <tr>
              {["Date", "Company", "Godown", "Items", "GST", "Transport", "Total", "Paid", "Pending", "Status", "Actions"].map(h => (
                <th key={h}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {purchases.map(p => {
              const pending = Math.max(0, parseFloat(p.total_amount) - parseFloat(p.paid_amount || 0));
              const itemsAmt = parseFloat(p.total_amount) - parseFloat(p.gst_amount || 0) - parseFloat(p.transport_cost || 0);
              return (
                <tr key={p.id} className="table-row">
                  <td>{new Date(p.purchase_date).toLocaleDateString("en-IN")}</td>
                  <td style={{ fontWeight: 500 }}>{p.company_name}</td>
                  <td style={{ color: "#9ca3af" }}>{p.godown_name}</td>
                  <td>₹{itemsAmt.toLocaleString()}</td>
                  <td style={{ color: "#6b7280" }}>₹{Number(p.gst_amount || 0).toLocaleString()}</td>
                  <td style={{ color: "#6b7280" }}>₹{Number(p.transport_cost || 0).toLocaleString()}</td>
                  <td style={{ fontWeight: 700 }}>₹{Number(p.total_amount).toLocaleString()}</td>
                  <td style={{ color: "#16a34a" }}>₹{Number(p.paid_amount || 0).toLocaleString()}</td>
                  <td style={{ color: "#C8102E", fontWeight: 600 }}>₹{pending.toLocaleString()}</td>
                  <td>
                    <span className={p.payment_status === "PAID" ? "badge-green" : p.payment_status === "PARTIAL" ? "badge-red" : "badge-gray"}>
                      {p.payment_status}
                    </span>
                  </td>
                  <td>
                    <div style={{ display: "flex", gap: "12px" }}>
                      {p.payment_status !== "PAID" && (
                        <button onClick={() => { setEditModal(p.id); setEditPaid(""); }}
                          style={{ color: "#C8102E", fontSize: "12px", background: "none", border: "none", cursor: "pointer" }}>
                          Edit
                        </button>
                      )}
                      <button onClick={() => handleDelete(p.id)}
                        style={{ color: "#9ca3af", fontSize: "12px", background: "none", border: "none", cursor: "pointer" }}>
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {purchases.length === 0 && <p style={{ textAlign: "center", color: "#9ca3af", padding: "32px", fontSize: "14px" }}>No purchases yet</p>}
      </div>

      {/* New Purchase Modal */}
      {modal && (
        <div className="modal-overlay">
          <div className="modal-box" style={{ maxWidth: "700px", maxHeight: "90vh", overflowY: "auto" }}>
            <h2 style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: "1.8rem", fontWeight: 700, marginBottom: "16px" }}>New Purchase</h2>
            <form onSubmit={handleSubmit}>

              {/* Company + Date */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "12px" }}>
                <div>
                  <label style={{ fontSize: "11px", color: "#9ca3af", textTransform: "uppercase" }}>Company</label>
                  <select className="input" style={{ marginTop: "4px" }} value={form.company_id} onChange={e => setForm({...form, company_id: e.target.value})} required>
                    <option value="">Select</option>
                    {companies.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: "11px", color: "#9ca3af", textTransform: "uppercase" }}>Date</label>
                  <input type="date" className="input" style={{ marginTop: "4px" }} value={form.purchase_date} onChange={e => setForm({...form, purchase_date: e.target.value})} required />
                </div>
              </div>

              {/* Items */}
              <div style={{ borderTop: "1px solid #f3f4f6", paddingTop: "12px", marginBottom: "12px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}>
                  <p style={{ fontSize: "11px", color: "#9ca3af", textTransform: "uppercase" }}>Items</p>
                  <button type="button" onClick={addItem} style={{ color: "#C8102E", fontSize: "12px", background: "none", border: "none", cursor: "pointer" }}>+ Add Item</button>
                </div>
                {form.items.map((item, i) => (
                  <div key={i} style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1fr auto", gap: "8px", marginBottom: "8px", alignItems: "center" }}>
                    <select className="input" value={item.product_id} onChange={e => updateItem(i, "product_id", e.target.value)} required>
                      <option value="">Product</option>
                      {products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                    </select>
                    <input type="number" className="input" placeholder="Cases" value={item.quantity_cases} onChange={e => updateItem(i, "quantity_cases", e.target.value)} required min="1" />
                    <input type="number" className="input" placeholder="₹/Case" value={item.price_per_case} onChange={e => updateItem(i, "price_per_case", e.target.value)} required />
                    <span style={{ fontSize: "14px", fontWeight: 600 }}>₹{item.total_price || 0}</span>
                    {form.items.length > 1 && (
                      <button type="button" onClick={() => removeItem(i)} style={{ color: "#9ca3af", background: "none", border: "none", cursor: "pointer" }}>✕</button>
                    )}
                  </div>
                ))}
                <div style={{ textAlign: "right", fontSize: "13px", color: "#6b7280" }}>
                  Items Subtotal: <strong style={{ color: "#111" }}>₹{itemsTotal.toLocaleString()}</strong>
                </div>
              </div>

              {/* GST + Transport */}
              <div style={{ background: "#f9fafb", borderRadius: "8px", padding: "12px", marginBottom: "12px" }}>
                <p style={{ fontSize: "11px", color: "#9ca3af", textTransform: "uppercase", marginBottom: "10px" }}>Additional Charges</p>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                  <div>
                    <label style={{ fontSize: "11px", color: "#9ca3af", textTransform: "uppercase" }}>GST Amount ₹</label>
                    <input type="number" className="input" style={{ marginTop: "4px" }} value={form.gst_amount} onChange={e => setForm({...form, gst_amount: e.target.value})} placeholder="0" min="0" />
                  </div>
                  <div>
                    <label style={{ fontSize: "11px", color: "#9ca3af", textTransform: "uppercase" }}>Transport Cost ₹</label>
                    <input type="number" className="input" style={{ marginTop: "4px" }} value={form.transport_cost} onChange={e => setForm({...form, transport_cost: e.target.value})} placeholder="0" min="0" />
                  </div>
                </div>
              </div>

              {/* Grand Total Breakdown */}
              <div style={{ background: "#fff5f5", border: "1px solid #fee2e2", borderRadius: "8px", padding: "12px", marginBottom: "12px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "13px", marginBottom: "4px" }}>
                  <span style={{ color: "#6b7280" }}>Items</span>
                  <span>₹{itemsTotal.toLocaleString()}</span>
                </div>
                {gst > 0 && (
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: "13px", marginBottom: "4px" }}>
                    <span style={{ color: "#6b7280" }}>GST</span>
                    <span>₹{gst.toLocaleString()}</span>
                  </div>
                )}
                {transport > 0 && (
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: "13px", marginBottom: "4px" }}>
                    <span style={{ color: "#6b7280" }}>Transport</span>
                    <span>₹{transport.toLocaleString()}</span>
                  </div>
                )}
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "15px", fontWeight: 700, borderTop: "1px solid #fee2e2", paddingTop: "8px", marginTop: "4px" }}>
                  <span>Grand Total</span>
                  <span style={{ color: "#C8102E" }}>₹{grandTotal.toLocaleString()}</span>
                </div>
              </div>

              {/* Paid Amount */}
              <div style={{ marginBottom: "16px" }}>
                <label style={{ fontSize: "11px", color: "#9ca3af", textTransform: "uppercase" }}>Amount Paid Now (0 if fully pending)</label>
                <input type="number" className="input" style={{ marginTop: "4px" }} value={form.paid_amount} onChange={e => setForm({...form, paid_amount: e.target.value})} placeholder="0" min="0" />
                {parseFloat(form.paid_amount) > 0 && grandTotal > 0 && (
                  <p style={{ fontSize: "12px", color: "#C8102E", marginTop: "4px" }}>
                    Pending: ₹{Math.max(0, grandTotal - parseFloat(form.paid_amount)).toLocaleString()}
                  </p>
                )}
              </div>

              <div style={{ display: "flex", gap: "12px" }}>
                <button type="submit" className="btn-primary" style={{ flex: 1 }}>Save Purchase</button>
                <button type="button" className="btn-outline" style={{ flex: 1 }} onClick={() => setModal(false)}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {editModal && (
        <div className="modal-overlay">
          <div className="modal-box" style={{ maxWidth: "400px" }}>
            <h2 style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: "1.8rem", fontWeight: 700, marginBottom: "16px" }}>Record Payment</h2>
            {(() => {
              const p = purchases.find(p => p.id === editModal);
              const pending = Math.max(0, parseFloat(p.total_amount) - parseFloat(p.paid_amount || 0));
              return (
                <div>
                  <div style={{ background: "#f9fafb", borderRadius: "8px", padding: "12px", marginBottom: "16px", fontSize: "13px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "4px" }}>
                      <span style={{ color: "#9ca3af" }}>Total</span>
                      <span style={{ fontWeight: 600 }}>₹{Number(p.total_amount).toLocaleString()}</span>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "4px" }}>
                      <span style={{ color: "#9ca3af" }}>Already Paid</span>
                      <span style={{ color: "#16a34a", fontWeight: 600 }}>₹{Number(p.paid_amount || 0).toLocaleString()}</span>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between" }}>
                      <span style={{ color: "#9ca3af" }}>Pending</span>
                      <span style={{ color: "#C8102E", fontWeight: 600 }}>₹{pending.toLocaleString()}</span>
                    </div>
                  </div>
                  <label style={{ fontSize: "11px", color: "#9ca3af", textTransform: "uppercase" }}>Add Payment ₹</label>
                  <input type="number" className="input" style={{ marginTop: "4px", marginBottom: "16px" }}
                    value={editPaid} onChange={e => setEditPaid(e.target.value)}
                    placeholder="Enter amount" max={pending} />
                  <div style={{ display: "flex", gap: "12px" }}>
                    <button onClick={handleEditSave} className="btn-primary" style={{ flex: 1 }}>Save</button>
                    <button onClick={() => setEditModal(null)} className="btn-outline" style={{ flex: 1 }}>Cancel</button>
                  </div>
                </div>
              );
            })()}
          </div>
        </div>
      )}
    </div>
  );
}