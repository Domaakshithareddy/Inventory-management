import { useEffect, useState } from "react";
import api from "../api/axios";

const emptyItem = { product_id: "", quantity_cases: "", quantity_units: "", price_per_unit: "" };

export default function CounterSales() {
  const [sales, setSales] = useState([]);
  const [products, setProducts] = useState([]);
  const [modal, setModal] = useState(false);
  const [items, setItems] = useState([{ ...emptyItem }]);

  const load = () => api.get("/counter-sales").then(r => setSales(r.data));
  useEffect(() => {
    load();
    api.get("/products").then(r => setProducts(r.data));
  }, []);

  const updateItem = (i, field, value) => {
    const updated = [...items];
    updated[i][field] = value;
    if (field === "product_id") {
      const p = products.find(p => p.id === value);
      updated[i].price_per_unit = p?.selling_price_per_unit || "";
    }
    setItems(updated);
  };

  const addItem = () => setItems([...items, { ...emptyItem }]);
  const removeItem = (i) => setItems(items.filter((_, idx) => idx !== i));

  const getBottles = (item) => {
    const p = products.find(p => p.id === item.product_id);
    const bpc = p?.bottles_per_case || 0;
    return (parseInt(item.quantity_cases || 0) * bpc) + parseInt(item.quantity_units || 0);
  };

  const getItemTotal = (item) => getBottles(item) * parseFloat(item.price_per_unit || 0);

  const grandTotal = items.reduce((s, item) => s + getItemTotal(item), 0);

  const handleSubmit = async (e) => {
    e.preventDefault();
    for (const item of items) {
      if (!item.product_id) continue;
      const totalBottles = getBottles(item);
      if (totalBottles <= 0) continue;
      await api.post("/counter-sales", {
        product_id: item.product_id,
        quantity_units: totalBottles,
        price_per_unit: item.price_per_unit
      });
    }
    setModal(false);
    setItems([{ ...emptyItem }]);
    load();
  };

  const todayTotal = sales.reduce((s, i) => s + parseFloat(i.total_amount || 0), 0);

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "24px" }}>
        <div>
          <h1 className="section-title">Counter Sales</h1>
          <p style={{ fontSize: "12px", color: "#9ca3af", marginTop: "4px" }}>Today's walk-in / cash sales</p>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
          <span style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: "1.5rem", fontWeight: 700, color: "#C8102E" }}>
            Today: ₹{todayTotal.toLocaleString()}
          </span>
          <button className="btn-primary" onClick={() => { setItems([{ ...emptyItem }]); setModal(true); }}>+ New Sale</button>
        </div>
      </div>

      <div className="card" style={{ padding: 0, overflow: "hidden" }}>
        <table style={{ width: "100%", fontSize: "14px", borderCollapse: "collapse" }}>
          <thead className="table-head">
            <tr>
              {["Time", "Product", "Qty Sold", "Price/Bottle", "Total"].map(h => (
                <th key={h}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sales.map(s => {
              const bpcS = s.bottles_per_case || 1;
              const cases = Math.floor(s.quantity_units / bpcS);
              const bottles = s.quantity_units % bpcS;
              return (
                <tr key={s.id} className="table-row">
                  <td>{new Date(s.created_at).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}</td>
                  <td style={{ fontWeight: 500 }}>{s.product_name}</td>
                  <td>
                    {cases > 0 && <span className="badge-red" style={{ marginRight: "4px" }}>{cases} cases</span>}
                    {bottles > 0 && <span className="badge-green">{bottles} bottles</span>}
                    {cases === 0 && bottles === 0 && <span className="badge-gray">{s.quantity_units} bottles</span>}
                  </td>
                  <td>₹{s.price_per_unit}</td>
                  <td style={{ fontWeight: 700, color: "#16a34a" }}>₹{Number(s.total_amount).toLocaleString()}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {sales.length === 0 && <p style={{ textAlign: "center", color: "#9ca3af", padding: "32px", fontSize: "14px" }}>No counter sales today</p>}
      </div>

      {modal && (
        <div className="modal-overlay">
          <div className="modal-box" style={{ maxWidth: "640px", maxHeight: "90vh", overflowY: "auto" }}>
            <h2 style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: "1.8rem", fontWeight: 700, marginBottom: "16px" }}>Counter Sale</h2>
            <form onSubmit={handleSubmit}>

              {items.map((item, i) => {
                const selectedProduct = products.find(p => p.id === item.product_id);
                const bpc = selectedProduct?.bottles_per_case || 0;
                const totalBottles = getBottles(item);
                const itemTotal = getItemTotal(item);

                return (
                  <div key={i} style={{ background: "#f9fafb", borderRadius: "8px", padding: "12px", marginBottom: "12px", border: "1px solid #f3f4f6" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }}>
                      <p style={{ fontSize: "12px", fontWeight: 600, color: "#6b7280", textTransform: "uppercase" }}>Item {i + 1}</p>
                      {items.length > 1 && (
                        <button type="button" onClick={() => removeItem(i)}
                          style={{ color: "#9ca3af", background: "none", border: "none", cursor: "pointer", fontSize: "16px" }}>✕</button>
                      )}
                    </div>

                    <div style={{ marginBottom: "10px" }}>
                      <label style={{ fontSize: "11px", color: "#9ca3af", textTransform: "uppercase" }}>Product</label>
                      <select className="input" style={{ marginTop: "4px" }} value={item.product_id} onChange={e => updateItem(i, "product_id", e.target.value)} required>
                        <option value="">Select Product</option>
                        {products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                      </select>
                      {selectedProduct && (
                        <p style={{ fontSize: "11px", color: "#9ca3af", marginTop: "3px" }}>{bpc} bottles per case</p>
                      )}
                    </div>

                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "10px", marginBottom: "8px" }}>
                      <div>
                        <label style={{ fontSize: "11px", color: "#9ca3af", textTransform: "uppercase" }}>Cases</label>
                        <input type="number" className="input" style={{ marginTop: "4px" }}
                          value={item.quantity_cases} onChange={e => updateItem(i, "quantity_cases", e.target.value)}
                          placeholder="0" min="0" />
                      </div>
                      <div>
                        <label style={{ fontSize: "11px", color: "#9ca3af", textTransform: "uppercase" }}>Extra Bottles</label>
                        <input type="number" className="input" style={{ marginTop: "4px" }}
                          value={item.quantity_units} onChange={e => updateItem(i, "quantity_units", e.target.value)}
                          placeholder="0" min="0" />
                      </div>
                      <div>
                        <label style={{ fontSize: "11px", color: "#9ca3af", textTransform: "uppercase" }}>₹ / Bottle</label>
                        <input type="number" className="input" style={{ marginTop: "4px" }}
                          value={item.price_per_unit} onChange={e => updateItem(i, "price_per_unit", e.target.value)}
                          placeholder="0" required />
                      </div>
                    </div>

                    {totalBottles > 0 && (
                      <div style={{ display: "flex", justifyContent: "space-between", fontSize: "13px" }}>
                        <span style={{ color: "#6b7280" }}>{totalBottles} bottles total</span>
                        <span style={{ fontWeight: 700, color: "#16a34a" }}>₹{itemTotal.toLocaleString()}</span>
                      </div>
                    )}
                  </div>
                );
              })}

              <button type="button" onClick={addItem}
                style={{ width: "100%", padding: "10px", border: "2px dashed #e5e7eb", borderRadius: "8px", background: "none", color: "#C8102E", cursor: "pointer", fontSize: "13px", fontWeight: 500, marginBottom: "12px" }}>
                + Add Another Product
              </button>

              {grandTotal > 0 && (
                <div style={{ background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: "8px", padding: "12px", marginBottom: "12px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontWeight: 600, color: "#111" }}>Grand Total</span>
                  <span style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: "1.5rem", fontWeight: 700, color: "#16a34a" }}>₹{grandTotal.toLocaleString()}</span>
                </div>
              )}

              <div style={{ display: "flex", gap: "12px" }}>
                <button type="submit" className="btn-primary" style={{ flex: 1 }}>Record Sale</button>
                <button type="button" className="btn-outline" style={{ flex: 1 }} onClick={() => setModal(false)}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}