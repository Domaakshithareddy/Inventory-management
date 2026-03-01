import { useEffect, useState } from "react";
import api from "../api/axios";

export default function Inventory() {
  const [inventory, setInventory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const load = async () => {
    try {
      setLoading(true);
      const r = await api.get("/inventory");
      setInventory(r.data);
      setError(null);
    } catch (err) {
      setError(err.response?.data?.error || "Failed to load inventory");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  if (loading) return <div style={{ color: "#9ca3af", fontSize: "14px", padding: "24px" }}>Loading inventory...</div>;
  if (error) return <div style={{ color: "#C8102E", fontSize: "14px", padding: "24px" }}>Error: {error}</div>;

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "24px" }}>
        <h1 className="section-title">Inventory</h1>
        <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
          <span className="badge-gray">{inventory.length} Products</span>
          <button onClick={load} className="btn-outline" style={{ fontSize: "12px", padding: "4px 12px" }}>🔄 Refresh</button>
        </div>
      </div>

      <div className="card" style={{ padding: 0, overflow: "hidden" }}>
        <table style={{ width: "100%", fontSize: "14px", borderCollapse: "collapse" }}>
          <thead className="table-head">
            <tr>
              {["Product", "Category", "Size", "Godown", "Cases", "Extra Bottles", "Total Bottles", "Stock Value"].map(h => (
                <th key={h}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {inventory.map(i => {
              const bpc = parseInt(i.bottles_per_case) || 1;
              const cases = parseInt(i.quantity_cases) || 0;
              const units = parseInt(i.quantity_units) || 0;
              const totalBottles = (cases * bpc) + units;

              return (
                <tr key={i.id} className="table-row">
                  <td style={{ fontWeight: 500 }}>{i.product_name}</td>
                  <td><span className="badge-red">{i.category}</span></td>
                  <td style={{ color: "#6b7280" }}>{i.size || "—"}</td>
                  <td style={{ color: "#9ca3af" }}>{i.godown_name}</td>
                  <td>
                    <span style={{ fontWeight: 700, color: cases < 5 ? "#C8102E" : "#111111" }}>
                      {cases} cases
                    </span>
                  </td>
                  <td>
                    <span style={{ color: units > 0 ? "#2563eb" : "#9ca3af" }}>
                      {units} bottles
                    </span>
                  </td>
                  <td style={{ fontWeight: 600 }}>
                    {totalBottles} bottles
                  </td>
                  <td style={{ fontWeight: 600, color: "#16a34a" }}>
                    ₹{Number(i.stock_value || 0).toLocaleString()}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {inventory.length === 0 && (
          <div style={{ textAlign: "center", padding: "48px 24px" }}>
            <p style={{ color: "#9ca3af", fontSize: "14px" }}>No inventory yet</p>
            <p style={{ color: "#d1d5db", fontSize: "12px", marginTop: "8px" }}>Add a purchase to see inventory here</p>
          </div>
        )}
      </div>
    </div>
  );
}