// middlewares/checkReferenceExists.js
const pool = require('../db');

const checkReferenceExists = async (req, res, next) => {
  const { type, reference_id } = req.body;

  if (!type || !reference_id) {
    return res.status(400).json({ error: 'type y reference_id son obligatorios' });
  }

  let table, column;
  if (type === 'income') {
    table = 'income';
    column = 'income_id';
  } else if (type === 'expense') {
    table = 'expense';
    column = 'expense_id';
  } else {
    return res.status(400).json({ error: 'type inválido (income o expense)' });
  }

  try {
    const { rows } = await pool.query(
      `SELECT 1 FROM ${table} WHERE ${column} = $1 LIMIT 1`,
      [reference_id]
    );

    if (rows.length === 0) {
      return res.status(404).json({
        error: `reference_id no encontrado en ${table}`
      });
    }

    next();
  } catch (err) {
    console.error('Error verificando referencia:', err);
    res.status(500).json({ error: err.message });
  }
};

module.exports = checkReferenceExists;
