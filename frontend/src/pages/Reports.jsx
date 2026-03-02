import { useState } from "react";
import api from "../api/axios";

const DOWNLOAD_OPTIONS = [
  { type: "bills", label: "Shop Bills Only", icon: "🧾", color: "#2563eb" },
  { type: "counter", label: "Counter Sales Only", icon: "🏷️", color: "#7c3aed" },
  { type: "complete", label: "Complete Sales (Shop + Counter)", icon: "📊", color: "#16a34a" },
  { type: "purchases", label: "Purchases Only", icon: "🛒", color: "#d97706" },
  { type: "expenses", label: "Expenses + Free Products + Breakage", icon: "💸", color: "#C8102E" },
  { type: "full", label: "Purchases + All Expenses", icon: "📋", color: "#111111" },
];

export default function Reports() {
  const today = new Date().toISOString().split("T")[0];
  const [from, setFrom] = useState(today);
  const [to, setTo] = useState(today);
  const [sales, setSales] = useState([]);
  const [loaded, setLoaded] = useState(false);
  const [downloading, setDownloading] = useState(null);

  const fetchSales = async () => {
    const r = await api.get(`/reports/sales?from=${from}&to=${to}`);
    setSales(r.data);
    setLoaded(true);
  };

  const downloadExcel = async (type) => {
    try {
      setDownloading(type);
      const response = await api.get(`/reports/download/${type}?from=${from}&to=${to}`, {
        responseType: "blob"
      });
      const typeNames = { bills: 'Shop_Sales', counter: 'Counter_Sales', complete: 'Complete_Sales', purchases: 'Purchases', expenses: 'Expenses', full: 'Purchase_Expenses' };
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `${typeNames[type]}_${from}_${to}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      alert("Download failed: " + (err.response?.data?.error || err.message));
    } finally {
      setDownloading(null);
    }
  };

  const total = sales.reduce((s, b) => s + parseFloat(b.total_amount || 0), 0);
  const totalPaid = sales.reduce((s, b) => s + parseFloat(b.paid_amount || 0), 0);
  const totalPending = sales.reduce((s, b) => s + parseFloat(b.pending_amount || 0), 0);

  return (
    <div>
      <h1 className="section-title" style={{ marginBottom: "24px" }}>Reports</h1>

      {/* Date Range */}
      <div className="card" style={{ marginBottom: "24px" }}>
        <div style={{ display: "flex", flexWrap: "wrap", alignItems: "flex-end", gap: "16px" }}>
          <div>
            <label style={{ fontSize: "11px", color: "#9ca3af", textTransform: "uppercase", display: "block", marginBottom: "4px" }}>From Date</label>
            <input type="date" className="input" value={from} onChange={e => setFrom(e.target.value)} />
          </div>
          <div>
            <label style={{ fontSize: "11px", color: "#9ca3af", textTransform: "uppercase", display: "block", marginBottom: "4px" }}>To Date</label>
            <input type="date" className="input" value={to} onChange={e => setTo(e.target.value)} />
          </div>
          <button className="btn-primary" onClick={fetchSales}>View Sales Report</button>
        </div>
      </div>

      {/* 6 Download Options */}
      <div className="card" style={{ marginBottom: "24px" }}>
        <p style={{ fontSize: "11px", color: "#9ca3af", textTransform: "uppercase", marginBottom: "16px", fontWeight: 600 }}>
          Download Excel Reports
        </p>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: "12px" }}>
          {DOWNLOAD_OPTIONS.map((opt, idx) => (
            <button
              key={opt.type}
              onClick={() => downloadExcel(opt.type)}
              disabled={downloading !== null}
              style={{
                display: "flex", alignItems: "center", gap: "12px",
                padding: "14px 16px", borderRadius: "10px", cursor: downloading ? "not-allowed" : "pointer",
                border: `2px solid ${downloading === opt.type ? opt.color : '#e5e7eb'}`,
                background: downloading === opt.type ? opt.color : "white",
                color: downloading === opt.type ? "white" : "#111",
                opacity: downloading !== null && downloading !== opt.type ? 0.5 : 1,
                transition: "all 0.15s", textAlign: "left"
              }}>
              <span style={{ fontSize: "20px" }}>{opt.icon}</span>
              <div>
                <div style={{ fontSize: "12px", fontWeight: 600 }}>
                  {downloading === opt.type ? "Downloading..." : `${idx + 1}. ${opt.label}`}
                </div>
                <div style={{ fontSize: "10px", color: downloading === opt.type ? "rgba(255,255,255,0.7)" : "#9ca3af", marginTop: "2px" }}>
                  {from} → {to}
                </div>
              </div>
              {downloading !== opt.type && (
                <span style={{ marginLeft: "auto", color: opt.color, fontWeight: 700 }}>⬇</span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Sales Table */}
      {loaded && (
        <>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "16px", marginBottom: "24px" }}>
            <div className="card">
              <p style={{ fontSize: "11px", color: "#9ca3af", textTransform: "uppercase", marginBottom: "6px" }}>Total Billed</p>
              <p style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: "1.8rem", fontWeight: 700 }}>₹{total.toLocaleString()}</p>
              <p style={{ fontSize: "12px", color: "#9ca3af", marginTop: "4px" }}>{sales.length} bills</p>
            </div>
            <div className="card">
              <p style={{ fontSize: "11px", color: "#9ca3af", textTransform: "uppercase", marginBottom: "6px" }}>Collected</p>
              <p style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: "1.8rem", fontWeight: 700, color: "#16a34a" }}>₹{totalPaid.toLocaleString()}</p>
            </div>
            <div className="card">
              <p style={{ fontSize: "11px", color: "#9ca3af", textTransform: "uppercase", marginBottom: "6px" }}>Pending</p>
              <p style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: "1.8rem", fontWeight: 700, color: "#C8102E" }}>₹{totalPending.toLocaleString()}</p>
            </div>
          </div>

          <div className="card" style={{ padding: 0, overflow: "hidden" }}>
            <table style={{ width: "100%", fontSize: "14px", borderCollapse: "collapse" }}>
              <thead className="table-head">
                <tr>
                  {["Bill #", "Date", "Shop", "Godown", "Total", "Paid", "Pending", "Status"].map(h => (
                    <th key={h}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {sales.map(b => (
                  <tr key={b.id} className="table-row">
                    <td style={{ fontWeight: 700, color: "#C8102E" }}>#{b.bill_number}</td>
                    <td>{new Date(b.created_at).toLocaleDateString("en-IN")}</td>
                    <td style={{ fontWeight: 500 }}>{b.shop_name}</td>
                    <td style={{ color: "#9ca3af" }}>{b.godown_name}</td>
                    <td style={{ fontWeight: 700 }}>₹{Number(b.total_amount).toLocaleString()}</td>
                    <td style={{ color: "#16a34a" }}>₹{Number(b.paid_amount || 0).toLocaleString()}</td>
                    <td style={{ color: "#C8102E", fontWeight: 600 }}>₹{Number(b.pending_amount || 0).toLocaleString()}</td>
                    <td><span className={b.status === "CLEARED" ? "badge-green" : b.status === "PARTIAL" ? "badge-red" : "badge-gray"}>{b.status}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
            {sales.length === 0 && <p style={{ textAlign: "center", color: "#9ca3af", padding: "32px", fontSize: "14px" }}>No sales in this period</p>}
          </div>
        </>
      )}
    </div>
  );
}