# Constitution — Mini Service Desk

Este documento fija los principios innegociables del proyecto; toda especificación, diseño o código futuro debe cumplirlos, y ninguna decisión posterior puede contradecirlos sin pasar antes por el proceso descrito en la última sección.

## 1. Simplicidad del stack
El proyecto se construye en HTML, CSS y JavaScript vanilla, sin framework, sin bundler y sin backend propio; cualquier dependencia nueva (librería, framework o servicio externo) requiere una justificación escrita en este documento que explique qué problema concreto resuelve que no se pueda resolver en vanilla JS en menos de 30 líneas.
**Por qué:** con un volumen fijo de ~60 tickets y un alcance acotado, la complejidad de un framework o un backend no se traduce en ninguna ventaja medible, solo en más superficie que mantener.

## 2. Relación entre la especificación y el código
Ante cualquier discrepancia entre `docs/spec.md` y el código, el código en `main` es la fuente de verdad de lo que el sistema hace hoy; quien detecte la discrepancia debe actualizar `docs/spec.md` en el mismo commit o pull request que la introduce, nunca después.
**Por qué:** una especificación que no se actualiza en el momento del cambio deja de ser fiable y nadie vuelve a confiar en ella para decisiones futuras.

## 3. Separación entre lógica e interfaz
El código de clasificación y triaje de tickets vive en módulos propios que no importan ni referencian el DOM, y los módulos de interfaz solo pueden invocar esos módulos a través de funciones que reciben datos y devuelven datos, nunca al revés.
**Por qué:** así se puede rediseñar la interfaz o cambiar el criterio de clasificación por separado, sin que un cambio visual arrastre un cambio de comportamiento o viceversa.

## 4. Política de tests
Ninguna tarea se da por terminada sin un test que verifique la lógica de clasificación o triaje que esa tarea añade o modifica, y un test en rojo bloquea el cierre de la tarea hasta que vuelva a estar en verde.
**Por qué:** en un proyecto sin revisión de un tercero antes de fusionar, el test es el único control objetivo de que el cambio hace lo que dice hacer.

## 5. Persistencia de los datos
Los tickets base se guardan en uno o varios archivos JSON dentro del repositorio (`data/tickets.json`), leídos sin pasar por un motor de base de datos. Los tickets dados de alta por el operador desde la propia interfaz se guardan en `localStorage` del navegador, como segunda capa de persistencia junto al JSON del repositorio — nunca en un motor de base de datos ni en un backend con estado propio. Introducir una base de datos requiere justificar por escrito, en este documento, qué límite concreto de JSON/localStorage como almacenamiento se ha alcanzado.
**Por qué:** ~60 tickets base más los que un operador dé de alta en una sesión de uso normal no generan ningún problema de concurrencia, tamaño ni consulta que JSON + localStorage no resuelvan; localStorage permite guardar tickets nuevos sin necesitar un backend propio, manteniendo el principio 1 ("sin backend propio").

> Actualizado: la redacción anterior fijaba una única fuente de tickets en el repositorio; deja de ser cierto en cuanto el operador puede dar de alta tickets desde la interfaz (ver "Alta manual de tickets desde la bandeja" en `docs/spec.md`). Esta versión sustituye a la que solo contemplaba archivos JSON del repositorio como única persistencia.

## 6. Idioma y convenciones
El código (nombres de variables, funciones, archivos) se escribe en inglés, los comentarios y los mensajes que ve el usuario final se escriben en español castellano.
**Por qué:** el inglés en el código mantiene la coherencia con el ecosistema y las librerías de JavaScript, mientras que el usuario final de este service desk trabaja en español.

## Modificación de este documento
Cambiar un principio ya aprobado exige una entrada explícita en este mismo archivo, dentro de un commit dedicado que explique en su mensaje el motivo del cambio y qué principio sustituye.
