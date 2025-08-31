// src/dashboard.js (reconstruido con mejoras en formularios y gráficos)
/**
 * Dashboard principal de JERMOX
 *
 * Responsabilidades de este módulo:
 * - Orquestar la carga inicial (ingresos/egresos, perfil financiero, tips, noticias, tax).
 * - Calcular y pintar KPIs, gráficas (donut por categorías y gauge gasto vs presupuesto).
 * - Manejar formularios (agregar ingresos/egresos y guardar perfil financiero).
 * - Renderizar listados (recientes + "Todos los movimientos" con búsqueda/filtro/paginación + editar/eliminar).
 * - Modales informativos accesibles, toggles Mostrar/Ocultar y preloader de la página.
 * - Generar insights amigables y noticias personalizadas por perfil.
 *
 * Nota: los comentarios se enfocan en el "por qué" y el "qué" de cada bloque,
 * evitando ruido innecesario en líneas triviales (asignaciones simples, etc.).
 */
import { api } from "./api";
import { fmtCOP, groupSumBy, byMonthKey, sum } from "./utils";
import { showSuccess, showError, showWarning, showApiError } from "./ui.js";
import Chart from "chart.js/auto";
import { NEWS_DATA } from "./news-data.js";

// Defaults visuales
Chart.defaults.color = "#c8f7d4";
Chart.defaults.borderColor = "rgba(200,247,212,0.25)";
if (Chart.defaults.plugins?.legend?.labels)
  Chart.defaults.plugins.legend.labels.color = "#eafff5";
const PALETTE = [
  "#00e8a9",
  "#7db9ff",
  "#ffd166",
  "#ef476f",
  "#06d6a0",
  "#118ab2",
  "#8338ec",
  "#ffbe0b",
  "#ff9f1c",
  "#ff006e",
];

// Estado
const user = JSON.parse(localStorage.getItem("user") || "null");
if (!user) location.href = "login.html";
let donut, gauge;
let finProfileCache = null;
let currentFilter = null; // {year,month}
let lastTotalExpense = 0;
// Estado para listados completos
let incomeList = [];
let expenseList = [];
let incomesPage = 1,
  expensesPage = 1;
const PAGE_SIZE = 10;
let incomesSearchQuery = "";
let expensesSearchQuery = "";
let incomesCategoryFilter = "";
let expensesCategoryFilter = "";
let newsRefreshCounter = 0;

// UI básica
document.getElementById("userName").textContent = user.first_name || "Usuario";
document.getElementById("logout").addEventListener("click", () => {
  localStorage.removeItem("token");
  localStorage.removeItem("user");
  location.href = "login.html";
});

// ----- CARGA PRINCIPAL -----
/**
 * Carga orquestada de todo lo necesario para el panel.
 * - Aplica (si llega) un filtro de período {year, month}.
 * - Trae ingresos/egresos, calcula KPIs y balance.
 * - Pinta "recientes", donut por categorías y el gauge Gasto vs Presupuesto.
 * - Intenta obtener el resumen tributario (muestra estado si falla).
 * - Carga tips de IA, genera insights y renderiza noticias.
 */
