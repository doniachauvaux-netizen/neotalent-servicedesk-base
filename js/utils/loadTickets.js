// Normalización de tickets: aplica clasificación de categoría y prioridad a cada uno.
// No toca el DOM ni hace fetch (constitution.md, principio 3); eso vive en app.js.

import { classifyCategory } from "./classify.js";
import { mapZoneToImpact, inferUrgency, classifyPriority } from "./prioritize.js";

export function enrichTickets(tickets) {
  return tickets.map((ticket) => {
    const { categoria, motivo: motivoCategoria } = classifyCategory(ticket);
    const impacto = mapZoneToImpact(ticket.zona);
    const urgencia = inferUrgency(ticket);
    const { prioridad, motivo: motivoPrioridad } = classifyPriority(urgencia, impacto, categoria);

    return {
      ...ticket,
      categoria,
      motivoCategoria,
      prioridad,
      motivoPrioridad,
      revisado: false,
    };
  });
}
