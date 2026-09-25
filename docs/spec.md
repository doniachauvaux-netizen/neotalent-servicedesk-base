# Spec — Mini Service Desk de triaje de incidencias de seguridad física con IA

Spec funcional escrita siguiendo Spec Driven Development, a partir de `docs/constitution.md` y del informe `deep-research/deep-research-triaje-ia-seguridad-fisica.md`. Define qué debe construirse y con qué criterios de aceptación — no incluye diseño visual ni detalles de implementación técnica.

## Contexto

El equipo de seguridad física recibe a diario una bandeja de tickets de incidencias (accesos, identidades, alarmas, guardias) sin categorizar ni priorizar, y el sistema debe sugerir automáticamente esa clasificación para que una persona la revise y confirme antes de que cuente como definitiva.

## Historias de usuario

- **Como operador de triaje sin perfil técnico**, quiero abrir la bandeja de ~60 tickets y ver cada uno ya con una categoría y una prioridad sugeridas, para no tener que decidir desde cero en cada caso.
- **Como operador de triaje**, quiero ver por qué el sistema sugirió esa categoría y esa prioridad, para poder confiar en la sugerencia o detectar cuándo está equivocada.
- **Como operador de triaje**, quiero poder aceptar la sugerencia con un solo gesto o corregirla eligiendo otro valor del catálogo, para quedarme siempre con el control final de la clasificación.
- **Como operador de triaje**, quiero que un ticket que no encaja claramente en ninguna categoría quede marcado como "sin clasificar" y visible, para no perderlo de vista ni forzar una categoría que no le corresponde.
- **Como operador de triaje**, quiero poder dar de alta un ticket nuevo directamente desde la bandeja cuando me llega una incidencia fuera de la carga inicial, para no perder el registro solo porque no viniera en `data/tickets.json`.

## Requisitos funcionales

### Requisito: Clasificación automática por categoría
El sistema debe asignar automáticamente a cada ticket entrante una categoría dentro del catálogo: Accesos, Identidades, Alarmas, Guardias, Otros.

La clasificación se implementa como una heurística de palabras clave en JavaScript vanilla (sin llamadas a un modelo de IA externo ni a ningún servicio). No introduce ninguna dependencia nueva, por lo que no requiere excepción al principio 1 de `constitution.md`.

**Criterio de aceptación:** al cargar los 60 tickets de prueba, el 100% queda con un valor en el campo categoría — incluida la categoría "sin clasificar" cuando el ticket no encaja claramente en ninguna del catálogo — ningún ticket queda sin valor en ese campo.

### Requisito: Categoría "sin clasificar" para casos ambiguos
Cuando el sistema no pueda determinar con confianza suficiente a qué categoría pertenece un ticket, debe asignarle la categoría "sin clasificar" en vez de forzar la categoría con mayor probabilidad aunque sea baja.

**Criterio de aceptación:** ningún ticket queda con una categoría del catálogo asignada si el propio sistema no puede mostrar un motivo para esa categoría concreta; en ese caso queda como "sin clasificar".

### Requisito: Priorización por urgencia e impacto
El sistema debe asignar automáticamente a cada ticket una prioridad, derivada de cruzar dos dimensiones propias del dominio de seguridad física (no heredadas de un ejemplo genérico de ITIL):

- **Urgencia:** "evento activo ahora" (algo está ocurriendo o sin resolver en este momento, p. ej. una alarma desactivada) frente a "reporte histórico o no activo" (algo ya ocurrido o sin urgencia inmediata, p. ej. un fichaje duplicado ya registrado).
- **Impacto:** "zona crítica" (perímetro exterior, accesos principales, puntos con exposición a todo el recinto) frente a "zona no crítica" (puestos o zonas acotadas con exposición limitada).

Cruzando ambas dimensiones (2×2) el sistema produce uno de estos cuatro niveles de prioridad: Crítica, Alta, Media, Baja.

La matriz de mapeo es:

| Urgencia \ Impacto | Zona crítica | Zona no crítica |
|---|---|---|
| Evento activo ahora | Crítica | Alta |
| Reporte histórico o no activo | Media | Baja |

La urgencia pesa algo más que el impacto en las combinaciones intermedias: un evento activo en zona no crítica (Alta) se prioriza por encima de un reporte histórico en zona crítica (Media), para que un incidente en curso no quede infravalorado solo por no estar en una zona principal.

