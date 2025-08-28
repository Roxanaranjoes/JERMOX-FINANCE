# JERMOX FINANCE - Guía de Instalación Simplificada
# 1. Crear cuenta en supabase.com
# 2. Crear nuevo proyecto "jermox-finanzas"
# 3. Copiar credenciales (URL y API Key)

2. Configurar el proyecto local
cd Jermox/backend
cp env.example .env
# Editar .env con tus credenciales de Supabase
npm install
## Requisitos Previos

intalar dependencias de jsonwebtoken y bcrypt

npm install bcrypt

npm install jsonwebtoken
# luego instalar el node

node server.js



3. Crear las tablas
Ve al SQL Editor de Supabase
Ejecuta el SQL que está en config/database.js (función createTables())

4. Probar la conexión
npm run dev
# Visitar: http://localhost:3000/test-connection

- **Node.js** versión 16.0.0 o superior
- **Cuenta en Supabase** (gratuita)
- **Git** para clonar el repositorio

## Instalación del Proyecto

### 1. Clonar el Repositorio

```bash
git clone <url-del-repositorio>
cd Jermox
```

### 2. Configurar Supabase

#### 2.1 Crear Proyecto en Supabase

1. Ve a [supabase.com](https://supabase.com)
2. Crea una cuenta o inicia sesión
3. Haz clic en "New Project"
4. Completa la información:
   - **Nombre**: `jermox-finanzas`
   - **Contraseña de base de datos**: (guárdala en un lugar seguro)
   - **Región**: Elige la más cercana a tu ubicación

#### 2.2 Obtener Credenciales

1. Ve a **Settings** > **API** en tu proyecto
2. Copia los siguientes valores:
   - **Project URL**: `https://tu-proyecto.supabase.co`
   - **anon public key**: La clave pública anónima

#### 2.3 Crear las Tablas

1. Ve a **SQL Editor** en tu dashboard de Supabase
2. Ejecuta el siguiente SQL para crear las tablas según el modelo:

```sql
-- Users table
CREATE TABLE user_account (
  user_id SERIAL PRIMARY KEY,
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  age INTEGER CHECK (age >= 0),
  occupation VARCHAR(100),
  phone VARCHAR(20),
  password VARCHAR(255) NOT NULL,  -- store hashed passwords only
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Income table
CREATE TABLE income (
  income_id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES user_account(user_id) ON DELETE CASCADE,
  type VARCHAR(50) NOT NULL,
  amount DECIMAL(15,2) NOT NULL CHECK (amount >= 0),
  category VARCHAR(100),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Expense table
CREATE TABLE expense (
  expense_id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES user_account(user_id) ON DELETE CASCADE,
  type VARCHAR(50) NOT NULL,
  amount DECIMAL(15,2) NOT NULL CHECK (amount >= 0),
  category VARCHAR(100),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Transactions table
CREATE TABLE transaction (
  transaction_id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES user_account(user_id) ON DELETE CASCADE,
  type VARCHAR(20) NOT NULL CHECK (type IN ('income', 'expense')),
  reference_id INTEGER NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Financial profile table
CREATE TABLE financial_profile (
  profile_id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL UNIQUE REFERENCES user_account(user_id) ON DELETE CASCADE,
  monthly_income DECIMAL(15,2) CHECK (monthly_income >= 0),
  monthly_expense DECIMAL(15,2) CHECK (monthly_expense >= 0),
  savings_percentage DECIMAL(5,2) CHECK (savings_percentage >= 0 AND savings_percentage <= 100),
  goal TEXT,
  time_horizon INTEGER CHECK (time_horizon >= 0),
  risk_tolerance VARCHAR(50),
  biggest_expense VARCHAR(100),
  has_debt BOOLEAN DEFAULT false,
  debt_amount DECIMAL(15,2) CHECK (debt_amount >= 0),
  debt_type VARCHAR(100),
  tips_preference TEXT
);

-- Tax table
CREATE TABLE tax_info (
  tax_id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES user_account(user_id) ON DELETE CASCADE,
  gross_assets DECIMAL(15,2) CHECK (gross_assets >= 0),
  total_income DECIMAL(15,2) CHECK (total_income >= 0),
  total_expense DECIMAL(15,2) CHECK (total_expense >= 0),
  transaction_count INTEGER CHECK (transaction_count >= 0),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);


### 3. Configurar el Backend

#### 3.1 Instalar Dependencias

```bash
cd backend
npm install
```

#### 3.2 Configurar Variables de Entorno

```bash
# Copiar el archivo de ejemplo
cp env.example .env

# Editar el archivo .env con tus credenciales de Supabase
nano .env
```

**Contenido del archivo .env:**

```env
# Configuración de Supabase
SUPABASE_URL=https://tu-proyecto.supabase.co
SUPABASE_ANON_KEY=tu_clave_anonima_aqui

# Puerto del servidor
PORT=3000

# Configuración del servidor
NODE_ENV=development
```

### 4. Ejecutar el Proyecto

#### 4.1 Iniciar el Backend

```bash
cd backend
npm run dev
```

El servidor debería iniciar en `http://localhost:3000`

#### 4.2 Verificar la Conexión

Visita estas URLs en tu navegador:

- **Servidor funcionando**: http://localhost:3000
- **Prueba de conexión**: http://localhost:3000/test-connection
- **Info de Supabase**: http://localhost:3000/supabase-info

## Estructura del Proyecto

```
Jermox/
├── backend/
│   ├── config/
│   │   └── database.js      # Configuración de Supabase
│   ├── server.js            # Servidor principal
│   ├── package.json         # Dependencias
│   ├── env.example          # Variables de entorno de ejemplo
│   └── README.md           # Documentación del backend
├── modelo.md               # Modelo de datos
└── INSTALLATION.md         # Este archivo
```

## Modelo de Base de Datos

### Tablas Principales

1. **usuario** - Información de usuarios
2. **ingresos** - Registro de ingresos
3. **egresos** - Registro de egresos
4. **transacciones** - Transacciones financieras
5. **perfil_financiero** - Perfil financiero del usuario
6. **tributaria** - Información tributaria

### Relaciones

- `usuario` → `perfil_financiero` (1:1)
- `transacciones` → `ingresos` o `egresos` (1:1 según tipo)

## Funcionalidades Disponibles

### Conexión a Base de Datos

- ✅ Conexión a Supabase configurada
- ✅ Validación de variables de entorno
- ✅ Función de prueba de conexión
- ✅ Cliente Supabase exportado para uso

### Endpoints Básicos

- `GET /` - Información del servidor
- `GET /test-connection` - Probar conexión a Supabase
- `GET /supabase-info` - Información de configuración

## Próximos Pasos

1. **Crear tablas** en Supabase usando el SQL proporcionado
2. **Configurar variables** de entorno con tus credenciales
3. **Probar conexión** visitando los endpoints
4. **Desarrollar frontend** que consuma la API

## Solución de Problemas

### Error de Conexión a Supabase

1. Verificar que las variables `SUPABASE_URL` y `SUPABASE_ANON_KEY` estén configuradas
2. Verificar que el proyecto de Supabase esté activo
3. Verificar que las credenciales sean correctas

### Error de Puerto en Uso

```bash
# Cambiar el puerto en el archivo .env
PORT=3001
```

### Error de Dependencias

```bash
# Limpiar cache de npm
npm cache clean --force

# Eliminar node_modules y reinstalar
rm -rf node_modules package-lock.json
npm install
```

## Comandos Útiles

```bash
# Instalar dependencias
npm install

# Ejecutar en modo desarrollo
npm run dev

# Ejecutar en modo producción
npm start

# Ver logs detallados
DEBUG=* npm run dev
```

## Ventajas de Supabase

- **Sin configuración de servidor**: Base de datos en la nube
- **API automática**: Endpoints REST generados automáticamente
- **Dashboard web**: Interfaz para administrar datos
- **Tiempo real**: Actualizaciones instantáneas
- **Escalable**: Maneja el crecimiento automáticamente
- **Gratuito**: Plan gratuito generoso para desarrollo

## Soporte

Para soporte técnico, contactar al equipo de desarrollo:
- **Diego** - QA/Integración
- **José Fernando** - Backend Dev
- **Miguel Angel** - Backend Dev
- **Jackson** - Frontend Dev
- **Roxana** - Frontend Dev