async function loadAll(filterArg = null) {
  const filter = filterArg ?? currentFilter ?? {};
  const [incomes, expenses] = await Promise.all([
    api.getIncomes(user.id, filter),
    api.getExpenses(user.id, filter),
  ]);
  currentFilter = Object.keys(filter).length ? filter : null;

  // KPIs
  const totalIncome = sum(incomes, (i) => i.amount);
  const totalExpense = sum(expenses, (e) => e.amount);
  lastTotalExpense = totalExpense;
  incomeList = incomes || [];
  expenseList = expenses || [];
  const balance = totalIncome - totalExpense;
  document.getElementById("kpiIncome").textContent = fmtCOP(totalIncome);
  document.getElementById("kpiExpense").textContent = fmtCOP(totalExpense);
  document.getElementById("kpiBalance").textContent = fmtCOP(balance);

  // Movimientos recientes
  const tbody = document.getElementById("recentBody");
  tbody.innerHTML = "";
  const merged = [
    ...incomes.map((i) => ({ ...i, _type: "Ingreso" })),
    ...expenses.map((e) => ({ ...e, _type: "Gasto" })),
  ]
    .sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0))
    .slice(0, 8);
  merged.forEach((r) => {
    const tr = document.createElement("tr");
    const isIncome = r._type === "Ingreso";
    const id = r.income_id || r.expense_id || r.id || "";
    tr.innerHTML = `<td>${r._type}</td><td>${
      r.category || r.type
    }</td><td>${fmtCOP(r.amount)}</td><td>${new Date(
      r.created_at || Date.now()
    ).toLocaleDateString(
      "es-CO"
    )}</td><td><button class="btn tiny" data-edit data-kind="${
      isIncome ? "income" : "expense"
    }" data-id="${id}" data-type="${
      (r.type || "").replace(/"/g, "&quot;")
    }" data-category="${
      (r.category || "").replace(/"/g, "&quot;")
    }" data-amount="${Number(r.amount || 0)}">Editar</button> <button class="btn tiny secondary" data-del data-kind="${
      isIncome ? "income" : "expense"
    }" data-id="${id}">Eliminar</button></td>`;
    tbody.appendChild(tr);
  });

  // Donut por categoría
  const byCat = groupSumBy(
    expenses,
    (e) => e.category || "Otros",
    (e) => Number(e.amount || 0)
  );
  const catLabels = [...byCat.keys()];
  const catData = [...byCat.values()];
  const donutCanvas = document.getElementById("donut");
  if (donut) donut.destroy();
  if (donutCanvas) {
    donut = new Chart(donutCanvas, {
      type: "doughnut",
      data: {
        labels: catLabels.length ? catLabels : ["Sin datos"],
        datasets: [
          {
            data: catData.length ? catData : [1],
            backgroundColor: (catData.length ? catData : [1]).map(
              (_, i) => PALETTE[i % PALETTE.length]
            ),
            borderColor: "rgba(255,255,255,0.18)",
            borderWidth: 1,
          },
        ],
      },
      options: {
        cutout: "60%",
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { labels: { color: "#eafff5" } },
          colors: { enabled: false },
          tooltip: {
            callbacks: {
              label: (ctx) => {
                const label = ctx.label || "";
                const value = ctx.parsed || 0;
                const total = ctx.chart.data.datasets[0].data.reduce(
                  (a, b) => a + (Number(b) || 0),
                  0
                );
                const pct = total ? Math.round((value / total) * 100) : 0;
                return `${label}: ${fmtCOP(value)} (${pct}%)`;
              },
            },
          },
        },
      },
    });
  }

  // Gauge Gasto vs Presupuesto
  renderGauge(totalExpense);

  // Resumen tributario
  try {
    const tax = await api.taxSummary(user.id);
    document.getElementById("taxBase").textContent = fmtCOP(tax.base);
    document.getElementById("taxDue").textContent = fmtCOP(tax.impuesto);
    document.getElementById("taxStatus").style.display = "none";
  } catch (err) {
    document.getElementById("taxBase").textContent = "No disponible";
    document.getElementById("taxDue").textContent = "No disponible";
    document.getElementById("taxStatus").style.display = "block";
  }

  // Consejos de IA: presentación amigable + CTAs
  try {
    const box = document.getElementById("tipsBox");
    if (box) {
      box.innerHTML =
        '<li class="tip-item"><span class="tip-icon">💡</span><span class="tip-text">Cargando consejos...</span></li>';
      const data = await api.aiTips(user.id);
      let tips = (data.tips || []).slice(0, 5);
      // Si la IA no devuelve tips, usar educativos + contexto del usuario
      if (!tips.length) {
        // Top categoría para personalizar un tip
        let topCat = null;
        if (catLabels.length) {
          const i = catData.indexOf(Math.max(...catData));
          if (i >= 0) topCat = catLabels[i];
        }
        const edu = [
          "Presupuesto: es el límite de gasto que te pones cada mes. Empieza con un número realista.",
          "Gasto fijo vs variable: fija son pagos que no cambian (arriendo), variables pueden ajustarse (comida fuera).",
          "Regla 50/30/20: 50% necesidades, 30% gustos, 20% ahorro. Úsala como guía inicial.",
          "Fondo de emergencia: apunta a 3–6 meses de gastos para imprevistos.",
        ];
        if (topCat) {
          edu.unshift(
            `En ${topCat} estás gastando una parte importante. Prueba un reto de 7 días para reducir pequeños gastos en esa categoría.`
          );
        } else {
          edu.unshift(
            "Identifica tu categoría más grande del mes y recórtala 10% por dos semanas como prueba."
          );
        }
        tips = edu.slice(0, 5);
      }
      const pickIcon = (txt) => {
        const s = (txt || "").toLowerCase();
        if (s.includes("ahorro") || s.includes("presupuesto")) return "💰";
        if (s.includes("gasto") || s.includes("egreso")) return "📉";
        if (s.includes("ingreso") || s.includes("ingres")) return "📈";
        if (s.includes("invers") || s.includes("rentab")) return "📊";
        if (s.includes("impuesto") || s.includes("dian")) return "🧾";
        return "💡";
      };
      box.innerHTML = tips
        .map(
          (t) =>
            `<li class=\"tip-item\"><span class=\"tip-icon\">${pickIcon(
              t
            )}</span><span class=\"tip-text\">${t}</span></li>`
        )
        .join("");
    }
  } catch {}

  // Insights (según gasto vs presupuesto)
  renderInsights(totalExpense);

  // Listados completos (paginados)
  renderFullLists();

  // Noticias
  renderNews();
}

function normalizeStr(s) {
  return String(s || "")
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase();
}

function paginateAndFilter(list, query, catFilter) {
  const q = normalizeStr(query).trim();
  let filtered = q
    ? list.filter((r) => {
        const haystack = `${normalizeStr(r.type)} ${normalizeStr(r.category)}`;
        return haystack.includes(q);
      })
    : list.slice();
  const c = normalizeStr(catFilter).trim();
  if (c) filtered = filtered.filter((r) => normalizeStr(r.category) === c);
  return filtered;
}

