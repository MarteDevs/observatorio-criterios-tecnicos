# Entrega y operación — Observatorio de Criterios Técnicos

Este documento es el punto de partida para quien reciba el proyecto: qué
existe hoy, quién lo tiene, y cómo se opera de ahí en adelante. Complementa
al SDD (`SDD – Checklist de Expedientes Técnicos...md`), que define el
alcance y los requisitos (RF/RNF).

## Estado de propiedad hoy

No hay ninguna cuenta institucional todavía. Mientras tanto:

| Componente | Dónde vive hoy | Acción pendiente |
| --- | --- | --- |
| Google Sheet (`criterios`, `catalogos`, `config`, `log_cambios`) | Cuenta de Google personal de quien desarrolló esto | Transferir propiedad del archivo (Drive) a la cuenta institucional en cuanto exista |
| Apps Script (panel "Checklist") | Ligado al Sheet de arriba | **No se transfiere solo** — quien reciba el Sheet debe abrir Extensiones > Apps Script y volver a autorizarlo con su propia cuenta |
| Repositorio de código | Solo local (`git init`, sin remoto) | Crear el repo en GitHub (cuenta/organización a definir) y hacer el primer `git push` |
| Sitio público | No publicado | Se activa solo al crear el repo en GitHub y habilitar Pages (ver abajo) |

## Cuando exista una cuenta institucional real

**Lo único que hace falta pedirle a la institución es un correo.** No tienen
que crear el Sheet ni darte acceso de editor a uno nuevo — el Sheet ya
existe, ya tiene los datos cargados y el panel Apps Script funcionando; lo
que se transfiere es ese archivo completo, no uno vacío. Pedir lo contrario
(que ellos lo creen y te den acceso) obliga a rehacer la carga de datos y
deja el Apps Script sin configurar del lado nuevo.

1. **Sheet**: en Drive, clic derecho sobre el archivo > Compartir > ícono de
   engranaje > agregar el correo institucional como propietario > el nuevo
   dueño acepta la transferencia desde su propio Drive.
2. **Apps Script**: desde la cuenta institucional, abrir el Sheet ya
   transferido > Extensiones > Apps Script > autorizar (botón "Revisar
   permisos"). El código (`appsscript/Code.gs`, `Sidebar.html`) no cambia.
3. **GitHub**: crear el repositorio en la cuenta/organización institucional
   (o crearlo en una cuenta temporal y usar Settings > Transfer ownership
   cuando exista la definitiva — a diferencia de Apps Script, GitHub sí
   transfiere repos de forma limpia).
4. **Secrets de GitHub Actions**: en Settings > Secrets and variables >
   Actions del repo, agregar `VITE_CRITERIOS_CSV_URL` con la URL publicada
   de la pestaña `criterios` (la misma que hoy está en `.env.local`, que
   nunca se sube al repo).
5. **GitHub Pages**: Settings > Pages > Source: "GitHub Actions". El
   workflow en `.github/workflows/deploy.yml` ya está listo — hace build de
   la página y del widget en cada `git push` a `main`, sin que nadie tenga
   que compilar ni subir archivos a mano.
6. Si el sitio queda en `usuario.github.io/nombre-del-repo/` (no en un
   dominio propio ni en la raíz de `usuario.github.io`), agregar la variable
   de repo `BASE_PATH` = `/nombre-del-repo/` y descomentar esa línea en el
   workflow.
7. **Dominio propio (opcional, no es costo cero)**: GitHub Pages ya da una
   URL gratis (`usuario.github.io/repo` o `usuario.github.io` si el repo se
   llama igual que la cuenta). Un dominio propio (ej. `observatorio.pe`) es
   un gasto anual aparte — si la institución ya tiene uno, se puede apuntar
   gratis a Pages con un registro CNAME; si no, lo más fiel al "costo cero"
   del SDD es quedarse con la URL de `github.io`.

## Cómo se maneja la actualización después de esto

Hay dos tipos de cambio, y solo uno necesita a alguien técnico:

- **Cambiar criterios (alta, edición, retiro)**: se hace desde el menú
  **Checklist** en el Sheet, o directo en la pestaña si se prefiere. No toca
  código, no hay que compilar ni desplegar nada. El cambio aparece en la
  página pública solo recargándola — con el margen de la caché de Google al
  "Publicar en la Web" (unos minutos, cumple el RNF-02 del SDD pero no es
  instantáneo).
- **Cambiar el sitio (diseño, nuevas secciones, arreglar algo)**: eso sí
  requiere editar el código y hacer `git push` a `main`. El workflow de
  GitHub Actions hace el resto solo.

## Ícono del navegador (favicon)

`public/favicon.svg` es un ícono propio (cuadrado navy con un check, acorde
al color del header) — no un intento de reproducir el escudo oficial de la
Universidad del Pacífico, porque no hay un archivo de marca oficial en este
repo y usar una aproximación no oficial como ícono público es un riesgo de
imagen institucional. Si la institución entrega su isotipo oficial en SVG o
PNG cuadrado, basta con reemplazar ese archivo.

## Limitaciones reales de este stack (costo cero)

- El CSV publicado de Sheets tiene su propia caché en los servidores de
  Google (no controlable desde este repo); por eso un cambio puede tardar
  unos minutos en reflejarse, no es instantáneo.
- No hay login de aplicación: el control de acceso depende enteramente de
  los permisos del Sheet (`ADMIN_EMAILS` en `Code.gs` + protección de rango).
  Alguien con acceso de Editor al archivo completo igual podría editar por
  fuera del rango protegido si se le dio ese nivel de acceso por error.
- GitHub Pages gratuito no tiene backend ni SLA — suficiente para un sitio
  estático de este tamaño, no pensado para alta disponibilidad crítica.
- Sin backups propios del lado del código/datos más allá del historial de
  versiones nativo de Google Sheets y el historial de Git.
