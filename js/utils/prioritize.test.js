import { test } from "node:test";
import assert from "node:assert/strict";
import { mapZoneToImpact, inferUrgency, classifyPriority } from "./prioritize.js";

test("mapZoneToImpact reconoce zonas críticas de la tabla de spec.md", () => {
  assert.equal(mapZoneToImpact("Perímetro exterior"), "critica");
  assert.equal(mapZoneToImpact("Sala de servidores"), "critica");
  assert.equal(mapZoneToImpact("Torre de control"), "critica");
  assert.equal(mapZoneToImpact("Acceso peatonal Este"), "critica");
  assert.equal(mapZoneToImpact("Muelle de carga"), "critica");
});

test("mapZoneToImpact reconoce zonas no críticas de la tabla de spec.md", () => {
  assert.equal(mapZoneToImpact("Oficinas centrales"), "no_critica");
  assert.equal(mapZoneToImpact("Vestuarios de personal"), "no_critica");
  assert.equal(mapZoneToImpact("Recepción Principal"), "no_critica");
});

test("mapZoneToImpact devuelve null para una zona no reconocida", () => {
  assert.equal(mapZoneToImpact("Zona inventada"), null);
  assert.equal(mapZoneToImpact(undefined), null);
});

test("inferUrgency detecta evento activo ahora por verbos de estado en curso", () => {
  const activo = inferUrgency({
    titulo: "Alarma perimetral desactivada tras mantenimiento",
    descripcion: "La alarma perimetral se ha desactivado sola tras el último mantenimiento.",
    estado: "abierto",
  });
  assert.equal(activo, "activo");
});

test("inferUrgency detecta reporte histórico por verbos de petición/hecho cerrado", () => {
  const historico = inferUrgency({
    titulo: "Solicitud de histórico de accesos en Perímetro exterior",
    descripcion: "Un cliente solicita el histórico de accesos del último mes para una auditoría.",
    estado: "abierto",
  });
  assert.equal(historico, "historico");
});

test("inferUrgency trata estado cerrado como señal adicional de histórico", () => {
  const r = inferUrgency({
    titulo: "Doble fichaje detectado en Oficinas centrales",
    descripcion: "Doble fichaje del mismo guardia en dos puestos a la misma hora.",
    estado: "cerrado",
  });
  assert.equal(r, "historico");
});

test("inferUrgency no fuerza activo solo porque estado sea abierto sin señal léxica", () => {
  const r = inferUrgency({
    titulo: "Acceso temporal de proveedor a Sala de servidores",
    descripcion: "Petición de acceso temporal para un proveedor externo, caduca en 19 días.",
    estado: "abierto",
  });
  assert.equal(r, "historico");
});

test("classifyPriority cruza urgencia e impacto según la matriz 2x2 de spec.md", () => {
  assert.equal(classifyPriority("activo", "critica").prioridad, "Crítica");
  assert.equal(classifyPriority("activo", "no_critica").prioridad, "Alta");
  assert.equal(classifyPriority("historico", "critica").prioridad, "Media");
  assert.equal(classifyPriority("historico", "no_critica").prioridad, "Baja");
});

test("classifyPriority devuelve motivo trazable a la combinación usada", () => {
  const r = classifyPriority("activo", "critica");
  assert.match(r.motivo, /activo/i);
  assert.match(r.motivo, /cr[ií]tica/i);
});

test("classifyPriority devuelve prioridad null si la categoría es Sin clasificar", () => {
  const r = classifyPriority("activo", "critica", "Sin clasificar");
  assert.equal(r.prioridad, null);
  assert.match(r.motivo, /sin clasificar/i);
});

test("classifyPriority devuelve prioridad null si el impacto no se pudo determinar", () => {
  const r = classifyPriority("activo", null, "Alarmas");
  assert.equal(r.prioridad, null);
});
