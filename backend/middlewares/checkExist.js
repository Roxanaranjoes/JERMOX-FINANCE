// middlewares/checkExist.js
const pool = require('../db');

function checkExists(table, column, source = 'body', fieldName = column) {
  return async (req, res, next) => {
    const bag = req[source] || {};
    const value = bag[fieldName];

    if (value === undefined || value === null || value === '') {
      return res.status(400).json({ error: `${fieldName} es obligatorio` });
    }

    try {
      const { rowCount } = await pool.query(
        `SELECT 1 FROM ${table} WHERE ${column} = $1 LIMIT 1`,
        [value]
      );
      if (rowCount === 0) {
        return res.status(404).json({ error: `${table} no encontrado` });
      }
      next();
    } catch (err) {
      console.error(`Error validando existencia en ${table}:`, err);
      res.status(500).json({ error: 'Error validando existencia' });
    }
  };
}

module.exports = { checkExists };
