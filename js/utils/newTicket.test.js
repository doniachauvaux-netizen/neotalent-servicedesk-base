import { test } from "node:test";
import assert from "node:assert/strict";
import { generateTicketId, buildTicket } from "./newTicket.js";
import { enrichTickets } from "./loadTickets.js";

test("generateTicketId devuelve un id que no está en la lista de existentes", () => {
  const existentes = ["SVD-4100", "SVD-4101"];
  const id = generateTicketId(existentes);
  assert.equal(typeof id, "string");
  assert.ok(id.length > 0);
  assert.ok(!existentes.includes(id));
});

test("generateTicketId no repite id en dos altas seguidas", () => {
  const existentes = ["SVD-4100"];
  const primero = generateTicketId(existentes);
  const segundo = generateTicketId([...existentes, primero]);
  assert.notEqual(primero, segundo);
});

test("buildTicket construye un ticket con estado abierto y los campos del formulario", () => {
  const fecha = new Date("2026-09-24T10:00:00Z");
  const ticket = buildTicket(
    { titulo: "Puerta forzada", descripcion: "Se ha forzado la puerta trasera.", zona: "Almacén Norte" },
    "SVD-9000",
    fecha
  );
  assert.deepEqual(ticket, {
    id: "SVD-9000",
    titulo: "Puerta forzada",
    descripcion: "Se ha forzado la puerta trasera.",
    sistema_afectado: "",
    reportado_por: "",
    zona: "Almacén Norte",
    fecha: "2026-09-24",
    estado: "abierto",
  });
});

test("un ticket construido con buildTicket se clasifica con enrichTickets igual que uno cargado del JSON", () => {
  const fecha = new Date("2026-09-24T10:00:00Z");
  const ticket = buildTicket(
    { titulo: "Alarma perimetral desactivada", descripcion: "Sigue activa sin causa aparente.", zona: "Perímetro exterior" },
    "SVD-9001",
    fecha
  );
  const [enriquecido] = enrichTickets([ticket]);
  assert.equal(enriquecido.categoria, "Alarmas");
  assert.equal(enriquecido.prioridad, "Crítica");
  assert.equal(enriquecido.revisado, false);
});
