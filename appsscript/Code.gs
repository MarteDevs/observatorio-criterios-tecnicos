// Panel de administración de costo cero — Nivel 3 del SDD (Google Sheets + Apps
// Script, sin AppSheet). Vive dentro del propio Google Sheet: menú "Checklist".

var SHEET_CRITERIOS = "criterios";
var SHEET_CATALOGOS = "catalogos";
var SHEET_CONFIG = "config";
var SHEET_LOG = "log_cambios";

// Completa aquí los correos de las 2-3 personas administradoras designadas
// (RF-02). "Checklist > Configurar protecciones y validaciones" les da
// permiso de edición sobre el rango de datos de `criterios`; nadie fuera de
// esta lista (ni siquiera con acceso de Editor al archivo) puede tocarlo.
var ADMIN_EMAILS = [];

// Mismo orden de columnas que data-export/sheets/criterios.csv
var CRITERIOS_HEADERS = [
  "codigo", "sector", "servicio", "tipologia", "componente", "item", "criterio",
  "base_normativa", "articulo_o_seccion", "enlace_norma", "ambito",
  "obligatoriedad", "diferencial", "orden", "estado", "actualizado_el"
];

/**
 * Endpoint JSON de solo lectura (RF-01/04, alternativa dinámica al CSV
 * publicado). Se activa desplegándolo como "Aplicación web" (Implementar >
 * Nueva implementación) — ver appsscript/README.md. No existe doPost ni
 * ninguna función de escritura expuesta aquí: este endpoint físicamente no
 * puede modificar datos, pase lo que pase del lado de quien lo llame.
 */
function doGet() {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_CRITERIOS);
  var rows = sheet.getDataRange().getValues();
  var headers = rows[0].map(function (h) { return String(h).trim(); });
  var estadoIdx = headers.indexOf("estado");

  var data = rows.slice(1)
    .filter(function (r) { return String(r[estadoIdx] || "").trim() === "Vigente"; })
    .map(function (r) {
      var obj = {};
      headers.forEach(function (h, i) {
        var value = r[i];
        // Sheets devuelve las celdas de fecha como objeto Date; JSON.stringify
        // las serializaría como ISO completo (2026-10-29T05:00:00.000Z) en vez
        // de "2026-10-29" como hace el CSV publicado — se normaliza acá para
        // que el sitio reciba el mismo formato sin importar la fuente.
        obj[h] = value instanceof Date ? Utilities.formatDate(value, "America/Lima", "yyyy-MM-dd") : value;
      });
      return obj;
    });

  return ContentService.createTextOutput(JSON.stringify(data)).setMimeType(ContentService.MimeType.JSON);
}

function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu("Checklist")
    .addItem("Nuevo criterio", "showNuevoCriterioSidebar")
    .addItem("Retirar criterio…", "promptRetirarCriterio")
    .addSeparator()
    .addItem("Configurar protecciones y validaciones", "configurarProteccionesYValidaciones")
    .addItem("Ver registro de cambios", "irALogCambios")
    .addToUi();
}

function showNuevoCriterioSidebar() {
  var html = HtmlService.createHtmlOutputFromFile("Sidebar").setTitle("Nuevo criterio");
  SpreadsheetApp.getUi().showSidebar(html);
}

function irALogCambios() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(SHEET_LOG);
  if (sheet) ss.setActiveSheet(sheet);
}

/** Llamado desde Sidebar.html para poblar sector/servicio/tipología/etc. */
function getCatalogos() {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_CATALOGOS);
  if (!sheet) return { sectores: [], servicios: [], tipologias: [], obligatoriedades: [], diferenciales: [] };

  var rows = sheet.getDataRange().getValues();
  var headers = rows[0].map(function (h) { return String(h).trim().toLowerCase(); });
  var listaIdx = headers.indexOf("lista");
  var codigoIdx = headers.indexOf("codigo");
  var etiquetaIdx = headers.indexOf("etiqueta");
  var sectorIdx = headers.indexOf("sector");

  var out = { sectores: [], servicios: [], tipologias: [], obligatoriedades: [], diferenciales: [] };
  for (var i = 1; i < rows.length; i++) {
    var row = rows[i];
    var lista = String(row[listaIdx] || "").trim().toLowerCase();
    var item = { codigo: row[codigoIdx], etiqueta: row[etiquetaIdx], sector: row[sectorIdx] };
    if (lista === "sector") out.sectores.push(item);
    else if (lista === "servicio") out.servicios.push(item);
    else if (lista === "tipologia") out.tipologias.push(item);
    else if (lista === "obligatoriedad") out.obligatoriedades.push(item);
    else if (lista === "diferencial") out.diferenciales.push(item);
  }
  return out;
}

