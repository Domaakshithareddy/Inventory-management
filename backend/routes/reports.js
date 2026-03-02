const router = require('express').Router();
const pool = require('../db');
const auth = require('../middleware/auth');
const ExcelJS = require('exceljs');
const PDFDocument = require('pdfkit');

// ─── HELPERS ───────────────────────────────────────────────
const headerStyle = (row) => {
  row.eachCell(cell => {
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF111111' } };
    cell.font = { bold: true, color: { argb: 'FFFFFFFF' }, size: 11 };
    cell.alignment = { vertical: 'middle', horizontal: 'center' };
    cell.border = { bottom: { style: 'medium' } };
  });
  row.height = 22;
};

const sectionHeader = (sheet, title, cols) => {
  const row = sheet.addRow([title]);
  row.getCell(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFC8102E' } };
  row.getCell(1).font = { bold: true, color: { argb: 'FFFFFFFF' }, size: 12 };
  sheet.mergeCells(`A${row.number}:${String.fromCharCode(64 + cols)}${row.number}`);
  row.height = 20;
  sheet.addRow([]);
};

const statusFill = (status) => {
  if (status === 'CLEARED' || status === 'PAID') return 'FFD1FAE5';
  if (status === 'PARTIAL') return 'FFFEF3C7';
  return 'FFFEE2E2';
};

const addBillsSheet = async (sheet, bills, pool) => {
  sheet.columns = [
    { key: 'bill', width: 10 }, { key: 'date', width: 14 }, { key: 'shop', width: 22 },
    { key: 'product', width: 25 }, { key: 'cases', width: 8 }, { key: 'bottles', width: 10 },
    { key: 'item_total', width: 14 }, { key: 'bill_total', width: 14 },
    { key: 'paid', width: 14 }, { key: 'pending', width: 14 }, { key: 'status', width: 12 },
  ];
  const hRow = sheet.addRow(['Bill No', 'Date', 'Shop', 'Product', 'Cases', 'Bottles', 'Item Total', 'Bill Total', 'Paid', 'Pending', 'Status']);
  headerStyle(hRow);

  let grandTotal = 0, grandPaid = 0, grandPending = 0;

  for (const bill of bills) {
    const items = (await pool.query(`SELECT bi.*, p.name as product_name FROM bill_items bi JOIN products p ON bi.product_id=p.id WHERE bi.bill_id=$1`, [bill.id])).rows;
    items.forEach((item, idx) => {
      const row = sheet.addRow([
        idx === 0 ? bill.bill_number : '',
        idx === 0 ? new Date(bill.created_at).toLocaleDateString('en-IN') : '',
        idx === 0 ? bill.shop_name : '',
        item.product_name,
        item.quantity_cases,
        item.quantity_units || 0,
        parseFloat(item.total_price),
        idx === 0 ? parseFloat(bill.total_amount) : '',
        idx === 0 ? parseFloat(bill.paid_amount || 0) : '',
        idx === 0 ? parseFloat(bill.pending_amount || 0) : '',
        idx === 0 ? bill.status : '',
      ]);
      row.getCell(7).numFmt = '₹#,##0.00';
      if (idx === 0) {
        [8, 9, 10].forEach(c => { row.getCell(c).numFmt = '₹#,##0.00'; row.getCell(c).font = { bold: true }; });
        row.getCell(11).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: statusFill(bill.status) } };
        row.getCell(11).font = { bold: true };
        [1, 2, 3].forEach(c => { row.getCell(c).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF3F4F6' } }; row.getCell(c).font = { bold: true }; });
      }
      row.eachCell(cell => { cell.alignment = { vertical: 'middle' }; cell.border = { bottom: { style: 'hair', color: { argb: 'FFE5E7EB' } } }; });
    });
    sheet.addRow(['']);
    grandTotal += parseFloat(bill.total_amount);
    grandPaid += parseFloat(bill.paid_amount || 0);
    grandPending += parseFloat(bill.pending_amount || 0);
  }

  const tRow = sheet.addRow(['', '', '', 'GRAND TOTAL', '', '', '', grandTotal, grandPaid, grandPending, '']);
  tRow.eachCell(cell => { cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF111111' } }; cell.font = { bold: true, color: { argb: 'FFFFFFFF' }, size: 11 }; });
  [8, 9, 10].forEach(c => { tRow.getCell(c).numFmt = '₹#,##0.00'; });
  tRow.height = 22;
};

const addCounterSheet = async (sheet, sales) => {
  sheet.columns = [
    { key: 'date', width: 14 }, { key: 'time', width: 12 }, { key: 'product', width: 25 },
    { key: 'bottles', width: 12 }, { key: 'price', width: 14 }, { key: 'total', width: 14 },
  ];
  const hRow = sheet.addRow(['Date', 'Time', 'Product', 'Bottles Sold', 'Price/Bottle', 'Total']);
  headerStyle(hRow);

  let grandTotal = 0;
  sales.forEach(s => {
    const row = sheet.addRow([
      new Date(s.created_at).toLocaleDateString('en-IN'),
      new Date(s.created_at).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
      s.product_name,
      s.quantity_units,
      parseFloat(s.price_per_unit),
      parseFloat(s.total_amount),
    ]);
    row.getCell(5).numFmt = '₹#,##0.00';
    row.getCell(6).numFmt = '₹#,##0.00';
    row.getCell(6).font = { bold: true };
    row.eachCell(cell => { cell.alignment = { vertical: 'middle' }; cell.border = { bottom: { style: 'hair', color: { argb: 'FFE5E7EB' } } }; });
    grandTotal += parseFloat(s.total_amount);
  });

  sheet.addRow([]);
  const tRow = sheet.addRow(['', '', 'TOTAL', '', '', grandTotal]);
  tRow.eachCell(cell => { cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF111111' } }; cell.font = { bold: true, color: { argb: 'FFFFFFFF' }, size: 11 }; });
  tRow.getCell(6).numFmt = '₹#,##0.00';
  tRow.height = 22;
};

const addPurchasesSheet = async (sheet, purchases, pool) => {
  sheet.columns = [
    { key: 'date', width: 14 }, { key: 'company', width: 22 }, { key: 'product', width: 25 },
    { key: 'cases', width: 10 }, { key: 'price', width: 14 }, { key: 'item_total', width: 14 },
    { key: 'gst', width: 12 }, { key: 'transport', width: 14 }, { key: 'bill_total', width: 14 },
    { key: 'paid', width: 14 }, { key: 'pending', width: 14 }, { key: 'status', width: 12 },
  ];
  const hRow = sheet.addRow(['Date', 'Company', 'Product', 'Cases', 'Price/Case', 'Item Total', 'GST', 'Transport', 'Bill Total', 'Paid', 'Pending', 'Status']);
  headerStyle(hRow);

  let grandTotal = 0, grandPaid = 0, grandPending = 0;
  for (const p of purchases) {
    const items = (await pool.query(`SELECT pi.*, pr.name as product_name FROM purchase_items pi JOIN products pr ON pi.product_id=pr.id WHERE pi.purchase_id=$1`, [p.id])).rows;
    items.forEach((item, idx) => {
      const row = sheet.addRow([
        idx === 0 ? new Date(p.purchase_date).toLocaleDateString('en-IN') : '',
        idx === 0 ? p.company_name : '',
        item.product_name,
        item.quantity_cases,
        parseFloat(item.price_per_case),
        parseFloat(item.total_price),
        idx === 0 ? parseFloat(p.gst_amount || 0) : '',
        idx === 0 ? parseFloat(p.transport_cost || 0) : '',
        idx === 0 ? parseFloat(p.total_amount) : '',
        idx === 0 ? parseFloat(p.paid_amount || 0) : '',
        idx === 0 ? Math.max(0, parseFloat(p.total_amount) - parseFloat(p.paid_amount || 0)) : '',
        idx === 0 ? p.payment_status : '',
      ]);
      [5, 6, 7, 8, 9, 10].forEach(c => row.getCell(c).numFmt = '₹#,##0.00');
      if (idx === 0) {
        [1, 2].forEach(c => { row.getCell(c).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF3F4F6' } }; row.getCell(c).font = { bold: true }; });
        row.getCell(12).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: statusFill(p.payment_status) } };
        row.getCell(12).font = { bold: true };
      }
      row.eachCell(cell => { cell.alignment = { vertical: 'middle' }; cell.border = { bottom: { style: 'hair', color: { argb: 'FFE5E7EB' } } }; });
    });
    sheet.addRow([]);
    grandTotal += parseFloat(p.total_amount);
    grandPaid += parseFloat(p.paid_amount || 0);
    grandPending += Math.max(0, parseFloat(p.total_amount) - parseFloat(p.paid_amount || 0));
  }

  const tRow = sheet.addRow(['', '', 'GRAND TOTAL', '', '', '', '', '', grandTotal, grandPaid, grandPending, '']);
  tRow.eachCell(cell => { cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF111111' } }; cell.font = { bold: true, color: { argb: 'FFFFFFFF' }, size: 11 }; });
  [9, 10, 11].forEach(c => tRow.getCell(c).numFmt = '₹#,##0.00');
  tRow.height = 22;
};

const addExpensesSheet = async (sheet, expenses, freeProducts, breakages) => {
  sheet.columns = [
    { key: 'date', width: 14 }, { key: 'type', width: 20 }, { key: 'desc', width: 30 }, { key: 'amount', width: 16 },
  ];

  // ── Regular Expenses ──
  sectionHeader(sheet, 'REGULAR EXPENSES', 4);
  const hRow1 = sheet.addRow(['Date', 'Type', 'Description', 'Amount']);
  headerStyle(hRow1);

  let expTotal = 0;
  expenses.forEach(e => {
    const row = sheet.addRow([
      new Date(e.expense_date || e.created_at).toLocaleDateString('en-IN'),
      e.type,
      e.description || '—',
      parseFloat(e.amount),
    ]);
    row.getCell(4).numFmt = '₹#,##0.00';
    row.eachCell(cell => { cell.alignment = { vertical: 'middle' }; cell.border = { bottom: { style: 'hair', color: { argb: 'FFE5E7EB' } } }; });
    expTotal += parseFloat(e.amount);
  });
  const eTRow = sheet.addRow(['', '', 'Expenses Total', expTotal]);
  eTRow.eachCell(cell => { cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF374151' } }; cell.font = { bold: true, color: { argb: 'FFFFFFFF' } }; });
  eTRow.getCell(4).numFmt = '₹#,##0.00';
  sheet.addRow([]);
  sheet.addRow([]);

  // ── Free Products ──
  sectionHeader(sheet, 'FREE PRODUCTS GIVEN', 4);
  sheet.columns = [
    { key: 'date', width: 14 }, { key: 'product', width: 25 }, { key: 'qty', width: 14 }, { key: 'value', width: 16 },
  ];
  const hRow2 = sheet.addRow(['Date', 'Product', 'Bottles Given', 'Approx Value']);
  headerStyle(hRow2);

  let freeTotal = 0;
  freeProducts.forEach(f => {
    const approxValue = parseFloat(f.quantity_units || 0) * parseFloat(f.selling_price_per_unit || 0);
    const row = sheet.addRow([
      new Date(f.given_date || f.created_at).toLocaleDateString('en-IN'),
      f.product_name,
      f.quantity_units || 0,
      approxValue,
    ]);
    row.getCell(4).numFmt = '₹#,##0.00';
    row.eachCell(cell => { cell.alignment = { vertical: 'middle' }; cell.border = { bottom: { style: 'hair', color: { argb: 'FFE5E7EB' } } }; });
    freeTotal += approxValue;
  });
  const fTRow = sheet.addRow(['', '', 'Free Products Total', freeTotal]);
  fTRow.eachCell(cell => { cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF374151' } }; cell.font = { bold: true, color: { argb: 'FFFFFFFF' } }; });
  fTRow.getCell(4).numFmt = '₹#,##0.00';
  sheet.addRow([]);
  sheet.addRow([]);

  // ── Breakage ──
  sectionHeader(sheet, 'BREAKAGE', 4);
  const hRow3 = sheet.addRow(['Date', 'Product', 'Bottles Broken', 'Penalty Amount']);
  headerStyle(hRow3);

  let breakTotal = 0;
  breakages.forEach(b => {
    const row = sheet.addRow([
      new Date(b.breakage_date).toLocaleDateString('en-IN'),
      b.product_name,
      b.quantity_bottles,
      parseFloat(b.total_penalty),
    ]);
    row.getCell(4).numFmt = '₹#,##0.00';
    row.getCell(4).font = { color: { argb: 'FFC8102E' } };
    row.eachCell(cell => { cell.alignment = { vertical: 'middle' }; cell.border = { bottom: { style: 'hair', color: { argb: 'FFE5E7EB' } } }; });
    breakTotal += parseFloat(b.total_penalty);
  });
  const bTRow = sheet.addRow(['', '', 'Breakage Total', breakTotal]);
  bTRow.eachCell(cell => { cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF374151' } }; cell.font = { bold: true, color: { argb: 'FFFFFFFF' } }; });
  bTRow.getCell(4).numFmt = '₹#,##0.00';
  sheet.addRow([]);
  sheet.addRow([]);

  // ── Grand Summary ──
  sectionHeader(sheet, 'EXPENSE SUMMARY', 4);
  const summaryRows = [
    ['Regular Expenses', expTotal],
    ['Free Products (Value)', freeTotal],
    ['Breakage Penalties', breakTotal],
    ['TOTAL OUTFLOW', expTotal + freeTotal + breakTotal],
  ];
  summaryRows.forEach((s, idx) => {
    const row = sheet.addRow(['', s[0], '', s[1]]);
    row.getCell(4).numFmt = '₹#,##0.00';
    if (idx === summaryRows.length - 1) {
      row.eachCell(cell => { cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFC8102E' } }; cell.font = { bold: true, color: { argb: 'FFFFFFFF' }, size: 12 }; });
    } else {
      row.getCell(2).font = { bold: true };
    }
    row.height = 18;
  });
};

// ─── DASHBOARD ───────────────────────────────────────────
router.get('/dashboard', auth, async (req, res) => {
  const gid = req.user.godown_id;
  const gFilter = gid ? `WHERE godown_id = '${gid}'` : '';
  const gAnd = gid ? `AND b.godown_id='${gid}'` : '';

  const [stockVal, todaySales, todayCounter, totalExpenses, pendingBills, pendingPurchases] = await Promise.all([
    pool.query(`SELECT COALESCE(SUM(stock_value),0) as total FROM inventory ${gFilter}`),
    pool.query(`SELECT COALESCE(SUM(total_amount),0) as total FROM bills WHERE DATE(created_at)=CURRENT_DATE ${gAnd}`),
    pool.query(`SELECT COALESCE(SUM(total_amount),0) as total FROM counter_sales WHERE DATE(created_at)=CURRENT_DATE ${gAnd}`),
    pool.query(`SELECT COALESCE(SUM(amount),0) as total FROM expenses ${gFilter}`),
    pool.query(`SELECT COALESCE(SUM(pending_amount),0) as total FROM bills WHERE status != 'CLEARED' ${gAnd}`),
    pool.query(`SELECT COALESCE(SUM(total_amount - COALESCE(paid_amount,0)),0) as total FROM purchases WHERE payment_status != 'PAID' ${gAnd}`)
  ]);

  res.json({
    stock_value: stockVal.rows[0].total,
    today_sales: parseFloat(todaySales.rows[0].total) + parseFloat(todayCounter.rows[0].total),
    today_shop_sales: todaySales.rows[0].total,
    today_counter_sales: todayCounter.rows[0].total,
    total_expenses: totalExpenses.rows[0].total,
    pending_bills: pendingBills.rows[0].total,
    pending_purchases: pendingPurchases.rows[0].total
  });
});

router.get('/sales', auth, async (req, res) => {
  const { from, to } = req.query;
  const gid = req.user.godown_id;
  const params = [from, to];
  let query = `
    SELECT b.*, s.name as shop_name, g.name as godown_name
    FROM bills b JOIN shops s ON b.shop_id=s.id JOIN godowns g ON b.godown_id=g.id
    WHERE DATE(b.created_at) BETWEEN $1 AND $2
  `;
  if (gid) { query += ` AND b.godown_id=$3`; params.push(gid); }
  query += ` ORDER BY b.created_at DESC`;
  const result = await pool.query(query, params);
  res.json(result.rows);
});

// ─── DOWNLOAD ────────────────────────────────────────────
router.get('/download/:type', auth, async (req, res) => {
  const { from, to } = req.query;
  const { type } = req.params;
  const gid = req.user.godown_id;

  // Table-specific filters to avoid ambiguous column reference
  const billsAnd = gid ? `AND b.godown_id='${gid}'` : '';
  const csAnd = gid ? `AND cs.godown_id='${gid}'` : '';
  const puAnd = gid ? `AND pu.godown_id='${gid}'` : '';
  const expAnd = gid ? `AND godown_id='${gid}'` : '';

  try {
    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'Inventory System';
    workbook.created = new Date();

    let bills = [], counterSales = [], purchases = [], expenses = [], freeProducts = [], breakages = [];

    if (['bills', 'complete'].includes(type)) {
      const q = `SELECT b.*, s.name as shop_name, g.name as godown_name FROM bills b JOIN shops s ON b.shop_id=s.id JOIN godowns g ON b.godown_id=g.id WHERE DATE(b.created_at) BETWEEN '${from}' AND '${to}' ${billsAnd} ORDER BY b.created_at DESC`;
      bills = (await pool.query(q)).rows;
    }

    if (['counter', 'complete'].includes(type)) {
      const q = `SELECT cs.*, p.name as product_name, p.bottles_per_case, p.selling_price_per_unit FROM counter_sales cs JOIN products p ON cs.product_id=p.id WHERE DATE(cs.created_at) BETWEEN '${from}' AND '${to}' ${csAnd} ORDER BY cs.created_at DESC`;
      counterSales = (await pool.query(q)).rows;
    }

    if (['purchases', 'full'].includes(type)) {
      const q = `SELECT pu.*, c.name as company_name, g.name as godown_name FROM purchases pu JOIN companies c ON pu.company_id=c.id JOIN godowns g ON pu.godown_id=g.id WHERE DATE(pu.purchase_date) BETWEEN '${from}' AND '${to}' ${puAnd} ORDER BY pu.purchase_date DESC`;
      purchases = (await pool.query(q)).rows;
    }

    if (['expenses', 'full'].includes(type)) {
      const eq = `SELECT * FROM expenses WHERE DATE(created_at) BETWEEN '${from}' AND '${to}' ${expAnd} ORDER BY created_at DESC`;
      expenses = (await pool.query(eq)).rows;

      const fq = `SELECT fp.*, p.name as product_name, p.selling_price_per_unit FROM free_products fp JOIN products p ON fp.product_id=p.id WHERE DATE(fp.created_at) BETWEEN '${from}' AND '${to}' ${expAnd} ORDER BY fp.created_at DESC`;
      freeProducts = (await pool.query(fq)).rows;

      const bq = `SELECT br.*, p.name as product_name FROM breakage br JOIN products p ON br.product_id=p.id WHERE DATE(br.breakage_date) BETWEEN '${from}' AND '${to}' ${expAnd} ORDER BY br.breakage_date DESC`;
      breakages = (await pool.query(bq)).rows;
    }

    // ── Build workbook ──
    if (type === 'bills') {
      const sheet = workbook.addWorksheet('Shop Sales');
      await addBillsSheet(sheet, bills, pool);
    }

    if (type === 'counter') {
      const sheet = workbook.addWorksheet('Counter Sales');
      await addCounterSheet(sheet, counterSales);
    }

    if (type === 'complete') {
      const s1 = workbook.addWorksheet('Shop Sales');
      await addBillsSheet(s1, bills, pool);
      const s2 = workbook.addWorksheet('Counter Sales');
      await addCounterSheet(s2, counterSales);
      // Summary sheet
      const s3 = workbook.addWorksheet('Summary');
      s3.columns = [{ width: 30 }, { width: 20 }];
      sectionHeader(s3, 'COMPLETE SALES SUMMARY', 2);
      const shopTotal = bills.reduce((s, b) => s + parseFloat(b.total_amount), 0);
      const counterTotal = counterSales.reduce((s, c) => s + parseFloat(c.total_amount), 0);
      [
        ['Shop Sales Total', shopTotal],
        ['Counter Sales Total', counterTotal],
        ['GRAND TOTAL', shopTotal + counterTotal],
      ].forEach((r, i) => {
        const row = s3.addRow(r);
        row.getCell(2).numFmt = '₹#,##0.00';
        if (i === 2) {
          row.eachCell(cell => { cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFC8102E' } }; cell.font = { bold: true, color: { argb: 'FFFFFFFF' }, size: 12 }; });
        } else {
          row.getCell(1).font = { bold: true };
        }
        row.height = 20;
      });
    }

    if (type === 'purchases') {
      const sheet = workbook.addWorksheet('Purchases');
      await addPurchasesSheet(sheet, purchases, pool);
    }

    if (type === 'expenses') {
      const sheet = workbook.addWorksheet('Expenses');
      await addExpensesSheet(sheet, expenses, freeProducts, breakages);
    }

    if (type === 'full') {
      const s1 = workbook.addWorksheet('Purchases');
      await addPurchasesSheet(s1, purchases, pool);
      const s2 = workbook.addWorksheet('Expenses');
      await addExpensesSheet(s2, expenses, freeProducts, breakages);
      // Summary
      const s3 = workbook.addWorksheet('Summary');
      s3.columns = [{ width: 30 }, { width: 20 }];
      sectionHeader(s3, 'PURCHASE + EXPENSE SUMMARY', 2);
      const purchaseTotal = purchases.reduce((s, p) => s + parseFloat(p.total_amount), 0);
      const expTotal = expenses.reduce((s, e) => s + parseFloat(e.amount), 0);
      const freeTotal = freeProducts.reduce((s, f) => s + (parseFloat(f.quantity_units || 0) * parseFloat(f.selling_price_per_unit || 0)), 0);
      const breakTotal = breakages.reduce((s, b) => s + parseFloat(b.total_penalty), 0);
      [
        ['Purchases Total', purchaseTotal],
        ['Regular Expenses', expTotal],
        ['Free Products (Value)', freeTotal],
        ['Breakage Penalties', breakTotal],
        ['TOTAL OUTFLOW', purchaseTotal + expTotal + freeTotal + breakTotal],
      ].forEach((r, i) => {
        const row = s3.addRow(r);
        row.getCell(2).numFmt = '₹#,##0.00';
        if (i === 4) {
          row.eachCell(cell => { cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFC8102E' } }; cell.font = { bold: true, color: { argb: 'FFFFFFFF' }, size: 12 }; });
        } else {
          row.getCell(1).font = { bold: true };
        }
        row.height = 20;
      });
    }

    const typeNames = { bills: 'Shop_Sales', counter: 'Counter_Sales', complete: 'Complete_Sales', purchases: 'Purchases', expenses: 'Expenses', full: 'Purchase_Expenses' };
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename=${typeNames[type]}_${from}_${to}.xlsx`);
    await workbook.xlsx.write(res);
    res.end();
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;