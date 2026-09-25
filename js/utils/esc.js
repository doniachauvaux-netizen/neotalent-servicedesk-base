// Escapa texto antes de inyectarlo con innerHTML (constitution.md, principio 3: sin DOM).

export function esc(valor) {
  return String(valor ?? "").replace(
    /[&<>"']/g,
    (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]
  );
}
