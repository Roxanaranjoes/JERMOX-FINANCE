const express = require('express');
const router = express.Router();
const pool = require('../db');
const { checkExists } = require('../middlewares');

// ✅ GET: todos los registros de impuestos
router.get('/', async (req, res) => {
  try {
    const { rows } = await pool.query(
      'SELECT * FROM tax_info ORDER BY tax_info_id DESC'
    );
    res.json(rows);
  } catch (err) {
    console.error('Error al obtener tax_info:', err);
    res.status(500).json({ error: err.message });
  }
});

// ✅ GET: registro de impuestos de un usuario
router.get(
  '/user/:userId',
  checkExists('user_account', 'user_id', 'params', 'userId'),
  async (req, res) => {
    const { userId } = req.params;
    try {
      const { rows } = await pool.query(
        'SELECT * FROM tax_info WHERE user_id = $1',
        [userId]
      );
      if (rows.length === 0) {
        return res.status(404).json({ error: 'Registro de impuestos no encontrado' });
      }
      res.json(rows[0]);
    } catch (err) {
      console.error('Error al obtener tax_info:', err);
      res.status(500).json({ error: err.message });
    }
  }
);

// ✅ POST: crear registro de impuestos
router.post(
  '/',
  checkExists('user_account', 'user_id', 'body', 'user_id'),
  async (req, res) => {
    const { user_id, gross_income, taxable_income, tax_paid } = req.body;
    try {
      const { rows } = await pool.query(
        `INSERT INTO tax_info (user_id, gross_income, taxable_income, tax_paid, created_at, updated_at)
         VALUES ($1, $2, $3, $4, NOW(), NOW())
         RETURNING *`,
        [user_id, gross_income, taxable_income, tax_paid]
      );
      res.status(201).json(rows[0]);
    } catch (err) {
      console.error('Error al crear tax_info:', err);
      res.status(500).json({ error: err.message });
    }
  }
);

// ✅ PUT: actualizar registro de impuestos
router.put(
  '/:id',
  checkExists('tax_info', 'tax_info_id', 'params', 'id'),
  async (req, res) => {
    const { id } = req.params;
    const { gross_income, taxable_income, tax_paid } = req.body;
    try {
      const { rows } = await pool.query(
        `UPDATE tax_info
         SET gross_income = $1,
             taxable_income = $2,
             tax_paid = $3,
             updated_at = NOW()
         WHERE tax_info_id = $4
         RETURNING *`,
        [gross_income, taxable_income, tax_paid, id]
      );
      res.json(rows[0]);
    } catch (err) {
      console.error('Error al actualizar tax_info:', err);
      res.status(500).json({ error: err.message });
    }
  }
);

// ✅ DELETE: eliminar registro de impuestos
router.delete(
  '/:id',
  checkExists('tax_info', 'tax_info_id', 'params', 'id'),
  async (req, res) => {
    const { id } = req.params;
    try {
      const { rowCount } = await pool.query(
        'DELETE FROM tax_info WHERE tax_info_id = $1',
        [id]
      );
      if (rowCount === 0) {
        return res.status(404).json({ error: 'Registro de impuestos no encontrado' });
      }
      res.json({ message: 'Registro de impuestos eliminado correctamente' });
    } catch (err) {
      console.error('Error al eliminar tax_info:', err);
      res.status(500).json({ error: err.message });
    }
  }
);

module.exports = router;