Un ticket "sin clasificar" no recibe ningún valor de la matriz 2×2: su prioridad queda como `null` y se muestra al operador como "Pendiente de definir", ya que sin categoría no hay una combinación de urgencia/impacto que fundamente una prioridad concreta. Esta decisión estaba abierta en la sección "Decisiones pendientes" y queda cerrada aquí, conforme al diseño de referencia `FlowA.dc.html`.

**Criterio de aceptación:** al cargar los 60 tickets de prueba, todo ticket con categoría del catálogo (no "sin clasificar") queda con un valor de prioridad asignado y trazable a una combinación concreta de urgencia e impacto; todo ticket "sin clasificar" queda con prioridad `null` y visible como "Pendiente de definir".

> Nota: constitution.md no fija los valores de esta matriz; queda como decisión propia de esta especificación, documentada aquí en vez de citarse a ITIL genérico, conforme a lo que señala el informe de deep research (sección 2).

### Requisito: Motivo visible de la sugerencia
Para cada ticket, el sistema debe mostrar junto a la categoría y la prioridad sugeridas el motivo o evidencia en que se basa la sugerencia (p. ej. qué palabras o campos del ticket la determinaron), no solo la etiqueta final.

**Criterio de aceptación:** al abrir cualquier ticket de la bandeja, la persona ve un texto o indicación asociada a la categoría y a la prioridad que explica por qué se sugirió ese valor, sin necesidad de pedirlo aparte.

### Requisito: Confirmación o corrección manual de la sugerencia
El operador debe poder, para cada ticket, aceptar la categoría y prioridad sugeridas o corregirlas manualmente eligiendo otro valor del catálogo correspondiente. Ninguna sugerencia se considera definitiva hasta esa acción del operador.

El catálogo de categorías disponible para la corrección manual incluye las 5 categorías reales ("Accesos", "Identidades", "Alarmas", "Guardias", "Otros") más "Sin clasificar" como sexto valor seleccionable: el operador puede corregir un ticket a "Sin clasificar" si considera que ninguna categoría real le corresponde, igual que puede corregirlo a cualquier otra. Esta decisión estaba abierta en la sección "Decisiones pendientes" y queda cerrada aquí, conforme al diseño de referencia `FlowA.dc.html`.

**Criterio de aceptación:** un ticket recién cargado se distingue visiblemente de un ticket ya revisado por el operador; el valor final de categoría/prioridad que queda guardado es siempre el que el operador aceptó o corrigió, nunca el que el sistema sugirió sin intervención; el selector de corrección de categoría ofrece las 6 opciones del catálogo, incluida "Sin clasificar".

### Requisito: Sin acceso del operador a la configuración de clasificación
El operador de triaje diario no debe tener, dentro de esta especificación, ninguna función para editar los criterios, reglas o umbrales que usa el sistema para generar sugerencias — solo puede actuar sobre el resultado de cada ticket individual.

**Criterio de aceptación:** ninguna historia de usuario ni pantalla de esta especificación incluye una acción de edición de reglas de clasificación; toda acción del operador se limita a un ticket concreto.

### Requisito: Alta manual de tickets desde la bandeja
El operador debe poder dar de alta un ticket nuevo desde un botón "Nuevo ticket" en la bandeja, indicando título, descripción y zona — la zona se elige de un selector con el mismo catálogo de zonas críticas/no críticas ya fijado en la sección "Mapeo de zona → impacto", nunca como texto libre. El sistema asigna automáticamente un identificador único, la fecha de alta y el estado "abierto", y aplica sobre el ticket la misma clasificación automática de categoría y prioridad (ver Requisito de clasificación automática y de priorización) que a cualquier ticket cargado desde `data/tickets.json`; el ticket nuevo queda sin revisar hasta que el operador lo acepte o corrija, igual que el resto.

El ticket se guarda en `localStorage` del navegador (constitution.md, principio 5) y se recupera junto con los de `data/tickets.json` cada vez que se abre la aplicación, de forma que sobrevive a recargar la página. Si `localStorage` no está disponible (cuota agotada, modo incógnito estricto), el ticket se sigue mostrando en la bandeja durante la sesión actual, pero no sobrevive a una recarga.

Aceptar o corregir la clasificación de un ticket dado de alta así sigue el mismo criterio que el resto de tickets (ver Requisito de confirmación o corrección manual); esa revisión no se reescribe en `localStorage` — solo el alta inicial se persiste —, igual que hoy ninguna corrección sobre un ticket de `data/tickets.json` se reescribe en el archivo (ver Decisiones pendientes).

