# Servidor MCP remoto (opcional — mejora 4)

Expone por HTTP las mismas 4 herramientas de solo lectura que `src/webmcp.ts`
del sitio principal (que solo funciona dentro de un navegador con la API
experimental WebMCP), para que un cliente MCP que no es un navegador — por
ejemplo, el asistente de expedientecheck.com, si lo llega a necesitar —
pueda consultarlas directo.

Lee `api/v1/{criterios,servicios}.json` del sitio ya publicado (ver mejora
1 / Fase 2 en el repo principal). No toca el Google Sheet, no duplica
ninguna credencial, no tiene ninguna ruta de escritura.

GitHub Pages solo sirve archivos estáticos y no puede alojar esto — por eso
va en **Cloudflare Workers**, que tiene un plan gratuito permanente (costo
cero, igual que el resto del stack).

## Esto no está desplegado todavía

Requiere una cuenta de Cloudflare (gratis) que nadie ha creado todavía —
es una cuenta más que crear y, eventualmente, transferir a la institución,
igual que el Sheet y el repo de GitHub.

1. `bun install` en esta carpeta (`mcp-worker/`).
2. `bunx wrangler login` — abre el navegador, inicia sesión o crea la cuenta
   de Cloudflare.
3. `bunx wrangler deploy` — publica el Worker. Da una URL tipo
   `https://observatorio-criterios-mcp.<cuenta>.workers.dev`.
4. Esa URL es el endpoint MCP: acepta `POST` con JSON-RPC 2.0
   (`initialize`, `tools/list`, `tools/call`, `ping`). Un `GET` devuelve un
   mensaje simple de confirmación, para probar que está vivo.

## Antes de dejarlo corriendo en producción de verdad

El análisis que originó esto decía textualmente: *"decidirlo con
expedientecheck antes de construir nada"*. El código ya está listo y
probado localmente contra los datos reales — lo que falta es confirmar que
alguien externo lo va a usar, antes de mantener una cuenta y un servicio
más corriendo sin un consumidor confirmado.
