const express = require('express');
const cors = require('cors');
require('dotenv').config();

// Importar configuración de base de datos
const { supabase, testConnection } = require('./config/database');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Ruta de prueba de conexión
app.get('/test-connection', async (req, res) => {
  try {
    await testConnection();
    res.json({ 
      message: 'Conexión a Supabase establecida correctamente',
      status: 'success'
    });
  } catch (error) {
    res.status(500).json({ 
      message: 'Error al conectar con Supabase',
      error: error.message,
      status: 'error'
    });
  }
});

// Ruta básica
app.get('/', (req, res) => {
  res.json({ 
    message: 'Servidor Jermox funcionando correctamente',
    version: '1.0.0',
    database: 'Supabase'
  });
});

// Ruta para obtener información del proyecto Supabase
app.get('/supabase-info', (req, res) => {
  const supabaseUrl = process.env.SUPABASE_URL;
  res.json({
    message: 'Información de Supabase',
    url: supabaseUrl ? 'Configurada' : 'No configurada',
    status: supabaseUrl ? 'ready' : 'not_configured'
  });
});

// Iniciar servidor
app.listen(PORT, () => {
  console.log(`Servidor ejecutándose en http://localhost:${PORT}`);
  console.log('Para probar la conexión visita: http://localhost:3000/test-connection');
});

// Manejo de errores no capturados
process.on('unhandledRejection', (err) => {
  console.error('Error no manejado:', err);
  process.exit(1);
});
