import { defineConfig } from "vite";
import dyadComponentTagger from "@dyad-sh/react-vite-component-tagger";
import react from "@vitejs/plugin-react-swc";
import path from "path";

export default defineConfig(({ command }) => ({
  // GitHub Pages'de projenizin yayınlanacağı depo adını buraya yazın.
  // Örneğin, depo adı "kripto-sinyal-projem" ise, base: "/kripto-sinyal-projem/" olmalıdır.
  base: command === 'build' ? '/your-repository-name/' : '/',
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [dyadComponentTagger(), react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));