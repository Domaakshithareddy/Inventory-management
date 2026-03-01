import { useEffect, useState } from "react";
import api from "../api/axios";

function StatCard({ label, value, color = "#111111", sub }) {
  return (
    <div className="card">
      <p style={{ fontSize: "11px", color: "#9ca3af", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "8px" }}>{label}</p>
      <p style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: "2rem", fontWeight: 700, color }}>{value}</p>
      {sub && <p style={{ fontSize: "11px", color: "#9ca3af", marginTop: "4px" }}>{sub}</p>}
    </div>
  );
}

export default function Dashboard() {
  const [stats, setStats] = useState(null);

  const load = () => api.get("/reports/dashboard").then(r => setStats(r.data));

  useEffect(() => {
    load();
    // Live update every 30 seconds
    const interval = setInterval(load, 30000);
    return () => clearInterval(interval);
  }, []);

  if (!stats) return <div style={{ color: "#9ca3af", fontSize: "14px" }}>Loading...</div>;

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }}>
        <h1 className="section-title">Dashboard</h1>
        <button onClick={load} className="btn-outline" style={{ fontSize: "12px", padding: "4px 12px" }}>
          🔄 Refresh
        </button>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "16px", marginBottom: "24px" }}>
        <StatCard
          label="Stock Value"
          value={`₹${Number(stats.stock_value).toLocaleString()}`}
          color="#C8102E"
        />
        <StatCard
          label="Today's Total Sales"
          value={`₹${Number(stats.today_sales).toLocaleString()}`}
          color="#16a34a"
          sub={`Shop: ₹${Number(stats.today_shop_sales).toLocaleString()} | Counter: ₹${Number(stats.today_counter_sales).toLocaleString()}`}
        />
        <StatCard
          label="Counter Sales Today"
          value={`₹${Number(stats.today_counter_sales).toLocaleString()}`}
          color="#2563eb"
        />
        <StatCard
          label="Pending Bill Payments"
          value={`₹${Number(stats.pending_bills).toLocaleString()}`}
          color="#dc2626"
        />
        <StatCard
          label="Total Expenses"
          value={`₹${Number(stats.total_expenses).toLocaleString()}`}
        />
        <StatCard
          label="Company Pending"
          value={`₹${Number(stats.pending_purchases).toLocaleString()}`}
          color="#d97706"
        />
      </div>

      <div className="card">
        <p style={{ fontSize: "12px", color: "#9ca3af" }}>
          🔄 Auto-refreshes every 30 seconds &nbsp;|&nbsp; Last updated: {new Date().toLocaleTimeString("en-IN")}
        </p>
      </div>
    </div>
  );
}