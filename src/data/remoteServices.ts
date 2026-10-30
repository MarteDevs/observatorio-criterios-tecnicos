// Carga dinámica de las pestañas de tipología (filas lista=servicio en la
// pestaña `catalogos`), para que un administrador pueda agregar una
// tipología nueva editando el Sheet, sin tocar código. Solo funciona cuando
// VITE_CRITERIOS_CSV_URL apunta al endpoint JSON de Apps Script (doGet) —
// un CSV publicado simple no permite pedir una segunda pestaña aparte; en
// ese modo, o si algo falla, se usa la lista fija de criteriaData.ts como
// respaldo, con un aviso visible (no silencioso) de que no se pudo
// confirmar la lista en vivo.
import { SERVICES, type ServiceDefinition } from "./criteriaData";
import { toRows } from "./remoteCriteria";

const CSV_URL = (import.meta.env.VITE_CRITERIOS_CSV_URL as string | undefined)?.trim();
const CACHE_KEY = "app_remote_services_cache_v1";

export type ServicesSource = "remote" | "cache" | "seed" | "error";

export interface RemoteServicesResult {
  services: ServiceDefinition[];
  source: ServicesSource;
}

function isAppsScriptEndpoint(url: string): boolean {
  return url.includes("script.google.com/macros/");
}

function buildCatalogosUrl(url: string): string {
  return url.includes("?") ? `${url}&sheet=catalogos` : `${url}?sheet=catalogos`;
}

function rowsToServices(rows: string[][]): ServiceDefinition[] {
  if (rows.length < 2) return [];
  const headers = rows[0].map((h) => h.trim().toLowerCase());
  const listaIdx = headers.indexOf("lista");
  const codigoIdx = headers.indexOf("codigo");
  const etiquetaIdx = headers.indexOf("etiqueta");
  const sectorIdx = headers.indexOf("sector");
  if (listaIdx < 0 || codigoIdx < 0) return [];

  return rows
    .slice(1)
    .filter((r) => (r[listaIdx] || "").trim().toLowerCase() === "servicio")
    .map((r) => ({
      key: (r[codigoIdx] || "").trim(),
      label: (r[etiquetaIdx] || "").trim() || (r[codigoIdx] || "").trim(),
      sector: (r[sectorIdx] || "").trim()
    }))
    .filter((s) => s.key.length > 0);
}

function readCache(): string | null {
  try {
    return localStorage.getItem(CACHE_KEY);
  } catch {
    return null;
  }
}

function writeCache(raw: string) {
  try {
    localStorage.setItem(CACHE_KEY, raw);
  } catch {
    // cuota de almacenamiento llena: se ignora, no es crítico para esta caché
  }
}

export async function fetchRemoteServices(): Promise<RemoteServicesResult> {
  if (!CSV_URL || !isAppsScriptEndpoint(CSV_URL)) {
    return { services: SERVICES, source: "seed" };
  }

  try {
    const res = await fetch(buildCatalogosUrl(CSV_URL), { cache: "no-store" });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const text = await res.text();
    const services = rowsToServices(toRows(text));
    if (services.length === 0) throw new Error("catalogos vacío o sin filas lista=servicio");
    writeCache(text);
    return { services, source: "remote" };
  } catch {
    const cached = readCache();
    if (cached) {
      const services = rowsToServices(toRows(cached));
      if (services.length > 0) return { services, source: "cache" };
    }
    // No se pudo confirmar la lista en vivo ni hay caché previa: se avisa en
    // vez de fallar en silencio, pero la página sigue funcional con la lista
    // fija en vez de quedar sin ninguna pestaña.
    return { services: SERVICES, source: "error" };
  }
}