function renderFullLists() {
  // Ingresos: rellenar categorías
  const catIncSel = document.getElementById("incomesCategoryFilter");
  if (catIncSel) {
    const unique = Array.from(
      new Set(
        incomeList
          .map((r) => (r.category || "").trim())
          .filter((x) => x && x.length > 0)
      )
    ).sort((a, b) => a.localeCompare(b, "es"));
    const current = incomesCategoryFilter;
    catIncSel.innerHTML =
      `<option value="">Todas las categorías</option>` +
      unique
        .map(
          (c) => `<option value="${c.replace(/"/g, "&quot;")}">${c}</option>`
        )
        .join("");
    catIncSel.value = current || "";
  }
  // Ingresos: filtrar + paginar
  const filteredInc = paginateAndFilter(
    incomeList,
    incomesSearchQuery,
    incomesCategoryFilter
  );
  const totalIncPages = Math.max(1, Math.ceil(filteredInc.length / PAGE_SIZE));
  if (incomesPage > totalIncPages) incomesPage = totalIncPages;
  const startI = (incomesPage - 1) * PAGE_SIZE;
  const sliceInc = filteredInc.slice(startI, startI + PAGE_SIZE);
  const incBody = document.getElementById("incomesTableBody");
  if (incBody) {
    incBody.innerHTML =
      sliceInc
        .map((r) => {
          const id = r.income_id || r.id || "";
          const d = new Date(r.created_at || Date.now()).toLocaleDateString(
            "es-CO"
          );
          const type = r.type || "";
          const cat = r.category || "";
          const amt = Number(r.amount || 0);
          return `<tr>
          <td>${d}</td>
          <td>${type}</td>
          <td>${cat}</td>
          <td>${fmtCOP(amt)}</td>
          <td>
            <button class=\"btn tiny\" data-edit data-kind=\"income\" data-id=\"${id}\" data-type=\"${type.replace(
              /"/g,
              "&quot;"
            )}\" data-category=\"${cat.replace(/"/g, "&quot;")}\" data-amount=\"${amt}\">Editar</button>
            <button class=\"btn tiny secondary\" data-del data-kind=\"income\" data-id=\"${id}\">Eliminar</button>
          </td>
        </tr>`;
        })
        .join("") || `<tr><td colspan=\"5\">No hay ingresos para mostrar.</td></tr>`;
  }
  const incInfo = document.getElementById("incomesPageInfo");
  if (incInfo)
    incInfo.textContent = `Página ${incomesPage} de ${Math.max(1, totalIncPages)}`;

  // Gastos: rellenar categorías
  const catExpSel = document.getElementById("expensesCategoryFilter");
  if (catExpSel) {
    const unique = Array.from(
      new Set(
        expenseList
          .map((r) => (r.category || "").trim())
          .filter((x) => x && x.length > 0)
      )
    ).sort((a, b) => a.localeCompare(b, "es"));
    const current = expensesCategoryFilter;
    catExpSel.innerHTML =
      `<option value="">Todas las categorías</option>` +
      unique
        .map(
          (c) => `<option value="${c.replace(/"/g, "&quot;")}">${c}</option>`
        )
        .join("");
    catExpSel.value = current || "";
  }
  // Gastos: filtrar + paginar
  const filteredExp = paginateAndFilter(
    expenseList,
    expensesSearchQuery,
    expensesCategoryFilter
  );
  const totalExpPages = Math.max(1, Math.ceil(filteredExp.length / PAGE_SIZE));
  if (expensesPage > totalExpPages) expensesPage = totalExpPages;
  const startE = (expensesPage - 1) * PAGE_SIZE;
  const sliceExp = filteredExp.slice(startE, startE + PAGE_SIZE);
  const expBody = document.getElementById("expensesTableBody");
  if (expBody) {
    expBody.innerHTML =
      sliceExp
        .map((r) => {
          const id = r.expense_id || r.id || "";
          const d = new Date(r.created_at || Date.now()).toLocaleDateString(
            "es-CO"
          );
          const type = r.type || "";
          const cat = r.category || "";
          const amt = Number(r.amount || 0);
          return `<tr>
          <td>${d}</td>
          <td>${type}</td>
          <td>${cat}</td>
          <td>${fmtCOP(amt)}</td>
          <td>
            <button class=\"btn tiny\" data-edit data-kind=\"expense\" data-id=\"${id}\" data-type=\"${type.replace(
              /"/g,
              "&quot;"
            )}\" data-category=\"${cat.replace(/"/g, "&quot;")}\" data-amount=\"${amt}\">Editar</button>
            <button class=\"btn tiny secondary\" data-del data-kind=\"expense\" data-id=\"${id}\">Eliminar</button>
          </td>
        </tr>`;
        })
        .join("") || `<tr><td colspan=\"5\">No hay gastos para mostrar.</td></tr>`;
  }
  const expInfo = document.getElementById("expensesPageInfo");
  if (expInfo)
    expInfo.textContent = `Página ${expensesPage} de ${Math.max(1, totalExpPages)}`;
}

/**
 * Render del gauge "Gasto vs Presupuesto".
 * - El presupuesto proviene del Perfil financiero:
 *   - Modo fijo: monthly_expense
 *   - Modo ahorro: monthly_income * (1 - %ahorro)
 * - Opción "Proporcional al día" si el mes mostrado es el actual.
 * - Muestra porcentaje, estado (OK/Atención/Excedido) y Gastado/Presupuesto.
 */
