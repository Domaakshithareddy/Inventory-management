const router = require('express').Router();
const pool = require('../db');
const auth = require('../middleware/auth');

// Get all purchases
router.get('/', auth, async (req, res) => {
  let query = `
    SELECT pu.*, c.name as company_name, g.name as godown_name
    FROM purchases pu
    JOIN companies c ON pu.company_id = c.id
    JOIN godowns g ON pu.godown_id = g.id
  `;
  const params = [];
  if (req.user.role === 'godown') {
    query += ` WHERE pu.godown_id = $1`;
    params.push(req.user.godown_id);
  }
  query += ` ORDER BY pu.purchase_date DESC`;
  const result = await pool.query(query, params);
  res.json(result.rows);
});

// Get purchase items
router.get('/:id/items', auth, async (req, res) => {
  const result = await pool.query(
    `SELECT pi.*, p.name as product_name FROM purchase_items pi
     JOIN products p ON pi.product_id = p.id
     WHERE pi.purchase_id = $1`,
    [req.params.id]
  );
  res.json(result.rows);
});

// Create purchase (auto increases inventory)
router.post('/', auth, async (req, res) => {
  const { company_id, transport_cost, purchase_date, items } = req.body;
  const godown_id = req.user.godown_id;

  if (!godown_id) return res.status(400).json({ error: 'Admin cannot create purchases. Use godown login.' });

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const total_amount = items.reduce((sum, i) => sum + i.total_price, 0);

    const purchase = await client.query(
      `INSERT INTO purchases (godown_id, company_id, transport_cost, total_amount, purchase_date)
       VALUES ($1,$2,$3,$4,$5) RETURNING *`,
      [godown_id, company_id, transport_cost, total_amount, purchase_date]
    );
    const purchase_id = purchase.rows[0].id;

    for (const item of items) {
      await client.query(
        `INSERT INTO purchase_items (purchase_id, product_id, quantity_cases, price_per_case, total_price)
         VALUES ($1,$2,$3,$4,$5)`,
        [purchase_id, item.product_id, item.quantity_cases, item.price_per_case, item.total_price]
      );

      // Auto increase inventory
      await client.query(
        `INSERT INTO inventory (godown_id, product_id, quantity_cases, selling_price_per_case, selling_price_per_unit, stock_value)
         VALUES ($1, $2, $3, (SELECT selling_price FROM products WHERE id=$2), (SELECT selling_price_per_unit FROM products WHERE id=$2), $4)
         ON CONFLICT (godown_id, product_id) DO UPDATE SET
           quantity_cases = inventory.quantity_cases + $3,
           stock_value = inventory.stock_value + $4`,
        [godown_id, item.product_id, item.quantity_cases, item.total_price]
      );
    }

    await client.query('COMMIT');
    res.json(purchase.rows[0]);
  } catch (err) {
    await client.query('ROLLBACK');
    res.status(500).json({ error: err.message });
  } finally {
    client.release();
  }
});

// Record payment for a purchase
router.post('/:id/payment', auth, async (req, res) => {
  const { paid_amount } = req.body;
  // Simple approach: store payments as notes for now, or you can add a payments table
  // Here we just update payment_status
  const purchase = await pool.query(`SELECT * FROM purchases WHERE id=$1`, [req.params.id]);
  if (!purchase.rows[0]) return res.status(404).json({ error: 'Not found' });

  const p = purchase.rows[0];
  const new_paid = (parseFloat(p.paid_amount) || 0) + parseFloat(paid_amount);
  const status = new_paid >= p.total_amount + (p.transport_cost || 0) ? 'PAID' : 'PARTIAL';

  const result = await pool.query(
    `UPDATE purchases SET paid_amount=$1, payment_status=$2 WHERE id=$3 RETURNING *`,
    [new_paid, status, req.params.id]
  );
  res.json(result.rows[0]);
});

module.exports = router;