import { useEffect, useState } from "react";
import api from "../api/axios";

const empty = { product_id: "", quantity_units: "", notes: "", given_date: "" };

export default function FreeProducts() {
  const [items, setItems] = useState([]);
  const [products, setProducts] = useState([]);
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState(empty);
  const [editing, setEditing] = useState(null);
  const [loading, setLoading] = useState(false);

  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const load = async (start = "", end = "") => {
    let url = "/free-products";
    if (start || end) {
      const params = new URLSearchParams();
      if (start) params.append("start", start);
      if (end) params.append("end", end);
      url += `?${params.toString()}`;
    }
    const res = await api.get(url);
    setItems(res.data);
  };

  useEffect(() => {
    const fetchInitial = async () => {
      await load();
      const prodRes = await api.get("/products");
      setProducts(prodRes.data);
    };
    fetchInitial();
  }, []);

  const applyFilter = () => { load(startDate, endDate); };
  const clearFilter = () => { setStartDate(""); setEndDate(""); load(); };

  const openAdd = () => { setForm(empty); setEditing(null); setModal(true); };
  const openEdit = (i) => { setForm(i); setEditing(i.id); setModal(true); };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (loading) return;
    setLoading(true);
    try {
      if (editing) await api.put(`/free-products/${editing}`, form);
      else await api.post("/free-products", form);
      setModal(false);
      load(startDate, endDate);
    } catch (err) {
      alert(err.response?.data?.error || "Failed to save entry");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm("Delete?")) return;
    await api.delete(`/free-products/${id}`);
    load(startDate, endDate);
  };

  const totalValue = items.reduce((sum, item) => {
    const product = products.find(p => p.id === item.product_id);
    const pricePerUnit = product ? parseFloat(product.selling_price_per_unit || 0) : 0;
    return sum + (parseInt(item.quantity_units || 0) * pricePerUnit);
  }, 0);

  const getRowValue = (item) => {
    const product = products.find(p => p.id === item.product_id);
    const price = product ? parseFloat(product.selling_price_per_unit || 0) : 0;
    return (parseInt(item.quantity_units || 0) * price).toLocaleString();
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
          <h1 className="section-title">Free Products</h1>
          <p style={{ fontSize: "15px", color: "#888", marginTop: "4px" }}>
            Items given free • Does not affect inventory or profit
          </p>
        </div>
        <div style={{ display: "flex", gap: "16px", alignItems: "center" }}>
          <span style={{
            fontFamily: "'IBM Plex Sans', sans-serif",
            fontSize: "1.6rem",
            fontWeight: 700,
            color: "#C8102E"
          }}>
            ₹{totalValue.toLocaleString()}
          </span>
          <button className="btn-primary" onClick={openAdd}>
            + Add Entry
          </button>
        </div>
      </div>

      {/* Date Range Filter */}
      <div style={{
        background: "#f8f8f8",
        borderLeft: "4px solid #C8102E",
        padding: "16px",
        marginBottom: "24px",
        borderRadius: "4px"
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "16px", flexWrap: "wrap" }}>
          <div>
            <label style={labelStyle}>Start Date</label>
            <input
              type="date"
              className="input"
              style={{ marginTop: "6px" }}
              value={startDate}
              onChange={e => setStartDate(e.target.value)}
            />
          </div>
          <div>
            <label style={labelStyle}>End Date</label>
            <input
              type="date"
              className="input"
              style={{ marginTop: "6px" }}
              value={endDate}
              onChange={e => setEndDate(e.target.value)}
            />
          </div>
          <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
            <button className="btn-primary" onClick={applyFilter} style={{ marginTop: "20px" }}>
              Apply Filter
            </button>
            <button className="btn-outline" onClick={clearFilter} style={{ marginTop: "20px" }}>
              Clear
            </button>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="card" style={{ padding: 0, overflow: "hidden" }}>
        <table style={{ width: "100%", fontSize: "14px", borderCollapse: "collapse" }}>
          <thead className="table-head">
            <tr>
              {["Date", "Product", "Bottles", "Value", "Notes", "Actions"].map(h => (
                <th key={h} style={{ padding: "12px 16px" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {items.map(i => (
              <tr key={i.id} className="table-row">
                <td style={{ color: "#555", fontSize: "15px", padding: "16px" }}>
                  {new Date(i.given_date).toLocaleDateString("en-IN")}
                </td>
                <td style={{ fontWeight: 600, fontSize: "16px", padding: "16px" }}>
                  {i.product_name}
                </td>
                <td style={{ padding: "16px" }}>
                  <span className="badge-green">{i.quantity_units} bottles</span>
                </td>
                <td style={{
                  fontFamily: "'IBM Plex Sans', sans-serif",
                  fontWeight: 700,
                  fontSize: "19px",
                  color: "#C8102E",
                  padding: "16px"
                }}>
                  ₹{getRowValue(i)}
                </td>
                <td style={{ color: "#888", fontSize: "15px", padding: "16px" }}>
                  {i.notes || "—"}
                </td>
                <td style={{ padding: "16px" }}>
                  <div style={{ display: "flex", gap: "16px" }}>
                    <button onClick={() => openEdit(i)} style={actionBtn("#C8102E")}>
                      Edit
                    </button>
                    <button onClick={() => handleDelete(i.id)} style={actionBtn("#aaaaaa")}>
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {items.length === 0 && (
          <div style={{ textAlign: "center", padding: "48px 24px" }}>
            <p style={{
              fontFamily: "'Barlow Condensed', sans-serif",
              fontSize: "1.2rem",
              color: "#ccc",
              textTransform: "uppercase",
              letterSpacing: "0.1em"
            }}>
              No free products recorded
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
                {editing ? "Edit Entry" : "Add Free Product"}
              </h2>
            </div>

            <form onSubmit={handleSubmit}>
              <div style={{ marginBottom: "20px" }}>
                <label style={labelStyle}>Product</label>
                <select
                  className="input"
                  style={{ marginTop: "6px" }}
                  value={form.product_id}
                  onChange={e => setForm({ ...form, product_id: e.target.value })}
                  required
                >
                  <option value="">Select Product</option>
                  {products.map(p => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </div>

              <div style={{ marginBottom: "20px" }}>
                <label style={labelStyle}>Number of Bottles</label>
                <input
                  type="number"
                  className="input"
                  style={{ marginTop: "6px" }}
                  value={form.quantity_units}
                  onChange={e => setForm({ ...form, quantity_units: e.target.value })}
                  required
                  min="1"
                />
              </div>

              <div style={{ marginBottom: "20px" }}>
                <label style={labelStyle}>Date</label>
                <input
                  type="date"
                  className="input"
                  style={{ marginTop: "6px" }}
                  value={form.given_date}
                  onChange={e => setForm({ ...form, given_date: e.target.value })}
                  required
                />
              </div>

              <div style={{ marginBottom: "24px" }}>
                <label style={labelStyle}>Notes</label>
                <textarea
                  className="input"
                  style={{ marginTop: "6px", minHeight: "80px" }}
                  value={form.notes}
                  onChange={e => setForm({ ...form, notes: e.target.value })}
                />
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