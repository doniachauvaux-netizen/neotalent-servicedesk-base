// Construcción de un ticket dado de alta manualmente por el operador desde la bandeja
// (docs/spec.md, "Alta manual de tickets desde la bandeja").
// No toca el DOM ni localStorage — eso vive en app.js (constitution.md, principio 3).

export function generateTicketId(existingIds) {
  const maxNum = existingIds.reduce((max, id) => {
    const num = Number(id.split("-")[1]);
    return Number.isFinite(num) && num > max ? num : max;
  }, 0);
  return `SVD-${maxNum + 1}`;
}

export function buildTicket({ titulo, descripcion, zona }, id, fecha) {
  return {
    id,
    titulo,
    descripcion,
    sistema_afectado: "",
    reportado_por: "",
    zona,
    fecha: fecha.toISOString().slice(0, 10),
    estado: "abierto",
  };
}
