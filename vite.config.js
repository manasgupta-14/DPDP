import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],
  server: {
    // Dev mein browser /api/... call karta hai, Vite use .NET backend ko forward karta hai.
    // Isse CORS aur self-signed HTTPS certificate dono ka issue nahi aata.
    proxy: {
      "/api": {
        target: "https://localhost:7139",
        changeOrigin: true,
        secure: false,
      },
    },
  },
});
