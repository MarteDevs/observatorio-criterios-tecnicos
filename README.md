# Observatorio de Criterios Técnicos

Página pública y widget embebible con la matriz de criterios técnico-normativos
para la aprobación de expedientes técnicos de inversión pública subnacional
(Escuela de Gestión Pública, Universidad del Pacífico, en coordinación con la
DGPMI-MEF). Construido sobre el SDD en
[`SDD – Checklist de Expedientes Técnicos (widget embebible, costo cero).md`](<SDD – Checklist de Expedientes Técnicos (widget embebible, costo cero).md>).

Sitio publicado: https://martedevs.github.io/observatorio-criterios-tecnicos/

## Arquitectura

- **Fuente de datos**: Google Sheets. Se edita ahí (menú "Checklist" vía
  Apps Script, o directo en la celda) — ver [`appsscript/README.md`](appsscript/README.md).
- **Página y widget**: SPA en React 19 + Vite + Tailwind 4 (`src/App.tsx`).
  Lee los criterios en vivo desde la URL configurada en
  `VITE_CRITERIOS_CSV_URL` (CSV publicado de Sheets o el endpoint JSON del
  propio Apps Script — el código detecta cuál es), con caché local y datos
  de ejemplo como último respaldo.
- **Widget embebible** (`src/widget/`): versión sin React, web component
  `<checklist-expedientes>`, <30 KB — se genera aparte con `bun run build:widget`.
- **Despliegue**: GitHub Pages vía `.github/workflows/deploy.yml`, automático
  en cada push a `main`.

Operación completa (transferencia de cuentas, flujo de actualización,
limitaciones conocidas): [`ENTREGA.md`](ENTREGA.md).

## Correr en local

**Requisitos**: [Bun](https://bun.sh).

1. `bun install`
2. Copiar `.env.local.example` a `.env.local` y completar `VITE_CRITERIOS_CSV_URL`
   (opcional — sin esto se usan los datos de ejemplo)
3. `bun run dev`

## Licencia

Código bajo MIT ([`LICENSE`](LICENSE)). Los datos (criterios técnicos en
`data-export/`) bajo CC BY 4.0.
