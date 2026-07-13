import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

// @ts-expect-error process is a nodejs global
const host = process.env.TAURI_DEV_HOST;

// https://vite.dev/config/
export default defineConfig(async () => ({
  plugins: [react(), tailwindcss()],

  // Opções do Vite ajustadas para o desenvolvimento com Tauri
  //
  // 1. impede o Vite de esconder erros do Rust
  clearScreen: false,
  // 2. o Tauri espera uma porta fixa; falha se ela não estiver disponível
  server: {
    port: 1420,
    strictPort: true,
    host: host || false,
    hmr: host
      ? {
          protocol: "ws",
          host,
          port: 1421,
        }
      : undefined,
    watch: {
      // 3. não observar `src-tauri`
      ignored: ["**/src-tauri/**"],
    },
  },
}));
