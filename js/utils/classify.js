// Clasificación de tickets por categoría mediante heurística de palabras clave.
// No importa ni referencia el DOM (constitution.md, principio 3).

const KEYWORDS_BY_CATEGORY = {
  Accesos: ["lector", "tarjeta", "credencial", "puerta", "biométrico", "control de accesos"],
  Identidades: ["perfil de acceso", "sailpoint", "identidad", "tarjeta de baja", "dado de baja"],
  Alarmas: ["alarma", "sensor"],
  Guardias: ["guardia", "turno", "cuadrante", "ronda", "checkpoint", "fichaje"],
  Otros: ["cámara", "grabación", "interfono", "cctv", "centralita"],
};

export function classifyCategory(ticket) {
  const texto = `${ticket?.titulo ?? ""} ${ticket?.descripcion ?? ""}`.toLowerCase();

  for (const [categoria, keywords] of Object.entries(KEYWORDS_BY_CATEGORY)) {
    const encontrada = keywords.find((kw) => texto.includes(kw));
    if (encontrada) {
      return { categoria, motivo: `Palabra clave detectada: "${encontrada}".` };
    }
  }

  return { categoria: "Sin clasificar", motivo: "No hay confianza suficiente para asignar categoría." };
}
