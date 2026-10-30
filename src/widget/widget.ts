// Widget embebible framework-free (RF-10/RNF-06): web component sin React ni
// Tailwind, para que el bundle quepa en el presupuesto de 30 KB. Reutiliza la
// misma capa de datos (fetch + caché + fallback) que la página principal.
import { SERVICES, type Criterion } from "../data/criteriaData";
import { normStr } from "../data/normalize";
import { fetchRemoteCriteria, type DataSource } from "../data/remoteCriteria";
import { isReadablePair } from "./contrast";

const DEFAULT_VARS: Record<string, string> = {
  "--w-primary": "#1a2332",
  "--w-text": "#1f2933",
  "--w-muted": "#5b6673",
  "--w-bg": "#ffffff",
  "--w-soft": "#f6f7f9",
  "--w-line": "#d9dde2",
  "--w-font": "'Public Sans', 'Helvetica Neue', Arial, sans-serif",
  "--w-radius": "4px",
  "--w-ok-fg": "#24533d",
  "--w-ok-bg": "#e2ede6",
  "--w-cond-fg": "#7a4f00",
  "--w-cond-bg": "#f5ead2",
  "--w-rec-fg": "#4b5563",
  "--w-rec-bg": "#eceef0",
  "--w-dif-bg": "#fbf4e4",
  "--w-dif-line": "#c98a12"
};

const OBL_LEVELS = ["Obligatorio", "Condicional", "Recomendado"] as const;

function escapeHtml(s: unknown): string {
  return String(s ?? "").replace(
    /[&<>"']/g,
    (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c] as string)
  );
}

function safeHref(url: string | undefined): string | null {
  return url && url.startsWith("https://") ? url : null;
}

interface WidgetState {
  data: Record<string, Criterion[]>;
  dataSource: DataSource | "loading";
  visibleServices: typeof SERVICES;
  activeSvc: string;
  search: string;
  obl: Set<string>;
  expandedId: string | null;
}

class ChecklistExpedientesElement extends HTMLElement {
  private root: ShadowRoot;
  private state: WidgetState;
  private styleEl: HTMLStyleElement;
  private bodyEl: HTMLDivElement;

  constructor() {
    super();
    this.root = this.attachShadow({ mode: "open" });
    this.state = {
      data: {},
      dataSource: "loading",
      visibleServices: SERVICES,
      activeSvc: SERVICES[0].key,
      search: "",
      obl: new Set(OBL_LEVELS),
      expandedId: null
    };
    this.styleEl = document.createElement("style");
    this.bodyEl = document.createElement("div");
    this.bodyEl.className = "wrap";
  }

  connectedCallback() {
    this.applyStyleMode();
    this.applySectorFilter();
    this.root.append(this.styleEl, this.bodyEl);
    this.bodyEl.addEventListener("click", (e) => this.handleClick(e));
    this.bodyEl.addEventListener("input", (e) => this.handleInput(e));
    this.render();

    fetchRemoteCriteria().then((result) => {
      this.state.data = result.data;
      this.state.dataSource = result.source;
      this.render();
    });
  }

  private applySectorFilter() {
    const sectorAttr = this.getAttribute("data-sector");
    if (!sectorAttr) return;
    const matches = SERVICES.filter((s) => normStr(s.sector).includes(normStr(sectorAttr)));
    if (matches.length > 0) {
      this.state.visibleServices = matches;
      this.state.activeSvc = matches[0].key;
    }
  }

  private applyStyleMode() {
    const mode = (this.getAttribute("data-style") || "default").toLowerCase();
    const vars: Record<string, string> = { ...DEFAULT_VARS };

    if (mode === "heredado") {
      const cs = getComputedStyle(document.body);
      const text = cs.color;
      const bg = cs.backgroundColor && cs.backgroundColor !== "rgba(0, 0, 0, 0)" ? cs.backgroundColor : "#ffffff";
      if (isReadablePair(text, bg)) {
        vars["--w-text"] = text;
        vars["--w-bg"] = bg;
        if (cs.fontFamily) vars["--w-font"] = cs.fontFamily;
      }
      // si no es legible, se conserva el estilo por defecto (RF-14)
    } else if (mode === "personalizado") {
      const text = this.getAttribute("data-color-text");
      const bg = this.getAttribute("data-color-bg");
      const primary = this.getAttribute("data-color-primary");
      const font = this.getAttribute("data-font");
      const radius = this.getAttribute("data-radius");
      if (isReadablePair(text, bg)) {
        vars["--w-text"] = text as string;
        vars["--w-bg"] = bg as string;
      }
      if (primary) vars["--w-primary"] = primary;
      if (font) vars["--w-font"] = font;
      if (radius) vars["--w-radius"] = radius;
    }

    const cssVars = Object.entries(vars)
      .map(([k, v]) => `${k}:${v};`)
      .join("");
    this.styleEl.textContent = `:host{${cssVars}}` + WIDGET_CSS;
  }

