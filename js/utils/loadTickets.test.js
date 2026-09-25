import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { enrichTickets } from "./loadTickets.js";

test("enrichTickets añade categoria, prioridad y revisado a cada ticket", () => {
  const tickets = [
    {
      id: "X-1",
      titulo: "Alarma perimetral desactivada",
      descripcion: "La alarma perimetral se ha desactivado sola.",
      zona: "Perímetro exterior",
      estado: "abierto",
    },
  ];
  const [r] = enrichTickets(tickets);
  assert.equal(r.categoria, "Alarmas");
  assert.equal(r.prioridad, "Crítica");
  assert.equal(r.revisado, false);
  assert.ok(r.motivoCategoria);
  assert.ok(r.motivoPrioridad);
});

test("enrichTickets no muta el array ni los objetos originales", () => {
  const original = [{ id: "X-1", titulo: "a", descripcion: "b", zona: "Oficinas centrales" }];
  const copia = JSON.parse(JSON.stringify(original));
  enrichTickets(original);
  assert.deepEqual(original, copia);
});

test("enrichTickets: ningún ticket de data/tickets.json queda sin categoria ni sin la clave prioridad", () => {
  const raw = readFileSync(new URL("../../data/tickets.json", import.meta.url), "utf-8");
  const tickets = JSON.parse(raw);
  assert.equal(tickets.length, 60);

  const enriched = enrichTickets(tickets);
  for (const t of enriched) {
    assert.ok(typeof t.categoria === "string" && t.categoria.length > 0, `ticket ${t.id} sin categoria`);
    assert.ok("prioridad" in t, `ticket ${t.id} sin clave prioridad`);
    assert.notEqual(t.prioridad, undefined, `ticket ${t.id} con prioridad undefined`);
  }
});
