/**
 * Formatea números a moneda COP (sin decimales).
 * @param {number} n
 * @returns {string}
 */
export const fmtCOP = (n) =>
  n?.toLocaleString("es-CO", {
    style: "currency",
    currency: "COP",
    maximumFractionDigits: 0,
  }) ?? "$0";
/**
 * Convierte una fecha a clave YYYY-MM (para agrupar por mes)
 * @param {string|Date} d
 * @returns {string}
 */
export const byMonthKey = (d) => {
  const dt = d ? new Date(d) : new Date();
  return `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, "0")}`;
};
/**
 * Agrupa y suma por clave
 * @template T
 * @param {T[]} arr
 * @param {(item:T)=>string} keyFn clave
 * @param {(item:T)=>number} valFn selector numérico
 * @returns {Map<string, number>}
 */
export const groupSumBy = (arr, keyFn, valFn) => {
  const m = new Map();
  for (const it of arr) {
    const k = keyFn(it);
    const v = Number(valFn(it) || 0);
    m.set(k, (m.get(k) || 0) + v);
  }
  return m;
};
/**
 * Suma segura de una colección
 * @template T
 * @param {T[]} arr
 * @param {(item:T)=>number} sel
 */
export const sum = (arr, sel = (x) => x) =>
  arr.reduce((a, c) => a + Number(sel(c) || 0), 0);
