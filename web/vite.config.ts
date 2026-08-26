import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// Dev server proxies the API (and its WebSocket streams) to the FastAPI backend,
// so the SPA can talk to a same-origin `/api` prefix in development.
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      "/api": {
        target: "http://127.0.0.1:8000",
        changeOrigin: true,
        ws: true,
      },
    },
  },
});
