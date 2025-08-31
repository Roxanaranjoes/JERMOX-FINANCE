import { api } from "./api";
export function mountChatbot(root, currentUser) {
  const panel = document.createElement("div");
  panel.className = "chatbot";
  panel.innerHTML = `
    <header>
      <strong>Asistente JERMOX</strong>
      <button class="btn ghost" id="chatClose" style="padding:6px 10px">×</button>
    </header>
    <main id="chatMain">
      <div class="msg bot">¡Hola! Soy tu asistente financiero. ¿En qué te ayudo?</div>
      <div class="quick">
        <button data-q="impuestos">¿Cómo calculan mis impuestos?</button>
        <button data-q="perfil">¿Cómo crear mi perfil financiero?</button>
        <button data-q="ingresos">¿Cómo agrego ingresos/gastos?</button>
        <button data-q="tips">Generar tips de ahorro</button>
      </div>
    </main>
  `;
  const toggle = document.createElement("button");
  toggle.className = "chatbot-toggle";
  toggle.textContent = "💬";
  root.appendChild(panel);
  root.appendChild(toggle);

  const chat = panel.querySelector("#chatMain");
  const addMsg = (txt, who = "bot") => {
    const d = document.createElement("div");
    d.className = `msg ${who}`;
    d.textContent = txt;
    chat.appendChild(d);
    chat.scrollTop = chat.scrollHeight;
  };

  const answers = {
    impuestos:
      "Usamos tus ingresos/gastos de /tax-info y calculamos base gravable. Luego aplicamos tramos UVT configurados por año en el backend.",
    perfil:
      "Completa el Perfil Financiero en registro: ingresos, egresos, % ahorro, objetivo, horizonte, riesgo y deudas. Con eso personalizamos tus métricas.",
    ingresos:
      "En el dashboard tienes formularios rápidos para añadir ingresos y gastos y actualizar métricas en tiempo real.",
  };

  panel.querySelectorAll(".quick button").forEach((btn) => {
    btn.addEventListener("click", async () => {
      const key = btn.dataset.q;
      addMsg(btn.textContent, "user");
      if (key === "tips") {
        if (!currentUser?.id) {
          addMsg("Primero inicia sesión para generar tips personalizados.");
          return;
        }
        addMsg("Generando tips...");
        try {
          const data = await api.aiTips(currentUser.id);
          (data.tips || []).forEach((t) => addMsg(`• ${t}`));
        } catch {
          addMsg("No pude generar tips ahora mismo.");
        }
      } else {
        addMsg(answers[key] || "Puedo ayudarte con lo que necesites 😊");
      }
    });
  });

  toggle.addEventListener(
    "click",
    () =>
      (panel.style.display = panel.style.display === "flex" ? "none" : "flex")
  );
  panel
    .querySelector("#chatClose")
    .addEventListener("click", () => (panel.style.display = "none"));
}