  private currentList(): Criterion[] {
    const list = this.state.data[this.state.activeSvc] || [];
    const q = this.state.search.toLowerCase().trim();
    return list.filter((r) => {
      if (!this.state.obl.has(r.obl)) return false;
      if (q) {
        const blob = [r.id, r.capa, r.item, r.que, r.norma, r.art, r.amb].join(" ").toLowerCase();
        if (!q.split(/\s+/).filter(Boolean).every((k) => blob.includes(k))) return false;
      }
      return true;
    });
  }

  private handleClick(e: Event) {
    const target = e.target as HTMLElement;
    const tab = target.closest<HTMLElement>("[data-tab]");
    if (tab) {
      this.state.activeSvc = tab.dataset.tab as string;
      this.state.expandedId = null;
      this.render();
      return;
    }
    const chip = target.closest<HTMLElement>("[data-chip]");
    if (chip) {
      const obl = chip.dataset.chip as string;
      const next = new Set(this.state.obl);
      if (next.has(obl)) next.delete(obl);
      else next.add(obl);
      this.state.obl = next.size > 0 ? next : new Set(OBL_LEVELS);
      this.render();
      return;
    }
    const row = target.closest<HTMLElement>("[data-row-id]");
    if (row) {
      const id = row.dataset.rowId as string;
      this.state.expandedId = this.state.expandedId === id ? null : id;
      this.render();
    }
  }

  private handleInput(e: Event) {
    const target = e.target as HTMLInputElement;
    if (target.matches("[data-search]")) {
      this.state.search = target.value;
      this.render();
      const input = this.root.querySelector<HTMLInputElement>("[data-search]");
      if (input) {
        input.focus();
        input.setSelectionRange(input.value.length, input.value.length);
      }
    }
  }

  private render() {
    const showHeader = this.getAttribute("data-header") !== "hide";
    const list = this.currentList();
    const total = (this.state.data[this.state.activeSvc] || []).length;

    const tabs = this.state.visibleServices
      .map(
        (s) => `<button data-tab="${s.key}" class="tab${s.key === this.state.activeSvc ? " active" : ""}">
          ${escapeHtml(s.label)}
        </button>`
      )
      .join("");

    const chips = OBL_LEVELS.map(
      (o) => `<button data-chip="${o}" class="chip ${o.toLowerCase()}${this.state.obl.has(o) ? " active" : ""}">${o}</button>`
    ).join("");

    const rows = list
      .map((r) => {
        const isDif = r.dif.toLowerCase().startsWith("s");
        const expanded = this.state.expandedId === r.id;
        const href = safeHref(r.enlace_norma);
        return `
          <tr data-row-id="${escapeHtml(r.id)}" class="row${isDif ? " dif" : ""}${expanded ? " expanded" : ""}">
            <td class="mono">${escapeHtml(r.id)}</td>
            <td>${escapeHtml(r.item)}</td>
            <td><span class="badge ${r.obl.toLowerCase()}">${escapeHtml(r.obl)}</span></td>
          </tr>
          ${
            expanded
              ? `<tr class="detail"><td colspan="3">
                  <p>${escapeHtml(r.que)}</p>
                  <dl>
                    <dt>Norma</dt><dd>${escapeHtml(r.norma)} (${escapeHtml(r.art)})</dd>
                    <dt>Ámbito</dt><dd>${escapeHtml(r.amb)}</dd>
                  </dl>
                  ${href ? `<a href="${escapeHtml(href)}" target="_blank" rel="noopener noreferrer">Ver norma oficial ↗</a>` : ""}
                </td></tr>`
              : ""
          }`;
      })
      .join("");

    const statusLine =
      this.state.dataSource === "loading"
        ? "Cargando criterios…"
        : this.state.dataSource === "cache"
        ? "Sin conexión con la fuente en vivo; mostrando la última copia guardada."
        : this.state.dataSource === "seed"
        ? "Mostrando datos de ejemplo (fuente en vivo no configurada)."
        : `Mostrando ${list.length} de ${total} criterios.`;

    this.bodyEl.innerHTML = `
      ${showHeader ? `<div class="title">Checklist de Expedientes Técnicos</div>` : ""}
      <div class="tabs">${tabs}</div>
      <div class="controls">
        <input data-search class="search" type="search" placeholder="Buscar..." value="${escapeHtml(this.state.search)}" />
        <div class="chips">${chips}</div>
      </div>
      <div class="status">${escapeHtml(statusLine)}</div>
      <div class="table-scroll">
        <table>
          <thead><tr><th>ID</th><th>Ítem de verificación</th><th>Obligatoriedad</th></tr></thead>
          <tbody>${rows || `<tr><td colspan="3" class="empty">Sin resultados para los filtros aplicados.</td></tr>`}</tbody>
        </table>
      </div>
      <div class="brand">Fuente: Observatorio de Criterios Técnicos · Universidad del Pacífico · DGPMI-MEF</div>
    `;
  }
}

