const router = require('express').Router();
const pool = require('../db');
const auth = require('../middleware/auth');

const VALID_TYPES = ['DEPOSIT', 'WITHDRAWAL', 'BORROW_CASH', 'BORROW_BANK', 'RETURN_CASH', 'RETURN_BANK'];

// GET ALL transactions + computed cash summary
router.get('/', auth, async (req, res) => {
  const { godown_id } = req.user;

  try {
    const txResult = await pool.query(
      `SELECT * FROM bank_transactions WHERE godown_id = $1 ORDER BY transaction_date DESC, created_at DESC`,
      [godown_id]
    );

    const csResult = await pool.query(
      `SELECT COALESCE(SUM(total_amount), 0) as total FROM counter_sales WHERE godown_id = $1`,
      [godown_id]
    );

    const billsResult = await pool.query(
      `SELECT COALESCE(SUM(paid_amount), 0) as total FROM bills WHERE godown_id = $1`,
      [godown_id]
    );

    const txRows = txResult.rows;

    const sum = (type) => txRows
      .filter(t => t.type === type)
      .reduce((s, t) => s + parseFloat(t.amount), 0);

    const totalDeposits    = sum('DEPOSIT');
    const totalWithdrawals = sum('WITHDRAWAL');
    const totalBorrowCash  = sum('BORROW_CASH');
    const totalBorrowBank  = sum('BORROW_BANK');
    const totalReturnCash  = sum('RETURN_CASH');
    const totalReturnBank  = sum('RETURN_BANK');

    const counterSalesTotal = parseFloat(csResult.rows[0].total);
    const billsPaidTotal    = parseFloat(billsResult.rows[0].total);

    // Cash in hand:
    //   + counter sales
    //   + bills collected
    //   - deposited to bank
    //   - borrowed from cash (lent out, so cash decreases)
    //   + returned to cash (got it back, so cash increases)
    const cashInHand =
      counterSalesTotal +
      billsPaidTotal -
      totalDeposits -
      totalBorrowCash +
      totalReturnCash;

    // Cash in bank:
    //   + deposits from cash
    //   - bank withdrawals (expenses)
    //   - borrowed from bank (lent out, so bank decreases)
    //   + returned to bank (got it back, so bank increases)
    const cashInBank =
      totalDeposits -
      totalWithdrawals -
      totalBorrowBank +
      totalReturnBank;

    res.json({
      transactions: txRows,
      summary: {
        counter_sales_total: counterSalesTotal,
        bills_paid_total: billsPaidTotal,
        total_deposits: totalDeposits,
        total_withdrawals: totalWithdrawals,
        total_borrow_cash: totalBorrowCash,
        total_borrow_bank: totalBorrowBank,
        total_return_cash: totalReturnCash,
        total_return_bank: totalReturnBank,
        cash_in_hand: cashInHand,
        cash_in_bank: cashInBank
      }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST
router.post('/', auth, async (req, res) => {
  if (req.user.role === 'admin') return res.status(403).json({ error: 'Admins cannot add transactions' });

  const { type, amount, notes, transaction_date } = req.body;
  const godown_id = req.user.godown_id;

  if (!VALID_TYPES.includes(type)) {
    return res.status(400).json({ error: 'Invalid transaction type' });
  }
  if (!amount || parseFloat(amount) <= 0) {
    return res.status(400).json({ error: 'Amount must be greater than 0' });
  }

  try {
    const result = await pool.query(
      `INSERT INTO bank_transactions (godown_id, type, amount, notes, transaction_date)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [godown_id, type, parseFloat(amount), notes || null, transaction_date]
    );
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT
router.put('/:id', auth, async (req, res) => {
  if (req.user.role === 'admin') return res.status(403).json({ error: 'Admins cannot edit transactions' });

  const { type, amount, notes, transaction_date } = req.body;
  const godown_id = req.user.godown_id;

  if (!VALID_TYPES.includes(type)) {
    return res.status(400).json({ error: 'Invalid transaction type' });
  }
  if (!amount || parseFloat(amount) <= 0) {
    return res.status(400).json({ error: 'Amount must be greater than 0' });
  }

  try {
    const existing = await pool.query(
      `SELECT * FROM bank_transactions WHERE id = $1 AND godown_id = $2`,
      [req.params.id, godown_id]
    );
    if (!existing.rows[0]) return res.status(404).json({ error: 'Transaction not found' });

    const result = await pool.query(
      `UPDATE bank_transactions SET type=$1, amount=$2, notes=$3, transaction_date=$4 WHERE id=$5 AND godown_id=$6 RETURNING *`,
      [type, parseFloat(amount), notes || null, transaction_date, req.params.id, godown_id]
    );
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE
router.delete('/:id', auth, async (req, res) => {
  if (req.user.role === 'admin') return res.status(403).json({ error: 'Admins cannot delete transactions' });

  const godown_id = req.user.godown_id;

  try {
    const existing = await pool.query(
      `SELECT * FROM bank_transactions WHERE id = $1 AND godown_id = $2`,
      [req.params.id, godown_id]
    );
    if (!existing.rows[0]) return res.status(404).json({ error: 'Transaction not found' });

    await pool.query(`DELETE FROM bank_transactions WHERE id = $1`, [req.params.id]);
    res.json({ message: 'Transaction deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;