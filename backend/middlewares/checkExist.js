// middlewares/checkExists.js
const pool = require('../db');

/**
 * Genera un middleware que valida si un registro existe en una tabla/columna dada.
 * @param {string} table - Nombre de la tabla
 * @param {string} column - Nombre de la columna a validar
 * @param {string} source - De dónde tomar el valor: 'body' | 'params' | 'query'
 * @param {string} fieldName - Nombre del campo en el request
 */
function checkExists(table, column, source = 'body', fieldName = column) {
  return async (req, res, next) => {
    const value = req[source][fieldName];
    if (!value) {
      return res.status(400).json({ error: `${fieldName} es obligatorio` });
    }

    try {
      const { rowCount } = await pool.query(
        `SELECT 1 FROM ${table} WHERE ${column} = $1`,
        [value]
      );

      if (rowCount === 0) {
        return res.status(404).json({ error: `${table} no encontrado` });
      }

      //funcion de express para seguir con el siguiente middleware o ruta
      next();
    } catch (err) {
      console.error(`Error validando existencia en ${table}:`, err);
      res.status(500).json({ error: err.message });
    }
  };
}

module.exports = { checkExists };