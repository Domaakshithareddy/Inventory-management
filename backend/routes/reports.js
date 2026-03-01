const router = require('express').Router();
const pool = require('../db');
const auth = require('../middleware/auth');
const ExcelJS = require('exceljs');
const PDFDocument = require('pdfkit');

router.get('/dashboard', auth, async (req, res) => {
  const gid = req.user.godown_id;
  const gFilter = gid ? `WHERE godown_id = '${gid}'` : '';
  const gAnd = gid ? `AND godown_id = '${gid}'` : '';

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
    SELECT b.id, b.bill_number, b.created_at, b.total_amount, b.paid_amount, b.pending_amount, b.status,
           s.name as shop_name, g.name as godown_name
    FROM bills b JOIN shops s ON b.shop_id=s.id JOIN godowns g ON b.godown_id=g.id
    WHERE DATE(b.created_at) BETWEEN $1 AND $2
  `;
  if (gid) { query += ` AND b.godown_id=$3`; params.push(gid); }
  query += ` ORDER BY b.created_at DESC`;
  const result = await pool.query(query, params);
  res.json(result.rows);
});

router.get('/download/excel', auth, async (req, res) => {
  const { from, to } = req.query;
  const gid = req.user.godown_id;
  const params = [from, to];
  let query = `
    SELECT b.bill_number, b.created_at, b.total_amount, b.paid_amount, b.pending_amount, b.status,
           s.name as shop_name, p.name as product_name, bi.quantity_cases, bi.quantity_units, bi.total_price
    FROM bills b
    JOIN bill_items bi ON bi.bill_id=b.id
    JOIN shops s ON b.shop_id=s.id
    JOIN products p ON bi.product_id=p.id
    WHERE DATE(b.created_at) BETWEEN $1 AND $2
  `;
  if (gid) { query += ` AND b.godown_id=$3`; params.push(gid); }
  const result = await pool.query(query, params);

  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet('Sales Report');
  sheet.columns = [
    { header: 'Bill No', key: 'bill_number', width: 10 },
    { header: 'Date', key: 'created_at', width: 15 },
    { header: 'Shop', key: 'shop_name', width: 20 },
    { header: 'Product', key: 'product_name', width: 25 },
    { header: 'Cases', key: 'quantity_cases', width: 8 },
    { header: 'Bottles', key: 'quantity_units', width: 8 },
    { header: 'Total', key: 'total_price', width: 12 },
    { header: 'Paid', key: 'paid_amount', width: 12 },
    { header: 'Pending', key: 'pending_amount', width: 12 },
    { header: 'Status', key: 'status', width: 12 },
  ];
  result.rows.forEach(row => sheet.addRow(row));

  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  res.setHeader('Content-Disposition', `attachment; filename=sales_${from}_${to}.xlsx`);
  await workbook.xlsx.write(res);
  res.end();
});

router.get('/download/pdf', auth, async (req, res) => {
  const { from, to } = req.query;
  const gid = req.user.godown_id;
  const params = [from, to];
  let query = `
    SELECT b.bill_number, b.created_at, b.total_amount, b.status, s.name as shop_name
    FROM bills b JOIN shops s ON b.shop_id=s.id
    WHERE DATE(b.created_at) BETWEEN $1 AND $2
  `;
  if (gid) { query += ` AND b.godown_id=$3`; params.push(gid); }

  const result = await pool.query(query, params);
  const doc = new PDFDocument();
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename=sales_${from}_${to}.pdf`);
  doc.pipe(res);
  doc.fontSize(18).text('Sales Report', { align: 'center' });
  doc.moveDown().fontSize(12).text(`Period: ${from} to ${to}`);
  doc.moveDown();
  result.rows.forEach(row => {
    doc.text(`Bill #${row.bill_number} | ${new Date(row.created_at).toLocaleDateString()} | ${row.shop_name} | ₹${row.total_amount} | ${row.status}`);
  });
  const total = result.rows.reduce((s, r) => s + parseFloat(r.total_amount), 0);
  doc.moveDown().fontSize(14).text(`Total: ₹${total.toFixed(2)}`);
  doc.end();
});

module.exports = router;