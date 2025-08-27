const express = require('express');
const router = express.Router();
const pool = require('../db');
const { checkExists } = require('../middlewares/checkExists');

// ✅ GET: todos los ingresos
router.get('/', async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT * FROM income ORDER BY income_id');
    res.json(rows);
  } catch (err) {
    console.error('Error al obtener ingresos:', err);
    res.status(500).json({ error: err.message });
  }
});

// ✅ GET: ingresos de un usuario específico (valida que el usuario exista)
router.get(
  '/user/:userId',
  checkExists('user_account', 'user_id', 'params', 'userId'),
  async (req, res) => {
    const { userId } = req.params;
    try {
      const { rows } = await pool.query(
        'SELECT * FROM income WHERE user_id = $1 ORDER BY created_at DESC',
        [userId]
      );
      res.json(rows);
    } catch (err) {
      console.error('Error al obtener ingresos del usuario:', err);
      res.status(500).json({ error: err.message });
    }
  }
);

// ✅ POST: crear un nuevo ingreso (valida que el usuario exista)
router.post(
  '/',
  checkExists('user_account', 'user_id', 'body', 'user_id'),
  async (req, res) => {
    const { user_id, category, type, amount } = req.body;

    if (!category || !type || !amount) {
      return res.status(400).json({ error: 'category, type y amount son obligatorios' });
    }

    try {
      const { rows } = await pool.query(
        `INSERT INTO income (user_id, category, type, amount, created_at, updated_at)
         VALUES ($1, $2, $3, $4, NOW(), NOW())
         RETURNING *`,
        [user_id, category, type, amount]
      );
      res.status(201).json(rows[0]);
    } catch (err) {
      console.error('Error al crear ingreso:', err);
      res.status(500).json({ error: err.message });
    }
  }
);

// ✅ PUT: actualizar un ingreso (valida que el usuario exista si se envía user_id)
router.put(
  '/:id',
  checkExists('user_account', 'user_id', 'body', 'user_id'),
  async (req, res) => {
    const { id } = req.params;
    const { user_id, category, type, amount } = req.body;

    try {
      const { rows } = await pool.query(
        `UPDATE income
         SET user_id = $1,
             category = $2,
             type = $3,
             amount = $4,
             updated_at = NOW()
         WHERE income_id = $5
         RETURNING *`,
        [user_id, category, type, amount, id]
      );

      if (rows.length === 0) {
        return res.status(404).json({ error: 'Ingreso no encontrado' });
      }

      res.json(rows[0]);
    } catch (err) {
      console.error('Error al actualizar ingreso:', err);
      res.status(500).json({ error: err.message });
    }
  }
);

// ✅ DELETE: eliminar un ingreso (no necesita validar user_id, pero sí existencia del ingreso)
router.delete('/:id', 
    checkExists('user_account', 'user_id', 'body', 'user_id'),
    async (req, res) => {
  const { id } = req.params;

  try {
    const { rowCount } = await pool.query(
      'DELETE FROM income WHERE income_id = $1',
      [id]
    );

    if (rowCount === 0) {
      return res.status(404).json({ error: 'Ingreso no encontrado' });
    }

    res.json({ message: 'Ingreso eliminado correctamente' });
  } catch (err) {
    console.error('Error al eliminar ingreso:', err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
