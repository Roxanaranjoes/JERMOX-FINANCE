# Jermox Backend - Conexión a Supabase

Este proyecto establece una conexión básica con Supabase para una aplicación financiera.

## Configuración de Supabase

### 1. Crear proyecto en Supabase

1. Ve a [supabase.com](https://supabase.com)
2. Crea una cuenta o inicia sesión
3. Haz clic en "New Project"
4. Completa la información del proyecto:
   - Nombre: `jermox-finanzas`
   - Contraseña de base de datos: (guárdala en un lugar seguro)
   - Región: Elige la más cercana a tu ubicación

### 2. Obtener credenciales

Una vez creado el proyecto:

1. Ve a **Settings** > **API**
2. Copia los siguientes valores:
   - **Project URL**: `https://tu-proyecto.supabase.co`
   - **anon public key**: La clave pública anónima

### 3. Configurar variables de entorno

1. Copia el archivo `env.example` a `.env`:
   ```bash
   cp env.example .env
   ```

2. Edita el archivo `.env` con tus credenciales:
   ```
   SUPABASE_URL=https://tu-proyecto.supabase.co
   SUPABASE_ANON_KEY=tu_clave_anonima_aqui
   PORT=3000
   NODE_ENV=development
   ```

## Instalación y ejecución

### 1. Instalar dependencias
```bash
npm install
```

### 2. Ejecutar el servidor
```bash
# Modo desarrollo (con nodemon)
npm run dev

# Modo producción
npm start
```

### 3. Probar la conexión

Visita estas URLs en tu navegador:

- **Servidor funcionando**: http://localhost:3000
- **Prueba de conexión**: http://localhost:3000/test-connection
- **Info de Supabase**: http://localhost:3000/supabase-info

## Estructura del proyecto

```
backend/
├── config/
│   └── database.js      # Configuración de Supabase
├── server.js            # Servidor principal
├── package.json         # Dependencias
├── env.example          # Variables de entorno de ejemplo
└── README.md           # Este archivo
```

## Próximos pasos

1. Crear las tablas en Supabase según el modelo de datos
2. Implementar rutas para CRUD de usuarios
3. Agregar autenticación
4. Implementar lógica de transacciones financieras

## Comandos útiles

```bash
# Instalar dependencias
npm install

# Ejecutar en modo desarrollo
npm run dev

# Ver logs detallados
DEBUG=* npm run dev
```
