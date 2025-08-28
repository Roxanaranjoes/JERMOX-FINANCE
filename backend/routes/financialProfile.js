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
  '/',
  checkExists('user_account', 'user_id', 'body', 'user_id'),
  async (req, res) => {
    const { user_id, monthly_income, monthly_expense, savings_percentage, goal, time_horizon, risk_tolerance, biggest_expense, has_debt, debt_amount, debt_type, tips_preference } = req.body;
    try {
      const { rows } = await pool.query(
        `INSERT INTO financial_profile (user_id, monthly_income, monthly_expense, savings_percentage, goal, time_horizon, risk_tolerance, biggest_expense, has_debt, debt_amount, debt_type, tips_preference)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
         RETURNING *`,
        [user_id, monthly_income, monthly_expense, savings_percentage || 0, goal, time_horizon, risk_tolerance, biggest_expense, has_debt, debt_amount, debt_type, tips_preference]
      );
      if (rows.length === 0) {
        return res.status(404).json({ error: 'Perfil financiero no encontrado' });
      }
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
    const { user_id, monthly_income, monthly_expense, savings_percentage, goal, time_horizon, risk_tolerance, biggest_expense, has_debt, debt_amount, debt_type, tips_preference } = req.body;
    try {
      const { rows } = await pool.query(
        `UPDATE financial_profile
         SET user_id = $1, 
         monthly_income = $2, 
         monthly_expense = $3, 
         savings_percentage = $4, 
         goal = $5, 
         time_horizon = $6, 
         risk_tolerance = $7, 
         biggest_expense = $8, 
         has_debt = $9, 
         debt_amount = $10, 
         debt_type = $11, 
         tips_preference = $12 
         WHERE profile_id = $13
         RETURNING *`,
        [user_id, monthly_income, monthly_expense, savings_percentage, goal, time_horizon, risk_tolerance, biggest_expense, has_debt, debt_amount, debt_type, tips_preference, id]
      );
      if (rows.length === 0) {
        return res.status(404).json({ error: 'Perfil financiero no encontrado' });
      }
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
