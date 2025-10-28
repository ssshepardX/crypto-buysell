import { defineConfig } from "vite";
import dyadComponentTagger from "@dyad-sh/react-vite-component-tagger";
import react from "@vitejs/plugin-react-swc";
import path from "path";

export default defineConfig(() => ({
  // Uygulamanın sunucudaki alt dizin yolunu belirtiyoruz.
  // Bu, varlıkların doğru yüklenmesini garanti altına alacaktır.
  base: '/shepardsignals/', 
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