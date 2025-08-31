/**
 * API client for Jermox frontend.
 * - Centralizes base URL, auth header and error handling.
 * - All exported methods return parsed JSON or throw Error with message/status.
 */
export const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

import { CONFIG } from "./config.js";

/**
 * Low-level fetch wrapper
 * @param {string} path - API path starting with /api
 * @param {RequestInit} options - fetch options
 * @returns {Promise<any>} parsed JSON
 */
async function request(path, options = {}) {
  const token = localStorage.getItem("token");
  const headers = {
    "Content-Type": "application/json",
    ...(options.headers || {}),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
  const res = await fetch(`${API_URL}${path}`, { ...options, headers });
  if (!res.ok) {
    let errorMessage = res.statusText;
    try {
      const errorData = await res.json();
      errorMessage =
        errorData.msg || errorData.error || errorData.message || res.statusText;
    } catch {
      // Si no se puede parsear JSON, usar el texto plano
      const text = await res.text().catch(() => "");
      errorMessage = text || res.statusText;
    }

    // Crear un error más informativo
    const error = new Error(errorMessage);
    error.status = res.status;
    error.statusText = res.statusText;
    console.log("Error creado:", {
      status: error.status,
      message: error.message,
    });
    throw error;
  }
  return res.json();
}

export const api = {
  /**
   * Auth: register
   */
  register: (payload) =>
    request("/api/users/register", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  /**
   * Auth: login
   */
  login: (payload) =>
    request("/api/users/login", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  /** Financial Profile CRUD **/
  createFinancialProfile: (payload) =>
    request("/api/financial-profile", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  getFinancialProfile: (userId) =>
    request(`/api/financial-profile/user/${userId}`),
  updateFinancialProfile: (profileId, payload) =>
    request(`/api/financial-profile/${profileId}`, {
      method: "PUT",
      body: JSON.stringify(payload),
    }),
  /**
   * Data listing with optional year/month filter
   */
  getIncomes: (userId, q = {}) => {
    const usp = new URLSearchParams();
    if (q.year) usp.set("year", q.year);
    if (q.month) usp.set("month", q.month);
    const qs = usp.toString();
    const path = `/api/income/user/${userId}` + (qs ? `?${qs}` : "");
    return request(path);
  },
  getExpenses: (userId, q = {}) => {
    const usp = new URLSearchParams();
    if (q.year) usp.set("year", q.year);
    if (q.month) usp.set("month", q.month);
    const qs = usp.toString();
    const path = `/api/expense/user/${userId}` + (qs ? `?${qs}` : "");
    return request(path);
  },
  /** Mutations for incomes/expenses **/
  addIncome: (payload) =>
    request("/api/income", { method: "POST", body: JSON.stringify(payload) }),
  updateIncome: (id, payload) =>
    request(`/api/income/${id}`, {
      method: "PUT",
      body: JSON.stringify(payload),
    }),
  deleteIncome: (id) => request(`/api/income/${id}`, { method: "DELETE" }),
  addExpense: (payload) =>
    request("/api/expense", { method: "POST", body: JSON.stringify(payload) }),
  updateExpense: (id, payload) =>
    request(`/api/expense/${id}`, {
      method: "PUT",
      body: JSON.stringify(payload),
    }),
  deleteExpense: (id) => request(`/api/expense/${id}`, { method: "DELETE" }),
  /** Insights/Tax/Reports **/
  aiTips: (userId) => request(`/api/ai/tips/${userId}`),
  taxSummary: (userId) => request(`/api/tax/summary/${userId}`),
  createTaxInfo: (payload) =>
    request("/api/tax-info", { method: "POST", body: JSON.stringify(payload) }),
  downloadMonthlyReportPdf: async (userId, year, month) => {
    const token = localStorage.getItem("token");
    const res = await fetch(
      `${API_URL}/api/report/monthly/${userId}/${year}/${month}`,
      {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      }
    );
    if (!res.ok) {
      const text = await res.text().catch(() => res.statusText);
      throw new Error(text || "No se pudo generar el PDF");
    }
    return res.blob();
  },
  /** Conversational AI endpoint with history **/
  aiChat: async (messages) => {
    // Reducir historial para no saturar el backend
    const trimmed = (Array.isArray(messages) ? messages : [])
      .filter((m) => m && (m.role === "user" || m.role === "assistant") && typeof m.content === "string")
      .slice(-14);

    let userId = null;
    const token = localStorage.getItem("token");
    if (token) {
      try {
        // El payload del token JWT usa 'id', no 'userId'.
        const payload = JSON.parse(atob(token.split(".")[1]));
        userId = payload.id || null;
      } catch (e) {
        console.error("Error al decodificar el token JWT:", e);
      }
    }

    if (!userId || !trimmed.length)
      return { reply: "No se pudo enviar la pregunta." };
    try {
      // Enviamos historial para mantener memoria conversacional
      const data = await request("/api/ai/ask", {
        method: "POST",
        body: JSON.stringify({ userId, messages: trimmed }),
      });
      return { reply: data.answer || "No he recibido una respuesta válida." };
    } catch (e) {
      console.error("Error en aiChat:", e);
      return {
        reply: "🤖 Lo siento, no pude conectarme con la IA en este momento.",
      };
    }
  },
};

// Función genérica para requests personalizados
/** Generic request helper (optional) */
export async function customApi(
  path,
  { method = "GET", body = null, auth = true } = {}
) {
  const url = path.startsWith("http") ? path : `${CONFIG.API_URL}${path}`;
  const headers = { "Content-Type": "application/json" };
  if (auth) {
    const t = localStorage.getItem("token");
    if (t) headers["Authorization"] = `Bearer ${t}`;
  }
  const res = await fetch(url, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) {
    let msg = "Error de red";
    try {
      const j = await res.json();
      msg = j.error || j.message || res.statusText;
    } catch {}
    throw new Error(msg);
  }
  return res.json();
}
