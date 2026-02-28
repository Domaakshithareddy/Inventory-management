const router = require('express').Router();
const pool = require('../db');
const auth = require('../middleware/auth');

router.get('/', auth, async (req, res) => {
  let query = `SELECT * FROM routes`;
  const params = [];
  if (req.user.role === 'godown') {
    query += ` WHERE godown_id = $1`;
    params.push(req.user.godown_id);
  }
  const result = await pool.query(query, params);
  res.json(result.rows);
});

router.post('/', auth, async (req, res) => {
  const { name, driver_name } = req.body;
  const godown_id = req.user.godown_id;
  const result = await pool.query(
    `INSERT INTO routes (godown_id, name, driver_name) VALUES ($1,$2,$3) RETURNING *`,
    [godown_id, name, driver_name]
  );
  res.json(result.rows[0]);
});

router.put('/:id', auth, async (req, res) => {
  const { name, driver_name } = req.body;
  const result = await pool.query(
    `UPDATE routes SET name=$1, driver_name=$2 WHERE id=$3 RETURNING *`,
    [name, driver_name, req.params.id]
  );
  res.json(result.rows[0]);
});

module.exports = router;