function generarCodigo_(servicioKey) {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_CRITERIOS);
  var data = sheet.getDataRange().getValues();
  var servicioIdx = CRITERIOS_HEADERS.indexOf("servicio");
  var count = 0;
  for (var i = 1; i < data.length; i++) {
    if (String(data[i][servicioIdx] || "").trim() === servicioKey) count++;
  }
  var seq = String(count + 1).padStart(3, "0");
  return servicioKey.toUpperCase() + "-" + seq;
}

/** Llamado desde Sidebar.html al enviar el formulario de "Nuevo criterio". */
function agregarCriterio(fields) {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_CRITERIOS);
  var codigo = generarCodigo_(fields.servicio);
  var hoy = Utilities.formatDate(new Date(), "America/Lima", "yyyy-MM-dd");

  var row = CRITERIOS_HEADERS.map(function (key) {
    if (key === "codigo") return codigo;
    if (key === "estado") return "Vigente";
    if (key === "actualizado_el") return hoy;
    return fields[key] !== undefined ? fields[key] : "";
  });

  sheet.appendRow(row);
  registrarCambio_("Alta", codigo, "Nuevo criterio agregado desde el panel lateral.");
  return codigo;
}

function promptRetirarCriterio() {
  var ui = SpreadsheetApp.getUi();
  var resp = ui.prompt("Retirar criterio", "Código del criterio a retirar (ej. EESS-C-007):", ui.ButtonSet.OK_CANCEL);
  if (resp.getSelectedButton() !== ui.Button.OK) return;
  var codigo = resp.getResponseText().trim();
  if (!codigo) return;

  var ok = retirarCriterio_(codigo);
  ui.alert(ok ? "Criterio " + codigo + " marcado como Retirado." : "No se encontró el código " + codigo + ".");
}

/**
 * Regla del SDD: nunca se borra una fila; se marca estado=Retirado y la
 * página pública deja de mostrarla, preservando la trazabilidad.
 */
function retirarCriterio_(codigo) {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_CRITERIOS);
  var data = sheet.getDataRange().getValues();
  var codigoIdx = CRITERIOS_HEADERS.indexOf("codigo");
  var estadoIdx = CRITERIOS_HEADERS.indexOf("estado");
  var actualizadoIdx = CRITERIOS_HEADERS.indexOf("actualizado_el");
  var hoy = Utilities.formatDate(new Date(), "America/Lima", "yyyy-MM-dd");

  for (var i = 1; i < data.length; i++) {
    if (String(data[i][codigoIdx] || "").trim() === codigo) {
      sheet.getRange(i + 1, estadoIdx + 1).setValue("Retirado");
      sheet.getRange(i + 1, actualizadoIdx + 1).setValue(hoy);
      registrarCambio_("Retiro", codigo, "Criterio marcado como Retirado desde el menú Checklist.");
      return true;
    }
  }
  return false;
}

function registrarCambio_(accion, codigo, detalle) {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_LOG);
  if (!sheet) return;
  var usuario = Session.getActiveUser().getEmail() || "desconocido";
  sheet.appendRow([new Date(), usuario, accion, codigo, detalle]);
}

/**
 * Ejecutar una sola vez (o cuando cambien los catálogos) desde el menú
 * Checklist. Protege el encabezado y agrega listas desplegables en
 * `criterios` a partir de `catalogos`, para quienes editan directo en Sheets.
 */
