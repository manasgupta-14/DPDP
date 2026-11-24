
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
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
        target: "https://vmxzrz2w-7139.inc1.devtunnels.ms",
        changeOrigin: true,
        secure: false,
      },
    },
  },
});
