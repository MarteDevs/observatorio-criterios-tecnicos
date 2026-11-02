// Cloudflare Worker: servidor MCP remoto (mejora 4, opcional) — expone por
// HTTP las mismas 4 herramientas de solo lectura que src/webmcp.ts (que solo
// funciona dentro de un navegador con la API experimental), para cualquier
// cliente MCP: agentes de backend, como el de expedientecheck.com si lo
// necesitan. Lee api/v1/{criterios,servicios}.json del sitio ya publicado
// (Fase 2) — no toca el Sheet, no duplica credenciales, no tiene escritura.
// GitHub Pages no puede alojar esto (solo sirve archivos estáticos); por eso
// va en Cloudflare Workers (plan gratuito, costo cero).
const API_BASE = "https://martedevs.github.io/observatorio-criterios-tecnicos/api/v1";
const PROTOCOL_VERSION = "2025-06-18";

// Mismos nombres de campo que public/api/v1/criterios.json (que son los del
// tipo Criterion interno, no los nombres largos de columna del Sheet —
// verificado contra el JSON real publicado, no asumido).
interface Criterio {
  id: string;
  sector?: string;
  servicio?: string;
  item: string;
  que: string;
  norma: string;
  art: string;
  obl: string;
  dif: string;
  enlace_norma?: string | null;
}

interface Servicio {
  key: string;
  label: string;
  sector: string;
}

async function loadJson<T>(path: string): Promise<T> {
  const res = await fetch(`${API_BASE}/${path}`, { cf: { cacheTtl: 300, cacheEverything: true } });
  if (!res.ok) throw new Error(`No se pudo leer ${path} (${res.status})`);
  return res.json();
}

function summarize(c: Criterio) {
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

const TOOLS = [
  {
    name: "listar_servicios",
    description:
      "Lista las tipologías de inversión del Observatorio de Criterios Técnicos, con su código, etiqueta y sector.",
    inputSchema: { type: "object", properties: {} }
  },
  {
    name: "buscar_criterios",
    description: "Busca criterios técnicos por texto libre, con filtros opcionales de servicio, sector y obligatoriedad.",
    inputSchema: {
      type: "object",
      properties: {
        texto: { type: "string" },
        servicio: { type: "string" },
        sector: { type: "string" },
        obligatoriedad: { type: "string", enum: ["Obligatorio", "Condicional", "Recomendado"] }
      },
      required: ["texto"]
    }
  },
  {
    name: "obtener_checklist",
    description: "Devuelve la lista completa de criterios de una tipología, en orden, incluyendo los transversales.",
    inputSchema: { type: "object", properties: { servicio: { type: "string" } }, required: ["servicio"] }
  },
  {
    name: "obtener_criterio",
    description: "Devuelve un criterio técnico específico por su código.",
    inputSchema: { type: "object", properties: { codigo: { type: "string" } }, required: ["codigo"] }
  }
] as const;

export async function callTool(name: string, args: Record<string, unknown>) {
  if (name === "listar_servicios") {
    const { servicios } = await loadJson<{ servicios: Servicio[] }>("servicios.json");
    return servicios.map((s) => ({ codigo: s.key, etiqueta: s.label, sector: s.sector }));
  }

  const { criterios } = await loadJson<{ criterios: Criterio[] }>("criterios.json");

  if (name === "buscar_criterios") {
    const texto = String(args.texto || "").toLowerCase();
    const servicioFiltro = args.servicio ? String(args.servicio) : null;
    const sectorFiltro = args.sector ? String(args.sector).toLowerCase() : null;
    const obligatoriedadFiltro = args.obligatoriedad ? String(args.obligatoriedad) : null;
    return criterios
      .filter((c) => !servicioFiltro || c.servicio === servicioFiltro || c.servicio === "ALL")
      .filter((c) => !sectorFiltro || (c.sector || "").toLowerCase() === sectorFiltro)
      .filter((c) => !obligatoriedadFiltro || c.obl === obligatoriedadFiltro)
      .filter((c) => `${c.item} ${c.que} ${c.norma} ${c.art}`.toLowerCase().includes(texto))
      .slice(0, 20)
      .map(summarize);
  }

  if (name === "obtener_checklist") {
    const servicio = String(args.servicio);
    return criterios.filter((c) => c.servicio === servicio || c.servicio === "ALL").map(summarize);
  }

  if (name === "obtener_criterio") {
    const codigo = String(args.codigo);
    const match = criterios.find((c) => c.id === codigo);
    return match ? summarize(match) : { error: `No se encontró el criterio ${codigo}` };
  }

  throw new Error(`Herramienta desconocida: ${name}`);
}

function jsonRpcResult(id: unknown, result: unknown): Response {
  return new Response(JSON.stringify({ jsonrpc: "2.0", id, result }), {
    headers: { "content-type": "application/json" }
  });
}

function jsonRpcError(id: unknown, code: number, message: string): Response {
  return new Response(JSON.stringify({ jsonrpc: "2.0", id, error: { code, message } }), {
    headers: { "content-type": "application/json" }
  });
}

export default {
  async fetch(request: Request): Promise<Response> {
    if (request.method === "GET") {
      return new Response(
        "Servidor MCP del Observatorio de Criterios Técnicos (solo lectura). Usar POST con JSON-RPC 2.0.",
        { status: 200 }
      );
    }
    if (request.method !== "POST") return new Response("Method not allowed", { status: 405 });

    let body: { id?: unknown; method?: string; params?: Record<string, unknown> };
    try {
      body = await request.json();
    } catch {
      return jsonRpcError(null, -32700, "Parse error");
    }

    const { id, method, params } = body;

    // Notificación (sin id, ej. notifications/initialized): sin cuerpo de respuesta.
    if (id === undefined) return new Response(null, { status: 202 });

    try {
      if (method === "initialize") {
        return jsonRpcResult(id, {
          protocolVersion: PROTOCOL_VERSION,
          capabilities: { tools: { listChanged: false } },
          serverInfo: { name: "observatorio-criterios-tecnicos", version: "1.0.0" },
          instructions:
            "Herramientas de solo lectura sobre la matriz de criterios técnicos para expedientes técnicos subnacionales. Dataset preliminar, aún no validado por SECO."
        });
      }
      if (method === "ping") return jsonRpcResult(id, {});
      if (method === "tools/list") return jsonRpcResult(id, { tools: TOOLS });

      if (method === "tools/call") {
        const name = String(params?.name || "");
        const tool = TOOLS.find((t) => t.name === name);
        if (!tool) return jsonRpcError(id, -32602, `Herramienta desconocida: ${name}`);
        const result = await callTool(name, (params?.arguments as Record<string, unknown>) || {});
        return jsonRpcResult(id, { content: [{ type: "text", text: JSON.stringify(result) }] });
      }

      return jsonRpcError(id, -32601, `Método no soportado: ${method}`);
    } catch (err) {
      return jsonRpcError(id, -32000, err instanceof Error ? err.message : "Error interno");
    }
  }
};