function renderGauge(totalExpense) {
  const gaugeCanvas = document.getElementById("gauge");
  if (gauge) gauge.destroy();
  if (!gaugeCanvas) return;
  const gaugeWrap = gaugeCanvas.closest(".chart-wrap");
  const gaugeEmpty = document.getElementById("gaugeEmpty");
  const gaugeSub = document.getElementById("gaugeSub");
  // Determinar modo y pro-rata
  const mode = localStorage.getItem("budget_mode") || "fixed"; // 'fixed' | 'saving'
  const proRata = localStorage.getItem("budget_prorata") === "true";

  // Base de presupuesto
  let budget = 0;
  if (mode === "fixed") {
    if (finProfileCache?.monthly_expense)
      budget = Number(finProfileCache.monthly_expense);
  } else {
    if (finProfileCache?.monthly_income) {
      const sp = Number(finProfileCache.savings_percentage || 0);
      budget = Math.max(
        0,
        Number(finProfileCache.monthly_income) * (1 - sp / 100)
      );
    }
  }

  // Proporcional al día (solo si el mes filtrado es el actual)
  let isCurrentMonth = false;
  if (proRata && budget > 0) {
    let y, m;
    if (currentFilter) {
      y = currentFilter.year;
      m = currentFilter.month;
    } else {
      const now = new Date();
      y = now.getFullYear();
      m = now.getMonth() + 1;
    }
    const today = new Date();
    isCurrentMonth = today.getFullYear() === y && today.getMonth() + 1 === m;
    if (isCurrentMonth) {
      const daysInMonth = new Date(y, m, 0).getDate();
      const day = today.getDate();
      const factor = Math.min(1, day / daysInMonth);
      budget = budget * factor;
    }
  }
  // Si no hay presupuesto definido, mostrar estado vacío y salir
  if (!budget || !isFinite(budget) || budget <= 0) {
    if (gaugeWrap) gaugeWrap.style.display = "none";
    if (gaugeEmpty) gaugeEmpty.style.display = "block";
    if (gaugeSub) gaugeSub.style.display = "none";
    return;
  } else {
    if (gaugeWrap) gaugeWrap.style.display = "";
    if (gaugeEmpty) gaugeEmpty.style.display = "none";
    if (gaugeSub)
      gaugeSub.style.display = proRata && isCurrentMonth ? "block" : "none";
  }
  const spent = Number(totalExpense || 0);
  const over = Math.max(0, spent - budget);
  const within = Math.min(spent, budget);
  const remaining = Math.max(budget - spent, 0);
  const ratio = budget ? spent / budget : 0;

  // Plugins visuales
  const centerText = {
    id: "centerText",
    afterDraw(chart) {
      const ctx = chart.ctx;
      const cx = chart.width / 2,
        cy = chart.height / 2;
      const fontBase = Math.max(14, Math.min(24, chart.width * 0.06));
      ctx.save();
      ctx.fillStyle = "#eafff5";
      ctx.textAlign = "center";
      ctx.font = `700 ${fontBase}px system-ui`;
      ctx.fillText(`${Math.round(ratio * 100)}%`, cx, cy - 8);
      const okT = 0.7,
        warnT = 0.9;
      let status = "OK",
        sColor = "#06d6a0";
      if (ratio >= warnT) {
        status = "Excedido";
        sColor = "#ef476f";
      } else if (ratio >= okT) {
        status = "Atención";
        sColor = "#ffd166";
      }
      ctx.font = `600 ${Math.max(10, fontBase * 0.6)}px system-ui`;
      ctx.fillStyle = sColor;
      ctx.fillText(status, cx, cy + fontBase * 0.1);
      ctx.font = `${Math.max(10, fontBase * 0.5)}px system-ui`;
      ctx.fillStyle = "#c8f7d4";
      ctx.fillText(
        `${fmtCOP(spent)} / ${fmtCOP(budget)}`,
        cx,
        cy + fontBase * 0.8
      );
      ctx.restore();
    },
  };
  const gaugeNeedle = {
    id: "gaugeNeedle",
    beforeDatasetsDraw(chart) {
      const meta = chart.getDatasetMeta(0);
      const arc = meta?.data?.[0];
      if (!arc) return;
      const ctx = chart.ctx;
      const cx = arc.x,
        cy = arc.y;
      const inner = arc.innerRadius;
      const start = chart.options.rotation || -Math.PI;
      const circ = chart.options.circumference || Math.PI;
      const r = Math.max(5, inner - 6);
      const thick = 8;
      const band = (from, to, color) => {
        ctx.save();
        ctx.beginPath();
        ctx.lineWidth = thick;
        ctx.strokeStyle = color;
        ctx.arc(cx, cy, r, start + from * circ, start + to * circ);
        ctx.stroke();
        ctx.restore();
      };
      band(0.0, 0.7, "#06d6a0");
      band(0.7, 0.9, "#ffd166");
      band(0.9, 1.0, "#ef476f");
      const ticks = [0, 0.25, 0.5, 0.75, 1];
      ticks.forEach((p, i) => {
        const ang = start + p * circ;
        ctx.save();
        ctx.translate(cx, cy);
        ctx.rotate(ang);
        ctx.strokeStyle = "#cfe9e5";
        ctx.lineWidth = i % 2 === 0 ? 2 : 1;
        ctx.beginPath();
        ctx.moveTo(r - (i % 2 === 0 ? 14 : 10), 0);
        ctx.lineTo(r + 2, 0);
        ctx.stroke();
        ctx.restore();
      });
    },
    afterDatasetsDraw(chart, _args, pluginOptions) {
      const meta = chart.getDatasetMeta(0);
      const arc = meta?.data?.[0];
      if (!arc) return;
      const ctx = chart.ctx;
      const cx = arc.x,
        cy = arc.y;
      const outer = arc.outerRadius;
      const start = chart.options.rotation || -Math.PI;
      const circ = chart.options.circumference || Math.PI;
      const val = Math.max(0, Math.min(pluginOptions?.value ?? 0, 1));
      const ang = start + val * circ;
      const len = outer * 0.9;
      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(ang);
      ctx.strokeStyle = "#eafff5";
      ctx.lineWidth = 3;
      ctx.shadowColor = "rgba(0,0,0,0.25)";
      ctx.shadowBlur = 6;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(len, 0);
      ctx.stroke();
      ctx.fillStyle = "#eafff5";
      ctx.beginPath();
      ctx.arc(0, 0, 4, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    },
  };

  gauge = new Chart(gaugeCanvas, {
    type: "doughnut",
    data: {
      labels: ["Gastado", "Disponible", "Exceso"],
      datasets: [
        {
          data: [within, remaining, over],
          backgroundColor: ["#00e8a9", "rgba(255,255,255,0.10)", "#ef476f"],
          borderWidth: 0,
        },
      ],
    },
    options: {
      rotation: -Math.PI,
      circumference: Math.PI,
      cutout: "70%",
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: { label: (c) => `${c.label}: ${fmtCOP(c.parsed)}` },
        },
        colors: { enabled: false },
        gaugeNeedle: { value: Math.min(1, Math.max(0, ratio)) },
      },
    },
    plugins: [centerText, gaugeNeedle],
  });
}

/**
 * Insights simples en lenguaje natural según gasto vs presupuesto.
 * - Si hay perfil: mensajes en función de porcentaje/ exceso.
 * - Si no hay perfil: consejos de inicio y foco en categoría más alta.
 */
function renderInsights(totalExpense) {
  const insights = [];
  const spent = Number(totalExpense || 0);
  if (finProfileCache?.monthly_expense) {
    const budget = Number(finProfileCache.monthly_expense);
    const diff = spent - budget;
    const pct = budget ? Math.round((spent / budget) * 100) : 0;
    if (diff > 0) {
      insights.push(`🚨 Has superado el presupuesto en ${fmtCOP(diff)} (${pct}%).`);
      insights.push("Sugerencia: limita gastos variables (comida fuera, apps, compras impulsivas) por 7 días.");
    } else if (pct >= 80) {
      insights.push(`⚠️ Vas en ${pct}% del presupuesto.`);
      insights.push("Tip: reserva un monto fijo para imprevistos y evita compras no planificadas esta semana.");
    } else {
      insights.push(`✅ Vas en ${pct}% del presupuesto, buen control.`);
      insights.push("Mantén el hábito: registra gastos apenas ocurran para conservar tu ritmo.");
    }
  } else {
    // Sin presupuesto configurado: generar insights útiles a partir de los movimientos
    if ((expenseList?.length || 0) + (incomeList?.length || 0) === 0) {
      insights.push("Aún no hay movimientos registrados.");
      insights.push("Añade un ingreso o gasto para empezar a recibir recomendaciones.");
      insights.push("Configura tu presupuesto en el Perfil financiero para activar alertas.");
    } else {
      // Top categoría de gasto
      if (expenseList?.length) {
        const byCat = groupSumBy(
          expenseList,
          (e) => e.category || "Otros",
          (e) => Number(e.amount || 0)
        );
        const entries = Array.from(byCat.entries());
        entries.sort((a, b) => b[1] - a[1]);
        const [topCat, topVal] = entries[0] || ["Otros", 0];
        if (topVal > 0) {
          insights.push(`📌 Tu categoría más alta es ${topCat}: ${fmtCOP(topVal)}.`);
          insights.push("Prueba a bajarla 10% durante 2 semanas (pequeños cambios suman).");
        }
      }
      // Sugerencia para configurar presupuesto
      insights.push("Configura tu presupuesto en el Perfil financiero para medir avance vs meta.");
    }
  }
  const list = document.getElementById("insightsList");
  if (list)
    list.innerHTML = insights.length
      ? insights.map((t) => `<li>${t}</li>`).join("")
      : "<li>Sin datos suficientes para generar insights.</li>";
}

