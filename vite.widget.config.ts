import { defineConfig, loadEnv } from "vite";

// Build separado para el widget embebible (RF-10/RNF-06): sin los plugins de
// React/Tailwind de la app principal, para no arrastrar ese peso al bundle.
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "VITE_");
  return {
    define: {
      "import.meta.env.VITE_CRITERIOS_CSV_URL": JSON.stringify(env.VITE_CRITERIOS_CSV_URL ?? "")
    },
    build: {
      outDir: "dist-widget",
      emptyOutDir: true,
      cssCodeSplit: false,
      minify: "esbuild",
      target: "es2018",
      lib: {
        entry: "src/widget/widget.ts",
        formats: ["iife"],
        name: "ChecklistExpedientesWidget",
        fileName: () => "widget.js"
      }
    }
  };
});
