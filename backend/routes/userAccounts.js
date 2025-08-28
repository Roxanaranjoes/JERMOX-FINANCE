const express = require('express');
const router = express.Router();
const pool = require('../db');
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

// validacion y incriptacion de datos

const SECRET_KEY = process.env.SECRET_KEY || "clave_super_secreta"; 

// Registro
router.post("/register", async (req, res) => {
  const { nombre, email, telefono, password } = req.body;

  try {
    // 1. Verificar si ya existe
    const { data: existingUser } = await supabase
      .from("user_account")
      .select("id")
      .eq("email", email)
      .single();

    if (existingUser) {
      return res.status(400).json({ msg: "El usuario ya existe" });
    }

    // 2. Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // 3. Insertar
    const { error: insertError } = await supabase
      .from("user_account")
      .insert([{ nombre, email, telefono, password: hashedPassword }]);

    if (insertError) throw insertError;

    res.json({ msg: "Usuario registrado correctamente" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: "Error en el servidor", error: err.message });
  }
});

// Login
router.post("/login", async (req, res) => {
  const { email, password } = req.body;

  try {
    // 1. Buscar usuario
    const { data: user, error } = await supabase
      .from("user_account")
      .select("*")
      .eq("email", email)
      .single();

    if (!user) return res.status(400).json({ msg: "Usuario no encontrado" });

    // 2. Validar password
    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) return res.status(400).json({ msg: "Contraseña incorrecta" });

    // 3. Crear token
    const token = jwt.sign(
      { id: user.id, email: user.email },
      SECRET_KEY,
      { expiresIn: "1h" }
    );

    res.json({
      msg: "Login exitoso",
      token,
      user: {
        id: user.id,
        nombre: user.nombre,
        email: user.email,
        telefono: user.telefono
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: "Error en el servidor", error: err.message });
  }
});

// Listar usuarios (ocultando password)
router.get("/", async (req, res) => {
  try {
    const { data: users, error } = await supabase
      .from("user_account")
      .select("id, nombre, email, telefono");

    if (error) throw error;

    res.json(users);
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: "Error en el servidor", error: err.message });
  }
});

// GET: todos los usuarios
router.get('/', async (req, res) => {
  try {
    const { rows } = await pool.query(
      'SELECT * FROM user_account ORDER BY user_id'
    );
    res.json(rows);
  } catch (err) {
    console.error('Error al obtener usuarios:', err);
    res.status(500).json({ error: err.message });
  }
});

// GET: un usuario por ID
router.get('/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const { rows } = await pool.query(
      'SELECT * FROM user_account WHERE user_id = $1',
      [id]
    );
    if (rows.length === 0) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }
    res.json(rows[0]);
  } catch (err) {
    console.error('Error al obtener usuario:', err);
    res.status(500).json({ error: err.message });
  }
});

// POST: crear usuario
router.post('/', async (req, res) => {
  const { first_name, last_name, occupation, phone, password } = req.body;

  if (!first_name || !last_name || !password) {
    return res.status(400).json({ error: 'first_name, last_name y password son obligatorios' });
  }

  try {
    const { rows } = await pool.query(
      `INSERT INTO user_account (first_name, last_name, occupation, phone, password, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, NOW(), NOW())
       RETURNING *`,
      [first_name, last_name, occupation || null, phone || null, password]
    );
    res.status(201).json(rows[0]);
  } catch (err) {
    console.error('Error al crear usuario:', err);
    res.status(500).json({ error: err.message });
  }
});

// PUT: actualizar usuario
router.put('/:id', async (req, res) => {
  const { id } = req.params;
  const { first_name, last_name, occupation, phone, password } = req.body;

  try {
    const { rows } = await pool.query(
      `UPDATE user_account
       SET first_name = $1,
           last_name = $2,
           occupation = $3,
           phone = $4,
           password = $5,
           updated_at = NOW()
       WHERE user_id = $6
       RETURNING *`,
      [first_name, last_name, occupation || null, phone || null, password, id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    res.json(rows[0]);
  } catch (err) {
    console.error('Error al actualizar usuario:', err);
    res.status(500).json({ error: err.message });
  }
});

// DELETE: eliminar usuario
router.delete('/:id', async (req, res) => {
  const { id } = req.params;

  try {
    const { rowCount } = await pool.query(
      'DELETE FROM user_account WHERE user_id = $1',
      [id]
    );

    if (rowCount === 0) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    res.json({ message: 'Usuario eliminado correctamente' });
  } catch (err) {
    console.error('Error al eliminar usuario:', err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