const WIDGET_CSS = `
  :host { display: block; font-family: var(--w-font); color: var(--w-text); background: var(--w-bg); }
  .wrap { box-sizing: border-box; }
  * { box-sizing: border-box; }
  .title { font-weight: 700; font-size: 14px; margin-bottom: 8px; }
  .tabs { display: flex; gap: 4px; overflow-x: auto; border-bottom: 1px solid var(--w-line); margin-bottom: 8px; }
  .tab { padding: 6px 10px; font-size: 12px; border: none; background: none; cursor: pointer; white-space: nowrap;
    border-bottom: 2px solid transparent; color: var(--w-muted); }
  .tab.active { color: var(--w-text); border-bottom-color: var(--w-primary); font-weight: 600; }
  .controls { display: flex; flex-wrap: wrap; gap: 8px; align-items: center; margin-bottom: 8px; }
  .search { flex: 1; min-width: 160px; padding: 5px 8px; font-size: 12px; border: 1px solid var(--w-line);
    border-radius: var(--w-radius); background: var(--w-soft); color: var(--w-text); }
  .chips { display: flex; gap: 4px; }
  .chip { font-size: 11px; padding: 3px 8px; border-radius: 999px; border: 1px solid var(--w-line); background: none;
    cursor: pointer; opacity: 0.5; color: var(--w-muted); }
  .chip.active { opacity: 1; }
  .chip.active.obligatorio { background: var(--w-ok-bg); color: var(--w-ok-fg); border-color: var(--w-ok-fg); }
  .chip.active.condicional { background: var(--w-cond-bg); color: var(--w-cond-fg); border-color: var(--w-cond-fg); }
  .chip.active.recomendado { background: var(--w-rec-bg); color: var(--w-rec-fg); border-color: var(--w-rec-fg); }
  .status { font-size: 11px; color: var(--w-muted); margin-bottom: 6px; }
  .table-scroll { overflow-x: auto; border: 1px solid var(--w-line); border-radius: var(--w-radius); }
  table { width: 100%; border-collapse: collapse; font-size: 12px; }
  th { text-align: left; padding: 6px 8px; background: var(--w-soft); border-bottom: 1px solid var(--w-line); }
  td { padding: 6px 8px; border-bottom: 1px solid var(--w-line); vertical-align: top; }
  .row { cursor: pointer; }
  .row:hover { background: var(--w-soft); }
  .row.dif { background: var(--w-dif-bg); border-left: 3px solid var(--w-dif-line); }
  .mono { font-family: monospace; font-weight: 600; }
  .badge { font-size: 10px; padding: 2px 6px; border-radius: 3px; font-weight: 600; white-space: nowrap; }
  .badge.obligatorio { background: var(--w-ok-bg); color: var(--w-ok-fg); }
  .badge.condicional { background: var(--w-cond-bg); color: var(--w-cond-fg); }
  .badge.recomendado { background: var(--w-rec-bg); color: var(--w-rec-fg); }
  .detail td { background: var(--w-soft); font-size: 12px; }
  .detail dl { display: grid; grid-template-columns: auto 1fr; gap: 2px 8px; margin: 6px 0; }
  .detail dt { color: var(--w-muted); }
  .detail a { color: var(--w-primary); font-size: 11px; }
  .empty { text-align: center; color: var(--w-muted); padding: 16px; }
  .brand { margin-top: 8px; font-size: 10px; color: var(--w-muted); border-top: 1px solid var(--w-line); padding-top: 6px; }
`;

if (!customElements.get("checklist-expedientes")) {
  customElements.define("checklist-expedientes", ChecklistExpedientesElement);
}
