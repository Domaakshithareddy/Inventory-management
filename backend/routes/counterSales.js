const router = require('express').Router();
const pool = require('../db');
const auth = require('../middleware/auth');

// Get today's counter sales
router.get('/', auth, async (req, res) => {
  const godown_id = req.user.godown_id;
  let query = `
    SELECT cs.*, p.name as product_name, p.bottles_per_case
    FROM counter_sales cs JOIN products p ON cs.product_id = p.id
    WHERE DATE(cs.created_at) = CURRENT_DATE
  `;
  const params = [];
  if (godown_id) { query += ` AND cs.godown_id = $1`; params.push(godown_id); }
  query += ` ORDER BY cs.created_at DESC`;
  const result = await pool.query(query, params);
  res.json(result.rows);
});

// Add counter sale
router.post('/', auth, async (req, res) => {
  const { product_id, quantity_units, price_per_unit } = req.body;
  const godown_id = req.user.godown_id;
  const total_amount = quantity_units * price_per_unit;

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const result = await client.query(
      `INSERT INTO counter_sales (godown_id, product_id, quantity_units, price_per_unit, total_amount)
       VALUES ($1,$2,$3,$4,$5) RETURNING *`,
      [godown_id, product_id, quantity_units, price_per_unit, total_amount]
    );

    // Decrease inventory
    const inv = await client.query(
      `SELECT quantity_cases, quantity_units FROM inventory WHERE godown_id=$1 AND product_id=$2`,
      [godown_id, product_id]
    );
    if (!inv.rows[0]) throw new Error('No inventory found');

    const bpc = (await client.query(`SELECT bottles_per_case, purchase_price FROM products WHERE id=$1`, [product_id])).rows[0];
    let totalBottles = (inv.rows[0].quantity_cases * bpc.bottles_per_case) + inv.rows[0].quantity_units;
    if (totalBottles < quantity_units) throw new Error('Insufficient stock');

    totalBottles -= quantity_units;
    const new_cases = Math.floor(totalBottles / bpc.bottles_per_case);
    const new_units = totalBottles % bpc.bottles_per_case;
    const cost_deducted = (parseFloat(bpc.purchase_price) / bpc.bottles_per_case) * quantity_units;

    await client.query(
      `UPDATE inventory SET quantity_cases=$1, quantity_units=$2, stock_value = stock_value - $3
       WHERE godown_id=$4 AND product_id=$5`,
      [new_cases, new_units, cost_deducted, godown_id, product_id]
    );

    await client.query('COMMIT');
    res.json(result.rows[0]);
  } catch (err) {
    await client.query('ROLLBACK');
    res.status(500).json({ error: err.message });
  } finally {
    client.release();
  }
});

module.exports = router;