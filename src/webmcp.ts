// Capa opcional WebMCP (Chrome 149+, origin trial — API en document.modelContext,
// no navigator.modelContext como decía el documento de propuesta; verificado
// contra https://developer.chrome.com/docs/ai/webmcp/imperative-api).
// Expone 4 herramientas de solo lectura sobre los criterios ya cargados.
// Si el navegador no soporta la API, esta función no hace nada — cero
// impacto en quien no la tenga. La API sigue en discusión y puede cambiar;
// por eso queda aislada en este único archivo.
//
// Para que esto se active de verdad en producción falta un paso que no es
// código: registrar el token de origin trial para el dominio publicado en
// https://developer.chrome.com/origintrials/#/register_trial/4163014905550602241
// y pegarlo como <meta http-equiv="origin-trial" content="..."> en index.html.
import type { Criterion, ServiceDefinition } from "./data/criteriaData";

interface ModelContextTool {
  name: string;
  description: string;
  inputSchema: Record<string, unknown>;
  execute: (input: Record<string, unknown>) => Promise<string> | string;
  annotations?: { readOnlyHint?: boolean };
}

interface ModelContext {
  registerTool: (tool: ModelContextTool, options?: { signal?: AbortSignal }) => Promise<void>;
}

declare global {
  interface Document {
    modelContext?: ModelContext;
  }
}

function summarize(c: Criterion) {
  return {
    codigo: c.id,
    item: c.item,
    criterio: c.que,
    norma: c.norma,
    articulo_o_seccion: c.art,
    obligatoriedad: c.obl,
    diferencial: c.dif === "Sí",
    enlace_norma: c.enlace_norma ?? null
  };
}

/** Registra las 4 herramientas; devuelve una función para des-registrarlas (llamar al limpiar el efecto o al refrescar datos). */
export function registerWebMcpTools(
  data: Record<string, Criterion[]>,
  services: ServiceDefinition[]
): () => void {
  if (typeof document === "undefined" || !document.modelContext) return () => {};
  const mc = document.modelContext;
  const controller = new AbortController();
  const opts = { signal: controller.signal };

  mc.registerTool(
    {
      name: "listar_servicios",
      description:
        "Lista las tipologías de inversión del Observatorio de Criterios Técnicos, con su código, etiqueta y sector.",
      inputSchema: { type: "object", properties: {} },
      annotations: { readOnlyHint: true },
      execute: () => JSON.stringify(services.map((s) => ({ codigo: s.key, etiqueta: s.label, sector: s.sector })))
    },
    opts
  );

  mc.registerTool(
    {
      name: "buscar_criterios",
      description:
        "Busca criterios técnicos por texto libre en el ítem, criterio, norma o artículo, con filtros opcionales de servicio, sector y obligatoriedad.",
      inputSchema: {
        type: "object",
        properties: {
          texto: { type: "string", description: "Texto a buscar" },
          servicio: { type: "string", description: "Código de la tipología, ej. eess-c" },
          sector: { type: "string", description: "Código del sector, ej. MINSA" },
          obligatoriedad: { type: "string", enum: ["Obligatorio", "Condicional", "Recomendado"] }
        },
        required: ["texto"]
      },
      annotations: { readOnlyHint: true },
      execute: (input) => {
        const texto = String(input.texto || "").toLowerCase();
        const servicioFiltro = input.servicio ? String(input.servicio) : null;
        const sectorFiltro = input.sector ? String(input.sector).toLowerCase() : null;
        const obligatoriedadFiltro = input.obligatoriedad ? String(input.obligatoriedad) : null;

        const entries = servicioFiltro ? [[servicioFiltro, data[servicioFiltro] || []] as const] : Object.entries(data);
        const seen = new Set<string>();
        const resultados: ReturnType<typeof summarize>[] = [];
        for (const [, criterios] of entries) {
          for (const c of criterios) {
            if (seen.has(c.id)) continue;
            if (sectorFiltro && (c.sector || "").toLowerCase() !== sectorFiltro) continue;
            if (obligatoriedadFiltro && c.obl !== obligatoriedadFiltro) continue;
            if (!`${c.item} ${c.que} ${c.norma} ${c.art}`.toLowerCase().includes(texto)) continue;
            seen.add(c.id);
            resultados.push(summarize(c));
          }
        }
        return JSON.stringify(resultados.slice(0, 20));
      }
    },
    opts
  );

  mc.registerTool(
    {
      name: "obtener_checklist",
      description: "Devuelve la lista completa de criterios de una tipología, en orden, incluyendo los transversales.",
      inputSchema: {
        type: "object",
        properties: { servicio: { type: "string", description: "Código de la tipología, ej. eess-c" } },
        required: ["servicio"]
      },
      annotations: { readOnlyHint: true },
      execute: (input) => JSON.stringify((data[String(input.servicio)] || []).map(summarize))
    },
    opts
  );

  mc.registerTool(
    {
      name: "obtener_criterio",
      description: "Devuelve un criterio técnico específico por su código.",
      inputSchema: { type: "object", properties: { codigo: { type: "string" } }, required: ["codigo"] },
      annotations: { readOnlyHint: true },
      execute: (input) => {
        const codigo = String(input.codigo);
        for (const criterios of Object.values(data)) {
          const match = criterios.find((c) => c.id === codigo);
          if (match) return JSON.stringify(summarize(match));
        }
        return JSON.stringify({ error: `No se encontró el criterio ${codigo}` });
      }
    },
    opts
  );

  return () => controller.abort();
}
