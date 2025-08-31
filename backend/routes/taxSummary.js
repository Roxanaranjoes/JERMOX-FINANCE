const express = require('express');
const router = express.Router();
const pool = require('../db');

const CO_UVT = Number(process.env.CO_UVT || 47065);
let BRACKETS = [];
try { BRACKETS = JSON.parse(process.env.TAX_BRACKETS_JSON || '[]'); } catch { BRACKETS = []; }

router.get('/summary/:userId', async (req, res) => {
  const { userId } = req.params;

  const { rows } = await pool.query('SELECT * FROM tax_info WHERE user_id = $1', [userId]);
  if (!rows[0]) return res.status(404).json({ msg: 'Sin tax_info para el usuario' });

  const ingresos = Number(rows[0].total_income || 0);
  const gastos   = Number(rows[0].total_expense || 0);
  const deducciones = Math.min(gastos, Math.floor(ingresos * 0.4)); // tope 40% (MVP)
  const base = Math.max(0, ingresos - deducciones);

  let impuesto = Math.round(base * 0.1); // fallback 10%

  if (CO_UVT > 0 && Array.isArray(BRACKETS) && BRACKETS.length) {
    const baseUVT = base / CO_UVT;
    let remaining = baseUVT;
    let prevMax = 0;
    let taxCOP = 0;

    for (const b of BRACKETS) {
      const top = b.max_uvt === null ? Infinity : b.max_uvt;
      const slice = Math.max(0, Math.min(remaining, top - prevMax));
      if (slice > 0) {
        const sliceTaxUVT = (b.marginal_uvt || 0) + slice * (b.rate || 0);
        taxCOP += sliceTaxUVT * CO_UVT;
        remaining -= slice;
        prevMax = top;
      }
    }
    if (Number.isFinite(taxCOP) && taxCOP >= 0) impuesto = Math.round(taxCOP);
  }

  // Persistir el cálculo en la base de datos (tabla auxiliar tax_results)
  try {
    // Crear tabla si no existe (MVP seguro)
    await pool.query(`
      CREATE TABLE IF NOT EXISTS tax_results (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL,
        base NUMERIC NOT NULL DEFAULT 0,
        impuesto NUMERIC NOT NULL DEFAULT 0,
        notas TEXT,
        calculated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `);
    // Asegurar índice único por usuario para poder upsert
    await pool.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_indexes WHERE schemaname = 'public' AND indexname = 'tax_results_user_id_key'
        ) THEN
          CREATE UNIQUE INDEX tax_results_user_id_key ON tax_results(user_id);
        END IF;
      END$$;
    `);

    const notas = 'Cálculo estimado con reglas simplificadas.';
    await pool.query(
      `INSERT INTO tax_results (user_id, base, impuesto, notas, calculated_at)
       VALUES ($1, $2, $3, $4, NOW())
       ON CONFLICT (user_id)
       DO UPDATE SET base = EXCLUDED.base,
                     impuesto = EXCLUDED.impuesto,
                     notas = EXCLUDED.notas,
                     calculated_at = NOW()`,
      [userId, base, impuesto, notas]
    );
  } catch (persistErr) {
    // No bloquear la respuesta si falla el guardado; solo loguear
    console.error('No se pudo persistir tax_results:', persistErr);
  }

  res.json({ ingresos, deducciones, base, impuesto, uvt: CO_UVT, notas: 'Cálculo estimado con reglas simplificadas.' });
});

module.exports = router;