// ----- PERFIL FINANCIERO -----
/**
 * Carga y guarda el Perfil financiero del usuario.
 * - Si existe en backend: rellena el formulario y cambia el botón a "Actualizar".
 * - Si no existe: resetea el formulario para crear uno nuevo.
 * - Al guardar: vuelve a cargar el perfil y refresca el dashboard (gauge depende de esto).
 */
async function loadFinProfile() {
  const finForm = document.getElementById("finProfileForm");
  const saveBtn = document.getElementById("saveFinProfileBtn");
  let currentProfileId = null;
  try {
    const res = await api.getFinancialProfile(user.id);
    if (res?.profile_id) {
      finProfileCache = res;
      currentProfileId = res.profile_id;
      document.getElementById("monthly_income").value = res.monthly_income;
      document.getElementById("monthly_expense").value = res.monthly_expense;
      document.getElementById("savings_percentage").value =
        res.savings_percentage;
      document.getElementById("goal").value = res.goal;
      document.getElementById("time_horizon").value = res.time_horizon;
      document.getElementById("risk_tolerance").value = res.risk_tolerance;
      document.getElementById("biggest_expense").value =
        res.biggest_expense || "";
      document.getElementById("has_debt").value = String(res.has_debt);
      document.getElementById("debt_amount").value = res.debt_amount || "";
      document.getElementById("debt_type").value = res.debt_type || "";
      document.getElementById("tips_preference").value = res.tips_preference;
      saveBtn.textContent = "Actualizar Perfil";
    } else {
      finForm.reset();
      saveBtn.textContent = "Guardar Perfil";
    }
  } catch {
    finForm.reset();
    saveBtn.textContent = "Guardar Perfil";
    finProfileCache = null;
  }

  finForm.onsubmit = async (e) => {
    e.preventDefault();
    const payload = {
      user_id: user.id,
      monthly_income: Number(document.getElementById("monthly_income").value),
      monthly_expense: Number(document.getElementById("monthly_expense").value),
      savings_percentage: Number(
        document.getElementById("savings_percentage").value
      ),
      goal: Number(document.getElementById("goal").value),
      time_horizon: Number(document.getElementById("time_horizon").value),
      risk_tolerance: Number(document.getElementById("risk_tolerance").value),
      biggest_expense: document.getElementById("biggest_expense").value,
      has_debt: document.getElementById("has_debt").value === "true",
      debt_amount: Number(document.getElementById("debt_amount").value || 0),
      debt_type: document.getElementById("debt_type").value,
      tips_preference: Number(document.getElementById("tips_preference").value),
    };
    try {
      if (currentProfileId)
        await api.updateFinancialProfile(currentProfileId, payload);
      else await api.createFinancialProfile(payload);
      showSuccess("Perfil financiero guardado");
      await loadFinProfile();
      await loadAll(currentFilter);
      const finProfileContent = document.getElementById("finProfileContent");
      const toggleBtn = document.getElementById("toggleFinProfileBtn");
      if (finProfileContent && toggleBtn) {
        finProfileContent.style.display = "none";
        const label = toggleBtn.querySelector('.label');
        if (label) label.textContent = 'Mostrar';
        toggleBtn.setAttribute("aria-expanded", "false");
      }
    } catch (err) {
      showApiError(err, "Error al guardar perfil financiero");
    }
  };
}

// ----- FORMULARIOS DE MOVIMIENTOS -----
// Formulario: Agregar INGRESO (valida campos "otro", parsea fecha opcional y notifica)
document.getElementById("formIncome").addEventListener("submit", async (e) => {
  e.preventDefault();
  try {
    const incTypeSel = document.getElementById("inc_type");
    const incType =
      incTypeSel.value === "otro"
        ? document.getElementById("inc_type_other").value.trim()
        : incTypeSel.value;
    const incCatSel = document.getElementById("inc_category");
    const incCategory =
      incCatSel.value === "otro"
        ? document.getElementById("inc_category_other").value.trim()
        : incCatSel.value;
    const payload = {
      user_id: user.id,
      type: incType,
      amount: Number(document.getElementById("inc_amount").value),
      category: incCategory,
      date: (() => {
        const d = document.getElementById("inc_date").value;
        if (!d) return undefined;
        const [y, m, day] = d.split("-").map(Number);
        return new Date(y, (m || 1) - 1, day || 1).toISOString();
      })(),
    };
    await api.addIncome(payload);
    document.getElementById("formIncome").reset();
    showSuccess("💰 Ingreso agregado");
    await loadAll(currentFilter);
  } catch (err) {
    showApiError(err, "❌ Error al agregar ingreso");
  }
});

// Formulario: Agregar EGRESO (misma lógica que ingresos)
document.getElementById("formExpense").addEventListener("submit", async (e) => {
  e.preventDefault();
  try {
    const expTypeSel = document.getElementById("exp_type");
    const expType =
      expTypeSel.value === "otro"
        ? document.getElementById("exp_type_other").value.trim()
        : expTypeSel.value;
    const expCatSel = document.getElementById("exp_category");
    const expCategory =
      expCatSel.value === "otro"
        ? document.getElementById("exp_category_other").value.trim()
        : expCatSel.value;
    const payload = {
      user_id: user.id,
      type: expType,
      amount: Number(document.getElementById("exp_amount").value),
      category: expCategory,
      date: (() => {
        const d = document.getElementById("exp_date").value;
        if (!d) return undefined;
        const [y, m, day] = d.split("-").map(Number);
        return new Date(y, (m || 1) - 1, day || 1).toISOString();
      })(),
    };
    await api.addExpense(payload);
    document.getElementById("formExpense").reset();
    showSuccess("💸 Gasto agregado");
    await loadAll(currentFilter);
  } catch (err) {
    showApiError(err, "❌ Error al agregar gasto");
  }
});

