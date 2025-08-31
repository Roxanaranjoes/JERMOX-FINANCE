# 🔧 Troubleshooting - Jermox Backend

## Error 409: Email ya registrado

### ¿Qué significa?
El error 409 (Conflict) indica que estás intentando registrar un usuario con un email que ya existe en la base de datos.

### Causas comunes:
1. **Usuario ya registrado**: El email ya fue usado anteriormente
2. **Datos de prueba**: Usuarios creados durante desarrollo/pruebas
3. **Registro duplicado**: Error en el proceso de registro

### Soluciones:

#### 1. **Ver usuarios existentes** (Recomendado primero)
```bash
cd jermox-backend-supabase-psql
npm run list-users
```

#### 2. **Limpiar base de datos** (¡CUIDADO! Elimina TODOS los datos)
```bash
cd jermox-backend-supabase-psql
npm run cleanup
```

#### 3. **Usar un email diferente**
- Cambia el email en el formulario de registro
- Usa un email que no hayas usado antes

#### 4. **Hacer login en lugar de registro**
- Si el usuario ya existe, ve a la página de login
- El frontend ahora te sugiere esto automáticamente

### Verificar conexión a la base de datos:
```bash
# Probar si el backend está funcionando
curl http://localhost:3000/health/db

# O desde el navegador:
# http://localhost:3000/health/db
```

### Verificar variables de entorno:
Asegúrate de que tu archivo `.env` tenga:
```env
# Para Supabase (recomendado)
SUPABASE_DB_URL=postgres://USER:PASSWORD@HOST:PORT/DBNAME

# O para PostgreSQL local
DB_HOST=localhost
DB_PORT=5432
DB_NAME=postgres
DB_USER=postgres
DB_PASSWORD=tu_password
```

### Scripts útiles disponibles:

#### `npm run list-users`
- Lista todos los usuarios sin modificar nada
- Muestra ID, email, nombre, estado y fecha de creación

#### `npm run cleanup`
- **⚠️ PELIGROSO**: Elimina TODOS los datos
- Útil solo para desarrollo/pruebas
- Pregunta confirmación antes de ejecutar

### Flujo recomendado para resolver el problema:

1. **Primero**: `npm run list-users` para ver qué hay
2. **Si hay usuarios de prueba**: `npm run cleanup` (¡cuidado!)
3. **Si no hay usuarios**: Verificar conexión a DB
4. **Probar registro** con email nuevo
5. **Si persiste**: Revisar logs del backend

### Logs del backend:
```bash
# En otra terminal, mientras corre el backend:
cd jermox-backend-supabase-psql
npm start

# Los errores aparecerán en la consola
```

### Contacto:
Si el problema persiste, revisa:
- Variables de entorno (.env)
- Conexión a la base de datos
- Logs del backend
- Estado de la base de datos
