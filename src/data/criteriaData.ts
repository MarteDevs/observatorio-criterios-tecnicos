export interface Criterion {
  id: string;
  capa: string;
  n: number | string;
  item: string;
  que: string;
  norma: string;
  art: string;
  amb: string;
  obl: "Obligatorio" | "Condicional" | "Recomendado";
  dif: "Sí" | "No";
  enlace_norma?: string;
}

export interface ServiceDefinition {
  key: string;
  label: string;
  sector: string;
  par?: string;
  description?: string;
}

export const SERVICES: ServiceDefinition[] = [
  { key: "eess-c", label: "Construcción de EESS I-3/I-4", sector: "MINSA / PRONIS", par: "eess-m", description: "Establecimientos de Salud nuevos categorías I-3 y I-4 con internamiento y atención especializada." },
  { key: "eess-m", label: "Mejoramiento de EESS I-3/I-4", sector: "MINSA / PRONIS", par: "eess-c", description: "Intervención sobre infraestructura existente, contingencia y evaluación estructural." },
  { key: "ie-m",   label: "Mejoramiento de IE EBR", sector: "MINEDU", description: "Infraestructura educativa de Educación Básica Regular (inicial, primaria y secundaria)." },
  { key: "san-c",  label: "Creación de saneamiento rural", sector: "MVCS", par: "san-a", description: "Sistemas integrales de agua potable y saneamiento rural por primera vez." },
  { key: "san-a",  label: "Ampliación de saneamiento rural", sector: "MVCS", par: "san-c", description: "Ampliación de cobertura y compatibilización con sistemas existentes." },
  { key: "via-m",  label: "Mejoramiento de vías provinciales", sector: "MTC", par: "via-r", description: "Elevación del estándar técnico vial, pavimentación y ampliación geométrica." },
  { key: "via-r",  label: "Rehabilitación de vías provinciales", sector: "MTC", par: "via-m", description: "Recuperación de condiciones y estándar original sin cambio de clasificación." }
];

const T = (id: string, n: number, item: string, que: string, norma: string, art: string, amb: string, obl: "Obligatorio" | "Condicional" | "Recomendado"): Criterion => ({
  id,
  capa: "Marco Transversal",
  n,
  item,
  que,
  norma,
  art,
  amb,
  obl,
  dif: "No"
});

export const TRANSVERSAL_CRITERIA: Criterion[] = [
  T("T-01", 1, "Inversión registrada y vigente en el Banco de Inversiones", "Verificar que la inversión cuente con declaración de viabilidad o aprobación (IOARR) y registro de la fase de Ejecución con el Formato N° 08-A.", "Directiva General del Sistema Nacional de Programación Multianual y Gestión de Inversiones", "Fase de Ejecución; Formato N° 08-A", "GL, GR, GN", "Obligatorio"),
  T("T-02", 2, "Consistencia del expediente con la ficha técnica o estudio de preinversión", "Contrastar alcance, metas físicas, localización y monto. Las modificaciones deben registrarse antes de aprobar el expediente.", "Directiva General del Sistema Nacional de Programación Multianual y Gestión de Inversiones", "Modificaciones en fase de Ejecución", "GL, GR, GN", "Obligatorio"),
  T("T-03", 3, "Contenido mínimo del expediente técnico de obra", "Memoria descriptiva, especificaciones técnicas, planos, metrados, presupuesto, análisis de precios unitarios, cronograma y estudios básicos.", "Ley N° 32069 y su Reglamento DS N° 009-2025-EF", "Disposiciones sobre expediente técnico de obra", "GL, GR, GN", "Obligatorio"),
  T("T-04", 4, "Libre disponibilidad del terreno", "Documento que acredite titularidad, saneamiento físico-legal o derecho de uso sobre el terreno donde se ejecutará la obra.", "Ley N° 32069 y su Reglamento DS N° 009-2025-EF", "Requisitos para convocar la ejecución de obra", "GL, GR, GN", "Obligatorio"),
  T("T-05", 5, "Certificación ambiental según categoría", "Instrumento de gestión ambiental aprobado o constancia de no requerirlo, según la clasificación del proyecto.", "Ley N° 27446, Ley del SEIA, y su reglamento", "Clasificación de proyectos", "GL, GR, GN", "Condicional"),
  T("T-06", 6, "Certificado de Inexistencia de Restos Arqueológicos (CIRA)", "Requerido cuando la obra implica remoción de suelo fuera de áreas ya intervenidas.", "DS N° 003-2014-MC, Reglamento de Intervenciones Arqueológicas", "Supuestos de exigibilidad del CIRA", "GL, GR, GN", "Condicional"),
  T("T-07", 7, "Análisis de riesgo de desastres en el diseño", "Identificación de peligros y medidas de reducción del riesgo incorporadas en el diseño y en el presupuesto.", "Directiva General del Sistema Nacional de Programación Multianual y Gestión de Inversiones; normativa SINAGERD", "Gestión del riesgo en contexto de cambio climático", "GL, GR, GN", "Recomendado")
];

