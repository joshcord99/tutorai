import { defineConfig } from "vite";

export default defineConfig({
  build: {
    outDir: "dist",
    rollupOptions: {
      input: "src/content.ts",
      output: {
        entryFileNames: "src/[name].js",
        chunkFileNames: "src/[name].js",
        assetFileNames: "src/[name].[ext]",
        format: "iife",
        globals: {
          chrome: "chrome",
        },
      },
    },
  },
});
