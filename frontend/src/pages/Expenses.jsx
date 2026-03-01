import { useEffect, useState } from "react";
import api from "../api/axios";

const TYPES = ["Current Bill", "Salaries", "WiFi Bill", "Diesel", "Food", "Vehicle Servicing", "Other"];
const empty = { type: "Diesel", amount: "", notes: "", expense_date: "" };

export default function Expenses() {
  const [expenses, setExpenses] = useState([]);
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState(empty);
  const [editing, setEditing] = useState(null);

  const load = () => api.get("/expenses").then(r => setExpenses(r.data));
  useEffect(() => { load(); }, []);

  const openAdd = () => { setForm(empty); setEditing(null); setModal(true); };
  const openEdit = (e) => { setForm(e); setEditing(e.id); setModal(true); };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (editing) await api.put(`/expenses/${editing}`, form);
    else await api.post("/expenses", form);
    setModal(false);
    load();
  };

  const handleDelete = async (id) => {
    if (!confirm("Delete this expense?")) return;
    await api.delete(`/expenses/${id}`);
    load();
  };

  const total = expenses.reduce((s, e) => s + parseFloat(e.amount || 0), 0);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="section-title">Expenses</h1>
        <div className="flex items-center gap-4">
          <span className="font-display text-xl font-bold text-primary">Total: ₹{total.toLocaleString()}</span>
          <button className="btn-primary" onClick={openAdd}>+ Add Expense</button>
        </div>
      </div>

      <div className="card p-0 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="table-head">
            <tr>
              {["Date", "Type", "Amount", "Notes", "Actions"].map(h => (
                <th key={h} className="px-4 py-3 text-left">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {expenses.map(e => (
              <tr key={e.id} className="table-row">
                <td className="px-4 py-3">{new Date(e.expense_date).toLocaleDateString("en-IN")}</td>
                <td className="px-4 py-3"><span className="badge-gray">{e.type}</span></td>
                <td className="px-4 py-3 font-bold text-primary">₹{Number(e.amount).toLocaleString()}</td>
                <td className="px-4 py-3 text-gray-500">{e.notes || "—"}</td>
                <td className="px-4 py-3">
                  <div className="flex gap-2">
                    <button onClick={() => openEdit(e)} className="text-primary hover:underline text-xs">Edit</button>
                    <button onClick={() => handleDelete(e.id)} className="text-gray-400 hover:text-red-600 text-xs">Delete</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {expenses.length === 0 && <p className="text-center text-gray-400 py-8 text-sm">No expenses yet</p>}
      </div>

      {modal && (
        <div className="modal-overlay">
          <div className="modal-box">
            <h2 className="font-display text-2xl font-bold mb-4">{editing ? "Edit Expense" : "Add Expense"}</h2>
            <form onSubmit={handleSubmit} className="space-y-3">
              <div>
                <label className="text-xs text-gray-500 uppercase">Expense Type</label>
                <select className="input mt-1" value={form.type} onChange={e => setForm({...form, type: e.target.value})}>
                  {TYPES.map(t => <option key={t}>{t}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs text-gray-500 uppercase">Amount ₹</label>
                <input type="number" className="input mt-1" value={form.amount} onChange={e => setForm({...form, amount: e.target.value})} required />
              </div>
              <div>
                <label className="text-xs text-gray-500 uppercase">Date</label>
                <input type="date" className="input mt-1" value={form.expense_date} onChange={e => setForm({...form, expense_date: e.target.value})} required />
              </div>
              <div>
                <label className="text-xs text-gray-500 uppercase">Notes</label>
                <textarea className="input mt-1" rows={2} value={form.notes} onChange={e => setForm({...form, notes: e.target.value})} />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="submit" className="btn-primary flex-1">Save</button>
                <button type="button" className="btn-outline flex-1" onClick={() => setModal(false)}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}