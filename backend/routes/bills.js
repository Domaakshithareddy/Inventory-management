const router = require('express').Router();
const pool = require('../db');
const auth = require('../middleware/auth');

// Get bills
router.get('/', auth, async (req, res) => {
  let query = `
    SELECT b.*, s.name as shop_name, g.name as godown_name
    FROM bills b JOIN shops s ON b.shop_id = s.id JOIN godowns g ON b.godown_id = g.id
  `;
  const params = [];
  if (req.user.role === 'godown') {
    query += ` WHERE b.godown_id = $1`;
    params.push(req.user.godown_id);
  }
  query += ` ORDER BY b.created_at DESC`;
  const result = await pool.query(query, params);
  res.json(result.rows);
});

// Get bill items
router.get('/:id/items', auth, async (req, res) => {
  const result = await pool.query(
    `SELECT bi.*, p.name as product_name FROM bill_items bi
     JOIN products p ON bi.product_id = p.id WHERE bi.bill_id=$1`,
    [req.params.id]
  );
  res.json(result.rows);
});

// Create bill (auto decreases inventory)
router.post('/', auth, async (req, res) => {
  const { shop_id, items } = req.body;
  const godown_id = req.user.godown_id;
  if (!godown_id) return res.status(400).json({ error: 'Admin cannot create bills.' });

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const total_amount = items.reduce((sum, i) => sum + parseFloat(i.total_price), 0);

    const bill = await client.query(
      `INSERT INTO bills (godown_id, shop_id, total_amount) VALUES ($1,$2,$3) RETURNING *`,
      [godown_id, shop_id, total_amount]
    );
    const bill_id = bill.rows[0].id;

    for (const item of items) {
      await client.query(
        `INSERT INTO bill_items (bill_id, product_id, quantity_cases, quantity_units, bottles_per_case, price_per_case, price_per_unit, total_price)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`,
        [bill_id, item.product_id, item.quantity_cases || 0, item.quantity_units || 0,
         item.bottles_per_case, item.price_per_case, item.price_per_unit, item.total_price]
      );

      // Auto decrease inventory
      const inv = await client.query(
        `SELECT quantity_cases FROM inventory WHERE godown_id=$1 AND product_id=$2`,
        [godown_id, item.product_id]
      );
      if (!inv.rows[0] || inv.rows[0].quantity_cases < item.quantity_cases) {
        throw new Error(`Insufficient stock for product ${item.product_id}`);
      }

      const purchase_price = await client.query(
        `SELECT purchase_price FROM products WHERE id=$1`, [item.product_id]
      );
      const cost = purchase_price.rows[0].purchase_price * item.quantity_cases;

      await client.query(
        `UPDATE inventory SET
           quantity_cases = quantity_cases - $1,
           stock_value = stock_value - $2
         WHERE godown_id=$3 AND product_id=$4`,
        [item.quantity_cases, cost, godown_id, item.product_id]
      );
    }

    await client.query('COMMIT');
    res.json(bill.rows[0]);
  } catch (err) {
    await client.query('ROLLBACK');
    res.status(500).json({ error: err.message });
  } finally {
    client.release();
  }
});

module.exports = router;