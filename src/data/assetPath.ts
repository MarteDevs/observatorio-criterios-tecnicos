// En un GitHub Pages "project page" el sitio no vive en la raíz del dominio
// (ej. /observatorio-criterios-tecnicos/), así que las rutas absolutas tipo
// "/logos/x.png" escritas a mano en JSX no se ajustan solas — a diferencia
// de las que procesa Vite dentro de index.html. BASE_URL sí refleja el
// `base` configurado en vite.config.ts (BASE_PATH en el workflow de deploy).
export function withBase(path: string): string {
  const base = import.meta.env.BASE_URL || "/";
  return base.replace(/\/$/, "") + "/" + path.replace(/^\//, "");
}
