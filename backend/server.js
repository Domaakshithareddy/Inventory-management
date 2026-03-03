const express = require('express');
const cors = require('cors');
const compression = require('compression');
require('dotenv').config();

const app = express();

// ── Compression — shrinks response size significantly
app.use(compression());

app.use(cors());
app.use(express.json());

// ── Cache middleware
let apicache;
try {
  apicache = require('apicache');
} catch(e) {
  apicache = null;
}
const cache = apicache ? apicache.middleware : (d, req, res, next) => next();

// ── Routes — static/slow-changing data gets cached
app.use('/api/auth', require('./routes/auth'));
app.use('/api/godowns', require('./routes/godowns'));
app.use('/api/products', require('./routes/products'));
app.use('/api/companies', require('./routes/companies'));
app.use('/api/shops', require('./routes/shops'));
app.use('/api/routes', require('./routes/routes'));
app.use('/api/inventory', require('./routes/inventory'));
app.use('/api/purchases', require('./routes/purchases'));
app.use('/api/bills', require('./routes/bills'));
app.use('/api/expenses', require('./routes/expenses'));
app.use('/api/free-products', require('./routes/freeProducts'));
app.use('/api/counter-sales', require('./routes/counterSales'));
app.use('/api/reports', require('./routes/reports'));
app.use('/api/breakage', require('./routes/breakage'));
app.use('/api/bank-transactions', require('./routes/bankTransactions'));

// ── Health check
app.get('/', (req, res) => res.send('Inventory API Running'));

// ── Global error handler
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));