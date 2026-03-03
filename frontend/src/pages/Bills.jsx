/* eslint-disable react-hooks/exhaustive-deps */
import { useEffect, useState } from "react";
import api from "../api/axios";
import { useAuth } from "../context/AuthContext";

const emptyItem = {
  product_id: "",
  quantity_cases: 0,
  quantity_units: 0,
  price_per_case: 0,
  price_per_unit: 0,
  bottles_per_case: 24,
  total_price: 0
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

export default function Bills() {
  const [bills, setBills] = useState([]);
  const [shops, setShops] = useState([]);
  const [products, setProducts] = useState([]);
  const [modal, setModal] = useState(false);
  const [editModal, setEditModal] = useState(null);
  const [editPaid, setEditPaid] = useState("");
  const [error, setError] = useState("");
  const [selectedBills, setSelectedBills] = useState([]);
  const [loading, setLoading] = useState(false);
  const [editLoading, setEditLoading] = useState(false);
  const { user } = useAuth();

  // New: date range states
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const [form, setForm] = useState({
    shop_id: "",
    paid_amount: "",
    items: [{ ...emptyItem }]
  });

  const load = async () => {
    const res = await api.get("/bills");
    let filtered = res.data;

    // Client-side date range filter
    if (startDate) {
      const start = new Date(startDate).setHours(0, 0, 0, 0);
      filtered = filtered.filter(b => new Date(b.created_at).getTime() >= start);
    }
    if (endDate) {
      const end = new Date(endDate).setHours(23, 59, 59, 999);
      filtered = filtered.filter(b => new Date(b.created_at).getTime() <= end);
    }

    setBills(filtered);
  };

  useEffect(() => {
    const fetchInitialData = async () => {
      await load();
      const shopsRes = await api.get("/shops");
      setShops(shopsRes.data);
      const productsRes = await api.get("/products");
      setProducts(productsRes.data);
    };
    fetchInitialData();
  }, []);

  // Apply date filter
  const applyFilter = () => {
    load();
  };

  // Clear filter → show all
  const clearFilter = () => {
    setStartDate("");
    setEndDate("");
    load();
  };

  const toggleSelect = (id) => {
    setSelectedBills(prev =>
      prev.includes(id) ? prev.filter(b => b !== id) : [...prev, id]
    );
  };

  const toggleSelectAll = () => {
    if (selectedBills.length === bills.length) setSelectedBills([]);
    else setSelectedBills(bills.map(b => b.id));
  };

  const printLoadSheet = async () => {
    if (selectedBills.length === 0) return;
    const allItemsData = await Promise.all(
      selectedBills.map(async (billId) => {
        const res = await api.get(`/bills/${billId}/items`);
        return res.data;
      })
    );
    const productMap = {};
    allItemsData.flat().forEach(item => {
      if (!productMap[item.product_name]) {
        productMap[item.product_name] = {
          cases: 0, bottles: 0, bpc: item.bottles_per_case || 24,
          pricePerCase: parseFloat(item.price_per_case || 0),
          pricePerUnit: parseFloat(item.price_per_unit || 0)
        };
      }
      productMap[item.product_name].cases += parseInt(item.quantity_cases || 0);
      productMap[item.product_name].bottles += parseInt(item.quantity_units || 0);
    });
    Object.keys(productMap).forEach(name => {
      const p = productMap[name];
      const total = (p.cases * p.bpc) + p.bottles;
      p.totalCases = Math.floor(total / p.bpc);
      p.extraBottles = total % p.bpc;
    });
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
      <html><head><title>Load Sheet</title><style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: 'Courier New', monospace; font-size: 14px; padding: 20px; max-width: 320px; margin: auto; }
        .title { font-size: 20px; font-weight: bold; text-align: center; margin-bottom: 4px; }
        .center { text-align: center; font-size: 12px; color: #555; margin-bottom: 8px; }
        .line { border-top: 2px dashed #000; margin: 10px 0; }
        table { width: 100%; border-collapse: collapse; }
        th { text-align: left; border-bottom: 2px solid #000; padding: 5px 4px; font-size: 12px; text-transform: uppercase; }
        td { padding: 8px 4px; border-bottom: 1px dotted #ccc; font-size: 14px; }
        .qty { text-align: center; font-size: 16px; font-weight: bold; }
        @media print { body { padding: 5px; } }
      </style></head><body>
      <div class="title">LOAD SHEET</div>
      <div class="center">${new Date().toLocaleDateString('en-IN')} | ${selectedBills.length} bills</div>
      <div class="line"></div>
      <table><thead><tr>
        <th>Product</th><th style="text-align:center">Cases</th><th style="text-align:center">Bottles</th><th style="text-align:right">Value</th>
      </tr></thead><tbody>
        ${Object.entries(productMap).map(([name, qty]) => {
          const value = (qty.totalCases * qty.pricePerCase) + (qty.extraBottles * qty.pricePerUnit);
          return `<tr><td style="font-weight:bold">${name}</td><td class="qty">${qty.totalCases}</td><td class="qty">${qty.extraBottles}</td><td style="text-align:right;font-weight:bold">₹${value.toLocaleString()}</td></tr>`;
        }).join('')}
      </tbody></table>
      <div class="line"></div>
      <div style="display:flex;justify-content:space-between;font-size:16px;font-weight:bold;padding:4px 0;">
        <span>TOTAL VALUE</span>
        <span>₹${Object.values(productMap).reduce((s, qty) => s + (qty.totalCases * qty.pricePerCase) + (qty.extraBottles * qty.pricePerUnit), 0).toLocaleString()}</span>
      </div>
      <div class="line"></div>
      <div class="center">Total Bills: ${selectedBills.length}</div>
      </body></html>
    `);
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
    printWindow.close();
  };

  const updateItem = (i, field, value) => {
    const items = [...form.items];
    items[i] = { ...items[i], [field]: value };
    if (field === "product_id") {
      const p = products.find(p => p.id === value);
      if (p) {
        items[i].price_per_case = parseFloat(p.selling_price) || 0;
        items[i].price_per_unit = parseFloat(p.selling_price_per_unit) || 0;
        items[i].bottles_per_case = parseInt(p.bottles_per_case) || 24;
      }
    }
    items[i].total_price =
      (parseFloat(items[i].quantity_cases || 0) * parseFloat(items[i].price_per_case || 0)) +
      (parseFloat(items[i].quantity_units || 0) * parseFloat(items[i].price_per_unit || 0));
    setForm({ ...form, items });
  };

  const addItem = () => setForm({ ...form, items: [...form.items, { ...emptyItem }] });
  const removeItem = (i) => setForm({ ...form, items: form.items.filter((_, idx) => idx !== i) });
  const grandTotal = form.items.reduce((s, i) => s + parseFloat(i.total_price || 0), 0);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (loading) return;
    setError("");
    for (const item of form.items) {
      if (!item.product_id) { setError("Please select a product for all items"); return; }
      if (parseFloat(item.quantity_cases || 0) === 0 && parseFloat(item.quantity_units || 0) === 0) {
        setError("Please enter quantity for all items"); return;
      }
    }
    setLoading(true);
    try {
      await api.post("/bills", {
        shop_id: form.shop_id,
        paid_amount: form.paid_amount || 0,
        items: form.items.map(item => ({
          product_id: item.product_id,
          quantity_cases: parseInt(item.quantity_cases || 0),
          quantity_units: parseInt(item.quantity_units || 0),
          bottles_per_case: parseInt(item.bottles_per_case || 24),
          price_per_case: parseFloat(item.price_per_case || 0),
          price_per_unit: parseFloat(item.price_per_unit || 0),
          total_price: parseFloat(item.total_price || 0)
        }))
      });
      setModal(false);
      setForm({ shop_id: "", paid_amount: "", items: [{ ...emptyItem }] });
      load();
    } catch (err) {
      setError(err.response?.data?.error || "Failed to generate bill");
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = async () => {
    if (editLoading) return;
    setEditLoading(true);
    try {
      await api.post(`/bills/${editModal}/payment`, { paid_amount: parseFloat(editPaid || 0) });
      setEditModal(null);
      setEditPaid("");
      load();
    } catch (err) {
      alert(err.response?.data?.error || "Failed to update payment");
    } finally {
      setEditLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm("Delete this bill? Inventory will be restored.")) return;
    try {
      await api.delete(`/bills/${id}`);
      setSelectedBills(prev => prev.filter(b => b !== id));
      load();
    } catch (err) {
      alert(err.response?.data?.error || "Failed to delete bill");
    }
  };

  const printBill = async (bill) => {
    const itemsRes = await api.get(`/bills/${bill.id}/items`);
    const items = itemsRes.data;
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
      <html><head><title>Bill #${bill.bill_number}</title><style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: 'Courier New', monospace; font-size: 13px; padding: 20px; max-width: 300px; margin: auto; }
        .center { text-align: center; } .bold { font-weight: bold; }
        .line { border-top: 1px dashed #000; margin: 8px 0; }
        .row { display: flex; justify-content: space-between; margin: 4px 0; }
        .title { font-size: 18px; font-weight: bold; text-align: center; margin-bottom: 4px; }
        .small { font-size: 11px; color: #555; }
        table { width: 100%; border-collapse: collapse; margin: 8px 0; }
        th { text-align: left; font-size: 11px; border-bottom: 1px solid #000; padding: 3px 0; }
        td { padding: 3px 0; font-size: 12px; }
        .total-row { font-weight: bold; font-size: 14px; }
        @media print { body { padding: 0; } }
      </style></head><body>
      <div class="title">INVENTORY</div>
      <div class="center small">${bill.godown_name}</div>
      <div class="line"></div>
      <div class="row"><span>Bill #:</span><span class="bold">${bill.bill_number}</span></div>
      <div class="row"><span>Date:</span><span>${new Date(bill.created_at).toLocaleDateString('en-IN')}</span></div>
      <div class="row"><span>Shop:</span><span class="bold">${bill.shop_name}</span></div>
      <div class="line"></div>
      <table><thead><tr><th>Product</th><th>Qty</th><th>Rate</th><th>Amt</th></tr></thead><tbody>
        ${items.map(item => `<tr>
          <td>${item.product_name}</td>
          <td>${item.quantity_cases > 0 ? item.quantity_cases + 'C' : ''}${item.quantity_units > 0 ? ' ' + item.quantity_units + 'B' : ''}</td>
          <td>₹${item.quantity_cases > 0 ? item.price_per_case : item.price_per_unit}</td>
          <td>₹${Number(item.total_price).toLocaleString()}</td>
        </tr>`).join('')}
      </tbody></table>
      <div class="line"></div>
      <div class="row total-row"><span>TOTAL</span><span>₹${Number(bill.total_amount).toLocaleString()}</span></div>
      <div class="row"><span>Paid</span><span>₹${Number(bill.paid_amount || 0).toLocaleString()}</span></div>
      <div class="row bold"><span>Pending</span><span>₹${Number(bill.pending_amount || 0).toLocaleString()}</span></div>
      <div class="line"></div>
      <div class="center small" style="margin-top:12px;">Thank you!</div>
      </body></html>
    `);
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
    printWindow.close();
  };

  const statusColor = (s) => s === "CLEARED" ? "badge-green" : s === "PARTIAL" ? "badge-red" : "badge-gray";

  return (
    <div>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: "20px", marginTop: "20px" }}>
        <div>
          <h1 className="section-title">Bills</h1>
          {selectedBills.length > 0 && (
            <p style={{ fontSize: "15px", color: "#888", marginTop: "4px" }}>
              {selectedBills.length} bill{selectedBills.length > 1 ? "s" : ""} selected for load sheet
            </p>
          )}
        </div>
        <div style={{ display: "flex", gap: "12px" }}>
          {selectedBills.length > 0 && (
            <button onClick={printLoadSheet} className="btn-secondary">
              Print Load Sheet ({selectedBills.length})
            </button>
          )}
          {user?.role !== "admin" && (
            <button className="btn-primary" onClick={() => {
              setForm({ shop_id: "", paid_amount: "", items: [{ ...emptyItem }] });
              setError("");
              setModal(true);
            }}>
              + New Bill
            </button>
          )}
        </div>
      </div>

      {/* Date Range Filter */}
      <div style={{
        background: "#f8f8f8",
        borderLeft: "4px solid #C8102E",
        padding: "16px",
        marginBottom: "24px",
        borderRadius: "4px"
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "16px", flexWrap: "wrap" }}>
          <div>
            <label style={{ fontSize: "11px", color: "#888", textTransform: "uppercase" }}>Start Date</label>
            <input
              type="date"
              className="input"
              style={{ marginTop: "6px" }}
              value={startDate}
              onChange={e => setStartDate(e.target.value)}
            />
          </div>
          <div>
            <label style={{ fontSize: "11px", color: "#888", textTransform: "uppercase" }}>End Date</label>
            <input
              type="date"
              className="input"
              style={{ marginTop: "6px" }}
              value={endDate}
              onChange={e => setEndDate(e.target.value)}
            />
          </div>
          <div style={{ display: "flex", gap: "12px" }}>
            <button className="btn-primary" onClick={applyFilter} style={{ marginTop: "20px" }}>
              Apply Filter
            </button>
            <button className="btn-outline" onClick={clearFilter} style={{ marginTop: "20px" }}>
              Clear
            </button>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="card" style={{ padding: 0, overflow: "hidden" }}>
        <table style={{ width: "100%", fontSize: "14px", borderCollapse: "collapse" }}>
          <thead className="table-head">
            <tr>
              <th style={{ width: "40px", textAlign: "center" }}>
                <input type="checkbox"
                  checked={selectedBills.length === bills.length && bills.length > 0}
                  onChange={toggleSelectAll}
                  style={{ accentColor: "#C8102E" }}
                />
              </th>
              {["Bill #", "Date", "Shop", "Godown", "Total", "Paid", "Pending", "Status", "Actions"].map(h => (
                <th key={h}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {bills.map(b => (
              <tr key={b.id} className="table-row"
                style={{ background: selectedBills.includes(b.id) ? "#fff8f8" : "" }}>
                <td style={{ textAlign: "center" }}>
                  <input type="checkbox"
                    checked={selectedBills.includes(b.id)}
                    onChange={() => toggleSelect(b.id)}
                    style={{ accentColor: "#C8102E" }}
                  />
                </td>
                <td style={{ fontFamily: "'IBM Plex Sans', sans-serif", fontWeight: 700, fontSize: "20px", color: "#C8102E" }}>#{b.bill_number}</td>
                <td style={{ color: "#555", fontSize: "15px" }}>{new Date(b.created_at).toLocaleDateString("en-IN")}</td>
                <td style={{ fontWeight: 600, fontSize: "16px" }}>{b.shop_name}</td>
                <td style={{ color: "#888", fontSize: "15px" }}>{b.godown_name}</td>
                <td style={{ fontFamily: "'IBM Plex Sans', sans-serif", fontWeight: 700, fontSize: "20px" }}>₹{Number(b.total_amount).toLocaleString()}</td>
                <td style={{ fontFamily: "'IBM Plex Sans', sans-serif", fontWeight: 700, fontSize: "19px", color: "#16a34a" }}>₹{Number(b.paid_amount || 0).toLocaleString()}</td>
                <td style={{ fontFamily: "'IBM Plex Sans', sans-serif", fontWeight: 700, fontSize: "19px", color: "#C8102E" }}>₹{Number(b.pending_amount || 0).toLocaleString()}</td>
                <td><span className={statusColor(b.status)}>{b.status}</span></td>
                <td>
                  <div style={{ display: "flex", gap: "16px" }}>
                    <button onClick={() => printBill(b)} style={actionBtn("#2563eb")}>Print</button>
                    <button onClick={() => { setEditModal(b.id); setEditPaid(b.paid_amount || ""); }} style={actionBtn("#C8102E")}>Edit</button>
                    <button onClick={() => handleDelete(b.id)} style={actionBtn("#aaaaaa")}>Delete</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {bills.length === 0 && (
          <div style={{ textAlign: "center", padding: "48px 24px" }}>
            <p style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: "1.2rem", color: "#ccc", textTransform: "uppercase", letterSpacing: "0.1em" }}>No bills yet</p>
          </div>
        )}
      </div>

      {/* New Bill Modal - unchanged */}
      {modal && (
        <div className="modal-overlay">
          <div className="modal-box" style={{ maxWidth: "720px", maxHeight: "90vh", overflowY: "auto" }}>
            <div style={{ borderBottom: "2px solid #f0f0f0", paddingBottom: "16px", marginBottom: "20px" }}>
              <h2 style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: "2rem", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.04em" }}>New Bill</h2>
            </div>
            {error && (
              <div style={{ background: "#111", borderLeft: "4px solid #C8102E", color: "white", padding: "12px 16px", fontSize: "13px", marginBottom: "16px", fontFamily: "'Barlow Condensed', sans-serif", letterSpacing: "0.04em" }}>
                {error}
              </div>
            )}
            <form onSubmit={handleSubmit}>
              <div style={{ marginBottom: "20px" }}>
                <label style={labelStyle}>Shop</label>
                <select className="input" style={{ marginTop: "6px" }} value={form.shop_id}
                  onChange={e => setForm({ ...form, shop_id: e.target.value })} required>
                  <option value="">Select Shop</option>
                  {shops.map(s => <option key={s.id} value={s.id}>{s.name} — {s.owner_name}</option>)}
                </select>
              </div>
              <div style={{ borderTop: "2px solid #f0f0f0", paddingTop: "16px", marginBottom: "16px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
                  <label style={labelStyle}>Products</label>
                  <button type="button" onClick={addItem}
                    style={{ color: "#C8102E", fontSize: "12px", background: "none", border: "none", cursor: "pointer", fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em" }}>
                    + Add Product
                  </button>
                </div>
                {form.items.map((item, i) => {
                  const selectedProduct = products.find(p => p.id === item.product_id);
                  return (
                    <div key={i} style={{ background: "#f8f8f8", borderLeft: "3px solid #e0e0e0", padding: "12px", marginBottom: "10px" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px", alignItems: "center" }}>
                        <select className="input" style={{ flex: 1, marginRight: "8px" }}
                          value={item.product_id}
                          onChange={e => updateItem(i, "product_id", e.target.value)} required>
                          <option value="">Select Product</option>
                          {products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                        </select>
                        {form.items.length > 1 && (
                          <button type="button" onClick={() => removeItem(i)}
                            style={{ color: "#aaa", background: "none", border: "none", cursor: "pointer", fontSize: "16px" }}>✕</button>
                        )}
                      </div>
                      {selectedProduct && (
                        <p style={{ fontSize: "11px", color: "#aaa", marginBottom: "10px", fontFamily: "'Barlow Condensed', sans-serif", letterSpacing: "0.04em" }}>
                          ₹{selectedProduct.selling_price}/case &nbsp;|&nbsp; ₹{selectedProduct.selling_price_per_unit}/bottle &nbsp;|&nbsp; {selectedProduct.bottles_per_case} bottles/case
                        </p>
                      )}
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "12px", alignItems: "end" }}>
                        <div>
                          <label style={labelStyle}>Cases</label>
                          <input type="number" className="input" style={{ marginTop: "4px" }}
                            value={item.quantity_cases} onChange={e => updateItem(i, "quantity_cases", e.target.value)} min="0" placeholder="0" />
                        </div>
                        <div>
                          <label style={labelStyle}>Extra Bottles</label>
                          <input type="number" className="input" style={{ marginTop: "4px" }}
                            value={item.quantity_units} onChange={e => updateItem(i, "quantity_units", e.target.value)} min="0" placeholder="0" />
                        </div>
                        <div style={{ textAlign: "right" }}>
                          <span style={{ fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 700, fontSize: "1.4rem", color: "#111" }}>
                            ₹{parseFloat(item.total_price || 0).toLocaleString()}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
                <div style={{ textAlign: "right", fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 800, fontSize: "1.3rem", marginTop: "8px", borderTop: "2px solid #111", paddingTop: "8px" }}>
                  Total: ₹{grandTotal.toLocaleString()}
                </div>
              </div>
              <div style={{ background: "#f8f8f8", borderLeft: "4px solid #C8102E", padding: "16px", marginBottom: "20px" }}>
                <label style={labelStyle}>Amount Paid Now (0 if pending)</label>
                <input type="number" className="input" style={{ marginTop: "6px" }}
                  value={form.paid_amount} onChange={e => setForm({ ...form, paid_amount: e.target.value })}
                  placeholder="0" min="0" />
                {parseFloat(form.paid_amount) > 0 && (
                  <p style={{ fontSize: "12px", color: "#C8102E", marginTop: "6px", fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 700 }}>
                    Pending: ₹{Math.max(0, grandTotal - parseFloat(form.paid_amount || 0)).toLocaleString()}
                  </p>
                )}
              </div>
              <div style={{ display: "flex", gap: "12px" }}>
                <button type="submit" className="btn-primary" style={{ flex: 1 }} disabled={loading}>{loading ? "Saving..." : "Generate Bill"}</button>
                <button type="button" className="btn-outline" style={{ flex: 1 }} onClick={() => setModal(false)}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Payment Modal - unchanged */}
      {editModal && (() => {
        const b = bills.find(b => b.id === editModal);
        if (!b) return null;
        const newPending = Math.max(0, parseFloat(b.total_amount) - parseFloat(editPaid || 0));
        const newStatus = parseFloat(editPaid || 0) >= parseFloat(b.total_amount) ? "CLEARED"
          : parseFloat(editPaid || 0) > 0 ? "PARTIAL" : "PENDING";
        return (
          <div className="modal-overlay">
            <div className="modal-box" style={{ maxWidth: "400px" }}>
              <div style={{ borderBottom: "2px solid #f0f0f0", paddingBottom: "16px", marginBottom: "20px" }}>
                <h2 style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: "2rem", fontWeight: 800, textTransform: "uppercase" }}>Edit Payment</h2>
                <p style={{ fontSize: "13px", color: "#888", marginTop: "4px" }}>
                  Bill #{b.bill_number} — {b.shop_name}
                </p>
              </div>

              <div style={{ marginBottom: "20px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 0", borderBottom: "1px solid #f0f0f0" }}>
                  <span style={labelStyle}>Bill Total</span>
                  <span style={{ fontFamily: "'IBM Plex Sans', sans-serif", fontWeight: 700, fontSize: "1.3rem" }}>₹{Number(b.total_amount).toLocaleString()}</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 0", borderBottom: "1px solid #f0f0f0" }}>
                  <span style={labelStyle}>Currently Paid</span>
                  <span style={{ fontFamily: "'IBM Plex Sans', sans-serif", fontWeight: 700, fontSize: "1.3rem", color: "#16a34a" }}>₹{Number(b.paid_amount || 0).toLocaleString()}</span>
                </div>
              </div>

              <label style={labelStyle}>Set Total Paid Amount</label>
              <input
                type="number"
                className="input"
                style={{ marginTop: "6px", marginBottom: "16px", fontSize: "18px", fontWeight: 700 }}
                value={editPaid}
                onChange={e => setEditPaid(e.target.value)}
                placeholder="0"
                min="0"
                autoFocus
              />

              {editPaid !== "" && (
                <div style={{ background: "#f8f8f8", borderLeft: "4px solid #111", padding: "14px", marginBottom: "20px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "10px" }}>
                    <span style={labelStyle}>Pending after save</span>
                    <span style={{ fontFamily: "'IBM Plex Sans', sans-serif", fontWeight: 700, color: newPending > 0 ? "#C8102E" : "#16a34a" }}>
                      ₹{newPending.toLocaleString()}
                    </span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={labelStyle}>New Status</span>
                    <span style={{
                      fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 700, fontSize: "13px",
                      padding: "4px 12px",
                      background: newStatus === "CLEARED" ? "#16a34a" : newStatus === "PARTIAL" ? "#C8102E" : "#e8e8e8",
                      color: newStatus === "PENDING" ? "#444" : "white"
                    }}>{newStatus}</span>
                  </div>
                </div>
              )}

              <div style={{ display: "flex", gap: "12px" }}>
                <button onClick={handleEdit} className="btn-primary" style={{ flex: 1 }} disabled={editLoading}>{editLoading ? "Saving..." : "Save"}</button>
                <button onClick={() => { setEditModal(null); setEditPaid(""); }} className="btn-outline" style={{ flex: 1 }}>Cancel</button>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
}