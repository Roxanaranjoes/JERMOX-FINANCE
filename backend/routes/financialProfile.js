const express = require('express');
const router = express.Router();
const pool = require('../db');
const { checkExists } = require('../middlewares');

// ✅ GET: todos los perfiles financieros
router.get('/', async (req, res) => {
  try {
    const { rows } = await pool.query(
      'SELECT * FROM financial_profile ORDER BY profile_id DESC'
    );
    res.json(rows);
  } catch (err) {
    console.error('Error al obtener perfiles financieros:', err);
    res.status(500).json({ error: err.message });
  }
});

// ✅ GET: perfil financiero de un usuario
router.get(
  '/user/:userId',
  checkExists('user_account', 'user_id', 'params', 'userId'),
  async (req, res) => {
    const { userId } = req.params;
    try {
      const { rows } = await pool.query(
        'SELECT * FROM financial_profile WHERE user_id = $1',
        [userId]
      );
      if (rows.length === 0) {
        return res.status(404).json({ error: 'Perfil financiero no encontrado' });
      }
      res.json(rows[0]);
    } catch (err) {
      console.error('Error al obtener perfil financiero:', err);
      res.status(500).json({ error: err.message });
    }
  }
);

// ✅ POST: crear perfil financiero
router.post(
  ' /',
  checkExists('user_account', 'user_id', 'body', 'user_id'),
  async (req, res) => {
    const { user_id, income, expenses, savings, risk_tolerance } = req.body;
    try {
      const { rows } = await pool.query(
        `INSERT INTO financial_profile (user_id, income, expenses, savings, risk_tolerance)
         VALUES ($1, $2, $3, $4, $5)
         RETURNING *`,
        [user_id, income, expenses, savings || 0, risk_tolerance]
      );
      res.status(201).json(rows[0]);
    } catch (err) {
      console.error('Error al crear perfil financiero:', err);
      res.status(500).json({ error: err.message });
    }
  }
);

// ✅ PUT: actualizar perfil financiero
router.put(
  '/:id',
  checkExists('financial_profile', 'profile_id', 'params', 'id'),
  async (req, res) => {
    const { id } = req.params;
    const { income, expenses, savings, risk_tolerance } = req.body;
    try {
      const { rows } = await pool.query(
        `UPDATE financial_profile
         SET income = $1, expenses = $2, savings = $3, risk_tolerance = $4, updated_at = NOW()
         WHERE profile_id = $5
         RETURNING *`,
        [income, expenses, savings, risk_tolerance, id]
      );
      res.json(rows[0]);
    } catch (err) {
      console.error('Error al actualizar perfil financiero:', err);
      res.status(500).json({ error: err.message });
    }
  }
);

// ✅ DELETE: eliminar perfil financiero
router.delete(
  '/:id',
  checkExists('financial_profile', 'profile_id', 'params', 'id'),
  async (req, res) => {
    const { id } = req.params;
    try {
      const { rowCount } = await pool.query(
        'DELETE FROM financial_profile WHERE profile_id = $1',
        [id]
      );
      if (rowCount === 0) {
        return res.status(404).json({ error: 'Perfil financiero no encontrado' });
      }
      res.json({ message: 'Perfil financiero eliminado correctamente' });
    } catch (err) {
      console.error('Error al eliminar perfil financiero:', err);
      res.status(500).json({ error: err.message });
    }
  }
);

module.exports = router;
