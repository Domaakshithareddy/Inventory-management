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

export default function Bills() {
  const [bills, setBills] = useState([]);
  const [shops, setShops] = useState([]);
  const [products, setProducts] = useState([]);
  const [modal, setModal] = useState(false);
  const [payModal, setPayModal] = useState(null);
  const [payAmount, setPayAmount] = useState("");
  const [error, setError] = useState("");
  const [selectedBills, setSelectedBills] = useState([]);
  const { user } = useAuth();

  const [form, setForm] = useState({
    shop_id: "",
    paid_amount: "",
    items: [{ ...emptyItem }]
  });

  const load = () => api.get("/bills").then(r => setBills(r.data));
  useEffect(() => {
    load();
    api.get("/shops").then(r => setShops(r.data));
    api.get("/products").then(r => setProducts(r.data));
  }, []);

  const toggleSelect = (id) => {
    setSelectedBills(prev =>
      prev.includes(id) ? prev.filter(b => b !== id) : [...prev, id]
    );
  };

  const toggleSelectAll = () => {
    if (selectedBills.length === bills.length) {
      setSelectedBills([]);
    } else {
      setSelectedBills(bills.map(b => b.id));
    }
  };

  const printLoadSheet = async () => {
    if (selectedBills.length === 0) return;

    const allItemsData = await Promise.all(
        selectedBills.map(async (billId) => {
        const res = await api.get(`/bills/${billId}/items`);
        return res.data;
        })
    );

  // Combine quantities by product name
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

  // Normalize extra bottles into cases
    Object.keys(productMap).forEach(name => {
        const p = productMap[name];
        const total = (p.cases * p.bpc) + p.bottles;
        p.totalCases = Math.floor(total / p.bpc);
        p.extraBottles = total % p.bpc;
    });

  const printWindow = window.open('', '_blank');
  printWindow.document.write(`
    <html>
    <head>
      <title>Load Sheet</title>
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: 'Courier New', monospace; font-size: 14px; padding: 20px; max-width: 320px; margin: auto; }
        .title { font-size: 20px; font-weight: bold; text-align: center; margin-bottom: 4px; }
        .center { text-align: center; font-size: 12px; color: #555; margin-bottom: 8px; }
        .line { border-top: 2px dashed #000; margin: 10px 0; }
        table { width: 100%; border-collapse: collapse; }
        th { text-align: left; border-bottom: 2px solid #000; padding: 5px 4px; font-size: 12px; text-transform: uppercase; }
        td { padding: 8px 4px; border-bottom: 1px dotted #ccc; font-size: 14px; }
        .product { font-weight: bold; }
        .qty { text-align: center; font-size: 16px; font-weight: bold; }
        @media print { body { padding: 5px; } }
      </style>
    </head>
    <body>
      <div class="title">LOAD SHEET</div>
      <div class="center">${new Date().toLocaleDateString('en-IN')} | ${selectedBills.length} bills</div>
      <div class="line"></div>
      <table>
        <thead>
          <tr>
            <th>Product</th>
            <th style="text-align:center">Cases</th>
            <th style="text-align:center">Bottles</th>
            <th style="text-align:right">Value</th>
          </tr>
        </thead>
        <tbody>
          ${Object.entries(productMap).map(([name, qty]) => {
            const value = (qty.totalCases * qty.pricePerCase) + (qty.extraBottles * qty.pricePerUnit);
            return `
              <tr>
                <td class="product">${name}</td>
                <td class="qty">${qty.totalCases}</td>
                <td class="qty">${qty.extraBottles}</td>
                <td style="text-align:right; font-weight:bold">₹${value.toLocaleString()}</td>
              </tr>
            `;
          }).join('')}
        </tbody>
      </table>
      <div class="line"></div>
      <div style="display:flex; justify-content:space-between; font-size:16px; font-weight:bold; padding: 4px 0;">
        <span>TOTAL VALUE</span>
        <span>₹${Object.values(productMap).reduce((s, qty) => {
          return s + (qty.totalCases * qty.pricePerCase) + (qty.extraBottles * qty.pricePerUnit);
        }, 0).toLocaleString()}</span>
      </div>
      <div class="line"></div>
      <div class="center">Total Bills: ${selectedBills.length}</div>
    </body>
    </html>
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
    const cases = parseFloat(items[i].quantity_cases || 0);
    const units = parseFloat(items[i].quantity_units || 0);
    const ppc = parseFloat(items[i].price_per_case || 0);
    const ppu = parseFloat(items[i].price_per_unit || 0);
    items[i].total_price = (cases * ppc) + (units * ppu);
    setForm({ ...form, items });
  };

  const addItem = () => setForm({ ...form, items: [...form.items, { ...emptyItem }] });
  const removeItem = (i) => setForm({ ...form, items: form.items.filter((_, idx) => idx !== i) });
  const grandTotal = form.items.reduce((s, i) => s + parseFloat(i.total_price || 0), 0);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    for (const item of form.items) {
      if (!item.product_id) { setError("Please select a product for all items"); return; }
      if (parseFloat(item.quantity_cases || 0) === 0 && parseFloat(item.quantity_units || 0) === 0) {
        setError("Please enter quantity for all items"); return;
      }
    }
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
    }
  };

  const handlePay = async () => {
    await api.post(`/bills/${payModal}/payment`, { paid_amount: parseFloat(payAmount) });
    setPayModal(null);
    setPayAmount("");
    load();
  };

  const printBill = async (bill) => {
    const itemsRes = await api.get(`/bills/${bill.id}/items`);
    const items = itemsRes.data;
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
      <html>
      <head>
        <title>Bill #${bill.bill_number}</title>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { font-family: 'Courier New', monospace; font-size: 13px; padding: 20px; max-width: 300px; margin: auto; }
          .center { text-align: center; }
          .bold { font-weight: bold; }
          .line { border-top: 1px dashed #000; margin: 8px 0; }
          .row { display: flex; justify-content: space-between; margin: 4px 0; }
          .title { font-size: 18px; font-weight: bold; text-align: center; margin-bottom: 4px; }
          .small { font-size: 11px; color: #555; }
          table { width: 100%; border-collapse: collapse; margin: 8px 0; }
          th { text-align: left; font-size: 11px; border-bottom: 1px solid #000; padding: 3px 0; }
          td { padding: 3px 0; font-size: 12px; }
          .total-row { font-weight: bold; font-size: 14px; }
          .status { text-align: center; font-size: 12px; margin-top: 8px; }
          @media print { body { padding: 0; } }
        </style>
      </head>
      <body>
        <div class="title">INVENTORY</div>
        <div class="center small">${bill.godown_name}</div>
        <div class="line"></div>
        <div class="row"><span>Bill #:</span><span class="bold">${bill.bill_number}</span></div>
        <div class="row"><span>Date:</span><span>${new Date(bill.created_at).toLocaleDateString('en-IN')}</span></div>
        <div class="row"><span>Shop:</span><span class="bold">${bill.shop_name}</span></div>
        <div class="line"></div>
        <table>
          <thead><tr><th>Product</th><th>Qty</th><th>Rate</th><th>Amt</th></tr></thead>
          <tbody>
            ${items.map(item => `
              <tr>
                <td>${item.product_name}</td>
                <td>${item.quantity_cases > 0 ? item.quantity_cases + 'C' : ''}${item.quantity_units > 0 ? ' ' + item.quantity_units + 'B' : ''}</td>
                <td>₹${item.quantity_cases > 0 ? item.price_per_case : item.price_per_unit}</td>
                <td>₹${Number(item.total_price).toLocaleString()}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
        <div class="line"></div>
        <div class="row total-row"><span>TOTAL</span><span>₹${Number(bill.total_amount).toLocaleString()}</span></div>
        <div class="row"><span>Paid</span><span>₹${Number(bill.paid_amount || 0).toLocaleString()}</span></div>
        <div class="row bold"><span>Pending</span><span>₹${Number(bill.pending_amount || 0).toLocaleString()}</span></div>
        <div class="line"></div>
        <div class="status">Status: ${bill.status}</div>
        <div class="center small" style="margin-top: 12px;">Thank you!</div>
      </body>
      </html>
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
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "24px" }}>
        <h1 className="section-title">Bills</h1>
        <div style={{ display: "flex", gap: "12px" }}>
          {selectedBills.length > 0 && (
            <button onClick={printLoadSheet} style={{
              background: "#111", color: "white", border: "none", borderRadius: "8px",
              padding: "8px 16px", fontSize: "13px", cursor: "pointer", fontWeight: 600
            }}>
              🚚 Print Load Sheet ({selectedBills.length} bills)
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

      {/* Selection hint */}
      {selectedBills.length > 0 && (
        <div style={{ background: "#f0f9ff", border: "1px solid #bae6fd", borderRadius: "8px", padding: "10px 14px", marginBottom: "12px", fontSize: "13px", color: "#0369a1" }}>
          ✅ {selectedBills.length} bill{selectedBills.length > 1 ? 's' : ''} selected — Click "Print Load Sheet" to get combined product quantities for truck loading
        </div>
      )}

      <div className="card" style={{ padding: 0, overflow: "hidden" }}>
        <table style={{ width: "100%", fontSize: "14px", borderCollapse: "collapse" }}>
          <thead className="table-head">
            <tr>
              <th style={{ width: "40px", textAlign: "center" }}>
                <input type="checkbox"
                  checked={selectedBills.length === bills.length && bills.length > 0}
                  onChange={toggleSelectAll}
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
                style={{ background: selectedBills.includes(b.id) ? "#fff7ed" : "" }}>
                <td style={{ textAlign: "center" }}>
                  <input type="checkbox"
                    checked={selectedBills.includes(b.id)}
                    onChange={() => toggleSelect(b.id)}
                  />
                </td>
                <td style={{ fontWeight: 700, color: "#C8102E" }}>#{b.bill_number}</td>
                <td>{new Date(b.created_at).toLocaleDateString("en-IN")}</td>
                <td style={{ fontWeight: 500 }}>{b.shop_name}</td>
                <td style={{ color: "#9ca3af" }}>{b.godown_name}</td>
                <td style={{ fontWeight: 700 }}>₹{Number(b.total_amount).toLocaleString()}</td>
                <td style={{ color: "#16a34a" }}>₹{Number(b.paid_amount || 0).toLocaleString()}</td>
                <td style={{ color: "#C8102E", fontWeight: 600 }}>₹{Number(b.pending_amount || 0).toLocaleString()}</td>
                <td><span className={statusColor(b.status)}>{b.status}</span></td>
                <td>
                  <div style={{ display: "flex", gap: "12px" }}>
                    <button onClick={() => printBill(b)}
                      style={{ color: "#2563eb", fontSize: "12px", background: "none", border: "none", cursor: "pointer" }}>
                      🖨️ Print
                    </button>
                    {b.status !== "CLEARED" && (
                      <button onClick={() => { setPayModal(b.id); setPayAmount(""); }}
                        style={{ color: "#C8102E", fontSize: "12px", background: "none", border: "none", cursor: "pointer" }}>
                        Collect
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {bills.length === 0 && <p style={{ textAlign: "center", color: "#9ca3af", padding: "32px", fontSize: "14px" }}>No bills yet</p>}
      </div>

      {/* New Bill Modal */}
      {modal && (
        <div className="modal-overlay">
          <div className="modal-box" style={{ maxWidth: "720px", maxHeight: "90vh", overflowY: "auto" }}>
            <h2 style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: "1.8rem", fontWeight: 700, marginBottom: "16px" }}>New Bill</h2>
            {error && (
              <div style={{ background: "#fee2e2", border: "1px solid #fca5a5", color: "#C8102E", padding: "10px 12px", borderRadius: "6px", fontSize: "13px", marginBottom: "12px" }}>
                {error}
              </div>
            )}
            <form onSubmit={handleSubmit}>
              <div style={{ marginBottom: "12px" }}>
                <label style={{ fontSize: "11px", color: "#9ca3af", textTransform: "uppercase" }}>Shop</label>
                <select className="input" style={{ marginTop: "4px" }} value={form.shop_id}
                  onChange={e => setForm({ ...form, shop_id: e.target.value })} required>
                  <option value="">Select Shop</option>
                  {shops.map(s => <option key={s.id} value={s.id}>{s.name} — {s.owner_name}</option>)}
                </select>
              </div>
              <div style={{ borderTop: "1px solid #f3f4f6", paddingTop: "12px", marginBottom: "12px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "10px" }}>
                  <p style={{ fontSize: "11px", color: "#9ca3af", textTransform: "uppercase" }}>Products</p>
                  <button type="button" onClick={addItem}
                    style={{ color: "#C8102E", fontSize: "12px", background: "none", border: "none", cursor: "pointer" }}>
                    + Add Product
                  </button>
                </div>
                {form.items.map((item, i) => {
                  const selectedProduct = products.find(p => p.id === item.product_id);
                  return (
                    <div key={i} style={{ background: "#f9fafb", borderRadius: "8px", padding: "10px", marginBottom: "10px", border: "1px solid #f3f4f6" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px", alignItems: "center" }}>
                        <select className="input" style={{ flex: 1, marginRight: "8px" }}
                          value={item.product_id}
                          onChange={e => updateItem(i, "product_id", e.target.value)} required>
                          <option value="">Select Product</option>
                          {products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                        </select>
                        {form.items.length > 1 && (
                          <button type="button" onClick={() => removeItem(i)}
                            style={{ color: "#9ca3af", background: "none", border: "none", cursor: "pointer" }}>✕</button>
                        )}
                      </div>
                      {selectedProduct && (
                        <p style={{ fontSize: "11px", color: "#9ca3af", marginBottom: "8px" }}>
                          ₹{selectedProduct.selling_price}/case &nbsp;|&nbsp; ₹{selectedProduct.selling_price_per_unit}/bottle &nbsp;|&nbsp; {selectedProduct.bottles_per_case} bottles/case
                        </p>
                      )}
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "8px", alignItems: "center" }}>
                        <div>
                          <label style={{ fontSize: "10px", color: "#9ca3af", textTransform: "uppercase" }}>Cases</label>
                          <input type="number" className="input" style={{ marginTop: "2px" }}
                            value={item.quantity_cases} onChange={e => updateItem(i, "quantity_cases", e.target.value)}
                            min="0" placeholder="0" />
                        </div>
                        <div>
                          <label style={{ fontSize: "10px", color: "#9ca3af", textTransform: "uppercase" }}>Extra Bottles</label>
                          <input type="number" className="input" style={{ marginTop: "2px" }}
                            value={item.quantity_units} onChange={e => updateItem(i, "quantity_units", e.target.value)}
                            min="0" placeholder="0" />
                        </div>
                        <div style={{ textAlign: "right", paddingTop: "16px" }}>
                          <span style={{ fontWeight: 700, fontSize: "15px", color: "#111" }}>
                            ₹{parseFloat(item.total_price || 0).toLocaleString()}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
                <div style={{ textAlign: "right", fontWeight: 700, fontSize: "15px", marginTop: "4px" }}>
                  Total: ₹{grandTotal.toLocaleString()}
                </div>
              </div>
              <div style={{ background: "#fff5f5", border: "1px solid #fee2e2", borderRadius: "8px", padding: "12px", marginBottom: "16px" }}>
                <label style={{ fontSize: "11px", color: "#9ca3af", textTransform: "uppercase" }}>Amount Paid Now (0 if pending)</label>
                <input type="number" className="input" style={{ marginTop: "4px" }}
                  value={form.paid_amount} onChange={e => setForm({ ...form, paid_amount: e.target.value })}
                  placeholder="0" min="0" />
                {parseFloat(form.paid_amount) > 0 && (
                  <p style={{ fontSize: "12px", color: "#C8102E", marginTop: "4px" }}>
                    Pending: ₹{Math.max(0, grandTotal - parseFloat(form.paid_amount || 0)).toLocaleString()}
                  </p>
                )}
              </div>
              <div style={{ display: "flex", gap: "12px" }}>
                <button type="submit" className="btn-primary" style={{ flex: 1 }}>Generate Bill</button>
                <button type="button" className="btn-outline" style={{ flex: 1 }} onClick={() => setModal(false)}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Collect Payment Modal */}
      {payModal && (
        <div className="modal-overlay">
          <div className="modal-box" style={{ maxWidth: "360px" }}>
            <h2 style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: "1.8rem", fontWeight: 700, marginBottom: "16px" }}>Collect Payment</h2>
            {(() => {
              const b = bills.find(b => b.id === payModal);
              return (
                <div>
                  <div style={{ background: "#f9fafb", borderRadius: "8px", padding: "12px", marginBottom: "16px", fontSize: "13px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "4px" }}>
                      <span style={{ color: "#9ca3af" }}>Total</span>
                      <span style={{ fontWeight: 600 }}>₹{Number(b.total_amount).toLocaleString()}</span>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "4px" }}>
                      <span style={{ color: "#9ca3af" }}>Already Paid</span>
                      <span style={{ color: "#16a34a", fontWeight: 600 }}>₹{Number(b.paid_amount || 0).toLocaleString()}</span>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between" }}>
                      <span style={{ color: "#9ca3af" }}>Pending</span>
                      <span style={{ color: "#C8102E", fontWeight: 600 }}>₹{Number(b.pending_amount || 0).toLocaleString()}</span>
                    </div>
                  </div>
                  <label style={{ fontSize: "11px", color: "#9ca3af", textTransform: "uppercase" }}>Amount Collecting ₹</label>
                  <input type="number" className="input" style={{ marginTop: "4px", marginBottom: "16px" }}
                    value={payAmount} onChange={e => setPayAmount(e.target.value)} placeholder="Enter amount" />
                  <div style={{ display: "flex", gap: "12px" }}>
                    <button onClick={handlePay} className="btn-primary" style={{ flex: 1 }}>Confirm</button>
                    <button onClick={() => setPayModal(null)} className="btn-outline" style={{ flex: 1 }}>Cancel</button>
                  </div>
                </div>
              );
            })()}
          </div>
        </div>
      )}
    </div>
  );
}