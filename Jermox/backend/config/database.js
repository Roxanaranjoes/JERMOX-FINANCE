const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// Configuración de Supabase
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;

// Validar que las variables de entorno estén configuradas
if (!supabaseUrl || !supabaseKey) {
  console.error('Error: Las variables SUPABASE_URL y SUPABASE_ANON_KEY deben estar configuradas en el archivo .env');
  process.exit(1);
}

// Crear cliente de Supabase
const supabase = createClient(supabaseUrl, supabaseKey);

// Función para probar la conexión
async function testConnection() {
  try {
    // Probar conexión básica con una consulta simple
    const { data, error } = await supabase
      .from('usuario')
      .select('count')
      .limit(1);
    
    if (error) {
      console.log('Conexión establecida pero las tablas no existen aún:', error.message);
      console.log('Necesitas crear las tablas según el modelo en modelo.md');
    } else {
      console.log('Conexión a Supabase exitosa');
    }
  } catch (err) {
    console.error('Error al conectar con Supabase:', err.message);
  }
}

// Función para crear las tablas según el modelo
async function createTables() {
  console.log('Para crear las tablas, ejecuta el siguiente SQL en el editor SQL de Supabase:');
  console.log(`
-- Tabla de usuarios
CREATE TABLE usuario (
  usuario_ID SERIAL PRIMARY KEY,
  nombre VARCHAR(100) NOT NULL,
  apellidos VARCHAR(100) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  edad INTEGER,
  ocupacion VARCHAR(100),
  telefono VARCHAR(20),
  contraseña VARCHAR(255) NOT NULL,
  transaccion_ID INTEGER,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Tabla de ingresos
CREATE TABLE ingresos (
  ingresos_ID SERIAL PRIMARY KEY,
  tipo_ingreso VARCHAR(50) NOT NULL,
  valor_ingreso DECIMAL(15,2) NOT NULL,
  categoria VARCHAR(100),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Tabla de egresos
CREATE TABLE egresos (
  egresos_ID SERIAL PRIMARY KEY,
  tipo_egreso VARCHAR(50) NOT NULL,
  valor_egreso DECIMAL(15,2) NOT NULL,
  categoria VARCHAR(100),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Tabla de transacciones
CREATE TABLE transacciones (
  transaccion_ID SERIAL PRIMARY KEY,
  tipo VARCHAR(20) CHECK (tipo IN ('ingreso', 'egreso')) NOT NULL,
  referencia_ID INTEGER NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Tabla de perfil financiero
CREATE TABLE perfil_financiero (
  perfil_ID SERIAL PRIMARY KEY,
  usuario_ID INTEGER REFERENCES usuario(usuario_ID),
  ingresos_mensuales DECIMAL(15,2),
  egresos_mensuales DECIMAL(15,2),
  porcentaje_ahorro DECIMAL(5,2),
  objetivo TEXT,
  horizonte INTEGER,
  tolerancia_riesgo VARCHAR(50),
  mayor_gasto VARCHAR(100),
  deudas BOOLEAN DEFAULT false,
  monto_deuda DECIMAL(15,2),
  tipo_deuda VARCHAR(100),
  preferencia_tips TEXT
);

-- Tabla tributaria
CREATE TABLE tributaria (
  tributaria_ID SERIAL PRIMARY KEY,
  patrimonio_bruto DECIMAL(15,2),
  acumulado_ingreso DECIMAL(15,2),
  acumulado_egreso DECIMAL(15,2),
  cantidad_transacciones INTEGER,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
  `);
}

module.exports = {
  supabase,
  testConnection,
  createTables
};