const S = (id: string, capa: string, n: number, item: string, que: string, norma: string, art: string, amb: string, obl: "Obligatorio" | "Condicional" | "Recomendado", dif: "Sí" | "No"): Criterion => ({
  id, capa, n, item, que, norma, art, amb, obl, dif
});

export const INITIAL_DATA: Record<string, Criterion[]> = {
  "eess-c": [
    ...TRANSVERSAL_CRITERIA,
    S("S1-01", "Categorización y Programa Médico-Arquitectónico", 1, "Categoría del establecimiento sustentada", "El expediente debe sustentar la categoría I-3 o I-4 y su pertenencia a la red o microrred, en concordancia con el estudio de preinversión.", "NTS N° 021-MINSA/DGSP-V.03, Categorías de establecimientos del sector salud", "Criterios de categorización del primer nivel", "GL, GR", "Obligatorio", "No"),
    S("S1-02", "Categorización y Programa Médico-Arquitectónico", 2, "Programa médico-arquitectónico completo para nueva infraestructura", "Todas las UPSS y ambientes requeridos para la categoría, con áreas mínimas. Al ser construcción nueva, no hay ambientes existentes que compensen.", "NTS N° 113-MINSA/DGIEM-V.01", "Programa arquitectónico por UPSS", "GL, GR", "Obligatorio", "Sí"),
    S("S1-03", "Terreno y emplazamiento", 3, "Terreno apto para establecimiento de salud", "Área, forma, accesibilidad, pendiente y distancia a fuentes de contaminación conforme a los criterios de selección de terreno.", "NTS N° 113-MINSA/DGIEM-V.01", "Criterios de selección de terreno", "GL, GR", "Obligatorio", "Sí"),
    S("S1-04", "Equipamiento", 4, "Listado de equipamiento por ambiente", "Equipamiento biomédico, electromecánico, mobiliario clínico e informático, con especificaciones y costos.", "NTS N° 113-MINSA/DGIEM-V.01", "Equipamiento por UPSS", "GL, GR", "Obligatorio", "No"),
    S("S1-05", "Instalaciones", 5, "Sistemas de agua, energía y residuos hospitalarios", "Cálculo de dotaciones, reserva de agua, grupo electrógeno y gestión de residuos sólidos.", "Reglamento Nacional de Edificaciones, Norma A.050 Salud", "Instalaciones sanitarias y eléctricas", "GL, GR", "Obligatorio", "No"),
    S("S1-06", "Conformidad sectorial", 6, "Opinión favorable de la DIRESA o GERESA", "Documento de la autoridad sanitaria regional sobre la pertinencia del establecimiento en la red.", "Lineamientos sectoriales MINSA", "Articulación con la red de servicios", "GL, GR", "Recomendado", "No")
  ],
  "eess-m": [
    ...TRANSVERSAL_CRITERIA,
    S("S2-01", "Categorización y Programa Médico-Arquitectónico", 1, "Categoría del establecimiento sustentada", "Sustento de la categoría I-3 o I-4 vigente o de la recategorización prevista con la intervención.", "NTS N° 021-MINSA/DGSP-V.03, Categorías de establecimientos del sector salud", "Criterios de categorización del primer nivel", "GL, GR", "Obligatorio", "No"),
    S("S2-02", "Diagnóstico de infraestructura existente", 2, "Evaluación estructural de la edificación existente", "Informe de vulnerabilidad que determine qué bloques se conservan, refuerzan o demuelen.", "Reglamento Nacional de Edificaciones, Norma E.030 Diseño Sismorresistente", "Edificaciones existentes", "GL, GR", "Obligatorio", "Sí"),
    S("S2-03", "Diagnóstico de infraestructura existente", 3, "Plan de contingencia para la continuidad de la atención", "Cómo y dónde se brindará el servicio durante la obra, con costos incluidos en el presupuesto.", "Lineamientos sectoriales MINSA", "Continuidad operativa", "GL, GR", "Obligatorio", "Sí"),
    S("S2-04", "Equipamiento", 4, "Inventario y estado del equipamiento existente", "Identificar equipos que se reutilizan, reponen o incorporan, evitando duplicidad.", "NTS N° 113-MINSA/DGIEM-V.01", "Equipamiento por UPSS", "GL, GR", "Obligatorio", "No"),
    S("S2-05", "Instalaciones", 5, "Sistemas de agua, energía y residuos hospitalarios", "Compatibilidad de las nuevas instalaciones con las existentes.", "Reglamento Nacional de Edificaciones, Norma A.050 Salud", "Instalaciones sanitarias y eléctricas", "GL, GR", "Obligatorio", "No")
  ],
  "ie-m": [
    ...TRANSVERSAL_CRITERIA,
    S("E1-01", "Diagnóstico del local educativo", 1, "Código de local y registro en el padrón", "Coincidencia del código de local, servicios educativos y matrícula con los registros del sector.", "Normativa MINEDU sobre locales educativos", "Identificación del local", "GL, GR", "Obligatorio", "No"),
    S("E1-02", "Diagnóstico del local educativo", 2, "Evaluación de la infraestructura existente", "Diagnóstico de cada ambiente y pabellón: conservación, reforzamiento o sustitución.", "Reglamento Nacional de Edificaciones, Norma E.030", "Edificaciones existentes", "GL, GR", "Obligatorio", "No"),
    S("E1-03", "Programa arquitectónico", 3, "Ambientes y áreas según nivel educativo", "Aulas, espacios complementarios y servicios higiénicos dimensionados según la matrícula proyectada.", "Criterios Generales de Diseño para Infraestructura Educativa, MINEDU", "Programa arquitectónico", "GL, GR", "Obligatorio", "No"),
    S("E1-04", "Mobiliario y equipamiento", 4, "Mobiliario escolar y equipamiento pedagógico", "Listado por ambiente con especificaciones del sector.", "Normativa MINEDU de mobiliario escolar", "Especificaciones de mobiliario", "GL, GR", "Condicional", "No"),
    S("E1-05", "Accesibilidad", 5, "Accesibilidad para personas con discapacidad", "Rampas, servicios higiénicos accesibles y rutas accesibles dentro del local.", "Reglamento Nacional de Edificaciones, Norma A.120", "Condiciones de accesibilidad", "GL, GR", "Obligatorio", "No")
  ],
  "san-c": [
    ...TRANSVERSAL_CRITERIA,
    S("V1-01", "Opción tecnológica", 1, "Selección de la opción tecnológica de agua y saneamiento", "Sustento de la opción elegida según fuente, topografía, clima y densidad de la población.", "RM N° 192-2018-VIVIENDA, Norma Técnica de Diseño para el ámbito rural", "Selección de opciones tecnológicas", "GL, GR", "Obligatorio", "No"),
    S("V1-02", "Fuente de agua", 2, "Disponibilidad hídrica y calidad de la fuente", "Aforo, análisis de calidad y acreditación de la disponibilidad hídrica ante la ANA para una fuente nueva.", "Normativa ANA y RM N° 192-2018-VIVIENDA", "Estudios de fuente", "GL, GR", "Obligatorio", "Sí"),
    S("V1-03", "Terrenos", 3, "Libre disponibilidad para captación, reservorio y PTAR", "Documentos de disponibilidad de todos los terrenos de componentes nuevos, incluyendo servidumbres.", "Ley N° 32069 y su Reglamento DS N° 009-2025-EF", "Requisitos para convocar la ejecución de obra", "GL, GR", "Obligatorio", "Sí"),
    S("V1-04", "Sostenibilidad", 4, "Organización comunal prestadora (JASS) constituida", "Acta de constitución y compromiso de operación y mantenimiento, con cuota familiar estimada.", "Normativa MVCS sobre prestación en el ámbito rural", "Prestadores de servicios rurales", "GL", "Obligatorio", "Sí"),
    S("V1-05", "Educación sanitaria", 5, "Componente de educación sanitaria", "Plan de educación sanitaria y capacitación a la organización comunal incluido en el presupuesto.", "Lineamientos MVCS", "Intervenciones sociales", "GL", "Recomendado", "No")
  ],
  "san-a": [
    ...TRANSVERSAL_CRITERIA,
    S("V2-01", "Opción tecnológica", 1, "Compatibilidad con el sistema existente", "Diagnóstico del sistema actual y demostración de que la ampliación es compatible hidráulicamente.", "RM N° 192-2018-VIVIENDA, Norma Técnica de Diseño para el ámbito rural", "Evaluación de sistemas existentes", "GL, GR", "Obligatorio", "Sí"),
    S("V2-02", "Fuente de agua", 2, "Capacidad de la fuente para la nueva demanda", "Aforo actualizado que cubra la población actual y la incorporada, sin afectar a los usuarios existentes.", "Normativa ANA y RM N° 192-2018-VIVIENDA", "Estudios de fuente", "GL, GR", "Obligatorio", "No"),
    S("V2-03", "Padrón de beneficiarios", 3, "Padrón de nuevas conexiones", "Listado de viviendas a incorporar, diferenciado de las ya conectadas.", "Lineamientos MVCS", "Determinación de la población beneficiaria", "GL", "Obligatorio", "No"),
    S("V2-04", "Sostenibilidad", 4, "Conformidad del prestador existente", "Acta de la JASS u operador vigente aceptando operar y mantener la ampliación.", "Normativa MVCS sobre prestación en el ámbito rural", "Prestadores de servicios rurales", "GL", "Obligatorio", "Sí")
  ],
  "via-m": [
    ...TRANSVERSAL_CRITERIA,
    S("R1-01", "Estudios de ingeniería", 1, "Estudio de tráfico", "Conteos y proyección del IMDA que sustenten la clasificación de la vía y el tipo de superficie.", "Manual de Carreteras: Diseño Geométrico DG-2018", "Clasificación por demanda", "GL, GR", "Obligatorio", "No"),
    S("R1-02", "Estudios de ingeniería", 2, "Cambio de estándar de la vía sustentado", "Justificación del nuevo estándar (ancho, superficie de rodadura, geometría) frente a la vía existente.", "Manual de Carreteras: Diseño Geométrico DG-2018", "Parámetros de diseño", "GL, GR", "Obligatorio", "Sí"),
    S("R1-03", "Estudios de ingeniería", 3, "Estudio de suelos, canteras y fuentes de agua", "Caracterización de la subrasante, canteras y botaderos con su disponibilidad.", "Manual de Carreteras: Suelos, Geología, Geotecnia y Pavimentos", "Estudios geotécnicos", "GL, GR", "Obligatorio", "No"),
    S("R1-04", "Drenaje", 4, "Estudio hidrológico y diseño de obras de arte", "Cálculo de caudales y diseño de alcantarillas, cunetas y badenes.", "Manual de Hidrología, Hidráulica y Drenaje, MTC", "Obras de drenaje", "GL, GR", "Obligatorio", "No"),
    S("R1-05", "Seguridad vial", 5, "Señalización y dispositivos de seguridad", "Plan de señalización vertical y horizontal según el estándar propuesto.", "Manual de Dispositivos de Control del Tránsito, MTC", "Señalización", "GL, GR", "Condicional", "No")
  ],
  "via-r": [
    ...TRANSVERSAL_CRITERIA,
    S("R2-01", "Estudios de ingeniería", 1, "Diagnóstico del estado de la vía", "Inventario vial y evaluación de la superficie de rodadura y obras de arte existentes.", "Normativa MTC de gestión de la infraestructura vial", "Inventario vial", "GL, GR", "Obligatorio", "Sí"),
    S("R2-02", "Estudios de ingeniería", 2, "Recuperación del estándar original", "Demostrar que la intervención repone las características originales sin cambiar el estándar.", "Manual de Carreteras: Diseño Geométrico DG-2018", "Parámetros de diseño", "GL, GR", "Obligatorio", "Sí"),
    S("R2-03", "Estudios de ingeniería", 3, "Estudio de suelos, canteras y fuentes de agua", "Caracterización de la subrasante, canteras y botaderos con su disponibilidad.", "Manual de Carreteras: Suelos, Geología, Geotecnia y Pavimentos", "Estudios geotécnicos", "GL, GR", "Obligatorio", "No"),
    S("R2-04", "Sostenibilidad", 4, "Compromiso de mantenimiento rutinario", "Responsable y financiamiento del mantenimiento posterior a la rehabilitación.", "Directiva General del Sistema Nacional de Programación Multianual y Gestión de Inversiones", "Fase de Funcionamiento", "GL, GR", "Recomendado", "No")
  ]
};