// ----- FILTRO Y REPORTES -----
document.getElementById("applyFilter").addEventListener("click", async () => {
  const m = document.getElementById("filter_month").value;
  if (!m) return showWarning("Selecciona un mes válido");
  const [year, month] = m.split("-").map(Number);
  await loadAll({ year, month });
  const reportInput = document.getElementById("report_month");
  if (reportInput)
    reportInput.value = `${year}-${String(month).padStart(2, "0")}`;
});
document.getElementById("clearFilter").addEventListener("click", async () => {
  document.getElementById("filter_month").value = "";
  await loadAll(null);
});
document
  .getElementById("downloadReport")
  .addEventListener("click", async () => {
    let m = document.getElementById("report_month").value;
    if (!m && currentFilter)
      m = `${currentFilter.year}-${String(currentFilter.month).padStart(
        2,
        "0"
      )}`;
    if (!m) {
      const now = new Date();
      m = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
    }
    const [year, month] = m.split("-").map(Number);
    try {
      const blob = await api.downloadMonthlyReportPdf(user.id, year, month);
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `reporte-${year}-${String(month).padStart(2, "0")}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch (err) {
      showApiError(err, "Error al descargar PDF");
    }
  });

// ----- INICIO -----
// CTA del card tributario → navega a la sección de impuestos
document
  .getElementById("goTax")
  .addEventListener("click", () => (location.href = "tax.html"));

// Arranque del panel: prefija fechas/mes por defecto, inicializa toggles y carga datos
document.addEventListener("DOMContentLoaded", async () => {
  // Prefijar filtros y fechas
  const now = new Date();
  const defaultMonth = `${now.getFullYear()}-${String(
    now.getMonth() + 1
  ).padStart(2, "0")}`;
  const filterMonthEl = document.getElementById("filter_month");
  const reportMonthEl = document.getElementById("report_month");
  if (filterMonthEl && !filterMonthEl.value) filterMonthEl.value = defaultMonth;
  if (reportMonthEl && !reportMonthEl.value) reportMonthEl.value = defaultMonth;
  const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(
    2,
    "0"
  )}-${String(now.getDate()).padStart(2, "0")}`;
  const incDateEl = document.getElementById("inc_date");
  if (incDateEl && !incDateEl.value) incDateEl.value = todayStr;
  const expDateEl = document.getElementById("exp_date");
  if (expDateEl && !expDateEl.value) expDateEl.value = todayStr;

  // Fecha actual visible en el dashboard
  const dateEl = document.getElementById("currentDatePill");
  if (dateEl) {
    const fmt = new Intl.DateTimeFormat("es-CO", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    }).format(now);
    const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1);
    dateEl.textContent = `📅 ${cap(fmt)}`;
    dateEl.title = cap(fmt);
  }

  // Mostrar campos "otro" cuando se elige la opción
  // Muestra/oculta input extra cuando el usuario elige "otro"
  const setupOtherToggle = (selectId, otherId) => {
    const sel = document.getElementById(selectId);
    const other = document.getElementById(otherId);
    if (!sel || !other) return;
    const refresh = () => {
      const isOther = String(sel.value || "").toLowerCase() === "otro";
      other.style.display = isOther ? "block" : "none";
      other.required = isOther;
      if (!isOther) other.value = "";
    };
    sel.addEventListener("change", refresh);
    refresh();
  };
  setupOtherToggle("inc_type", "inc_type_other");
  setupOtherToggle("inc_category", "inc_category_other");
  setupOtherToggle("exp_type", "exp_type_other");
  setupOtherToggle("exp_category", "exp_category_other");

  // Cargar preferencias del gauge (modo y pro-rata)
  const modeSel = document.getElementById("budget_mode");
  const prChk = document.getElementById("budget_prorata");
  if (modeSel) modeSel.value = localStorage.getItem("budget_mode") || "fixed";
  if (prChk) prChk.checked = localStorage.getItem("budget_prorata") === "true";
  const applyGauge = document.getElementById("applyGauge");
  if (applyGauge) {
    applyGauge.addEventListener("click", async () => {
      if (modeSel) localStorage.setItem("budget_mode", modeSel.value);
      if (prChk) localStorage.setItem("budget_prorata", String(prChk.checked));
      // Re-render gauge immediately without refetching
      renderGauge(lastTotalExpense);
    });
  }
  try {
    await loadAll();
  } catch (err) {
    showError("🚨 No pude cargar tus datos.", 10000);
  }
  await loadFinProfile();
  // Ocultar preloader cuando el dashboard inicial esté listo
  const hidePreloader = () => {
    const pl = document.getElementById('preloader');
    if (pl) pl.style.display = 'none';
  };
  hidePreloader();

  // (CTAs en tips de IA deshabilitados: solo mostrar consejos)
});

// Failsafe: si algo bloquea, oculta preloader después de un tiempo
setTimeout(() => {
  const pl = document.getElementById('preloader');
  if (pl) pl.style.display = 'none';
}, 12000);

function scoreNewsItem(item, pf) {
  let s = 0;
  const tags = (item.tags || []).join(' ');
  const has = (t) => tags.includes(t);
  const pref = Number(pf?.tips_preference || 0);
  if (pref === 1 && (has('ahorro') || has('presupuesto'))) s += 3;
  if (pref === 2 && has('inversion')) s += 3;
  if (pref === 3 && has('impuestos')) s += 3;
  if (pref === 4 && has('educacion')) s += 2;
  if (pf?.has_debt && has('deudas')) s += 2;
  if (Number(pf?.goal) === 2 && has('vivienda')) s += 2; // comprar vivienda
  const rt = Number(pf?.risk_tolerance || 0);
  if (rt === 1 && tags.includes('riesgo-bajo')) s += 1;
  if (rt === 3 && tags.includes('riesgo-alto')) s += 1;
  // Macro e impuestos siempre aportan algo
  if (has('macro') || has('impuestos')) s += 1;
  return s;
}

