function parseJwt(token) {
  try {
    return JSON.parse(atob(token.split(".")[1]));
  } catch {
    return {};
  }
}
export function getCurrentUserId() {
  const t = localStorage.getItem("token");
  if (!t) return null;
  const p = parseJwt(t);
  return p.userId || p.id || p.sub || null;
}
