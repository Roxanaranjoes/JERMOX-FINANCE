# JERMOX FINANCE

> Your money, clear and under control.

JERMOX is a full‑stack personal finance app to help you understand spending habits, plan your budget, and estimate taxes in Colombia. It combines a clean dashboard with AI‑powered tips for actionable insights.

## Highlights

- Smart dashboard: incomes, expenses, and monthly balance at a glance.
- Budget gauge: compare spend vs budget in real time.
- Spending distribution: category donut chart.
- Movements: add categorized incomes/expenses.
- Financial profile: goals, risk, savings percentage, and more.
- AI assistant: tailored tips based on your profile.
- Tax summary (Colombia): base and tax estimate with configurable UVT/brackets.
- Monthly reports: downloadable PDF.
- Secure auth: JWT‑based login/registration.

## Tech Stack

- Backend: Node.js (Express), PostgreSQL (Supabase), JWT, OpenAI SDK, PDFKit
- Frontend: Vite, Vanilla JS (HTML/CSS/JS), Chart.js
- Deploy: Render (Backend Web Service + Frontend Static Site)
- Optional: Docker + Nginx + docker-compose

## Monorepo Layout

- `backend/` — REST API, DB layer, AI, reports
- `frontend/` — Vite app (static site)

## Requirements

- Node.js 18+ (20 recommended)
- npm
- PostgreSQL database (Supabase recommended)
- OpenAI API key (optional, for AI tips)

## Local Setup

### Backend

1) Copy env template and edit values
```bash
cd backend
cp .env.example .env
```
Key vars:
- `PORT=3000`
- `SUPABASE_DB_URL=postgresql://...` (or `DB_HOST/DB_PORT/DB_NAME/DB_USER/DB_PASSWORD`)
- `JWT_SECRET=your_long_secret`
- `OPENAI_API_KEY=sk-...` (optional)
- `CO_UVT`, `TAX_BRACKETS_JSON` (tax config)

Install and run:
```bash
npm ci
npm start
```
API runs on http://localhost:3000

### Frontend

1) Create env
```bash
cd frontend
cp .env.example .env
# then set
VITE_API_URL=http://localhost:3000
```
Install and run:
```bash
npm ci
npm run dev
```
App opens on http://localhost:5173 (default Vite port)

## Deployment (Render)

- Backend (Web Service)
  - Root dir: `backend`
  - Build: `npm ci`
  - Start: `npm start`
  - Node: 20
  - Env: `JWT_SECRET`, `OPENAI_API_KEY`, `SUPABASE_DB_URL` (or `DB_*`), `CO_UVT`, `TAX_BRACKETS_JSON`
- Frontend (Static Site)
  - Root dir: `frontend`
  - Build: `npm ci && npm run build`
  - Publish: `dist`
  - Env: `VITE_API_URL=https://<your-backend>.onrender.com`
  - Rewrites: `/ → /index.html`, `/login → /login.html`, `/register → /register.html`, `/dashboard → /dashboard.html`, `/tax → /tax.html`
- Tip: after env or CSS/JS changes, use “Manual Deploy → Clear build cache & deploy” on the static site

## API Summary

Base URL: `http://localhost:3000`

Auth
- POST `/api/users/register`
- POST `/api/users/login` → `{ token, user }`

Financial profile
- POST `/api/financial-profile`
- GET `/api/financial-profile/user/:id`
- PUT `/api/financial-profile/:id`

Incomes/Expenses
- GET `/api/income/user/:id?year&month`
- POST `/api/income` • PUT `/api/income/:id` • DELETE `/api/income/:id`
- GET `/api/expense/user/:id?year&month`
- POST `/api/expense` • PUT `/api/expense/:id` • DELETE `/api/expense/:id`

Taxes
- GET `/api/tax-info/user/:userId` • POST `/api/tax-info` • PUT `/api/tax-info/:id` • DELETE `/api/tax-info/:id`
- GET `/api/tax/summary/:userId`

AI
- GET `/api/ai/tips/:userId`
- POST `/api/ai/ask`

Reports
- GET `/api/report/monthly/:userId/:year/:month` (PDF)

## Useful Scripts (backend)

```bash
npm run list-users   # list basic user info
npm run cleanup      # dev only: clean demo data (use with care)
```

## Troubleshooting

- 409 on register → email already exists; try login
- Frontend calls localhost:3000 in prod → set `VITE_API_URL` in Render Static Site
- Static Site “Not Found” → ensure Publish dir is `dist` and rewrites are configured
- AI doesn’t work → verify `OPENAI_API_KEY` and account credit
- DB health fails → check `SUPABASE_DB_URL` (or `DB_*`) and SSL settings

## Docker (optional)

Local one‑command run:
```bash
docker compose up -d --build
# frontend → http://localhost:8080, backend → http://localhost:3000
```

Development Team:
- **Juan Diego Hernandez Martinez** - QA/Integración
- **José Fernando Ospina García** - Backend Dev
- **Miguel Angel Molina Gutierrez** - Backend Dev
- **Jackson Olier Ledezma Murillo** - Frontend Dev
- **Roxana Naranjo estrada** - Frontend Dev


## Design Template

- **Financial app landing page**
  
 <img width="1218" height="709" alt="Captura de pantalla 2025-08-31 221415" src="https://github.com/user-attachments/assets/a1575c8d-600d-430e-87d9-6552346e61d3" />

- **User login form**
  
<img width="1218" height="718" alt="Captura de pantalla 2025-08-31 221525" src="https://github.com/user-attachments/assets/bd30f8ce-3e84-4710-9761-5eeb2fc1ec91" />

- **Create account form**
  
<img width="1219" height="732" alt="Captura de pantalla 2025-08-31 221537" src="https://github.com/user-attachments/assets/09efeade-a55d-4e8f-b8d9-81e40047ce85" />

- **Jermox - finance dashboard**
  
<img width="1208" height="757" alt="Captura de pantalla 2025-08-31 221559" src="https://github.com/user-attachments/assets/3506c08b-2ae8-4c8b-960e-f5339cd2260c" />
<img width="1211" height="760" alt="Captura de pantalla 2025-08-31 221617" src="https://github.com/user-attachments/assets/0c328f8a-170d-46f6-ab9e-ed6ead859685" />
<img width="1211" height="710" alt="Captura de pantalla 2025-08-31 221626" src="https://github.com/user-attachments/assets/f67585d1-44dc-4db6-a978-a4bd8245b04f" />
<img width="1210" height="762" alt="Captura de pantalla 2025-08-31 221634" src="https://github.com/user-attachments/assets/6f4bd3e4-da7c-4609-a6d7-a16a5280c39c" />
<img width="1208" height="761" alt="Captura de pantalla 2025-08-31 221645" src="https://github.com/user-attachments/assets/83d96fe5-cb26-4abe-b7d8-96b91ee7fe3e" />
<img width="1208" height="764" alt="Captura de pantalla 2025-08-31 221654" src="https://github.com/user-attachments/assets/b8aa5b3b-0504-4176-a84a-36e472e779af" />

---

---

Hecho con 💚 por Jermox.