function renderNews(force = false) {
  const list = document.getElementById('newsList');
  if (!list) return;
  if (force) newsRefreshCounter++;
  const pf = finProfileCache || {};
  const scored = NEWS_DATA.map(n => ({ n, s: scoreNewsItem(n, pf) }))
    .sort((a,b) => b.s - a.s)
    .slice(0, 6)
    .map(({n}) => n);

  const pickEmoji = (tags=[]) => {
    const t = tags.join(' ');
    if (t.includes('impuestos')) return '🧾';
    if (t.includes('ahorro') || t.includes('presupuesto')) return '💰';
    if (t.includes('inversion')) return '📈';
    if (t.includes('deudas')) return '💳';
    if (t.includes('vivienda')) return '🏠';
    if (t.includes('macro')) return '📊';
    return '📰';
  };

  const pickThumb = (tags=[]) => {
    const t = tags.join(' ');
    const u = (id) => `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=320&h=200&q=60&v=${newsRefreshCounter}`;
    let url = '';
    if (t.includes('impuestos')) url = u('1554224155-1696413565d3');
    else if (t.includes('ahorro') || t.includes('presupuesto')) url = u('1604881991674-3b34e50f55d0');
    else if (t.includes('inversion')) url = u('1553729784-e91953dec042');
    else if (t.includes('deudas')) url = u('1518458028785-8fbcd101ebb9');
    else if (t.includes('vivienda')) url = u('1501183638710-841dd1904471');
    else if (t.includes('seguridad')) url = u('1510511233900-2051a1a8ec8b');
    else if (t.includes('educacion')) url = u('1584697964154-d7f72f38ced4');
    else url = u('1462331940025-496dfbfc7564');
    const seed = encodeURIComponent(`${(tags[0] || 'finanzas').toString()}-${newsRefreshCounter}`);
    const picsum = `https://picsum.photos/seed/${seed}/320/200`;
    const placeholder = `https://placehold.co/320x200/0f2d27/7db9ff?text=${seed}`;
    return { url, picsum, placeholder };
  };

  list.innerHTML = scored.length ? scored.map(n => {
    const emoji = pickEmoji(n.tags || []);
    const title = `${emoji} ${n.title}`;
    const badges = (n.tags||[]).slice(0,3).map(t=>`<span class="news-badge">${t}</span>`).join(' ');
    const { url, picsum, placeholder } = pickThumb(n.tags || []);
    return `
      <li>
        <div class="news-thumb"><img src="${url}" alt="${emoji} portada" data-fallback1="${picsum}" data-fallback2="${placeholder}"></div>
        <div class="news-body">
          <div class="news-meta">${badges}</div>
          <a class="news-title" href="${n.url}" target="_blank" rel="noopener noreferrer">${title}</a>
          <div class="summary">${n.summary}</div>
        </div>
      </li>
    `;
  }).join('') : '<li>No hay noticias para mostrar.</li>';

  // Fallback en cadena para imágenes de noticias
  list.querySelectorAll('img[data-fallback1]').forEach((img) => {
    let step = 0;
    const f1 = img.getAttribute('data-fallback1');
    const f2 = img.getAttribute('data-fallback2');
    img.addEventListener('error', function onerr() {
      if (step === 0) { step = 1; img.src = f1; return; }
      if (step === 1) { step = 2; img.src = f2; img.removeEventListener('error', onerr); }
    });
  });

  // Actualizar sello de hora
  const upd = document.getElementById('newsUpdatedAt');
  if (upd) {
    const now = new Date();
    upd.textContent = `Actualizado: ${now.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' })}`;
  }
}

document.addEventListener('click', (e) => {
  if (e.target && e.target.id === 'refreshNews') {
    const btn = e.target;
    const old = btn.textContent;
    btn.textContent = 'Actualizando…';
    btn.disabled = true;
    setTimeout(() => {
      renderNews(true);
      btn.textContent = old;
      btn.disabled = false;
    }, 150);
  }
  const tbtn = e.target.closest && e.target.closest('#toggleNewsBtn');
  if (tbtn) {
    const content = document.getElementById('newsContent');
    if (!content) return;
    const isHidden = content.style.display === 'none';
    content.style.display = isHidden ? 'block' : 'none';
    const label = tbtn.querySelector('.label');
    if (label) label.textContent = isHidden ? 'Ocultar' : 'Mostrar';
    tbtn.setAttribute('aria-expanded', String(isHidden));
  }
});

// Toggle del Perfil financiero (coherente y estético)
// Modales informativos: abre cualquier modal indicado en data-modal y permite cerrar por backdrop/botón
// Toggle del Perfil financiero (coherente y estético)
document.addEventListener("click", (e) => {
  const btn = e.target.closest && e.target.closest('#toggleFinProfileBtn');
  if (btn) {
    const content = document.getElementById("finProfileContent");
    if (!content) return;
    const isHidden = content.style.display === "none";
    content.style.display = isHidden ? "block" : "none";
    const label = btn.querySelector('.label');
    if (label) label.textContent = isHidden ? 'Ocultar' : 'Mostrar';
    btn.setAttribute("aria-expanded", String(isHidden));
  }
});

// Toggle de Todos los movimientos (usar mismo patrón estético)
// Toggle de "Todos los movimientos" (mismo patrón)
document.addEventListener("click", (e) => {
  const btn = e.target.closest && e.target.closest('#toggleAllMoves');
  if (btn) {
    const content = document.getElementById("allMovesContent");
    if (!content) return;
    const isHidden = content.style.display === "none";
    content.style.display = isHidden ? "block" : "none";
    const label = btn.querySelector('.label');
    if (label) label.textContent = isHidden ? 'Ocultar' : 'Mostrar';
    btn.setAttribute("aria-expanded", String(isHidden));
  }
});

// (toggle duplicado eliminado)

// (handler de tabs/paginación duplicado eliminado; se usa el de abajo con filtros por categoría)

document.addEventListener("input", (e) => {
  if (e.target && e.target.id === "incomesSearch") {
    incomesSearchQuery = e.target.value || "";
    incomesPage = 1;
    renderFullLists();
  }
  if (e.target && e.target.id === "expensesSearch") {
    expensesSearchQuery = e.target.value || "";
    expensesPage = 1;
    renderFullLists();
  }
});

// Cambios en selects de categoría
document.addEventListener("change", (e) => {
  if (e.target && e.target.id === "incomesCategoryFilter") {
    incomesCategoryFilter = e.target.value || "";
    incomesPage = 1;
    renderFullLists();
  }
  if (e.target && e.target.id === "expensesCategoryFilter") {
    expensesCategoryFilter = e.target.value || "";
    expensesPage = 1;
    renderFullLists();
  }
});