**Criterio de aceptación:** al pulsar "Nuevo ticket" y rellenar título, descripción y zona, el ticket aparece en la bandeja con una categoría y una prioridad sugeridas (o "Sin clasificar" / prioridad `null` si no hay motivo mostrable) y como "Pendiente"; al recargar la página, el ticket sigue apareciendo en la bandeja con la misma categoría y prioridad sugeridas recién calculadas; ningún ticket dado de alta así puede tener un valor de zona fuera del catálogo ya fijado.

## Requisitos no funcionales

- **Cobertura de clasificación:** el sistema debe procesar el 100% de los tickets cargados al iniciar, sin dejar ninguno sin valor de categoría o prioridad (incluyendo "sin clasificar").
  **Criterio de aceptación:** una carga completa de `data/tickets.json` no produce ningún ticket con el campo categoría o prioridad vacío o nulo.
- **Trazabilidad del idioma:** todo texto visible para el operador (motivo de sugerencia, etiquetas de categoría y prioridad, mensajes) se muestra en español castellano, conforme al principio 6 de constitution.md.
  **Criterio de aceptación:** ninguna cadena de texto visible en la interfaz de triaje está en inglés.

## Casos límite

- **Ticket sin categoría clara:** se asigna "sin clasificar" y queda visible en la bandeja para revisión manual del operador (ver Requisito: Categoría "sin clasificar" para casos ambiguos).
- **Tickets duplicados o muy similares:** cada ticket se clasifica de forma independiente; la detección de duplicados queda explícitamente fuera de alcance de esta versión (ver sección Fuera de alcance) — el informe de deep research no encontró evidencia verificada sobre esta función (sección "Qué no se ha podido verificar").
- **Ticket con datos incompletos** (p. ej. sin `zona` o sin `descripcion`): el sistema debe seguir asignándole categoría y prioridad usando los campos disponibles; si los campos disponibles no bastan para determinar una categoría con motivo mostrable, se aplica el mismo criterio que un ticket ambiguo y queda como "sin clasificar".
- **`localStorage` no disponible al dar de alta un ticket:** el ticket se muestra igualmente en la bandeja de la sesión actual (no se pierde el trabajo del operador), pero al recargar la página desaparece — no hay aviso de error bloqueante, mismo criterio que ya sigue el guardado del tema visual en `app.js`.

## Fuera de alcance

- Detección automática de tickets duplicados o de contenido muy similar.
- Resumen automático de hilos o histórico de un ticket.
- Cualquier acción que module el acceso físico real de una persona (cerrar o abrir una credencial, notificar a un guardia, escalar una alarma a intervención) — la IA solo sugiere categoría y prioridad del ticket, nunca ejecuta consecuencias físicas, conforme a la restricción de diseño de la sección 8 del informe de deep research.
- Edición de las reglas o criterios de clasificación por parte del operador de triaje diario (rol de configuración reservado a un perfil distinto, no definido en esta versión).
- Subcategorías dentro de cada categoría del catálogo.
- Umbrales de confianza numéricos o arquitecturas de validación configurables — el informe de deep research no encontró evidencia verificada para fijarlos (sección "Qué no se ha podido verificar").
- Edición o borrado de un ticket ya dado de alta manualmente (solo se puede aceptar/corregir su clasificación, igual que cualquier otro ticket).
- Persistencia de la revisión (aceptar/corregir) de un ticket dado de alta manualmente en `localStorage` — solo se persiste el alta inicial (ver Requisito: Alta manual de tickets desde la bandeja).
- Sincronización de tickets dados de alta entre distintos navegadores o dispositivos — `localStorage` es propio de cada navegador.

## Decisiones pendientes

Puntos detectados en la revisión de QA de esta especificación que quedan anotados para resolver antes o durante el diseño, sin bloquear el arranque de esta fase:

