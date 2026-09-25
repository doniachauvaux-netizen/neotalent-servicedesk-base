// Interfaz de la bandeja de triaje. Solo orquesta DOM + estado; toda la lógica de
// clasificación, corrección y agregados vive en js/utils/ (constitution.md, principio 3).

import { enrichTickets } from "./utils/loadTickets.js";
import { acceptSuggestion, correctTicket } from "./utils/reviewTicket.js";
import { generateTicketId, buildTicket } from "./utils/newTicket.js";
import { ZONAS_CONOCIDAS } from "./utils/prioritize.js";
import { esc } from "./utils/esc.js";
import {
  countByPriority,
  countByCategory,
  loadByZone,
  reviewProgress,
  triageHealth,
} from "./utils/stats.js";

const NUEVOS_TICKETS_KEY = "neotalent-tickets-nuevos";

// Tickets dados de alta por el operador desde la bandeja (docs/spec.md, "Alta
// manual de tickets desde la bandeja"; constitution.md, principio 5).
function cargarTicketsGuardados() {
  try {
    return JSON.parse(localStorage.getItem(NUEVOS_TICKETS_KEY)) ?? [];
  } catch (e) {
    return [];
  }
}

function guardarTicketNuevo(ticket) {
  try {
    const actuales = cargarTicketsGuardados();
    localStorage.setItem(NUEVOS_TICKETS_KEY, JSON.stringify([...actuales, ticket]));
  } catch (e) {
    /* localStorage bloqueado: el ticket no persiste entre recargas (docs/spec.md, caso límite) */
  }
}

const CATEGORIAS = ["Accesos", "Identidades", "Alarmas", "Guardias", "Otros", "Sin clasificar"];
const PRIORIDADES = ["Crítica", "Alta", "Media", "Baja"];

const vista = document.getElementById("vista");
let tickets = [];
let pantalla = { nombre: "lista" };

/* ---------- Tema ---------- */

const botonTema = document.getElementById("tema");

botonTema.addEventListener("click", () => {
  const oscuroAhora =
    document.documentElement.dataset.tema === "dark" ||
    (!document.documentElement.dataset.tema && matchMedia("(prefers-color-scheme: dark)").matches);
  const siguiente = oscuroAhora ? "light" : "dark";

  // Sin esto, el cambio de tema dispara a la vez las transiciones de hover de
  // todos los paneles y filas, y el fondo se queda a medio repintar.
  document.documentElement.classList.add("cambiando-tema");
  document.documentElement.dataset.tema = siguiente;
  requestAnimationFrame(() =>
    requestAnimationFrame(() => document.documentElement.classList.remove("cambiando-tema"))
  );

  try {
    localStorage.setItem("tema", siguiente);
  } catch (e) {
    /* localStorage bloqueado: el tema no persiste entre recargas */
  }
});

/* ---------- Utilidades de presentación ---------- */

function prioNivel(p) {
  if (!p) return "pendiente";
  return p.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
}

function prioClase(p) {
  return `prio prio-${prioNivel(p)}`;
}

function barrasReparto(conteo, total, conNivel) {
  return Object.entries(conteo)
    .map(([etiqueta, n]) => {
      const pct = total === 0 ? 0 : Math.round((n / total) * 100);
      const nivel = conNivel ? ` data-nivel="${prioNivel(etiqueta === "Sin definir" ? null : etiqueta)}"` : "";
      return `
        <div>
          <dt>${esc(etiqueta)}</dt>
          <div class="via"><span${nivel} style="width:${pct}%"></span></div>
          <dd>${n}</dd>
        </div>`;
    })
    .join("");
}

/* ---------- Dashboard ---------- */

