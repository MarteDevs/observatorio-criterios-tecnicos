import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

// BASE_PATH solo hace falta si el sitio se publica en un "project page" de
// GitHub Pages (https://usuario.github.io/nombre-del-repo/). Si en algún
// momento se usa un dominio propio o un "user/org page" (raíz), déjalo sin
// definir y se sirve desde "/" como hoy en local.
const basePath = process.env.BASE_PATH || "/";

export default defineConfig({
  base: basePath,
  plugins: [react(), tailwindcss()]
});