- **Definición operativa de "motivo mostrable" / "confianza suficiente":** el spec no fija la regla exacta (p. ej. nº mínimo de coincidencias de palabras clave) que determina cuándo hay motivo suficiente para asignar una categoría del catálogo frente a "sin clasificar". Necesario para que el criterio de aceptación del Requisito de "sin clasificar" sea testeable de forma determinista.
- **Valor de `zona` no reconocido:** qué ocurre si un ticket tiene un valor de `zona` fuera de "crítica"/"no crítica" — si se trata igual que un dato incompleto (→ candidato a "sin clasificar") o si es un caso distinto.
- **Persistencia de correcciones ante recarga de `tickets.json`:** si se vuelve a cargar el archivo, no se especifica si un ticket ya revisado por el operador mantiene su estado o se re-clasifica desde cero. La misma pregunta aplica a los tickets dados de alta manualmente desde la bandeja (ver Requisito: Alta manual de tickets desde la bandeja); por ahora, en ninguno de los dos casos se persiste la revisión, solo el alta o la carga inicial.
- **Corrección de una corrección:** no se especifica si el operador puede volver a cambiar un valor ya confirmado anteriormente.
- **Comportamiento con un número de tickets distinto de 60:** todos los criterios de aceptación están anclados a "60 tickets"; no se especifica el comportamiento si `tickets.json` tiene otro número de entradas o está vacío.
- **Empate entre categorías igualmente plausibles:** el spec cubre el caso de "no encaja en ninguna" pero no el de "encaja en varias por igual".
- **Redundancia entre el criterio de aceptación de categoría (Requisito de clasificación automática) y el requisito no funcional de cobertura:** ambos exigen lo mismo con redacción distinta; riesgo de desincronizarse si se edita uno sin el otro.
- **Testabilidad de la "tasa de corrección observable"** (ver Criterios de finalización): al depender de decisiones humanas variables, no está claro si el principio 4 de `constitution.md` ("ningún test en rojo") aplica a esta métrica o queda fuera del alcance de los tests automáticos.
- **Catálogo de categorías: etiqueta visible vs. valor interno:** no se aclara si "Accesos, Identidades, Alarmas, Guardias, Otros" son ya las etiquetas en español que ve el operador, o si existen valores internos en inglés que deban mapearse a ellas, conforme al principio 6 de `constitution.md`.

> Resuelto: la prioridad de un ticket "sin clasificar" y la inclusión de "Sin clasificar" como opción de corrección manual (ver secciones de Priorización y de Confirmación/corrección manual arriba), a partir del diseño de referencia `FlowA.dc.html`.

- **Mapeo de zona → impacto (crítica / no crítica):** `data/tickets.json` no incluye un campo de criticidad de zona, solo el nombre de la zona. Queda resuelto con la siguiente tabla, fijada al iniciar la implementación (tasks.md, Tarea 1):
  - **Zona crítica:** Perímetro exterior, Sala de servidores, Torre de control, Acceso peatonal Este, Muelle de carga.
  - **Zona no crítica:** Oficinas centrales, Vestuarios de personal, Recepción Principal, Almacén Norte, Aparcamiento -1, Edificio B (planta 3), Nave logística 2.
  - Una zona de `tickets.json` que no aparezca en ninguna de las dos listas se trata como "valor de zona no reconocido" (ver punto siguiente).
- **Mapeo de título/descripción → urgencia (evento activo ahora / reporte histórico):** el dataset no trae un campo de urgencia explícito. Se deriva con una heurística de palabras clave sobre `titulo` + `descripcion` (p. ej. "se ha desactivado", "no reconoce", "sigue activa", "abierta sin alarma" → evento activo ahora; "solicita", "detectado", "acceso temporal... caduca en N días" → reporte histórico o no urgente), reforzada por el campo `estado`: `estado: "cerrado"` es señal adicional de "reporte histórico o no activo" y nunca produce "evento activo ahora". La lista de palabras clave se documenta explícitamente en el módulo de clasificación (constitution.md, principio 3).

## Criterios de finalización

- Los 60 tickets de `data/tickets.json` quedan, tras la carga, con un valor de categoría y un valor de prioridad cada uno (incluyendo "sin clasificar" donde aplique) — verificable inspeccionando la bandeja completa.
- Cada ticket muestra un motivo de sugerencia visible para su categoría y su prioridad — verificable abriendo cualquier ticket de la bandeja.
- El operador puede aceptar o corregir la categoría y la prioridad de cualquier ticket, y el valor final guardado refleja esa acción — verificable corrigiendo un ticket y comprobando que el cambio persiste.
- Existe una tasa de corrección observable (proporción de tickets donde el operador cambió la sugerencia del sistema) que sirve como proxy de precisión del triaje, conforme al criterio de éxito definido en esta especificación ante la falta de una métrica estándar verificada (informe de deep research, sección 7).
- Ningún test de clasificación o triaje queda en rojo, conforme al principio 4 de constitution.md.
