import { useState } from "react";
import api from "../api/axios";

export default function Reports() {
  const today = new Date().toISOString().split("T")[0];
  const [from, setFrom] = useState(today);
  const [to, setTo] = useState(today);
  const [sales, setSales] = useState([]);
  const [loaded, setLoaded] = useState(false);

  const fetchSales = async () => {
    const r = await api.get(`/reports/sales?from=${from}&to=${to}`);
    setSales(r.data);
    setLoaded(true);
  };

  const downloadExcel = () => {
    const token = localStorage.getItem("token");
    window.open(`http://localhost:3001/api/reports/download/excel?from=${from}&to=${to}`, "_blank");
  };

  const downloadPDF = () => {
    window.open(`http://localhost:3001/api/reports/download/pdf?from=${from}&to=${to}`, "_blank");
  };

  const total = sales.reduce((s, b) => s + parseFloat(b.total_amount || 0), 0);

  return (
    <div>
      <h1 className="section-title mb-6">Reports</h1>

      <div className="card mb-6">
        <div className="flex flex-wrap items-end gap-4">
          <div>
            <label className="text-xs text-gray-500 uppercase block mb-1">From Date</label>
            <input type="date" className="input" value={from} onChange={e => setFrom(e.target.value)} />
          </div>
          <div>
            <label className="text-xs text-gray-500 uppercase block mb-1">To Date</label>
            <input type="date" className="input" value={to} onChange={e => setTo(e.target.value)} />
          </div>
          <button className="btn-primary" onClick={fetchSales}>View Report</button>
          <button className="btn-secondary" onClick={downloadExcel}>⬇ Excel</button>
          <button className="btn-outline" onClick={downloadPDF}>⬇ PDF</button>
        </div>
      </div>

      {loaded && (
        <>
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm text-gray-500">{sales.length} bills found</p>
            <span className="font-display text-2xl font-bold text-primary">Total: ₹{total.toLocaleString()}</span>
          </div>

          <div className="card p-0 overflow-hidden">
            <table className="w-full text-sm">
              <thead className="table-head">
                <tr>
                  {["Bill #", "Date", "Shop", "Godown", "Amount"].map(h => (
                    <th key={h} className="px-4 py-3 text-left">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {sales.map(b => (
                  <tr key={b.id} className="table-row">
                    <td className="px-4 py-3 font-bold text-primary">#{b.bill_number}</td>
                    <td className="px-4 py-3">{new Date(b.created_at).toLocaleDateString("en-IN")}</td>
                    <td className="px-4 py-3 font-medium">{b.shop_name}</td>
                    <td className="px-4 py-3 text-gray-500">{b.godown_name}</td>
                    <td className="px-4 py-3 font-bold">₹{Number(b.total_amount).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {sales.length === 0 && <p className="text-center text-gray-400 py-8 text-sm">No sales in this period</p>}
          </div>
        </>
      )}
    </div>
  );
}