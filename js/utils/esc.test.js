import { test } from "node:test";
import assert from "node:assert/strict";
import { esc } from "./esc.js";

test("escapa los 5 caracteres HTML-sensibles", () => {
  assert.equal(esc(`&<>"'`), "&amp;&lt;&gt;&quot;&#39;");
});

test("neutraliza una etiqueta script inyectada en un campo de ticket", () => {
  const resultado = esc('<script>alert(1)</script>');
  assert.ok(!resultado.includes("<script>"));
  assert.equal(resultado, "&lt;script&gt;alert(1)&lt;/script&gt;");
});

test("trata null y undefined como cadena vacía", () => {
  assert.equal(esc(null), "");
  assert.equal(esc(undefined), "");
});

test("no toca texto sin caracteres especiales", () => {
  assert.equal(esc("Perímetro exterior"), "Perímetro exterior");
});
