const router = require('express').Router();
const pool = require('../db');
const auth = require('../middleware/auth');

router.get('/', auth, async (req, res) => {
  let query = `SELECT e.*, g.name as godown_name FROM expenses e JOIN godowns g ON e.godown_id = g.id`;
  const params = [];
  if (req.user.role === 'godown') {
    query += ` WHERE e.godown_id = $1`;
    params.push(req.user.godown_id);
  }
  query += ` ORDER BY e.expense_date DESC`;
  const result = await pool.query(query, params);
  res.json(result.rows);
});

router.post('/', auth, async (req, res) => {
  const { type, amount, notes, expense_date } = req.body;
  const godown_id = req.user.godown_id;
  const result = await pool.query(
    `INSERT INTO expenses (godown_id, type, amount, notes, expense_date) VALUES ($1,$2,$3,$4,$5) RETURNING *`,
    [godown_id, type, amount, notes, expense_date]
  );
  res.json(result.rows[0]);
});

router.put('/:id', auth, async (req, res) => {
  const { type, amount, notes, expense_date } = req.body;
  const result = await pool.query(
    `UPDATE expenses SET type=$1, amount=$2, notes=$3, expense_date=$4 WHERE id=$5 RETURNING *`,
    [type, amount, notes, expense_date, req.params.id]
  );
  res.json(result.rows[0]);
});

router.delete('/:id', auth, async (req, res) => {
  await pool.query(`DELETE FROM expenses WHERE id=$1`, [req.params.id]);
  res.json({ message: 'Deleted' });
});

module.exports = router;