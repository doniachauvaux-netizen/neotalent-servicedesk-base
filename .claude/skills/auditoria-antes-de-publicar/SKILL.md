---
name: auditoria-antes-de-publicar
description: Audita y documenta una web estática (HTML, CSS y JavaScript, sin backend) antes de publicarla en surge.sh u otro hosting estático. Úsala cuando el usuario pida "auditar antes de publicar/desplegar", "revisar antes de subir", "hacer la auditoría" o repetir "la auditoría que ya usamos", en este o en cualquier otro proyecto web. No es para revisar un solo archivo ni un PR concreto.
---

# Auditoría antes de publicar

Analiza todo el repositorio siguiendo el código real, sin deducir nada por el nombre de los
archivos, y distingue siempre entre lo que has comprobado y lo que interpretas.

## Qué revisar

1. **Seguridad:** si lo que escribe el usuario se escapa antes de pintarse en pantalla; si hay
   claves, contraseñas, URLs privadas o datos que no deberían estar; y qué archivos se
   publicarían sin hacer falta para que la app funcione (documentación interna, tests,
   `CLAUDE.md`, material de referencia).
2. **Diseño responsive:** si algo se rompe, se solapa o se desborda en móvil (375 px), tablet
   (768 px) y escritorio (1440 px), revisando los breakpoints que existen.
3. **Despliegue:** rutas, carga de datos (`fetch` de archivos JSON) y cualquier cosa que
   funcione en local pero pueda fallar publicada.
4. **Arquitectura:** qué hace cada archivo, cómo se relacionan y por dónde entra un dato hasta
   que se ve en pantalla.

Clasifica cada hallazgo como crítico, alto, medio o bajo, con archivo y línea.

## Entregables

- `docs/auditoria.md` y `docs/auditoria.html` con el mismo contenido. El HTML es autocontenido
  (sin dependencias externas), con índice navegable y los hallazgos agrupados por gravedad.
- Escritos para alguien que llega nuevo al proyecto: explica cada concepto técnico la primera
  vez que aparece e incluye comentados los fragmentos de código importantes.
- Al final, los arreglos rápidos antes de publicar, incluido un `.surgeignore` con lo que no
  debe subirse.

## Reglas

- No modifiques ningún otro archivo ni publiques nada hasta que el usuario revise la auditoría
  y diga qué arreglar.
- Cuando el usuario pida aplicar arreglos, **actualiza después `docs/auditoria.md` y
  `docs/auditoria.html`**, marcando cada hallazgo como resuelto o pendiente.
- Publicar lo decide una persona: prepara el comando, pero no lo lances sin confirmación.
