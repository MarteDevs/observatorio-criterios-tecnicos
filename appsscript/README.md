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
