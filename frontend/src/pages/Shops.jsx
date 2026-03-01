import { useEffect, useState } from "react";
import api from "../api/axios";

const empty = { name: "", owner_name: "", phone: "", route_id: "" };

export default function Shops() {
  const [shops, setShops] = useState([]);
  const [routes, setRoutes] = useState([]);
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState(empty);
  const [editing, setEditing] = useState(null);

  const load = () => api.get("/shops").then(r => setShops(r.data));
  useEffect(() => {
    load();
    api.get("/routes").then(r => setRoutes(r.data));
  }, []);

  const openAdd = () => { setForm(empty); setEditing(null); setModal(true); };
  const openEdit = (s) => { setForm(s); setEditing(s.id); setModal(true); };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (editing) await api.put(`/shops/${editing}`, form);
    else await api.post("/shops", form);
    setModal(false);
    load();
  };

  const handleDelete = async (id) => {
    if (!confirm("Delete this shop?")) return;
    await api.delete(`/shops/${id}`);
    load();
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="section-title">Shops</h1>
        <button className="btn-primary" onClick={openAdd}>+ Add Shop</button>
      </div>

      <div className="card p-0 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="table-head">
            <tr>
              {["Shop Name", "Owner", "Phone", "Route", "Actions"].map(h => (
                <th key={h} className="px-4 py-3 text-left">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {shops.map(s => (
              <tr key={s.id} className="table-row">
                <td className="px-4 py-3 font-medium">{s.name}</td>
                <td className="px-4 py-3">{s.owner_name}</td>
                <td className="px-4 py-3">{s.phone}</td>
                <td className="px-4 py-3"><span className="badge-gray">{s.route_name || "—"}</span></td>
                <td className="px-4 py-3">
                  <div className="flex gap-2">
                    <button onClick={() => openEdit(s)} className="text-primary hover:underline text-xs">Edit</button>
                    <button onClick={() => handleDelete(s.id)} className="text-gray-400 hover:text-red-600 text-xs">Delete</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {shops.length === 0 && <p className="text-center text-gray-400 py-8 text-sm">No shops yet</p>}
      </div>

      {modal && (
        <div className="modal-overlay">
          <div className="modal-box">
            <h2 className="font-display text-2xl font-bold mb-4">{editing ? "Edit Shop" : "Add Shop"}</h2>
            <form onSubmit={handleSubmit} className="space-y-3">
              <div>
                <label className="text-xs text-gray-500 uppercase">Shop Name</label>
                <input className="input mt-1" value={form.name} onChange={e => setForm({...form, name: e.target.value})} required />
              </div>
              <div>
                <label className="text-xs text-gray-500 uppercase">Owner Name</label>
                <input className="input mt-1" value={form.owner_name} onChange={e => setForm({...form, owner_name: e.target.value})} />
              </div>
              <div>
                <label className="text-xs text-gray-500 uppercase">Phone</label>
                <input className="input mt-1" value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} />
              </div>
              <div>
                <label className="text-xs text-gray-500 uppercase">Route</label>
                <select className="input mt-1" value={form.route_id} onChange={e => setForm({...form, route_id: e.target.value})}>
                  <option value="">Select Route</option>
                  {routes.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
                </select>
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