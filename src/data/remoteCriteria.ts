// Capa de datos en vivo (RF-01/RF-04/RF-17, RNF-08): lee la pestaña `criterios`
// desde VITE_CRITERIOS_CSV_URL — admite tanto el CSV publicado de Sheets como
// el JSON del endpoint opcional de Apps Script (ver appsscript/README.md) —,
// con caché local y retorno a los datos de ejemplo si la fuente en vivo no
// está configurada o no responde.
import { SERVICES, INITIAL_DATA, type Criterion, type ServiceDefinition } from "./criteriaData";
import { normStr, mapHeaderToField, buildCriterionFromFields, type CriterionFieldKey } from "./normalize";

const CACHE_KEY = "app_remote_criterios_cache_v1";
const CSV_URL = (import.meta.env.VITE_CRITERIOS_CSV_URL as string | undefined)?.trim();

export type DataSource = "remote" | "cache" | "seed";

export interface RemoteCriteriaResult {
  data: Record<string, Criterion[]>;
  source: DataSource;
  /** Cuándo se obtuvo esta copia (remota o cacheada), para el aviso de RNF-08. */
  fetchedAt: string | null;
  /** Fecha de corte de los datos (máximo actualizado_el de las filas), para RF-19. */
  updatedAt: string | null;
}

/** Parser CSV mínimo (RFC 4180): comillas, comas y saltos de línea dentro de campos. */
export function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (inQuotes) {
      if (ch === '"') {
        if (text[i + 1] === '"') {
          field += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        field += ch;
      }
      continue;
    }
    if (ch === '"') {
      inQuotes = true;
    } else if (ch === ",") {
      row.push(field);
      field = "";
    } else if (ch === "\r") {
      // ignorado; el salto real lo marca \n
    } else if (ch === "\n") {
      row.push(field);
      rows.push(row);
      row = [];
      field = "";
    } else {
      field += ch;
    }
  }
  if (field.length > 0 || row.length > 0) {
    row.push(field);
    rows.push(row);
  }
  return rows.filter((r) => !(r.length === 1 && r[0].trim() === ""));
}

/**
 * Acepta tanto el CSV publicado de Sheets como el JSON del endpoint opcional
 * de Apps Script (doGet) — mismo VITE_CRITERIOS_CSV_URL sirve para los dos,
 * detectado por la forma del texto de respuesta.
 */
export function toRows(text: string): string[][] {
  const trimmed = text.trim();
  if (trimmed.startsWith("[")) {
    const json = JSON.parse(trimmed) as Record<string, unknown>[];
    if (json.length === 0) return [];
    const headers = Object.keys(json[0]);
    return [headers, ...json.map((obj) => headers.map((h) => String(obj[h] ?? "")))];
  }
  return parseCsv(text);
}

function rowsToCriteriaMap(
  rows: string[][],
  services: ServiceDefinition[]
): {
  data: Record<string, Criterion[]>;
  maxUpdatedAt: string | null;
} {
  const buckets: Record<string, Criterion[]> = {};
  for (const svc of services) buckets[svc.key] = [];
  if (rows.length < 2) return { data: buckets, maxUpdatedAt: null };

  const headers = rows[0].map((h) => mapHeaderToField(h));
  let maxUpdatedAt: string | null = null;

  for (const r of rows.slice(1)) {
    const obj: Partial<Record<CriterionFieldKey, string>> = {};
    headers.forEach((k, i) => {
      if (k && obj[k] === undefined) obj[k] = (r[i] ?? "").trim();
    });
    if (!obj.id) continue;

    // Regla del SDD: nunca se borra una fila, se marca Retirado; la página solo
    // muestra las vigentes.
    const estado = normStr(obj.estado || "vigente");
    if (estado.startsWith("retir")) continue;

    if (obj.actualizado_el && (!maxUpdatedAt || obj.actualizado_el > maxUpdatedAt)) {
      maxUpdatedAt = obj.actualizado_el;
    }

    const criterion = buildCriterionFromFields(obj);
    const servicio = normStr(obj.servicio || "");
    const sector = normStr(obj.sector || "");

    if (servicio === "all" || sector === "transversal") {
      for (const svc of services) buckets[svc.key].push(criterion);
      continue;
    }
    const target = services.find((s) => normStr(s.key) === servicio);
    if (target) buckets[target.key].push(criterion);
  }

  return { data: buckets, maxUpdatedAt };
}

function readCache(): { raw: string; fetchedAt: string } | null {
  try {
    const cached = localStorage.getItem(CACHE_KEY);
    return cached ? (JSON.parse(cached) as { raw: string; fetchedAt: string }) : null;
  } catch {
    return null;
  }
}

function writeCache(raw: string, fetchedAt: string) {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify({ raw, fetchedAt }));
  } catch {
    // cuota de almacenamiento llena: los datos en vivo siguen aplicando en esta sesión
  }
}

/** Fuente seed cuando no hay URL configurada ni caché disponible. */
function seedResult(): RemoteCriteriaResult {
  return { data: INITIAL_DATA, source: "seed", fetchedAt: null, updatedAt: null };
}

// Si ya se leyó la fuente hace menos de esto, se reusa esa copia en vez de
// volver a pedirla — reduce la carga sobre el CSV publicado sin importar de
// dónde venga el tráfico, y de paso acelera cargas repetidas.
const FRESH_WINDOW_MS = 3 * 60 * 1000;

export async function fetchRemoteCriteria(services: ServiceDefinition[] = SERVICES): Promise<RemoteCriteriaResult> {
  if (!CSV_URL) return seedResult();

  const cachedBeforeFetch = readCache();
  if (cachedBeforeFetch && Date.now() - new Date(cachedBeforeFetch.fetchedAt).getTime() < FRESH_WINDOW_MS) {
    const { data, maxUpdatedAt } = rowsToCriteriaMap(toRows(cachedBeforeFetch.raw), services);
    return { data, source: "remote", fetchedAt: cachedBeforeFetch.fetchedAt, updatedAt: maxUpdatedAt };
  }

  try {
    const res = await fetch(CSV_URL, { cache: "no-store" });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const text = await res.text();
    const { data, maxUpdatedAt } = rowsToCriteriaMap(toRows(text), services);
    const fetchedAt = new Date().toISOString();
    writeCache(text, fetchedAt);
    return { data, source: "remote", fetchedAt, updatedAt: maxUpdatedAt };
  } catch {
    const cached = readCache();
    if (cached) {
      const { data, maxUpdatedAt } = rowsToCriteriaMap(toRows(cached.raw), services);
      return { data, source: "cache", fetchedAt: cached.fetchedAt, updatedAt: maxUpdatedAt };
    }
    return seedResult();
  }
}
