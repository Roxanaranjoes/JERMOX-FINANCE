require('dotenv').config();
const express = require('express');
const cors = require('cors');
const pool = require('./db');

const app = express();
app.use(cors());
app.use(express.json());

const userRoutes = require('./routes/userAccount');
const incomeRoutes = require('./routes/income');
const expenseRoutes = require('./routes/expense');
const transactionRoutes = require('./routes/transaction');
const financialProfileRoutes = require('./routes/financialProfile');
const taxInfoRoutes = require('./routes/taxInfo');
const taxSummaryRoutes = require('./routes/taxSummary');
const aiRoutes = require('./routes/ai');
const reportRoutes = require('./routes/report');

app.use('/api/users', userRoutes);
app.use('/api/income', incomeRoutes);
app.use('/api/expense', expenseRoutes);
app.use('/api/transaction', transactionRoutes);
app.use('/api/financial-profile', financialProfileRoutes);
app.use('/api/tax-info', taxInfoRoutes);
app.use('/api/tax', taxSummaryRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/report', reportRoutes);

app.get('/health/live', (_req, res) => res.json({ status: 'live' }));
app.get('/health/db', async (_req, res) => {
  try {
    const { rows } = await pool.query('SELECT NOW() AS now');
    res.json({ status: 'db-ok', now: rows[0].now });
  } catch (err) {
    console.error('DB health error:', err);
    res.status(500).json({ status: 'db-error', error: err.message });
  }
});

app.get('/', (_req, res) => {
  res.json({
    message: 'Servidor Jermox funcionando correctamente',
    version: '1.0.0',
    database: 'Supabase (psql)'
  });
});

const PORT = Number(process.env.PORT || 3000);
app.listen(PORT, () => {
  console.log(`🚀 Servidor corriendo en puerto ${PORT}`);
  console.log(`http://localhost:${PORT}`);
});
