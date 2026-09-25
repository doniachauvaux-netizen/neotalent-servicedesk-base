import { test } from "node:test";
import assert from "node:assert/strict";
import { acceptSuggestion, correctTicket } from "./reviewTicket.js";

const base = {
  id: "X-1",
  categoria: "Alarmas",
  motivoCategoria: "Palabra clave detectada.",
  prioridad: "Crítica",
  motivoPrioridad: "Evento activo ahora en zona crítica.",
  revisado: false,
};

test("acceptSuggestion marca revisado:true sin tocar categoría ni prioridad", () => {
  const r = acceptSuggestion(base);
  assert.equal(r.revisado, true);
  assert.equal(r.categoria, "Alarmas");
  assert.equal(r.prioridad, "Crítica");
});

test("acceptSuggestion no muta el ticket original", () => {
  const copia = { ...base };
  acceptSuggestion(base);
  assert.deepEqual(base, copia);
});

test("correctTicket sobreescribe categoría y prioridad y fija el motivo de corrección manual", () => {
  const r = correctTicket(base, { categoria: "Identidades", prioridad: "Media" });
  assert.equal(r.categoria, "Identidades");
  assert.equal(r.prioridad, "Media");
  assert.equal(r.revisado, true);
  assert.equal(r.motivoCategoria, "Corregido manualmente por el operador.");
  assert.equal(r.motivoPrioridad, "Corregido manualmente por el operador.");
});

test("correctTicket admite corregir a Sin clasificar dejando prioridad null", () => {
  const r = correctTicket(base, { categoria: "Sin clasificar", prioridad: null });
  assert.equal(r.categoria, "Sin clasificar");
  assert.equal(r.prioridad, null);
  assert.equal(r.revisado, true);
});

test("correctTicket no muta el ticket original", () => {
  const copia = { ...base };
  correctTicket(base, { categoria: "Otros", prioridad: "Baja" });
  assert.deepEqual(base, copia);
});
