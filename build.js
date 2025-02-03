import { build } from "vite";
import { defineConfig } from "vite";
import fs from "fs";

async function buildExtension() {
  try {

    if (fs.existsSync("dist")) {
      fs.rmSync("dist", { recursive: true });
    }

    console.log("Building extension scripts...");
    await build(
      defineConfig({
        build: {
          outDir: "dist",
          rollupOptions: {
            input: {
              content: "src/content.ts",
              background: "src/background.ts",
            },
            output: {
              entryFileNames: "src/[name].js",
              chunkFileNames: "src/[name].js",
              assetFileNames: "src/[name].[ext]",
              format: "es",
              globals: {
                chrome: "chrome",
              },
            },
          },
        },
      })
    );

    // Verify files exist
    const contentPath = "dist/src/content.js";
    const backgroundPath = "dist/src/background.js";

    if (!fs.existsSync(contentPath)) {
      throw new Error(`Content script not found at ${contentPath}`);
    }
    if (!fs.existsSync(backgroundPath)) {
      throw new Error(`Background script not found at ${backgroundPath}`);
    }

    console.log("Extension built successfully!");
    console.log(`Content script: ${contentPath}`);
    console.log(`Background script: ${backgroundPath}`);
  } catch (error) {
    console.error("Build failed:", error);
    process.exit(1);
  }
}

buildExtension();
