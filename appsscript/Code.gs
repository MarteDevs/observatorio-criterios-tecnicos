// Panel de administración de costo cero — Nivel 3 del SDD (Google Sheets + Apps
// Script, sin AppSheet). Vive dentro del propio Google Sheet: menú "Checklist".

var SHEET_CRITERIOS = "criterios";
var SHEET_CATALOGOS = "catalogos";
var SHEET_CONFIG = "config";
var SHEET_LOG = "log_cambios";

// Mismo orden de columnas que data-export/sheets/criterios.csv
var CRITERIOS_HEADERS = [
  "codigo", "sector", "servicio", "tipologia", "componente", "item", "criterio",
  "base_normativa", "articulo_o_seccion", "enlace_norma", "ambito",
  "obligatoriedad", "diferencial", "orden", "estado", "actualizado_el"
];

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
  var existingProtections = criterios.getProtections(SpreadsheetApp.ProtectionType.RANGE);
  existingProtections.forEach(function (p) {
    if (p.getRange().getRow() === 1 && p.getRange().getNumRows() === 1) p.remove();
  });
  var headerProtection = headerRange.protect().setDescription("Encabezado de criterios (no editar)");
  headerProtection.removeEditors(headerProtection.getEditors());

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
    "Listo: encabezado protegido y listas desplegables configuradas. " +
      "Agrega manualmente como editores del rango de datos (fila 2 en adelante) " +
      "a las 2-3 personas administradoras designadas (Protección > Compartir acceso)."
  );
}
