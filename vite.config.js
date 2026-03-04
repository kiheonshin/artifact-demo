import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { resolve } from "path";
import { copyFileSync, mkdirSync, existsSync } from "fs";

export default defineConfig({
  plugins: [
    react(),
    {
      name: "copy-static-pages",
      closeBundle() {
        // Copy landing page to dist root
        copyFileSync(
          resolve(__dirname, "static/index.html"),
          resolve(__dirname, "dist/index.html")
        );

        // Copy mini-app page
        const miniAppDir = resolve(__dirname, "dist/mini-app");
        if (!existsSync(miniAppDir)) {
          mkdirSync(miniAppDir, { recursive: true });
        }
        copyFileSync(
          resolve(__dirname, "static/mini-app/index.html"),
          resolve(__dirname, "dist/mini-app/index.html")
        );
      },
    },
  ],
  base: "/hotel/",
  build: {
    outDir: "dist/hotel",
  },
});