// Tabs y paginación en "Todos los movimientos"
document.addEventListener("click", (e) => {
  const tabBtn = e.target.closest(".tab[data-tab]");
  if (tabBtn) {
    document.querySelectorAll(".tab").forEach((b) => b.classList.remove("active"));
    tabBtn.classList.add("active");
    const id = tabBtn.getAttribute("data-tab");
    document.querySelectorAll(".tab-panel").forEach((p) => (p.style.display = "none"));
    const panel = document.getElementById(id);
    if (panel) panel.style.display = "block";
  }
  const pager = e.target.closest("button[data-pager][data-action]");
  if (pager) {
    const which = pager.getAttribute("data-pager");
    const action = pager.getAttribute("data-action");
    if (which === "incomes") {
      const max = Math.max(
        1,
        Math.ceil(
          paginateAndFilter(
            incomeList,
            incomesSearchQuery,
            incomesCategoryFilter
          ).length / PAGE_SIZE
        )
      );
      if (action === "prev" && incomesPage > 1) incomesPage--;
      if (action === "next" && incomesPage < max) incomesPage++;
    }
    if (which === "expenses") {
      const max = Math.max(
        1,
        Math.ceil(
          paginateAndFilter(
            expenseList,
            expensesSearchQuery,
            expensesCategoryFilter
          ).length / PAGE_SIZE
        )
      );
      if (action === "prev" && expensesPage > 1) expensesPage--;
      if (action === "next" && expensesPage < max) expensesPage++;
    }
    renderFullLists();
  }
});

// Toggle mostrar/ocultar "Todos los movimientos"
document.addEventListener("click", (e) => {
  if (e.target && e.target.id === "toggleAllMoves") {
    const content = document.getElementById("allMovesContent");
    const btn = e.target;
    if (!content) return;
    const isHidden = content.style.display === "none";
    content.style.display = isHidden ? "block" : "none";
    btn.textContent = isHidden ? "Ocultar" : "Mostrar";
    btn.setAttribute("aria-expanded", String(isHidden));
  }
});

// Modales informativos (genéricos: abre cualquier id en data-modal)
document.addEventListener("click", (e) => {
  const btnInfo = e.target.closest(".info-btn[data-modal]");
  if (btnInfo) {
    const id = btnInfo.getAttribute("data-modal");
    const m = id && document.getElementById(id);
    if (m) {
      m.classList.add("open");
      m.setAttribute("aria-hidden", "false");
      // foco accesible
      const focusable = m.querySelector(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      if (focusable) focusable.focus();
    }
  }
  const closeBtn = e.target.closest("[data-close]");
  const backdrop = e.target.classList?.contains("modal-backdrop")
    ? e.target
    : null;
  if (closeBtn || backdrop) {
    const modal = e.target.closest(".modal") || backdrop?.parentElement;
    if (modal) {
      modal.classList.remove("open");
      modal.setAttribute("aria-hidden", "true");
    }
  }
  if (e.target.matches("#openTaxFromModal")) {
    location.href = "tax.html";
  }
  // Abrir modal de edición
  const editBtn = e.target.closest("button[data-edit][data-id][data-kind]");
  if (editBtn) {
    const id = editBtn.getAttribute("data-id");
    const kind = editBtn.getAttribute("data-kind");
    if (!id || !kind) return;
    const typeText = editBtn.getAttribute("data-type") || "";
    const category = editBtn.getAttribute("data-category") || "";
    const amount = Number(editBtn.getAttribute("data-amount") || 0) || 0;
    const m = document.getElementById("modal-edit-move");
    if (m) {
      m.classList.add("open");
      m.setAttribute("aria-hidden", "false");
      document.getElementById("edit_id").value = id;
      document.getElementById("edit_kind").value = kind;
      document.getElementById("edit_type").value = typeText || (kind === "income" ? "salario" : "fijo");
      document.getElementById("edit_amount").value = String(amount);
      document.getElementById("edit_category").value = category;
      const first = m.querySelector("#edit_type");
      if (first) first.focus();
    }
  }
  // Eliminar movimiento
  const delBtn = e.target.closest("button[data-del][data-id][data-kind]");
  if (delBtn) {
    const id = delBtn.getAttribute("data-id");
    const kind = delBtn.getAttribute("data-kind");
    if (!id || !kind) return;
    const ok = confirm(
      `¿Eliminar definitivamente este ${kind === "income" ? "ingreso" : "gasto"}?`
    );
    if (!ok) return;
    (async () => {
      try {
        if (kind === "income") await api.deleteIncome(id);
        else await api.deleteExpense(id);
        showSuccess("Movimiento eliminado");
        await loadAll(currentFilter);
      } catch (err) {
        showApiError(err, "Error al eliminar");
      }
    })();
  }
});

// Cerrar modales con tecla Escape
// Accesibilidad: cerrar modales con tecla Escape
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") {
    document.querySelectorAll(".modal.open").forEach((m) => {
      m.classList.remove("open");
      m.setAttribute("aria-hidden", "true");
    });
  }
});

// Guardar cambios desde el modal de edición
document.addEventListener("submit", (e) => {
  const form = e.target.closest("#editMoveForm");
  if (!form) return;
  e.preventDefault();
  const id = document.getElementById("edit_id").value;
  const kind = document.getElementById("edit_kind").value;
  const type = document.getElementById("edit_type").value.trim();
  const amount = Number(document.getElementById("edit_amount").value);
  const category = document.getElementById("edit_category").value.trim();
  if (!id || !kind || !type || !category || !Number.isFinite(amount)) return;
  (async () => {
    try {
      if (kind === "income") await api.updateIncome(id, { type, amount, category });
      else await api.updateExpense(id, { type, amount, category });
      showSuccess("Cambios guardados");
      // cerrar modal
      const m = document.getElementById("modal-edit-move");
      if (m) {
        m.classList.remove("open");
        m.setAttribute("aria-hidden", "true");
      }
      await loadAll(currentFilter);
    } catch (err) {
      showApiError(err, "Error al actualizar");
    }
  })();
});

// Abrir Perfil desde gauge vacío
document.addEventListener("click", (e) => {
  if (
    e.target &&
    (e.target.id === "openProfileFromGauge" ||
      e.target.id === "openProfileFromModal")
  ) {
    const card = document.getElementById("finProfileCard");
    const content = document.getElementById("finProfileContent");
    const toggle = document.getElementById("toggleFinProfileBtn");
    if (content) content.style.display = "block";
    if (toggle) {
      toggle.textContent = "Ocultar";
      toggle.setAttribute("aria-expanded", "true");
    }
    if (card) card.scrollIntoView({ behavior: "smooth", block: "start" });
  }
});
