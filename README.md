# JERMOX FINANCE

**Tu dinero, claro y bajo control.**

Jermox es una aplicación full-stack de gestión financiera personal diseñada para ayudarte a entender tus hábitos de gasto, optimizar tu presupuesto y planificar tus obligaciones tributarias en Colombia. Combina un dashboard intuitivo con la potencia de la IA para ofrecerte recomendaciones personalizadas y accionables.

## ✨ Características Principales

-   **Dashboard Inteligente:** Visualiza tus ingresos, gastos y balance mensual de un vistazo.
-   **Control de Presupuesto:** Compara tus gastos con tu presupuesto en tiempo real con una gráfica interactiva.
-   **Distribución de Gastos:** Identifica en qué categorías se va tu dinero con una gráfica de dona.
-   **Registro de Movimientos:** Añade ingresos y gastos de forma sencilla y categorizada.
-   **Perfil Financiero:** Configura tus metas y perfil de riesgo para obtener consejos a tu medida.
-   **Asistente con IA:** Recibe tips personalizados para mejorar tus hábitos de ahorro e inversión.
-   **Resumen Tributario (Colombia):** Estima tu base gravable e impuesto de renta para evitar sorpresas.
-   **Reportes Mensuales:** Descarga reportes en PDF con el resumen de tu actividad financiera.
-   **Autenticación Segura:** Registro y login de usuarios con JWT.

## 🚀 Tech Stack

-   **Backend:**
    -   Node.js con Express
    -   PostgreSQL (integrado con Supabase)
    -   Prisma como ORM
    -   JWT para autenticación
    -   OpenAI API para los consejos de IA
-   **Frontend:**
    -   Vite como empaquetador y servidor de desarrollo
    -   HTML, CSS y JavaScript puro (Vanilla JS)
    -   Chart.js para las gráficas

## 📂 Estructura del Proyecto

Este es un monorepo que contiene dos proyectos principales:

-   `jermox-backend-supabase-psql/`: La API REST que maneja toda la lógica de negocio y la comunicación con la base de datos.
-   `jermox-frontend-vite (1)/`: La aplicación de cliente estática construida con Vite.

## 📋 Requisitos Previos

Antes de empezar, asegúrate de tener instalado lo siguiente:

-   Node.js (v18 o superior)
-   npm (generalmente viene con Node.js)
-   Una base de datos PostgreSQL. Se recomienda usar un proyecto de Supabase para una configuración rápida.
-   Una clave de API de OpenAI (opcional, para la funcionalidad de consejos con IA).

## ⚙️ Configuración

Sigue estos pasos para configurar el entorno de desarrollo.

### 1. Backend

1.  Navega a la carpeta del backend:
    ```bash
    cd jermox-backend-supabase-psql
    ```
2.  Crea un archivo `.env` en la raíz de esta carpeta. Puedes copiar el contenido de `.env.example` (si existe) o usar la siguiente plantilla:

    ```env
    # Puerto para el servidor de la API
    PORT=3000

    # URL de conexión a la base de datos de Supabase
    # Ve a "Project Settings" > "Database" > "Connection string" en tu dashboard de Supabase
    SUPABASE_DB_URL="postgres://postgres:[YOUR-PASSWORD]@[YOUR-HOST]:5432/postgres"

    # Clave secreta para firmar los tokens JWT (puedes usar un generador de strings aleatorios)
    JWT_SECRET="tu_clave_secreta_muy_segura"

    # Clave de API de OpenAI (opcional)
    OPENAI_API_KEY="sk-..."
    ```

### 2. Frontend

1.  Navega a la carpeta del frontend:
    ```bash
    cd "jermox-frontend-vite (1)"
    ```
2.  Crea un archivo `.env` en la raíz de esta carpeta para apuntar a tu API de backend.
    ```env
    # URL de tu API de backend
    VITE_API_URL=http://localhost:3000
    ```

## 📦 Instalación

Ejecuta los siguientes comandos desde la raíz del monorepo para instalar las dependencias de ambos proyectos.

```bash
# Instalar dependencias del backend
cd jermox-backend-supabase-psql
npm install

# Instalar dependencias del frontend
cd "../jermox-frontend-vite (1)"
npm install
```

## ▶️ Ejecución

Debes tener ambos servidores (backend y frontend) corriendo simultáneamente.

1.  **Iniciar el Backend:**
    ```bash
    cd jermox-backend-supabase-psql
    npm start
    ```
    La API estará disponible en `http://localhost:3000`.

2.  **Iniciar el Frontend:**
    ```bash
    cd "jermox-frontend-vite (1)"
    npm run dev
    ```
    Vite abrirá la aplicación en un puerto, generalmente `http://localhost:5173`.

Ahora puedes abrir tu navegador y visitar la URL del frontend para usar la aplicación.

## Endpoints de la API (Resumen)

La URL base para todos los endpoints es `http://localhost:3000`.

| Endpoint                        | Método | Descripción                                           |
| ------------------------------- | ------ | ----------------------------------------------------- |
| `/api/users/register`           | `POST` | Registra un nuevo usuario.                            |
| `/api/users/login`              | `POST` | Inicia sesión y devuelve un token JWT.                |
| `/api/financial-profile`        | `POST` | Crea o actualiza el perfil financiero del usuario.    |
| `/api/financial-profile/user/:id` | `GET`  | Obtiene el perfil financiero de un usuario.           |
| `/api/income`                   | `POST` | Agrega un nuevo registro de ingreso.                  |
| `/api/income/user/:id`          | `GET`  | Obtiene los ingresos de un usuario (filtra por mes/año). |
| `/api/expense`                  | `POST` | Agrega un nuevo registro de gasto.                    |
| `/api/expense/user/:id`         | `GET`  | Obtiene los gastos de un usuario (filtra por mes/año).  |
| `/api/tax-info`                 | `POST` | Crea o actualiza la información fiscal anual.         |
| `/api/tax/summary/:id`          | `GET`  | Calcula y devuelve el resumen tributario estimado.    |
| `/api/ai/tips/:id`              | `GET`  | Genera consejos financieros personalizados con IA.    |
| `/api/report/monthly/...`       | `GET`  | Descarga un reporte mensual en PDF.                   |

## 🛠️ Scripts de Utilidad (Backend)

Dentro de la carpeta `jermox-backend-supabase-psql`, puedes usar los siguientes scripts:

-   **Listar usuarios:**
    ```bash
    npm run list-users
    ```
-   **Limpiar la base de datos (¡CUIDADO!):** Este script eliminará todos los datos de las tablas. Úsalo solo en desarrollo.
    ```bash
    npm run cleanup
    ```

## 🔍 Troubleshooting

-   **Error 409 al registrar:** El correo electrónico ya existe. Intenta iniciar sesión.
-   **Problemas de conexión a la BD:** Verifica que tu variable `SUPABASE_DB_URL` en el `.env` del backend sea correcta y que tu instancia de Supabase esté activa.
-   **Errores de CORS:** Asegúrate de que `VITE_API_URL` en el `.env` del frontend apunte al puerto correcto del backend (por defecto `http://localhost:3000`).
-   **La IA no funciona:** Revisa que tu `OPENAI_API_KEY` sea válida y que tengas crédito en tu cuenta de OpenAI.

---

Hecho con 💚 por Jermox.
