require('dotenv').config();
const express = require('express');
const cors = require('cors');
const pool = require('./db');

const app = express();
app.use(cors());
app.use(express.json());

// Rutas
const userRoutes = require('./routes/userAccounts');
app.use('/api/users', userRoutes);

const incomeRoutes = require('./routes/income');
app.use('/api/income', incomeRoutes);   

const expenseRoutes = require('./routes/expense');
app.use('/api/expense', expenseRoutes);

const transactionRoutes = require('./routes/transaction');
app.use('/api/transaction', transactionRoutes);

const financialProfileRoutes = require('./routes/financialProfile');
app.use('/api/financial-profile', financialProfileRoutes);

const taxInfoRoutes = require('./routes/taxInfo');
app.use('/api/tax-info', taxInfoRoutes);

// Rutas de salud
app.get('/health/live', (req, res) => res.json({ status: 'live' }));
app.get('/health/db', async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT NOW() AS now');
    res.json({ status: 'db-ok', now: rows[0].now });
  } catch (err) {
    console.error('DB health error:', err);
    res.status(500).json({ status: 'db-error', error: err.message });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Servidor corriendo en puerto ${PORT}`);
});
