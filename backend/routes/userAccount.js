// routes/userAccount.js
const express = require('express');
const router = express.Router();
const pool = require('../db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'clave_super_secreta';

/** ---- Guardia global de params ---- */
router.param('id', (req, res, next, id) => {
  if (!/^\d+$/.test(id)) {
    return res.status(400).json({ error: 'id debe ser numérico' });
  }
  next();
});

/** ---- Evitar choques con /login y /register por GET ---- */
router.get('/login', (_req, res) => {
  res.status(405).json({ msg: 'Usa POST /api/users/login con email y password' });
});
router.get('/register', (_req, res) => {
  res.status(405).json({ msg: 'Usa POST /api/users/register con los campos requeridos' });
});

/** ---- Registro (POST) ---- */
router.post('/register', async (req, res) => {
  const { first_name, last_name, email, phone, password } = req.body;

  if (!first_name || !last_name || !email || !password) {
    return res.status(400).json({ msg: 'first_name, last_name, email y password son obligatorios' });
  }

  try {
    const exists = await pool.query('SELECT 1 FROM user_account WHERE email=$1 LIMIT 1', [email]);
    if (exists.rowCount > 0) return res.status(409).json({ msg: 'Email ya registrado' });

    const hashed = await bcrypt.hash(password, 10);
    const { rows } = await pool.query(
      `INSERT INTO user_account
       (first_name, last_name, email, phone, password, is_active, created_at, updated_at)
       VALUES ($1,$2,$3,$4,$5,true,NOW(),NOW())
       RETURNING user_id, first_name, last_name, email, phone`,
      [first_name, last_name, email, phone || null, hashed]
    );

    res.status(201).json({ msg: 'Usuario registrado', user: rows[0] });
  } catch (err) {
    console.error('register error:', err);
    res.status(500).json({ msg: 'Error en el servidor' });
  }
});

/** ---- Login (POST) ---- */
router.post('/login', async (req, res) => {
  const { email, password } = req.body || {};
  if (!email || !password) return res.status(400).json({ msg: 'Email y password requeridos' });

  try {
    const { rows } = await pool.query(
      'SELECT * FROM user_account WHERE email=$1 AND is_active=true',
      [email]
    );
    const user = rows[0];
    if (!user) return res.status(400).json({ msg: 'Usuario no encontrado' });

    const ok = await bcrypt.compare(password, user.password);
    if (!ok) return res.status(400).json({ msg: 'Contraseña incorrecta' });

    const token = jwt.sign({ id: user.user_id, email: user.email }, JWT_SECRET, { expiresIn: '8h' });

    res.json({
      msg: 'Login exitoso',
      token,
      user: {
        id: user.user_id,
        first_name: user.first_name,
        last_name: user.last_name,
        email: user.email,
        phone: user.phone
      }
    });
  } catch (err) {
    console.error('login error:', err);
    res.status(500).json({ msg: 'Error en el servidor' });
  }
});

/** ---- Listado ---- */
router.get('/', async (_req, res) => {
  try {
    const { rows } = await pool.query(
      'SELECT user_id, first_name, last_name, email, phone, is_active, created_at, updated_at FROM user_account ORDER BY user_id'
    );
    res.json(rows);
  } catch (err) {
    console.error('Error al obtener usuarios:', err);
    res.status(500).json({ error: err.message });
  }
});

/** ---- Detalle por id (sin regex en la ruta) ---- */
router.get('/:id', async (req, res) => {
  const { id } = req.params; // ya validado por router.param
  try {
    const { rows } = await pool.query(
      'SELECT user_id, first_name, last_name, email, phone, is_active, created_at, updated_at FROM user_account WHERE user_id = $1',
      [Number(id)]
    );
    if (!rows[0]) return res.status(404).json({ error: 'Usuario no encontrado' });
    res.json(rows[0]);
  } catch (err) {
    console.error('Error al obtener usuario:', err);
    res.status(500).json({ error: err.message });
  }
});

/** ---- Crear (admin) ---- */
router.post('/', async (req, res) => {
  const { first_name, last_name, email, age, occupation, phone, password, is_active } = req.body;

  if (!first_name || !last_name || !email || !password) {
    return res.status(400).json({ error: 'first_name, last_name, email y password son obligatorios' });
  }

  try {
    const hashed = await bcrypt.hash(password, 10);
    const { rows } = await pool.query(
      `INSERT INTO user_account 
        (first_name, last_name, email, age, occupation, phone, password, is_active, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, COALESCE($8,true), NOW(), NOW())
       RETURNING user_id, first_name, last_name, email, phone, is_active, created_at, updated_at`,
      [first_name, last_name, email, age || null, occupation || null, phone || null, hashed, is_active]
    );
    res.status(201).json(rows[0]);
  } catch (err) {
    console.error('Error al crear usuario:', err);
    res.status(500).json({ error: err.message });
  }
});

/** ---- Update ---- */
router.put('/:id', async (req, res) => {
  const { id } = req.params; // validado por router.param
  const { first_name, last_name, email, age, occupation, phone, password, is_active } = req.body;

  try {
    const hashed = password ? await bcrypt.hash(password, 10) : null;
    const { rows } = await pool.query(
      `UPDATE user_account
       SET first_name = COALESCE($1, first_name),
           last_name  = COALESCE($2, last_name),
           email      = COALESCE($3, email),
           age        = COALESCE($4, age),
           occupation = COALESCE($5, occupation),
           phone      = COALESCE($6, phone),
           password   = COALESCE($7, password),
           is_active  = COALESCE($8, is_active),
           updated_at = NOW()
       WHERE user_id = $9
       RETURNING user_id, first_name, last_name, email, phone, is_active, created_at, updated_at`,
      [first_name, last_name, email, age, occupation, phone, hashed, is_active, Number(id)]
    );

    if (!rows[0]) return res.status(404).json({ error: 'Usuario no encontrado' });
    res.json(rows[0]);
  } catch (err) {
    console.error('Error al actualizar usuario:', err);
    res.status(500).json({ error: err.message });
  }
});

/** ---- Delete ---- */
router.delete('/:id', async (req, res) => {
  const { id } = req.params; // validado por router.param
  try {
    const { rowCount } = await pool.query('DELETE FROM user_account WHERE user_id = $1', [Number(id)]);
    if (rowCount === 0) return res.status(404).json({ error: 'Usuario no encontrado' });
    res.json({ message: 'Usuario eliminado correctamente' });
  } catch (err) {
    console.error('Error al eliminar usuario:', err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