export interface MesaItem {
  id: string;
  sector: string;
  detalle: string;
  fecha: string | null;
  ok: boolean;
  lugar?: string;
  horario?: string;
}

export const MESAS_DATA: MesaItem[] = [
  {
    id: "mesa-salud",
    sector: "Mesa Salud",
    detalle: "Construcción y mejoramiento de EESS I-3/I-4. Contrastación con equipos de MINSA, PRONIS, Gobiernos Regionales y evaluadores técnicos.",
    fecha: "2026-10-22",
    ok: true,
    lugar: "Instalaciones de la Universidad del Pacífico, Lima",
    horario: "8:00 a 11:30 a.m."
  },
  {
    id: "mesa-educacion",
    sector: "Mesa Educación",
    detalle: "Mejoramiento de IE EBR (inicial, primaria y secundaria). Criterios arquitectónicos, estructurales y pedagógicos.",
    fecha: "2026-10-29",
    ok: true,
    lugar: "Instalaciones de la Universidad del Pacífico, Lima",
    horario: "8:00 a 11:30 a.m."
  },
  {
    id: "mesa-vivienda",
    sector: "Mesa Vivienda y Saneamiento",
    detalle: "Creación y ampliación de saneamiento rural. Opciones tecnológicas, fuentes de agua, sostenibilidad y JASS.",
    fecha: null,
    ok: false,
    lugar: "Instalaciones de la Universidad del Pacífico, Lima",
    horario: "Por definir"
  },
  {
    id: "mesa-transportes",
    sector: "Mesa Transportes",
    detalle: "Mejoramiento y rehabilitación de vías provinciales. Estudios de tráfico, suelos, geotecnia, obras de arte y mantenimiento.",
    fecha: null,
    ok: false,
    lugar: "Instalaciones de la Universidad del Pacífico, Lima",
    horario: "Por definir"
  }
];
