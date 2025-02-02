import { build } from "vite";
import { defineConfig } from "vite";

const config = defineConfig({
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

async function buildExtension() {
  try {
    await build(config);
    console.log("Extension built successfully!");
  } catch (error) {
    console.error("Build failed:", error);
    process.exit(1);
  }
}

buildExtension();
