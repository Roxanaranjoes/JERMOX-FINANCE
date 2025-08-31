# JERMOX FINANCE • Sustentación Técnica

Este documento describe la arquitectura, módulos, contratos de API, flujos y decisiones del proyecto. Complementa la versión funcional y sirve como base para una sustentación técnica.

## 1. Arquitectura

- Frontend: Vite + JavaScript modular (ESM). UI declarativa con componentes semánticos y utilidades propias.
- Backend: Node.js + Express + PostgreSQL. Rutas REST, validaciones ligeras, cálculos tributarios y gateway a IA.
- Patrón: Cliente delgado con orquestación en `dashboard.js`; servidor como BFF (Backend for Frontend) para cálculos y persistencia.

```
[Usuario] → Frontend (Vite/JS) → API REST (Express) → PostgreSQL
                               ↘  IA (/api/ai)     ↗
```

## 2. Módulos Frontend (src/)

- `api.js`: cliente HTTP con manejo de errores y auth.
- `dashboard.js`: controlador del panel: KPIs, gráficas, formularios, listados, noticias, modales y preloader.
- `chat.js`: chatbot con historial y markdown simple.
- `utils.js`: formato COP, agrupaciones y sumatorias.
- `ui.js`: notificaciones y confirmaciones.
- `styles.css`: sistema visual (cards, botones, modales, charts, noticias, chatbot).

## 3. Contratos de API (Backend)

- Auth: POST `/api/users/register`, POST `/api/users/login`
- Ingresos/Egresos: GET `/api/income|expense/user/:userId?year&month`, POST/PUT/DELETE `/api/income|expense/:id`
- Perfil financiero: GET `/api/financial-profile/user/:userId`, POST/PUT `/api/financial-profile`
- Tributos: GET `/api/tax/summary/:userId`, CRUD `/api/tax-info`
- Reportes: GET `/api/report/monthly/:userId/:year/:month` (PDF)
- IA: GET `/api/ai/tips/:userId`, POST `/api/ai/ask` (acepta `{ userId, messages }`)

## 4. Flujos Clave

- Carga de Dashboard → `loadAll()` (KPIs, charts, tips, noticias) + `loadFinProfile()`
- Edición de movimientos → modal PUT/DELETE + recarga
- Gauge → presupuesto fijo/ahorro, pro‑rata, estados
- Chatbot → historial local + memoria en backend

## 5. Decisiones / NFR

- Textos y modales “para principiantes”
- Noticias: personalización + fallback de imágenes (Unsplash → Picsum → Placeholder)
- Accesibilidad: ARIA, Escape para modales; preloader para UX
- Errores unificados en `api.js`; notificaciones en `ui.js`

## 6. Variables y Troubleshooting

- Front `.env` → `VITE_API_URL`
- Back `.env` → `OPENAI_API_KEY`, `PORT`, conexión DB
- Health: `/health/live` y `/health/db`
- 401/403: renovar sesión; vacíos: revisar filtro mes o crear dato de prueba

