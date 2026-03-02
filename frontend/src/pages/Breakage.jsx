import { useEffect, useState } from "react";
import api from "../api/axios";

const today = new Date().toISOString().split("T")[0];

export default function Breakage() {
  const [breakages, setBreakages] = useState([]);
  const [products, setProducts] = useState([]);
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState({ product_id: "", quantity_bottles: "", reason: "", breakage_date: today });

  const load = () => api.get("/breakage").then(r => setBreakages(r.data));
  useEffect(() => {
    load();
    api.get("/products").then(r => setProducts(r.data));
  }, []);

  const selectedProduct = products.find(p => p.id === form.product_id);
  const estimatedPenalty = (parseInt(form.quantity_bottles || 0)) * parseFloat(selectedProduct?.breakage_penalty || 3);

  const handleSubmit = async (e) => {
    e.preventDefault();
    await api.post("/breakage", form);
    setModal(false);
    setForm({ product_id: "", quantity_bottles: "", reason: "", breakage_date: today });
    load();
  };

  const handleDelete = async (id) => {
    if (!confirm("Delete this breakage record?")) return;
    await api.delete(`/breakage/${id}`);
    load();
  };

  const totalPenalty = breakages.reduce((s, b) => s + parseFloat(b.total_penalty || 0), 0);

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "24px" }}>
        <div>
          <h1 className="section-title">Breakage</h1>
          <p style={{ fontSize: "12px", color: "#9ca3af", marginTop: "4px" }}>Track broken bottles and penalties</p>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
          {breakages.length > 0 && (
            <div style={{ textAlign: "right" }}>
              <p style={{ fontSize: "11px", color: "#9ca3af", textTransform: "uppercase" }}>Total Penalty</p>
              <p style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: "1.5rem", fontWeight: 700, color: "#C8102E" }}>
                ₹{totalPenalty.toLocaleString()}
              </p>
            </div>
          )}
          <button className="btn-primary" onClick={() => setModal(true)}>+ Add Breakage</button>
        </div>
      </div>

      <div className="card" style={{ padding: 0, overflow: "hidden" }}>
        <table style={{ width: "100%", fontSize: "14px", borderCollapse: "collapse" }}>
          <thead className="table-head">
            <tr>
              {["Date", "Product", "Godown", "Bottles Broken", "Penalty/Bottle", "Total Penalty", "Reason", "Actions"].map(h => (
                <th key={h}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {breakages.map(b => (
              <tr key={b.id} className="table-row">
                <td>{new Date(b.breakage_date).toLocaleDateString("en-IN")}</td>
                <td style={{ fontWeight: 500 }}>{b.product_name}</td>
                <td style={{ color: "#9ca3af" }}>{b.godown_name}</td>
                <td><span className="badge-red">{b.quantity_bottles} bottles</span></td>
                <td>₹{b.penalty_per_bottle}</td>
                <td style={{ fontWeight: 700, color: "#C8102E" }}>₹{Number(b.total_penalty).toLocaleString()}</td>
                <td>
                    <span style={{
                    fontSize: "11px", padding: "3px 8px", borderRadius: "4px", fontWeight: 500,
                    background: b.reason?.includes("company") ? "#fef3c7" : b.reason?.includes("godown") ? "#fee2e2" : "#ede9fe",
                    color: b.reason?.includes("company") ? "#92400e" : b.reason?.includes("godown") ? "#991b1b" : "#5b21b6"
                    }}>
                    {b.reason || "—"}
                    </span>
                </td>
                <td>
                  <button onClick={() => handleDelete(b.id)}
                    style={{ color: "#9ca3af", fontSize: "12px", background: "none", border: "none", cursor: "pointer" }}>
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {breakages.length === 0 && (
          <p style={{ textAlign: "center", color: "#9ca3af", padding: "32px", fontSize: "14px" }}>No breakage records</p>
        )}
      </div>

      {modal && (
        <div className="modal-overlay">
          <div className="modal-box" style={{ maxWidth: "440px" }}>
            <h2 style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: "1.8rem", fontWeight: 700, marginBottom: "16px" }}>Add Breakage</h2>
            <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              <div>
                <label style={{ fontSize: "11px", color: "#9ca3af", textTransform: "uppercase" }}>Product</label>
                <select className="input" style={{ marginTop: "4px" }} value={form.product_id}
                  onChange={e => setForm({ ...form, product_id: e.target.value })} required>
                  <option value="">Select Product</option>
                  {products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
                {selectedProduct && (
                  <p style={{ fontSize: "11px", color: "#9ca3af", marginTop: "3px" }}>
                    Penalty: ₹{selectedProduct.breakage_penalty}/bottle
                  </p>
                )}
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                <div>
                  <label style={{ fontSize: "11px", color: "#9ca3af", textTransform: "uppercase" }}>Bottles Broken</label>
                  <input type="number" className="input" style={{ marginTop: "4px" }}
                    value={form.quantity_bottles}
                    onChange={e => setForm({ ...form, quantity_bottles: e.target.value })}
                    required min="1" />
                </div>
                <div>
                  <label style={{ fontSize: "11px", color: "#9ca3af", textTransform: "uppercase" }}>Date</label>
                  <input type="date" className="input" style={{ marginTop: "4px" }}
                    value={form.breakage_date}
                    onChange={e => setForm({ ...form, breakage_date: e.target.value })} />
                </div>
              </div>
              <div>
                <label style={{ fontSize: "11px", color: "#9ca3af", textTransform: "uppercase" }}>Breakage Location</label>
                <select className="input" style={{ marginTop: "4px" }}
                    value={form.reason}
                    onChange={e => setForm({ ...form, reason: e.target.value })}
                    required>
                <option value="">Select Location</option>
                <option value="Breakage while purchasing from company">While purchasing from company</option>
                <option value="Breakage in godown / while loading">In godown / while loading</option>
                <option value="Breakage at shop / reseller">At shop / reseller</option>
                    </select>
              </div>
              {estimatedPenalty > 0 && (
                <div style={{ background: "#fff5f5", border: "1px solid #fee2e2", borderRadius: "8px", padding: "10px 12px" }}>
                  <p style={{ fontSize: "13px", color: "#C8102E", fontWeight: 700 }}>
                    Penalty: ₹{estimatedPenalty.toLocaleString()}
                    <span style={{ fontWeight: 400, color: "#9ca3af", marginLeft: "8px" }}>
                      ({form.quantity_bottles} × ₹{selectedProduct?.breakage_penalty})
                    </span>
                  </p>
                </div>
              )}
              <div style={{ display: "flex", gap: "12px" }}>
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