import { defineConfig } from "vite";

// base "./" so the built dist/ works when opened from any static host
// (GitHub Pages, file server, artifact preview, etc.)
export default defineConfig({
  base: "./",
  build: {
    target: "es2020",
    outDir: "dist",
    assetsInlineLimit: 0,
    chunkSizeWarningLimit: 1600,
  },
});