function renderDashboard() {
  const salud = triageHealth(tickets);
  const progreso = reviewProgress(tickets);
  const porPrioridad = countByPriority(tickets);
  const porCategoria = countByCategory(tickets);
  const zonas = loadByZone(tickets);

  const criticos = porPrioridad["Crítica"] ?? 0;
  const sinClasificar = porCategoria["Sin clasificar"] ?? 0;
  const riesgo = salud.score < 60 ? "alto" : salud.score < 85 ? "medio" : "bajo";

  return `
    <section class="bento" aria-label="Resumen de la bandeja">
      <article class="panel panel-salud" data-riesgo="${riesgo}">
        <h2>Salud del triaje</h2>
        <p class="salud-cifra">${salud.score}</p>
        <p class="salud-etiqueta">${esc(salud.etiqueta)}</p>
        <div class="salud-barra"><span style="width:${salud.score}%"></span></div>
      </article>

      <article class="panel panel-metricas">
        <h2>De un vistazo</h2>
        <div class="metricas">
          <div class="metrica"><b>${progreso.total}</b><small>tickets</small></div>
          <div class="metrica" data-tono="critico"><b>${criticos}</b><small>críticos</small></div>
          <div class="metrica"><b>${sinClasificar}</b><small>sin clasificar</small></div>
        </div>
      </article>

      <article class="panel panel-progreso">
        <h2>Revisión</h2>
        <div class="anillo" data-pct="${progreso.porcentaje}" style="--pct:${progreso.porcentaje}"
             role="img" aria-label="${progreso.revisados} de ${progreso.total} tickets revisados"></div>
        <p>${progreso.revisados} de ${progreso.total} revisados</p>
      </article>

      <article class="panel panel-prioridad">
        <h2>Por prioridad</h2>
        <dl class="reparto">${barrasReparto(porPrioridad, progreso.total, true)}</dl>
      </article>

      <article class="panel panel-categoria">
        <h2>Por categoría</h2>
        <dl class="reparto">${barrasReparto(porCategoria, progreso.total, false)}</dl>
      </article>

      <article class="panel panel-zonas">
        <h2>Carga por zona</h2>
        <div class="zonas">
          ${zonas
            .map(
              (z) => `
            <div class="zona" data-criticos="${z.criticos > 0 ? "si" : "no"}">
              <b>${esc(z.zona)}</b>
              <small>${z.total} ticket${z.total === 1 ? "" : "s"}${z.criticos > 0 ? ` · ${z.criticos} crítico${z.criticos === 1 ? "" : "s"}` : ""}</small>
            </div>`
            )
            .join("")}
        </div>
      </article>
    </section>`;
}

/* ---------- Pantallas ---------- */

function render() {
  if (pantalla.nombre === "lista") renderLista();
  else if (pantalla.nombre === "detalle") renderDetalle();
  else if (pantalla.nombre === "corregir") renderCorregir();
  else if (pantalla.nombre === "nuevo") renderNuevo();
}

function renderLista() {
  vista.innerHTML = `
    <div class="titular">
      <h1>Bandeja de triaje</h1>
      <p>Clasificación automática sobre incidencias de seguridad física</p>
    </div>

    ${renderDashboard()}

    <div class="bandeja-cabecera">
      <h2>Tickets</h2>
      <p class="conteo">${tickets.length} cargados</p>
      <button type="button" id="nuevoTicket" class="boton-cristal">Nuevo ticket</button>
    </div>
    <div class="bandeja">
      ${tickets
        .map(
          (t, i) => `
        <button type="button" class="fila" data-id="${esc(t.id)}" style="animation-delay:${Math.min(i * 22, 700)}ms">
          <span class="severidad" data-nivel="${prioNivel(t.prioridad)}"></span>
          <span class="id">${esc(t.id)}</span>
          <span class="titulo">${esc(t.titulo)}<small>${esc(t.zona)} · ${esc(t.fecha)}</small></span>
          <span class="categoria">${esc(t.categoria)}</span>
          <span class="${prioClase(t.prioridad)}">${esc(t.prioridad ?? "Sin definir")}</span>
          <span class="estado" data-revisado="${t.revisado}">${t.revisado ? "Revisado" : "Pendiente"}</span>
        </button>`
        )
        .join("")}
    </div>`;

  vista.querySelectorAll(".fila").forEach((el) => {
    el.addEventListener("click", () => {
      pantalla = { nombre: "detalle", id: el.dataset.id };
      render();
    });
  });
  document.getElementById("nuevoTicket").addEventListener("click", () => {
    pantalla = { nombre: "nuevo" };
    render();
  });
}

function renderNuevo() {
  vista.innerHTML = `
    <button type="button" class="volver" id="volver">← Volver a la bandeja</button>
    <article class="hoja">
      <h2>Nuevo ticket</h2>
      <form id="formNuevo">
        <label>Título
          <input type="text" id="nuevoTitulo" required>
        </label>
        <label>Descripción
          <textarea id="nuevoDescripcion" required></textarea>
        </label>
        <label>Zona
          <select id="nuevoZona" required>
            ${ZONAS_CONOCIDAS.map((z) => `<option value="${esc(z)}">${esc(z)}</option>`).join("")}
          </select>
        </label>
        <div class="acciones">
          <button type="submit" id="guardar">Guardar ticket</button>
          <button type="button" id="cancelar">Cancelar</button>
        </div>
      </form>
    </article>`;

  document.getElementById("volver").addEventListener("click", () => {
    pantalla = { nombre: "lista" };
    render();
  });
  document.getElementById("cancelar").addEventListener("click", () => {
    pantalla = { nombre: "lista" };
    render();
  });
  document.getElementById("formNuevo").addEventListener("submit", (e) => {
    e.preventDefault();
    const titulo = document.getElementById("nuevoTitulo").value.trim();
    const descripcion = document.getElementById("nuevoDescripcion").value.trim();
    const zona = document.getElementById("nuevoZona").value;

    const id = generateTicketId(tickets.map((t) => t.id));
    const ticketCrudo = buildTicket({ titulo, descripcion, zona }, id, new Date());
    guardarTicketNuevo(ticketCrudo);
    tickets = [...tickets, ...enrichTickets([ticketCrudo])];

    pantalla = { nombre: "lista" };
    render();
  });
}

