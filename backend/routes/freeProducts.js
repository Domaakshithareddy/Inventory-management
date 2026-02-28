const router = require('express').Router();
const pool = require('../db');
const auth = require('../middleware/auth');

router.get('/', auth, async (req, res) => {
  let query = `SELECT fp.*, p.name as product_name, p.size, p.category 
               FROM free_products fp JOIN products p ON fp.product_id = p.id`;
  const params = [];
  if (req.user.role === 'godown') {
    query += ` WHERE fp.godown_id = $1`;
    params.push(req.user.godown_id);
  }
  query += ` ORDER BY fp.created_at DESC`;
  const result = await pool.query(query, params);
  res.json(result.rows);
});

router.post('/', auth, async (req, res) => {
  const { product_id, quantity_units, notes, given_date } = req.body;
  const godown_id = req.user.godown_id;

  if (!quantity_units || quantity_units <= 0) {
    return res.status(400).json({ error: 'quantity_units must be greater than 0' });
  }

  const result = await pool.query(
    `INSERT INTO free_products (godown_id, product_id, quantity_units, notes, given_date) 
     VALUES ($1,$2,$3,$4,$5) RETURNING *`,
    [godown_id, product_id, quantity_units, notes, given_date || new Date()]
  );
  res.json(result.rows[0]);
});

router.put('/:id', auth, async (req, res) => {
  const { quantity_units, notes, given_date } = req.body;
  const result = await pool.query(
    `UPDATE free_products SET quantity_units=$1, notes=$2, given_date=$3 
     WHERE id=$4 RETURNING *`,
    [quantity_units, notes, given_date, req.params.id]
  );
  res.json(result.rows[0]);
});

router.delete('/:id', auth, async (req, res) => {
  await pool.query(`DELETE FROM free_products WHERE id=$1`, [req.params.id]);
  res.json({ message: 'Deleted' });
});

module.exports = router;