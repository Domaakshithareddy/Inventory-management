const router = require('express').Router();
const pool = require('../db');
const auth = require('../middleware/auth');

// Get inventory - filtered by godown for godown users, all for admin
router.get('/', auth, async (req, res) => {
  let query = `
    SELECT i.*, p.name as product_name, p.category, p.size, p.bottles_per_case,
           p.purchase_price, g.name as godown_name
    FROM inventory i
    JOIN products p ON i.product_id = p.id
    JOIN godowns g ON i.godown_id = g.id
  `;
  const params = [];
  if (req.user.role === 'godown') {
    query += ` WHERE i.godown_id = $1`;
    params.push(req.user.godown_id);
  }
  query += ` ORDER BY p.name`;
  const result = await pool.query(query, params);
  res.json(result.rows);
});

module.exports = router;