function renderDetalle() {
  const t = tickets.find((x) => x.id === pantalla.id);
  vista.innerHTML = `
    <button type="button" class="volver" id="volver">← Volver a la bandeja</button>
    <article class="hoja">
      <div class="detalle-cabecera">
        <h2>${esc(t.id)}</h2>
        <span class="estado-badge">${t.revisado ? "Revisado" : "Pendiente de revisión"}</span>
      </div>
      <h3>${esc(t.titulo)}</h3>
      <div class="descripcion">
        ${esc(t.descripcion)}
        <p class="meta">Zona: ${esc(t.zona)} · Sistema: ${esc(t.sistema_afectado)} · Reportado por: ${esc(t.reportado_por)} · ${esc(t.fecha)}</p>
      </div>
      <h4>Sugerencia del sistema</h4>
      <div class="sugerencia" data-nivel="${prioNivel(t.prioridad)}">
        <div class="sugerencia-valores">
          <span class="categoria-valor">${esc(t.categoria)}</span>
          <span class="sep">/</span>
          <span class="${prioClase(t.prioridad)}">${esc(t.prioridad ?? "Prioridad sin definir")}</span>
        </div>
        <p class="motivo">Motivo categoría: ${esc(t.motivoCategoria)}</p>
        <p class="motivo">Motivo prioridad: ${esc(t.motivoPrioridad)}</p>
      </div>
      ${
        !t.prioridad
          ? `<p class="aviso">Prioridad pendiente de definir — el ticket quedó como "Sin clasificar", no se asigna un valor de la matriz sin resolver antes.</p>`
          : ""
      }
      <div class="acciones">
        <button id="aceptar">Aceptar sugerencia</button>
        <button id="corregir">Corregir</button>
      </div>
    </article>`;

  document.getElementById("volver").addEventListener("click", () => {
    pantalla = { nombre: "lista" };
    render();
  });
  document.getElementById("aceptar").addEventListener("click", () => {
    tickets = tickets.map((x) => (x.id === t.id ? acceptSuggestion(x) : x));
    pantalla = { nombre: "lista" };
    render();
  });
  document.getElementById("corregir").addEventListener("click", () => {
    pantalla = { nombre: "corregir", id: t.id };
    render();
  });
}

function renderCorregir() {
  const t = tickets.find((x) => x.id === pantalla.id);
  vista.innerHTML = `
    <button type="button" class="volver" id="volver">← Volver al detalle de ${esc(t.id)}</button>
    <article class="hoja">
      <h2>Corregir clasificación</h2>
      <p class="meta">${esc(t.id)} — ${esc(t.titulo)}</p>
      <label>Categoría
        <select id="draftCat">
          ${CATEGORIAS.map((c) => `<option value="${c}" ${c === t.categoria ? "selected" : ""}>${c}</option>`).join("")}
        </select>
      </label>
      <label>Prioridad
        <select id="draftPri">
          ${PRIORIDADES.map((p) => `<option value="${p}" ${p === t.prioridad ? "selected" : ""}>${p}</option>`).join("")}
        </select>
      </label>
      <div class="acciones">
        <button id="guardar">Guardar cambio</button>
        <button id="cancelar">Cancelar</button>
      </div>
    </article>`;

  document.getElementById("volver").addEventListener("click", () => {
    pantalla = { nombre: "detalle", id: t.id };
    render();
  });
  document.getElementById("cancelar").addEventListener("click", () => {
    pantalla = { nombre: "detalle", id: t.id };
    render();
  });
  document.getElementById("guardar").addEventListener("click", () => {
    const categoria = document.getElementById("draftCat").value;
    const prioridad = categoria === "Sin clasificar" ? null : document.getElementById("draftPri").value;
    tickets = tickets.map((x) => (x.id === t.id ? correctTicket(x, { categoria, prioridad }) : x));
    pantalla = { nombre: "lista" };
    render();
  });
}

fetch("data/tickets.json")
  .then((r) => r.json())
  .then((raw) => {
    tickets = enrichTickets([...raw, ...cargarTicketsGuardados()]);
    render();
  })
  .catch(() => {
    vista.innerHTML = `<p class="error">No se ha podido cargar data/tickets.json.</p>`;
  });
