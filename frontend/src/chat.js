/**
 * Chatbot UI con historial local y formato de respuesta.
 * - Guarda el historial en localStorage (clave chat_history).
 * - Envía el historial al backend para mantener memoria conversacional.
 * - Renderiza markdown simple (negritas, itálicas, listas, enlaces, código inline).
 */
import { api } from "./api.js";
import { getCurrentUserId } from "./auth-utils.js";

const input = document.getElementById("chatInput");
const btn = document.getElementById("chatSend");
const box = document.getElementById("chatbox");
const form = document.getElementById("chatForm");
const chatbot = document.getElementById("chatbot");
const toggle = document.getElementById("chatbotToggle");
const closeBtn = document.getElementById("chatbotClose");

const CHAT_HISTORY_KEY = "chat_history";

/**
 * Render simple de Markdown a HTML limitado
 * (negritas, itálicas, enlaces, listas y backticks).
 */
function renderMarkdown(md) {
  if (!md || typeof md !== "string") return "";
  // Escape básico para evitar inyecciones en tags no previstos
  const esc = (s) => s.replace(/[&<>]/g, (c) => ({"&":"&amp;","<":"&lt;",">":"&gt;"}[c]));
  md = String(md);
  // Enlaces: [texto](url) y URLs sueltas
  md = md.replace(/\[(.*?)\]\((.*?)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>');
  md = md.replace(/(https?:\/\/[^\s)]+)(?=\s|$)/g, '<a href="$1" target="_blank" rel="noopener noreferrer">$1</a>');
  // Inline: **negrita**, *itálica*, `código`
  md = md.replace(/\*\*(.*?)\*\*/g, "<b>$1</b>").replace(/\*(.*?)\*/g, "<i>$1</i>").replace(/`([^`]+)`/g, "<code>$1</code>");
  // Bloques: listas y párrafos
  const lines = md.split(/\n+/);
  let html = "", mode = null; // 'ul' | 'ol'
  const close = () => { if (mode) { html += `</${mode}>`; mode = null; } };
  for (const raw of lines) {
    const line = raw.trim();
    if (/^[-•]\s+/.test(line)) {
      if (mode !== 'ul') { close(); html += '<ul>'; mode = 'ul'; }
      html += `<li>${line.replace(/^[-•]\s+/, '')}</li>`;
    } else if (/^\d+\.\s+/.test(line)) {
      if (mode !== 'ol') { close(); html += '<ol>'; mode = 'ol'; }
      html += `<li>${line.replace(/^\d+\.\s+/, '')}</li>`;
    } else if (line.length) {
      close();
      html += `<p>${line}</p>`;
    }
  }
  close();
  return html;
}

/** Inserta un mensaje en el chat (usuario o IA) */
function addMsg(text, who = "user") {
  const div = document.createElement("div");
  div.className = "msg " + who;
  if (who === "ai") {
    div.innerHTML = renderMarkdown(text || "");
  } else {
    div.textContent = text || "";
  }
  box.appendChild(div);
  box.scrollTop = box.scrollHeight;
}

/** Muestra indicador de escritura */
function addTyping() {
  const div = document.createElement("div");
  div.className = "msg ai typing";
  div.textContent = "Escribiendo...";
  div.id = "typingMsg";
  box.appendChild(div);
  box.scrollTop = box.scrollHeight;
}

/** Oculta indicador de escritura */
function removeTyping() {
  const typing = document.getElementById("typingMsg");
  if (typing) typing.remove();
}

/** Persiste historial en localStorage */
function saveHistory(history) {
  localStorage.setItem(CHAT_HISTORY_KEY, JSON.stringify(history));
}

/** Carga historial desde localStorage */
function loadHistory() {
  const h = localStorage.getItem(CHAT_HISTORY_KEY);
  return h ? JSON.parse(h) : [];
}

/** Limpia historial */
function clearHistory() {
  localStorage.removeItem(CHAT_HISTORY_KEY);
}

/** Renderiza mensajes previos al abrir */
function renderHistory() {
  box.innerHTML = "";
  const history = loadHistory();
  history.forEach((msg) =>
    addMsg(
      msg && msg.content ? msg.content : "",
      msg && msg.role === "user" ? "user" : "ai"
    )
  );
}

/** Envía pregunta y procesa respuesta de IA */
async function send(e) {
  if (e) e.preventDefault();
  const q = input.value.trim();
  if (!q) return;
  let history = loadHistory();
  history.push({ role: "user", content: q });
  saveHistory(history);
  addMsg(q, "user");
  input.value = "";
  addTyping();
  try {
    // Llamar a la API de chat IA
    const res = await api.aiChat(history);
    removeTyping();
    const reply = res.reply || "No tengo una respuesta en este momento.";
    addMsg(reply, "ai");
    history.push({ role: "assistant", content: reply });
    saveHistory(history);
  } catch (e) {
    removeTyping();
    addMsg("No pude generar una respuesta ahora.", "ai");
    history.push({
      role: "assistant",
      content: "No pude generar una respuesta ahora.",
    });
    saveHistory(history);
  }
}

// Abrir/cerrar chatbot
function openChat() {
  chatbot.style.display = "flex";
  renderHistory();
  setTimeout(() => {
    box.scrollTop = box.scrollHeight;
    input.focus();
  }, 100);
}
function closeChat() {
  chatbot.style.display = "none";
}

toggle?.addEventListener("click", openChat);
closeBtn?.addEventListener("click", closeChat);

btn?.addEventListener("click", send);
form?.addEventListener("submit", send);
input?.addEventListener("keydown", (e) => e.key === "Enter" && send(e));

// Limpiar historial y cerrar chat al cerrar sesión
const logoutBtn = document.getElementById("logout");
logoutBtn?.addEventListener("click", () => {
  clearHistory();
  closeChat();
});

// También limpiar historial si el usuario sale del perfil (redirige a login)
window.addEventListener("beforeunload", () => {
  if (window.location.pathname.includes("login")) {
    clearHistory();
    closeChat();
  }
});
