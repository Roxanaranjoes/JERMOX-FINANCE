const express = require('express');
const router = express.Router();
const OpenAI = require('openai');
const pool = require('../db');
const { generarTipsFinancieros } = require('../openai');
const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

router.get('/tips/:userId', async (req, res) => {
  try {
    const tips = await generarTipsFinancieros(req.params.userId);
    res.json({ tips });
  } catch (e) {
    console.error('AI tips error:', e);
    res.status(500).json({ error: 'No se pudieron generar tips' });
  }
});

router.post('/ask', async (req, res) => {
  try{
    const { userId, question, messages } = req.body || {};
    if(!userId) return res.status(400).json({ error: 'userId es obligatorio' });

    // Traer algunos datos del usuario para contexto básico
    const { rows } = await pool.query('SELECT * FROM financial_profile WHERE user_id=$1 ORDER BY profile_id DESC LIMIT 1',[userId]);
    const pf = rows[0] || {};

    // Construir mensajes con memoria conversacional
    const conv = [];
    conv.push({
      role: 'system',
      content: `Eres un asesor financiero colombiano, pedagógico y preciso. Usa lenguaje simple, pasos claros y ejemplos en COP.
Contexto del usuario: ingresos=${pf.monthly_income ?? 'ND'}, egresos=${pf.monthly_expense ?? pf.monthly_expenses ?? 'ND'}, objetivo=${pf.goal ?? 'ND'}, riesgo=${pf.risk_tolerance ?? 'ND'}, preferencias=${pf.tips_preference ?? 'ND'}.`
    });
    const safeMap = (arr=[]) => arr
      .filter(m => m && (m.role==='user' || m.role==='assistant') && typeof m.content==='string')
      .slice(-16) // proteger tokens
      .map(m => ({ role: m.role, content: m.content.slice(0, 1200) }));

    const history = Array.isArray(messages) && messages.length ? safeMap(messages) : [];
    if (history.length) {
      conv.push(...history);
    } else if (question) {
      conv.push({ role:'user', content: question });
    } else {
      return res.status(400).json({ error: 'Falta question o messages' });
    }

    const r = await client.chat.completions.create({
      model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
      messages: conv,
      temperature: 0.4,
      max_tokens: 260
    });
    const answer = r.choices[0]?.message?.content || '—';
    res.json({ answer });
  }catch(e){
    console.error('AI /ask error', e);
    res.status(500).json({ error: 'No se pudo responder en este momento' });
  }
});

module.exports = router;
