import React, { useState, useMemo, useRef, useEffect } from "react";
import * as XLSX from "xlsx";
import {
  SERVICES,
  INITIAL_DATA,
  MESAS_DATA,
  type Criterion,
  type ServiceDefinition
} from "./data/criteriaData";
import { SPONSORS } from "./data/logos";
import { withBase } from "./data/assetPath";
import {
  normStr,
  mapHeaderToField,
  matchServiceKeyFromSheetName,
  buildCriterionFromFields
} from "./data/normalize";
import { fetchRemoteCriteria, type DataSource } from "./data/remoteCriteria";
import { fetchRemoteServices, type ServicesSource } from "./data/remoteServices";
import {
  Search,
  Filter,
  Layers,
  Table as TableIcon,
  LayoutGrid,
  Upload,
  Download,
  RotateCcw,
  CheckCircle2,
  XCircle,
  FileText,
  Calendar,
  Building2,
  ExternalLink,
  ChevronDown,
  Menu,
  X,
  Sun,
  Moon,
  Info,
  Copy,
  Check,
  AlertCircle,
  Code2
} from "lucide-react";

export default function App() {
  // Theme state
  const [theme, setTheme] = useState<"light" | "dark">(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("theme");
      if (saved === "light" || saved === "dark") return saved;
      return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
    }
    return "light";
  });

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("theme", theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === "light" ? "dark" : "light"));
  };

  // Mobile menu
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Criteria explorer state
  const [activeSvc, setActiveSvc] = useState<string>("eess-c");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [selectedObl, setSelectedObl] = useState<Set<string>>(
    new Set(["Obligatorio", "Condicional", "Recomendado"])
  );
  const [diffOnly, setDiffOnly] = useState<boolean>(false);
  const [viewMode, setViewMode] = useState<"table" | "cards">("table");
  const [criteriaData, setCriteriaData] = useState<Record<string, Criterion[]>>(INITIAL_DATA);
  const [uploadNote, setUploadNote] = useState<string | null>(null);
  const [selectedCriterion, setSelectedCriterion] = useState<Criterion | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const modalRef = useRef<HTMLDivElement>(null);

  // Accesibilidad del modal de detalle: cierre con Escape y foco inicial en el panel.
  useEffect(() => {
    if (!selectedCriterion) return;
    modalRef.current?.focus();
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setSelectedCriterion(null);
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [selectedCriterion]);

  // Live data source (RF-01/RF-04/RF-17, RNF-08): Google Sheets publicado > caché local > datos de ejemplo
  const [dataSource, setDataSource] = useState<DataSource | "loading">("loading");
  const [dataFetchedAt, setDataFetchedAt] = useState<string | null>(null);
  const [dataUpdatedAt, setDataUpdatedAt] = useState<string | null>(null);

  // Pestañas de tipología: se intentan armar solas desde catalogos (si la
  // fuente configurada es el endpoint JSON de Apps Script); si no se puede
  // confirmar en vivo, se avisa de forma visible y se usa la lista fija.
  const [services, setServices] = useState<ServiceDefinition[]>(SERVICES);
  const [servicesSource, setServicesSource] = useState<ServicesSource | "loading">("loading");

  const loadRemoteData = (onDone?: (source: DataSource) => void) => {
    fetchRemoteServices().then((servicesResult) => {
      setServices(servicesResult.services);
      setServicesSource(servicesResult.source);
      fetchRemoteCriteria(servicesResult.services).then((result) => {
        setCriteriaData(result.data);
        setDataSource(result.source);
        setDataFetchedAt(result.fetchedAt);
        setDataUpdatedAt(result.updatedAt);
        onDone?.(result.source);
      });
    });
  };

  useEffect(() => {
    loadRemoteData();
  }, []);

  // RF-07: filtrar a un solo sector desde la URL, ej. ?sector=MINSA
  const [sectorFilter, setSectorFilter] = useState<string | null>(null);

  useEffect(() => {
    const sector = new URLSearchParams(window.location.search).get("sector");
    if (!sector) return;
    setSectorFilter(sector);
    const match = services.find((s) => normStr(s.sector).includes(normStr(sector)));
    if (match) setActiveSvc(match.key);
  }, [services]);

  const visibleServices = useMemo(() => {
    if (!sectorFilter) return services;
    const matches = services.filter((s) => normStr(s.sector).includes(normStr(sectorFilter)));
    return matches.length > 0 ? matches : services;
  }, [services, sectorFilter]);

  // RF-06/RF-09: modo de inserción sin encabezado (?embed=1), para usar dentro de un <iframe>.
  const [isEmbed] = useState<boolean>(() => {
    if (typeof window === "undefined") return false;
    return new URLSearchParams(window.location.search).get("embed") === "1";
  });

  // RF-09: notifica al sitio anfitrión la altura real del contenido para que ajuste el iframe.
  useEffect(() => {
    if (!isEmbed || typeof window === "undefined" || window.parent === window) return;
    const postHeight = () => {
      window.parent.postMessage(
        { source: "observatorio-criterios", type: "resize", height: document.documentElement.scrollHeight },
        "*"
      );
    };
    postHeight();
    const observer = new ResizeObserver(postHeight);
    observer.observe(document.documentElement);
    return () => observer.disconnect();
  }, [isEmbed]);

  // Calendar filter state
  const [calendarFilter, setCalendarFilter] = useState<"all" | "confirmed" | "pending">("all");

  // Sección "Insertar" (RF-09/RF-10, RNF-10): genera los snippets listos para copiar
  const [embedMode, setEmbedMode] = useState<"iframe" | "script">("iframe");
  const [embedSector, setEmbedSector] = useState<string>("");
  const [embedStyle, setEmbedStyle] = useState<"default" | "heredado" | "personalizado">("default");
  const [embedColorPrimary, setEmbedColorPrimary] = useState("#1a2332");
  const [embedColorText, setEmbedColorText] = useState("#1f2933");
  const [embedColorBg, setEmbedColorBg] = useState("#ffffff");
  const [embedFont, setEmbedFont] = useState("");
  const [embedRadius, setEmbedRadius] = useState("4px");

  const siteUrl = useMemo(() => {
    if (typeof window === "undefined") return "";
    const base = (import.meta.env.BASE_URL || "/").replace(/\/$/, "");
    return `${window.location.origin}${base}`;
  }, []);

  const embedSectorQuery = embedSector ? `&sector=${embedSector}` : "";
  const embedSectorAttr = embedSector ? ` data-sector="${embedSector}"` : "";

  const embedStyleAttrs =
    embedStyle === "heredado"
      ? ` data-style="heredado"`
      : embedStyle === "personalizado"
      ? ` data-style="personalizado" data-color-primary="${embedColorPrimary}" data-color-text="${embedColorText}" data-color-bg="${embedColorBg}"${
          embedFont ? ` data-font="${embedFont}"` : ""
        } data-radius="${embedRadius}"`
      : "";

  const iframeSnippet = `<iframe
  id="observatorio-criterios-iframe"
  src="${siteUrl}/?embed=1${embedSectorQuery}"
  title="Observatorio de Criterios Técnicos para Expedientes Técnicos Subnacionales"
  style="width:100%;border:0;display:block;min-height:480px;"
></iframe>
<script>
  window.addEventListener("message", function (event) {
    var data = event.data;
    if (!data || data.source !== "observatorio-criterios" || data.type !== "resize") return;
    var iframe = document.getElementById("observatorio-criterios-iframe");
    if (iframe && typeof data.height === "number") iframe.style.height = data.height + "px";
  });
</script>`;

  const scriptSnippet = `<script src="${siteUrl}/widget.js" defer></script>
<checklist-expedientes${embedSectorAttr}${embedStyleAttrs}></checklist-expedientes>`;

  const embedSnippet = embedMode === "iframe" ? iframeSnippet : scriptSnippet;


  const fileInputRef = useRef<HTMLInputElement>(null);

  const currentService = useMemo<ServiceDefinition>(() => {
    return services.find((s) => s.key === activeSvc) || services[0] || SERVICES[0];
  }, [services, activeSvc]);

  const pairedService = useMemo<ServiceDefinition | undefined>(() => {
    if (!currentService.par) return undefined;
    return services.find((s) => s.key === currentService.par);
  }, [services, currentService]);

  // Filtered criteria
  const currentCriteriaList = useMemo(() => {
    return criteriaData[activeSvc] || [];
  }, [criteriaData, activeSvc]);

  const isDif = (r: Criterion) => r.dif.toLowerCase().startsWith("s");

  const formatBusinessDate = (isoDate: string) =>
    new Date(`${isoDate}T12:00:00`).toLocaleDateString("es-PE", {
      day: "numeric",
      month: "long",
      year: "numeric"
    });

  const formatDateTime = (iso: string) =>
    new Date(iso).toLocaleString("es-PE", {
      day: "numeric",
      month: "long",
      hour: "2-digit",
      minute: "2-digit"
    });

  const filteredCriteria = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    return currentCriteriaList.filter((r) => {
      if (!selectedObl.has(r.obl)) return false;
      if (diffOnly && !isDif(r)) return false;
      if (q) {
        const textBlob = [r.id, r.capa, r.item, r.que, r.norma, r.art, r.amb]
          .join(" ")
          .toLowerCase();
        const keywords = q.split(/\s+/).filter(Boolean);
        const matchesAll = keywords.every((k) => textBlob.includes(k));
        if (!matchesAll) return false;
      }
      return true;
    });
  }, [currentCriteriaList, selectedObl, diffOnly, searchQuery]);

  const differentialCount = useMemo(() => {
    return filteredCriteria.filter(isDif).length;
  }, [filteredCriteria]);

  const toggleObl = (obl: string) => {
    setSelectedObl((prev) => {
      const next = new Set(prev);
      if (next.has(obl)) {
        next.delete(obl);
      } else {
        next.add(obl);
      }
      if (next.size === 0) {
        return new Set(["Obligatorio", "Condicional", "Recomendado"]);
      }
      return next;
    });
  };

  // Excel loader
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const data = new Uint8Array(evt.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: "array" });
        const loadedSheets: string[] = [];
        const updatedData: Record<string, Criterion[]> = { ...criteriaData };

        workbook.SheetNames.forEach((sheetName) => {
          const targetKey = matchServiceKeyFromSheetName(sheetName);
          if (!targetKey) return;

          const raw = XLSX.utils.sheet_to_json<string[]>(workbook.Sheets[sheetName], {
            header: 1,
            defval: ""
          });
          const headerIdx = raw.findIndex((row) =>
            row.some((cell) => normStr(cell) === "id" || normStr(cell) === "codigo")
          );
          if (headerIdx < 0) return;

          const headers = raw[headerIdx].map((h) => mapHeaderToField(String(h)));
          const idColIdx = headers.indexOf("id");
          if (idColIdx < 0) return;

          const rows: Criterion[] = raw
            .slice(headerIdx + 1)
            .filter((r) => String(r[idColIdx] || "").trim().length > 0)
            .map((r) => {
              const obj: Partial<Record<NonNullable<(typeof headers)[number]>, string>> = {};
              headers.forEach((k, i) => {
                if (k && obj[k] === undefined) obj[k] = String(r[i] || "").trim();
              });
              return buildCriterionFromFields(obj);
            });

          if (rows.length > 0) {
            updatedData[targetKey] = rows;
            loadedSheets.push(sheetName);
          }
        });

        if (loadedSheets.length > 0) {
          setCriteriaData(updatedData);
          setUploadNote(
            `Se cargaron con éxito ${loadedSheets.length} hoja(s): ${loadedSheets.join(
              ", "
            )}. Los datos están vigentes en tu sesión local.`
          );
        } else {
          setUploadNote(
            "No se reconoció ninguna hoja compatible. Asegúrate de que las pestañas contengan nombres como 'Construcción EESS', 'Educación', 'Saneamiento', etc. y una columna con encabezado 'ID'."
          );
        }
      } catch {
        setUploadNote(
          "Error al procesar el archivo. Por favor verifica que sea un archivo Excel (.xlsx, .xls) válido con una hoja por servicio."
        );
      }
    };
    reader.readAsArrayBuffer(file);
    e.target.value = "";
  };

  const handleDownloadExcel = () => {
    try {
      const wb = XLSX.utils.book_new();
      services.forEach((svc) => {
        const rows = criteriaData[svc.key] || [];
        const exportData = rows.map((r) => ({
          ID: r.id,
          Capa: r.capa,
          "N°": r.n,
          "Ítem de verificación": r.item,
          "Qué debe contener / cómo verificar": r.que,
          "Norma exacta": r.norma,
          "Artículo / sección": r.art,
          Ámbito: r.amb,
          Obligatoriedad: r.obl,
          Diferencial: r.dif
        }));
        const ws = XLSX.utils.json_to_sheet(exportData);
        XLSX.utils.book_append_sheet(wb, ws, svc.label.slice(0, 31));
      });
      XLSX.writeFile(wb, "Observatorio_Criterios_Tecnicos_UP_MEF.xlsx");
    } catch (err) {
      console.error(err);
    }
  };

  const handleResetData = () => {
    setUploadNote("Actualizando criterios desde la fuente en vivo…");
    loadRemoteData((source) => {
      const message =
        source === "remote"
          ? "Se recargaron los criterios desde la fuente en vivo (Google Sheets)."
          : source === "cache"
          ? "No se pudo contactar la fuente en vivo; se restableció la última copia guardada en caché."
          : "Se restablecieron los criterios de ejemplo del observatorio (fuente en vivo no configurada).";
      setUploadNote(message);
      setTimeout(() => setUploadNote(null), 4000);
    });
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Filtered calendar mesas
  const filteredMesas = useMemo(() => {
    if (calendarFilter === "confirmed") return MESAS_DATA.filter((m) => m.ok);
    if (calendarFilter === "pending") return MESAS_DATA.filter((m) => !m.ok);
    return MESAS_DATA;
  }, [calendarFilter]);

  return (
    <div className="min-h-screen flex flex-col selection:bg-blue-100 selection:text-slate-900">
      {/* HEADER */}
      {!isEmbed && (
      <header className="sticky top-0 z-30 bg-[#1a2332] text-white shadow-md">
        <div className="max-w-[1240px] mx-auto px-4 sm:px-6 flex items-center justify-between min-h-[64px]">
          <a
            href="#inicio"
            className="flex items-center gap-3 text-white no-underline group"
            aria-label="Universidad del Pacífico, Escuela de Gestión Pública"
          >
            <img
              src={withBase("/logos/pacifico-egp-up.png")}
              alt="Universidad del Pacífico - Escuela de Gestión Pública"
              className="h-10 w-auto object-contain shrink-0 drop-shadow-xs"
            />
            <div className="hidden sm:block w-[1px] h-8 bg-white/25 mx-1" />
            <div className="hidden sm:flex flex-col">
              <span className="text-[12px] leading-tight text-white font-semibold">
                Observatorio de Criterios Técnicos
              </span>
              <span className="text-[10px] text-slate-300">
                Expedientes Técnicos Subnacionales
              </span>
            </div>
          </a>

          <div className="flex items-center gap-3">
            <nav className="hidden md:flex items-center gap-5 text-[12px] font-medium tracking-wide uppercase">
              <a
                href="#inicio"
                className="text-white/85 hover:text-white hover:border-b-2 hover:border-white/60 py-1 transition-colors no-underline"
              >
                Inicio
              </a>
              <a
                href="#nota"
                className="text-white/85 hover:text-white hover:border-b-2 hover:border-white/60 py-1 transition-colors no-underline"
              >
                Nota metodológica
              </a>
              <a
                href="#criterios"
                className="text-white/85 hover:text-white hover:border-b-2 hover:border-white/60 py-1 transition-colors no-underline"
              >
                Criterios
              </a>
              <a
                href="#entidades"
                className="text-white/85 hover:text-white hover:border-b-2 hover:border-white/60 py-1 transition-colors no-underline"
              >
                Entidades
              </a>
              <a
                href="#calendario"
                className="text-white/85 hover:text-white hover:border-b-2 hover:border-white/60 py-1 transition-colors no-underline"
              >
                Calendario
              </a>
              <a
                href="#insertar"
                className="text-white/85 hover:text-white hover:border-b-2 hover:border-white/60 py-1 transition-colors no-underline"
              >
                Insertar
              </a>
              <a
                href="#contacto"
                className="text-white/85 hover:text-white hover:border-b-2 hover:border-white/60 py-1 transition-colors no-underline"
              >
                Contacto
              </a>
            </nav>

            {/* Dark / Light Toggle */}
            <button
              onClick={toggleTheme}
              className="p-2 text-white/80 hover:text-white rounded hover:bg-white/10 transition-colors"
              title={theme === "dark" ? "Cambiar a modo claro" : "Cambiar a modo oscuro"}
              aria-label="Alternar tema claro y oscuro"
            >
              {theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
            </button>

            {/* Mobile menu trigger */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 text-white/90 border border-white/30 rounded hover:bg-white/10"
              aria-expanded={mobileMenuOpen}
              aria-label="Abrir menú"
            >
              {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>

        {/* Mobile menu dropdown */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-[#243044] border-t border-white/10 px-6 py-4 flex flex-col gap-3">
            <a
              href="#inicio"
              onClick={() => setMobileMenuOpen(false)}
              className="text-sm font-medium text-white/90 hover:text-white py-1 border-b border-white/10 no-underline"
            >
              Inicio
            </a>
            <a
              href="#nota"
              onClick={() => setMobileMenuOpen(false)}
              className="text-sm font-medium text-white/90 hover:text-white py-1 border-b border-white/10 no-underline"
            >
              Nota metodológica
            </a>
            <a
              href="#criterios"
              onClick={() => setMobileMenuOpen(false)}
              className="text-sm font-medium text-white/90 hover:text-white py-1 border-b border-white/10 no-underline"
            >
              Criterios técnicos
            </a>
            <a
              href="#entidades"
              onClick={() => setMobileMenuOpen(false)}
              className="text-sm font-medium text-white/90 hover:text-white py-1 border-b border-white/10 no-underline"
            >
              Entidades convocadas
            </a>
            <a
              href="#calendario"
              onClick={() => setMobileMenuOpen(false)}
              className="text-sm font-medium text-white/90 hover:text-white py-1 border-b border-white/10 no-underline"
            >
              Calendario de mesas
            </a>
            <a
              href="#insertar"
              onClick={() => setMobileMenuOpen(false)}
              className="text-sm font-medium text-white/90 hover:text-white py-1 border-b border-white/10 no-underline"
            >
              Insertar en tu sitio
            </a>
            <a
              href="#contacto"
              onClick={() => setMobileMenuOpen(false)}
              className="text-sm font-medium text-white/90 hover:text-white py-1 no-underline"
            >
              Contacto
            </a>
          </div>
        )}
      </header>
      )}

      <main className="flex-1">
        {/* HERO SECTION */}
        {!isEmbed && (
        <section id="inicio" className="border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-[#121821] py-12 lg:py-16">
          <div className="max-w-[1240px] mx-auto px-4 sm:px-6">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-start">
              <div className="lg:col-span-8">
                <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-[#1a2332] dark:text-blue-300 pb-3 mb-5 border-b border-slate-200 dark:border-slate-800">
                  <span>Inversión Pública Subnacional</span>
                  <span className="text-slate-300 dark:text-slate-600" aria-hidden="true">
                    ·
                  </span>
                  <span className="font-medium normal-case tracking-normal text-slate-500 dark:text-slate-400">
                    Directiva DGPMI – MEF · Ley N.° 32069
                  </span>
                </div>
                <h1 className="font-display text-3xl sm:text-4xl lg:text-[44px] font-semibold text-slate-900 dark:text-slate-100 leading-[1.15] tracking-tight mb-5 text-balance">
                  Observatorio de Criterios Técnicos para Expedientes Técnicos Subnacionales
                </h1>
                <p className="text-lg text-slate-600 dark:text-slate-400 max-w-[65ch] leading-relaxed mb-7">
                  Espacio académico de sistematización de la Escuela de Gestión Pública de la Universidad del Pacífico, en coordinación con la Dirección General de Programación Multianual de Inversiones (DGPMI) del MEF.
                </p>

                {/* Academic Stamp */}
                <div className="border-l-4 border-[#1a2332] dark:border-blue-400 bg-slate-50 dark:bg-[#18202b] p-5 rounded-r">
                  <strong className="font-display italic block text-slate-900 dark:text-slate-100 text-lg font-medium mb-2">
                    Carácter académico del ejercicio
                  </strong>
                  <p className="text-slate-700 dark:text-slate-300 text-sm leading-relaxed mb-3">
                    Este observatorio sistematiza criterios técnicos de la normativa de Inversión Pública, la Ley N° 32069 y las normas sectoriales, contrastados en Mesas Técnicas Sectoriales.
                  </p>
                  <ul className="list-disc list-outside pl-5 text-sm text-slate-700 dark:text-slate-300 space-y-1.5">
                    <li>Lo discutido en las mesas se publica sin atribuir opiniones a personas ni entidades.</li>
                    <li>
                      Los criterios no son obligatorios por sí mismos. Los que tienen base normativa son exigibles según la norma citada; otros se proponen como recomendaciones a partir de la experiencia técnica de los especialistas.
                    </li>
                  </ul>
                </div>
              </div>

              {/* Aside: Quick Index of Typologies */}
              <aside className="lg:col-span-4 bg-slate-50/70 dark:bg-[#18202b]/70 border-t-3 border-[#1a2332] dark:border-blue-400 p-5 rounded-b">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-xs uppercase font-bold tracking-wider text-slate-500 dark:text-slate-400">
                    Tipologías sistematizadas
                  </h3>
                  <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                    {visibleServices.length} servicio{visibleServices.length !== 1 ? "s" : ""}
                  </span>
                </div>
                <div className="divide-y divide-slate-200 dark:divide-slate-800">
                  {visibleServices.map((svc) => (
                    <a
                      key={svc.key}
                      href="#criterios"
                      onClick={() => setActiveSvc(svc.key)}
                      className={`flex items-center justify-between py-3 text-sm no-underline transition-colors ${
                        activeSvc === svc.key
                          ? "text-blue-700 dark:text-blue-400 font-semibold"
                          : "text-slate-800 dark:text-slate-200 hover:text-blue-600"
                      }`}
                    >
                      <span className="line-clamp-1 pr-2">{svc.label}</span>
                      <span className="text-xs text-slate-500 dark:text-slate-400 shrink-0 font-normal">
                        {svc.sector.split("/")[0].trim()}
                      </span>
                    </a>
                  ))}
                </div>
              </aside>
            </div>

            {/* LOGOS / SPONSORS ROW */}
            <div className="mt-12 pt-8 border-t border-slate-200 dark:border-slate-800">
              <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    Instituciones organizadoras y colaboradoras
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
                {/* ORGANIZA */}
                <div className="md:col-span-4">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                      Organiza
                    </h3>
                  </div>
                  <div className="relative rounded p-2.5 h-[92px] flex items-center justify-center shadow-xs overflow-hidden bg-white border border-slate-200 dark:border-slate-700 dark:ring-1 dark:ring-white/5">
                    <div className="w-full h-full flex items-center justify-center p-1">
                      <img
                        src={withBase("/logos/pacifico-egp-up-dark.png")}
                        alt="Universidad del Pacífico"
                        className="max-h-[66px] max-w-full object-contain mx-auto"
                      />
                    </div>
                  </div>
                  <div className="text-[11px] text-slate-400 mt-1.5">
                    Coordinación con la Dirección General de Programación Multianual de Inversiones (DGPMI) - MEF.
                  </div>
                </div>

                {/* CON EL APOYO DE */}
                <div className="md:col-span-8">
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">
                    Con el apoyo de
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {SPONSORS.map((sp) => (
                      <div
                        key={sp.id}
                        className="relative group bg-white border border-slate-200 dark:border-slate-700 dark:ring-1 dark:ring-white/5 rounded px-3 py-2 h-[92px] flex items-center justify-center shadow-xs hover:border-slate-400 dark:hover:border-slate-500 transition-colors overflow-hidden"
                        title={sp.name}
                      >
                        <img
                          src={sp.imageSrc || withBase(`/logos/${sp.id}.png`)}
                          alt={sp.name}
                          className="max-h-[62px] max-w-full object-contain mx-auto"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
        )}

        {/* NOTA METODOLÓGICA */}
        {!isEmbed && (
        <section id="nota" className="scroll-mt-16">
          <div className="bg-slate-100 dark:bg-slate-800/80 border-y border-slate-200 dark:border-slate-800 py-3.5">
            <div className="max-w-[1240px] mx-auto px-4 sm:px-6 flex items-center gap-3">
              <FileText className="text-slate-700 dark:text-slate-300 shrink-0" size={20} />
              <h2 className="text-sm font-bold uppercase tracking-wider text-slate-900 dark:text-slate-100">
                Nota metodológica
              </h2>
            </div>
          </div>

          <div className="max-w-[1240px] mx-auto px-4 sm:px-6 py-10 lg:py-14">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-12">
              <div className="space-y-3">
                <h3 className="font-display text-lg font-medium text-slate-900 dark:text-slate-100 flex items-center gap-2">
                  <CheckCircle2 size={18} className="text-emerald-600 dark:text-emerald-400" />
                  Qué es este ejercicio
                </h3>
                <ul className="space-y-2 text-sm text-slate-700 dark:text-slate-300 pl-6 list-disc">
                  <li>Una sistematización académica de los criterios que las normas vigentes exigen a un expediente técnico, organizada por tipología de inversión.</li>
                  <li>Un espacio de contraste entre la rectoría del sistema, los sectores, gobiernos subnacionales y especialistas.</li>
                  <li>Un insumo público para que las autoridades subnacionales conozcan con anticipación qué se revisa en cada tipología.</li>
                </ul>
              </div>

              <div className="space-y-3">
                <h3 className="font-display text-lg font-medium text-slate-900 dark:text-slate-100 flex items-center gap-2">
                  <XCircle size={18} className="text-rose-600 dark:text-rose-400" />
                  Qué no es
                </h3>
                <ul className="space-y-2 text-sm text-slate-700 dark:text-slate-300 pl-6 list-disc">
                  <li>No valida, certifica ni recomienda herramientas o servicios privados.</li>
                  <li>No evalúa a entidades, proyectos ni funcionarios.</li>
                  <li>No reemplaza la norma: ante cualquier diferencia, prevalece la fuente oficial.</li>
                </ul>
              </div>

              <div className="space-y-3">
                <h3 className="font-display text-lg font-medium text-slate-900 dark:text-slate-100 flex items-center gap-2">
                  <Info size={18} className="text-blue-600 dark:text-blue-400" />
                  Regla de trabajo de las mesas
                </h3>
                <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
                  Lo discutido se sistematiza y difunde de forma agregada. Ninguna opinión o posición se atribuye a una persona o entidad en particular. Las entidades se listan como participantes del espacio, no como autoras de los criterios.
                </p>
              </div>

              <div className="space-y-3">
                <h3 className="font-display text-lg font-medium text-slate-900 dark:text-slate-100 flex items-center gap-2">
                  <Building2 size={18} className="text-amber-600 dark:text-amber-400" />
                  Fuentes normativas
                </h3>
                <ul className="space-y-1.5 text-sm text-slate-700 dark:text-slate-300 list-disc pl-6">
                  <li>Sistema Nacional de Programación Multianual y Gestión de Inversiones y su Directiva General, MEF.</li>
                  <li>Ley N° 32069, Ley General de Contrataciones Públicas, y su Reglamento (DS N° 009-2025-EF).</li>
                  <li>Normas técnicas sectoriales de MINSA, MINEDU, MVCS y MTC, y el Reglamento Nacional de Edificaciones.</li>
                </ul>
              </div>
            </div>

            <div className="mt-8 p-4 bg-slate-100 dark:bg-slate-800 text-xs sm:text-sm text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 rounded flex items-center gap-2">
              <AlertCircle size={16} className="text-amber-600 shrink-0" />
              <span>
                <strong>Vigencia:</strong>{" "}
                {dataUpdatedAt
                  ? `criterios actualizados al ${formatBusinessDate(dataUpdatedAt)}.`
                  : "criterios revisados a octubre de 2026."}{" "}
                Verifique actualizaciones normativas antes de aplicarlos a expedientes específicos.
              </span>
            </div>
          </div>
        </section>
        )}

        {/* EXPLORADOR DE CRITERIOS */}
        <section id="criterios" className="scroll-mt-16 bg-slate-50/50 dark:bg-[#141a23] py-8 lg:py-12 border-t border-slate-200 dark:border-slate-800">
          <div className="max-w-[1240px] mx-auto px-4 sm:px-6">
            <div className="flex items-center gap-3 mb-6">
              <Layers className="text-slate-700 dark:text-slate-300" size={24} />
              <div>
                <h2 className="font-display text-2xl sm:text-[28px] font-semibold text-slate-900 dark:text-slate-100">
                  Explorador de Criterios Técnicos
                </h2>
                <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
                  Sistematización de ítems de verificación por sector y tipología de inversión
                </p>
              </div>
            </div>

            {/* Service Tabs */}
            <div className="border-b border-slate-200 dark:border-slate-700 flex gap-1 overflow-x-auto custom-scroll pb-px mb-4">
              {visibleServices.map((s) => {
                const isActive = s.key === activeSvc;
                const count = (criteriaData[s.key] || []).length;
                return (
                  <button
                    key={s.key}
                    onClick={() => setActiveSvc(s.key)}
                    className={`px-4 py-3 text-left font-medium whitespace-nowrap border-b-2 transition-all cursor-pointer ${
                      isActive
                        ? "border-[#1a2332] dark:border-blue-400 text-slate-900 dark:text-white bg-white dark:bg-slate-800 shadow-xs"
                        : "border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-100/60 dark:hover:bg-slate-800/40"
                    }`}
                  >
                    <div className="text-sm font-semibold flex items-center gap-2">
                      <span>{s.label}</span>
                      <span className="text-[11px] font-normal px-1.5 py-0.2 bg-slate-100 dark:bg-slate-700 rounded text-slate-500 dark:text-slate-300">
                        {count}
                      </span>
                    </div>
                    <small className="block text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                      {s.sector}
                    </small>
                  </button>
                );
              })}
            </div>

            {/* Academic note for active service */}
            <div className="bg-blue-50/70 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900/60 rounded p-3 text-xs sm:text-sm text-blue-900 dark:text-blue-200 flex items-start gap-2.5 mb-5">
              <Info size={17} className="shrink-0 text-blue-600 dark:text-blue-400 mt-0.5" />
              <div>
                <strong>{currentService.label}:</strong> criterios sistematizados desde la normativa vigente y la experiencia de especialistas, contrastados en mesa técnica, sin atribución a personas ni entidades.
                {pairedService && (
                  <span className="ml-1 text-amber-800 dark:text-amber-300 font-medium">
                    Los marcados en ámbar son exclusivos de esta tipología frente a "{pairedService.label}".
                  </span>
                )}
              </div>
            </div>

            {/* Controls Bar */}
            <div className="bg-white dark:bg-slate-800 p-4 border border-slate-200 dark:border-slate-700 rounded shadow-xs space-y-3 mb-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                {/* Search Input */}
                <div className="flex-1 min-w-[260px] relative">
                  <Search
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                    size={16}
                  />
                  <input
                    type="search"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Buscar por criterio, norma, artículo o palabra clave..."
                    aria-label="Buscar criterios técnicos"
                    className="w-full pl-9 pr-8 py-2 text-sm bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded focus:bg-white dark:focus:bg-slate-900 text-slate-900 dark:text-white placeholder-slate-400"
                  />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery("")}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    >
                      <X size={14} />
                    </button>
                  )}
                </div>

                {/* Obligatoriedad Chips */}
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="text-xs text-slate-500 dark:text-slate-400 mr-1 flex items-center gap-1">
                    <Filter size={13} />
                    Filtro:
                  </span>
                  {(["Obligatorio", "Condicional", "Recomendado"] as const).map((obl) => {
                    const active = selectedObl.has(obl);
                    return (
                      <button
                        key={obl}
                        onClick={() => toggleObl(obl)}
                        className={`text-xs px-3 py-1.5 rounded-full border transition-all cursor-pointer font-medium ${
                          active
                            ? obl === "Obligatorio"
                              ? "bg-emerald-100 dark:bg-emerald-950/70 border-emerald-300 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200"
                              : obl === "Condicional"
                              ? "bg-amber-100 dark:bg-amber-950/70 border-amber-300 dark:border-amber-800 text-amber-900 dark:text-amber-200"
                              : "bg-slate-200 dark:bg-slate-700 border-slate-300 dark:border-slate-600 text-slate-800 dark:text-slate-200"
                            : "bg-transparent border-slate-200 dark:border-slate-700 text-slate-400 opacity-60"
                        }`}
                      >
                        {obl}
                      </button>
                    );
                  })}
                </div>

                {/* Only differentials Switch */}
                <label className="flex items-center gap-2 text-xs sm:text-sm text-slate-700 dark:text-slate-300 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={diffOnly}
                    onChange={(e) => setDiffOnly(e.target.checked)}
                    className="w-4 h-4 accent-amber-600 rounded"
                  />
                  <span>Solo diferenciales</span>
                </label>

                {/* View Mode Switch */}
                <div className="flex items-center border border-slate-300 dark:border-slate-700 rounded overflow-hidden">
                  <button
                    onClick={() => setViewMode("table")}
                    className={`px-3 py-1.5 text-xs font-medium flex items-center gap-1.5 cursor-pointer ${
                      viewMode === "table"
                        ? "bg-slate-200 dark:bg-slate-700 text-slate-900 dark:text-white font-semibold"
                        : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                    }`}
                  >
                    <TableIcon size={14} />
                    Tabla
                  </button>
                  <button
                    onClick={() => setViewMode("cards")}
                    className={`px-3 py-1.5 text-xs font-medium flex items-center gap-1.5 cursor-pointer ${
                      viewMode === "cards"
                        ? "bg-slate-200 dark:bg-slate-700 text-slate-900 dark:text-white font-semibold"
                        : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                    }`}
                  >
                    <LayoutGrid size={14} />
                    Tarjetas
                  </button>
                </div>
              </div>

              {/* Status Counters & Actions */}
              <div className="flex flex-wrap items-center justify-between text-xs text-slate-500 dark:text-slate-400 pt-2 border-t border-slate-100 dark:border-slate-700/60">
                <div>
                  Mostrando <strong className="text-slate-800 dark:text-slate-200">{filteredCriteria.length}</strong> de{" "}
                  <strong>{currentCriteriaList.length}</strong> criterios técnicos
                  {differentialCount > 0 && (
                    <span className="ml-1 text-amber-700 dark:text-amber-400 font-medium">
                      ({differentialCount} diferencial{differentialCount > 1 ? "es" : ""})
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-3">
                  <button
                    onClick={handleDownloadExcel}
                    className="inline-flex items-center gap-1 text-slate-600 dark:text-slate-300 hover:text-blue-600 hover:underline cursor-pointer"
                    title="Exportar todas las fichas a Excel (.xlsx)"
                  >
                    <Download size={13} />
                    Descargar fichas en Excel
                  </button>
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="inline-flex items-center gap-1 text-slate-600 dark:text-slate-300 hover:text-blue-600 hover:underline cursor-pointer"
                    title="Cargar archivo Excel con criterios modificados"
                  >
                    <Upload size={13} />
                    Cargar Excel local
                  </button>
                  <button
                    onClick={handleResetData}
                    className="inline-flex items-center gap-1 text-slate-500 hover:text-rose-600 cursor-pointer"
                    title="Restablecer datos originales"
                  >
                    <RotateCcw size={13} />
                    Restablecer
                  </button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".xlsx,.xls,.csv"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                </div>
              </div>
            </div>

            {/* Data source status (RNF-08): solo se muestra cuando no se logró leer la fuente en vivo */}
            {dataSource === "cache" && (
              <div className="bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-800 text-amber-900 dark:text-amber-200 px-4 py-2.5 rounded text-xs flex items-center gap-2.5 mb-4">
                <AlertCircle size={15} className="shrink-0" />
                <span>
                  Sin conexión con la fuente en vivo. Mostrando la última copia guardada
                  {dataFetchedAt ? ` el ${formatDateTime(dataFetchedAt)}` : ""}.
                </span>
              </div>
            )}
            {dataSource === "seed" && (
              <div className="bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 px-4 py-2.5 rounded text-xs flex items-center gap-2.5 mb-4">
                <Info size={15} className="shrink-0" />
                <span>
                  Mostrando datos de ejemplo del observatorio. La conexión a la fuente en vivo (Google Sheets) aún no está configurada.
                </span>
              </div>
            )}

            {/* Aviso visible (no silencioso) si no se pudo confirmar en vivo la lista de tipologías */}
            {servicesSource === "error" && (
              <div className="bg-rose-50 dark:bg-rose-950/60 border border-rose-300 dark:border-rose-800 text-rose-900 dark:text-rose-200 px-4 py-2.5 rounded text-xs flex items-center gap-2.5 mb-4 font-medium">
                <AlertCircle size={15} className="shrink-0" />
                <span>
                  No se pudo confirmar en vivo la lista de tipologías desde `catalogos`. Mostrando la lista fija como respaldo — puede estar desactualizada si se agregó una tipología nueva recientemente.
                </span>
              </div>
            )}

            {/* Notification Bar */}
            {uploadNote && (
              <div className="bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200 px-4 py-2.5 rounded text-xs flex items-center justify-between gap-3 mb-4">
                <span>{uploadNote}</span>
                <button
                  onClick={() => setUploadNote(null)}
                  className="text-emerald-700 hover:text-emerald-900"
                >
                  <X size={14} />
                </button>
              </div>
            )}

            {/* RESULTS CONTENT */}
            {filteredCriteria.length === 0 ? (
              <div className="bg-white dark:bg-slate-800 border border-dashed border-slate-300 dark:border-slate-700 rounded p-12 text-center text-slate-500 dark:text-slate-400">
                <AlertCircle className="mx-auto mb-3 text-slate-400" size={32} />
                <p className="font-semibold text-base text-slate-700 dark:text-slate-300 mb-1">
                  Ningún criterio técnico coincide con los filtros aplicados
                </p>
                <p className="text-xs text-slate-500">
                  Prueba borrando términos de búsqueda o activando más niveles de obligatoriedad.
                </p>
                <button
                  onClick={() => {
                    setSearchQuery("");
                    setSelectedObl(new Set(["Obligatorio", "Condicional", "Recomendado"]));
                    setDiffOnly(false);
                  }}
                  className="mt-4 px-3 py-1.5 text-xs bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 text-slate-700 dark:text-slate-200 rounded font-medium cursor-pointer"
                >
                  Limpiar filtros
                </button>
              </div>
            ) : viewMode === "table" ? (
              /* TABLE VIEW */
              <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded shadow-xs overflow-hidden">
                <div className="overflow-x-auto custom-scroll">
                  <table className="w-full text-left text-xs sm:text-sm border-collapse min-w-[1080px]">
                    <thead>
                      <tr className="bg-slate-100 dark:bg-slate-900 text-slate-700 dark:text-slate-300 font-semibold border-b border-slate-200 dark:border-slate-700">
                        <th className="py-3 px-3.5 w-20">ID</th>
                        <th className="py-3 px-3 w-12 text-center">N°</th>
                        <th className="py-3 px-3.5 min-w-[220px]">Ítem de verificación</th>
                        <th className="py-3 px-3.5 min-w-[300px]">Qué debe contener / cómo verificar</th>
                        <th className="py-3 px-3.5 min-w-[200px]">Norma exacta</th>
                        <th className="py-3 px-3.5 min-w-[160px]">Artículo / sección</th>
                        <th className="py-3 px-3 w-24">Ámbito</th>
                        <th className="py-3 px-3.5 w-28">Obligatoriedad</th>
                        <th className="py-3 px-3.5 w-24">Diferencial</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 dark:divide-slate-700/80">
                      {(() => {
                        let currentCapa = "";
                        return filteredCriteria.map((r) => {
                          const showCapaHeader = r.capa !== currentCapa;
                          currentCapa = r.capa;
                          const differential = isDif(r);

                          return (
                            <React.Fragment key={r.id}>
                              {showCapaHeader && (
                                <tr className="bg-slate-100/80 dark:bg-slate-900/60 font-semibold text-xs text-slate-700 dark:text-slate-300">
                                  <td colSpan={9} className="py-2 px-3.5 border-t border-slate-300 dark:border-slate-700">
                                    <span className="uppercase tracking-wider text-[11px] text-slate-500 dark:text-slate-400">
                                      Bloque / Capa:
                                    </span>{" "}
                                    {r.capa}
                                  </td>
                                </tr>
                              )}
                              <tr
                                onClick={() => setSelectedCriterion(r)}
                                onKeyDown={(e) => {
                                  if (e.key === "Enter" || e.key === " ") {
                                    e.preventDefault();
                                    setSelectedCriterion(r);
                                  }
                                }}
                                tabIndex={0}
                                role="button"
                                aria-label={`Ver detalle de ${r.id}: ${r.item}`}
                                className={`transition-colors cursor-pointer group focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-blue-500 ${
                                  differential
                                    ? "bg-amber-50/70 dark:bg-amber-950/30 hover:bg-amber-100/70 dark:hover:bg-amber-950/50"
                                    : "hover:bg-slate-50 dark:hover:bg-slate-700/40"
                                }`}
                              >
                                <td className="py-3 px-3.5 font-mono font-semibold text-slate-800 dark:text-slate-200 text-xs border-l-4 border-transparent group-hover:border-blue-500">
                                  <div className="flex items-center gap-1.5">
                                    {r.id}
                                    {differential && (
                                      <span className="w-1.5 h-1.5 rounded-full bg-amber-500" title="Diferencial" />
                                    )}
                                  </div>
                                </td>
                                <td className="py-3 px-3 text-center text-slate-500 dark:text-slate-400 text-xs">
                                  {r.n}
                                </td>
                                <td className="py-3 px-3.5 font-medium text-slate-900 dark:text-slate-100">
                                  {r.item}
                                </td>
                                <td className="py-3 px-3.5 text-slate-700 dark:text-slate-300 text-xs leading-relaxed">
                                  {r.que}
                                </td>
                                <td className="py-3 px-3.5 text-slate-700 dark:text-slate-300 text-xs">
                                  {r.norma}
                                </td>
                                <td className="py-3 px-3.5 text-slate-600 dark:text-slate-400 text-xs">
                                  {r.art}
                                </td>
                                <td className="py-3 px-3 text-slate-600 dark:text-slate-400 text-xs">
                                  {r.amb}
                                </td>
                                <td className="py-3 px-3.5">
                                  <span
                                    className={`inline-block px-2 py-0.5 rounded text-[11px] font-semibold whitespace-nowrap ${
                                      r.obl === "Obligatorio"
                                        ? "bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300"
                                        : r.obl === "Condicional"
                                        ? "bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300"
                                        : "bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300"
                                    }`}
                                  >
                                    {r.obl}
                                  </span>
                                </td>
                                <td className="py-3 px-3.5">
                                  {differential ? (
                                    <span className="inline-block px-2 py-0.5 rounded text-[11px] font-semibold bg-amber-100 dark:bg-amber-900/60 border border-amber-300 dark:border-amber-700 text-amber-800 dark:text-amber-200">
                                      Diferencial
                                    </span>
                                  ) : (
                                    <span className="text-slate-400 text-xs">No</span>
                                  )}
                                </td>
                              </tr>
                            </React.Fragment>
                          );
                        });
                      })()}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : (
              /* CARDS VIEW */
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredCriteria.map((r) => {
                  const differential = isDif(r);
                  return (
                    <article
                      key={r.id}
                      onClick={() => setSelectedCriterion(r)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault();
                          setSelectedCriterion(r);
                        }
                      }}
                      tabIndex={0}
                      role="button"
                      aria-label={`Ver detalle de ${r.id}: ${r.item}`}
                      className={`border rounded p-4 flex flex-col justify-between transition-shadow hover:shadow-md cursor-pointer focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500 ${
                        differential
                          ? "bg-amber-50/50 dark:bg-amber-950/20 border-amber-300 dark:border-amber-800/60 border-l-4 border-l-amber-500"
                          : "bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700"
                      }`}
                    >
                      <div>
                        <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 mb-2">
                          <span className="font-mono font-bold text-slate-800 dark:text-slate-200">
                            {r.id} · Ítem {r.n}
                          </span>
                          <span className="truncate max-w-[150px] text-right font-medium">
                            {r.capa}
                          </span>
                        </div>

                        <h4 className="font-semibold text-base text-slate-900 dark:text-slate-100 mb-2 leading-snug">
                          {r.item}
                        </h4>

                        <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed mb-4">
                          {r.que}
                        </p>

                        <dl className="text-xs space-y-1 pt-2 border-t border-slate-100 dark:border-slate-700/60">
                          <div className="grid grid-cols-3 gap-1">
                            <dt className="text-slate-400">Norma:</dt>
                            <dd className="col-span-2 text-slate-700 dark:text-slate-300 font-medium">
                              {r.norma}
                            </dd>
                          </div>
                          <div className="grid grid-cols-3 gap-1">
                            <dt className="text-slate-400">Sección:</dt>
                            <dd className="col-span-2 text-slate-700 dark:text-slate-300">
                              {r.art}
                            </dd>
                          </div>
                          <div className="grid grid-cols-3 gap-1">
                            <dt className="text-slate-400">Ámbito:</dt>
                            <dd className="col-span-2 text-slate-700 dark:text-slate-300">
                              {r.amb}
                            </dd>
                          </div>
                        </dl>
                      </div>

                      <div className="flex items-center justify-between pt-3 mt-3 border-t border-slate-100 dark:border-slate-700/60">
                        <span
                          className={`px-2 py-0.5 rounded text-[11px] font-semibold ${
                            r.obl === "Obligatorio"
                              ? "bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300"
                              : r.obl === "Condicional"
                              ? "bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300"
                              : "bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300"
                          }`}
                        >
                          {r.obl}
                        </span>

                        {differential && (
                          <span className="text-[11px] font-semibold text-amber-700 dark:text-amber-300 border border-amber-300 dark:border-amber-700 rounded px-1.5 py-0.5 bg-amber-50 dark:bg-amber-950/80">
                            Diferencial
                          </span>
                        )}
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
          </div>
        </section>

        {/* MODAL / DRAWER FOR DETAIL INSPECTION */}
        {selectedCriterion && (
          <div
            className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4 backdrop-blur-xs"
            onClick={() => setSelectedCriterion(null)}
          >
            <div
              ref={modalRef}
              role="dialog"
              aria-modal="true"
              aria-labelledby="criterion-modal-title"
              tabIndex={-1}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg max-w-2xl w-full p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto focus:outline-none"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-start justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-3">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-mono font-bold text-sm bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded text-slate-800 dark:text-slate-200">
                      {selectedCriterion.id}
                    </span>
                    <span className="text-xs text-slate-500">
                      {selectedCriterion.capa} · Ítem {selectedCriterion.n}
                    </span>
                    {isDif(selectedCriterion) && (
                      <span className="text-xs bg-amber-100 text-amber-800 px-2 py-0.5 rounded font-semibold">
                        Diferencial
                      </span>
                    )}
                  </div>
                  <h3 id="criterion-modal-title" className="text-lg font-bold text-slate-900 dark:text-slate-100">
                    {selectedCriterion.item}
                  </h3>
                </div>
                <button
                  onClick={() => setSelectedCriterion(null)}
                  className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="space-y-3 text-sm">
                <div>
                  <strong className="block text-xs uppercase tracking-wider text-slate-500 mb-1">
                    Qué debe contener / cómo verificar
                  </strong>
                  <p className="bg-slate-50 dark:bg-slate-800/60 p-3 rounded border border-slate-200 dark:border-slate-700 leading-relaxed text-slate-800 dark:text-slate-200">
                    {selectedCriterion.que}
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded border border-slate-200 dark:border-slate-700">
                    <span className="block text-xs uppercase tracking-wider text-slate-500 mb-1">
                      Norma exacta
                    </span>
                    <p className="font-medium text-slate-800 dark:text-slate-200">
                      {selectedCriterion.norma}
                    </p>
                    {selectedCriterion.enlace_norma?.startsWith("https://") && (
                      <a
                        href={selectedCriterion.enlace_norma}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 mt-1.5 text-xs font-medium text-blue-600 dark:text-blue-400 hover:underline"
                      >
                        Ver norma oficial <ExternalLink size={11} />
                      </a>
                    )}
                  </div>

                  <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded border border-slate-200 dark:border-slate-700">
                    <span className="block text-xs uppercase tracking-wider text-slate-500 mb-1">
                      Artículo / Sección
                    </span>
                    <p className="font-medium text-slate-800 dark:text-slate-200">
                      {selectedCriterion.art}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded border border-slate-200 dark:border-slate-700">
                    <span className="block text-xs uppercase tracking-wider text-slate-500 mb-1">
                      Ámbito de aplicación
                    </span>
                    <p className="font-medium text-slate-800 dark:text-slate-200">
                      {selectedCriterion.amb}
                    </p>
                  </div>

                  <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded border border-slate-200 dark:border-slate-700">
                    <span className="block text-xs uppercase tracking-wider text-slate-500 mb-1">
                      Obligatoriedad
                    </span>
                    <p className="font-semibold text-slate-800 dark:text-slate-200">
                      {selectedCriterion.obl}
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-slate-200 dark:border-slate-800 text-xs">
                <span className="text-slate-500">
                  Tipología: {currentService.label}
                </span>
                <button
                  onClick={() =>
                    copyToClipboard(
                      `${selectedCriterion.id} - ${selectedCriterion.item}\n${selectedCriterion.que}\nNorma: ${selectedCriterion.norma} (${selectedCriterion.art})`,
                      selectedCriterion.id
                    )
                  }
                  className="inline-flex items-center gap-1 px-3 py-1.5 bg-blue-600 text-white rounded hover:bg-blue-700 font-medium cursor-pointer"
                >
                  {copiedId === selectedCriterion.id ? (
                    <>
                      <Check size={14} /> Copiado
                    </>
                  ) : (
                    <>
                      <Copy size={14} /> Copiar ficha
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ENTIDADES CONVOCADAS */}
        {!isEmbed && (
        <section id="entidades" className="scroll-mt-16 py-12 lg:py-16 border-t border-slate-200 dark:border-slate-800">
          <div className="max-w-[1240px] mx-auto px-4 sm:px-6">
            <div className="flex items-center gap-3 mb-2">
              <Building2 className="text-slate-700 dark:text-slate-300" size={22} />
              <h2 className="font-display text-2xl sm:text-[28px] font-semibold text-slate-900 dark:text-slate-100">
                Entidades Convocadas
              </h2>
            </div>
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-8 max-w-3xl">
              Se listan como entidades convocadas a las mesas de trabajo técnico. Su inclusión expresa su rol en el ecosistema de la inversión pública y no implica respaldo unilateral ni autoría individual de los criterios publicados.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {/* Rectoría */}
              <div className="bg-slate-50 dark:bg-slate-800/70 p-5 rounded border border-slate-200 dark:border-slate-700">
                <h3 className="text-xs uppercase font-bold tracking-wider text-slate-500 dark:text-slate-400 mb-4 pb-2 border-b border-slate-200 dark:border-slate-700">
                  Rectoría del sistema
                </h3>
                <div className="space-y-3">
                  <div className="bg-white dark:bg-slate-800 p-3 rounded border border-slate-200 dark:border-slate-700">
                    <span className="font-semibold text-sm text-slate-800 dark:text-slate-100 block">
                      MEF · DGPMI
                    </span>
                    <span className="text-xs text-slate-500 dark:text-slate-400">
                      Rectoría de Inversión Pública
                    </span>
                  </div>
                </div>
              </div>

              {/* Sectores */}
              <div className="bg-slate-50 dark:bg-slate-800/70 p-5 rounded border border-slate-200 dark:border-slate-700">
                <h3 className="text-xs uppercase font-bold tracking-wider text-slate-500 dark:text-slate-400 mb-4 pb-2 border-b border-slate-200 dark:border-slate-700">
                  Sectores
                </h3>
                <div className="space-y-3">
                  <div className="bg-white dark:bg-slate-800 p-2.5 rounded border border-slate-200 dark:border-slate-700">
                    <span className="font-semibold text-sm text-slate-800 dark:text-slate-100 block">
                      MINSA / PRONIS
                    </span>
                    <span className="text-xs text-slate-500">Sector Salud</span>
                  </div>
                  <div className="bg-white dark:bg-slate-800 p-2.5 rounded border border-slate-200 dark:border-slate-700">
                    <span className="font-semibold text-sm text-slate-800 dark:text-slate-100 block">
                      MINEDU
                    </span>
                    <span className="text-xs text-slate-500">Sector Educación</span>
                  </div>
                  <div className="bg-white dark:bg-slate-800 p-2.5 rounded border border-slate-200 dark:border-slate-700">
                    <span className="font-semibold text-sm text-slate-800 dark:text-slate-100 block">
                      MVCS
                    </span>
                    <span className="text-xs text-slate-500">Vivienda, Construcción y Saneamiento</span>
                  </div>
                  <div className="bg-white dark:bg-slate-800 p-2.5 rounded border border-slate-200 dark:border-slate-700">
                    <span className="font-semibold text-sm text-slate-800 dark:text-slate-100 block">
                      MTC
                    </span>
                    <span className="text-xs text-slate-500">Transportes y Comunicaciones</span>
                  </div>
                </div>
              </div>

              {/* Gobiernos Subnacionales */}
              <div className="bg-slate-50 dark:bg-slate-800/70 p-5 rounded border border-slate-200 dark:border-slate-700">
                <h3 className="text-xs uppercase font-bold tracking-wider text-slate-500 dark:text-slate-400 mb-4 pb-2 border-b border-slate-200 dark:border-slate-700">
                  Gobiernos Subnacionales
                </h3>
                <div className="space-y-3">
                  <div className="bg-white dark:bg-slate-800 p-3 rounded border border-slate-200 dark:border-slate-700">
                    <span className="font-semibold text-sm text-slate-800 dark:text-slate-100 block">
                      Gobiernos Regionales
                    </span>
                    <span className="text-xs text-slate-500 dark:text-slate-400">
                      Unidades Formuladoras y Ejecutoras de Obras
                    </span>
                  </div>
                  <div className="bg-white dark:bg-slate-800 p-3 rounded border border-slate-200 dark:border-slate-700">
                    <span className="font-semibold text-sm text-slate-800 dark:text-slate-100 block">
                      Municipalidades Provinciales y Distritales
                    </span>
                    <span className="text-xs text-slate-500 dark:text-slate-400">
                      Gestores técnicos e inspectores de obra
                    </span>
                  </div>
                </div>
              </div>

              {/* Expertos y Academia */}
              <div className="bg-slate-50 dark:bg-slate-800/70 p-5 rounded border border-slate-200 dark:border-slate-700">
                <h3 className="text-xs uppercase font-bold tracking-wider text-slate-500 dark:text-slate-400 mb-4 pb-2 border-b border-slate-200 dark:border-slate-700">
                  Expertos y Academia
                </h3>
                <div className="space-y-3">
                  <div className="bg-white dark:bg-slate-800 p-3 rounded border border-slate-200 dark:border-slate-700">
                    <span className="font-semibold text-sm text-slate-800 dark:text-slate-100 block">
                      Especialistas Sectoriales
                    </span>
                    <span className="text-xs text-slate-500 dark:text-slate-400">
                      Formulación, costos, metrados y evaluación técnica
                    </span>
                  </div>
                  <div className="bg-white dark:bg-slate-800 p-3 rounded border border-slate-200 dark:border-slate-700">
                    <span className="font-semibold text-sm text-slate-800 dark:text-slate-100 block">
                      Escuela de Gestión Pública, UP
                    </span>
                    <span className="text-xs text-slate-500 dark:text-slate-400">
                      Organización, facilitación y sistematización
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
        )}

        {/* CALENDARIO DE MESAS */}
        {!isEmbed && (
        <section id="calendario" className="scroll-mt-16 bg-slate-50 dark:bg-[#151b24] py-12 lg:py-16 border-t border-slate-200 dark:border-slate-800">
          <div className="max-w-[1240px] mx-auto px-4 sm:px-6">
            <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
              <div className="flex items-center gap-3">
                <Calendar className="text-slate-700 dark:text-slate-300" size={22} />
                <div>
                  <h2 className="font-display text-2xl sm:text-[28px] font-semibold text-slate-900 dark:text-slate-100">
                    Calendario de Mesas Técnicas
                  </h2>
                  <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
                    Cronograma de sesiones de contraste y validación técnica
                  </p>
                </div>
              </div>

              {/* Status Filter */}
              <div className="flex items-center gap-1 text-xs border border-slate-300 dark:border-slate-700 rounded p-0.5 bg-white dark:bg-slate-800">
                <button
                  onClick={() => setCalendarFilter("all")}
                  className={`px-3 py-1 rounded transition-colors ${
                    calendarFilter === "all"
                      ? "bg-slate-900 text-white dark:bg-white dark:text-slate-900 font-semibold"
                      : "text-slate-600 dark:text-slate-400"
                  }`}
                >
                  Todas
                </button>
                <button
                  onClick={() => setCalendarFilter("confirmed")}
                  className={`px-3 py-1 rounded transition-colors ${
                    calendarFilter === "confirmed"
                      ? "bg-slate-900 text-white dark:bg-white dark:text-slate-900 font-semibold"
                      : "text-slate-600 dark:text-slate-400"
                  }`}
                >
                  Confirmadas
                </button>
                <button
                  onClick={() => setCalendarFilter("pending")}
                  className={`px-3 py-1 rounded transition-colors ${
                    calendarFilter === "pending"
                      ? "bg-slate-900 text-white dark:bg-white dark:text-slate-900 font-semibold"
                      : "text-slate-600 dark:text-slate-400"
                  }`}
                >
                  Por confirmar
                </button>
              </div>
            </div>

            <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded divide-y divide-slate-200 dark:divide-slate-700">
              {filteredMesas.map((m) => {
                const dateObj = m.fecha ? new Date(`${m.fecha}T12:00:00`) : null;
                return (
                  <div
                    key={m.id}
                    className="p-5 sm:p-6 grid grid-cols-1 md:grid-cols-12 gap-4 sm:gap-6 items-center hover:bg-slate-50/70 dark:hover:bg-slate-700/30 transition-colors"
                  >
                    <div className="md:col-span-3">
                      {dateObj ? (
                        <div className="flex items-center gap-3">
                          <div className="text-3xl font-bold font-mono text-slate-900 dark:text-slate-100">
                            {dateObj.getDate().toString().padStart(2, "0")}
                          </div>
                          <div className="text-xs text-slate-500 uppercase leading-tight font-medium">
                            <span className="block font-semibold text-slate-700 dark:text-slate-300">
                              {dateObj.toLocaleDateString("es-PE", { month: "long" })} {dateObj.getFullYear()}
                            </span>
                            <span>{dateObj.toLocaleDateString("es-PE", { weekday: "long" })}</span>
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-center gap-3">
                          <div className="text-xl font-bold text-slate-400 dark:text-slate-500">
                            TBD
                          </div>
                          <div className="text-xs text-slate-500 uppercase leading-tight">
                            <span>Fecha por</span>
                            <span className="block font-semibold">confirmar</span>
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="md:col-span-7">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-bold text-base text-slate-900 dark:text-slate-100">
                          {m.sector}
                        </h3>
                        <span
                          className={`text-[11px] font-semibold px-2 py-0.5 rounded ${
                            m.ok
                              ? "bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300"
                              : "bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300"
                          }`}
                        >
                          {m.ok ? "Confirmada" : "En coordinación"}
                        </span>
                      </div>
                      <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed mb-2">
                        {m.detalle}
                      </p>
                      {m.lugar && (
                        <div className="text-xs text-slate-500 flex items-center gap-2">
                          <span>📍 {m.lugar}</span>
                          {m.horario && <span>· ⏰ {m.horario}</span>}
                        </div>
                      )}
                    </div>

                    <div className="md:col-span-2 text-right">
                      <a
                        href="#contacto"
                        className="inline-block text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline"
                      >
                        Consultar detalles →
                      </a>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>
        )}

        {/* INSERTAR EN TU SITIO (RF-09/RF-10, RNF-10) */}
        {!isEmbed && (
        <section id="insertar" className="scroll-mt-16 py-12 lg:py-16 border-t border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-[#141a23]">
          <div className="max-w-[1240px] mx-auto px-4 sm:px-6">
            <div className="flex items-center gap-3 mb-2">
              <Code2 className="text-slate-700 dark:text-slate-300" size={22} />
              <h2 className="font-display text-2xl sm:text-[28px] font-semibold text-slate-900 dark:text-slate-100">
                Insertar en tu sitio
              </h2>
            </div>
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-8 max-w-3xl">
              Para la persona responsable del sitio web de tu institución: copia uno de estos dos bloques de código y pégalo donde quieras que aparezca el checklist. No hace falta programar nada más.
            </p>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              <div className="lg:col-span-4 space-y-5">
                <div>
                  <span className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">
                    Modo de inserción
                  </span>
                  <div className="flex items-center border border-slate-300 dark:border-slate-700 rounded overflow-hidden w-fit">
                    <button
                      onClick={() => setEmbedMode("iframe")}
                      className={`px-3 py-1.5 text-xs font-medium cursor-pointer ${
                        embedMode === "iframe"
                          ? "bg-slate-200 dark:bg-slate-700 text-slate-900 dark:text-white font-semibold"
                          : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                      }`}
                    >
                      iframe
                    </button>
                    <button
                      onClick={() => setEmbedMode("script")}
                      className={`px-3 py-1.5 text-xs font-medium cursor-pointer ${
                        embedMode === "script"
                          ? "bg-slate-200 dark:bg-slate-700 text-slate-900 dark:text-white font-semibold"
                          : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                      }`}
                    >
                      script
                    </button>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 leading-relaxed">
                    {embedMode === "iframe"
                      ? "La opción más simple: funciona en cualquier sitio, incluso si quien lo administra no es programador."
                      : "Se ve más integrado con el diseño del sitio anfitrión, pero requiere poder pegar una etiqueta <script>."}
                  </p>
                </div>

                <div>
                  <span className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">
                    Filtrar a un solo sector (opcional)
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {["", "MINSA", "MINEDU", "MVCS", "MTC"].map((s) => (
                      <button
                        key={s || "todos"}
                        onClick={() => setEmbedSector(s)}
                        className={`text-xs px-3 py-1.5 rounded-full border transition-all cursor-pointer font-medium ${
                          embedSector === s
                            ? "bg-slate-200 dark:bg-slate-700 border-slate-400 dark:border-slate-500 text-slate-900 dark:text-white"
                            : "bg-transparent border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400"
                        }`}
                      >
                        {s || "Todos"}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <span className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">
                    Estilo
                  </span>
                  {embedMode === "iframe" ? (
                    <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed italic">
                      El modo iframe no puede adaptar colores del sitio anfitrión — es una página aparte, con su propio origen, y solo responde al tema claro/oscuro del sistema. Para adaptar colores, elige el modo script.
                    </p>
                  ) : (
                    <>
                      <div className="flex flex-wrap gap-1.5 mb-3">
                        {(["default", "heredado", "personalizado"] as const).map((s) => (
                          <button
                            key={s}
                            onClick={() => setEmbedStyle(s)}
                            className={`text-xs px-3 py-1.5 rounded-full border transition-all cursor-pointer font-medium ${
                              embedStyle === s
                                ? "bg-slate-200 dark:bg-slate-700 border-slate-400 dark:border-slate-500 text-slate-900 dark:text-white"
                                : "bg-transparent border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400"
                            }`}
                          >
                            {s === "default" ? "Por defecto" : s === "heredado" ? "Heredado" : "Personalizado"}
                          </button>
                        ))}
                      </div>

                      {embedStyle === "heredado" && (
                        <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                          Toma la tipografía y el color de texto/fondo del sitio anfitrión automáticamente. Si el contraste no es legible, vuelve solo al estilo por defecto — no hace falta configurar nada más.
                        </p>
                      )}

                      {embedStyle === "personalizado" && (
                        <div className="space-y-2.5">
                          <div className="grid grid-cols-3 gap-2">
                            <label className="text-[11px] text-slate-500 dark:text-slate-400 flex flex-col gap-1">
                              Principal
                              <input
                                type="color"
                                value={embedColorPrimary}
                                onChange={(e) => setEmbedColorPrimary(e.target.value)}
                                className="h-8 w-full rounded border border-slate-300 dark:border-slate-600 cursor-pointer bg-transparent"
                              />
                            </label>
                            <label className="text-[11px] text-slate-500 dark:text-slate-400 flex flex-col gap-1">
                              Texto
                              <input
                                type="color"
                                value={embedColorText}
                                onChange={(e) => setEmbedColorText(e.target.value)}
                                className="h-8 w-full rounded border border-slate-300 dark:border-slate-600 cursor-pointer bg-transparent"
                              />
                            </label>
                            <label className="text-[11px] text-slate-500 dark:text-slate-400 flex flex-col gap-1">
                              Fondo
                              <input
                                type="color"
                                value={embedColorBg}
                                onChange={(e) => setEmbedColorBg(e.target.value)}
                                className="h-8 w-full rounded border border-slate-300 dark:border-slate-600 cursor-pointer bg-transparent"
                              />
                            </label>
                          </div>
                          <input
                            type="text"
                            value={embedFont}
                            onChange={(e) => setEmbedFont(e.target.value)}
                            placeholder="Tipografía CSS (opcional), ej. Georgia, serif"
                            className="w-full text-xs px-2.5 py-1.5 border border-slate-300 dark:border-slate-600 rounded bg-white dark:bg-slate-900 text-slate-900 dark:text-white placeholder-slate-400"
                          />
                          <input
                            type="text"
                            value={embedRadius}
                            onChange={(e) => setEmbedRadius(e.target.value)}
                            placeholder="Radio de bordes, ej. 4px"
                            className="w-full text-xs px-2.5 py-1.5 border border-slate-300 dark:border-slate-600 rounded bg-white dark:bg-slate-900 text-slate-900 dark:text-white placeholder-slate-400"
                          />
                          <p className="text-[11px] text-slate-400 leading-relaxed">
                            El par texto/fondo también pasa por el chequeo de contraste — si no es legible, el widget ignora estos colores y usa el estilo por defecto.
                          </p>
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>

              <div className="lg:col-span-8">
                <div className="relative bg-[#121821] border border-slate-700 rounded shadow-xs overflow-hidden">
                  <div className="flex items-center justify-between px-4 py-2 border-b border-slate-700 bg-[#1a2332]">
                    <span className="text-[11px] font-mono text-slate-400">
                      {embedMode === "iframe" ? "iframe-embed.html" : "widget-embed.html"}
                    </span>
                    <button
                      onClick={() => copyToClipboard(embedSnippet, "embed-snippet")}
                      className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-300 hover:text-white cursor-pointer"
                    >
                      {copiedId === "embed-snippet" ? (
                        <>
                          <Check size={13} /> Copiado
                        </>
                      ) : (
                        <>
                          <Copy size={13} /> Copiar código
                        </>
                      )}
                    </button>
                  </div>
                  <pre className="p-4 text-[12px] leading-relaxed text-slate-200 overflow-x-auto custom-scroll">
                    <code>{embedSnippet}</code>
                  </pre>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-3 leading-relaxed">
                  {embedMode === "iframe"
                    ? "Pega el bloque completo (el iframe y el script de abajo) donde quieras que se vea el checklist. El script hace que el recuadro ajuste su alto solo, sin dejar espacio en blanco ni barras de scroll internas."
                    : "Pega la línea del <script> una sola vez en tu sitio (por ejemplo, antes de cerrar </body>), y la etiqueta <checklist-expedientes> donde quieras que aparezca — puedes repetirla varias veces en distintas páginas."}
                </p>
              </div>
            </div>
          </div>
        </section>
        )}

        {/* RF-15/RF-18: marca mínima fija y enlace a la página completa, visibles aun en modo embed */}
        {isEmbed && (
          <div className="max-w-[1240px] mx-auto px-4 sm:px-6 pb-4 pt-2 flex items-center justify-between gap-3 text-[11px] text-slate-500 dark:text-slate-400 border-t border-slate-200 dark:border-slate-800">
            <span>Fuente: Observatorio de Criterios Técnicos · Universidad del Pacífico · DGPMI-MEF</span>
            <a
              href={window.location.pathname}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 dark:text-blue-400 hover:underline whitespace-nowrap shrink-0"
            >
              Ver página completa ↗
            </a>
          </div>
        )}
      </main>

      {/* FOOTER */}
      {!isEmbed && (
      <footer id="contacto" className="bg-[#1a2332] text-slate-300 pt-12 pb-8 border-t border-slate-800">
        <div className="max-w-[1240px] mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-8 mb-8">
            <div className="md:col-span-6">
              <img
                src={withBase("/logos/pacifico-egp-up.png")}
                alt="Universidad del Pacífico - Escuela de Gestión Pública"
                className="h-10 w-auto object-contain mb-3 drop-shadow-xs"
              />
              <p className="text-sm text-slate-300/90 leading-relaxed mb-3">
                Responsable del espacio académico y punto de contacto para consultas sobre las mesas de trabajo técnico y los criterios sistematizados.
              </p>
              <div className="flex items-center gap-4 text-xs font-medium">
                <a
                  href="https://www.up.edu.pe/egp/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-400 hover:text-blue-300 flex items-center gap-1 no-underline"
                >
                  up.edu.pe/egp <ExternalLink size={12} />
                </a>
                <span>·</span>
                <span className="text-slate-400">Lima, Perú</span>
              </div>
            </div>

            <div className="md:col-span-6">
              <h4 className="text-white font-bold text-sm mb-3">
                Instituciones que apoyan esta iniciativa
              </h4>
              <div className="flex flex-wrap items-center gap-3">
                {SPONSORS.map((sp) => (
                  <div
                    key={sp.id}
                    className="bg-white rounded px-3 py-1.5 h-[52px] flex items-center justify-center shadow-xs border border-white/30 overflow-hidden"
                    title={sp.name}
                  >
                    <img
                      src={sp.imageSrc || withBase(`/logos/${sp.id}.png`)}
                      alt={sp.name}
                      className="max-h-[38px] max-w-full object-contain mx-auto"
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="pt-6 border-t border-slate-700/60 text-xs text-slate-400 flex flex-col sm:flex-row items-center justify-between gap-3">
            <p className="m-0">
              Criterios técnicos sistematizados a partir de la normativa vigente a octubre de 2026. Ante cualquier discrepancia prevalece la norma oficial de la República del Perú.
            </p>
            <p className="m-0 shrink-0">
              Universidad del Pacífico · EGP © 2026
            </p>
          </div>
        </div>
      </footer>
      )}
    </div>
  );
}
