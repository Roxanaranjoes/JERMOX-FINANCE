// backend/openai.js
require('dotenv').config();
const OpenAI = require('openai');
const pool = require('./db');

let client;
function getClient() {
  if (!client) client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  return client;
}

async function getFinancialProfile(userId) {
  const { rows } = await pool.query(
    'SELECT * FROM financial_profile WHERE user_id = $1',
    [userId]
  );
  return rows[0] || null;
}

async function generarTipsFinancieros(userId) {
  const perfil = await getFinancialProfile(userId);

  if (!perfil) {
    return ['No se encontró perfil financiero para este usuario.'];
  }

  const prompt = `
Eres asesor financiero en Colombia. Da 3 tips claros y accionables para este perfil:
Ingresos: ${perfil.monthly_income}
Egresos: ${perfil.monthly_expense}
Ahorro %: ${perfil.savings_percentage}
Objetivo: ${perfil.goal}
Horizonte: ${perfil.time_horizon}
Riesgo: ${perfil.risk_tolerance}
Gasto principal: ${perfil.biggest_expense}
¿Deudas?: ${perfil.has_debt ? 'Sí' : 'No'}
Monto deuda: ${perfil.debt_amount || 0}
Tipo deuda: ${perfil.debt_type || 'N/A'}
Preferencia tips: ${perfil.tips_preference || 'N/A'}
Responde en puntos breves y accionables.
`.trim();

  const ai = getClient();
  const response = await ai.chat.completions.create({
    model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
    messages: [{ role: 'user', content: prompt }],
    temperature: 0.7,
    max_tokens: 220
  });

  const raw = response.choices[0].message.content || '';
  const lines = raw.split('\n').map(s=>s.trim()).filter(Boolean);
  const isBullet = (s)=>/^[-•*]\s+/.test(s) || /^\d+[\.)]\s+/.test(s);
  const clean = (s)=> s.replace(/^\s*(?:[-•*]|\d+[\.)])\s+/, '').trim();

  // 1) Preferir líneas con viñetas/numeración
  const bulletTips = lines.filter(isBullet).map(clean).filter(Boolean);
  if (bulletTips.length >= 2) return bulletTips.slice(0,6);

  // 2) Si no hay viñetas claras, intentar extraer por frases con numeración inline
  const numbered = raw.split(/\n?\s*(?:\d+[\.)])\s+/).map(s=>s.trim()).filter(Boolean);
  if (numbered.length >= 2) {
    return numbered
      .filter(t=>!/^claro|^aqui\s+tienes|^estos\s+tips/i.test(t))
      .slice(0,6);
  }

  // 3) Fallback: dividir por líneas y filtrar prosa introductoria
  const plain = lines
    .map(s=>s.replace(/^\s*[-•*]+\s*/, '').trim())
    .filter(s=>!/^claro|^aqui\s+tienes|^estos\s+(consejos|tips)/i.test(s))
    .filter(Boolean);
  return plain.slice(0,6);
}

module.exports = { generarTipsFinancieros };
