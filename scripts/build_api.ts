// Genera public/api/v1/{criterios,servicios}.json en cada build, para que
// cualquier consumidor que no ejecute JavaScript (buscadores, agentes,
// scripts, o un tercero como expedientecheck.com) lea los criterios del
// mismo origen, sin depender de las cuotas ni la redirección del endpoint
// de Apps Script. La página y el widget siguen leyendo en vivo tal como
// hoy — esto es un artefacto adicional, no reemplaza esa ruta, así que no
// afecta el tiempo de actualización que ya cumple el SDD (RNF-02).
// Correr con `bun` (no tsx/node): Bun implementa import.meta.env igual que
// Vite, que es lo que usan fetchRemoteCriteria/fetchRemoteServices.
import { mkdirSync, writeFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import { fetchRemoteCriteria } from "../src/data/remoteCriteria";
import { fetchRemoteServices } from "../src/data/remoteServices";

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT_DIR = join(__dirname, "..", "public", "api", "v1");

const servicesResult = await fetchRemoteServices();
const criteriaResult = await fetchRemoteCriteria(servicesResult.services);

// Los transversales (servicio=ALL) aparecen repetidos en cada bucket de
// tipología de criteriaResult.data; acá se exporta cada criterio una sola vez.
const seen = new Set<string>();
const criterios = Object.values(criteriaResult.data)
  .flat()
  .filter((c) => {
    if (seen.has(c.id)) return false;
    seen.add(c.id);
    return true;
  });

mkdirSync(OUT_DIR, { recursive: true });

writeFileSync(
  join(OUT_DIR, "criterios.json"),
  JSON.stringify(
    {
      version: "1.0.0",
      // Los 41 criterios de hoy aún no son la matriz validada por SECO.
      estado_dataset: "preliminar",
      fecha_corte: criteriaResult.updatedAt,
      fecha_generacion: new Date().toISOString(),
      fuente: criteriaResult.source,
      licencia: "CC-BY-4.0",
      total: criterios.length,
      criterios
    },
    null,
    2
  ),
  "utf8"
);

writeFileSync(
  join(OUT_DIR, "servicios.json"),
  JSON.stringify({ servicios: servicesResult.services, fuente: servicesResult.source }, null, 2),
  "utf8"
);

console.log(
  `api/v1 generado: ${criterios.length} criterios (fuente: ${criteriaResult.source}), ` +
    `${servicesResult.services.length} servicios (fuente: ${servicesResult.source}).`
);
