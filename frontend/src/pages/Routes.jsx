import { useEffect, useState } from "react";
import api from "../api/axios";

const empty = { name: "", driver_name: "" };

export default function AppRoutes() {
  const [routes, setRoutes] = useState([]);
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState(empty);
  const [editing, setEditing] = useState(null);

  const load = () => api.get("/routes").then(r => setRoutes(r.data));
  useEffect(() => { load(); }, []);

  const openAdd = () => { setForm(empty); setEditing(null); setModal(true); };
  const openEdit = (r) => { setForm(r); setEditing(r.id); setModal(true); };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (editing) await api.put(`/routes/${editing}`, form);
    else await api.post("/routes", form);
    setModal(false);
    load();
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="section-title">Routes</h1>
        <button className="btn-primary" onClick={openAdd}>+ Add Route</button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {routes.map(r => (
          <div key={r.id} className="card">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="font-bold text-dark text-lg">{r.name}</h3>
                <p className="text-gray-500 text-sm mt-1">🚗 {r.driver_name || "No driver"}</p>
              </div>
              <button onClick={() => openEdit(r)} className="text-primary hover:underline text-xs">Edit</button>
            </div>
          </div>
        ))}
        {routes.length === 0 && <p className="text-gray-400 text-sm col-span-3">No routes yet</p>}
      </div>

      {modal && (
        <div className="modal-overlay">
          <div className="modal-box">
            <h2 className="font-display text-2xl font-bold mb-4">{editing ? "Edit Route" : "Add Route"}</h2>
            <form onSubmit={handleSubmit} className="space-y-3">
              <div>
                <label className="text-xs text-gray-500 uppercase">Route Name</label>
                <input className="input mt-1" value={form.name} onChange={e => setForm({...form, name: e.target.value})} required />
              </div>
              <div>
                <label className="text-xs text-gray-500 uppercase">Driver Name</label>
                <input className="input mt-1" value={form.driver_name} onChange={e => setForm({...form, driver_name: e.target.value})} />
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