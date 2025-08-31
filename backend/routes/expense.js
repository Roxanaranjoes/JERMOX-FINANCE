const express = require('express');
const router = express.Router();
const pool = require('../db');
const { checkExists } = require('../middlewares');

router.get('/', async (_req, res) => {
  try {
    const { rows } = await pool.query('SELECT * FROM expense ORDER BY expense_id');
    res.json(rows);
  } catch (err) {
    console.error('Error al obtener gastos:', err);
    res.status(500).json({ error: err.message });
  }
});

router.get('/user/:userId', checkExists('user_account', 'user_id', 'params', 'userId'), async (req, res) => {
  const { userId } = req.params;
  const { year, month } = req.query;
  try {
    if (year && month) {
      const y = Number(year), m = Number(month);
      const start = new Date(Date.UTC(y, m - 1, 1));
      const end = new Date(Date.UTC(y, m, 1));
      const { rows } = await pool.query(
        'SELECT * FROM expense WHERE user_id = $1 AND created_at >= $2 AND created_at < $3 ORDER BY created_at DESC',
        [userId, start.toISOString(), end.toISOString()]
      );
      return res.json(rows);
    }
    if (year) {
      const y = Number(year);
      const start = new Date(Date.UTC(y, 0, 1));
      const end = new Date(Date.UTC(y + 1, 0, 1));
      const { rows } = await pool.query(
        'SELECT * FROM expense WHERE user_id = $1 AND created_at >= $2 AND created_at < $3 ORDER BY created_at DESC',
        [userId, start.toISOString(), end.toISOString()]
      );
      return res.json(rows);
    }
    const { rows } = await pool.query('SELECT * FROM expense WHERE user_id = $1 ORDER BY created_at DESC', [userId]);
    res.json(rows);
  } catch (err) {
    console.error('Error al obtener gastos del usuario:', err);
    res.status(500).json({ error: err.message });
  }
});

router.post('/', checkExists('user_account', 'user_id', 'body', 'user_id'), async (req, res) => {
  const { user_id, type, amount, category, date } = req.body;
  if (!type || !amount || !category) return res.status(400).json({ error: 'type, amount y category son obligatorios' });
  try {
    const createdAt = date ? new Date(date) : new Date();
    if (isNaN(createdAt.getTime())) return res.status(400).json({ error: 'Fecha inválida' });
    const { rows } = await pool.query(
      `INSERT INTO expense (user_id, type, amount, category, created_at, updated_at)
       VALUES ($1,$2,$3,$4,$5,$5)
       RETURNING *`,
      [user_id, type, amount, category, createdAt.toISOString()]
    );
    res.status(201).json(rows[0]);
  } catch (err) {
    console.error('Error al crear gasto:', err);
    res.status(500).json({ error: err.message });
  }
});

router.put('/:id', checkExists('expense', 'expense_id', 'params', 'id'), async (req, res) => {
  const { id } = req.params;
  const { user_id, type, amount, category } = req.body;
  try {
    const { rows } = await pool.query(
      `UPDATE expense
       SET user_id = COALESCE($1, user_id),
           type = COALESCE($2, type),
           amount = COALESCE($3, amount),
           category = COALESCE($4, category),
           updated_at = NOW()
       WHERE expense_id = $5
       RETURNING *`,
      [user_id, type, amount, category, id]
    );
    if (!rows[0]) return res.status(404).json({ error: 'Gasto no encontrado' });
    res.json(rows[0]);
  } catch (err) {
    console.error('Error al actualizar gasto:', err);
    res.status(500).json({ error: err.message });
  }
});

router.delete('/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const { rowCount } = await pool.query('DELETE FROM expense WHERE expense_id = $1', [id]);
    if (rowCount === 0) return res.status(404).json({ error: 'Gasto no encontrado' });
    res.json({ message: 'Gasto eliminado correctamente' });
  } catch (err) {
    console.error('Error al eliminar gasto:', err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
