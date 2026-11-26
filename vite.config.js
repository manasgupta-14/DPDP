
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { loadEnv } from "vite";

// Local dev only: serves the SAME serverless function (api/translate.js) at /api/translate,
// so "npm run dev" works without the Vercel CLI. Secrets come from .env.local (never VITE_ prefixed).
function translateDevApi() {
  return {
    name: "pg-translate-dev-api",
    apply: "serve",
    configResolved(config) {
      const env = loadEnv(config.mode, config.root, "");
      for (const [k, v] of Object.entries(env)) if (process.env[k] === undefined) process.env[k] = v;
    },
    configureServer(server) {
      server.middlewares.use("/api/translate", async (req, res, next) => {
        try {
          const mod = await server.ssrLoadModule("/api/translate.js");
          await mod.default(req, res);
        } catch (err) {
          next(err);
        }
      });
    },
  };
}

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    translateDevApi(),
  ],

  build: {
    target: "es2020",
    cssCodeSplit: true,

    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes("node_modules")) {
            if (
              id.includes("/react/") ||
              id.includes("/react-dom/") ||
              id.includes("/scheduler/")
            ) {
              return "react-vendor";
            }

            if (
              id.includes("react-router") ||
              id.includes("@remix-run")
            ) {
              return "router-vendor";
            }

            if (id.includes("lucide-react")) {
              return "icons";
            }

            return "vendor";
          }
        },
      },
    },
  },

  server: {
    proxy: {
      "/api": {
        target: "https://localhost:7139",
        changeOrigin: true,
        secure: false,
      },
    },
  },
});
