// Confirmación o corrección manual del operador sobre un ticket ya clasificado.
// No toca el DOM (constitution.md, principio 3); recibe datos y devuelve datos.

export function acceptSuggestion(ticket) {
  return { ...ticket, revisado: true };
}

export function correctTicket(ticket, { categoria, prioridad }) {
  return {
    ...ticket,
    categoria,
    prioridad,
    motivoCategoria: "Corregido manualmente por el operador.",
    motivoPrioridad: "Corregido manualmente por el operador.",
    revisado: true,
  };
}