function configurarProteccionesYValidaciones() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var criterios = ss.getSheetByName(SHEET_CRITERIOS);
  var catalogos = ss.getSheetByName(SHEET_CATALOGOS);
  if (!criterios || !catalogos) {
    SpreadsheetApp.getUi().alert("No se encontraron las pestañas 'criterios' y/o 'catalogos'.");
    return;
  }

  var lastRow = Math.max(criterios.getLastRow(), 500);
  var H = CRITERIOS_HEADERS;

  // 1) Encabezado protegido: todos pueden ver, nadie más que el propietario edita.
  var headerRange = criterios.getRange(1, 1, 1, H.length);
  clearRangeProtections_(criterios, 1, 1);
  var headerProtection = headerRange.protect().setDescription("Encabezado de criterios (no editar)");
  headerProtection.removeEditors(headerProtection.getEditors());

  // 1b) Rango de datos (fila 2 en adelante): solo ADMIN_EMAILS puede editar,
  // nadie más aunque tenga acceso de Editor al archivo (RF-02).
  clearRangeProtections_(criterios, 2, lastRow - 1);
  var dataProtection = criterios
    .getRange(2, 1, lastRow - 1, H.length)
    .protect()
    .setDescription("Rango de datos de criterios (solo administradores)");
  dataProtection.removeEditors(dataProtection.getEditors());
  if (ADMIN_EMAILS.length > 0) dataProtection.addEditors(ADMIN_EMAILS);

  // 1c) Catálogos, config y el log de cambios no se editan a mano: el script
  // sí puede escribir en ellos (las protecciones de Sheets no bloquean las
  // llamadas de Apps Script, solo la edición manual desde la interfaz).
  [SHEET_CATALOGOS, SHEET_CONFIG, SHEET_LOG].forEach(function (name) {
    var sheet = ss.getSheetByName(name);
    if (!sheet) return;
    var existing = sheet.getProtections(SpreadsheetApp.ProtectionType.SHEET);
    existing.forEach(function (p) { p.remove(); });
    var protection = sheet.protect().setDescription(name + " (editar solo desde el menú Checklist o con cuidado)");
    protection.removeEditors(protection.getEditors());
    if (ADMIN_EMAILS.length > 0) protection.addEditors(ADMIN_EMAILS);
  });

  // 2) Listas desplegables en las columnas controladas, leyendo de `catalogos`.
  var catalogosRange = catalogos.getDataRange();
  var catHeaders = catalogosRange.getValues()[0].map(function (h) { return String(h).trim().toLowerCase(); });
  var listaColIdx = catHeaders.indexOf("lista") + 1;
  var codigoColIdx = catHeaders.indexOf("codigo") + 1;

  function buildValidationFor(listaValor) {
    var values = catalogosRange
      .getValues()
      .slice(1)
      .filter(function (r) { return String(r[listaColIdx - 1] || "").trim().toLowerCase() === listaValor; })
      .map(function (r) { return r[codigoColIdx - 1]; })
      .filter(Boolean);
    return SpreadsheetApp.newDataValidation().requireValueInList(values, true).setAllowInvalid(false).build();
  }

  var columnasConLista = {
    sector: "sector",
    servicio: "servicio",
    tipologia: "tipologia",
    obligatoriedad: "obligatoriedad",
    diferencial: "diferencial",
    estado: "estado"
  };

  Object.keys(columnasConLista).forEach(function (colKey) {
    var colIdx = H.indexOf(colKey) + 1;
    if (colIdx === 0) return;
    var rule = buildValidationFor(columnasConLista[colKey]);
    criterios.getRange(2, colIdx, lastRow - 1, 1).setDataValidation(rule);
  });

  // 3) Formato condicional: resaltar campos obligatorios vacíos.
  var requiredCols = ["codigo", "componente", "item", "criterio", "base_normativa"];
  var rules = criterios.getConditionalFormatRules().filter(function (r) {
    return r.getRanges().every(function (rg) { return rg.getRow() !== 2; });
  });
  requiredCols.forEach(function (colKey) {
    var colIdx = H.indexOf(colKey) + 1;
    if (colIdx === 0) return;
    var range = criterios.getRange(2, colIdx, lastRow - 1, 1);
    rules.push(
      SpreadsheetApp.newConditionalFormatRule()
        .whenCellEmpty()
        .setBackground("#f8d7da")
        .setRanges([range])
        .build()
    );
  });
  criterios.setConditionalFormatRules(rules);

  SpreadsheetApp.getUi().alert(
    ADMIN_EMAILS.length > 0
      ? "Listo: encabezado y pestañas auxiliares protegidos; " +
          ADMIN_EMAILS.length +
          " administrador(es) pueden editar el rango de datos de criterios."
      : "Listo: encabezado y pestañas auxiliares protegidos. ADVERTENCIA: ADMIN_EMAILS está vacío " +
          "en Code.gs, así que por ahora NADIE (ni siquiera los administradores) puede editar el rango " +
          "de datos salvo el propietario del archivo. Completa ADMIN_EMAILS y vuelve a ejecutar esta función."
  );
}

/** Quita protecciones de rango previas que se solapen con [startRow, startRow+numRows). */
function clearRangeProtections_(sheet, startRow, numRows) {
  var endRow = startRow + numRows - 1;
  sheet.getProtections(SpreadsheetApp.ProtectionType.RANGE).forEach(function (p) {
    var r = p.getRange();
    var rEnd = r.getRow() + r.getNumRows() - 1;
    if (r.getRow() <= endRow && rEnd >= startRow) p.remove();
  });
}
