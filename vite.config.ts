import { defineConfig } from "vite";
import dyadComponentTagger from "@dyad-sh/react-vite-component-tagger";
import react from "@vitejs/plugin-react-swc";
import path from "path";

export default defineConfig(() => ({
  // GitHub Pages'teki alt dizin yolunu mutlak olarak belirtiyoruz.
  // Bu, varlıkların doğru yüklenmesini garanti altına alacaktır.
  base: '/crypto-buysell/', 
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