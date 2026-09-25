// Agregados para los paneles del dashboard. Funciones puras: reciben tickets
// enriquecidos y devuelven datos, nunca tocan el DOM (constitution.md, principio 3).

const PRIORIDADES = ["Crítica", "Alta", "Media", "Baja"];
const CATEGORIAS = ["Accesos", "Identidades", "Alarmas", "Guardias", "Otros", "Sin clasificar"];

// Cuenta cuántos tickets hay de cada valor de `campo`, respetando el orden de `valores`.
// Los tickets sin valor (prioridad null) se agrupan bajo la clave "Sin definir".
function contarPor(tickets, campo, valores) {
  const conteo = Object.fromEntries(valores.map((v) => [v, 0]));
  let sinDefinir = 0;

  for (const ticket of tickets) {
    const valor = ticket[campo];
    if (valor && valor in conteo) conteo[valor] += 1;
    else sinDefinir += 1;
  }

  return sinDefinir > 0 ? { ...conteo, "Sin definir": sinDefinir } : conteo;
}

export function countByPriority(tickets) {
  return contarPor(tickets, "prioridad", PRIORIDADES);
}

export function countByCategory(tickets) {
  return contarPor(tickets, "categoria", CATEGORIAS);
}

// Carga por zona, ordenada de más a menos tickets, para el panel de mapa de calor.
export function loadByZone(tickets) {
  const conteo = new Map();

  for (const { zona, prioridad } of tickets) {
    const actual = conteo.get(zona) ?? { zona, total: 0, criticos: 0 };
    actual.total += 1;
    if (prioridad === "Crítica") actual.criticos += 1;
    conteo.set(zona, actual);
  }

  return [...conteo.values()].sort((a, b) => b.total - a.total || a.zona.localeCompare(b.zona));
}

// Avance de la revisión manual del operador: cuántos ha validado ya y qué porcentaje supone.
export function reviewProgress(tickets) {
  const total = tickets.length;
  const revisados = tickets.filter((t) => t.revisado).length;
  const porcentaje = total === 0 ? 0 : Math.round((revisados / total) * 100);
  return { total, revisados, pendientes: total - revisados, porcentaje };
}

// Cuánto pesa cada problema sobre los 100 puntos del score. Los críticos sin
// revisar son la mitad de la nota porque son el riesgo operativo real; lo que la
// heurística no supo clasificar resta menos: es trabajo, no peligro.
const PESO_CRITICOS = 50;
const PESO_SIN_CLASIFICAR = 20;

/**
 * Salud del triaje: un 0-100 que mide el riesgo pendiente de la bandeja, no el
 * trabajo hecho. Cada problema se mide contra su propio universo (los críticos
 * pendientes sobre el total de críticos, no sobre toda la bandeja) para que el
 * indicador recorra el rango completo y no nazca saturado en rojo.
 *
 * @param {Array} tickets - tickets enriquecidos: { prioridad, categoria, revisado, ... }
 * @returns {{ score: number, etiqueta: string }} score entero 0-100 y la razón dominante
 */
export function triageHealth(tickets) {
  if (tickets.length === 0) return { score: 100, etiqueta: "Bandeja vacía" };

  const sinClasificar = tickets.filter((t) => t.categoria === "Sin clasificar").length;
  const criticos = tickets.filter((t) => t.prioridad === "Crítica").length;
  const criticosPendientes = tickets.filter((t) => t.prioridad === "Crítica" && !t.revisado).length;

  const penalizacion =
    (criticos === 0 ? 0 : (criticosPendientes / criticos) * PESO_CRITICOS) +
    (sinClasificar / tickets.length) * PESO_SIN_CLASIFICAR;
  const score = Math.max(0, Math.round(100 - penalizacion));

  if (criticosPendientes > 0) {
    return {
      score,
      etiqueta: `${criticosPendientes} ${criticosPendientes === 1 ? "crítico sin revisar" : "críticos sin revisar"}`,
    };
  }
  if (sinClasificar > 0) {
    return { score, etiqueta: `${sinClasificar} sin clasificar` };
  }
  return { score, etiqueta: "Sin riesgo pendiente" };
}
