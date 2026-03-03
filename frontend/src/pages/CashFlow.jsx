import { useEffect, useState } from "react";
import api from "../api/axios";
import { useAuth } from "../context/AuthContext";

const today = new Date().toISOString().split("T")[0];
const emptyForm = { type: "DEPOSIT", amount: "", notes: "", transaction_date: today };

export default function CashFlow() {
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";
  const canEdit = !isAdmin;

  const [summary, setSummary] = useState({
    counter_sales_total: 0,
    bills_paid_total: 0,
    total_deposits: 0,
    total_withdrawals: 0,
    cash_in_hand: 0,
    cash_in_bank: 0
  });
  const [transactions, setTransactions] = useState([]);
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [editing, setEditing] = useState(null);
  const [loading, setLoading] = useState(false);

  const load = async () => {
    const res = await api.get("/bank-transactions");
    setSummary(res.data.summary);
    setTransactions(res.data.transactions);
  };

  useEffect(() => { load(); }, []);

  const openAdd = (defaultType = "DEPOSIT") => {
    setForm({ ...emptyForm, type: defaultType });
    setEditing(null);
    setModal(true);
  };

  const openEdit = (tx) => {
    setForm({
      type: tx.type,
      amount: tx.amount,
      notes: tx.notes || "",
      transaction_date: tx.transaction_date?.split("T")[0] || today
    });
    setEditing(tx.id);
    setModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (loading) return;
    setLoading(true);
    try {
      if (editing) await api.put(`/bank-transactions/${editing}`, form);
      else await api.post("/bank-transactions", form);
      setModal(false);
      setForm(emptyForm);
      setEditing(null);
      load();
    } catch (err) {
      alert(err.response?.data?.error || "Failed to save transaction");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm("Delete this transaction?")) return;
    try {
      await api.delete(`/bank-transactions/${id}`);
      load();
    } catch (err) {
      alert(err.response?.data?.error || "Failed to delete");
    }
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
          <h1 className="section-title">Cash Flow</h1>
          <p style={{ fontSize: "15px", color: "#888", marginTop: "4px" }}>
            Track cash in hand and cash in bank
          </p>
          {isAdmin && (
            <p style={{ color: "#d97706", fontSize: "14px", marginTop: "4px" }}>
              👁️ Admin View-Only Mode (No edit/delete allowed)
            </p>
          )}
        </div>
        {canEdit && (
          <div style={{ display: "flex", gap: "12px" }}>
            <button className="btn-primary" onClick={() => openAdd("DEPOSIT")}>
              + Deposit to Bank
            </button>
            <button className="btn-outline" onClick={() => openAdd("WITHDRAWAL")}>
              − Bank Withdrawal
            </button>
          </div>
        )}
      </div>

      {/* Summary Cards */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px", marginBottom: "32px" }}>
        {/* Cash in Hand */}
        <div className="card" style={{ padding: "24px" }}>
          <p style={labelStyle}>💵 Value in Cash</p>
          <p style={{ fontFamily: "'IBM Plex Sans', sans-serif", fontSize: "2.4rem", fontWeight: 700, color: "#C8102E", margin: "8px 0 16px" }}>
            ₹{Number(summary.cash_in_hand).toLocaleString()}
          </p>
          <div style={{ borderTop: "1px solid #f0f0f0", paddingTop: "12px", display: "flex", flexDirection: "column", gap: "6px" }}>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span style={{ fontSize: "13px", color: "#888" }}>Counter Sales</span>
              <span style={{ fontFamily: "'IBM Plex Sans', sans-serif", fontWeight: 600, fontSize: "14px" }}>
                ₹{Number(summary.counter_sales_total).toLocaleString()}
              </span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span style={{ fontSize: "13px", color: "#888" }}>Bills Collected</span>
              <span style={{ fontFamily: "'IBM Plex Sans', sans-serif", fontWeight: 600, fontSize: "14px" }}>
                ₹{Number(summary.bills_paid_total).toLocaleString()}
              </span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span style={{ fontSize: "13px", color: "#888" }}>Deposited to Bank</span>
              <span style={{ fontFamily: "'IBM Plex Sans', sans-serif", fontWeight: 600, fontSize: "14px", color: "#C8102E" }}>
                − ₹{Number(summary.total_deposits).toLocaleString()}
              </span>
            </div>
            {summary.total_withdrawals > 0 && (
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ fontSize: "13px", color: "#888" }}>Withdrawn from Bank</span>
                <span style={{ fontFamily: "'IBM Plex Sans', sans-serif", fontWeight: 600, fontSize: "14px", color: "#16a34a" }}>
                  + ₹{Number(summary.total_withdrawals).toLocaleString()}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Cash in Bank */}
        <div className="card" style={{ padding: "24px" }}>
          <p style={labelStyle}>🏦 Cash in Bank</p>
          <p style={{ fontFamily: "'IBM Plex Sans', sans-serif", fontSize: "2.4rem", fontWeight: 700, color: "#16a34a", margin: "8px 0 16px" }}>
            ₹{Number(summary.cash_in_bank).toLocaleString()}
          </p>
          <div style={{ borderTop: "1px solid #f0f0f0", paddingTop: "12px", display: "flex", flexDirection: "column", gap: "6px" }}>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span style={{ fontSize: "13px", color: "#888" }}>Total Deposited</span>
              <span style={{ fontFamily: "'IBM Plex Sans', sans-serif", fontWeight: 600, fontSize: "14px", color: "#16a34a" }}>
                ₹{Number(summary.total_deposits).toLocaleString()}
              </span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span style={{ fontSize: "13px", color: "#888" }}>Total Withdrawn</span>
              <span style={{ fontFamily: "'IBM Plex Sans', sans-serif", fontWeight: 600, fontSize: "14px", color: "#C8102E" }}>
                − ₹{Number(summary.total_withdrawals).toLocaleString()}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Transactions Table */}
      <div style={{ marginBottom: "12px" }}>
        <p style={{ ...labelStyle, fontSize: "13px" }}>Transaction History</p>
      </div>
      <div className="card" style={{ padding: 0, overflow: "hidden" }}>
        <table style={{ width: "100%", fontSize: "14px", borderCollapse: "collapse" }}>
          <thead className="table-head">
            <tr>
              {["Date", "Type", "Amount", "Notes", "Actions"].map(h => (
                <th key={h} style={{ padding: "12px 16px" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {transactions.map(tx => (
              <tr key={tx.id} className="table-row">
                <td style={{ color: "#555", fontSize: "15px", padding: "16px" }}>
                  {new Date(tx.transaction_date).toLocaleDateString("en-IN")}
                </td>
                <td style={{ padding: "16px" }}>
                  <span style={{
                    padding: "4px 12px",
                    borderRadius: "9999px",
                    fontSize: "13px",
                    fontWeight: 600,
                    background: tx.type === "DEPOSIT" ? "#dcfce7" : "#fee2e2",
                    color: tx.type === "DEPOSIT" ? "#15803d" : "#991b1b"
                  }}>
                    {tx.type === "DEPOSIT" ? "↑ Deposit" : "↓ Withdrawal"}
                  </span>
                </td>
                <td style={{
                  fontFamily: "'IBM Plex Sans', sans-serif",
                  fontWeight: 700,
                  fontSize: "19px",
                  color: tx.type === "DEPOSIT" ? "#16a34a" : "#C8102E",
                  padding: "16px"
                }}>
                  {tx.type === "DEPOSIT" ? "+" : "−"} ₹{Number(tx.amount).toLocaleString()}
                </td>
                <td style={{ color: "#888", fontSize: "15px", padding: "16px" }}>
                  {tx.notes || "—"}
                </td>
                <td style={{ padding: "16px" }}>
                  {canEdit && (
                    <div style={{ display: "flex", gap: "16px" }}>
                      <button onClick={() => openEdit(tx)} style={actionBtn("#C8102E")}>Edit</button>
                      <button onClick={() => handleDelete(tx.id)} style={actionBtn("#aaaaaa")}>Delete</button>
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {transactions.length === 0 && (
          <div style={{ textAlign: "center", padding: "48px 24px" }}>
            <p style={{
              fontFamily: "'Barlow Condensed', sans-serif",
              fontSize: "1.2rem",
              color: "#ccc",
              textTransform: "uppercase",
              letterSpacing: "0.1em"
            }}>
              No transactions yet
            </p>
          </div>
        )}
      </div>

      {/* Modal */}
      {modal && canEdit && (
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
                {editing ? "Edit Transaction" : form.type === "DEPOSIT" ? "Deposit to Bank" : "Bank Withdrawal"}
              </h2>
            </div>

            <form onSubmit={handleSubmit}>
              <div style={{ marginBottom: "20px" }}>
                <label style={labelStyle}>Transaction Type</label>
                <select
                  className="input"
                  style={{ marginTop: "6px" }}
                  value={form.type}
                  onChange={e => setForm({ ...form, type: e.target.value })}
                >
                  <option value="DEPOSIT">Deposit to Bank</option>
                  <option value="WITHDRAWAL">Bank Withdrawal</option>
                </select>
              </div>

              <div style={{ marginBottom: "20px" }}>
                <label style={labelStyle}>Amount ₹</label>
                <input
                  type="number"
                  className="input"
                  style={{ marginTop: "6px" }}
                  value={form.amount}
                  onChange={e => setForm({ ...form, amount: e.target.value })}
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
                  value={form.transaction_date}
                  onChange={e => setForm({ ...form, transaction_date: e.target.value })}
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
                  placeholder="Optional notes..."
                />
              </div>

              {/* Preview */}
              {form.amount > 0 && (
                <div style={{
                  background: form.type === "DEPOSIT" ? "#f0fdf4" : "#fff5f5",
                  borderLeft: `4px solid ${form.type === "DEPOSIT" ? "#16a34a" : "#C8102E"}`,
                  padding: "12px",
                  marginBottom: "20px",
                  borderRadius: "4px"
                }}>
                  <p style={{ fontSize: "15px", fontWeight: 700, color: form.type === "DEPOSIT" ? "#16a34a" : "#C8102E" }}>
                    {form.type === "DEPOSIT"
                      ? `₹${Number(form.amount).toLocaleString()} will move from Cash → Bank`
                      : `₹${Number(form.amount).toLocaleString()} will move from Bank → Cash`}
                  </p>
                </div>
              )}

              <div style={{ display: "flex", gap: "12px" }}>
                <button type="submit" className="btn-primary" style={{ flex: 1 }} disabled={loading}>
                  {loading ? "Saving..." : "Save"}
                </button>
                <button type="button" className="btn-outline" style={{ flex: 1 }} onClick={() => { setModal(false); setEditing(null); setForm(emptyForm); }}>
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