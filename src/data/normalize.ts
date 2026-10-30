import type { Criterion } from "./criteriaData";

export const normStr = (s: unknown): string =>
  String(s ?? "")
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .trim();

export type CriterionFieldKey =
  | "id"
  | "capa"
  | "n"
  | "item"
  | "que"
  | "norma"
  | "art"
  | "amb"
  | "obl"
  | "dif"
  | "sector"
  | "servicio"
  | "tipologia"
  | "enlace_norma"
  | "estado"
  | "actualizado_el";

export const FIELD_HEADER_ALIASES: Record<CriterionFieldKey, string[]> = {
  id: ["id", "codigo"],
  capa: ["capa", "bloque", "componente"],
  n: ["n item", "n° item", "no item", "item n", "numero", "orden"],
  item: ["item de verificacion", "item"],
  que: ["que debe contener", "como verificar", "criterio"],
  norma: ["norma", "base normativa"],
  art: ["articulo o seccion", "articulo", "seccion"],
  amb: ["ambito"],
  obl: ["obligatoriedad"],
  dif: ["diferencial"],
  sector: ["sector"],
  servicio: ["servicio"],
  tipologia: ["tipologia"],
  enlace_norma: ["enlace norma", "enlace a la norma", "url norma", "enlace_norma"],
  estado: ["estado"],
  actualizado_el: ["actualizado el", "fecha de actualizacion", "actualizado_el"]
};

/** Maps a raw column header (from an uploaded Excel sheet or a published Sheets CSV) to a known field key. */
export function mapHeaderToField(header: string): CriterionFieldKey | null {
  const clean = normStr(header).replace(/[°º./]/g, " ").replace(/\s+/g, " ");
  for (const [key, alts] of Object.entries(FIELD_HEADER_ALIASES) as [CriterionFieldKey, string[]][]) {
    if (alts.some((a) => clean.startsWith(normStr(a)))) return key;
  }
  return null;
}

/** Matches an Excel sheet name (one tab per service, legacy workbook format) to a SERVICES key. */
export function matchServiceKeyFromSheetName(name: string): string | null {
  const n = normStr(name);
  if (/constr.*(ees|salud)|(ees|salud).*constr/.test(n)) return "eess-c";
  if (/mejor.*(ees|salud)|(ees|salud).*mejor/.test(n)) return "eess-m";
  if (/(ie|educ|ebr)/.test(n)) return "ie-m";
  if (/crea.*san|san.*crea/.test(n)) return "san-c";
  if (/ampl.*san|san.*ampl/.test(n)) return "san-a";
  if (/mejor.*(via|vial)|(via|vial).*mejor/.test(n)) return "via-m";
  if (/rehab/.test(n)) return "via-r";
  return null;
}

export function normalizeObligatoriedad(raw: string): "Obligatorio" | "Condicional" | "Recomendado" {
  const r = normStr(raw);
  if (r.startsWith("obl")) return "Obligatorio";
  if (r.startsWith("con")) return "Condicional";
  return "Recomendado";
}

export function normalizeDiferencial(raw: string): "Sí" | "No" {
  return normStr(raw).startsWith("s") ? "Sí" : "No";
}

/** Builds a Criterion from a loosely-typed field bag produced by mapHeaderToField-based parsing. */
export function buildCriterionFromFields(obj: Partial<Record<CriterionFieldKey, string>>): Criterion {
  return {
    id: obj.id || `C-${Math.random().toString(36).substring(2, 6)}`,
    capa: obj.capa || "Sectorial",
    n: obj.n || "1",
    item: obj.item || "Ítem sin título",
    que: obj.que || "",
    norma: obj.norma || "Normativa aplicable",
    art: obj.art || "-",
    amb: obj.amb || "GL, GR",
    obl: normalizeObligatoriedad(obj.obl || ""),
    dif: normalizeDiferencial(obj.dif || ""),
    enlace_norma: obj.enlace_norma || undefined
  };
}
