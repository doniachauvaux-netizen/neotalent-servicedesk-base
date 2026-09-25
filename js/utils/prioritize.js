// Prioridad de tickets por cruce de urgencia e impacto (matriz 2x2, docs/spec.md).
// No importa ni referencia el DOM (constitution.md, principio 3).

const ZONAS_CRITICAS = [
  "Perímetro exterior",
  "Sala de servidores",
  "Torre de control",
  "Acceso peatonal Este",
  "Muelle de carga",
];

const ZONAS_NO_CRITICAS = [
  "Oficinas centrales",
  "Vestuarios de personal",
  "Recepción Principal",
  "Almacén Norte",
  "Aparcamiento -1",
  "Edificio B, planta 3",
  "Nave logística 2",
];

// Catálogo completo para poblar el selector de zona del alta manual de tickets
// (docs/spec.md, "Alta manual de tickets desde la bandeja"): así nunca se puede
// introducir una zona fuera de este mapeo.
export const ZONAS_CONOCIDAS = [...ZONAS_CRITICAS, ...ZONAS_NO_CRITICAS];

export function mapZoneToImpact(zona) {
  if (ZONAS_CRITICAS.includes(zona)) return "critica";
  if (ZONAS_NO_CRITICAS.includes(zona)) return "no_critica";
  return null;
}

// Señales léxicas de "algo sigue pasando ahora" frente a "hecho cerrado o solicitud".
const KEYWORDS_ACTIVO = [
  "se ha desactivado",
  "no reconoce",
  "sigue activa",
  "abierta sin alarma",
  "salta sola",
  "sin causa aparente",
  "no llega",
  "sin grabar",
  "no registra",
  "tarda más de",
];

const KEYWORDS_HISTORICO = ["solicita", "detectado", "caduca en"];

export function inferUrgency(ticket) {
  const texto = `${ticket?.titulo ?? ""} ${ticket?.descripcion ?? ""}`.toLowerCase();

  if (ticket?.estado === "cerrado") return "historico";
  if (KEYWORDS_HISTORICO.some((kw) => texto.includes(kw))) return "historico";
  if (KEYWORDS_ACTIVO.some((kw) => texto.includes(kw))) return "activo";
  return "historico";
}

const MATRIZ_PRIORIDAD = {
  activo: { critica: "Crítica", no_critica: "Alta" },
  historico: { critica: "Media", no_critica: "Baja" },
};

export function classifyPriority(urgencia, impacto, categoria) {
  if (categoria === "Sin clasificar") {
    return { prioridad: null, motivo: 'Sin prioridad: el ticket quedó como "Sin clasificar".' };
  }
  if (impacto !== "critica" && impacto !== "no_critica") {
    return { prioridad: null, motivo: "Sin prioridad: la zona del ticket no es reconocida." };
  }

  const prioridad = MATRIZ_PRIORIDAD[urgencia][impacto];
  const urgenciaTexto = urgencia === "activo" ? "evento activo ahora" : "reporte histórico o no activo";
  const impactoTexto = impacto === "critica" ? "zona crítica" : "zona no crítica";
  return { prioridad, motivo: `${urgenciaTexto} en ${impactoTexto}.` };
}
