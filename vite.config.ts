import path from "path"
import tailwindcss from "@tailwindcss/vite"
import react from "@vitejs/plugin-react"
import { defineConfig } from "vite"

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  define: {
    "global": "globalThis",
  },
  build: {
    sourcemap: true,
    rollupOptions: {
      output: {
        manualChunks: {
          "google-maps": ["@vis.gl/react-google-maps"],
          "react-vendor": ["react", "react-dom", "react-router-dom"],
          "ui-vendor": ["zustand", "@dnd-kit/core", "@dnd-kit/sortable", "@dnd-kit/utilities"],
          "tiptap": ["@tiptap/react", "@tiptap/starter-kit", "@tiptap/extension-image", "@tiptap/extension-color", "@tiptap/extension-text-style", "@tiptap/extension-text-align", "@tiptap/extension-underline", "@tiptap/extension-placeholder"],
          "dompurify": ["dompurify"],
        },
      },
    },
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      buffer: "buffer/",
    },
  },
  server: {
    open: false,
    proxy: {
      "/api": {
        target: "http://localhost:3001",
        changeOrigin: true,
      },
    },
  },
})
