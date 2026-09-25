# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Qué es este repo

Mini service desk de triaje de incidencias de seguridad física (~60 tickets sintéticos), con clasificación automática de categoría y prioridad hecha con una heurística de palabras clave en JavaScript vanilla — sin llamadas a IA en runtime, sin backend, sin build. Es la versión final (etiqueta `v2`) del proyecto hilo de una formación; el punto de partida sin código está en la etiqueta `v1`.

## Comandos

No hay `package.json` ni gestor de paquetes: nada que instalar.

- **Ejecutar todos los tests:** `node --test js/utils/*.test.js` (usa `node:test` nativo de Node, sin runner externo).
- **Ejecutar un único test file:** `node --test js/utils/classify.test.js`
- **Ejecutar la app:** abrir `index.html` directamente en el navegador (usa `fetch` sobre `data/tickets.json`, así que si el navegador bloquea `fetch` por `file://`, servir la carpeta con cualquier servidor estático, p. ej. `npx serve .`).

## Arquitectura

El principio rector (`docs/constitution.md`, principio 3) es la **separación estricta entre lógica y DOM**:

- `js/utils/` — módulos puros, sin `document`/DOM, sin estado. Reciben datos, devuelven datos. Cada uno tiene su `*.test.js` hermano.
  - `classify.js` → `classifyCategory(ticket)`: heurística de palabras clave sobre `titulo`+`descripcion` → `{ categoria, motivo }` (una de Accesos/Identidades/Alarmas/Guardias/Otros, o "Sin clasificar" si no hay motivo mostrable).
  - `prioritize.js` → cruza urgencia (heurística de palabras clave + campo `estado`) × impacto (`mapZoneToImpact(zona)`, tabla fija de zonas críticas/no críticas) en una matriz 2×2 para producir `{ prioridad, motivo }`. Un ticket "Sin clasificar" siempre produce `prioridad: null`.
  - `loadTickets.js` → `enrichTickets(tickets)`: aplica classify + prioritize a un array crudo y añade `revisado: false`. Función pura, no hace `fetch`.
  - `reviewTicket.js` → `acceptSuggestion(ticket)` / `correctTicket(ticket, { categoria, prioridad })`: transiciones de estado de revisión manual del operador. Corregir a "Sin clasificar" fuerza `prioridad: null`.
- `js/app.js` — única pieza que toca el DOM. Hace el `fetch` de `data/tickets.json`, llama a `enrichTickets`, y gestiona un router de 3 pantallas en memoria (`lista` / `detalle` / `corregir`) re-renderizando `innerHTML` sobre `#vista`. Nunca contiene lógica de clasificación.
- `data/tickets.json` — única fuente de datos, sin base de datos (constitution.md, principio 5).
- `docs/constitution.md` — principios innegociables del proyecto (stack, relación spec↔código, separación lógica/DOM, política de tests, persistencia, idioma). Cualquier cambio de arquitectura debe respetarlos o modificar explícitamente este documento.
- `docs/spec.md` — especificación funcional (historias de usuario, requisitos con criterios de aceptación, matriz de prioridad, decisiones pendientes). Es la fuente de qué debe hacer el sistema; ante discrepancia con el código, el código en `main` manda y hay que actualizar `spec.md` en el mismo commit (constitution.md, principio 2).
- `docs/tasks.md` — desglose de tareas de implementación en orden de dependencia, cada una ligada a un requisito de `spec.md`.

## Convenciones específicas del proyecto

- Código (nombres de variables/funciones/archivos) en inglés; comentarios y todo texto visible para el operador en español castellano (constitution.md, principio 6).
- Ningún test en rojo bloquea el cierre de una tarea (constitution.md, principio 4): cualquier cambio a `js/utils/` va acompañado de su test.
- Nueva dependencia (librería, framework, servicio externo) o base de datos: requiere justificación escrita en `docs/constitution.md` explicando qué problema resuelve que no quepa en <30 líneas de vanilla JS.
