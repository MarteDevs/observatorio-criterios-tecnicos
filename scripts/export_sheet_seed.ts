// Genera las 4 pestañas de Google Sheets descritas en el SDD (criterios, catalogos,
// config, log_cambios) a partir de los datos hoy hardcodeados en src/data/criteriaData.ts.
// Uso: bun run export:sheet-seed  ->  escribe data-export/sheets/*.csv
import { mkdirSync, writeFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import {
  SERVICES,
  INITIAL_DATA,
  TRANSVERSAL_CRITERIA,
  type Criterion
} from "../src/data/criteriaData";

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT_DIR = join(__dirname, "..", "data-export", "sheets");
const FECHA_CORTE = "2026-10-29";

const SECTOR_BY_KEY: Record<string, string> = {
  "eess-c": "MINSA",
  "eess-m": "MINSA",
  "ie-m": "MINEDU",
  "san-c": "MVCS",
  "san-a": "MVCS",
  "via-m": "MTC",
  "via-r": "MTC"
};

const TIPOLOGIA_BY_KEY: Record<string, string> = {
  "eess-c": "Creación",
  "eess-m": "Mejoramiento",
  "ie-m": "Mejoramiento",
  "san-c": "Creación",
  "san-a": "Ampliación",
  "via-m": "Mejoramiento",
  "via-r": "Rehabilitación"
};

function csvEscape(value: unknown): string {
  const s = String(value ?? "");
  if (/[",\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

function toCsv(headers: string[], rows: (string | number)[][]): string {
  const lines = [headers.map(csvEscape).join(",")];
  for (const row of rows) lines.push(row.map(csvEscape).join(","));
  return lines.join("\r\n") + "\r\n";
}

// --- criterios.csv --------------------------------------------------------
// Superset del esquema del SDD: la matriz real necesita además item/criterio
// separados, articulo_o_seccion, ambito, obligatoriedad y diferencial (el SDD
// ya anticipa este ajuste: "las columnas definitivas se ajustan a la matriz
// que entregue el servicio de sistematización").
const CRITERIOS_HEADERS = [
  "codigo",
  "sector",
  "servicio",
  "tipologia",
  "componente",
  "item",
  "criterio",
  "base_normativa",
  "articulo_o_seccion",
  "enlace_norma",
  "ambito",
  "obligatoriedad",
  "diferencial",
  "orden",
  "estado",
  "actualizado_el"
] as const;

function criterionToRow(
  c: Criterion,
  sector: string,
  servicio: string,
  tipologia: string
): (string | number)[] {
  return [
    c.id,
    sector,
    servicio,
    tipologia,
    c.capa,
    c.item,
    c.que,
    c.norma,
    c.art,
    c.enlace_norma ?? "",
    c.amb,
    c.obl,
    c.dif,
    typeof c.n === "number" ? c.n : Number(c.n) || c.n,
    "Vigente",
    FECHA_CORTE
  ];
}

const criteriosRows: (string | number)[][] = [];

// Transversales: una sola fila por criterio (servicio="ALL"), en vez de
// duplicarlas en las 7 tipologías como hace hoy INITIAL_DATA.
for (const c of TRANSVERSAL_CRITERIA) {
  criteriosRows.push(criterionToRow(c, "TRANSVERSAL", "ALL", ""));
}

// Específicos por tipología: se excluyen las filas que ya vinieron de
// TRANSVERSAL_CRITERIA (coinciden por id) para no duplicarlas.
const transversalIds = new Set(TRANSVERSAL_CRITERIA.map((c) => c.id));
for (const svc of SERVICES) {
  const rows = INITIAL_DATA[svc.key] ?? [];
  for (const c of rows) {
    if (transversalIds.has(c.id)) continue;
    criteriosRows.push(
      criterionToRow(c, SECTOR_BY_KEY[svc.key] ?? "", svc.key, TIPOLOGIA_BY_KEY[svc.key] ?? "")
    );
  }
}

// --- catalogos.csv --------------------------------------------------------
const CATALOGOS_HEADERS = ["lista", "codigo", "etiqueta", "sector"] as const;
const catalogosRows: (string | number)[][] = [];

const SECTOR_LABELS: Record<string, string> = {
  MINSA: "MINSA / PRONIS",
  MINEDU: "MINEDU",
  MVCS: "MVCS",
  MTC: "MTC",
  TRANSVERSAL: "Marco Transversal (aplica a todas las tipologías)"
};
for (const [codigo, etiqueta] of Object.entries(SECTOR_LABELS)) {
  catalogosRows.push(["sector", codigo, etiqueta, ""]);
}
for (const svc of SERVICES) {
  catalogosRows.push(["servicio", svc.key, svc.label, SECTOR_BY_KEY[svc.key] ?? ""]);
}
for (const t of ["Creación", "Ampliación", "Mejoramiento", "Rehabilitación"]) {
  catalogosRows.push(["tipologia", t, t, ""]);
}
for (const e of ["Vigente", "Retirado"]) {
  catalogosRows.push(["estado", e, e, ""]);
}
for (const o of ["Obligatorio", "Condicional", "Recomendado"]) {
  catalogosRows.push(["obligatoriedad", o, o, ""]);
}
for (const d of ["Sí", "No"]) {
  catalogosRows.push(["diferencial", d, d, ""]);
}

// --- config.csv -------------------------------------------------------------
const CONFIG_HEADERS = ["clave", "valor"] as const;
const configRows: (string | number)[][] = [
  ["version", "1.0.0"],
  ["fecha_corte", FECHA_CORTE],
  [
    "texto_vigencia",
    `Criterios revisados a octubre de 2026. Verifique actualizaciones normativas antes de aplicarlos a expedientes específicos.`
  ],
  ["url_csv_criterios", ""],
  ["url_csv_config", ""]
];

// --- log_cambios.csv (solo encabezado; lo llena Apps Script) ---------------
const LOG_CAMBIOS_HEADERS = ["fecha", "usuario", "accion", "codigo", "detalle"] as const;

// BOM UTF-8: sin esto, el importador de Google Sheets a veces adivina mal la
// codificación y los acentos salen como "InversiÃ³n".
const BOM = "﻿";

mkdirSync(OUT_DIR, { recursive: true });
writeFileSync(join(OUT_DIR, "criterios.csv"), BOM + toCsv([...CRITERIOS_HEADERS], criteriosRows), "utf8");
writeFileSync(join(OUT_DIR, "catalogos.csv"), BOM + toCsv([...CATALOGOS_HEADERS], catalogosRows), "utf8");
writeFileSync(join(OUT_DIR, "config.csv"), BOM + toCsv([...CONFIG_HEADERS], configRows), "utf8");
writeFileSync(join(OUT_DIR, "log_cambios.csv"), BOM + toCsv([...LOG_CAMBIOS_HEADERS], []), "utf8");

console.log(`Listo. ${criteriosRows.length} criterios, ${catalogosRows.length} filas de catálogo.`);
console.log(`Archivos escritos en ${OUT_DIR}`);
