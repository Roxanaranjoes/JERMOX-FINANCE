export const CONFIG = {
  API_URL: import.meta.env.VITE_API_URL || "http://localhost:3000",
};

export const ROUTES = {
  // Auth
  login: "/api/users/login",
  register: "/api/users/register",
  me: "/api/users", // GET /api/users/:id

  // Finance core
  income: "/api/income",
  expense: "/api/expense",
  transaction: "/api/transaction",
  finProfile: "/api/financial-profile",

  // Taxes & AI
  taxSummaryUser: (userId) => `/api/tax/summary/${userId}`,
  aiTipsUser: (userId) => `/api/ai/tips/${userId}`,
  // aiChat: '/api/ai/ask' // No implementado en el backend actual
};
