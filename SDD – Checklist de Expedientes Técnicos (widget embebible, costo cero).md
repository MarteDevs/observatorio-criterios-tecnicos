# SDD – Checklist de Expedientes Técnicos (widget embebible, costo cero)

Oct 29, 2026 · @Marte

## 1. Resumen y contexto

Se publicará la matriz de criterios validados para la aprobación de expedientes técnicos en una web gratuita, administrable por personal no técnico e insertable (embebible) en cualquier sitio institucional. Costo recurrente objetivo: **S/ 0**.

**Cliente:** Basel Institute on Governance – Programa GFP Subnacional (SECO), en alianza con Universidad del Pacífico e InvierteLab.

**Problema:** no existe un criterio técnico-normativo único y público que indique a evaluadores de OPMI y oficinas de infraestructura municipal qué revisar antes de aprobar un expediente técnico.

**Solución:** tres piezas conectadas — Google Sheets (base de datos), AppSheet (panel de administración) y GitHub Pages (página pública y widget).

### Alcance

- Base de datos estructurada a partir de la matriz validada (4 sectores: MINSA, MINEDU, MVCS, MTC).
- Panel de administración para agregar, corregir y eliminar criterios.
- Página pública con filtros por sector y servicio, buscador y diseño responsive.
- Widget en dos modos (iframe y script) con estilos por defecto, heredado y personalizado.
- Guía para responsables web, manual de actualización, capacitación y transferencia de accesos.

### Fuera de alcance

- Elaborar o validar el contenido de la matriz (lo entrega el servicio de sistematización).
- Habilitar la inserción en cada sitio externo (responsabilidad de su responsable web).
- Configurar DNS o subdominios institucionales (lo hace TI de la institución propietaria).
- Hosting, dominios o servicios de pago.

### Interesados

| Rol | Quién | Responsabilidad |
| --- | --- | --- |
| Supervisión y conformidad | Director del Programa GFP Subnacional | Aprueba el entregable |
| Instituciones socias | UP, InvierteLab, GFP (SECO) | Entregan look & feel, definen propietario y administradores |
| Administradores (co-owners) | 2–3 personas designadas | Mantienen los criterios actualizados |
| Responsables web | Web de la cooperación + sitios adicionales | Insertan el widget y habilitan pruebas |
| Consultor | Marco Rodrigo Polo Silva | Desarrollo, pruebas, documentación y transferencia |

## 2. Requisitos

Cada requisito tiene un ID para trazarlo a pruebas y entregables. Prioridad: **M** = obligatorio por TDR, **S** = recomendado.

### Funcionales

| ID | Requisito | Prioridad | Origen TDR |
| --- | --- | --- | --- |
| RF-01 | Base de datos con una fila por criterio, código único, sector y servicio con listas desplegables, encabezado protegido | M | Sec. IV |
| RF-02 | Panel de admin para agregar, corregir y eliminar criterios, solo para administradores designados | M | Sec. III, IV |
| RF-03 | Alternativa de edición directa protegida en Google Sheets si AppSheet no es gratuito | M | Sec. IV |
| RF-04 | Página pública con filtros por sector y servicio, y buscador de texto | M | Sec. III, IV |
| RF-05 | Diseño responsive (computadora y celular) | M | Sec. IV |
| RF-06 | Versión sin encabezado para insertar | M | Sec. IV |
| RF-07 | Filtrar un solo sector desde la URL (ej. `?sector=MINSA`) | M | Sec. IV |
| RF-08 | Enlaces externos abren en pestaña nueva | M | Sec. IV |
| RF-09 | Modo de inserción iframe con ajuste de altura | M | Sec. III, IV |
| RF-10 | Modo de inserción script (web component) | M | Sec. III, IV |
| RF-11 | Estilo por defecto en un CSS con variables | M | Sec. III |
| RF-12 | Estilo heredado (solo script): toma tipografía y colores del sitio; si no es legible, vuelve al defecto | M | Sec. III |
| RF-13 | Estilo personalizado por lista cerrada: color principal, texto, fondo, tipografía, bordes, encabezado | M | Sec. III |
| RF-14 | Verificación de contraste texto/fondo con retorno al estilo por defecto | M | Sec. III |
| RF-15 | Marca mínima fija (logos, pie de fuente) no ocultable | M | Sec. III |
| RF-16 | No se permite cargar hojas de estilo externas arbitrarias | M | Sec. III |
| RF-17 | Publicar en lectura solo la pestaña de criterios | M | Sec. IV |
| RF-18 | Enlace directo a la página como último recurso | S | Consideraciones |
| RF-19 | Fecha de última actualización visible en la página | S | Buena práctica |

### No funcionales

| ID | Requisito | Meta |
| --- | --- | --- |
| RNF-01 | Costo recurrente | S/ 0 (Sheets, GitHub Pages; AppSheet solo en plan gratuito o Workspace existente) |
| RNF-02 | Actualización | Cambio visible en la página en ≤ 5–10 min, sin intervención técnica |
| RNF-03 | Propiedad | Todos los componentes en cuentas de la institución propietaria; el consultor no retiene nada |
| RNF-04 | Compatibilidad hacia adelante | Opciones con nombres estables y versionado semántico |
| RNF-05 | Accesibilidad | Contraste WCAG 2.1 AA (4.5:1 texto normal), navegable con teclado |
| RNF-06 | Rendimiento | Carga inicial < 2 s en 4G con \~500 criterios; script del widget < 30 KB |
| RNF-07 | Navegadores | Últimas 2 versiones de Chrome, Edge, Firefox, Safari; Android e iOS |
| RNF-08 | Disponibilidad | Si falla la lectura de datos, mostrar mensaje claro y última copia en caché |
| RNF-09 | Seguridad | Sin credenciales en el código público; solo lectura en la pestaña publicada |
| RNF-10 | Documentación | Guías comprensibles para usuarios no técnicos |

