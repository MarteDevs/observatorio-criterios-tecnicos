# Panel de administración (Nivel 3 — Sheets + Apps Script)

Respaldo garantizado de costo cero del SDD: no depende de AppSheet. Corre
dentro del propio Google Sheet que ya tiene las 4 pestañas generadas por
`bun run export:sheet-seed` (`criterios`, `catalogos`, `config`, `log_cambios`).

## Puesta en marcha (lo hace la institución propietaria, no el consultor)

1. Crear el Google Sheet en la cuenta de la institución propietaria y pegar
   el contenido de `data-export/sheets/*.csv`, una pestaña por archivo.
2. En el Sheet: Extensiones > Apps Script. Esto crea un proyecto ligado al
   Sheet con su propio Script ID.
3. Instalar [`clasp`](https://github.com/google/clasp) localmente y autenticar
   con la cuenta de la institución: `clasp login`.
4. Copiar `.clasp.json.example` a `.clasp.json` dentro de esta carpeta y pegar
   el Script ID del paso 2.
5. Antes de subir el código, editar `Code.gs` y completar `ADMIN_EMAILS` con
   los correos de las 2-3 personas administradoras designadas (RF-02). Sin
   esto, el paso 7 deja el rango de datos sin ningún editor más que el
   propietario del archivo.
6. `clasp push` desde esta carpeta (`appsscript/`) para subir `Code.gs`,
   `Sidebar.html` y `appsscript.json`.
7. Recargar el Sheet. Aparece el menú **Checklist** en la barra superior.
8. Ejecutar **Checklist > Configurar protecciones y validaciones** una vez
   (autoriza los permisos que pida Google la primera vez). Esto protege el
   encabezado y el rango de datos de `criterios` (solo editable por
   `ADMIN_EMAILS`), bloquea `catalogos`/`config`/`log_cambios` para edición
   manual, y agrega las listas desplegables desde `catalogos`.
9. Archivo > Compartir > Publicar en la Web, publicar solo la pestaña
   `criterios` como CSV, y pegar esa URL en `VITE_CRITERIOS_CSV_URL`
   (`.env.local` del proyecto web).

## Endpoint JSON (opcional, alternativa dinámica al CSV publicado)

`doGet()` en `Code.gs` devuelve en JSON las filas `Vigente` de `criterios` —
de solo lectura, sin caché de Google de por medio (a diferencia de
"Publicar en la Web"). No activa nada hasta que se despliega:

1. En el editor de Apps Script: **Implementar > Nueva implementación**.
2. Tipo: **Aplicación web**. Ejecutar como: **Yo**. Quién tiene acceso:
   **Cualquier usuario**.
3. Implementar — copia la URL que termina en `/exec`.
4. Pegar esa URL como `VITE_CRITERIOS_CSV_URL` en `.env.local` (y en el
   secret de GitHub Actions) **en vez de** la URL del CSV publicado. El
   código del sitio detecta automáticamente si la URL responde JSON o CSV.

**Importante para actualizaciones futuras**: si después vuelves a tocar
`Code.gs` (p. ej. `clasp push` de un cambio), la URL de este paso **no se
actualiza sola**. Hay que ir a **Implementar > Gestionar implementaciones**,
editar la implementación existente (ícono de lápiz) y elegir **Nueva
versión** — así la misma URL sirve el código actualizado. Crear una
implementación nueva en vez de editar la existente genera una URL distinta
y rompe la que ya está en uso.

### Pestañas de tipología dinámicas (solo con este endpoint)

Con el endpoint JSON activo, las pestañas del Explorador ("Construcción de
EESS...", etc.) ya **no están fijas en el código** — se arman solas leyendo
las filas `lista = servicio` de `catalogos` (`${URL}?sheet=catalogos`, el
mismo `doGet` con un parámetro). Para agregar una tipología nueva, un
administrador solo necesita agregar una fila ahí (`codigo`, `etiqueta`,
`sector`) y empezar a cargar criterios con ese `servicio` — no hace falta
pedirle al consultor que edite código. Si la fuente configurada es el CSV
publicado simple (sin este endpoint), o si falla la lectura de `catalogos`,
el sitio muestra un aviso visible y usa la lista fija de siempre como
respaldo, para no quedar sin pestañas.

## Uso diario

- **Checklist > Nuevo criterio**: abre un formulario lateral con listas
  dependientes (sector → servicio); genera el código automáticamente y
  registra el alta en `log_cambios`.
- **Checklist > Retirar criterio…**: pide el código y marca
  `estado = Retirado` sin borrar la fila (regla del SDD: se preserva
  trazabilidad y los códigos no se reutilizan).
- **Checklist > Ver registro de cambios**: salta a la pestaña
  `log_cambios` (quién, cuándo, qué acción, sobre qué código).

## Qué no hace este nivel

No reemplaza a AppSheet si la institución ya lo tiene disponible (Niveles 1
o 2 del SDD) — es la alternativa cuando AppSheet no es viable. Las
protecciones de rango deben revisarse después de cualquier cambio grande de
columnas en `criterios`, o cuando cambie la lista de administradores (editar
`ADMIN_EMAILS` y volver a correr el paso 8).
