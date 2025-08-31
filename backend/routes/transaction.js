const express = require('express');
const router = express.Router();
const pool = require('../db');
const { checkExists, checkReferenceExists } = require('../middlewares');

router.get('/', async (_req, res) => {
  try {
    const { rows } = await pool.query('SELECT * FROM transaction ORDER BY transaction_id DESC');
    res.json(rows);
  } catch (err) {
    console.error('Error al obtener transacciones:', err);
    res.status(500).json({ error: err.message });
  }
});

router.get('/user/:userId', checkExists('user_account', 'user_id', 'params', 'userId'), async (req, res) => {
  const { userId } = req.params;
  try {
    const { rows } = await pool.query('SELECT * FROM transaction WHERE user_id = $1 ORDER BY created_at DESC', [userId]);
    res.json(rows);
  } catch (err) {
    console.error('Error al obtener transacciones del usuario:', err);
    res.status(500).json({ error: err.message });
  }
});

router.post('/', checkExists('user_account', 'user_id', 'body', 'user_id'), checkReferenceExists, async (req, res) => {
  const { user_id, type, reference_id } = req.body;
  try {
    const { rows } = await pool.query(
      `INSERT INTO transaction (user_id, type, reference_id, created_at, updated_at)
       VALUES ($1,$2,$3,NOW(),NOW())
       RETURNING *`,
      [user_id, type, reference_id]
    );
    res.status(201).json(rows[0]);
  } catch (err) {
    console.error('Error al crear transacción:', err);
    res.status(500).json({ error: err.message });
  }
});

router.put('/:id',
  checkExists('transaction', 'transaction_id', 'params', 'id'),
  checkExists('user_account', 'user_id', 'body', 'user_id'),
  checkReferenceExists,
  async (req, res) => {
    const { id } = req.params;
    const { user_id, type, reference_id } = req.body;
    try {
      const { rows } = await pool.query(
        `UPDATE transaction
         SET user_id = $1, type = $2, reference_id = $3, updated_at = NOW()
         WHERE transaction_id = $4
         RETURNING *`,
        [user_id, type, reference_id, id]
      );
      if (!rows[0]) return res.status(404).json({ error: 'Transacción no encontrada' });
      res.json(rows[0]);
    } catch (err) {
      console.error('Error al actualizar transacción:', err);
      res.status(500).json({ error: err.message });
    }
  }
);

router.delete('/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const { rowCount } = await pool.query('DELETE FROM transaction WHERE transaction_id = $1', [id]);
    if (rowCount === 0) return res.status(404).json({ error: 'Transacción no encontrada' });
    res.json({ message: 'Transacción eliminada correctamente' });
  } catch (err) {
    console.error('Error al eliminar transacción:', err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
