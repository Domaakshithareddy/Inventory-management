import { useEffect, useState } from "react";
import api from "../api/axios";

const CATEGORIES = ["RGB", "PET", "CAN", "TTP", "MTP"];
const empty = { name: "", category: "PET", size: "", bottles_per_case: "", selling_price: "", selling_price_per_unit: "", breakage_penalty: 3, is_returnable: true, company_id: "" };

export default function Products() {
  const [products, setProducts] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState(empty);
  const [editing, setEditing] = useState(null);

  const load = () => {
    api.get("/products").then(r => setProducts(r.data));
    api.get("/companies").then(r => setCompanies(r.data));
  };
  useEffect(() => { load(); }, []);

  const openAdd = () => { setForm(empty); setEditing(null); setModal(true); };
  const openEdit = (p) => { setForm(p); setEditing(p.id); setModal(true); };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (editing) await api.put(`/products/${editing}`, form);
    else await api.post("/products", form);
    setModal(false);
    load();
  };

  const handleDelete = async (id) => {
    if (!confirm("Delete this product?")) return;
    await api.delete(`/products/${id}`);
    load();
  };

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "24px" }}>
        <h1 className="section-title">Products</h1>
        <button className="btn-primary" onClick={openAdd}>+ Add Product</button>
      </div>

      <div className="card" style={{ padding: 0, overflow: "hidden" }}>
        <table style={{ width: "100%", fontSize: "14px", borderCollapse: "collapse" }}>
          <thead className="table-head">
            <tr>
              {["Name", "Category", "Size", "Bottles/Case", "Selling ₹/Case", "Selling ₹/Bottle", "Company", "Actions"].map(h => (
                <th key={h}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {products.map(p => (
              <tr key={p.id} className="table-row">
                <td style={{ fontWeight: 500 }}>{p.name}</td>
                <td><span className="badge-red">{p.category}</span></td>
                <td>{p.size}</td>
                <td>{p.bottles_per_case}</td>
                <td style={{ fontWeight: 600 }}>₹{p.selling_price}</td>
                <td style={{ fontWeight: 600, color: "#2563eb" }}>₹{p.selling_price_per_unit}</td>
                <td style={{ color: "#9ca3af" }}>{p.company_name || "—"}</td>
                <td>
                  <div style={{ display: "flex", gap: "12px" }}>
                    <button onClick={() => openEdit(p)} style={{ color: "#C8102E", fontSize: "12px", background: "none", border: "none", cursor: "pointer" }}>Edit</button>
                    <button onClick={() => handleDelete(p.id)} style={{ color: "#9ca3af", fontSize: "12px", background: "none", border: "none", cursor: "pointer" }}>Delete</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {products.length === 0 && <p style={{ textAlign: "center", color: "#9ca3af", padding: "32px", fontSize: "14px" }}>No products yet</p>}
      </div>

      {modal && (
        <div className="modal-overlay">
          <div className="modal-box">
            <h2 style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: "1.8rem", fontWeight: 700, marginBottom: "16px" }}>
              {editing ? "Edit Product" : "Add Product"}
            </h2>
            <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              <div>
                <label style={{ fontSize: "11px", color: "#9ca3af", textTransform: "uppercase" }}>Product Name</label>
                <input className="input" style={{ marginTop: "4px" }} value={form.name} onChange={e => setForm({...form, name: e.target.value})} required />
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                <div>
                    <label style={{ fontSize: "11px", color: "#9ca3af", textTransform: "uppercase" }}>Category</label>
                    <select className="input" style={{ marginTop: "4px" }} value={form.category} onChange={e => setForm({...form, category: e.target.value})}>
                    {CATEGORIES.map(c => <option key={c}>{c}</option>)}
                    </select>
                </div>
                <div>
                    <label style={{ fontSize: "11px", color: "#9ca3af", textTransform: "uppercase" }}>Size</label>
                    <input className="input" style={{ marginTop: "4px" }} value={form.size} onChange={e => setForm({...form, size: e.target.value})} placeholder="750ml" />
                </div>
                <div>
                    <label style={{ fontSize: "11px", color: "#9ca3af", textTransform: "uppercase" }}>Bottles per Case</label>
                        <input type="number" className="input" style={{ marginTop: "4px" }} value={form.bottles_per_case} onChange={e => setForm({...form, bottles_per_case: e.target.value})} required />
                </div>
                <div>
                    <label style={{ fontSize: "11px", color: "#9ca3af", textTransform: "uppercase" }}>Selling Price / Case ₹</label>
                    <input type="number" className="input" style={{ marginTop: "4px" }} value={form.selling_price} onChange={e => setForm({...form, selling_price: e.target.value})} required />
                </div>
                <div>
                    <label style={{ fontSize: "11px", color: "#9ca3af", textTransform: "uppercase" }}>Selling Price / Bottle ₹</label>
                    <input type="number" className="input" style={{ marginTop: "4px" }} value={form.selling_price_per_unit} onChange={e => setForm({...form, selling_price_per_unit: e.target.value})} required />
                </div>
                <div>
                    <label style={{ fontSize: "11px", color: "#9ca3af", textTransform: "uppercase" }}>Breakage Fee / Bottle ₹</label>
                    <input type="number" className="input" style={{ marginTop: "4px" }} value={form.breakage_penalty} onChange={e => setForm({...form, breakage_penalty: e.target.value})} placeholder="3" />
                </div>
                <div>
                    <label style={{ fontSize: "11px", color: "#9ca3af", textTransform: "uppercase" }}>Company</label>
                    <select className="input" style={{ marginTop: "4px" }} value={form.company_id} onChange={e => setForm({...form, company_id: e.target.value})}>
                    <option value="">Select Company</option>
                    {companies.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                </div>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <input type="checkbox" id="returnable" checked={form.is_returnable} onChange={e => setForm({...form, is_returnable: e.target.checked})} />
                <label htmlFor="returnable" style={{ fontSize: "13px" }}>Returnable Bottles</label>
              </div>
              <div style={{ display: "flex", gap: "12px", marginTop: "4px" }}>
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