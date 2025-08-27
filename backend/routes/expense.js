const express = require('express');
const router = express.Router();
const pool = require('../db');
const { checkExists } = require('../middlewares/checkExists');

// ✅ GET: todos los gastos
router.get('/', async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT * FROM expense ORDER BY expense_id');
    res.json(rows);
  } catch (err) {
    console.error('Error al obtener gastos:', err);
    res.status(500).json({ error: err.message });
  }
});

// ✅ GET: gastos de un usuario específico (valida que el usuario exista)
router.get(
  '/user/:userId',
  checkExists('user_account', 'user_id', 'params', 'userId'),
  async (req, res) => {
    const { userId } = req.params;
    try {
      const { rows } = await pool.query(
        'SELECT * FROM expense WHERE user_id = $1 ORDER BY created_at DESC',
        [userId]
      );
      res.json(rows);
    } catch (err) {
      console.error('Error al obtener gastos del usuario:', err);
      res.status(500).json({ error: err.message });
    }
  }
);

// ✅ POST: crear un nuevo gasto (valida que el usuario exista)
router.post(
  '/',
  checkExists('user_account', 'user_id', 'body', 'user_id'),
  async (req, res) => {
    const { user_id, type, amount, category } = req.body;

    if (!type || !amount || !category) {
      return res.status(400).json({ error: 'type, amount y category son obligatorios' });
    }

    try {
      const { rows } = await pool.query(
        `INSERT INTO expense (user_id, type, amount, category, created_at, updated_at)
         VALUES ($1, $2, $3, $4, NOW(), NOW())
         RETURNING *`,
        [user_id, type, amount, category]
      );
      res.status(201).json(rows[0]);
    } catch (err) {
      console.error('Error al crear gasto:', err);
      res.status(500).json({ error: err.message });
    }
  }
);

// ✅ PUT: actualizar un gasto (valida que el usuario exista si se envía user_id)
router.put(
  '/:id',
  checkExists('user_account', 'user_id', 'body', 'user_id'),
  async (req, res) => {
    const { id } = req.params;
    const { user_id, type, amount, category } = req.body;

    try {
      const { rows } = await pool.query(
        `UPDATE expense
         SET user_id = $1,
             type = $2,
             amount = $3,
             category = $4,
             updated_at = NOW()
         WHERE expense_id = $5
         RETURNING *`,
        [user_id, type, amount, category, id]
      );

      if (rows.length === 0) {
        return res.status(404).json({ error: 'Gasto no encontrado' });
      }

      res.json(rows[0]);
    } catch (err) {
      console.error('Error al actualizar gasto:', err);
      res.status(500).json({ error: err.message });
    }
  }
);

// ✅ DELETE: eliminar un gasto
router.delete('/:id', async (req, res) => {
  const { id } = req.params;

  try {
    const { rowCount } = await pool.query(
      'DELETE FROM expense WHERE expense_id = $1',
      [id]
    );

    if (rowCount === 0) {
      return res.status(404).json({ error: 'Gasto no encontrado' });
    }

    res.json({ message: 'Gasto eliminado correctamente' });
  } catch (err) {
    console.error('Error al eliminar gasto:', err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
