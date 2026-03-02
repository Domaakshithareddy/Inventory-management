const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

app.use('/api/auth', require('./routes/auth'));
app.use('/api/godowns', require('./routes/godowns'));
app.use('/api/products', require('./routes/products'));
app.use('/api/inventory', require('./routes/inventory'));
app.use('/api/companies', require('./routes/companies'));
app.use('/api/purchases', require('./routes/purchases'));
app.use('/api/shops', require('./routes/shops'));
app.use('/api/routes', require('./routes/routes'));
app.use('/api/bills', require('./routes/bills'));
app.use('/api/expenses', require('./routes/expenses'));
app.use('/api/free-products', require('./routes/freeProducts'));
app.use('/api/counter-sales', require('./routes/counterSales'));
app.use('/api/reports', require('./routes/reports'));
app.use('/api/breakage', require('./routes/breakage'));

app.get('/', (req, res) => res.send('Inventory API Running'));

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));