const express = require('express');
const router = express.Router();
const pool = require('../db');
const { checkExists } = require('../middlewares');

router.get('/', async (_req, res) => {
  try {
    const { rows } = await pool.query('SELECT * FROM financial_profile ORDER BY profile_id DESC');
    res.json(rows);
  } catch (err) {
    console.error('Error al obtener perfiles financieros:', err);
    res.status(500).json({ error: err.message });
  }
});

router.get('/user/:userId', checkExists('user_account', 'user_id', 'params', 'userId'), async (req, res) => {
  const { userId } = req.params;
  try {
    const { rows } = await pool.query('SELECT * FROM financial_profile WHERE user_id = $1', [userId]);
    if (!rows[0]) return res.status(404).json({ error: 'Perfil financiero no encontrado' });
    res.json(rows[0]);
  } catch (err) {
    console.error('Error al obtener perfil financiero:', err);
    res.status(500).json({ error: err.message });
  }
});

router.post('/', checkExists('user_account', 'user_id', 'body', 'user_id'), async (req, res) => {
  const {
    user_id, monthly_income, monthly_expense, savings_percentage, goal,
    time_horizon, risk_tolerance, biggest_expense, has_debt, debt_amount, debt_type, tips_preference
  } = req.body;

  try {
    const { rows } = await pool.query(
      `INSERT INTO financial_profile
       (user_id, monthly_income, monthly_expense, savings_percentage, goal, time_horizon,
        risk_tolerance, biggest_expense, has_debt, debt_amount, debt_type, tips_preference)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)
       RETURNING *`,
      [
        user_id, monthly_income, monthly_expense, savings_percentage || 0, goal, time_horizon,
        risk_tolerance, biggest_expense, has_debt, debt_amount, debt_type, tips_preference
      ]
    );
    res.status(201).json(rows[0]);
  } catch (err) {
    console.error('Error al crear perfil financiero:', err);
    res.status(500).json({ error: err.message });
  }
});

router.put('/:id', checkExists('financial_profile', 'profile_id', 'params', 'id'), async (req, res) => {
  const { id } = req.params;
  const {
    user_id, monthly_income, monthly_expense, savings_percentage, goal,
    time_horizon, risk_tolerance, biggest_expense, has_debt, debt_amount, debt_type, tips_preference
  } = req.body;

  try {
    const { rows } = await pool.query(
      `UPDATE financial_profile
       SET user_id = COALESCE($1, user_id),
           monthly_income = COALESCE($2, monthly_income),
           monthly_expense = COALESCE($3, monthly_expense),
           savings_percentage = COALESCE($4, savings_percentage),
           goal = COALESCE($5, goal),
           time_horizon = COALESCE($6, time_horizon),
           risk_tolerance = COALESCE($7, risk_tolerance),
           biggest_expense = COALESCE($8, biggest_expense),
           has_debt = COALESCE($9, has_debt),
           debt_amount = COALESCE($10, debt_amount),
           debt_type = COALESCE($11, debt_type),
           tips_preference = COALESCE($12, tips_preference)
       WHERE profile_id = $13
       RETURNING *`,
      [
        user_id, monthly_income, monthly_expense, savings_percentage, goal,
        time_horizon, risk_tolerance, biggest_expense, has_debt, debt_amount, debt_type, tips_preference, id
      ]
    );
    if (!rows[0]) return res.status(404).json({ error: 'Perfil financiero no encontrado' });
    res.json(rows[0]);
  } catch (err) {
    console.error('Error al actualizar perfil financiero:', err);
    res.status(500).json({ error: err.message });
  }
});

router.delete('/:id', checkExists('financial_profile', 'profile_id', 'params', 'id'), async (req, res) => {
  const { id } = req.params;
  try {
    const { rowCount } = await pool.query('DELETE FROM financial_profile WHERE profile_id = $1', [id]);
    if (rowCount === 0) return res.status(404).json({ error: 'Perfil financiero no encontrado' });
    res.json({ message: 'Perfil financiero eliminado correctamente' });
  } catch (err) {
    console.error('Error al eliminar perfil financiero:', err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
