const express = require('express');
const router = express.Router();
const pool = require('../db');
const { checkExists } = require('../middlewares');

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
    const { user_id, type, amount, category } = req.body;

    if (!type || !category || amount === undefined) {
      return res.status(400).json({ error: 'type, category y amount son obligatorios' });
    }

    try {
      const { rows } = await pool.query(
        `INSERT INTO income (user_id, type, amount, category, created_at, updated_at)
         VALUES ($1, $2, $3, $4, NOW(), NOW())
         RETURNING *`,
        [user_id, type, amount, category]
      );
      res.status(201).json(rows[0]);
    } catch (err) {
      console.error('Error al crear ingreso:', err);
      res.status(500).json({ error: err.message });
    }
  }
);

// ✅ PUT: actualizar ingreso
router.put(
  '/:id',
  checkExists('income', 'income_id', 'params', 'id'), // valida que el ingreso exista
  async (req, res) => {
    const { id } = req.params;
    const { user_id, type, amount, category } = req.body;

    try {
      const { rows } = await pool.query(
        `UPDATE income
         SET user_id = COALESCE($1, user_id),
             type = COALESCE($2, type),
             amount = COALESCE($3, amount),
             category = COALESCE($4, category),
             updated_at = NOW()
         WHERE income_id = $5
         RETURNING *`,
        [user_id, type, amount, category, id]
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

// ✅ DELETE: eliminar ingreso
router.delete(
  '/:id',
  checkExists('income', 'income_id', 'params', 'id'),
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
  }
);
