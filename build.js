import { build } from "vite";
import { defineConfig } from "vite";
import fs from "fs";
import path from "path";

async function buildExtension() {
  try {
    if (fs.existsSync("dist")) {
      fs.rmSync("dist", { recursive: true });
    }

    console.log("Building extension scripts...");

    // Build content script
    await build(
      defineConfig({
        build: {
          outDir: "dist-temp-content",
          rollupOptions: {
            input: "src/content.ts",
            output: {
              entryFileNames: "content.js",
              format: "iife",
              globals: {
                chrome: "chrome",
              },
            },
          },
        },
      })
    );

    // Build background script
    await build(
      defineConfig({
        build: {
          outDir: "dist-temp-background",
          rollupOptions: {
            input: "src/background.ts",
            output: {
              entryFileNames: "background.js",
              format: "iife",
              globals: {
                chrome: "chrome",
              },
            },
          },
        },
      })
    );

    // Build options script
    await build(
      defineConfig({
        build: {
          outDir: "dist-temp-options",
          rollupOptions: {
            input: "src/components/options.ts",
            output: {
              entryFileNames: "options.js",
              format: "iife",
              globals: {
                chrome: "chrome",
              },
            },
          },
        },
      })
    );

    // Move files to final location
    if (!fs.existsSync("dist/src")) {
      fs.mkdirSync("dist/src", { recursive: true });
    }

    fs.copyFileSync("dist-temp-content/content.js", "dist/src/content.js");
    fs.copyFileSync(
      "dist-temp-background/background.js",
      "dist/src/background.js"
    );
    fs.copyFileSync("dist-temp-options/options.js", "dist/src/options.js");

    // Clean up temp directories
    fs.rmSync("dist-temp-content", { recursive: true, force: true });
    fs.rmSync("dist-temp-background", { recursive: true, force: true });
    fs.rmSync("dist-temp-options", { recursive: true, force: true });

    const contentPath = "dist/src/content.js";
    const backgroundPath = "dist/src/background.js";

    if (!fs.existsSync(contentPath)) {
      throw new Error(`Content script not found at ${contentPath}`);
    }
    if (!fs.existsSync(backgroundPath)) {
      throw new Error(`Background script not found at ${backgroundPath}`);
    }

    console.log("Copying CSS files...");
    const cssFiles = [
      "overlay.css",
      "chat.css",
      "hint.css",
      "solve.css",
      "edge-cases.css",
      "plan.css",
      "loading.css",
      "disclaimer.css",
      "complexity.css",
      "model-change.css",
      "options.css",
    ];

    if (!fs.existsSync("dist/src/css")) {
      fs.mkdirSync("dist/src/css", { recursive: true });
    }

    for (const cssFile of cssFiles) {
      const sourcePath = `src/css/${cssFile}`;
      const destPath = `dist/src/css/${cssFile}`;

      if (fs.existsSync(sourcePath)) {
        fs.copyFileSync(sourcePath, destPath);
        console.log(`Copied: ${cssFile}`);
      } else {
        console.warn(`Warning: CSS file not found: ${sourcePath}`);
      }
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
