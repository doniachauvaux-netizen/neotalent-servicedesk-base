import { test } from "node:test";
import assert from "node:assert/strict";
import {
  countByPriority,
  countByCategory,
  loadByZone,
  reviewProgress,
  triageHealth,
} from "./stats.js";

const ticket = (props) => ({
  prioridad: "Media",
  categoria: "Alarmas",
  zona: "Recepción Principal",
  revisado: false,
  ...props,
});

test("countByPriority cuenta cada prioridad y agrupa las nulas en 'Sin definir'", () => {
  const conteo = countByPriority([
    ticket({ prioridad: "Crítica" }),
    ticket({ prioridad: "Crítica" }),
    ticket({ prioridad: "Baja" }),
    ticket({ prioridad: null }),
  ]);

  assert.equal(conteo["Crítica"], 2);
  assert.equal(conteo["Baja"], 1);
  assert.equal(conteo["Alta"], 0);
  assert.equal(conteo["Sin definir"], 1);
});

test("countByPriority omite 'Sin definir' cuando todas las prioridades están asignadas", () => {
  const conteo = countByPriority([ticket({ prioridad: "Alta" })]);
  assert.ok(!("Sin definir" in conteo));
});

test("countByCategory cuenta las seis categorías incluida 'Sin clasificar'", () => {
  const conteo = countByCategory([
    ticket({ categoria: "Accesos" }),
    ticket({ categoria: "Sin clasificar" }),
  ]);

  assert.equal(conteo["Accesos"], 1);
  assert.equal(conteo["Sin clasificar"], 1);
  assert.equal(conteo["Guardias"], 0);
});

test("loadByZone agrupa por zona y ordena de más a menos carga", () => {
  const zonas = loadByZone([
    ticket({ zona: "Muelle de carga" }),
    ticket({ zona: "Sala de servidores", prioridad: "Crítica" }),
    ticket({ zona: "Sala de servidores", prioridad: "Crítica" }),
    ticket({ zona: "Sala de servidores" }),
  ]);

  assert.deepEqual(zonas[0], { zona: "Sala de servidores", total: 3, criticos: 2 });
  assert.deepEqual(zonas[1], { zona: "Muelle de carga", total: 1, criticos: 0 });
});

test("reviewProgress calcula revisados, pendientes y porcentaje redondeado", () => {
  const progreso = reviewProgress([
    ticket({ revisado: true }),
    ticket({ revisado: false }),
    ticket({ revisado: false }),
  ]);

  assert.deepEqual(progreso, { total: 3, revisados: 1, pendientes: 2, porcentaje: 33 });
});

test("reviewProgress no divide entre cero con la bandeja vacía", () => {
  assert.deepEqual(reviewProgress([]), { total: 0, revisados: 0, pendientes: 0, porcentaje: 0 });
});

test("triageHealth da 100 a una bandeja sin riesgo pendiente aunque nada esté revisado", () => {
  const salud = triageHealth([ticket({ prioridad: "Baja" }), ticket({ prioridad: "Media" })]);
  assert.equal(salud.score, 100);
  assert.equal(salud.etiqueta, "Sin riesgo pendiente");
});

test("triageHealth mide los críticos pendientes sobre el total de críticos, no sobre la bandeja", () => {
  // 2 de 4 críticos revisados = la mitad del peso de críticos (50) → 100 - 25.
  const salud = triageHealth([
    ticket({ prioridad: "Crítica", revisado: true }),
    ticket({ prioridad: "Crítica", revisado: true }),
    ticket({ prioridad: "Crítica" }),
    ticket({ prioridad: "Crítica" }),
  ]);
  assert.equal(salud.score, 75);
});

test("triageHealth penaliza los sin clasificar en proporción al total de la bandeja", () => {
  const base = Array.from({ length: 9 }, () => ticket({ prioridad: "Baja" }));
  const salud = triageHealth([...base, ticket({ categoria: "Sin clasificar" })]);
  assert.equal(salud.score, 98); // 1 de 10 × peso 20 = 2 puntos
});

test("triageHealth deja de penalizar un crítico una vez revisado", () => {
  const revisado = triageHealth([ticket({ prioridad: "Crítica", revisado: true })]);
  assert.equal(revisado.score, 100);
});

test("triageHealth llega a 30 con todos los críticos y todo sin clasificar pendientes", () => {
  const peor = Array.from({ length: 5 }, () =>
    ticket({ prioridad: "Crítica", categoria: "Sin clasificar" })
  );
  assert.equal(triageHealth(peor).score, 30);
});

test("triageHealth usa singular en la etiqueta con un único crítico pendiente", () => {
  const salud = triageHealth([ticket({ prioridad: "Crítica" }), ticket({ prioridad: "Baja" })]);
  assert.equal(salud.etiqueta, "1 crítico sin revisar");
});

test("triageHealth devuelve 100 y 'Bandeja vacía' sin tickets", () => {
  assert.deepEqual(triageHealth([]), { score: 100, etiqueta: "Bandeja vacía" });
});