## 4. Modelo de datos (Google Sheets)

Un solo archivo de Google Sheets con pestañas separadas: solo `criterios` se publica; todo lo demás queda privado. Las columnas definitivas se ajustan a la matriz que entregue el servicio de sistematización.

### Pestañas

| Pestaña | Publicada | Uso |
| --- | --- | --- |
| `criterios` | Sí (solo lectura, CSV) | Datos que lee la página pública |
| `catalogos` | No | Listas de sectores, servicios, estados y tipos de norma para los desplegables |
| `notas_internas` | No | Comentarios y pendientes de los administradores |
| `config` | No | Versión de datos, fecha de corte, textos de la página |
| `log_cambios` | No | Registro automático de quién cambió qué (AppSheet o Apps Script) |

### Columnas de `criterios`

| Columna | Tipo | Validación | Ejemplo |
| --- | --- | --- | --- |
| `codigo` | Texto | Único, formato `SECTOR-SERV-###` | `MVCS-AGUA-012` |
| `sector` | Lista | De `catalogos` | MVCS |
| `servicio` | Lista dependiente | Filtrada por sector | Creación de agua potable y saneamiento |
| `tipologia` | Lista | Creación / Ampliación / Mejoramiento / Rehabilitación | Creación |
| `componente` | Texto corto | Obligatorio | Estudios básicos |
| `criterio` | Texto largo | Obligatorio, ≤ 600 caracteres | El expediente incluye estudio de mecánica de suelos firmado |
| `base_normativa` | Texto | Obligatorio | Norma, artículo o numeral |
| `enlace_norma` | URL | Debe empezar con `https://` | Enlace a la norma oficial |
| `orden` | Número | Entero ≥ 1 | 12 |
| `estado` | Lista | Vigente / Retirado | Vigente |
| `actualizado_el` | Fecha | Automática | 2026-11-20 |

### Reglas

- Encabezado (fila 1) protegido; solo administradores pueden editar el rango de datos.
- Nunca se borra una fila: se marca `estado = Retirado` (la página solo muestra *Vigente*). Así se preserva la trazabilidad y los códigos no se reutilizan.
- No renombrar ni reordenar columnas sin actualizar la versión del widget (la página lee por nombre de columna, no por posición).
- Todo lo que esté en `criterios` es público: nada de datos personales ni notas internas ahí.
- Historial de versiones de Google activo para restaurar ante errores.

## 5. Panel de administración (costo cero)

Se propone una estrategia escalonada: el panel nunca obliga a pagar, porque la página pública no depende de él. Si AppSheet deja de ser gratuito, se cambia al nivel siguiente sin tocar la web.

### Opciones evaluadas

| Nivel | Herramienta | Costo | Cuándo usarla | Riesgo |
| --- | --- | --- | --- | --- |
| 1 (preferida) | AppSheet incluido en Google Workspace de la institución propietaria | S/ 0 si ya tienen Workspace con AppSheet | La institución ya paga Workspace | Depende del plan contratado por la institución |
| 2 | AppSheet en plan gratuito (app sin desplegar, pocos usuarios) | S/ 0 | 2–3 administradores, sin Workspace | Límites y condiciones del plan gratuito pueden cambiar |
| 3 (respaldo garantizado) | Google Sheets con rangos protegidos + validación + menú Apps Script | S/ 0 siempre | Si 1 y 2 no son viables | Menos amigable que un formulario |

Las condiciones de AppSheet deben verificarse con la cuenta real de la institución al iniciar; este documento no asume precios ni límites concretos.

### Funciones del panel (cualquier nivel)

- **Agregar criterio:** formulario con sector → servicio dependiente, tipología, criterio, base normativa y enlace. El código se genera automáticamente.
- **Editar criterio:** búsqueda por código o texto; edición con las mismas validaciones.
- **Retirar criterio:** cambia estado a *Retirado* (no borra la fila).
- **Vista previa:** enlace directo a la página pública para verificar el cambio.
- **Registro de cambios:** quién, cuándo y qué cambió, en `log_cambios`.

### Respaldo en Sheets (nivel 3)

- Rangos protegidos: solo los administradores editan el rango de datos; encabezado bloqueado para todos.
- Validación de datos con listas desplegables desde `catalogos` y listas dependientes.
- Apps Script (gratuito) con un menú *Checklist* → *Nuevo criterio* que abre un formulario lateral, genera el código y registra el cambio.
- Formato condicional para resaltar campos obligatorios vacíos.

### Permisos

| Rol | Sheet | Panel | GitHub |
| --- | --- | --- | --- |
| Institución propietaria (cuenta genérica) | Propietaria | Propietaria | Owner del repositorio |
| Administradores (2–3) | Editor del rango de datos | Usuarios de la app | Sin acceso (no lo necesitan) |
| Consultor | Editor temporal | Editor temporal | Colaborador temporal; se retira al transferir |
| Público | Lectura de `criterios` publicada | Sin acceso | Lectura de la página |
