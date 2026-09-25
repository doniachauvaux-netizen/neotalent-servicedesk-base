# Tareas de implementación — Mini Service Desk

Troceado en pasos de ~20-30 min, en orden de dependencia. Cada tarea cita el requisito de
`docs/spec.md` que cubre. Sigue TDD (constitution.md, principio 4): test antes que código.

- [x] **Tarea 1 — Clasificación por categoría (heurística de palabras clave)**
  Cubre: *Requisito: Clasificación automática por categoría* + *Requisito: Categoría "sin
  clasificar" para casos ambiguos*.
  Módulo `js/utils/classify.js` (sin DOM, constitution.md principio 3): función
  `classifyCategory(ticket)` que devuelve `{ categoria, motivo }` a partir de palabras clave
  en `titulo` + `descripcion` sobre las 5 categorías (Accesos, Identidades, Alarmas, Guardias,
  Otros) y "Sin clasificar" si no hay coincidencia con motivo mostrable.
  Test: `js/utils/classify.test.js` cubriendo al menos un caso por categoría + un caso
  ambiguo → "Sin clasificar".

- [x] **Tarea 2 — Prioridad por urgencia/impacto (matriz 2×2)**
  Cubre: *Requisito: Priorización por urgencia e impacto* (incluida la resolución de
  "sin clasificar" → prioridad `null`).
  Añade a `js/utils/classify.js` (o módulo hermano `js/utils/prioritize.js`):
  `mapZoneToImpact(zona)` con la tabla fijada en spec.md, `inferUrgency(ticket)` con la
  heurística de palabras clave + `estado`, y `classifyPriority(ticket, categoria)` que cruza
  ambas dimensiones vía la matriz y devuelve `{ prioridad, motivo }` (o `{ prioridad: null,
  motivo }` si `categoria === 'Sin clasificar'`).
  Test: casos para las 4 combinaciones de la matriz + zona no reconocida + categoría
  "Sin clasificar" → `prioridad: null`.

- [x] **Tarea 3 — Carga y normalización de tickets**
  Cubre: *Requisito no funcional: Cobertura de clasificación*.
  `js/utils/loadTickets.js`: función pura `enrichTickets(tickets)` que aplica
  `classifyCategory` + `classifyPriority` a cada ticket del array y añade `revisado: false`
  a cada uno (ver Tarea 4). No toca el DOM ni hace fetch (eso vive en `app.js`).
  Test: con los 60 tickets de `data/tickets.json`, ningún ticket queda sin `categoria` ni
  sin la clave `prioridad` (puede ser `null`, nunca `undefined`).

- [x] **Tarea 4 — Estado de revisión y corrección manual (lógica pura)**
  Cubre: *Requisito: Confirmación o corrección manual de la sugerencia*.
  `js/utils/reviewTicket.js`: `acceptSuggestion(ticket)` → `{ ...ticket, revisado: true }`;
  `correctTicket(ticket, { categoria, prioridad })` → aplica la corrección manual (categoría
  puede ser cualquiera de las 6, incluida "Sin clasificar"; prioridad puede quedar `null`),
  marca `revisado: true` y fija `motivo: 'Corregido manualmente por el operador.'`.
  Test: aceptar deja `revisado:true` sin tocar categoría/prioridad; corregir sobreescribe
  ambos valores y el motivo; corregir a "Sin clasificar" deja `prioridad: null`.

- [x] **Tarea 5 — Bandeja: listado de tickets en `index.html`**
  Cubre: *Historia: ver bandeja con categoría/prioridad sugeridas* + parte visual del
  *Requisito: Confirmación o corrección manual* (distinguir revisado/pendiente).
  Sustituye el placeholder de `index.html`/`js/app.js`/`css/styles.css` por el listado real:
  cada fila con id, título, zona, categoría, badge de prioridad (o "Pendiente de definir" si
  `prioridad === null`) y estado revisado/pendiente, usando `enrichTickets` de la Tarea 3.
  Sin test unitario (es render DOM); verificación manual abriendo `index.html` en el navegador.

- [x] **Tarea 6 — Vista de detalle + motivo visible**
  Cubre: *Requisito: Motivo visible de la sugerencia*.
  Al hacer clic en una fila se muestra el detalle del ticket (descripción, zona, sistema,
  reportado por, fecha) más la categoría/prioridad sugeridas y el `motivo` de cada una.
  Verificación manual: abrir un ticket y comprobar que el motivo es visible sin acción extra.

- [x] **Tarea 7 — Pantalla de corrección + confirmación**
  Cubre: *Requisito: Confirmación o corrección manual de la sugerencia* (flujo completo de UI).
  Botones "Aceptar sugerencia" / "Corregir" en el detalle; la corrección abre un formulario
  con `<select>` de categoría (6 valores) y prioridad (4 valores), llama a
  `acceptSuggestion`/`correctTicket` de la Tarea 4 y vuelve a la bandeja con el ticket ya
  marcado como revisado.
  Verificación manual: aceptar un ticket y corregir otro, comprobar que la bandeja refleja
  el cambio tras volver.

- [x] **Tarea 8 — Verificación final de cobertura end-to-end**
  Cubre: *Criterios de finalización* de spec.md.
  Ejecutar todos los tests, cargar los 60 tickets en el navegador y confirmar visualmente que
  ninguno queda sin categoría/prioridad (incluyendo `null` para "Sin clasificar"), que el
  idioma de toda cadena visible es español (principio 6 de constitution.md) y que no queda
  ningún test en rojo.
