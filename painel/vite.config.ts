// Painel "Funil ao Vivo" (versão para compartilhar): funciona em qualquer endereço.
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  base: "./",
  plugins: [react()],
});
