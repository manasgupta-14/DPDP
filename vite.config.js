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
    // React + router alag chunk me: browser cache me rehte hain, har release par dobara download nahi hote
    rollupOptions: {
      output: {
        manualChunks: {
          react: ["react", "react-dom", "react-router-dom"],
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
