import { test } from "node:test";
import assert from "node:assert/strict";
import { classifyCategory } from "./classify.js";

test("clasifica Accesos por palabras clave de control de accesos", () => {
  const r = classifyCategory({
    titulo: "Lector de tarjetas sin respuesta en Perímetro exterior",
    descripcion: "El lector de tarjetas no reconoce ninguna credencial desde esta mañana.",
  });
  assert.equal(r.categoria, "Accesos");
  assert.ok(r.motivo.length > 0);
});

test("clasifica Identidades por palabras clave de perfiles/credenciales de persona", () => {
  const r = classifyCategory({
    titulo: "Guardia nuevo sin perfil de acceso en Torre de control",
    descripcion: "Un guardia nuevo no tiene todavía asignado el perfil de acceso en SailPoint.",
  });
  assert.equal(r.categoria, "Identidades");
});

test("clasifica Alarmas por palabras clave de alarma/sensor", () => {
  const r = classifyCategory({
    titulo: "Alarma perimetral desactivada tras mantenimiento",
    descripcion: "La alarma perimetral se ha desactivado sola tras el último mantenimiento.",
  });
  assert.equal(r.categoria, "Alarmas");
});

test("clasifica Guardias por palabras clave de turno/ronda/fichaje", () => {
  const r = classifyCategory({
    titulo: "Cuadrante de Almacén Norte sin sincronizar",
    descripcion: "Falta sincronizar el turno con el nuevo cuadrante — dos guardias sin asignar.",
  });
  assert.equal(r.categoria, "Guardias");
});

test("clasifica Otros cuando hay señal reconocible pero fuera de las 4 categorías de dominio", () => {
  const r = classifyCategory({
    titulo: "Corte de grabación repetido en cámara 3",
    descripcion: "La grabación de la cámara 3 se corta cada noche sobre la misma hora.",
  });
  assert.equal(r.categoria, "Otros");
});

test("devuelve Sin clasificar cuando no hay coincidencia de palabras clave", () => {
  const r = classifyCategory({
    titulo: "Ticket entrante sin palabras clave reconocibles",
    descripcion: "Incidencia sin descripción útil.",
  });
  assert.equal(r.categoria, "Sin clasificar");
  assert.ok(r.motivo.length > 0);
});

test("trata campos ausentes como texto vacío y no lanza excepción", () => {
  const r = classifyCategory({});
  assert.equal(r.categoria, "Sin clasificar");
});
