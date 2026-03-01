import { useEffect, useState } from "react";
import api from "../api/axios";

const empty = { name: "", phone: "", address: "" };

export default function Companies() {
  const [companies, setCompanies] = useState([]);
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState(empty);
  const [editing, setEditing] = useState(null);

  const load = () => api.get("/companies").then(r => setCompanies(r.data));
  useEffect(() => { load(); }, []);

  const openAdd = () => { setForm(empty); setEditing(null); setModal(true); };
  const openEdit = (c) => { setForm(c); setEditing(c.id); setModal(true); };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (editing) await api.put(`/companies/${editing}`, form);
    else await api.post("/companies", form);
    setModal(false);
    load();
  };

  const handleDelete = async (id) => {
    if (!confirm("Delete this company?")) return;
    await api.delete(`/companies/${id}`);
    load();
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="section-title">Companies</h1>
        <button className="btn-primary" onClick={openAdd}>+ Add Company</button>
      </div>

      <div className="card p-0 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="table-head">
            <tr>
              {["Name", "Phone", "Address", "Actions"].map(h => (
                <th key={h} className="px-4 py-3 text-left">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {companies.map(c => (
              <tr key={c.id} className="table-row">
                <td className="px-4 py-3 font-medium">{c.name}</td>
                <td className="px-4 py-3">{c.phone}</td>
                <td className="px-4 py-3 text-gray-500">{c.address}</td>
                <td className="px-4 py-3">
                  <div className="flex gap-2">
                    <button onClick={() => openEdit(c)} className="text-primary hover:underline text-xs">Edit</button>
                    <button onClick={() => handleDelete(c.id)} className="text-gray-400 hover:text-red-600 text-xs">Delete</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {companies.length === 0 && <p className="text-center text-gray-400 py-8 text-sm">No companies yet</p>}
      </div>

      {modal && (
        <div className="modal-overlay">
          <div className="modal-box">
            <h2 className="font-display text-2xl font-bold mb-4">{editing ? "Edit Company" : "Add Company"}</h2>
            <form onSubmit={handleSubmit} className="space-y-3">
              <div>
                <label className="text-xs text-gray-500 uppercase">Company Name</label>
                <input className="input mt-1" value={form.name} onChange={e => setForm({...form, name: e.target.value})} required />
              </div>
              <div>
                <label className="text-xs text-gray-500 uppercase">Phone</label>
                <input className="input mt-1" value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} />
              </div>
              <div>
                <label className="text-xs text-gray-500 uppercase">Address</label>
                <textarea className="input mt-1" rows={3} value={form.address} onChange={e => setForm({...form, address: e.target.value})} />
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