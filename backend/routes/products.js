const router = require('express').Router();
const pool = require('../db');
const auth = require('../middleware/auth');

// Get all products
router.get('/', auth, async (req, res) => {
  const result = await pool.query(`
    SELECT p.*, c.name as company_name 
    FROM products p LEFT JOIN companies c ON p.company_id = c.id
    ORDER BY p.created_at DESC
  `);
  res.json(result.rows);
});

// Create product
router.post('/', auth, async (req, res) => {
  const { name, category, size, bottles_per_case, purchase_price, selling_price, selling_price_per_unit, breakage_penalty, is_returnable, company_id } = req.body;
  try {
    const result = await pool.query(
      `INSERT INTO products (name, category, size, bottles_per_case, purchase_price, selling_price, selling_price_per_unit, breakage_penalty, is_returnable, company_id)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING *`,
      [name, category, size, bottles_per_case, purchase_price, selling_price, selling_price_per_unit, breakage_penalty ?? 3, is_returnable ?? true, company_id]
    );
    res.json(result.rows[0]);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Update product
router.put('/:id', auth, async (req, res) => {
  const { name, category, size, bottles_per_case, purchase_price, selling_price, selling_price_per_unit, breakage_penalty, is_returnable, company_id } = req.body;
  const result = await pool.query(
    `UPDATE products SET name=$1, category=$2, size=$3, bottles_per_case=$4, purchase_price=$5, selling_price=$6, selling_price_per_unit=$7, breakage_penalty=$8, is_returnable=$9, company_id=$10
     WHERE id=$11 RETURNING *`,
    [name, category, size, bottles_per_case, purchase_price, selling_price, selling_price_per_unit, breakage_penalty, is_returnable, company_id, req.params.id]
  );
  res.json(result.rows[0]);
});

// Delete product
router.delete('/:id', auth, async (req, res) => {
  await pool.query(`DELETE FROM products WHERE id=$1`, [req.params.id]);
  res.json({ message: 'Deleted' });
});

module.exports = router;