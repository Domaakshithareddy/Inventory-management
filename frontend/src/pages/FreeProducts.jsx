import { useEffect, useState } from "react";
import api from "../api/axios";

const empty = { product_id: "", quantity_units: "", notes: "", given_date: "" };

export default function FreeProducts() {
  const [items, setItems] = useState([]);
  const [products, setProducts] = useState([]);
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState(empty);
  const [editing, setEditing] = useState(null);

  const load = () => api.get("/free-products").then(r => setItems(r.data));
  useEffect(() => { load(); api.get("/products").then(r => setProducts(r.data)); }, []);

  const openAdd = () => { setForm(empty); setEditing(null); setModal(true); };
  const openEdit = (i) => { setForm(i); setEditing(i.id); setModal(true); };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (editing) await api.put(`/free-products/${editing}`, form);
    else await api.post("/free-products", form);
    setModal(false);
    load();
  };

  const handleDelete = async (id) => {
    if (!confirm("Delete?")) return;
    await api.delete(`/free-products/${id}`);
    load();
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="section-title">Free Products</h1>
          <p className="text-xs text-gray-400 mt-1">Does not affect inventory or profit</p>
        </div>
        <button className="btn-primary" onClick={openAdd}>+ Add Entry</button>
      </div>

      <div className="card p-0 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="table-head">
            <tr>
              {["Date", "Product", "Bottles", "Notes", "Actions"].map(h => (
                <th key={h} className="px-4 py-3 text-left">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {items.map(i => (
              <tr key={i.id} className="table-row">
                <td className="px-4 py-3">{new Date(i.given_date).toLocaleDateString("en-IN")}</td>
                <td className="px-4 py-3 font-medium">{i.product_name}</td>
                <td className="px-4 py-3"><span className="badge-green">{i.quantity_units} bottles</span></td>
                <td className="px-4 py-3 text-gray-500">{i.notes || "—"}</td>
                <td className="px-4 py-3">
                  <div className="flex gap-2">
                    <button onClick={() => openEdit(i)} className="text-primary hover:underline text-xs">Edit</button>
                    <button onClick={() => handleDelete(i.id)} className="text-gray-400 hover:text-red-600 text-xs">Delete</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {items.length === 0 && <p className="text-center text-gray-400 py-8 text-sm">No free products recorded</p>}
      </div>

      {modal && (
        <div className="modal-overlay">
          <div className="modal-box">
            <h2 className="font-display text-2xl font-bold mb-4">{editing ? "Edit Entry" : "Add Free Product"}</h2>
            <form onSubmit={handleSubmit} className="space-y-3">
              <div>
                <label className="text-xs text-gray-500 uppercase">Product</label>
                <select className="input mt-1" value={form.product_id} onChange={e => setForm({...form, product_id: e.target.value})} required>
                  <option value="">Select Product</option>
                  {products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs text-gray-500 uppercase">Number of Bottles</label>
                <input type="number" className="input mt-1" value={form.quantity_units} onChange={e => setForm({...form, quantity_units: e.target.value})} required min="1" />
              </div>
              <div>
                <label className="text-xs text-gray-500 uppercase">Date</label>
                <input type="date" className="input mt-1" value={form.given_date} onChange={e => setForm({...form, given_date: e.target.value})} required />
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